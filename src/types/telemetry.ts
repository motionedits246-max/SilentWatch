export type DataSourceMode = 'live' | 'demo';
export type PrivilegeMode = 'standard_per_user' | 'enhanced_etw';
export type MotionTier = 'full' | 'balanced' | 'off';
export type CloseWindowBehavior = 'hide_to_tray' | 'minimize_to_taskbar' | 'stop_and_quit';

export type ScreenId =
  | 'overview'
  | 'behavior_explorer'
  | 'applications'
  | 'network_modules'
  | 'detections_logs'
  | 'settings'
  | 'system_status';

export type SignatureStatus =
  | 'signed_verified'
  | 'unsigned'
  | 'unverified'
  | 'access_denied'
  | 'unknown';

export type EpistemicClassification = 'confirmed' | 'inferred';
export type RuleVerdict = 'matched' | 'allowlisted' | 'insufficient_capability' | 'not_matched';
export type CapabilityState =
  | 'active'
  | 'degraded'
  | 'elevation_required'
  | 'unavailable_on_platform'
  | 'stopped';

export interface ProcessInstanceId {
  boot_id: string;
  pid: number;
  start_time_ms: number;
}

export function formatStableKey(id: ProcessInstanceId): string {
  return `${id.boot_id}:${id.pid}:${id.start_time_ms}`;
}

export interface EvidenceProvenance {
  source_api: string;
  collection_method: string;
  confidence_note: string;
  snapshot_only: boolean;
}

export interface ProcessSummary {
  instance_id: ProcessInstanceId;
  parent_instance_id: ProcessInstanceId | null;
  exe_name: string;
  exe_path: string | null;
  publisher: string | null;
  signature_status: SignatureStatus;
  cpu_percent: number;
  memory_mb: number;
  network_count: number;
  module_count: number;
  event_count: number;
  activity_delta_pct: number;
  sparkline: number[];
  is_active: boolean;
  is_allowlisted: boolean;
  first_seen_ms: number;
  last_seen_ms: number;
  command_line_redacted: string | null;
  icon_data_url: string | null;
}

export interface NetworkConnectionRecord {
  id: string;
  process_instance_id: ProcessInstanceId;
  process_name: string;
  protocol: string;
  local_addr: string;
  local_port: number;
  remote_addr: string;
  remote_port: number;
  remote_domain: string | null;
  state: string;
  direction: string | null;
  bytes_out: number;
  bytes_in: number;
  first_seen_ms: number;
  last_seen_ms: number;
  classification: EpistemicClassification;
  provenance: EvidenceProvenance;
}

export interface ModuleRecord {
  id: string;
  process_instance_id: ProcessInstanceId;
  process_name: string;
  module_name: string;
  module_path: string;
  signature_status: SignatureStatus;
  publisher: string | null;
  observed_ts_ms: number;
  exact_load_time: boolean;
  provenance: EvidenceProvenance;
}

export interface RuleMatchRecord {
  id: string;
  rule_id: string;
  rule_name: string;
  description: string;
  verdict: RuleVerdict;
  severity_label: string;
  process_instance_id: ProcessInstanceId | null;
  process_name: string | null;
  matched_ts_ms: number;
  deduplicated_count: number;
  explanation: string;
  evidence: string[];
  missing_capability: string | null;
}

export interface AllowlistEntry {
  id: string;
  match_type: string;
  value: string;
  reason: string;
  created_ts_ms: number;
}

export type GraphNodeKind = 'process' | 'network_endpoint' | 'dll_cluster' | 'rule_match';

export interface BehaviorNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  subtitle: string;
  timestamp_ms: number;
  signature_status: SignatureStatus | null;
  classification: EpistemicClassification;
  x: number;
  y: number;
  metadata: Record<string, unknown>;
  modules: ModuleRecord[];
}

export interface BehaviorEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  timestamp_ms: number;
  classification: EpistemicClassification;
  category: 'process' | 'network' | 'module' | 'rule' | 'system';
  evidence: string;
}

export interface BehaviorGraph {
  root_process: ProcessSummary;
  nodes: BehaviorNode[];
  edges: BehaviorEdge[];
  timeline_start_ms: number;
  timeline_end_ms: number;
  mode: DataSourceMode;
}

export interface TimelineBucket {
  timestamp_ms: number;
  label: string;
  total_events: number;
  process_events: number;
  network_events: number;
  module_events: number;
  rule_events: number;
}

export interface StorageDiagnostics {
  db_path: string;
  wal_mode_active: boolean;
  db_bytes: number;
  wal_bytes: number;
  total_bytes: number;
  cap_bytes: number;
  total_events: number;
  retention_window_label: string;
  integrity_ok: boolean;
}

export interface OverviewSnapshot {
  mode: DataSourceMode;
  privilege_mode: PrivilegeMode;
  monitoring_active: boolean;
  active_process_count: number;
  total_events_window: number;
  process_spawns_count: number;
  network_calls_count: number;
  dll_loads_count: number;
  rule_matches_count: number;
  high_activity_apps: ProcessSummary[];
  timeline: TimelineBucket[];
  storage: StorageDiagnostics;
  collector_health_ok: boolean;
  dropped_events_24h: number;
}

export interface CollectorCapability {
  id: string;
  name: string;
  description: string;
  state: CapabilityState;
  source: string;
  requires_elevation: boolean;
  limitations: string;
}

export interface DiagnosticLogEntry {
  timestamp_ms: number;
  level: string;
  message: string;
}

export interface SystemStatusSnapshot {
  mode: DataSourceMode;
  privilege_mode: PrivilegeMode;
  monitoring_active: boolean;
  platform: string;
  ipc_protocol_version: number;
  ipc_healthy: boolean;
  dropped_events: number;
  collector_restarts: number;
  capabilities: CollectorCapability[];
  storage: StorageDiagnostics;
  logs: DiagnosticLogEntry[];
}

export interface TelemetryEvent {
  event_id: string;
  event_ts_ms: number;
  ingestion_ts_ms: number;
  collector_source: string;
  category: 'process' | 'network' | 'module' | 'rule' | 'system';
  process_instance_id: ProcessInstanceId;
  related_process_id: ProcessInstanceId | null;
  payload: Record<string, unknown>;
  capability_state: CapabilityState;
  provenance: EvidenceProvenance;
  classification: EpistemicClassification;
  dedup_key: string;
}

export interface AppSettings {
  onboarding_completed: boolean;
  privilege_mode: PrivilegeMode;
  data_source_mode: DataSourceMode;
  motion_tier: MotionTier;
  ring_buffer_cap_mb: number;
  retention_hours: number;
  close_behavior: CloseWindowBehavior;
  start_minimized_to_tray: boolean;
  collect_command_line_sanitized: boolean;
  collect_module_snapshots: boolean;
  last_seen_version: string | null;
  auto_check_updates: boolean;
  shortcuts: {
    command_palette: string;
    export_report: string;
    toggle_monitoring: string;
  };
}

export interface UpdateCheckResult {
  current_version: string;
  latest_version: string;
  update_available: boolean;
  release_notes: string;
  installer_url: string | null;
  whats_new_video_url: string | null;
  startup_video_url: string | null;
  release_page_url: string;
  checked_ok: boolean;
}

export type ExportFormat = 'markdown' | 'json' | 'csv';

export interface ExportRequest {
  format: ExportFormat;
  mode: DataSourceMode;
  include_processes: boolean;
  include_network: boolean;
  include_rules: boolean;
  target_process_key: string | null;
}

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  saved_path: string | null;
  content: string;
  redaction_summary: {
    user_paths_redacted: number;
    tokens_redacted: number;
    credentials_redacted: number;
  };
  generated_ts_ms: number;
}
