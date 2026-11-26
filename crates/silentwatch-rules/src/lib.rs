use chrono::Utc;
use silentwatch_core::*;
use std::collections::HashMap;

pub struct RuleEngine;

impl RuleEngine {
    pub fn evaluate(
        processes: &[ProcessSummary],
        connections: &[NetworkConnectionRecord],
        modules: &[ModuleRecord],
        capabilities: &[CollectorCapability],
        allowlist: &[AllowlistEntry],
    ) -> Vec<RuleMatchRecord> {
        let mut results = Vec::new();
        let proc_map: HashMap<String, &ProcessSummary> = processes
            .iter()
            .map(|p| (p.instance_id.stable_key(), p))
            .collect();

        let is_allowlisted = |exe_name: &str| {
            allowlist.iter().any(|e| {
                e.match_type == "exe_name" && e.value.eq_ignore_ascii_case(exe_name)
            })
        };

        let shells = ["powershell.exe", "pwsh.exe", "cmd.exe", "wscript.exe", "cscript.exe", "sh", "bash"];
        for child in processes {
            let child_lower = child.exe_name.to_lowercase();
            if shells.iter().any(|s| child_lower == *s) {
                if let Some(ref parent_id) = child.parent_instance_id {
                    if let Some(parent) = proc_map.get(&parent_id.stable_key()) {
                        if parent.signature_status == SignatureStatus::Unsigned {
                            let verdict = if is_allowlisted(&parent.exe_name) || parent.is_allowlisted {
                                RuleVerdict::Allowlisted
                            } else {
                                RuleVerdict::Matched
                            };
                            results.push(RuleMatchRecord {
                                id: format!("sw001-{}", child.instance_id.short_hash()),
                                rule_id: "SW-001".into(),
                                rule_name: "Unsigned Parent Spawning Shell".into(),
                                description: "Detects when an unsigned executable spawns a scripting shell.".into(),
                                verdict,
                                severity_label: if verdict == RuleVerdict::Allowlisted {
                                    "Allowlisted".into()
                                } else {
                                    "Notable Behavior".into()
                                },
                                process_instance_id: Some(parent.instance_id.clone()),
                                process_name: Some(parent.exe_name.clone()),
                                matched_ts_ms: child.first_seen_ms,
                                deduplicated_count: 1,
                                explanation: format!(
                                    "{} (Unsigned, PID {}) spawned {} (PID {}) with a recorded OS parent link.",
                                    parent.exe_name, parent.instance_id.pid, child.exe_name, child.instance_id.pid
                                ),
                                evidence: vec![
                                    format!("Parent: {} ({})", parent.exe_name, parent.instance_id),
                                    format!("Child: {} ({})", child.exe_name, child.instance_id),
                                    "Informational finding — unsigned software is not automatically malicious.".into(),
                                ],
                                missing_capability: None,
                            });
                        }
                    }
                }
            }
        }

        let module_cap = capabilities
            .iter()
            .find(|c| c.id == "modules_snapshot" || c.id == "etw_image_load");
        if module_cap.map(|c| c.state == CapabilityState::ElevationRequired || c.state == CapabilityState::UnavailableOnPlatform).unwrap_or(false) {
            results.push(RuleMatchRecord {
                id: "sw002-capability".into(),
                rule_id: "SW-002".into(),
                rule_name: "Unsigned Module in Signed Host".into(),
                description: "Flags unsigned DLLs loaded inside verified signed executables.".into(),
                verdict: RuleVerdict::InsufficientCapability,
                severity_label: "Needs Capability".into(),
                process_instance_id: None,
                process_name: None,
                matched_ts_ms: Utc::now().timestamp_millis(),
                deduplicated_count: 0,
                explanation: "Module telemetry collector is currently unavailable or requires elevated privileges.".into(),
                evidence: vec!["Insufficient collector capability to verify loaded module signatures.".into()],
                missing_capability: Some("Module Snapshot or Kernel ImageLoad ETW".into()),
            });
        } else {
            for m in modules.iter().filter(|m| m.signature_status == SignatureStatus::Unsigned) {
                if let Some(host) = proc_map.get(&m.process_instance_id.stable_key()) {
                    if host.signature_status == SignatureStatus::SignedVerified {
                        let verdict = if is_allowlisted(&host.exe_name) {
                            RuleVerdict::Allowlisted
                        } else {
                            RuleVerdict::Matched
                        };
                        results.push(RuleMatchRecord {
                            id: format!("sw002-{}", m.id),
                            rule_id: "SW-002".into(),
                            rule_name: "Unsigned Module in Signed Host".into(),
                            description: "Observed an unsigned DLL loaded in a signed process.".into(),
                            verdict,
                            severity_label: "Notable Behavior".into(),
                            process_instance_id: Some(host.instance_id.clone()),
                            process_name: Some(host.exe_name.clone()),
                            matched_ts_ms: m.observed_ts_ms,
                            deduplicated_count: 1,
                            explanation: format!(
                                "Signed host {} loaded unsigned module {} ({}).",
                                host.exe_name, m.module_name, m.module_path
                            ),
                            evidence: vec![
                                format!("Host: {} (Signed)", host.exe_name),
                                format!("Module: {} ({})", m.module_name, m.module_path),
                            ],
                            missing_capability: None,
                        });
                    }
                }
            }
        }

        for conn in connections {
            if let Some(proc_info) = proc_map.get(&conn.process_instance_id.stable_key()) {
                let in_temp = proc_info
                    .exe_path
                    .as_deref()
                    .map(|p| {
                        let low = p.to_lowercase();
                        low.contains("\\temp\\") || low.contains("/tmp/")
                    })
                    .unwrap_or(false);
                if in_temp {
                    let verdict = if is_allowlisted(&proc_info.exe_name) {
                        RuleVerdict::Allowlisted
                    } else {
                        RuleVerdict::Matched
                    };
                    results.push(RuleMatchRecord {
                        id: format!("sw003-{}", conn.id),
                        rule_id: "SW-003".into(),
                        rule_name: "Temp-Directory Process Network Activity".into(),
                        description: "Process executing from a temporary folder opened a network connection.".into(),
                        verdict,
                        severity_label: "Notable Behavior".into(),
                        process_instance_id: Some(proc_info.instance_id.clone()),
                        process_name: Some(proc_info.exe_name.clone()),
                        matched_ts_ms: conn.first_seen_ms,
                        deduplicated_count: 1,
                        explanation: format!(
                            "{} executing from temporary storage connected to {}:{}.",
                            proc_info.exe_name, conn.remote_addr, conn.remote_port
                        ),
                        evidence: vec![
                            format!("Path: {}", proc_info.exe_path.clone().unwrap_or_default()),
                            format!("Remote: {}:{} ({})", conn.remote_addr, conn.remote_port, conn.protocol),
                        ],
                        missing_capability: None,
                    });
                }
            }
        }

        let etw_active = capabilities
            .iter()
            .any(|c| c.id == "etw_kernel_process" && c.state == CapabilityState::Active);
        if !etw_active {
            results.push(RuleMatchRecord {
                id: "sw005-etw-req".into(),
                rule_id: "SW-005".into(),
                rule_name: "Kernel DLL Injection & Cross-User Monitor".into(),
                description: "Monitors kernel image loads and cross-user process creation via ETW.".into(),
                verdict: RuleVerdict::InsufficientCapability,
                severity_label: "Needs ETW".into(),
                process_instance_id: None,
                process_name: None,
                matched_ts_ms: Utc::now().timestamp_millis(),
                deduplicated_count: 0,
                explanation: "Requires Enhanced ETW Mode — currently running unprivileged per-user collection.".into(),
                evidence: vec![
                    "Transparent capability check: Enhanced ETW provider is inactive.".into(),
                    "Enable Enhanced System Telemetry in Settings (requires explicit UAC approval).".into(),
                ],
                missing_capability: Some("Microsoft-Windows-Kernel-Process / ImageLoad ETW".into()),
            });
        }

        results
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reports_insufficient_capability_when_etw_inactive() {
        let caps = vec![CollectorCapability {
            id: "etw_kernel_process".into(),
            name: "Kernel ETW".into(),
            description: "Kernel process events".into(),
            state: CapabilityState::ElevationRequired,
            source: CollectorSource::WindowsEtwKernelProcess,
            requires_elevation: true,
            limitations: "Requires elevation".into(),
        }];
        let matches = RuleEngine::evaluate(&[], &[], &[], &caps, &[]);
        assert!(matches
            .iter()
            .any(|m| m.rule_id == "SW-005" && m.verdict == RuleVerdict::InsufficientCapability));
    }

    #[test]
    fn honors_allowlist_for_unsigned_parent_shell_spawn() {
        let parent_id = ProcessInstanceId::new("boot_1", 100, 1000);
        let child_id = ProcessInstanceId::new("boot_1", 101, 2000);
        let procs = vec![
            ProcessSummary {
                instance_id: parent_id.clone(),
                parent_instance_id: None,
                exe_name: "dev_launcher.exe".into(),
                exe_path: Some(r"C:\Tools\dev_launcher.exe".into()),
                publisher: None,
                signature_status: SignatureStatus::Unsigned,
                cpu_percent: 1.0,
                memory_mb: 10.0,
                network_count: 0,
                module_count: 0,
                event_count: 1,
                activity_delta_pct: 1.0,
                sparkline: vec![1],
                is_active: true,
                is_allowlisted: false,
                first_seen_ms: 1000,
                last_seen_ms: 2000,
                command_line_redacted: None,
                icon_data_url: None,
            },
            ProcessSummary {
                instance_id: child_id,
                parent_instance_id: Some(parent_id),
                exe_name: "powershell.exe".into(),
                exe_path: Some(r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe".into()),
                publisher: Some("Microsoft Windows".into()),
                signature_status: SignatureStatus::SignedVerified,
                cpu_percent: 1.0,
                memory_mb: 20.0,
                network_count: 0,
                module_count: 0,
                event_count: 1,
                activity_delta_pct: 1.0,
                sparkline: vec![1],
                is_active: true,
                is_allowlisted: false,
                first_seen_ms: 2000,
                last_seen_ms: 2500,
                command_line_redacted: None,
                icon_data_url: None,
            },
        ];

        let allow = vec![AllowlistEntry {
            id: "a1".into(),
            match_type: "exe_name".into(),
            value: "dev_launcher.exe".into(),
            reason: "Trusted local dev tool".into(),
            created_ts_ms: 500,
        }];

        let res = RuleEngine::evaluate(&procs, &[], &[], &[], &allow);
        let sw1 = res.iter().find(|m| m.rule_id == "SW-001").unwrap();
        assert_eq!(sw1.verdict, RuleVerdict::Allowlisted);
    }
}
