use crate::identity::ProcessInstanceId;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DataSourceMode {
    Live,
    Demo,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PrivilegeMode {
    StandardPerUser,
    EnhancedEtw,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventCategory {
    Process,
    Network,
    Module,
    Rule,
    System,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EpistemicClassification {
    Confirmed,
    Inferred,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SignatureStatus {
    SignedVerified,
    Unsigned,
    Unverified,
    AccessDenied,
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CollectorSource {
    WindowsToolhelpProcess,
    WindowsIpHelperNetwork,
    WindowsToolhelpModule,
    WindowsEtwKernelProcess,
    WindowsEtwKernelNetwork,
    WindowsEtwImageLoad,
    LinuxProcFallback,
    DemoFixture,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CapabilityState {
    Active,
    Degraded,
    ElevationRequired,
    UnavailableOnPlatform,
    Stopped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectorCapability {
    pub id: String,
    pub name: String,
    pub description: String,
    pub state: CapabilityState,
    pub source: CollectorSource,
    pub requires_elevation: bool,
    pub limitations: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvidenceProvenance {
    pub source_api: String,
    pub collection_method: String,
    pub confidence_note: String,
    pub snapshot_only: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EventPayload {
    ProcessLifecycle {
        action: String,
        exe_name: String,
        exe_path: Option<String>,
        command_line: Option<String>,
        publisher: Option<String>,
        signature_status: SignatureStatus,
        cpu_percent: f32,
        memory_mb: f32,
    },
    NetworkActivity {
        protocol: String,
        local_addr: String,
        local_port: u16,
        remote_addr: String,
        remote_port: u16,
        remote_domain: Option<String>,
        state: String,
        direction: Option<String>,
        bytes_sent: Option<u64>,
        bytes_received: Option<u64>,
    },
    ModuleActivity {
        module_name: String,
        module_path: String,
        signature_status: SignatureStatus,
        publisher: Option<String>,
        observed_via: String,
        exact_load_time: bool,
    },
    RuleEvaluation {
        rule_id: String,
        rule_name: String,
        verdict: RuleVerdict,
        explanation: String,
        evidence_summary: String,
    },
    SystemDiagnostic {
        level: String,
        message: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryEvent {
    pub event_id: String,
    pub event_ts_ms: i64,
    pub ingestion_ts_ms: i64,
    pub collector_source: CollectorSource,
    pub category: EventCategory,
    pub process_instance_id: ProcessInstanceId,
    pub related_process_id: Option<ProcessInstanceId>,
    pub payload: EventPayload,
    pub capability_state: CapabilityState,
    pub provenance: EvidenceProvenance,
    pub classification: EpistemicClassification,
    pub dedup_key: String,
}

impl TelemetryEvent {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        event_ts_ms: i64,
        ingestion_ts_ms: i64,
        collector_source: CollectorSource,
        category: EventCategory,
        process_instance_id: ProcessInstanceId,
        related_process_id: Option<ProcessInstanceId>,
        payload: EventPayload,
        capability_state: CapabilityState,
        provenance: EvidenceProvenance,
        classification: EpistemicClassification,
        dedup_key: String,
    ) -> Self {
        Self {
            event_id: Uuid::new_v4().to_string(),
            event_ts_ms,
            ingestion_ts_ms,
            collector_source,
            category,
            process_instance_id,
            related_process_id,
            payload,
            capability_state,
            provenance,
            classification,
            dedup_key,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RuleVerdict {
    Matched,
    Allowlisted,
    InsufficientCapability,
    NotMatched,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessSummary {
    pub instance_id: ProcessInstanceId,
    pub parent_instance_id: Option<ProcessInstanceId>,
    pub exe_name: String,
    pub exe_path: Option<String>,
    pub publisher: Option<String>,
    pub signature_status: SignatureStatus,
    pub cpu_percent: f32,
    pub memory_mb: f32,
    pub network_count: u64,
    pub module_count: u64,
    pub event_count: u64,
    pub activity_delta_pct: f32,
    pub sparkline: Vec<u32>,
    pub is_active: bool,
    pub is_allowlisted: bool,
    pub first_seen_ms: i64,
    pub last_seen_ms: i64,
    pub command_line_redacted: Option<String>,
    pub icon_data_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConnectionRecord {
    pub id: String,
    pub process_instance_id: ProcessInstanceId,
    pub process_name: String,
    pub protocol: String,
    pub local_addr: String,
    pub local_port: u16,
    pub remote_addr: String,
    pub remote_port: u16,
    pub remote_domain: Option<String>,
    pub state: String,
    pub direction: Option<String>,
    pub bytes_out: u64,
    pub bytes_in: u64,
    pub first_seen_ms: i64,
    pub last_seen_ms: i64,
    pub classification: EpistemicClassification,
    pub provenance: EvidenceProvenance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleRecord {
    pub id: String,
    pub process_instance_id: ProcessInstanceId,
    pub process_name: String,
    pub module_name: String,
    pub module_path: String,
    pub signature_status: SignatureStatus,
    pub publisher: Option<String>,
    pub observed_ts_ms: i64,
    pub exact_load_time: bool,
    pub provenance: EvidenceProvenance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleMatchRecord {
    pub id: String,
    pub rule_id: String,
    pub rule_name: String,
    pub description: String,
    pub verdict: RuleVerdict,
    pub severity_label: String,
    pub process_instance_id: Option<ProcessInstanceId>,
    pub process_name: Option<String>,
    pub matched_ts_ms: i64,
    pub deduplicated_count: u64,
    pub explanation: String,
    pub evidence: Vec<String>,
    pub missing_capability: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllowlistEntry {
    pub id: String,
    pub match_type: String,
    pub value: String,
    pub reason: String,
    pub created_ts_ms: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GraphNodeKind {
    Process,
    NetworkEndpoint,
    DllCluster,
    RuleMatch,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviorNode {
    pub id: String,
    pub kind: GraphNodeKind,
    pub label: String,
    pub subtitle: String,
    pub timestamp_ms: i64,
    pub signature_status: Option<SignatureStatus>,
    pub classification: EpistemicClassification,
    pub x: f32,
    pub y: f32,
    pub metadata: serde_json::Value,
    pub modules: Vec<ModuleRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviorEdge {
    pub id: String,
    pub source: String,
    pub target: String,
    pub label: String,
    pub timestamp_ms: i64,
    pub classification: EpistemicClassification,
    pub category: EventCategory,
    pub evidence: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviorGraph {
    pub root_process: ProcessSummary,
    pub nodes: Vec<BehaviorNode>,
    pub edges: Vec<BehaviorEdge>,
    pub timeline_start_ms: i64,
    pub timeline_end_ms: i64,
    pub mode: DataSourceMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineBucket {
    pub timestamp_ms: i64,
    pub label: String,
    pub total_events: u64,
    pub process_events: u64,
    pub network_events: u64,
    pub module_events: u64,
    pub rule_events: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageDiagnostics {
    pub db_path: String,
    pub wal_mode_active: bool,
    pub db_bytes: u64,
    pub wal_bytes: u64,
    pub total_bytes: u64,
    pub cap_bytes: u64,
    pub total_events: u64,
    pub retention_window_label: String,
    pub integrity_ok: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverviewSnapshot {
    pub mode: DataSourceMode,
    pub privilege_mode: PrivilegeMode,
    pub monitoring_active: bool,
    pub active_process_count: u64,
    pub total_events_window: u64,
    pub process_spawns_count: u64,
    pub network_calls_count: u64,
    pub dll_loads_count: u64,
    pub rule_matches_count: u64,
    pub high_activity_apps: Vec<ProcessSummary>,
    pub timeline: Vec<TimelineBucket>,
    pub storage: StorageDiagnostics,
    pub collector_health_ok: bool,
    pub dropped_events_24h: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticLogEntry {
    pub timestamp_ms: i64,
    pub level: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatusSnapshot {
    pub mode: DataSourceMode,
    pub privilege_mode: PrivilegeMode,
    pub monitoring_active: bool,
    pub platform: String,
    pub ipc_protocol_version: u32,
    pub ipc_healthy: bool,
    pub dropped_events: u64,
    pub collector_restarts: u64,
    pub capabilities: Vec<CollectorCapability>,
    pub storage: StorageDiagnostics,
    pub logs: Vec<DiagnosticLogEntry>,
}
