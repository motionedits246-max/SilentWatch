import type {
  AllowlistEntry,
  AppSettings,
  BehaviorGraph,
  DataSourceMode,
  ExportRequest,
  ExportResult,
  ModuleRecord,
  NetworkConnectionRecord,
  OverviewSnapshot,
  ProcessSummary,
  RuleMatchRecord,
  SystemStatusSnapshot,
  TelemetryEvent,
  TimelineBucket,
} from '@/types/telemetry';
import { formatStableKey } from '@/types/telemetry';

const STORAGE_KEY = 'silentwatch_preview_settings_v1';
const BASE_TS = 1732611728412;

const DEFAULT_SETTINGS: AppSettings = {
  onboarding_completed: false,
  privilege_mode: 'standard_per_user',
  data_source_mode: 'live',
  motion_tier: 'full',
  ring_buffer_cap_mb: 512,
  retention_hours: 24,
  close_behavior: 'hide_to_tray',
  start_minimized_to_tray: false,
  collect_command_line_sanitized: true,
  collect_module_snapshots: true,
  shortcuts: {
    command_palette: 'Ctrl+K',
    export_report: 'Ctrl+E',
    toggle_monitoring: 'Ctrl+Shift+M',
  },
};

function makeProcesses(prefix: string): ProcessSummary[] {
  const pUpdater = { boot_id: prefix, pid: 4812, start_time_ms: BASE_TS };
  const pChrome = { boot_id: prefix, pid: 2104, start_time_ms: BASE_TS - 320000 };
  const pCode = { boot_id: prefix, pid: 6018, start_time_ms: BASE_TS - 180000 };
  const pSvchost = { boot_id: prefix, pid: 1044, start_time_ms: BASE_TS - 900000 };
  const pPwsh = { boot_id: prefix, pid: 5190, start_time_ms: BASE_TS + 1120 };
  const pBg = { boot_id: prefix, pid: 5244, start_time_ms: BASE_TS + 2480 };
  const pNode = { boot_id: prefix, pid: 6380, start_time_ms: BASE_TS - 60000 };

  return [
    {
      instance_id: pUpdater,
      parent_instance_id: null,
      exe_name: 'Update_host.exe',
      exe_path: '%USERPROFILE%\\AppData\\Local\\Updater\\Update_host.exe',
      publisher: null,
      signature_status: 'unsigned',
      cpu_percent: 14.2,
      memory_mb: 142.4,
      network_count: 4,
      module_count: 42,
      event_count: 418,
      activity_delta_pct: 14.2,
      sparkline: [12, 18, 22, 35, 64, 58, 72, 68, 84, 79],
      is_active: true,
      is_allowlisted: false,
      first_seen_ms: BASE_TS,
      last_seen_ms: BASE_TS + 121588,
      command_line_redacted:
        '%USERPROFILE%\\AppData\\Local\\Updater\\Update_host.exe --channel=stable --token=[REDACTED_SECRET]',
      icon_data_url: null,
    },
    {
      instance_id: pChrome,
      parent_instance_id: null,
      exe_name: 'chrome.exe',
      exe_path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      publisher: 'Google LLC',
      signature_status: 'signed_verified',
      cpu_percent: 8.1,
      memory_mb: 1240.0,
      network_count: 28,
      module_count: 118,
      event_count: 892,
      activity_delta_pct: 8.1,
      sparkline: [40, 44, 42, 48, 52, 49, 55, 53, 57, 61],
      is_active: true,
      is_allowlisted: false,
      first_seen_ms: BASE_TS - 320000,
      last_seen_ms: BASE_TS + 121000,
      command_line_redacted: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe --profile-directory=Default',
      icon_data_url: null,
    },
    {
      instance_id: pCode,
      parent_instance_id: null,
      exe_name: 'Code.exe',
      exe_path: '%USERPROFILE%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
      publisher: 'Microsoft Corporation',
      signature_status: 'signed_verified',
      cpu_percent: 4.3,
      memory_mb: 860.5,
      network_count: 12,
      module_count: 96,
      event_count: 310,
      activity_delta_pct: 4.3,
      sparkline: [22, 25, 24, 28, 30, 29, 34, 33, 35, 38],
      is_active: true,
      is_allowlisted: true,
      first_seen_ms: BASE_TS - 180000,
      last_seen_ms: BASE_TS + 120000,
      command_line_redacted: '%USERPROFILE%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
      icon_data_url: null,
    },
    {
      instance_id: pSvchost,
      parent_instance_id: null,
      exe_name: 'svchost.exe',
      exe_path: 'C:\\Windows\\System32\\svchost.exe',
      publisher: 'Microsoft Windows',
      signature_status: 'signed_verified',
      cpu_percent: 1.2,
      memory_mb: 94.2,
      network_count: 6,
      module_count: 64,
      event_count: 124,
      activity_delta_pct: 1.2,
      sparkline: [10, 11, 10, 12, 11, 12, 13, 12, 11, 12],
      is_active: true,
      is_allowlisted: true,
      first_seen_ms: BASE_TS - 900000,
      last_seen_ms: BASE_TS + 120000,
      command_line_redacted: 'C:\\Windows\\System32\\svchost.exe -k NetworkService',
      icon_data_url: null,
    },
    {
      instance_id: pPwsh,
      parent_instance_id: pUpdater,
      exe_name: 'powershell.exe',
      exe_path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      publisher: 'Microsoft Windows',
      signature_status: 'signed_verified',
      cpu_percent: 0.8,
      memory_mb: 68.4,
      network_count: 2,
      module_count: 54,
      event_count: 76,
      activity_delta_pct: 2.6,
      sparkline: [0, 0, 14, 38, 22, 16, 12, 10, 8, 6],
      is_active: true,
      is_allowlisted: false,
      first_seen_ms: BASE_TS + 1120,
      last_seen_ms: BASE_TS + 96000,
      command_line_redacted:
        "powershell.exe -NoProfile -Command Invoke-WebRequest -Headers @{Authorization='Bearer [REDACTED_TOKEN]'}",
      icon_data_url: null,
    },
    {
      instance_id: pBg,
      parent_instance_id: null,
      exe_name: 'bg_helper.exe',
      exe_path: '%USERPROFILE%\\AppData\\Local\\Temp\\bg_helper.exe',
      publisher: null,
      signature_status: 'unsigned',
      cpu_percent: 0.4,
      memory_mb: 24.0,
      network_count: 0,
      module_count: 18,
      event_count: 20,
      activity_delta_pct: 0.9,
      sparkline: [0, 0, 0, 5, 8, 6, 4, 4, 3, 2],
      is_active: false,
      is_allowlisted: false,
      first_seen_ms: BASE_TS + 2480,
      last_seen_ms: BASE_TS + 45000,
      command_line_redacted: '%USERPROFILE%\\AppData\\Local\\Temp\\bg_helper.exe --quiet',
      icon_data_url: null,
    },
    {
      instance_id: pNode,
      parent_instance_id: pCode,
      exe_name: 'node.exe',
      exe_path: 'C:\\Program Files\\nodejs\\node.exe',
      publisher: 'OpenJS Foundation',
      signature_status: 'signed_verified',
      cpu_percent: 2.1,
      memory_mb: 210.0,
      network_count: 3,
      module_count: 48,
      event_count: 94,
      activity_delta_pct: 1.8,
      sparkline: [12, 16, 18, 15, 19, 22, 20, 18, 21, 19],
      is_active: true,
      is_allowlisted: true,
      first_seen_ms: BASE_TS - 60000,
      last_seen_ms: BASE_TS + 115000,
      command_line_redacted: 'node.exe ./scripts/dev-server.mjs',
      icon_data_url: null,
    },
  ];
}

function makeModules(prefix: string): ModuleRecord[] {
  const pid = { boot_id: prefix, pid: 4812, start_time_ms: BASE_TS };
  const base: ModuleRecord[] = [
    {
      id: 'mod-custom-hk',
      process_instance_id: pid,
      process_name: 'Update_host.exe',
      module_name: 'custom_hk.dll',
      module_path: '%USERPROFILE%\\AppData\\Local\\Updater\\custom_hk.dll',
      signature_status: 'unsigned',
      publisher: null,
      observed_ts_ms: BASE_TS + 1840,
      exact_load_time: false,
      provenance: {
        source_api: 'CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)',
        collection_method: 'Per-user module snapshot',
        confidence_note: 'Observed in snapshot (not kernel ETW image-load timestamp)',
        snapshot_only: true,
      },
    },
    {
      id: 'mod-winhttp',
      process_instance_id: pid,
      process_name: 'Update_host.exe',
      module_name: 'winhttp.dll',
      module_path: 'C:\\Windows\\System32\\winhttp.dll',
      signature_status: 'signed_verified',
      publisher: 'Microsoft Windows',
      observed_ts_ms: BASE_TS + 420,
      exact_load_time: false,
      provenance: {
        source_api: 'CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)',
        collection_method: 'Per-user module snapshot',
        confidence_note: 'Microsoft Authenticode verified',
        snapshot_only: true,
      },
    },
    {
      id: 'mod-crypt32',
      process_instance_id: pid,
      process_name: 'Update_host.exe',
      module_name: 'crypt32.dll',
      module_path: 'C:\\Windows\\System32\\crypt32.dll',
      signature_status: 'signed_verified',
      publisher: 'Microsoft Windows',
      observed_ts_ms: BASE_TS + 435,
      exact_load_time: false,
      provenance: {
        source_api: 'CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)',
        collection_method: 'Per-user module snapshot',
        confidence_note: 'Microsoft Authenticode verified',
        snapshot_only: true,
      },
    },
    {
      id: 'mod-ws2',
      process_instance_id: pid,
      process_name: 'Update_host.exe',
      module_name: 'ws2_32.dll',
      module_path: 'C:\\Windows\\System32\\ws2_32.dll',
      signature_status: 'signed_verified',
      publisher: 'Microsoft Windows',
      observed_ts_ms: BASE_TS + 450,
      exact_load_time: false,
      provenance: {
        source_api: 'CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)',
        collection_method: 'Per-user module snapshot',
        confidence_note: 'Microsoft Authenticode verified',
        snapshot_only: true,
      },
    },
  ];
  const sysDlls = [
    'ntdll.dll', 'kernel32.dll', 'kernelbase.dll', 'ucrtbase.dll', 'advapi32.dll', 'sechost.dll',
    'rpcrt4.dll', 'user32.dll', 'win32u.dll', 'gdi32.dll', 'shell32.dll', 'ole32.dll', 'combase.dll',
    'bcrypt.dll', 'ncrypt.dll', 'schannel.dll', 'dnsapi.dll', 'iphlpapi.dll', 'mswsock.dll',
    'wintrust.dll', 'msasn1.dll', 'version.dll', 'profapi.dll', 'userenv.dll', 'uxtheme.dll',
    'sspicli.dll', 'nsi.dll', 'winnsi.dll', 'fwpuclnt.dll', 'imagehlp.dll', 'cfgmgr32.dll',
    'powrprof.dll', 'shlwapi.dll', 'oleaut32.dll', 'msvcp_win.dll', 'gdi32full.dll',
    'bcryptprimitives.dll', 'rasadhlp.dll',
  ];
  sysDlls.forEach((dll, idx) => {
    base.push({
      id: `mod-sys-${idx}`,
      process_instance_id: pid,
      process_name: 'Update_host.exe',
      module_name: dll,
      module_path: `C:\\Windows\\System32\\${dll}`,
      signature_status: 'signed_verified',
      publisher: 'Microsoft Windows',
      observed_ts_ms: BASE_TS + 500 + idx * 8,
      exact_load_time: false,
      provenance: {
        source_api: 'CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)',
        collection_method: 'Per-user module snapshot',
        confidence_note: 'Microsoft Authenticode verified',
        snapshot_only: true,
      },
    });
  });
  return base;
}

function makeTimeline(range: string): TimelineBucket[] {
  const specs: Record<string, Array<[string, number, number, number]>> = {
    '15M': [
      ['14:08', 8, 22, 64], ['14:10', 12, 34, 88], ['14:12', 6, 28, 72],
      ['14:14', 15, 42, 110], ['14:16', 10, 38, 95], ['14:18', 18, 52, 140],
      ['14:20', 14, 46, 128], ['14:22', 12, 48, 124], ['14:24', 9, 36, 98],
    ],
    '1H': [
      ['13:25', 4, 18, 62], ['13:32', 6, 26, 84], ['13:39', 5, 22, 74],
      ['13:46', 9, 36, 118], ['13:53', 7, 31, 96], ['14:00', 11, 44, 142],
      ['14:07', 8, 35, 112], ['14:14', 14, 54, 168], ['14:22', 12, 48, 124],
      ['14:28', 9, 39, 108], ['14:35', 13, 46, 134], ['14:42', 8, 32, 92],
    ],
    '6H': [
      ['09:00', 24, 140, 420], ['10:00', 38, 210, 580], ['11:00', 31, 185, 510],
      ['12:00', 46, 260, 720], ['13:00', 34, 195, 540], ['14:00', 42, 318, 890],
    ],
    '24H': [
      ['18:00', 52, 320, 940], ['22:00', 18, 110, 310], ['02:00', 8, 42, 120],
      ['06:00', 14, 88, 260], ['10:00', 64, 410, 1180], ['14:00', 48, 340, 980],
    ],
    '7D': [
      ['Thu', 180, 1420, 4200], ['Fri', 210, 1680, 4850], ['Sat', 95, 780, 2100],
      ['Sun', 110, 840, 2340], ['Mon', 245, 1920, 5600], ['Tue', 220, 1740, 5120],
      ['Wed', 198, 1610, 4680],
    ],
  };
  const rows = specs[range] ?? specs['1H'];
  return rows.map(([label, p, n, m], idx) => ({
    timestamp_ms: BASE_TS - (rows.length - idx) * 300000,
    label,
    total_events: p + n + m,
    process_events: p,
    network_events: n,
    module_events: m,
    rule_events: idx === Math.floor(rows.length * 0.7) ? 1 : 0,
  }));
}

export function createBrowserPreviewBackend() {
  let settings: AppSettings = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return { ...DEFAULT_SETTINGS };
  })();

  let monitoringActive = true;
  let historyCleared = false;
  let allowlist: AllowlistEntry[] = [
    {
      id: 'allow-vscode',
      match_type: 'exe_name',
      value: 'Code.exe',
      reason: 'Verified Microsoft VS Code local developer toolchain',
      created_ts_ms: BASE_TS - 86400000,
    },
    {
      id: 'allow-svchost',
      match_type: 'exe_name',
      value: 'svchost.exe',
      reason: 'Core Windows service host',
      created_ts_ms: BASE_TS - 86400000,
    },
  ];

  const persistSettings = (next: AppSettings) => {
    settings = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  };

  return {
    getSettings: () => ({ ...settings }),
    saveSettings: (next: AppSettings) => {
      persistSettings(next);
      return { ...settings };
    },
    startMonitoring: () => {
      monitoringActive = true;
      historyCleared = false;
      return true;
    },
    stopMonitoring: () => {
      monitoringActive = false;
      return false;
    },
    getOverview: (range: string, mode?: DataSourceMode): OverviewSnapshot => {
      const activeMode = mode ?? settings.data_source_mode;
      const prefix = activeMode === 'demo' ? 'demo_boot_9f2a' : 'boot_9f2a';
      const apps = historyCleared && activeMode === 'live' ? [] : makeProcesses(prefix);
      return {
        mode: activeMode,
        privilege_mode: settings.privilege_mode,
        monitoring_active: activeMode === 'demo' ? true : monitoringActive,
        active_process_count: apps.filter((a) => a.is_active).length || 0,
        total_events_window: apps.length ? 1840 : 0,
        process_spawns_count: apps.length ? 42 : 0,
        network_calls_count: apps.length ? 318 : 0,
        dll_loads_count: apps.length ? 1290 : 0,
        rule_matches_count: apps.length ? 1 : 0,
        high_activity_apps: apps,
        timeline: makeTimeline(range),
        storage: {
          db_path:
            activeMode === 'demo'
              ? '[Isolated In-Memory Demo Fixture — Zero Disk Writes]'
              : '%LOCALAPPDATA%\\SilentWatch\\silentwatch.db',
          wal_mode_active: true,
          db_bytes: apps.length ? 184 * 1024 * 1024 : 2 * 1024 * 1024,
          wal_bytes: apps.length ? 4 * 1024 * 1024 : 0,
          total_bytes: apps.length ? 188 * 1024 * 1024 : 2 * 1024 * 1024,
          cap_bytes: settings.ring_buffer_cap_mb * 1024 * 1024,
          total_events: apps.length ? 18420 : 0,
          retention_window_label: apps.length ? '4h 12m window' : 'Empty ring buffer',
          integrity_ok: true,
        },
        collector_health_ok: monitoringActive || activeMode === 'demo',
        dropped_events_24h: 0,
      };
    },
    getProcesses: (mode?: DataSourceMode): ProcessSummary[] => {
      const activeMode = mode ?? settings.data_source_mode;
      if (historyCleared && activeMode === 'live') return [];
      const prefix = activeMode === 'demo' ? 'demo_boot_9f2a' : 'boot_9f2a';
      return makeProcesses(prefix).map((p) => ({
        ...p,
        is_allowlisted: allowlist.some(
          (a) => a.match_type === 'exe_name' && a.value.toLowerCase() === p.exe_name.toLowerCase(),
        ),
      }));
    },
    getNetworkConnections: (mode?: DataSourceMode): NetworkConnectionRecord[] => {
      const activeMode = mode ?? settings.data_source_mode;
      if (historyCleared && activeMode === 'live') return [];
      const prefix = activeMode === 'demo' ? 'demo_boot_9f2a' : 'boot_9f2a';
      const procs = makeProcesses(prefix);
      return [
        {
          id: 'net-1',
          process_instance_id: procs[4].instance_id,
          process_name: 'powershell.exe',
          protocol: 'TLS 1.3',
          local_addr: '192.168.1.24',
          local_port: 54112,
          remote_addr: '104.21.4.8',
          remote_port: 443,
          remote_domain: 'cdn.updater.net',
          state: 'ESTABLISHED',
          direction: 'Outbound',
          bytes_out: 1468006,
          bytes_in: 4821120,
          first_seen_ms: BASE_TS + 2140,
          last_seen_ms: BASE_TS + 94000,
          classification: 'confirmed',
          provenance: {
            source_api: 'GetExtendedTcpTable',
            collection_method: 'Owning PID socket table + local DNS cache',
            confidence_note: 'Confirmed owning PID; domain verified in local DNS cache',
            snapshot_only: false,
          },
        },
        {
          id: 'net-2',
          process_instance_id: procs[2].instance_id,
          process_name: 'Code.exe',
          protocol: 'TLS 1.3',
          local_addr: '192.168.1.24',
          local_port: 53904,
          remote_addr: '140.82.114.6',
          remote_port: 443,
          remote_domain: 'api.github.com',
          state: 'ESTABLISHED',
          direction: 'Outbound',
          bytes_out: 430080,
          bytes_in: 1240900,
          first_seen_ms: BASE_TS - 90000,
          last_seen_ms: BASE_TS + 118000,
          classification: 'confirmed',
          provenance: {
            source_api: 'GetExtendedTcpTable',
            collection_method: 'Owning PID socket table',
            confidence_note: 'Confirmed owning PID',
            snapshot_only: true,
          },
        },
        {
          id: 'net-3',
          process_instance_id: procs[1].instance_id,
          process_name: 'chrome.exe',
          protocol: 'QUIC',
          local_addr: '192.168.1.24',
          local_port: 61208,
          remote_addr: '142.250.190.46',
          remote_port: 443,
          remote_domain: null,
          state: 'ACTIVE',
          direction: 'Outbound',
          bytes_out: 8598323,
          bytes_in: 24110200,
          first_seen_ms: BASE_TS - 200000,
          last_seen_ms: BASE_TS + 120000,
          classification: 'confirmed',
          provenance: {
            source_api: 'GetExtendedUdpTable',
            collection_method: 'Owning PID UDP table (raw IP only)',
            confidence_note: 'No fabricated hostname; raw remote IP displayed',
            snapshot_only: true,
          },
        },
        {
          id: 'net-4',
          process_instance_id: procs[3].instance_id,
          process_name: 'svchost.exe',
          protocol: 'DoT',
          local_addr: '192.168.1.24',
          local_port: 52100,
          remote_addr: '9.9.9.9',
          remote_port: 853,
          remote_domain: 'dns.quad9.net',
          state: 'ESTABLISHED',
          direction: 'Outbound',
          bytes_out: 18432,
          bytes_in: 36864,
          first_seen_ms: BASE_TS - 400000,
          last_seen_ms: BASE_TS + 121000,
          classification: 'confirmed',
          provenance: {
            source_api: 'GetExtendedTcpTable',
            collection_method: 'Owning PID socket table',
            confidence_note: 'Confirmed DNS-over-TLS resolver socket',
            snapshot_only: true,
          },
        },
      ];
    },
    getModules: (mode?: DataSourceMode, _processKey?: string): ModuleRecord[] => {
      const activeMode = mode ?? settings.data_source_mode;
      if (historyCleared && activeMode === 'live') return [];
      return makeModules(activeMode === 'demo' ? 'demo_boot_9f2a' : 'boot_9f2a');
    },
    getBehaviorGraph: (mode?: DataSourceMode, processKey?: string): BehaviorGraph => {
      const activeMode = mode ?? settings.data_source_mode;
      const prefix = activeMode === 'demo' ? 'demo_boot_9f2a' : 'boot_9f2a';
      const procs = makeProcesses(prefix);
      const root =
        procs.find(
          (p) =>
            formatStableKey(p.instance_id) === processKey ||
            p.exe_name.toLowerCase() === processKey?.toLowerCase(),
        ) ?? procs[0];
      const mods = makeModules(prefix);
      const unsignedCount = mods.filter((m) => m.signature_status === 'unsigned').length;

      return {
        root_process: root,
        mode: activeMode,
        timeline_start_ms: BASE_TS,
        timeline_end_ms: BASE_TS + 3200,
        nodes: [
          {
            id: 'node-root',
            kind: 'process',
            label: root.exe_name,
            subtitle: `PID ${root.instance_id.pid} • ${root.signature_status === 'signed_verified' ? 'Signed' : 'Unsigned'}`,
            timestamp_ms: BASE_TS,
            signature_status: root.signature_status,
            classification: 'confirmed',
            x: 64,
            y: 196,
            metadata: {
              identity: formatStableKey(root.instance_id),
              path: root.exe_path ?? 'Unavailable',
              args: root.command_line_redacted ?? 'Unavailable',
              signature: root.publisher ?? 'Unsigned Binary',
              capability: 'Per-User Native Collector',
            },
            modules: [],
          },
          {
            id: 'node-pwsh',
            kind: 'process',
            label: 'powershell.exe',
            subtitle: 'PID 5190 • Spawned',
            timestamp_ms: BASE_TS + 1120,
            signature_status: 'signed_verified',
            classification: 'confirmed',
            x: 348,
            y: 56,
            metadata: {
              identity: `${prefix}:5190:${BASE_TS + 1120}`,
              parent: `${root.exe_name} (PID ${root.instance_id.pid})`,
              path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
              args: 'powershell.exe -NoProfile -Command Invoke-WebRequest [REDACTED_TOKEN]',
              signature: 'Microsoft Windows (Valid)',
              capability: 'Per-User Native Collector',
            },
            modules: [],
          },
          {
            id: 'node-net',
            kind: 'network_endpoint',
            label: 'cdn.updater.net:443 (TLS)',
            subtitle: '104.21.4.8 • 1.4 MB out',
            timestamp_ms: BASE_TS + 2140,
            signature_status: null,
            classification: 'confirmed',
            x: 632,
            y: 68,
            metadata: {
              endpoint: 'cdn.updater.net:443',
              ip: '104.21.4.8 (Confirmed)',
              protocol: 'TCP / TLS 1.3',
              initiator: 'powershell.exe (PID 5190)',
              provenance: 'GetExtendedTcpTable + local DNS cache',
            },
            modules: [],
          },
          {
            id: 'node-dlls',
            kind: 'dll_cluster',
            label: `DLL Cluster (${mods.length} Loaded)`,
            subtitle: `${mods.length - unsignedCount} Signed • ${unsignedCount} Unsigned`,
            timestamp_ms: BASE_TS + 1840,
            signature_status: 'unsigned',
            classification: 'confirmed',
            x: 348,
            y: 204,
            metadata: {
              total_modules: mods.length,
              unsigned_modules: unsignedCount,
              provenance: 'Toolhelp32 per-user module snapshot',
            },
            modules: mods,
          },
          {
            id: 'node-rule',
            kind: 'rule_match',
            label: 'SW-001: Unsigned Shell Spawn',
            subtitle: 'Declarative Rule Match',
            timestamp_ms: BASE_TS + 1250,
            signature_status: null,
            classification: 'confirmed',
            x: 632,
            y: 212,
            metadata: {
              rule_id: 'SW-001',
              verdict: 'Matched',
              explanation: 'Unsigned parent process spawned verified scripting shell.',
              note: 'Informational behavior match — not an antivirus malware verdict.',
            },
            modules: [],
          },
          {
            id: 'node-inferred',
            kind: 'process',
            label: 'bg_helper.exe (Inferred)',
            subtitle: 'Temporal correlation only',
            timestamp_ms: BASE_TS + 2480,
            signature_status: 'unsigned',
            classification: 'inferred',
            x: 348,
            y: 356,
            metadata: {
              identity: `${prefix}:5244:${BASE_TS + 2480}`,
              path: '%USERPROFILE%\\AppData\\Local\\Temp\\bg_helper.exe',
              args: 'bg_helper.exe --quiet',
              signature: 'Unsigned Binary',
              correlation_warning:
                'INFERRED: No OS parent-child PID link recorded. Launched 2.48s after root process.',
            },
            modules: [],
          },
        ],
        edges: [
          {
            id: 'edge-spawn-pwsh',
            source: 'node-root',
            target: 'node-pwsh',
            label: 'Spawned',
            timestamp_ms: BASE_TS + 1120,
            classification: 'confirmed',
            category: 'process',
            evidence: 'Confirmed OS Parent PID (4812 -> 5190) + creation timestamp',
          },
          {
            id: 'edge-pwsh-net',
            source: 'node-pwsh',
            target: 'node-net',
            label: 'TLS 1.3 :443',
            timestamp_ms: BASE_TS + 2140,
            classification: 'confirmed',
            category: 'network',
            evidence: 'Confirmed owning PID 5190 in TCP socket table',
          },
          {
            id: 'edge-root-dlls',
            source: 'node-root',
            target: 'node-dlls',
            label: '42 Modules',
            timestamp_ms: BASE_TS + 1840,
            classification: 'confirmed',
            category: 'module',
            evidence: 'Confirmed module snapshot via Toolhelp32',
          },
          {
            id: 'edge-pwsh-rule',
            source: 'node-pwsh',
            target: 'node-rule',
            label: 'SW-001',
            timestamp_ms: BASE_TS + 1250,
            classification: 'confirmed',
            category: 'rule',
            evidence: 'Declarative rule evaluation',
          },
          {
            id: 'edge-inferred-bg',
            source: 'node-root',
            target: 'node-inferred',
            label: 'Inferred (+2.48s)',
            timestamp_ms: BASE_TS + 2480,
            classification: 'inferred',
            category: 'process',
            evidence: 'INFERRED: Temporal proximity only — no OS parent-child link recorded',
          },
        ],
      };
    },
    getRuleMatches: (mode?: DataSourceMode): RuleMatchRecord[] => {
      const activeMode = mode ?? settings.data_source_mode;
      const prefix = activeMode === 'demo' ? 'demo_boot_9f2a' : 'boot_9f2a';
      const procs = makeProcesses(prefix);
      const updaterAllowlisted = allowlist.some(
        (a) => a.value.toLowerCase() === 'update_host.exe',
      );
      return [
        {
          id: 'match-sw001',
          rule_id: 'SW-001',
          rule_name: 'Unsigned Child Shell Spawn',
          description: 'Detects when an unsigned user-space executable spawns a scripting shell.',
          verdict: updaterAllowlisted ? 'allowlisted' : 'matched',
          severity_label: updaterAllowlisted ? 'Allowlisted' : 'Matched',
          process_instance_id: procs[0].instance_id,
          process_name: 'Update_host.exe',
          matched_ts_ms: BASE_TS + 1120,
          deduplicated_count: 1,
          explanation:
            'Update_host.exe (Unsigned, PID 4812) spawned powershell.exe (PID 5190) with a verified OS parent-child link.',
          evidence: [
            `Parent: Update_host.exe (${prefix}:4812) — Signature: Unsigned`,
            `Child: powershell.exe (${prefix}:5190) — Verified Parent PID link`,
            'Note: Unsigned software is not automatically malicious; review publisher and path.',
          ],
          missing_capability: null,
        },
        {
          id: 'match-sw005',
          rule_id: 'SW-005',
          rule_name: 'Kernel DLL Injection Monitor',
          description: 'Monitors cross-process image loads via Windows Kernel ETW.',
          verdict:
            settings.privilege_mode === 'enhanced_etw' ? 'not_matched' : 'insufficient_capability',
          severity_label: settings.privilege_mode === 'enhanced_etw' ? 'Active (0 Hits)' : 'Needs ETW',
          process_instance_id: null,
          process_name: null,
          matched_ts_ms: BASE_TS + 2000,
          deduplicated_count: 0,
          explanation:
            settings.privilege_mode === 'enhanced_etw'
              ? 'Enhanced ETW Kernel ImageLoad provider active — 0 matches observed.'
              : 'Requires Enhanced ETW Mode — currently running unprivileged per-user collection.',
          evidence: [
            `Current privilege mode: ${settings.privilege_mode}`,
            'Enable Enhanced System Telemetry in Settings (requires explicit UAC approval).',
          ],
          missing_capability:
            settings.privilege_mode === 'enhanced_etw'
              ? null
              : 'Microsoft-Windows-Kernel-Process / ImageLoad ETW',
        },
        {
          id: 'match-sw004',
          rule_id: 'SW-004',
          rule_name: 'Known Dev Build Toolchain',
          description: 'Local developer IDE spawning Node.js child process.',
          verdict: 'allowlisted',
          severity_label: 'Allowlisted',
          process_instance_id: procs[2].instance_id,
          process_name: 'Code.exe',
          matched_ts_ms: BASE_TS - 60000,
          deduplicated_count: 14,
          explanation: 'Code.exe -> node.exe matched allowlist rule (14 deduplicated events).',
          evidence: ['Allowlist entry: exe_name == Code.exe', 'Deduplicated 14 child-spawn events'],
          missing_capability: null,
        },
      ];
    },
    getEvents: (mode?: DataSourceMode, search?: string): TelemetryEvent[] => {
      const activeMode = mode ?? settings.data_source_mode;
      if (historyCleared && activeMode === 'live') return [];
      const prefix = activeMode === 'demo' ? 'demo_boot_9f2a' : 'boot_9f2a';
      const procs = makeProcesses(prefix);
      const all: TelemetryEvent[] = [
        {
          event_id: 'evt-1',
          event_ts_ms: BASE_TS + 2480,
          ingestion_ts_ms: BASE_TS + 2498,
          collector_source: activeMode === 'demo' ? 'demo_fixture' : 'windows_toolhelp_process',
          category: 'process',
          process_instance_id: procs[5].instance_id,
          related_process_id: null,
          payload: {
            type: 'process_lifecycle',
            action: 'observed_start',
            exe_name: 'bg_helper.exe',
            exe_path: procs[5].exe_path,
            signature_status: 'unsigned',
          },
          capability_state: 'active',
          provenance: {
            source_api: 'CreateToolhelp32Snapshot',
            collection_method: 'Temporal correlation (no OS parent link)',
            confidence_note: 'Inferred relation to Update_host.exe',
            snapshot_only: true,
          },
          classification: 'inferred',
          dedup_key: 'evt-bg-1',
        },
        {
          event_id: 'evt-2',
          event_ts_ms: BASE_TS + 2140,
          ingestion_ts_ms: BASE_TS + 2160,
          collector_source: activeMode === 'demo' ? 'demo_fixture' : 'windows_ip_helper_network',
          category: 'network',
          process_instance_id: procs[4].instance_id,
          related_process_id: null,
          payload: {
            type: 'network_activity',
            protocol: 'TLS 1.3',
            remote_domain: 'cdn.updater.net',
            remote_addr: '104.21.4.8',
            remote_port: 443,
            state: 'ESTABLISHED',
          },
          capability_state: 'active',
          provenance: {
            source_api: 'GetExtendedTcpTable',
            collection_method: 'Owning PID socket table',
            confidence_note: 'Confirmed socket attribution',
            snapshot_only: false,
          },
          classification: 'confirmed',
          dedup_key: 'evt-net-1',
        },
        {
          event_id: 'evt-3',
          event_ts_ms: BASE_TS + 1840,
          ingestion_ts_ms: BASE_TS + 1855,
          collector_source: activeMode === 'demo' ? 'demo_fixture' : 'windows_toolhelp_module',
          category: 'module',
          process_instance_id: procs[0].instance_id,
          related_process_id: null,
          payload: {
            type: 'module_activity',
            module_name: 'custom_hk.dll',
            module_path: '%USERPROFILE%\\AppData\\Local\\Updater\\custom_hk.dll',
            signature_status: 'unsigned',
          },
          capability_state: 'active',
          provenance: {
            source_api: 'CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)',
            collection_method: 'Per-user module snapshot',
            confidence_note: 'Observed in snapshot',
            snapshot_only: true,
          },
          classification: 'confirmed',
          dedup_key: 'evt-mod-1',
        },
        {
          event_id: 'evt-4',
          event_ts_ms: BASE_TS + 1120,
          ingestion_ts_ms: BASE_TS + 1135,
          collector_source: activeMode === 'demo' ? 'demo_fixture' : 'windows_toolhelp_process',
          category: 'process',
          process_instance_id: procs[4].instance_id,
          related_process_id: procs[0].instance_id,
          payload: {
            type: 'process_lifecycle',
            action: 'spawned',
            exe_name: 'powershell.exe',
            exe_path: procs[4].exe_path,
            signature_status: 'signed_verified',
          },
          capability_state: 'active',
          provenance: {
            source_api: 'CreateToolhelp32Snapshot',
            collection_method: 'Confirmed parent-child PID + start_time',
            confidence_note: 'Confirmed OS parent link',
            snapshot_only: false,
          },
          classification: 'confirmed',
          dedup_key: 'evt-pwsh-1',
        },
      ];
      if (!search?.trim()) return all;
      const q = search.toLowerCase();
      return all.filter((e) => JSON.stringify(e).toLowerCase().includes(q));
    },
    listAllowlist: () => [...allowlist],
    addAllowlist: (matchType: string, value: string, reason: string): AllowlistEntry => {
      const entry: AllowlistEntry = {
        id: `allow-${Date.now()}`,
        match_type: matchType,
        value,
        reason,
        created_ts_ms: Date.now(),
      };
      allowlist = [entry, ...allowlist];
      return entry;
    },
    removeAllowlist: (id: string) => {
      allowlist = allowlist.filter((e) => e.id !== id);
    },
    exportReport: async (req: ExportRequest): Promise<ExportResult> => {
      await new Promise((r) => setTimeout(r, 220));
      const now = Date.now();
      const procs = makeProcesses(req.mode === 'demo' ? 'demo_boot_9f2a' : 'boot_9f2a');
      const content =
        req.format === 'json'
          ? JSON.stringify(
              {
                schema_version: 1,
                mode: req.mode,
                redacted: true,
                processes: procs.map((p) => ({
                  exe_name: p.exe_name,
                  identity: formatStableKey(p.instance_id),
                  signature: p.signature_status,
                  path: p.exe_path,
                })),
              },
              null,
              2,
            )
          : req.format === 'csv'
            ? [
                'record_type,name,identity,signature,path',
                ...procs.map(
                  (p) =>
                    `process,${p.exe_name},${formatStableKey(p.instance_id)},${p.signature_status},"${p.exe_path ?? ''}"`,
                ),
              ].join('\n')
            : [
                '# SilentWatch Sanitized Evidence Report',
                '',
                `- **Data Source**: ${req.mode === 'demo' ? 'Isolated Demo Fixture' : 'Live Local Telemetry'}`,
                '- **Redaction**: User profile paths (`%USERPROFILE%`) & auth tokens (`[REDACTED_TOKEN]`) applied.',
                '',
                '## Observed Processes',
                '',
                '| Executable | Identity | Signature | CPU % | Memory MB |',
                '| :--- | :--- | :--- | ---: | ---: |',
                ...procs.map(
                  (p) =>
                    `| \`${p.exe_name}\` | \`${formatStableKey(p.instance_id)}\` | ${p.signature_status} | ${p.cpu_percent.toFixed(1)}% | ${p.memory_mb.toFixed(1)} |`,
                ),
              ].join('\n');

      const ext = req.format === 'markdown' ? 'md' : req.format;
      return {
        format: req.format,
        filename: `silentwatch-report-${req.mode}-${now}.${ext}`,
        saved_path: `%LOCALAPPDATA%\\SilentWatch\\exports\\silentwatch-report-${req.mode}-${now}.${ext}`,
        content,
        redaction_summary: {
          user_paths_redacted: 4,
          tokens_redacted: 1,
          credentials_redacted: 1,
        },
        generated_ts_ms: now,
      };
    },
    clearLocalHistory: () => {
      historyCleared = true;
    },
    getSystemStatus: (mode?: DataSourceMode): SystemStatusSnapshot => {
      const activeMode = mode ?? settings.data_source_mode;
      const etwActive = settings.privilege_mode === 'enhanced_etw';
      return {
        mode: activeMode,
        privilege_mode: settings.privilege_mode,
        monitoring_active: activeMode === 'demo' ? true : monitoringActive,
        platform: 'windows',
        ipc_protocol_version: 1,
        ipc_healthy: true,
        dropped_events: 0,
        collector_restarts: 0,
        capabilities: [
          {
            id: 'process_lifecycle',
            name: 'Per-User Process Lifecycle',
            description: 'Process creation, termination, parent-child links, paths & resource usage.',
            state: monitoringActive ? 'active' : 'stopped',
            source: 'windows_toolhelp_process',
            requires_elevation: false,
            limitations: 'Protected system processes return AccessDenied without elevation.',
          },
          {
            id: 'network_sockets',
            name: 'CPU / RAM / TCP-UDP Socket Attribution',
            description: 'IP Helper API owning-PID socket attribution (zero payload inspection).',
            state: monitoringActive ? 'active' : 'stopped',
            source: 'windows_ip_helper_network',
            requires_elevation: false,
            limitations: 'Snapshot polling may miss sub-second ephemeral sockets.',
          },
          {
            id: 'etw_kernel_process',
            name: 'Kernel ETW DLL / Module Loads',
            description: 'Exact-timestamp kernel image-load telemetry via Windows ETW.',
            state: etwActive ? 'active' : 'elevation_required',
            source: 'windows_etw_kernel_process',
            requires_elevation: true,
            limitations: etwActive
              ? 'Active via user-approved Administrator elevation.'
              : 'Requires explicit UAC elevation when enabled by user.',
          },
          {
            id: 'cross_user_visibility',
            name: 'Cross-User Process Visibility',
            description: 'Inspects system services and elevated session processes.',
            state: etwActive ? 'active' : 'elevation_required',
            source: 'windows_etw_kernel_process',
            requires_elevation: true,
            limitations: 'Standard Per-User mode only observes current user session.',
          },
        ],
        storage: {
          db_path: '%LOCALAPPDATA%\\SilentWatch\\silentwatch.db',
          wal_mode_active: true,
          db_bytes: 184 * 1024 * 1024,
          wal_bytes: 4 * 1024 * 1024,
          total_bytes: 188 * 1024 * 1024,
          cap_bytes: settings.ring_buffer_cap_mb * 1024 * 1024,
          total_events: 18420,
          retention_window_label: '4h 12m window',
          integrity_ok: true,
        },
        logs: [
          {
            timestamp_ms: BASE_TS - 127408,
            level: 'INFO',
            message: 'Local collector service bound cleanly (Standard Per-User)',
          },
          {
            timestamp_ms: BASE_TS - 127323,
            level: 'INFO',
            message: 'SQLite WAL integrity check passed (0 errors)',
          },
          {
            timestamp_ms: BASE_TS - 127300,
            level: 'WARN',
            message: 'ETW kernel DLL provider inactive — running unprivileged per-user',
          },
          {
            timestamp_ms: BASE_TS,
            level: 'INFO',
            message: 'Ring-buffer retention stable at 184 / 512 MB (35.9%)',
          },
        ],
      };
    },
    quitApplication: () => {
      monitoringActive = false;
    },
  };
}
