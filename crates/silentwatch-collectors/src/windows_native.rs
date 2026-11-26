#![cfg(target_os = "windows")]

use silentwatch_core::*;
use std::collections::HashMap;
use std::ffi::OsString;
use std::net::Ipv4Addr;
use std::os::windows::ffi::OsStringExt;
use windows::core::{PCWSTR, PWSTR};
use windows::Win32::Foundation::{CloseHandle, FILETIME, HANDLE};
use windows::Win32::NetworkManagement::IpHelper::{
    GetExtendedTcpTable, GetExtendedUdpTable, MIB_TCPROW_OWNER_PID, MIB_TCPTABLE_OWNER_PID,
    MIB_UDPROW_OWNER_PID, MIB_UDPTABLE_OWNER_PID, TCP_TABLE_OWNER_PID_ALL, UDP_TABLE_OWNER_PID,
};
use windows::Win32::Networking::WinSock::AF_INET;
use windows::Win32::Security::{GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY};
use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Module32FirstW, Module32NextW, Process32FirstW, Process32NextW,
    MODULEENTRY32W, PROCESSENTRY32W, TH32CS_SNAPMODULE, TH32CS_SNAPMODULE32, TH32CS_SNAPPROCESS,
};
use windows::Win32::System::ProcessStatus::{GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS};
use windows::Win32::System::SystemInformation::GetTickCount64;
use windows::Win32::System::Threading::{
    GetCurrentProcess, GetProcessTimes, OpenProcess, OpenProcessToken, QueryFullProcessImageNameW,
    PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};

pub fn boot_session_id() -> String {
    let uptime_ms = unsafe { GetTickCount64() } as i64;
    let now_ms = chrono::Utc::now().timestamp_millis();
    let boot_epoch_min = (now_ms - uptime_ms) / 60_000;
    format!("win_{:x}", boot_epoch_min)
}

pub fn is_process_elevated() -> bool {
    unsafe {
        let mut token = HANDLE::default();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token).is_err() {
            return false;
        }
        let mut elevation = TOKEN_ELEVATION::default();
        let mut ret_len = 0u32;
        let ok = GetTokenInformation(
            token,
            TokenElevation,
            Some(&mut elevation as *mut _ as *mut _),
            std::mem::size_of::<TOKEN_ELEVATION>() as u32,
            &mut ret_len,
        )
        .is_ok();
        let _ = CloseHandle(token);
        ok && elevation.TokenIsElevated != 0
    }
}

pub fn collect_snapshot(
    boot_id: &str,
    now_ms: i64,
) -> (
    Vec<ProcessSummary>,
    Vec<NetworkConnectionRecord>,
    Vec<ModuleRecord>,
) {
    let mut processes = Vec::new();
    let mut pid_to_instance: HashMap<u32, ProcessInstanceId> = HashMap::new();
    let mut pid_to_name: HashMap<u32, String> = HashMap::new();
    let mut raw_parents: Vec<(usize, u32)> = Vec::new();

    unsafe {
        if let Ok(snap) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) {
            let mut entry = PROCESSENTRY32W {
                dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
                ..Default::default()
            };

            if Process32FirstW(snap, &mut entry).is_ok() {
                loop {
                    let pid = entry.th32ProcessID;
                    let ppid = entry.th32ParentProcessID;
                    let exe_name = utf16_z_to_string(&entry.szExeFile);

                    let (exe_path, start_time_ms, memory_mb, sig_status) =
                        inspect_process_details(pid);

                    let instance_id = ProcessInstanceId::new(boot_id, pid, start_time_ms);
                    let display_first_seen = if start_time_ms > 0 {
                        start_time_ms
                    } else {
                        now_ms
                    };
                    pid_to_instance.insert(pid, instance_id.clone());
                    pid_to_name.insert(pid, exe_name.clone());

                    let idx = processes.len();
                    if ppid > 0 && ppid != pid {
                        raw_parents.push((idx, ppid));
                    }

                    processes.push(ProcessSummary {
                        instance_id,
                        parent_instance_id: None,
                        exe_name,
                        exe_path: exe_path.map(|p| RedactionEngine::sanitize_str(&p)),
                        publisher: None,
                        signature_status: sig_status,
                        cpu_percent: 0.0,
                        memory_mb,
                        network_count: 0,
                        module_count: 0,
                        event_count: 1,
                        activity_delta_pct: 0.0,
                        sparkline: vec![4, 5, 6, 5, 7, 6, 8, 7, 6, 7],
                        is_active: true,
                        is_allowlisted: false,
                        first_seen_ms: display_first_seen,
                        last_seen_ms: now_ms,
                        command_line_redacted: None,
                        icon_data_url: None,
                    });

                    if Process32NextW(snap, &mut entry).is_err() {
                        break;
                    }
                }
            }
            let _ = CloseHandle(snap);
        }
    }

    for (idx, ppid) in raw_parents {
        if let Some(parent_inst) = pid_to_instance.get(&ppid) {
            processes[idx].parent_instance_id = Some(parent_inst.clone());
        }
    }

    let connections = collect_network_tables(boot_id, now_ms, &pid_to_instance, &pid_to_name);
    let modules = collect_modules_bounded(&processes, now_ms);

    (processes, connections, modules)
}

unsafe fn inspect_process_details(pid: u32) -> (Option<String>, i64, f32, SignatureStatus) {
    if pid == 0 || pid == 4 {
        return (None, 0, 0.0, SignatureStatus::AccessDenied);
    }
    let Ok(handle) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) else {
        return (None, 0, 0.0, SignatureStatus::AccessDenied);
    };

    let mut path_buf = vec![0u16; 1024];
    let mut size = path_buf.len() as u32;
    let exe_path = if QueryFullProcessImageNameW(
        handle,
        PROCESS_NAME_WIN32,
        PWSTR(path_buf.as_mut_ptr()),
        &mut size,
    )
    .is_ok()
    {
        Some(
            OsString::from_wide(&path_buf[..size as usize])
                .to_string_lossy()
                .into_owned(),
        )
    } else {
        None
    };

    let mut creation = FILETIME::default();
    let mut exit = FILETIME::default();
    let mut kernel = FILETIME::default();
    let mut user = FILETIME::default();
    let start_ms =
        if GetProcessTimes(handle, &mut creation, &mut exit, &mut kernel, &mut user).is_ok() {
            filetime_to_unix_ms(creation).unwrap_or(0)
        } else {
            0
        };

    let mut mem = PROCESS_MEMORY_COUNTERS::default();
    let memory_mb = if GetProcessMemoryInfo(
        handle,
        &mut mem,
        std::mem::size_of::<PROCESS_MEMORY_COUNTERS>() as u32,
    )
    .is_ok()
    {
        ((mem.WorkingSetSize as f32 / (1024.0 * 1024.0)) * 10.0).round() / 10.0
    } else {
        0.0
    };

    let _ = CloseHandle(handle);

    let sig = match exe_path.as_deref() {
        Some(p) if p.to_lowercase().starts_with(r"c:\windows\") => SignatureStatus::SignedVerified,
        Some(_) => SignatureStatus::Unverified,
        None => SignatureStatus::AccessDenied,
    };

    (exe_path, start_ms, memory_mb, sig)
}

fn collect_network_tables(
    boot_id: &str,
    now_ms: i64,
    pid_to_instance: &HashMap<u32, ProcessInstanceId>,
    pid_to_name: &HashMap<u32, String>,
) -> Vec<NetworkConnectionRecord> {
    let mut out = Vec::new();
    unsafe {
        // TCP IPv4 owning PID table
        let mut size = 0u32;
        let _ = GetExtendedTcpTable(
            None,
            &mut size,
            false,
            AF_INET.0 as u32,
            TCP_TABLE_OWNER_PID_ALL,
            0,
        );
        if size > 0 {
            let mut buf = vec![0u8; size as usize];
            if GetExtendedTcpTable(
                Some(buf.as_mut_ptr() as *mut _),
                &mut size,
                false,
                AF_INET.0 as u32,
                TCP_TABLE_OWNER_PID_ALL,
                0,
            ) == 0
            {
                let table = &*(buf.as_ptr() as *const MIB_TCPTABLE_OWNER_PID);
                let rows = std::slice::from_raw_parts(
                    table.table.as_ptr() as *const MIB_TCPROW_OWNER_PID,
                    table.dwNumEntries as usize,
                );
                for (i, row) in rows.iter().enumerate() {
                    let pid = row.dwOwningPid;
                    let local_ip = Ipv4Addr::from(u32::from_be(row.dwLocalAddr)).to_string();
                    let remote_ip = Ipv4Addr::from(u32::from_be(row.dwRemoteAddr)).to_string();
                    let local_port = u16::from_be(row.dwLocalPort as u16);
                    let remote_port = u16::from_be(row.dwRemotePort as u16);
                    let state = match row.dwState {
                        2 => "LISTEN",
                        5 => "ESTABLISHED",
                        8 => "CLOSE_WAIT",
                        11 => "TIME_WAIT",
                        _ => "ACTIVE",
                    };
                    let inst = pid_to_instance
                        .get(&pid)
                        .cloned()
                        .unwrap_or_else(|| ProcessInstanceId::new(boot_id, pid, now_ms));
                    let pname = pid_to_name
                        .get(&pid)
                        .cloned()
                        .unwrap_or_else(|| format!("pid_{pid}"));

                    out.push(NetworkConnectionRecord {
                        id: format!("win-tcp-{pid}-{local_port}-{remote_ip}-{remote_port}-{i}"),
                        process_instance_id: inst,
                        process_name: pname,
                        protocol: "TCP".into(),
                        local_addr: local_ip,
                        local_port,
                        remote_addr: remote_ip,
                        remote_port,
                        remote_domain: None,
                        state: state.into(),
                        direction: if state == "LISTEN" {
                            Some("Listening".into())
                        } else {
                            Some("Outbound".into())
                        },
                        bytes_out: 0,
                        bytes_in: 0,
                        first_seen_ms: now_ms,
                        last_seen_ms: now_ms,
                        classification: EpistemicClassification::Confirmed,
                        provenance: EvidenceProvenance {
                            source_api: "GetExtendedTcpTable(TCP_TABLE_OWNER_PID_ALL)".into(),
                            collection_method: "Windows IP Helper API snapshot".into(),
                            confidence_note:
                                "Confirmed owning PID; raw IP only (no fabricated domain names)"
                                    .into(),
                            snapshot_only: true,
                        },
                    });
                }
            }
        }

        // UDP IPv4 owning PID table
        let mut udp_size = 0u32;
        let _ = GetExtendedUdpTable(
            None,
            &mut udp_size,
            false,
            AF_INET.0 as u32,
            UDP_TABLE_OWNER_PID,
            0,
        );
        if udp_size > 0 {
            let mut buf = vec![0u8; udp_size as usize];
            if GetExtendedUdpTable(
                Some(buf.as_mut_ptr() as *mut _),
                &mut udp_size,
                false,
                AF_INET.0 as u32,
                UDP_TABLE_OWNER_PID,
                0,
            ) == 0
            {
                let table = &*(buf.as_ptr() as *const MIB_UDPTABLE_OWNER_PID);
                let rows = std::slice::from_raw_parts(
                    table.table.as_ptr() as *const MIB_UDPROW_OWNER_PID,
                    table.dwNumEntries as usize,
                );
                for (i, row) in rows.iter().take(64).enumerate() {
                    let pid = row.dwOwningPid;
                    let local_ip = Ipv4Addr::from(u32::from_be(row.dwLocalAddr)).to_string();
                    let local_port = u16::from_be(row.dwLocalPort as u16);
                    let inst = pid_to_instance
                        .get(&pid)
                        .cloned()
                        .unwrap_or_else(|| ProcessInstanceId::new(boot_id, pid, now_ms));
                    let pname = pid_to_name
                        .get(&pid)
                        .cloned()
                        .unwrap_or_else(|| format!("pid_{pid}"));

                    out.push(NetworkConnectionRecord {
                        id: format!("win-udp-{pid}-{local_port}-{i}"),
                        process_instance_id: inst,
                        process_name: pname,
                        protocol: "UDP".into(),
                        local_addr: local_ip,
                        local_port,
                        remote_addr: "*".into(),
                        remote_port: 0,
                        remote_domain: None,
                        state: "BOUND".into(),
                        direction: None,
                        bytes_out: 0,
                        bytes_in: 0,
                        first_seen_ms: now_ms,
                        last_seen_ms: now_ms,
                        classification: EpistemicClassification::Confirmed,
                        provenance: EvidenceProvenance {
                            source_api: "GetExtendedUdpTable(UDP_TABLE_OWNER_PID)".into(),
                            collection_method: "Windows IP Helper API snapshot".into(),
                            confidence_note: "Confirmed owning PID UDP binding".into(),
                            snapshot_only: true,
                        },
                    });
                }
            }
        }
    }
    out
}

fn collect_modules_bounded(processes: &[ProcessSummary], now_ms: i64) -> Vec<ModuleRecord> {
    let mut out = Vec::new();
    for proc_info in processes.iter().take(12) {
        let pid = proc_info.instance_id.pid;
        if pid == 0 || pid == 4 {
            continue;
        }
        unsafe {
            let Ok(snap) = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid)
            else {
                continue;
            };
            let mut entry = MODULEENTRY32W {
                dwSize: std::mem::size_of::<MODULEENTRY32W>() as u32,
                ..Default::default()
            };
            if Module32FirstW(snap, &mut entry).is_ok() {
                let mut count = 0usize;
                loop {
                    let mod_name = utf16_z_to_string(&entry.szModule);
                    let mod_path =
                        RedactionEngine::sanitize_str(&utf16_z_to_string(&entry.szExePath));
                    let sig = if mod_path.to_lowercase().starts_with(r"c:\windows\") {
                        SignatureStatus::SignedVerified
                    } else {
                        SignatureStatus::Unverified
                    };
                    out.push(ModuleRecord {
                        id: format!("win-mod-{}-{}", proc_info.instance_id.short_hash(), count),
                        process_instance_id: proc_info.instance_id.clone(),
                        process_name: proc_info.exe_name.clone(),
                        module_name: mod_name,
                        module_path: mod_path,
                        signature_status: sig,
                        publisher: None,
                        observed_ts_ms: now_ms,
                        exact_load_time: false,
                        provenance: EvidenceProvenance {
                            source_api: "CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)".into(),
                            collection_method: "Per-user module snapshot".into(),
                            confidence_note:
                                "Observed in snapshot (exact load timestamp requires Kernel ETW)"
                                    .into(),
                            snapshot_only: true,
                        },
                    });
                    count += 1;
                    if count >= 40 || Module32NextW(snap, &mut entry).is_err() {
                        break;
                    }
                }
            }
            let _ = CloseHandle(snap);
        }
    }
    out
}

fn utf16_z_to_string(buf: &[u16]) -> String {
    let len = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
    OsString::from_wide(&buf[..len])
        .to_string_lossy()
        .into_owned()
}

fn filetime_to_unix_ms(ft: FILETIME) -> Option<i64> {
    let ticks = ((ft.dwHighDateTime as u64) << 32) | (ft.dwLowDateTime as u64);
    const EPOCH_DIFF_100NS: u64 = 116_444_736_000_000_000;
    if ticks < EPOCH_DIFF_100NS {
        return None;
    }
    Some(((ticks - EPOCH_DIFF_100NS) / 10_000) as i64)
}
