use chrono::{Local, TimeZone, Utc};
use serde::{Deserialize, Serialize};
use silentwatch_collectors::CollectorRuntime;
use silentwatch_core::*;
use silentwatch_ipc::*;
use silentwatch_rules::RuleEngine;
use silentwatch_storage::{EventQuery, StorageEngine};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, State, WindowEvent};
use uuid::Uuid;

pub struct AppState {
    pub storage: StorageEngine,
    pub collector: Arc<CollectorRuntime>,
    pub settings: Mutex<AppSettings>,
    pub export_dir: PathBuf,
    pub force_show_release_video: Mutex<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCheckResult {
    pub current_version: String,
    pub latest_version: String,
    pub update_available: bool,
    pub release_notes: String,
    pub installer_url: Option<String>,
    pub whats_new_video_url: Option<String>,
    pub startup_video_url: Option<String>,
    pub release_page_url: String,
    pub checked_ok: bool,
}

#[derive(Debug, Deserialize)]
struct InstallerPrefs {
    close_behavior: Option<CloseWindowBehavior>,
    privilege_mode: Option<PrivilegeMode>,
    show_release_video: Option<bool>,
}

impl AppState {
    fn current_mode(&self, requested: Option<DataSourceMode>) -> DataSourceMode {
        requested.unwrap_or_else(|| {
            self.settings
                .lock()
                .map(|s| s.data_source_mode)
                .unwrap_or(DataSourceMode::Live)
        })
    }
}

#[tauri::command]
fn signal_ui_ready(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn window_minimize(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn window_toggle_maximize(app: AppHandle) -> Result<bool, String> {
    if let Some(win) = app.get_webview_window("main") {
        let is_max = win.is_maximized().unwrap_or(false);
        if is_max {
            win.unmaximize().map_err(|e| e.to_string())?;
            return Ok(false);
        } else {
            win.maximize().map_err(|e| e.to_string())?;
            return Ok(true);
        }
    }
    Ok(false)
}

#[tauri::command]
fn window_close_to_tray(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let behavior = state
        .settings
        .lock()
        .map(|s| s.close_behavior)
        .unwrap_or(CloseWindowBehavior::HideToTray);
    if behavior == CloseWindowBehavior::HideToTray {
        if let Some(win) = app.get_webview_window("main") {
            let _ = win.hide();
        }
    } else {
        state.collector.stop();
        let _ = state.storage.shutdown_cleanly();
        app.exit(0);
    }
    Ok(())
}

#[tauri::command]
fn should_show_release_video(state: State<'_, AppState>) -> Result<bool, String> {
    let forced = state
        .force_show_release_video
        .lock()
        .map(|g| *g)
        .unwrap_or(false);
    if forced {
        return Ok(true);
    }
    let current = env!("CARGO_PKG_VERSION").to_string();
    let last_seen = state
        .settings
        .lock()
        .ok()
        .and_then(|s| s.last_seen_version.clone());
    Ok(last_seen.as_deref() != Some(current.as_str()))
}

#[tauri::command]
fn mark_release_video_seen(state: State<'_, AppState>) -> Result<(), String> {
    if let Ok(mut f) = state.force_show_release_video.lock() {
        *f = false;
    }
    if let Ok(mut s) = state.settings.lock() {
        s.last_seen_version = Some(env!("CARGO_PKG_VERSION").to_string());
        let _ = state.storage.save_settings(&s);
    }
    Ok(())
}

#[tauri::command]
async fn check_for_updates() -> Result<UpdateCheckResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
    let current = env!("CARGO_PKG_VERSION").to_string();
    let repo_releases = "https://github.com/motionedits246-max/SilentWatch/releases".to_string();

    let resp =
        ureq::get("https://api.github.com/repos/motionedits246-max/SilentWatch/releases/latest")
            .set("User-Agent", "SilentWatch-Desktop-Updater/0.1.0")
            .set("Accept", "application/vnd.github+json")
            .timeout(Duration::from_secs(4))
            .call();

    match resp {
        Ok(r) => {
            let json: serde_json::Value = r.into_json().map_err(|e| e.to_string())?;
            let tag = json["tag_name"]
                .as_str()
                .unwrap_or(&current)
                .trim_start_matches('v')
                .to_string();
            let notes = json["body"]
                .as_str()
                .unwrap_or("Performance improvements and telemetry updates.")
                .to_string();
            let html_url = json["html_url"]
                .as_str()
                .unwrap_or(&repo_releases)
                .to_string();

            let mut installer_url = None;
            let mut video_url = None;
            let mut startup_video_url = None;
            if let Some(assets) = json["assets"].as_array() {
                for a in assets {
                    let name = a["name"].as_str().unwrap_or("").to_lowercase();
                    let dl = a["browser_download_url"].as_str().map(|s| s.to_string());
                    if name.ends_with(".exe") && installer_url.is_none() {
                        installer_url = dl;
                    } else if name.ends_with(".mp4") {
                        if (name.contains("startup") || name.contains("intro")) && startup_video_url.is_none() {
                            startup_video_url = dl;
                        } else if video_url.is_none() {
                            video_url = dl;
                        }
                    }
                }
            }

            let update_available = tag != current && !tag.is_empty();
            Ok(UpdateCheckResult {
                current_version: current,
                latest_version: tag,
                update_available,
                release_notes: notes,
                installer_url,
                whats_new_video_url: video_url,
                startup_video_url,
                release_page_url: html_url,
                checked_ok: true,
            })
        }
        Err(_) => Ok(UpdateCheckResult {
            current_version: current.clone(),
            latest_version: current,
            update_available: false,
            release_notes: "You are running the latest installed version (offline or no published GitHub release yet).".into(),
            installer_url: None,
            whats_new_video_url: None,
            startup_video_url: None,
            release_page_url: repo_releases,
            checked_ok: false,
        }),
    }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    state
        .settings
        .lock()
        .map(|s| s.clone())
        .map_err(|_| "Settings lock poisoned".to_string())
}

#[tauri::command]
fn save_settings(state: State<'_, AppState>, settings: AppSettings) -> Result<AppSettings, String> {
    state.collector.set_privilege_mode(settings.privilege_mode);
    state
        .storage
        .save_settings(&settings)
        .map_err(|e| e.to_string())?;
    if let Ok(mut guard) = state.settings.lock() {
        *guard = settings.clone();
    }
    let _ = state
        .storage
        .append_diagnostic_log("INFO", "Settings saved.");
    Ok(settings)
}

#[tauri::command]
async fn start_monitoring(state: State<'_, AppState>) -> Result<bool, String> {
    let collector = Arc::clone(&state.collector);
    let storage = state.storage.clone();
    tauri::async_runtime::spawn_blocking(move || {
        collector.start();
        let cycle = collector.collect_once();
        let _ = storage.upsert_processes(&cycle.processes);
        let _ = storage.upsert_network_connections(&cycle.connections);
        let _ = storage.upsert_modules(&cycle.modules);
        let _ = storage.insert_events_batch(&cycle.events);
        let _ = storage.append_diagnostic_log(
            "INFO",
            &format!("Monitoring active ({} processes).", cycle.processes.len()),
        );
        Ok(true)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn stop_monitoring(state: State<'_, AppState>) -> Result<bool, String> {
    state.collector.stop();
    let _ = state
        .storage
        .append_diagnostic_log("INFO", "Monitoring paused.");
    Ok(false)
}

#[tauri::command]
async fn get_overview(
    state: State<'_, AppState>,
    range: String,
    mode: Option<DataSourceMode>,
) -> Result<OverviewSnapshot, String> {
    let active_mode = state.current_mode(mode);
    if active_mode == DataSourceMode::Demo {
        return Ok(DemoFixtureEngine::overview(&range));
    }
    let settings = state.settings.lock().map(|s| s.clone()).unwrap_or_default();
    let storage_eng = state.storage.clone();
    let collector = Arc::clone(&state.collector);

    tauri::async_runtime::spawn_blocking(move || {
        let procs = storage_eng
            .query_processes(60, 0)
            .map_err(|e| e.to_string())?;
        let conns = storage_eng
            .query_network_connections(200)
            .map_err(|e| e.to_string())?;
        let mods = storage_eng
            .query_modules(None, 300)
            .map_err(|e| e.to_string())?;
        let caps = collector.capabilities();
        let allowlist = storage_eng.list_allowlist().unwrap_or_default();
        let rules = RuleEngine::evaluate(&procs, &conns, &mods, &caps, &allowlist);
        let storage = storage_eng
            .diagnostics(settings.ring_buffer_cap_mb)
            .map_err(|e| e.to_string())?;

        let matched_rules = rules
            .iter()
            .filter(|r| r.verdict == RuleVerdict::Matched)
            .count() as u64;

        let now_ms = Utc::now().timestamp_millis();
        let (bucket_count, step_ms, is_days): (usize, i64, bool) = match range.as_str() {
            "15M" => (12, 75_000, false),
            "1H" => (12, 300_000, false),
            "6H" => (12, 1_800_000, false),
            "24H" => (12, 7_200_000, false),
            "7D" => (7, 86_400_000, true),
            _ => (12, 300_000, false),
        };
        let window_start_ms = now_ms - (bucket_count as i64 * step_ms);
        let recent_events = storage_eng
            .query_events(&EventQuery {
                limit: 1200,
                ..Default::default()
            })
            .unwrap_or_default();

        let mut proc_bins = vec![0u64; bucket_count];
        let mut net_bins = vec![0u64; bucket_count];
        let mut mod_bins = vec![0u64; bucket_count];
        let mut rule_bins = vec![0u64; bucket_count];

        for ev in &recent_events {
            if ev.event_ts_ms < window_start_ms || ev.event_ts_ms > now_ms {
                continue;
            }
            let idx =
                (((ev.event_ts_ms - window_start_ms) / step_ms) as usize).min(bucket_count - 1);
            match ev.category {
                EventCategory::Process => proc_bins[idx] += 1,
                EventCategory::Network => net_bins[idx] += 1,
                EventCategory::Module => mod_bins[idx] += 1,
                EventCategory::Rule => rule_bins[idx] += 1,
                EventCategory::System => proc_bins[idx] += 1,
            }
        }
        // Always reflect current live cycle in the latest bucket so the live edge never reads 0 when active
        if let Some(last) = bucket_count.checked_sub(1) {
            if proc_bins[last] == 0 && !procs.is_empty() {
                proc_bins[last] = (procs.len() as u64 / 8).max(1);
            }
            if net_bins[last] == 0 && !conns.is_empty() {
                net_bins[last] = (conns.len() as u64 / 4).max(1);
            }
            if mod_bins[last] == 0 && !mods.is_empty() {
                mod_bins[last] = (mods.len() as u64 / 12).max(1);
            }
            rule_bins[last] = rule_bins[last].max(matched_rules);
        }

        let timeline: Vec<TimelineBucket> = (0..bucket_count)
            .map(|i| {
                let bucket_ts = now_ms - (((bucket_count - 1 - i) as i64) * step_ms);
                let label = Local
                    .timestamp_millis_opt(bucket_ts)
                    .single()
                    .map(|dt| {
                        if is_days {
                            dt.format("%a %d").to_string()
                        } else {
                            dt.format("%H:%M").to_string()
                        }
                    })
                    .unwrap_or_else(|| format!("T-{i}"));
                let p = proc_bins[i];
                let n = net_bins[i];
                let m = mod_bins[i];
                let r = rule_bins[i];
                TimelineBucket {
                    timestamp_ms: bucket_ts,
                    label,
                    total_events: p + n + m + r,
                    process_events: p,
                    network_events: n,
                    module_events: m,
                    rule_events: r,
                }
            })
            .collect();

        Ok(OverviewSnapshot {
            mode: DataSourceMode::Live,
            privilege_mode: collector.privilege_mode(),
            monitoring_active: collector.is_active(),
            active_process_count: procs.iter().filter(|p| p.is_active).count() as u64,
            total_events_window: storage.total_events,
            process_spawns_count: procs.len() as u64,
            network_calls_count: conns.len() as u64,
            dll_loads_count: mods.len() as u64,
            rule_matches_count: matched_rules,
            high_activity_apps: procs.into_iter().take(12).collect(),
            timeline,
            storage,
            collector_health_ok: collector.is_active(),
            dropped_events_24h: collector.dropped_events(),
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn get_processes(
    state: State<'_, AppState>,
    mode: Option<DataSourceMode>,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<Vec<ProcessSummary>, String> {
    if state.current_mode(mode) == DataSourceMode::Demo {
        return Ok(DemoFixtureEngine::processes());
    }
    let storage = state.storage.clone();
    tauri::async_runtime::spawn_blocking(move || {
        storage
            .query_processes(limit.unwrap_or(150), offset.unwrap_or(0))
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn get_network_connections(
    state: State<'_, AppState>,
    mode: Option<DataSourceMode>,
) -> Result<Vec<NetworkConnectionRecord>, String> {
    if state.current_mode(mode) == DataSourceMode::Demo {
        return Ok(DemoFixtureEngine::network_connections());
    }
    let storage = state.storage.clone();
    tauri::async_runtime::spawn_blocking(move || {
        storage
            .query_network_connections(250)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn get_modules(
    state: State<'_, AppState>,
    mode: Option<DataSourceMode>,
    process_key: Option<String>,
) -> Result<Vec<ModuleRecord>, String> {
    if state.current_mode(mode) == DataSourceMode::Demo {
        return Ok(DemoFixtureEngine::modules_for_updater());
    }
    let storage = state.storage.clone();
    tauri::async_runtime::spawn_blocking(move || {
        storage
            .query_modules(process_key.as_deref(), 250)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn get_behavior_graph(
    state: State<'_, AppState>,
    _mode: Option<DataSourceMode>,
    process_key: Option<String>,
) -> Result<BehaviorGraph, String> {
    let storage = state.storage.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let procs = storage.query_processes(120, 0).map_err(|e| e.to_string())?;
        let root = process_key
            .as_deref()
            .and_then(|k| procs.iter().find(|p| p.instance_id.stable_key() == k))
            .or_else(|| procs.first())
            .cloned()
            .ok_or_else(|| "No observed processes in local database yet".to_string())?;

        let root_key = root.instance_id.stable_key();
        let mut nodes = vec![BehaviorNode {
            id: "node-root".into(),
            kind: GraphNodeKind::Process,
            label: root.exe_name.clone(),
            subtitle: format!(
                "PID {} • {:.1}% CPU • {:.0} MB",
                root.instance_id.pid, root.cpu_percent, root.memory_mb
            ),
            timestamp_ms: root.first_seen_ms,
            signature_status: Some(root.signature_status),
            classification: EpistemicClassification::Confirmed,
            x: 80.0,
            y: 205.0,
            metadata: serde_json::json!({
                "identity": root_key,
                "path": root.exe_path,
                "args": root.command_line_redacted,
                "cpu_percent": root.cpu_percent,
                "memory_mb": root.memory_mb,
            }),
            modules: vec![],
        }];
        let mut edges = Vec::new();

        let children: Vec<&ProcessSummary> = procs
            .iter()
            .filter(|p| {
                p.parent_instance_id
                    .as_ref()
                    .map(|pid| pid.stable_key() == root_key)
                    .unwrap_or(false)
            })
            .take(5)
            .collect();

        for (idx, child) in children.iter().enumerate() {
            let cid = format!("node-child-{idx}");
            nodes.push(BehaviorNode {
                id: cid.clone(),
                kind: GraphNodeKind::Process,
                label: child.exe_name.clone(),
                subtitle: format!("PID {} • {:.0} MB", child.instance_id.pid, child.memory_mb),
                timestamp_ms: child.first_seen_ms,
                signature_status: Some(child.signature_status),
                classification: EpistemicClassification::Confirmed,
                x: 370.0,
                y: 68.0 + (idx as f32 * 100.0),
                metadata: serde_json::json!({
                    "identity": child.instance_id.stable_key(),
                    "parent": root_key,
                    "path": child.exe_path,
                    "memory_mb": child.memory_mb,
                }),
                modules: vec![],
            });
            edges.push(BehaviorEdge {
                id: format!("edge-child-{idx}"),
                source: "node-root".into(),
                target: cid,
                label: "Spawned".into(),
                timestamp_ms: child.first_seen_ms,
                classification: EpistemicClassification::Confirmed,
                category: EventCategory::Process,
                evidence: "Confirmed OS Parent PID link".into(),
            });
        }

        let conns = storage.query_network_connections(200).unwrap_or_default();
        let proc_conns: Vec<NetworkConnectionRecord> = conns
            .into_iter()
            .filter(|c| c.process_instance_id.stable_key() == root_key)
            .take(4)
            .collect();
        for (idx, c) in proc_conns.iter().enumerate() {
            let nid = format!("node-net-{idx}");
            let label = match c.remote_domain.as_deref() {
                Some(d) => format!("{d}:{} ({})", c.remote_port, c.protocol),
                None => format!("{}:{} ({})", c.remote_addr, c.remote_port, c.protocol),
            };
            nodes.push(BehaviorNode {
                id: nid.clone(),
                kind: GraphNodeKind::NetworkEndpoint,
                label,
                subtitle: format!("{} • {}", c.remote_addr, c.state),
                timestamp_ms: c.first_seen_ms,
                signature_status: None,
                classification: c.classification,
                x: 650.0,
                y: 80.0 + (idx as f32 * 88.0),
                metadata: serde_json::json!({
                    "ip": c.remote_addr,
                    "port": c.remote_port,
                    "protocol": c.protocol,
                }),
                modules: vec![],
            });
            edges.push(BehaviorEdge {
                id: format!("edge-net-{idx}"),
                source: "node-root".into(),
                target: nid,
                label: format!("{} :{}", c.protocol, c.remote_port),
                timestamp_ms: c.first_seen_ms,
                classification: c.classification,
                category: EventCategory::Network,
                evidence: c.provenance.confidence_note.clone(),
            });
        }

        let mods = storage
            .query_modules(Some(&root_key), 120)
            .unwrap_or_default();
        if !mods.is_empty() {
            let unsigned = mods
                .iter()
                .filter(|m| m.signature_status == SignatureStatus::Unsigned)
                .count();
            nodes.push(BehaviorNode {
                id: "node-dlls".into(),
                kind: GraphNodeKind::DllCluster,
                label: format!("DLL Cluster ({})", mods.len()),
                subtitle: format!("{} Signed • {} Unsigned", mods.len() - unsigned, unsigned),
                timestamp_ms: root.last_seen_ms,
                signature_status: if unsigned > 0 {
                    Some(SignatureStatus::Unsigned)
                } else {
                    Some(SignatureStatus::SignedVerified)
                },
                classification: EpistemicClassification::Confirmed,
                x: 370.0,
                y: 260.0,
                metadata: serde_json::json!({
                    "total_modules": mods.len(),
                    "unsigned_modules": unsigned,
                }),
                modules: mods,
            });
            edges.push(BehaviorEdge {
                id: "edge-dlls".into(),
                source: "node-root".into(),
                target: "node-dlls".into(),
                label: "Loaded Modules".into(),
                timestamp_ms: root.last_seen_ms,
                classification: EpistemicClassification::Confirmed,
                category: EventCategory::Module,
                evidence: "Confirmed module snapshot".into(),
            });
        }

        let min_ts = nodes
            .iter()
            .map(|n| n.timestamp_ms)
            .min()
            .unwrap_or(root.first_seen_ms);
        let max_ts = nodes
            .iter()
            .map(|n| n.timestamp_ms)
            .max()
            .unwrap_or(root.last_seen_ms)
            .max(min_ts + 1_000);

        Ok(BehaviorGraph {
            root_process: root,
            nodes,
            edges,
            timeline_start_ms: min_ts,
            timeline_end_ms: max_ts,
            mode: DataSourceMode::Live,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn get_rule_matches(
    state: State<'_, AppState>,
    _mode: Option<DataSourceMode>,
) -> Result<Vec<RuleMatchRecord>, String> {
    let storage = state.storage.clone();
    let collector = Arc::clone(&state.collector);
    tauri::async_runtime::spawn_blocking(move || {
        let procs = storage.query_processes(120, 0).unwrap_or_default();
        let conns = storage.query_network_connections(200).unwrap_or_default();
        let mods = storage.query_modules(None, 200).unwrap_or_default();
        let caps = collector.capabilities();
        let allowlist = storage.list_allowlist().unwrap_or_default();
        Ok(RuleEngine::evaluate(
            &procs, &conns, &mods, &caps, &allowlist,
        ))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn get_events(
    state: State<'_, AppState>,
    _mode: Option<DataSourceMode>,
    search: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<TelemetryEvent>, String> {
    let storage = state.storage.clone();
    tauri::async_runtime::spawn_blocking(move || {
        storage
            .query_events(&EventQuery {
                search,
                limit: limit.unwrap_or(100),
                ..Default::default()
            })
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn list_allowlist(state: State<'_, AppState>) -> Result<Vec<AllowlistEntry>, String> {
    let storage = state.storage.clone();
    tauri::async_runtime::spawn_blocking(move || {
        storage.list_allowlist().map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn add_allowlist(
    state: State<'_, AppState>,
    match_type: String,
    value: String,
    reason: String,
) -> Result<AllowlistEntry, String> {
    let entry = AllowlistEntry {
        id: Uuid::new_v4().to_string(),
        match_type,
        value,
        reason,
        created_ts_ms: Utc::now().timestamp_millis(),
    };
    state
        .storage
        .add_allowlist_entry(&entry)
        .map_err(|e| e.to_string())?;
    Ok(entry)
}

#[tauri::command]
fn remove_allowlist(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state
        .storage
        .remove_allowlist_entry(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn export_report(
    state: State<'_, AppState>,
    request: ExportRequest,
) -> Result<ExportResult, String> {
    let (procs, conns, rules) = if request.mode == DataSourceMode::Demo {
        (
            DemoFixtureEngine::processes(),
            DemoFixtureEngine::network_connections(),
            DemoFixtureEngine::rule_matches(),
        )
    } else {
        let p = state.storage.query_processes(200, 0).unwrap_or_default();
        let c = state
            .storage
            .query_network_connections(200)
            .unwrap_or_default();
        let m = state.storage.query_modules(None, 250).unwrap_or_default();
        let caps = state.collector.capabilities();
        let allow = state.storage.list_allowlist().unwrap_or_default();
        let r = RuleEngine::evaluate(&p, &c, &m, &caps, &allow);
        (p, c, r)
    };

    build_sanitized_export(&request, &procs, &conns, &rules, Some(&state.export_dir))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_local_history(state: State<'_, AppState>) -> Result<(), String> {
    state.storage.clear_history().map_err(|e| e.to_string())?;
    let _ = state
        .storage
        .append_diagnostic_log("INFO", "Local history cleared.");
    Ok(())
}

#[tauri::command]
async fn get_system_status(
    state: State<'_, AppState>,
    _mode: Option<DataSourceMode>,
) -> Result<SystemStatusSnapshot, String> {
    let settings = state.settings.lock().map(|s| s.clone()).unwrap_or_default();
    let storage_eng = state.storage.clone();
    let collector = Arc::clone(&state.collector);
    tauri::async_runtime::spawn_blocking(move || {
        let storage = storage_eng
            .diagnostics(settings.ring_buffer_cap_mb)
            .map_err(|e| e.to_string())?;
        let logs = storage_eng.recent_diagnostic_logs(15).unwrap_or_default();

        Ok(SystemStatusSnapshot {
            mode: DataSourceMode::Live,
            privilege_mode: collector.privilege_mode(),
            monitoring_active: collector.is_active(),
            platform: std::env::consts::OS.to_string(),
            ipc_protocol_version: IPC_PROTOCOL_VERSION,
            ipc_healthy: true,
            dropped_events: collector.dropped_events(),
            collector_restarts: collector.restarts(),
            capabilities: collector.capabilities(),
            storage,
            logs,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn quit_application(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    state.collector.stop();
    let _ = state.storage.shutdown_cleanly();
    app.exit(0);
    Ok(())
}

pub fn run() {
    let data_dir = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("SilentWatch");
    let db_path = data_dir.join("silentwatch.db");
    let export_dir = data_dir.join("exports");

    let storage =
        StorageEngine::open(&db_path).expect("Failed to initialize SilentWatch SQLite WAL storage");
    let mut settings = storage.load_settings().unwrap_or_default();
    let mut force_video = false;

    // Apply preferences written by NSIS installer during installation
    let installer_prefs_path = data_dir.join("installer_prefs.json");
    if let Ok(raw) = std::fs::read_to_string(&installer_prefs_path) {
        if let Ok(prefs) = serde_json::from_str::<InstallerPrefs>(&raw) {
            if let Some(cb) = prefs.close_behavior {
                settings.close_behavior = cb;
            }
            if let Some(pm) = prefs.privilege_mode {
                settings.privilege_mode = pm;
            }
            if prefs.show_release_video.unwrap_or(false) {
                force_video = true;
            }
            settings.onboarding_completed = true;
            let _ = storage.save_settings(&settings);
        }
        let _ = std::fs::remove_file(&installer_prefs_path);
    }

    // Always run in Live Local mode (demo mode removed)
    settings.data_source_mode = DataSourceMode::Live;

    let collector = Arc::new(CollectorRuntime::new(settings.privilege_mode));
    // Start real background monitoring immediately in background thread (never blocks window launch!)
    collector.start();

    let bg_collector = Arc::clone(&collector);
    let bg_storage = storage.clone();
    let startup_cap_mb = settings.ring_buffer_cap_mb;
    std::thread::spawn(move || {
        // Fast startup recovery if a previous database grew huge
        let _ = bg_storage.fast_startup_maintenance(startup_cap_mb);

        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .expect("collector runtime");
        rt.block_on(async move {
            let mut tick = 0u64;
            loop {
                if bg_collector.is_active() {
                    let cycle = bg_collector.collect_once();
                    let proc_count = cycle.processes.len();
                    let _ = bg_storage.upsert_processes(&cycle.processes);
                    let _ = bg_storage.upsert_network_connections(&cycle.connections);
                    let _ = bg_storage.upsert_modules(&cycle.modules);
                    let _ = bg_storage.insert_events_batch(&cycle.events);

                    if tick == 0 {
                        let _ = bg_storage.append_diagnostic_log(
                            "INFO",
                            &format!("Engine started ({} active processes).", proc_count),
                        );
                    }

                    tick += 1;
                    if tick % 12 == 0 {
                        if let Ok(cfg) = bg_storage.load_settings() {
                            let _ = bg_storage
                                .enforce_retention(cfg.retention_hours, cfg.ring_buffer_cap_mb);
                        }
                    }
                }
                tokio::time::sleep(Duration::from_secs(5)).await;
            }
        });
    });

    let app_state = AppState {
        storage,
        collector,
        settings: Mutex::new(settings),
        export_dir,
        force_show_release_video: Mutex::new(force_video),
    };

    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            let open_item = MenuItem::with_id(app, "open", "Open SilentWatch", true, None::<&str>)?;
            let pause_item =
                MenuItem::with_id(app, "pause_mon", "Pause Monitoring", true, None::<&str>)?;
            let resume_item =
                MenuItem::with_id(app, "resume_mon", "Resume Monitoring", true, None::<&str>)?;
            let quit_item =
                MenuItem::with_id(app, "quit", "Stop Services & Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_item, &pause_item, &resume_item, &quit_item])?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("SilentWatch — Background Monitor Active")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.unminimize();
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "pause_mon" => {
                        if let Some(st) = app.try_state::<AppState>() {
                            st.collector.stop();
                            let _ = st
                                .storage
                                .append_diagnostic_log("INFO", "Paused from system tray.");
                        }
                    }
                    "resume_mon" => {
                        if let Some(st) = app.try_state::<AppState>() {
                            st.collector.start();
                            let _ = st
                                .storage
                                .append_diagnostic_log("INFO", "Resumed from system tray.");
                        }
                    }
                    "quit" => {
                        if let Some(st) = app.try_state::<AppState>() {
                            st.collector.stop();
                            let _ = st.storage.shutdown_cleanly();
                        }
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            let _ = w.unminimize();
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }
            let _tray = tray_builder.build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let behavior = window
                    .app_handle()
                    .try_state::<AppState>()
                    .and_then(|st| st.settings.lock().ok().map(|s| s.close_behavior))
                    .unwrap_or(CloseWindowBehavior::HideToTray);

                if behavior == CloseWindowBehavior::HideToTray {
                    api.prevent_close();
                    let _ = window.hide();
                } else if let Some(st) = window.app_handle().try_state::<AppState>() {
                    st.collector.stop();
                    let _ = st.storage.shutdown_cleanly();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            signal_ui_ready,
            window_minimize,
            window_toggle_maximize,
            window_close_to_tray,
            should_show_release_video,
            mark_release_video_seen,
            check_for_updates,
            get_settings,
            save_settings,
            start_monitoring,
            stop_monitoring,
            get_overview,
            get_processes,
            get_network_connections,
            get_modules,
            get_behavior_graph,
            get_rule_matches,
            get_events,
            list_allowlist,
            add_allowlist,
            remove_allowlist,
            export_report,
            clear_local_history,
            get_system_status,
            quit_application,
        ])
        .run(tauri::generate_context!())
        .expect("error while running SilentWatch desktop application");
}
