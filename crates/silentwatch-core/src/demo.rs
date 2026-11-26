use crate::identity::ProcessInstanceId;
use crate::model::*;

/// Completely isolated, deterministic Demo Fixture dataset.
/// NEVER writes to the live SQLite database or mixes with real machine telemetry.
pub struct DemoFixtureEngine;

impl DemoFixtureEngine {
    const BASE_TS: i64 = 1_732_611_728_412;

    pub fn processes() -> Vec<ProcessSummary> {
        let p_updater = ProcessInstanceId::new("demo_boot_9f2a", 4812, Self::BASE_TS);
        let p_pwsh = ProcessInstanceId::new("demo_boot_9f2a", 5190, Self::BASE_TS + 1_120);
        let p_bg = ProcessInstanceId::new("demo_boot_9f2a", 5244, Self::BASE_TS + 2_480);
        let p_chrome = ProcessInstanceId::new("demo_boot_9f2a", 2104, Self::BASE_TS - 320_000);
        let p_code = ProcessInstanceId::new("demo_boot_9f2a", 6018, Self::BASE_TS - 180_000);
        let p_svchost = ProcessInstanceId::new("demo_boot_9f2a", 1044, Self::BASE_TS - 900_000);
        let p_node = ProcessInstanceId::new("demo_boot_9f2a", 6380, Self::BASE_TS - 60_000);

        vec![
            ProcessSummary {
                instance_id: p_updater.clone(),
                parent_instance_id: None,
                exe_name: "Update_host.exe".into(),
                exe_path: Some(r"%USERPROFILE%\AppData\Local\Updater\Update_host.exe".into()),
                publisher: None,
                signature_status: SignatureStatus::Unsigned,
                cpu_percent: 14.2,
                memory_mb: 142.4,
                network_count: 4,
                module_count: 42,
                event_count: 418,
                activity_delta_pct: 14.2,
                sparkline: vec![12, 18, 22, 35, 64, 58, 72, 68, 84, 79],
                is_active: true,
                is_allowlisted: false,
                first_seen_ms: Self::BASE_TS,
                last_seen_ms: Self::BASE_TS + 121_588,
                command_line_redacted: Some(
                    r"%USERPROFILE%\AppData\Local\Updater\Update_host.exe --channel=stable --token=[REDACTED_SECRET]"
                        .into(),
                ),
                icon_data_url: None,
            },
            ProcessSummary {
                instance_id: p_chrome,
                parent_instance_id: None,
                exe_name: "chrome.exe".into(),
                exe_path: Some(r"C:\Program Files\Google\Chrome\Application\chrome.exe".into()),
                publisher: Some("Google LLC".into()),
                signature_status: SignatureStatus::SignedVerified,
                cpu_percent: 8.1,
                memory_mb: 1240.0,
                network_count: 28,
                module_count: 118,
                event_count: 892,
                activity_delta_pct: 8.1,
                sparkline: vec![40, 44, 42, 48, 52, 49, 55, 53, 57, 61],
                is_active: true,
                is_allowlisted: false,
                first_seen_ms: Self::BASE_TS - 320_000,
                last_seen_ms: Self::BASE_TS + 121_000,
                command_line_redacted: Some(r"C:\Program Files\Google\Chrome\Application\chrome.exe --profile-directory=Default".into()),
                icon_data_url: None,
            },
            ProcessSummary {
                instance_id: p_code.clone(),
                parent_instance_id: None,
                exe_name: "Code.exe".into(),
                exe_path: Some(r"%USERPROFILE%\AppData\Local\Programs\Microsoft VS Code\Code.exe".into()),
                publisher: Some("Microsoft Corporation".into()),
                signature_status: SignatureStatus::SignedVerified,
                cpu_percent: 4.3,
                memory_mb: 860.5,
                network_count: 12,
                module_count: 96,
                event_count: 310,
                activity_delta_pct: 4.3,
                sparkline: vec![22, 25, 24, 28, 30, 29, 34, 33, 35, 38],
                is_active: true,
                is_allowlisted: true,
                first_seen_ms: Self::BASE_TS - 180_000,
                last_seen_ms: Self::BASE_TS + 120_000,
                command_line_redacted: Some(r"%USERPROFILE%\AppData\Local\Programs\Microsoft VS Code\Code.exe".into()),
                icon_data_url: None,
            },
            ProcessSummary {
                instance_id: p_svchost,
                parent_instance_id: None,
                exe_name: "svchost.exe".into(),
                exe_path: Some(r"C:\Windows\System32\svchost.exe".into()),
                publisher: Some("Microsoft Windows".into()),
                signature_status: SignatureStatus::SignedVerified,
                cpu_percent: 1.2,
                memory_mb: 94.2,
                network_count: 6,
                module_count: 64,
                event_count: 124,
                activity_delta_pct: 1.2,
                sparkline: vec![10, 11, 10, 12, 11, 12, 13, 12, 11, 12],
                is_active: true,
                is_allowlisted: true,
                first_seen_ms: Self::BASE_TS - 900_000,
                last_seen_ms: Self::BASE_TS + 120_000,
                command_line_redacted: Some(r"C:\Windows\System32\svchost.exe -k NetworkService".into()),
                icon_data_url: None,
            },
            ProcessSummary {
                instance_id: p_pwsh,
                parent_instance_id: Some(p_updater.clone()),
                exe_name: "powershell.exe".into(),
                exe_path: Some(r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe".into()),
                publisher: Some("Microsoft Windows".into()),
                signature_status: SignatureStatus::SignedVerified,
                cpu_percent: 0.8,
                memory_mb: 68.4,
                network_count: 2,
                module_count: 54,
                event_count: 76,
                activity_delta_pct: 2.6,
                sparkline: vec![0, 0, 14, 38, 22, 16, 12, 10, 8, 6],
                is_active: true,
                is_allowlisted: false,
                first_seen_ms: Self::BASE_TS + 1_120,
                last_seen_ms: Self::BASE_TS + 96_000,
                command_line_redacted: Some(
                    r"powershell.exe -NoProfile -NonInteractive -Command Invoke-WebRequest -Headers @{Authorization='Bearer [REDACTED_TOKEN]'}"
                        .into(),
                ),
                icon_data_url: None,
            },
            ProcessSummary {
                instance_id: p_bg,
                parent_instance_id: None,
                exe_name: "bg_helper.exe".into(),
                exe_path: Some(r"%USERPROFILE%\AppData\Local\Temp\bg_helper.exe".into()),
                publisher: None,
                signature_status: SignatureStatus::Unsigned,
                cpu_percent: 0.4,
                memory_mb: 24.0,
                network_count: 0,
                module_count: 18,
                event_count: 20,
                activity_delta_pct: 0.9,
                sparkline: vec![0, 0, 0, 5, 8, 6, 4, 4, 3, 2],
                is_active: false,
                is_allowlisted: false,
                first_seen_ms: Self::BASE_TS + 2_480,
                last_seen_ms: Self::BASE_TS + 45_000,
                command_line_redacted: Some(r"%USERPROFILE%\AppData\Local\Temp\bg_helper.exe --quiet".into()),
                icon_data_url: None,
            },
            ProcessSummary {
                instance_id: p_node,
                parent_instance_id: Some(p_code),
                exe_name: "node.exe".into(),
                exe_path: Some(r"C:\Program Files\nodejs\node.exe".into()),
                publisher: Some("OpenJS Foundation".into()),
                signature_status: SignatureStatus::SignedVerified,
                cpu_percent: 2.1,
                memory_mb: 210.0,
                network_count: 3,
                module_count: 48,
                event_count: 94,
                activity_delta_pct: 1.8,
                sparkline: vec![12, 16, 18, 15, 19, 22, 20, 18, 21, 19],
                is_active: true,
                is_allowlisted: true,
                first_seen_ms: Self::BASE_TS - 60_000,
                last_seen_ms: Self::BASE_TS + 115_000,
                command_line_redacted: Some("node.exe ./scripts/dev-server.mjs".into()),
                icon_data_url: None,
            },
        ]
    }

    pub fn network_connections() -> Vec<NetworkConnectionRecord> {
        let procs = Self::processes();
        let p_pwsh = &procs[4].instance_id;
        let p_code = &procs[2].instance_id;
        let p_chrome = &procs[1].instance_id;
        let p_svchost = &procs[3].instance_id;

        vec![
            NetworkConnectionRecord {
                id: "demo-net-1".into(),
                process_instance_id: p_pwsh.clone(),
                process_name: "powershell.exe".into(),
                protocol: "TCP / TLS 1.3".into(),
                local_addr: "192.168.1.24".into(),
                local_port: 54112,
                remote_addr: "104.21.4.8".into(),
                remote_port: 443,
                remote_domain: Some("cdn.updater.net".into()),
                state: "ESTABLISHED".into(),
                direction: Some("Outbound".into()),
                bytes_out: 1_468_006,
                bytes_in: 4_821_120,
                first_seen_ms: Self::BASE_TS + 2_140,
                last_seen_ms: Self::BASE_TS + 94_000,
                classification: EpistemicClassification::Confirmed,
                provenance: EvidenceProvenance {
                    source_api: "GetExtendedTcpTable (Demo Fixture)".into(),
                    collection_method: "Owning PID socket table + DNS cache correlation".into(),
                    confidence_note: "Confirmed owning PID; hostname matched local DNS resolver record".into(),
                    snapshot_only: false,
                },
            },
            NetworkConnectionRecord {
                id: "demo-net-2".into(),
                process_instance_id: p_code.clone(),
                process_name: "Code.exe".into(),
                protocol: "TCP / TLS 1.3".into(),
                local_addr: "192.168.1.24".into(),
                local_port: 53904,
                remote_addr: "140.82.114.6".into(),
                remote_port: 443,
                remote_domain: Some("api.github.com".into()),
                state: "ESTABLISHED".into(),
                direction: Some("Outbound".into()),
                bytes_out: 430_080,
                bytes_in: 1_240_900,
                first_seen_ms: Self::BASE_TS - 90_000,
                last_seen_ms: Self::BASE_TS + 118_000,
                classification: EpistemicClassification::Confirmed,
                provenance: EvidenceProvenance {
                    source_api: "GetExtendedTcpTable (Demo Fixture)".into(),
                    collection_method: "Owning PID socket table".into(),
                    confidence_note: "Confirmed owning PID".into(),
                    snapshot_only: true,
                },
            },
            NetworkConnectionRecord {
                id: "demo-net-3".into(),
                process_instance_id: p_chrome.clone(),
                process_name: "chrome.exe".into(),
                protocol: "UDP / QUIC".into(),
                local_addr: "192.168.1.24".into(),
                local_port: 61208,
                remote_addr: "142.250.190.46".into(),
                remote_port: 443,
                remote_domain: None,
                state: "ACTIVE".into(),
                direction: Some("Outbound".into()),
                bytes_out: 8_598_323,
                bytes_in: 24_110_200,
                first_seen_ms: Self::BASE_TS - 200_000,
                last_seen_ms: Self::BASE_TS + 120_000,
                classification: EpistemicClassification::Confirmed,
                provenance: EvidenceProvenance {
                    source_api: "GetExtendedUdpTable (Demo Fixture)".into(),
                    collection_method: "Owning PID UDP table (IP only — domain not reliably evidenced)".into(),
                    confidence_note: "No fabricated hostname; raw remote IP shown".into(),
                    snapshot_only: true,
                },
            },
            NetworkConnectionRecord {
                id: "demo-net-4".into(),
                process_instance_id: p_svchost.clone(),
                process_name: "svchost.exe".into(),
                protocol: "TCP / DoT".into(),
                local_addr: "192.168.1.24".into(),
                local_port: 52100,
                remote_addr: "9.9.9.9".into(),
                remote_port: 853,
                remote_domain: Some("dns.quad9.net".into()),
                state: "ESTABLISHED".into(),
                direction: Some("Outbound".into()),
                bytes_out: 18_432,
                bytes_in: 36_864,
                first_seen_ms: Self::BASE_TS - 400_000,
                last_seen_ms: Self::BASE_TS + 121_000,
                classification: EpistemicClassification::Confirmed,
                provenance: EvidenceProvenance {
                    source_api: "GetExtendedTcpTable (Demo Fixture)".into(),
                    collection_method: "Owning PID socket table".into(),
                    confidence_note: "Confirmed system DNS over TLS".into(),
                    snapshot_only: true,
                },
            },
        ]
    }

    pub fn modules_for_updater() -> Vec<ModuleRecord> {
        let p_updater = ProcessInstanceId::new("demo_boot_9f2a", 4812, Self::BASE_TS);
        let mut mods = vec![
            ModuleRecord {
                id: "demo-mod-unsigned".into(),
                process_instance_id: p_updater.clone(),
                process_name: "Update_host.exe".into(),
                module_name: "custom_hk.dll".into(),
                module_path: r"%USERPROFILE%\AppData\Local\Updater\custom_hk.dll".into(),
                signature_status: SignatureStatus::Unsigned,
                publisher: None,
                observed_ts_ms: Self::BASE_TS + 1_840,
                exact_load_time: false,
                provenance: EvidenceProvenance {
                    source_api: "CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)".into(),
                    collection_method: "Per-user module snapshot".into(),
                    confidence_note: "Observed in module snapshot (not kernel ETW image-load timestamp)".into(),
                    snapshot_only: true,
                },
            },
            ModuleRecord {
                id: "demo-mod-winhttp".into(),
                process_instance_id: p_updater.clone(),
                process_name: "Update_host.exe".into(),
                module_name: "winhttp.dll".into(),
                module_path: r"C:\Windows\System32\winhttp.dll".into(),
                signature_status: SignatureStatus::SignedVerified,
                publisher: Some("Microsoft Windows".into()),
                observed_ts_ms: Self::BASE_TS + 420,
                exact_load_time: false,
                provenance: EvidenceProvenance {
                    source_api: "CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)".into(),
                    collection_method: "Per-user module snapshot".into(),
                    confidence_note: "Microsoft Authenticode verified".into(),
                    snapshot_only: true,
                },
            },
            ModuleRecord {
                id: "demo-mod-crypt32".into(),
                process_instance_id: p_updater.clone(),
                process_name: "Update_host.exe".into(),
                module_name: "crypt32.dll".into(),
                module_path: r"C:\Windows\System32\crypt32.dll".into(),
                signature_status: SignatureStatus::SignedVerified,
                publisher: Some("Microsoft Windows".into()),
                observed_ts_ms: Self::BASE_TS + 435,
                exact_load_time: false,
                provenance: EvidenceProvenance {
                    source_api: "CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)".into(),
                    collection_method: "Per-user module snapshot".into(),
                    confidence_note: "Microsoft Authenticode verified".into(),
                    snapshot_only: true,
                },
            },
            ModuleRecord {
                id: "demo-mod-ws2".into(),
                process_instance_id: p_updater.clone(),
                process_name: "Update_host.exe".into(),
                module_name: "ws2_32.dll".into(),
                module_path: r"C:\Windows\System32\ws2_32.dll".into(),
                signature_status: SignatureStatus::SignedVerified,
                publisher: Some("Microsoft Windows".into()),
                observed_ts_ms: Self::BASE_TS + 450,
                exact_load_time: false,
                provenance: EvidenceProvenance {
                    source_api: "CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)".into(),
                    collection_method: "Per-user module snapshot".into(),
                    confidence_note: "Microsoft Authenticode verified".into(),
                    snapshot_only: true,
                },
            },
            ModuleRecord {
                id: "demo-mod-ntdll".into(),
                process_instance_id: p_updater.clone(),
                process_name: "Update_host.exe".into(),
                module_name: "ntdll.dll".into(),
                module_path: r"C:\Windows\System32\ntdll.dll".into(),
                signature_status: SignatureStatus::SignedVerified,
                publisher: Some("Microsoft Windows".into()),
                observed_ts_ms: Self::BASE_TS + 120,
                exact_load_time: false,
                provenance: EvidenceProvenance {
                    source_api: "CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)".into(),
                    collection_method: "Per-user module snapshot".into(),
                    confidence_note: "Microsoft Authenticode verified".into(),
                    snapshot_only: true,
                },
            },
        ];

        let sys_dlls = [
            "kernel32.dll", "kernelbase.dll", "ucrtbase.dll", "advapi32.dll", "sechost.dll",
            "rpcrt4.dll", "user32.dll", "win32u.dll", "gdi32.dll", "gdi32full.dll",
            "msvcp_win.dll", "shell32.dll", "shlwapi.dll", "ole32.dll", "combase.dll",
            "oleaut32.dll", "bcrypt.dll", "bcryptprimitives.dll", "ncrypt.dll", "sspicli.dll",
            "schannel.dll", "dnsapi.dll", "iphlpapi.dll", "nsi.dll", "winnsi.dll",
            "fwpuclnt.dll", "rasadhlp.dll", "mswsock.dll", "wintrust.dll", "msasn1.dll",
            "imagehlp.dll", "version.dll", "cfgmgr32.dll", "powrprof.dll", "profapi.dll",
            "userenv.dll", "uxtheme.dll",
        ];
        for (i, dll) in sys_dlls.iter().enumerate() {
            mods.push(ModuleRecord {
                id: format!("demo-mod-sys-{i}"),
                process_instance_id: p_updater.clone(),
                process_name: "Update_host.exe".into(),
                module_name: (*dll).into(),
                module_path: format!(r"C:\Windows\System32\{dll}"),
                signature_status: SignatureStatus::SignedVerified,
                publisher: Some("Microsoft Windows".into()),
                observed_ts_ms: Self::BASE_TS + 500 + (i as i64 * 8),
                exact_load_time: false,
                provenance: EvidenceProvenance {
                    source_api: "CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)".into(),
                    collection_method: "Per-user module snapshot".into(),
                    confidence_note: "Microsoft Authenticode verified".into(),
                    snapshot_only: true,
                },
            });
        }
        mods
    }

    pub fn rule_matches() -> Vec<RuleMatchRecord> {
        let procs = Self::processes();
        vec![
            RuleMatchRecord {
                id: "demo-match-1".into(),
                rule_id: "SW-001".into(),
                rule_name: "Unsigned Parent Spawning Shell".into(),
                description: "Detects when an unsigned user-space executable spawns a scripting shell (powershell.exe or cmd.exe).".into(),
                verdict: RuleVerdict::Matched,
                severity_label: "Notable Behavior".into(),
                process_instance_id: Some(procs[0].instance_id.clone()),
                process_name: Some("Update_host.exe".into()),
                matched_ts_ms: Self::BASE_TS + 1_120,
                deduplicated_count: 1,
                explanation: "Update_host.exe (Unsigned, PID 4812) spawned powershell.exe (PID 5190) with a verified parent-child OS link.".into(),
                evidence: vec![
                    "Parent: Update_host.exe (demo_boot_9f2a:4812) — Signature: Unsigned".into(),
                    "Child: powershell.exe (demo_boot_9f2a:5190) — Verified Parent PID link".into(),
                    "Note: Unsigned software is not automatically malicious; review publisher and path.".into(),
                ],
                missing_capability: None,
            },
            RuleMatchRecord {
                id: "demo-match-2".into(),
                rule_id: "SW-005".into(),
                rule_name: "Kernel DLL Injection Monitor".into(),
                description: "Monitors cross-process image loads and remote thread creation via Windows Kernel ETW.".into(),
                verdict: RuleVerdict::InsufficientCapability,
                severity_label: "Needs ETW".into(),
                process_instance_id: None,
                process_name: None,
                matched_ts_ms: Self::BASE_TS + 2_000,
                deduplicated_count: 0,
                explanation: "Requires Enhanced ETW Mode — currently running in Standard Per-User Mode.".into(),
                evidence: vec![
                    "Active privilege mode: StandardPerUser".into(),
                    "Enable Enhanced System Telemetry in Settings to activate kernel image-load tracing.".into(),
                ],
                missing_capability: Some("Microsoft-Windows-Kernel-Process / ImageLoad ETW".into()),
            },
            RuleMatchRecord {
                id: "demo-match-3".into(),
                rule_id: "SW-004".into(),
                rule_name: "Known Dev Build Toolchain".into(),
                description: "Local developer IDE spawning Node.js child process.".into(),
                verdict: RuleVerdict::Allowlisted,
                severity_label: "Allowlisted".into(),
                process_instance_id: Some(procs[2].instance_id.clone()),
                process_name: Some("Code.exe".into()),
                matched_ts_ms: Self::BASE_TS - 60_000,
                deduplicated_count: 14,
                explanation: "Code.exe -> node.exe matched allowlist rule for verified Microsoft VS Code developer toolchain.".into(),
                evidence: vec![
                    "Allowlist entry: exe_name == Code.exe".into(),
                    "Deduplicated 14 child-spawn events in current window".into(),
                ],
                missing_capability: None,
            },
        ]
    }

    pub fn behavior_graph(target_stable_key: Option<&str>) -> BehaviorGraph {
        let procs = Self::processes();
        let root = target_stable_key
            .and_then(|k| procs.iter().find(|p| p.instance_id.stable_key() == k || p.exe_name.eq_ignore_ascii_case(k)))
            .cloned()
            .unwrap_or_else(|| procs[0].clone());

        let updater_mods = Self::modules_for_updater();
        let unsigned_count = updater_mods
            .iter()
            .filter(|m| m.signature_status == SignatureStatus::Unsigned)
            .count();

        let nodes = vec![
            BehaviorNode {
                id: "node-root".into(),
                kind: GraphNodeKind::Process,
                label: root.exe_name.clone(),
                subtitle: format!(
                    "PID {} • {}",
                    root.instance_id.pid,
                    match root.signature_status {
                        SignatureStatus::SignedVerified => "Signed",
                        SignatureStatus::Unsigned => "Unsigned",
                        _ => "Unverified",
                    }
                ),
                timestamp_ms: Self::BASE_TS,
                signature_status: Some(root.signature_status),
                classification: EpistemicClassification::Confirmed,
                x: 80.0,
                y: 205.0,
                metadata: serde_json::json!({
                    "identity": root.instance_id.stable_key(),
                    "path": root.exe_path,
                    "args": root.command_line_redacted,
                    "publisher": root.publisher.clone().unwrap_or_else(|| "Unsigned Binary".into()),
                    "capability": "Per-User Native Collector (Demo Fixture)"
                }),
                modules: vec![],
            },
            BehaviorNode {
                id: "node-pwsh".into(),
                kind: GraphNodeKind::Process,
                label: "powershell.exe".into(),
                subtitle: "PID 5190 • Spawned".into(),
                timestamp_ms: Self::BASE_TS + 1_120,
                signature_status: Some(SignatureStatus::SignedVerified),
                classification: EpistemicClassification::Confirmed,
                x: 370.0,
                y: 68.0,
                metadata: serde_json::json!({
                    "identity": "demo_boot_9f2a:5190:1732611729532",
                    "parent": format!("{} (PID {})", root.exe_name, root.instance_id.pid),
                    "path": r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
                    "args": "powershell.exe -NoProfile -Command Invoke-WebRequest [REDACTED_TOKEN]",
                    "publisher": "Microsoft Windows (Valid)",
                    "capability": "Per-User Native Collector (Demo Fixture)"
                }),
                modules: vec![],
            },
            BehaviorNode {
                id: "node-net".into(),
                kind: GraphNodeKind::NetworkEndpoint,
                label: "cdn.updater.net:443 (TLS)".into(),
                subtitle: "104.21.4.8 • 1.4 MB out".into(),
                timestamp_ms: Self::BASE_TS + 2_140,
                signature_status: None,
                classification: EpistemicClassification::Confirmed,
                x: 650.0,
                y: 80.0,
                metadata: serde_json::json!({
                    "endpoint": "cdn.updater.net:443",
                    "ip": "104.21.4.8",
                    "protocol": "TCP / TLS 1.3",
                    "initiator": "powershell.exe (PID 5190)",
                    "direction": "Outbound",
                    "provenance": "Confirmed owning PID via GetExtendedTcpTable + local DNS cache"
                }),
                modules: vec![],
            },
            BehaviorNode {
                id: "node-dlls".into(),
                kind: GraphNodeKind::DllCluster,
                label: format!("DLL Cluster ({} Loaded)", updater_mods.len()),
                subtitle: format!("{} Signed • {} Unsigned", updater_mods.len() - unsigned_count, unsigned_count),
                timestamp_ms: Self::BASE_TS + 1_840,
                signature_status: Some(SignatureStatus::Unsigned),
                classification: EpistemicClassification::Confirmed,
                x: 370.0,
                y: 215.0,
                metadata: serde_json::json!({
                    "total_modules": updater_mods.len(),
                    "unsigned_modules": unsigned_count,
                    "collection_mode": "Per-User Module Snapshot (Toolhelp32)",
                    "provenance": "Observed loaded in process address space (snapshot)"
                }),
                modules: updater_mods,
            },
            BehaviorNode {
                id: "node-inferred".into(),
                kind: GraphNodeKind::Process,
                label: "bg_helper.exe (Inferred)".into(),
                subtitle: "Temporal correlation only".into(),
                timestamp_ms: Self::BASE_TS + 2_480,
                signature_status: Some(SignatureStatus::Unsigned),
                classification: EpistemicClassification::Inferred,
                x: 370.0,
                y: 365.0,
                metadata: serde_json::json!({
                    "identity": "demo_boot_9f2a:5244:1732611730892",
                    "path": r"%USERPROFILE%\AppData\Local\Temp\bg_helper.exe",
                    "args": "bg_helper.exe --quiet",
                    "publisher": "Unsigned Binary",
                    "correlation_warning": "INFERRED: No OS parent-child PID link recorded. Launched 2.48s after root process."
                }),
                modules: vec![],
            },
            BehaviorNode {
                id: "node-rule".into(),
                kind: GraphNodeKind::RuleMatch,
                label: "SW-001: Unsigned Shell Spawn".into(),
                subtitle: "Declarative Rule Match".into(),
                timestamp_ms: Self::BASE_TS + 1_250,
                signature_status: None,
                classification: EpistemicClassification::Confirmed,
                x: 650.0,
                y: 225.0,
                metadata: serde_json::json!({
                    "rule_id": "SW-001",
                    "verdict": "Matched",
                    "explanation": "Unsigned parent process spawned signed scripting shell.",
                    "note": "Informational behavior match — not an antivirus malware verdict."
                }),
                modules: vec![],
            },
        ];

        let edges = vec![
            BehaviorEdge {
                id: "edge-spawn-pwsh".into(),
                source: "node-root".into(),
                target: "node-pwsh".into(),
                label: "Spawned (Confirmed)".into(),
                timestamp_ms: Self::BASE_TS + 1_120,
                classification: EpistemicClassification::Confirmed,
                category: EventCategory::Process,
                evidence: "Confirmed OS Parent PID (4812 -> 5190) + creation timestamp".into(),
            },
            BehaviorEdge {
                id: "edge-pwsh-net".into(),
                source: "node-pwsh".into(),
                target: "node-net".into(),
                label: "TLS 1.3 :443".into(),
                timestamp_ms: Self::BASE_TS + 2_140,
                classification: EpistemicClassification::Confirmed,
                category: EventCategory::Network,
                evidence: "Confirmed owning PID 5190 in TCP socket table".into(),
            },
            BehaviorEdge {
                id: "edge-root-dlls".into(),
                source: "node-root".into(),
                target: "node-dlls".into(),
                label: "Loaded 42 DLLs".into(),
                timestamp_ms: Self::BASE_TS + 1_840,
                classification: EpistemicClassification::Confirmed,
                category: EventCategory::Module,
                evidence: "Confirmed module snapshot via Toolhelp32".into(),
            },
            BehaviorEdge {
                id: "edge-pwsh-rule".into(),
                source: "node-pwsh".into(),
                target: "node-rule".into(),
                label: "Matched SW-001".into(),
                timestamp_ms: Self::BASE_TS + 1_250,
                classification: EpistemicClassification::Confirmed,
                category: EventCategory::Rule,
                evidence: "Declarative rule engine evaluation".into(),
            },
            BehaviorEdge {
                id: "edge-inferred-bg".into(),
                source: "node-root".into(),
                target: "node-inferred".into(),
                label: "Inferred (+2.48s)".into(),
                timestamp_ms: Self::BASE_TS + 2_480,
                classification: EpistemicClassification::Inferred,
                category: EventCategory::Process,
                evidence: "INFERRED: Temporal proximity only — no OS parent-child link recorded".into(),
            },
        ];

        BehaviorGraph {
            root_process: root,
            nodes,
            edges,
            timeline_start_ms: Self::BASE_TS,
            timeline_end_ms: Self::BASE_TS + 3_200,
            mode: DataSourceMode::Demo,
        }
    }

    pub fn timeline(range: &str) -> Vec<TimelineBucket> {
        let labels_and_vals: Vec<(&str, u64, u64, u64)> = match range {
            "15M" => vec![
                ("14:08", 8, 22, 64), ("14:10", 12, 34, 88), ("14:12", 6, 28, 72),
                ("14:14", 15, 42, 110), ("14:16", 10, 38, 95), ("14:18", 18, 52, 140),
                ("14:20", 14, 46, 128), ("14:22", 12, 48, 124), ("14:24", 9, 36, 98),
            ],
            "6H" => vec![
                ("09:00", 24, 140, 420), ("10:00", 38, 210, 580), ("11:00", 31, 185, 510),
                ("12:00", 46, 260, 720), ("13:00", 34, 195, 540), ("14:00", 42, 318, 890),
            ],
            "24H" => vec![
                ("18:00", 52, 320, 940), ("22:00", 18, 110, 310), ("02:00", 8, 42, 120),
                ("06:00", 14, 88, 260), ("10:00", 64, 410, 1180), ("14:00", 48, 340, 980),
            ],
            "7D" => vec![
                ("Thu", 180, 1420, 4200), ("Fri", 210, 1680, 4850), ("Sat", 95, 780, 2100),
                ("Sun", 110, 840, 2340), ("Mon", 245, 1920, 5600), ("Tue", 220, 1740, 5120),
                ("Wed", 198, 1610, 4680),
            ],
            _ => vec![
                ("13:25", 4, 18, 62), ("13:32", 6, 26, 84), ("13:39", 5, 22, 74),
                ("13:46", 9, 36, 118), ("13:53", 7, 31, 96), ("14:00", 11, 44, 142),
                ("14:07", 8, 35, 112), ("14:14", 14, 54, 168), ("14:22", 12, 48, 124),
                ("14:28", 9, 39, 108), ("14:35", 13, 46, 134), ("14:42", 8, 32, 92),
            ],
        };

        labels_and_vals
            .into_iter()
            .enumerate()
            .map(|(i, (lbl, p, n, m))| TimelineBucket {
                timestamp_ms: Self::BASE_TS - ((12 - i as i64) * 300_000),
                label: lbl.to_string(),
                total_events: p + n + m,
                process_events: p,
                network_events: n,
                module_events: m,
                rule_events: if i == 8 { 1 } else { 0 },
            })
            .collect()
    }

    pub fn overview(range: &str) -> OverviewSnapshot {
        let apps = Self::processes();
        let timeline = Self::timeline(range);
        OverviewSnapshot {
            mode: DataSourceMode::Demo,
            privilege_mode: PrivilegeMode::StandardPerUser,
            monitoring_active: true,
            active_process_count: apps.iter().filter(|a| a.is_active).count() as u64,
            total_events_window: 1_840,
            process_spawns_count: 42,
            network_calls_count: 318,
            dll_loads_count: 1_290,
            rule_matches_count: 1,
            high_activity_apps: apps,
            timeline,
            storage: StorageDiagnostics {
                db_path: "[Isolated In-Memory Demo Fixture — Zero Disk Writes]".into(),
                wal_mode_active: true,
                db_bytes: 184 * 1024 * 1024,
                wal_bytes: 4 * 1024 * 1024,
                total_bytes: 188 * 1024 * 1024,
                cap_bytes: 512 * 1024 * 1024,
                total_events: 18_420,
                retention_window_label: "4h 12m window (Demo)".into(),
                integrity_ok: true,
            },
            collector_health_ok: true,
            dropped_events_24h: 0,
        }
    }

    pub fn sample_events() -> Vec<TelemetryEvent> {
        let procs = Self::processes();
        let p_updater = procs[0].instance_id.clone();
        let p_pwsh = procs[4].instance_id.clone();
        vec![
            TelemetryEvent::new(
                Self::BASE_TS,
                Self::BASE_TS + 12,
                CollectorSource::DemoFixture,
                EventCategory::Process,
                p_updater.clone(),
                None,
                EventPayload::ProcessLifecycle {
                    action: "started".into(),
                    exe_name: "Update_host.exe".into(),
                    exe_path: procs[0].exe_path.clone(),
                    command_line: procs[0].command_line_redacted.clone(),
                    publisher: None,
                    signature_status: SignatureStatus::Unsigned,
                    cpu_percent: 14.2,
                    memory_mb: 142.4,
                },
                CapabilityState::Active,
                EvidenceProvenance {
                    source_api: "DemoFixture".into(),
                    collection_method: "Deterministic sample fixture".into(),
                    confidence_note: "Isolated demo telemetry".into(),
                    snapshot_only: false,
                },
                EpistemicClassification::Confirmed,
                "demo-evt-1".into(),
            ),
            TelemetryEvent::new(
                Self::BASE_TS + 1_120,
                Self::BASE_TS + 1_135,
                CollectorSource::DemoFixture,
                EventCategory::Process,
                p_pwsh.clone(),
                Some(p_updater.clone()),
                EventPayload::ProcessLifecycle {
                    action: "spawned".into(),
                    exe_name: "powershell.exe".into(),
                    exe_path: procs[4].exe_path.clone(),
                    command_line: procs[4].command_line_redacted.clone(),
                    publisher: Some("Microsoft Windows".into()),
                    signature_status: SignatureStatus::SignedVerified,
                    cpu_percent: 0.8,
                    memory_mb: 68.4,
                },
                CapabilityState::Active,
                EvidenceProvenance {
                    source_api: "DemoFixture".into(),
                    collection_method: "Confirmed parent-child spawn".into(),
                    confidence_note: "Isolated demo telemetry".into(),
                    snapshot_only: false,
                },
                EpistemicClassification::Confirmed,
                "demo-evt-2".into(),
            ),
            TelemetryEvent::new(
                Self::BASE_TS + 2_140,
                Self::BASE_TS + 2_160,
                CollectorSource::DemoFixture,
                EventCategory::Network,
                p_pwsh,
                None,
                EventPayload::NetworkActivity {
                    protocol: "TCP / TLS 1.3".into(),
                    local_addr: "192.168.1.24".into(),
                    local_port: 54112,
                    remote_addr: "104.21.4.8".into(),
                    remote_port: 443,
                    remote_domain: Some("cdn.updater.net".into()),
                    state: "ESTABLISHED".into(),
                    direction: Some("Outbound".into()),
                    bytes_sent: Some(1_468_006),
                    bytes_received: Some(4_821_120),
                },
                CapabilityState::Active,
                EvidenceProvenance {
                    source_api: "DemoFixture".into(),
                    collection_method: "Socket table attribution".into(),
                    confidence_note: "Isolated demo telemetry".into(),
                    snapshot_only: false,
                },
                EpistemicClassification::Confirmed,
                "demo-evt-3".into(),
            ),
        ]
    }
}
