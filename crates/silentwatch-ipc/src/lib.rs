use chrono::Utc;
use serde::{Deserialize, Serialize};
use silentwatch_core::*;
use std::path::Path;
use thiserror::Error;

pub const IPC_PROTOCOL_VERSION: u32 = 1;

#[derive(Debug, Error)]
pub enum IpcError {
    #[error("Action '{0}' is not in the SilentWatch command allowlist")]
    DisallowedAction(String),
    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExportFormat {
    Markdown,
    Json,
    Csv,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportRequest {
    pub format: ExportFormat,
    pub mode: DataSourceMode,
    pub include_processes: bool,
    pub include_network: bool,
    pub include_rules: bool,
    pub target_process_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportResult {
    pub format: ExportFormat,
    pub filename: String,
    pub saved_path: Option<String>,
    pub content: String,
    pub redaction_summary: RedactionSummary,
    pub generated_ts_ms: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AllowlistedAction {
    NavigateOverview,
    NavigateBehaviorExplorer,
    NavigateApplications,
    NavigateNetworkModules,
    NavigateDetectionsLogs,
    NavigateSettings,
    NavigateSystemStatus,
    ToggleDataSourceMode,
    ToggleMonitoring,
    ExportSanitizedMarkdown,
    ExportSanitizedJson,
    ReplayWelcomeTour,
}

impl AllowlistedAction {
    pub fn parse_strict(id: &str) -> Result<Self, IpcError> {
        match id {
            "navigate_overview" => Ok(Self::NavigateOverview),
            "navigate_behavior_explorer" => Ok(Self::NavigateBehaviorExplorer),
            "navigate_applications" => Ok(Self::NavigateApplications),
            "navigate_network_modules" => Ok(Self::NavigateNetworkModules),
            "navigate_detections_logs" => Ok(Self::NavigateDetectionsLogs),
            "navigate_settings" => Ok(Self::NavigateSettings),
            "navigate_system_status" => Ok(Self::NavigateSystemStatus),
            "toggle_data_source_mode" => Ok(Self::ToggleDataSourceMode),
            "toggle_monitoring" => Ok(Self::ToggleMonitoring),
            "export_sanitized_markdown" => Ok(Self::ExportSanitizedMarkdown),
            "export_sanitized_json" => Ok(Self::ExportSanitizedJson),
            "replay_welcome_tour" => Ok(Self::ReplayWelcomeTour),
            other => Err(IpcError::DisallowedAction(other.to_string())),
        }
    }
}

pub fn build_sanitized_export(
    req: &ExportRequest,
    processes: &[ProcessSummary],
    connections: &[NetworkConnectionRecord],
    rules: &[RuleMatchRecord],
    save_dir: Option<&Path>,
) -> Result<ExportResult, IpcError> {
    let now_ms = Utc::now().timestamp_millis();
    let mode_label = match req.mode {
        DataSourceMode::Live => "Live Local Telemetry",
        DataSourceMode::Demo => "Isolated Demo Fixture",
    };

    let filtered_procs: Vec<&ProcessSummary> = match req.target_process_key.as_deref() {
        Some(key) => processes
            .iter()
            .filter(|p| p.instance_id.stable_key() == key)
            .collect(),
        None => processes.iter().collect(),
    };

    let raw_content = match req.format {
        ExportFormat::Markdown => {
            let mut md = String::new();
            md.push_str("# SilentWatch Sanitized Evidence Report\n\n");
            md.push_str(&format!("- **Data Source**: {mode_label}\n"));
            md.push_str(&format!("- **Generated At (UTC ms)**: {now_ms}\n"));
            md.push_str("- **Privacy Guarantee**: Local-only export; user profile paths and tokens redacted.\n\n");

            if req.include_processes {
                md.push_str("## Observed Processes\n\n");
                md.push_str("| Executable | Stable Identity | Signature | CPU % | Memory MB | Path |\n");
                md.push_str("| :--- | :--- | :--- | ---: | ---: | :--- |\n");
                for p in &filtered_procs {
                    md.push_str(&format!(
                        "| `{}` | `{}` | {:?} | {:.1}% | {:.1} | `{}` |\n",
                        p.exe_name,
                        p.instance_id.stable_key(),
                        p.signature_status,
                        p.cpu_percent,
                        p.memory_mb,
                        p.exe_path.as_deref().unwrap_or("Unavailable"),
                    ));
                }
                md.push('\n');
            }

            if req.include_network {
                md.push_str("## Network Connections\n\n");
                md.push_str("| Process | Protocol | Remote Endpoint | State | Provenance |\n");
                md.push_str("| :--- | :--- | :--- | :--- | :--- |\n");
                for c in connections {
                    let remote = match c.remote_domain.as_deref() {
                        Some(d) => format!("{d}:{} ({})", c.remote_port, c.remote_addr),
                        None => format!("{}:{}", c.remote_addr, c.remote_port),
                    };
                    md.push_str(&format!(
                        "| `{}` | {} | `{}` | {} | {} |\n",
                        c.process_name, c.protocol, remote, c.state, c.provenance.source_api
                    ));
                }
                md.push('\n');
            }

            if req.include_rules {
                md.push_str("## Declarative Rule Evaluations\n\n");
                for r in rules {
                    md.push_str(&format!(
                        "- **{} — {}** (`{:?}`): {}\n",
                        r.rule_id, r.rule_name, r.verdict, r.explanation
                    ));
                }
            }
            md
        }
        ExportFormat::Json => {
            let doc = serde_json::json!({
                "schema_version": IPC_PROTOCOL_VERSION,
                "mode": req.mode,
                "generated_ts_ms": now_ms,
                "processes": if req.include_processes { serde_json::to_value(&filtered_procs)? } else { serde_json::json!([]) },
                "network_connections": if req.include_network { serde_json::to_value(connections)? } else { serde_json::json!([]) },
                "rule_evaluations": if req.include_rules { serde_json::to_value(rules)? } else { serde_json::json!([]) },
            });
            serde_json::to_string_pretty(&doc)?
        }
        ExportFormat::Csv => {
            let mut csv = String::from("record_type,name,identity_or_endpoint,status,detail\n");
            if req.include_processes {
                for p in &filtered_procs {
                    csv.push_str(&format!(
                        "process,{},{},{:?},{}\n",
                        escape_csv(&p.exe_name),
                        escape_csv(&p.instance_id.stable_key()),
                        p.signature_status,
                        escape_csv(p.exe_path.as_deref().unwrap_or("Unavailable"))
                    ));
                }
            }
            if req.include_network {
                for c in connections {
                    csv.push_str(&format!(
                        "network,{},{}:{}, {},{}\n",
                        escape_csv(&c.process_name),
                        escape_csv(&c.remote_addr),
                        c.remote_port,
                        escape_csv(&c.state),
                        escape_csv(&c.protocol)
                    ));
                }
            }
            if req.include_rules {
                for r in rules {
                    csv.push_str(&format!(
                        "rule,{},{},{:?},{}\n",
                        escape_csv(&r.rule_id),
                        escape_csv(&r.rule_name),
                        r.verdict,
                        escape_csv(&r.explanation)
                    ));
                }
            }
            csv
        }
    };

    let (sanitized, redaction_summary) = RedactionEngine::sanitize(&raw_content);
    let ext = match req.format {
        ExportFormat::Markdown => "md",
        ExportFormat::Json => "json",
        ExportFormat::Csv => "csv",
    };
    let mode_tag = match req.mode {
        DataSourceMode::Live => "live",
        DataSourceMode::Demo => "demo",
    };
    let filename = format!("silentwatch-report-{mode_tag}-{now_ms}.{ext}");

    let saved_path = if let Some(dir) = save_dir {
        std::fs::create_dir_all(dir)?;
        let full = dir.join(&filename);
        std::fs::write(&full, &sanitized)?;
        Some(RedactionEngine::sanitize_str(&full.display().to_string()))
    } else {
        None
    };

    Ok(ExportResult {
        format: req.format,
        filename,
        saved_path,
        content: sanitized,
        redaction_summary,
        generated_ts_ms: now_ms,
    })
}

fn escape_csv(val: &str) -> String {
    if val.contains(',') || val.contains('"') || val.contains('\n') {
        format!("\"{}\"", val.replace('"', "\"\""))
    } else {
        val.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_unlisted_command_palette_actions() {
        assert!(AllowlistedAction::parse_strict("navigate_overview").is_ok());
        assert!(AllowlistedAction::parse_strict("exec_shell_cmd").is_err());
    }

    #[test]
    fn sanitizes_markdown_json_and_csv_exports() {
        let mut procs = DemoFixtureEngine::processes();
        procs[0].exe_path = Some(r"C:\Users\SecretPerson\AppData\Update_host.exe".into());
        let conns = DemoFixtureEngine::network_connections();
        let rules = DemoFixtureEngine::rule_matches();

        for fmt in [ExportFormat::Markdown, ExportFormat::Json, ExportFormat::Csv] {
            let req = ExportRequest {
                format: fmt,
                mode: DataSourceMode::Demo,
                include_processes: true,
                include_network: true,
                include_rules: true,
                target_process_key: None,
            };
            let res = build_sanitized_export(&req, &procs, &conns, &rules, None).unwrap();
            assert!(!res.content.contains("SecretPerson"));
            assert!(res.redaction_summary.user_paths_redacted >= 1);
        }
    }
}
