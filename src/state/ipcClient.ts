import { invoke } from '@tauri-apps/api/core';
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
  UpdateCheckResult,
} from '@/types/telemetry';
import { createBrowserPreviewBackend } from './browserPreviewBackend';

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const preview = createBrowserPreviewBackend();

async function call<T>(cmd: string, args: Record<string, unknown>, fallback: () => T | Promise<T>): Promise<T> {
  if (isTauriRuntime()) {
    return invoke<T>(cmd, args);
  }
  return fallback();
}

export const ipc = {
  signalUiReady: () => call<void>('signal_ui_ready', {}, () => undefined),
  windowMinimize: () => call<void>('window_minimize', {}, () => undefined),
  windowToggleMaximize: () => call<boolean>('window_toggle_maximize', {}, () => false),
  windowCloseToTray: () => call<void>('window_close_to_tray', {}, () => undefined),
  shouldShowReleaseVideo: () =>
    call<boolean>('should_show_release_video', {}, () => preview.shouldShowReleaseVideo()),
  markReleaseVideoSeen: () =>
    call<void>('mark_release_video_seen', {}, () => preview.markReleaseVideoSeen()),
  checkForUpdates: () =>
    call<UpdateCheckResult>('check_for_updates', {}, () => preview.checkForUpdates()),
  getSettings: () => call<AppSettings>('get_settings', {}, () => preview.getSettings()),
  saveSettings: (settings: AppSettings) =>
    call<AppSettings>('save_settings', { settings }, () => preview.saveSettings(settings)),
  startMonitoring: () => call<boolean>('start_monitoring', {}, () => preview.startMonitoring()),
  stopMonitoring: () => call<boolean>('stop_monitoring', {}, () => preview.stopMonitoring()),
  getOverview: (range: string, mode?: DataSourceMode) =>
    call<OverviewSnapshot>('get_overview', { range, mode }, () => preview.getOverview(range, mode)),
  getProcesses: (mode?: DataSourceMode, limit = 150, offset = 0) =>
    call<ProcessSummary[]>('get_processes', { mode, limit, offset }, () =>
      preview.getProcesses(mode),
    ),
  getNetworkConnections: (mode?: DataSourceMode) =>
    call<NetworkConnectionRecord[]>('get_network_connections', { mode }, () =>
      preview.getNetworkConnections(mode),
    ),
  getModules: (mode?: DataSourceMode, processKey?: string) =>
    call<ModuleRecord[]>('get_modules', { mode, processKey }, () =>
      preview.getModules(mode, processKey),
    ),
  getBehaviorGraph: (mode?: DataSourceMode, processKey?: string) =>
    call<BehaviorGraph>('get_behavior_graph', { mode, processKey }, () =>
      preview.getBehaviorGraph(mode, processKey),
    ),
  getRuleMatches: (mode?: DataSourceMode) =>
    call<RuleMatchRecord[]>('get_rule_matches', { mode }, () => preview.getRuleMatches(mode)),
  getEvents: (mode?: DataSourceMode, search?: string, limit = 100) =>
    call<TelemetryEvent[]>('get_events', { mode, search, limit }, () =>
      preview.getEvents(mode, search),
    ),
  listAllowlist: () => call<AllowlistEntry[]>('list_allowlist', {}, () => preview.listAllowlist()),
  addAllowlist: (matchType: string, value: string, reason: string) =>
    call<AllowlistEntry>('add_allowlist', { matchType, value, reason }, () =>
      preview.addAllowlist(matchType, value, reason),
    ),
  removeAllowlist: (id: string) =>
    call<void>('remove_allowlist', { id }, () => preview.removeAllowlist(id)),
  exportReport: (request: ExportRequest) =>
    call<ExportResult>('export_report', { request }, () => preview.exportReport(request)),
  clearLocalHistory: () =>
    call<void>('clear_local_history', {}, () => preview.clearLocalHistory()),
  getSystemStatus: (mode?: DataSourceMode) =>
    call<SystemStatusSnapshot>('get_system_status', { mode }, () => preview.getSystemStatus(mode)),
  quitApplication: () => call<void>('quit_application', {}, () => preview.quitApplication()),
};
