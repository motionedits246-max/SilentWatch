use chrono::Utc;
use silentwatch_core::*;
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use sysinfo::{ProcessesToUpdate, System};

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
    sys: Arc<Mutex<System>>,
    queue_capacity: usize,
}

impl CollectorRuntime {
    pub fn new(privilege_mode: PrivilegeMode) -> Self {
        let mut sys = System::new_all();
        sys.refresh_processes(ProcessesToUpdate::All, true);
        Self {
            boot_id: compute_boot_session_id(),
            active: Arc::new(AtomicBool::new(false)),
            privilege_mode: Arc::new(Mutex::new(privilege_mode)),
            dropped_events: Arc::new(AtomicU64::new(0)),
            restarts: Arc::new(AtomicU64::new(0)),
            seen_pids: Arc::new(Mutex::new(HashMap::new())),
            sys: Arc::new(Mutex::new(sys)),
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
                    name: "Process Lifecycle & CPU/RAM".into(),
                    description: "Real-time CPU, RAM, and parent-child telemetry.".into(),
                    state: if active {
                        CapabilityState::Active
                    } else {
                        CapabilityState::Stopped
                    },
                    source: CollectorSource::WindowsToolhelpProcess,
                    requires_elevation: false,
                    limitations: "System PPL paths need elevation.".into(),
                },
                CollectorCapability {
                    id: "network_sockets".into(),
                    name: "TCP/UDP Socket Attribution".into(),
                    description: "Owning-process endpoint mapping.".into(),
                    state: if active {
                        CapabilityState::Active
                    } else {
                        CapabilityState::Stopped
                    },
                    source: CollectorSource::WindowsIpHelperNetwork,
                    requires_elevation: false,
                    limitations: "Zero payload inspection.".into(),
                },
                CollectorCapability {
                    id: "modules_snapshot".into(),
                    name: "Loaded DLL Snapshots".into(),
                    description: "Per-user module enumeration.".into(),
                    state: if active {
                        CapabilityState::Active
                    } else {
                        CapabilityState::Stopped
                    },
                    source: CollectorSource::WindowsToolhelpModule,
                    requires_elevation: false,
                    limitations: "Snapshot observation timestamps.".into(),
                },
                CollectorCapability {
                    id: "etw_kernel_process".into(),
                    name: "Kernel ETW Tracing".into(),
                    description: "Kernel process & image-load events.".into(),
                    state: etw_state,
                    source: CollectorSource::WindowsEtwKernelProcess,
                    requires_elevation: true,
                    limitations: if elevated {
                        "Elevated ETW active.".into()
                    } else {
                        "Requires optional UAC elevation.".into()
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
                    name: "Process Lifecycle & CPU/RAM".into(),
                    description: "Live OS CPU, RAM, and process tree.".into(),
                    state: if active {
                        CapabilityState::Active
                    } else {
                        CapabilityState::Stopped
                    },
                    source: CollectorSource::LinuxProcFallback,
                    requires_elevation: false,
                    limitations: "Linux host fallback.".into(),
                },
                CollectorCapability {
                    id: "network_sockets".into(),
                    name: "TCP Socket Table".into(),
                    description: "Local TCP socket table.".into(),
                    state: if active {
                        CapabilityState::Degraded
                    } else {
                        CapabilityState::Stopped
                    },
                    source: CollectorSource::LinuxProcFallback,
                    requires_elevation: false,
                    limitations: "Snapshot polling.".into(),
                },
                CollectorCapability {
                    id: "modules_snapshot".into(),
                    name: "Loaded Modules".into(),
                    description: "Mapped shared libraries.".into(),
                    state: if active {
                        CapabilityState::Degraded
                    } else {
                        CapabilityState::Stopped
                    },
                    source: CollectorSource::LinuxProcFallback,
                    requires_elevation: false,
                    limitations: "Authenticode is Windows-only.".into(),
                },
                CollectorCapability {
                    id: "etw_kernel_process".into(),
                    name: "Kernel ETW Tracing".into(),
                    description: "Windows ETW kernel providers.".into(),
                    state: CapabilityState::ElevationRequired,
                    source: CollectorSource::WindowsEtwKernelProcess,
                    requires_elevation: true,
                    limitations: "Windows UAC required.".into(),
                },
            ]
        }
    }

    pub fn collect_once(&self) -> CollectionCycleOutput {
        let now_ms = Utc::now().timestamp_millis();

        #[cfg(target_os = "windows")]
        let (mut processes, connections, modules) =
            windows_native::collect_snapshot(&self.boot_id, now_ms);

        #[cfg(not(target_os = "windows"))]
        let (mut processes, connections, modules) =
            linux_proc::collect_snapshot(&self.boot_id, now_ms);

        // Enrich EVERY process with real live CPU % and real RAM MB from sysinfo
        if let Ok(mut sys) = self.sys.lock() {
            sys.refresh_processes(ProcessesToUpdate::All, true);
            let cpu_count = sys.cpus().len().max(1) as f32;
            let mut metrics: HashMap<u32, (f32, f32, Option<String>)> = HashMap::new();
            for (pid, proc_info) in sys.processes() {
                let cpu_pct = ((proc_info.cpu_usage() / cpu_count) * 10.0).round() / 10.0;
                let mem_mb =
                    ((proc_info.memory() as f32 / (1024.0 * 1024.0)) * 10.0).round() / 10.0;
                let exe = proc_info
                    .exe()
                    .map(|p| RedactionEngine::sanitize_str(&p.display().to_string()));
                metrics.insert(pid.as_u32(), (cpu_pct.clamp(0.0, 100.0), mem_mb, exe));
            }
            for p in &mut processes {
                if let Some((cpu, mem, exe)) = metrics.get(&p.instance_id.pid) {
                    p.cpu_percent = *cpu;
                    if *mem > 0.0 {
                        p.memory_mb = *mem;
                    }
                    if p.exe_path.is_none() {
                        p.exe_path = exe.clone();
                    }
                    p.activity_delta_pct = (*cpu).max(0.1);
                }
            }
        }

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
                            collection_method: "Process snapshot + live CPU/RAM counter".into(),
                            confidence_note: "Confirmed OS process observation".into(),
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
                        confidence_note: "Process exited".into(),
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
        "Toolhelp32 + sysinfo CPU/RAM"
    }
    #[cfg(not(target_os = "windows"))]
    {
        "/proc + sysinfo CPU/RAM"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn collects_live_os_processes_with_real_memory_and_honest_capabilities() {
        let rt = CollectorRuntime::new(PrivilegeMode::StandardPerUser);
        rt.start();
        assert!(rt.is_active());
        let caps = rt.capabilities();
        assert!(!caps.is_empty());

        let cycle = rt.collect_once();
        assert!(!cycle.processes.is_empty());
        assert!(cycle.processes.iter().any(|p| p.memory_mb > 0.0));
    }
}
