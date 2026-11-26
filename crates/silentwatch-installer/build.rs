use std::env;
use std::fs;
use std::path::PathBuf;

/// Valid empty gzip archive (20 bytes) used as fallback when building unit tests
/// before CI packages the compiled `silentwatch-desktop.exe.gz` payload.
const EMPTY_GZ: &[u8] = &[
    0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
];

fn main() {
    println!("cargo:rerun-if-changed=payload/silentwatch-desktop.exe.gz");
    println!("cargo:rerun-if-changed=assets/setup-icon.ico");
    let out_dir = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR"));
    let dst = out_dir.join("silentwatch-desktop.exe.gz");
    let src = PathBuf::from("payload/silentwatch-desktop.exe.gz");

    if src.exists() {
        fs::copy(&src, &dst).expect("failed to copy silentwatch-desktop.exe.gz into OUT_DIR");
    } else {
        fs::write(&dst, EMPTY_GZ).expect("failed to write placeholder gzip payload");
    }

    #[cfg(windows)]
    {
        let icon_path = PathBuf::from("assets/setup-icon.ico");
        if icon_path.exists() {
            let mut res = winresource::WindowsResource::new();
            res.set_icon("assets/setup-icon.ico");
            res.set("ProductName", "SilentWatch Setup");
            res.set(
                "FileDescription",
                "SilentWatch System Activity Monitor Installer",
            );
            res.compile()
                .expect("failed to embed SilentWatch Setup Windows icon");
        }
    }
}
