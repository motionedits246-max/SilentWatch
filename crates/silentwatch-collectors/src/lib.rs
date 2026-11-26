use chrono::Utc;
use silentwatch_core::*;
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

#[cfg(target_os = "windows")]
mod windows_native;

#[cfg(not(target_os = "windows"))]
mod linux_proc;

#[derive(Debug, Clone, Default)]
pub struct CollectionCycleOutput {
    pub processes: Vec<ProcessSummary>,
    pub connections: Vec<NetworkConnectionRecord>,
    pub modules: Vec<ModuleRecord>,
    pub events: Vec<TelemetryEvent>,
}

pub struct CollectorRuntime {
    boot_id: String,
    active: Arc<AtomicBool>,
    privilege_mode: Arc<Mutex<PrivilegeMode>>,
    dropped_events: Arc<AtomicU64>,
    restarts: Arc<AtomicU64>,
    seen_pids: Arc<Mutex<HashMap<u32, ProcessInstanceId>>>,
    queue_capacity: usize,
}

impl CollectorRuntime {
    pub fn new(privilege_mode: PrivilegeMode) -> Self {
        Self {
            boot_id: compute_boot_session_id(),
            active: Arc::new(AtomicBool::new(false)),
            privilege_mode: Arc::new(Mutex::new(privilege_mode)),
            dropped_events: Arc::new(AtomicU64::new(0)),
            restarts: Arc::new(AtomicU64::new(0)),
            seen_pids: Arc::new(Mutex::new(HashMap::new())),
            queue_capacity: 2048,
        }
    }

    pub fn is_active(&self) -> bool {
        self.active.load(Ordering::SeqCst)
    }

    pub fn start(&self) {
        self.active.store(true, Ordering::SeqCst);
    }

    pub fn stop(&self) {
        self.active.store(false, Ordering::SeqCst);
    }

    pub fn set_privilege_mode(&self, mode: PrivilegeMode) {
        if let Ok(mut guard) = self.privilege_mode.lock() {
            *guard = mode;
        }
    }

    pub fn privilege_mode(&self) -> PrivilegeMode {
        self.privilege_mode
            .lock()
            .map(|g| *g)
            .unwrap_or(PrivilegeMode::StandardPerUser)
    }

    pub fn dropped_events(&self) -> u64 {
        self.dropped_events.load(Ordering::Relaxed)
    }

    pub fn record_dropped(&self, count: u64) {
        self.dropped_events.fetch_add(count, Ordering::Relaxed);
    }

    pub fn restarts(&self) -> u64 {
        self.restarts.load(Ordering::Relaxed)
    }

    pub fn record_restart(&self) {
        self.restarts.fetch_add(1, Ordering::Relaxed);
    }

    pub fn queue_capacity(&self) -> usize {
        self.queue_capacity
    }

    pub fn boot_id(&self) -> &str {
        &self.boot_id
    }

    pub fn capabilities(&self) -> Vec<CollectorCapability> {
        let mode = self.privilege_mode();
        let active = self.is_active();

        #[cfg(target_os = "windows")]
        {
            let elevated = windows_native::is_process_elevated();
            let etw_state = if !active {
                CapabilityState::Stopped
            } else if mode == PrivilegeMode::EnhancedEtw && elevated {
                CapabilityState::Active
            } else {
                CapabilityState::ElevationRequired
            };

            vec![
                CollectorCapability {
                    id: "process_lifecycle".into(),
                    name: "Per-User Process Lifecycle".into(),
                    description: "Captures process creation, termination, parent-child links, paths, and resource usage via Windows Toolhelp32 & Process APIs.".into(),
                    state: if active { CapabilityState::Active } else { CapabilityState::Stopped },
                    source: CollectorSource::WindowsToolhelpProcess,
                    requires_elevation: false,
                    limitations: "Protected system processes (PPL) return AccessDenied for full paths without elevation.".into(),
                },
                CollectorCapability {
                    id: "network_sockets".into(),
                    name: "TCP/UDP Socket Attribution".into(),
                    description: "Maps active TCP/UDP endpoints to owning process instances via IP Helper API (GetExtendedTcpTable / GetExtendedUdpTable).".into(),
                    state: if active { CapabilityState::Active } else { CapabilityState::Stopped },
                    source: CollectorSource::WindowsIpHelperNetwork,
                    requires_elevation: false,
                    limitations: "Snapshot-based polling may miss sub-second short-lived connections. Never inspects packet payloads.".into(),
                },
                CollectorCapability {
                    id: "modules_snapshot".into(),
                    name: "Per-User DLL / Module Snapshots".into(),
                    description: "Enumerates loaded DLL modules and Authenticode signatures for accessible processes.".into(),
                    state: if active { CapabilityState::Active } else { CapabilityState::Stopped },
                    source: CollectorSource::WindowsToolhelpModule,
                    requires_elevation: false,
                    limitations: "Reports snapshot observation time rather than exact kernel image-load timestamp.".into(),
                },
                CollectorCapability {
                    id: "etw_kernel_process".into(),
                    name: "Kernel ETW Process & Image Loads".into(),
                    description: "Real-time Microsoft-Windows-Kernel-Process and ImageLoad ETW tracing for exact timestamps and cross-user visibility.".into(),
                    state: etw_state,
                    source: CollectorSource::WindowsEtwKernelProcess,
                    requires_elevation: true,
                    limitations: if elevated {
                        "Active with explicit Administrator elevation.".into()
                    } else {
                        "Requires explicit UAC elevation when enabled by user.".into()
                    },
                },
            ]
        }

        #[cfg(not(target_os = "windows"))]
        {
            let _ = mode;
            vec![
                CollectorCapability {
                    id: "process_lifecycle".into(),
                    name: "Local Process Lifecycle (/proc fallback)".into(),
                    description: "Reads live local OS processes from /proc for cross-platform verification and testing.".into(),
                    state: if active { CapabilityState::Active } else { CapabilityState::Stopped },
                    source: CollectorSource::LinuxProcFallback,
                    requires_elevation: false,
                    limitations: "Running on Linux development host; Windows Toolhelp32/WinVerifyTrust APIs activate on Windows builds.".into(),
                },
                CollectorCapability {
                    id: "network_sockets".into(),
                    name: "Local TCP Socket Table (/proc/net)".into(),
                    description: "Reads local TCP socket table on Linux hosts; Windows uses GetExtendedTcpTable.".into(),
                    state: if active { CapabilityState::Degraded } else { CapabilityState::Stopped },
                    source: CollectorSource::LinuxProcFallback,
                    requires_elevation: false,
                    limitations: "Snapshot polling; Windows IP Helper API provides full per-PID attribution on Windows.".into(),
                },
                CollectorCapability {
                    id: "modules_snapshot".into(),
                    name: "Loaded Module Enumeration".into(),
                    description: "Inspects mapped shared libraries for current-user processes.".into(),
                    state: if active { CapabilityState::Degraded } else { CapabilityState::Stopped },
                    source: CollectorSource::LinuxProcFallback,
                    requires_elevation: false,
                    limitations: "Authenticode signature verification is Windows-only.".into(),
                },
                CollectorCapability {
                    id: "etw_kernel_process".into(),
                    name: "Kernel ETW DLL & Cross-User Telemetry".into(),
                    description: "Windows Event Tracing (ETW) kernel providers.".into(),
                    state: CapabilityState::ElevationRequired,
                    source: CollectorSource::WindowsEtwKernelProcess,
                    requires_elevation: true,
                    limitations: "Requires Windows host with user-approved UAC elevation.".into(),
                },
            ]
        }
    }

    pub fn collect_once(&self) -> CollectionCycleOutput {
        let now_ms = Utc::now().timestamp_millis();

        #[cfg(target_os = "windows")]
        let (mut processes, connections, modules) = windows_native::collect_snapshot(&self.boot_id, now_ms);

        #[cfg(not(target_os = "windows"))]
        let (mut processes, connections, modules) = linux_proc::collect_snapshot(&self.boot_id, now_ms);

        let mut events = Vec::new();
        let current_pids: HashSet<u32> = processes.iter().map(|p| p.instance_id.pid).collect();

        if let Ok(mut seen) = self.seen_pids.lock() {
            for p in &processes {
                let is_new_instance = match seen.get(&p.instance_id.pid) {
                    Some(prev) => prev != &p.instance_id,
                    None => true,
                };
                if is_new_instance {
                    seen.insert(p.instance_id.pid, p.instance_id.clone());
                    let dedup_key = format!("proc_start:{}", p.instance_id.stable_key());
                    events.push(TelemetryEvent::new(
                        p.first_seen_ms,
                        now_ms,
                        platform_process_source(),
                        EventCategory::Process,
                        p.instance_id.clone(),
                        p.parent_instance_id.clone(),
                        EventPayload::ProcessLifecycle {
                            action: "observed_start".into(),
                            exe_name: p.exe_name.clone(),
                            exe_path: p.exe_path.clone(),
                            command_line: p.command_line_redacted.clone(),
                            publisher: p.publisher.clone(),
                            signature_status: p.signature_status,
                            cpu_percent: p.cpu_percent,
                            memory_mb: p.memory_mb,
                        },
                        CapabilityState::Active,
                        EvidenceProvenance {
                            source_api: platform_process_api().into(),
                            collection_method: "Process snapshot diff with boot+pid+start_time identity".into(),
                            confidence_note: "Confirmed OS process table observation".into(),
                            snapshot_only: true,
                        },
                        EpistemicClassification::Confirmed,
                        dedup_key,
                    ));
                }
            }

            let terminated: Vec<(u32, ProcessInstanceId)> = seen
                .iter()
                .filter(|(pid, _)| !current_pids.contains(pid))
                .map(|(pid, inst)| (*pid, inst.clone()))
                .collect();

            for (pid, inst) in terminated {
                seen.remove(&pid);
                let dedup_key = format!("proc_exit:{}:{}", inst.stable_key(), now_ms / 1000);
                events.push(TelemetryEvent::new(
                    now_ms,
                    now_ms,
                    platform_process_source(),
                    EventCategory::Process,
                    inst.clone(),
                    None,
                    EventPayload::ProcessLifecycle {
                        action: "terminated".into(),
                        exe_name: format!("pid_{}", pid),
                        exe_path: None,
                        command_line: None,
                        publisher: None,
                        signature_status: SignatureStatus::Unknown,
                        cpu_percent: 0.0,
                        memory_mb: 0.0,
                    },
                    CapabilityState::Active,
                    EvidenceProvenance {
                        source_api: platform_process_api().into(),
                        collection_method: "Process snapshot lifecycle diff".into(),
                        confidence_note: "Process absent in subsequent OS snapshot".into(),
                        snapshot_only: true,
                    },
                    EpistemicClassification::Confirmed,
                    dedup_key,
                ));
            }
        }

        for c in connections.iter().take(128) {
            let dedup_key = format!(
                "net:{}:{}:{}:{}",
                c.process_instance_id.stable_key(),
                c.protocol,
                c.remote_addr,
                c.remote_port
            );
            events.push(TelemetryEvent::new(
                c.first_seen_ms,
                now_ms,
                platform_network_source(),
                EventCategory::Network,
                c.process_instance_id.clone(),
                None,
                EventPayload::NetworkActivity {
                    protocol: c.protocol.clone(),
                    local_addr: c.local_addr.clone(),
                    local_port: c.local_port,
                    remote_addr: c.remote_addr.clone(),
                    remote_port: c.remote_port,
                    remote_domain: c.remote_domain.clone(),
                    state: c.state.clone(),
                    direction: c.direction.clone(),
                    bytes_sent: Some(c.bytes_out),
                    bytes_received: Some(c.bytes_in),
                },
                CapabilityState::Active,
                c.provenance.clone(),
                c.classification,
                dedup_key,
            ));
        }

        if events.len() > self.queue_capacity {
            let overflow = (events.len() - self.queue_capacity) as u64;
            self.record_dropped(overflow);
            events.truncate(self.queue_capacity);
        }

        processes.sort_by(|a, b| {
            b.cpu_percent
                .partial_cmp(&a.cpu_percent)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| {
                    b.memory_mb
                        .partial_cmp(&a.memory_mb)
                        .unwrap_or(std::cmp::Ordering::Equal)
                })
        });

        CollectionCycleOutput {
            processes,
            connections,
            modules,
            events,
        }
    }
}

fn compute_boot_session_id() -> String {
    #[cfg(target_os = "windows")]
    {
        windows_native::boot_session_id()
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::fs::read_to_string("/proc/sys/kernel/random/boot_id")
            .ok()
            .map(|s| format!("boot_{}", s.trim().chars().take(8).collect::<String>()))
            .unwrap_or_else(|| "boot_local".into())
    }
}

fn platform_process_source() -> CollectorSource {
    #[cfg(target_os = "windows")]
    {
        CollectorSource::WindowsToolhelpProcess
    }
    #[cfg(not(target_os = "windows"))]
    {
        CollectorSource::LinuxProcFallback
    }
}

fn platform_network_source() -> CollectorSource {
    #[cfg(target_os = "windows")]
    {
        CollectorSource::WindowsIpHelperNetwork
    }
    #[cfg(not(target_os = "windows"))]
    {
        CollectorSource::LinuxProcFallback
    }
}

fn platform_process_api() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        "CreateToolhelp32Snapshot + QueryFullProcessImageNameW"
    }
    #[cfg(not(target_os = "windows"))]
    {
        "/proc filesystem (Linux development host)"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn collects_live_os_processes_and_reports_honest_capabilities() {
        let rt = CollectorRuntime::new(PrivilegeMode::StandardPerUser);
        rt.start();
        assert!(rt.is_active());
        let caps = rt.capabilities();
        assert!(!caps.is_empty());
        assert!(caps.iter().any(|c| c.requires_elevation));

        let cycle = rt.collect_once();
        assert!(!cycle.processes.is_empty());
        assert!(!cycle.events.is_empty());

        let second = rt.collect_once();
        assert!(second.events.len() <= cycle.events.len());
    }
}
