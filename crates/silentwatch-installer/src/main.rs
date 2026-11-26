#![cfg_attr(all(windows, not(debug_assertions)), windows_subsystem = "windows")]

use flate2::read::GzDecoder;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{self, Read};
#[cfg(windows)]
use std::path::Path;
use std::path::PathBuf;

/// Embedded gzip-compressed `silentwatch-desktop.exe` binary populated by CI before building the setup EXE.
const PAYLOAD_GZ: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/silentwatch-desktop.exe.gz"));

#[cfg(windows)]
const INSTALLER_HTML: &str = include_str!("../ui/index.html");

#[derive(Debug, Clone, Deserialize)]
pub struct InstallOptions {
    pub install_dir: String,
    pub create_desktop_shortcut: bool,
    pub launch_after: bool,
    pub hide_to_tray: bool,
}

#[derive(Debug, Clone, Serialize)]
struct InstallerPrefs {
    close_behavior: String,
    privilege_mode: String,
    show_release_video: bool,
}

pub fn default_install_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from(r"C:\Program Files"))
        .join("SilentWatch")
}

/// Extracts the embedded gzipped SilentWatch binary into `install_dir/SilentWatch.exe`
/// and writes `installer_prefs.json` so the app opens straight to the dashboard.
pub fn extract_payload_and_configure(
    opts: &InstallOptions,
    mut on_progress: impl FnMut(u8, &str),
) -> io::Result<PathBuf> {
    let target_dir = PathBuf::from(&opts.install_dir);
    on_progress(15, "Creating installation directory...");
    fs::create_dir_all(&target_dir)?;

    on_progress(40, "Extracting SilentWatch.exe...");
    let exe_path = target_dir.join("SilentWatch.exe");
    let mut decoder = GzDecoder::new(PAYLOAD_GZ);
    let mut out_file = File::create(&exe_path)?;
    io::copy(&mut decoder, &mut out_file)?;

    on_progress(68, "Writing SilentWatch preferences...");
    let data_dir = dirs::data_local_dir()
        .unwrap_or_else(|| target_dir.clone())
        .join("SilentWatch");
    fs::create_dir_all(&data_dir)?;
    let prefs = InstallerPrefs {
        close_behavior: if opts.hide_to_tray {
            "hide_to_tray".into()
        } else {
            "quit".into()
        },
        privilege_mode: "standard_per_user".into(),
        show_release_video: true,
    };
    let prefs_json = serde_json::to_string_pretty(&prefs).map_err(io::Error::other)?;
    fs::write(data_dir.join("installer_prefs.json"), prefs_json)?;

    on_progress(85, "Creating Windows shortcuts & registration...");
    #[cfg(windows)]
    {
        let _ = create_windows_shortcuts(&exe_path, opts.create_desktop_shortcut);
        let _ = register_windows_uninstall(&target_dir, &exe_path);
    }

    on_progress(100, "SilentWatch installation complete.");
    Ok(exe_path)
}

#[cfg(windows)]
fn create_windows_shortcuts(exe_path: &Path, create_desktop: bool) -> io::Result<()> {
    use std::os::windows::process::CommandExt;
    use std::process::Command;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let exe_str = exe_path.display().to_string().replace('\'', "''");
    let work_dir = exe_path
        .parent()
        .map(|p| p.display().to_string().replace('\'', "''"))
        .unwrap_or_default();

    let mut script = format!(
        "$ws = New-Object -ComObject WScript.Shell; \
         $sm = [Environment]::GetFolderPath('Programs'); \
         $lnk = $ws.CreateShortcut((Join-Path $sm 'SilentWatch.lnk')); \
         $lnk.TargetPath = '{exe_str}'; $lnk.WorkingDirectory = '{work_dir}'; $lnk.Save();"
    );

    if create_desktop {
        script.push_str(&format!(
            " $dt = [Environment]::GetFolderPath('Desktop'); \
              $dlnk = $ws.CreateShortcut((Join-Path $dt 'SilentWatch.lnk')); \
              $dlnk.TargetPath = '{exe_str}'; $dlnk.WorkingDirectory = '{work_dir}'; $dlnk.Save();"
        ));
    }

    let _ = Command::new("powershell")
        .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &script])
        .creation_flags(CREATE_NO_WINDOW)
        .status();
    Ok(())
}

#[cfg(windows)]
fn register_windows_uninstall(install_dir: &Path, exe_path: &Path) -> io::Result<()> {
    use std::os::windows::process::CommandExt;
    use std::process::Command;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let key = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SilentWatch";
    let entries = [
        ("DisplayName", "SilentWatch"),
        ("DisplayVersion", env!("CARGO_PKG_VERSION")),
        ("Publisher", "SilentWatch"),
        ("InstallLocation", &install_dir.display().to_string()),
        ("DisplayIcon", &exe_path.display().to_string()),
    ];
    for (name, val) in entries {
        let _ = Command::new("reg")
            .args(["add", key, "/v", name, "/t", "REG_SZ", "/d", val, "/f"])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
    }
    Ok(())
}

#[cfg(windows)]
fn pick_folder_dialog(initial: &str) -> Option<String> {
    use std::os::windows::process::CommandExt;
    use std::process::Command;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let init_esc = initial.replace('\'', "''");
    let ps = format!(
        "Add-Type -AssemblyName System.Windows.Forms; \
         $f = New-Object System.Windows.Forms.FolderBrowserDialog; \
         $f.Description = 'Choose SilentWatch install location'; \
         $f.SelectedPath = '{init_esc}'; \
         if ($f.ShowDialog() -eq 'OK') {{ Write-Output $f.SelectedPath }}"
    );
    let out = Command::new("powershell")
        .args(["-NoProfile", "-STA", "-Command", &ps])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;
    let picked = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if picked.is_empty() {
        None
    } else {
        Some(picked)
    }
}

#[cfg(windows)]
fn main() {
    use std::process::Command;
    use tao::dpi::LogicalSize;
    use tao::event::{Event, WindowEvent};
    use tao::event_loop::{ControlFlow, EventLoopBuilder};
    use tao::window::WindowBuilder;
    use wry::WebViewBuilder;

    #[derive(Debug)]
    enum UserEvent {
        Ipc(String),
        EvalJs(String),
        Exit,
    }

    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    let proxy = event_loop.create_proxy();

    let window = WindowBuilder::new()
        .with_title("SilentWatch Setup")
        .with_decorations(false)
        .with_resizable(false)
        .with_inner_size(LogicalSize::new(860.0, 540.0))
        .build(&event_loop)
        .expect("Failed to create SilentWatch Setup window");

    let ipc_proxy = proxy.clone();
    let webview = WebViewBuilder::new()
        .with_html(INSTALLER_HTML)
        .with_ipc_handler(move |req| {
            let _ = ipc_proxy.send_event(UserEvent::Ipc(req.body().to_string()));
        })
        .build(&window)
        .expect("Failed to initialize WebView2 for SilentWatch Setup");

    let default_dir = default_install_dir().display().to_string();

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;
        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => *control_flow = ControlFlow::Exit,
            Event::UserEvent(UserEvent::Exit) => *control_flow = ControlFlow::Exit,
            Event::UserEvent(UserEvent::EvalJs(js)) => {
                let _ = webview.evaluate_script(&js);
            }
            Event::UserEvent(UserEvent::Ipc(raw)) => {
                let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) else {
                    return;
                };
                match val["action"].as_str().unwrap_or("") {
                    "init" => {
                        let js_dir = serde_json::to_string(&default_dir).unwrap_or_default();
                        let _ =
                            webview.evaluate_script(&format!("window.__setDefaultDir({js_dir})"));
                    }
                    "drag" => {
                        let _ = window.drag_window();
                    }
                    "minimize" => {
                        window.set_minimized(true);
                    }
                    "cancel" => {
                        *control_flow = ControlFlow::Exit;
                    }
                    "browse" => {
                        let p = proxy.clone();
                        let cur = default_dir.clone();
                        std::thread::spawn(move || {
                            if let Some(picked) = pick_folder_dialog(&cur) {
                                let js_dir = serde_json::to_string(&picked).unwrap_or_default();
                                let _ = p.send_event(UserEvent::EvalJs(format!(
                                    "window.__setDefaultDir({js_dir})"
                                )));
                            }
                        });
                    }
                    "install" => {
                        if let Ok(opts) = serde_json::from_value::<InstallOptions>(val) {
                            let p = proxy.clone();
                            std::thread::spawn(move || {
                                let res = extract_payload_and_configure(&opts, |pct, msg| {
                                    let js_msg = serde_json::to_string(msg).unwrap_or_default();
                                    let _ = p.send_event(UserEvent::EvalJs(format!(
                                        "window.__onInstallProgress({pct}, {js_msg})"
                                    )));
                                });
                                match res {
                                    Ok(exe_path) => {
                                        let js_exe =
                                            serde_json::to_string(&exe_path.display().to_string())
                                                .unwrap_or_default();
                                        let _ = p.send_event(UserEvent::EvalJs(format!(
                                            "window.__onInstallComplete({js_exe})"
                                        )));
                                    }
                                    Err(e) => {
                                        let js_err = serde_json::to_string(&e.to_string())
                                            .unwrap_or_default();
                                        let _ = p.send_event(UserEvent::EvalJs(format!(
                                            "window.__onInstallError({js_err})"
                                        )));
                                    }
                                }
                            });
                        }
                    }
                    "finish" => {
                        if val["launch_after"].as_bool().unwrap_or(false) {
                            if let Some(exe) = val["exe_path"].as_str() {
                                let _ = Command::new(exe).spawn();
                            }
                        }
                        *control_flow = ControlFlow::Exit;
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    });
}

#[cfg(not(windows))]
fn main() {
    let mut dec = GzDecoder::new(PAYLOAD_GZ);
    let mut buf = Vec::new();
    let _ = dec.read_to_end(&mut buf);
    println!(
        "SilentWatch custom Windows GUI installer (payload bytes: {}). Build on Windows to run the WebView2 wizard.",
        buf.len()
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_embedded_payload_and_writes_prefs() {
        let tmp = std::env::temp_dir().join("sw_installer_unit_test");
        let _ = fs::remove_dir_all(&tmp);
        let opts = InstallOptions {
            install_dir: tmp.display().to_string(),
            create_desktop_shortcut: false,
            launch_after: false,
            hide_to_tray: true,
        };
        let mut last_pct = 0u8;
        let exe = extract_payload_and_configure(&opts, |pct, _| {
            last_pct = pct;
        })
        .expect("payload extraction should succeed");
        assert!(exe.exists());
        assert_eq!(last_pct, 100);
        let _ = fs::remove_dir_all(&tmp);
    }
}
