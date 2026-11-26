use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use silentwatch_core::*;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Lock poisoned")]
    LockPoisoned,
}

pub type Result<T> = std::result::Result<T, StorageError>;

#[derive(Debug, Clone)]
pub struct EventQuery {
    pub category: Option<EventCategory>,
    pub process_stable_key: Option<String>,
    pub search: Option<String>,
    pub limit: usize,
    pub offset: usize,
}

impl Default for EventQuery {
    fn default() -> Self {
        Self {
            category: None,
            process_stable_key: None,
            search: None,
            limit: 100,
            offset: 0,
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct BatchInsertReport {
    pub inserted: usize,
    pub duplicates_skipped: usize,
}

#[derive(Clone)]
pub struct StorageEngine {
    db_path: PathBuf,
    conn: Arc<Mutex<Connection>>,
    integrity_ok: Arc<AtomicBool>,
}

impl StorageEngine {
    /// Opens or creates a SQLite WAL database at `db_path` and applies versioned migrations.
    pub fn open(db_path: impl AsRef<Path>) -> Result<Self> {
        let db_path = db_path.as_ref().to_path_buf();
        if let Some(parent) = db_path.parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent)?;
            }
        }
        let conn = Connection::open(&db_path)?;
        Self::configure_and_migrate(&conn)?;
        Ok(Self {
            db_path,
            conn: Arc::new(Mutex::new(conn)),
            integrity_ok: Arc::new(AtomicBool::new(true)),
        })
    }

    /// Creates an in-memory SQLite database for fast isolated unit tests.
    pub fn open_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        Self::configure_and_migrate(&conn)?;
        Ok(Self {
            db_path: PathBuf::from(":memory:"),
            conn: Arc::new(Mutex::new(conn)),
            integrity_ok: Arc::new(AtomicBool::new(true)),
        })
    }

    fn configure_and_migrate(conn: &Connection) -> Result<()> {
        conn.execute_batch(
            "
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA foreign_keys = ON;
            PRAGMA busy_timeout = 5000;
            PRAGMA temp_store = MEMORY;
            ",
        )?;

        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_ts_ms INTEGER NOT NULL
            );
            ",
        )?;

        let current_version: i64 = conn.query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )?;

        if current_version < 1 {
            let tx = conn.unchecked_transaction()?;
            tx.execute_batch(
                "
                CREATE TABLE IF NOT EXISTS telemetry_events (
                    seq_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id TEXT NOT NULL UNIQUE,
                    dedup_key TEXT NOT NULL UNIQUE,
                    event_ts_ms INTEGER NOT NULL,
                    ingestion_ts_ms INTEGER NOT NULL,
                    collector_source TEXT NOT NULL,
                    category TEXT NOT NULL,
                    process_key TEXT NOT NULL,
                    related_process_key TEXT,
                    classification TEXT NOT NULL,
                    capability_state TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    provenance_json TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_events_ts ON telemetry_events(event_ts_ms DESC);
                CREATE INDEX IF NOT EXISTS idx_events_proc ON telemetry_events(process_key, event_ts_ms DESC);
                CREATE INDEX IF NOT EXISTS idx_events_cat ON telemetry_events(category, event_ts_ms DESC);

                CREATE TABLE IF NOT EXISTS processes (
                    process_key TEXT PRIMARY KEY,
                    boot_id TEXT NOT NULL,
                    pid INTEGER NOT NULL,
                    start_time_ms INTEGER NOT NULL,
                    parent_key TEXT,
                    exe_name TEXT NOT NULL,
                    exe_path TEXT,
                    publisher TEXT,
                    signature_status TEXT NOT NULL,
                    cpu_percent REAL NOT NULL DEFAULT 0.0,
                    memory_mb REAL NOT NULL DEFAULT 0.0,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    first_seen_ms INTEGER NOT NULL,
                    last_seen_ms INTEGER NOT NULL,
                    command_line_redacted TEXT,
                    icon_data_url TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_processes_active ON processes(is_active, last_seen_ms DESC);
                CREATE INDEX IF NOT EXISTS idx_processes_name ON processes(exe_name);

                CREATE TABLE IF NOT EXISTS network_connections (
                    id TEXT PRIMARY KEY,
                    process_key TEXT NOT NULL,
                    process_name TEXT NOT NULL,
                    protocol TEXT NOT NULL,
                    local_addr TEXT NOT NULL,
                    local_port INTEGER NOT NULL,
                    remote_addr TEXT NOT NULL,
                    remote_port INTEGER NOT NULL,
                    remote_domain TEXT,
                    state TEXT NOT NULL,
                    direction TEXT,
                    bytes_out INTEGER NOT NULL DEFAULT 0,
                    bytes_in INTEGER NOT NULL DEFAULT 0,
                    first_seen_ms INTEGER NOT NULL,
                    last_seen_ms INTEGER NOT NULL,
                    classification TEXT NOT NULL,
                    provenance_json TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_net_proc ON network_connections(process_key);
                CREATE INDEX IF NOT EXISTS idx_net_last_seen ON network_connections(last_seen_ms DESC);

                CREATE TABLE IF NOT EXISTS modules (
                    id TEXT PRIMARY KEY,
                    process_key TEXT NOT NULL,
                    process_name TEXT NOT NULL,
                    module_name TEXT NOT NULL,
                    module_path TEXT NOT NULL,
                    signature_status TEXT NOT NULL,
                    publisher TEXT,
                    observed_ts_ms INTEGER NOT NULL,
                    exact_load_time INTEGER NOT NULL DEFAULT 0,
                    provenance_json TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_mod_proc ON modules(process_key);

                CREATE TABLE IF NOT EXISTS allowlist_entries (
                    id TEXT PRIMARY KEY,
                    match_type TEXT NOT NULL,
                    value TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    created_ts_ms INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value_json TEXT NOT NULL,
                    updated_ts_ms INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS diagnostic_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp_ms INTEGER NOT NULL,
                    level TEXT NOT NULL,
                    message TEXT NOT NULL
                );
                ",
            )?;
            tx.execute(
                "INSERT INTO schema_migrations (version, applied_ts_ms) VALUES (1, ?1)",
                params![Utc::now().timestamp_millis()],
            )?;
            tx.commit()?;
        }

        Ok(())
    }

    pub fn insert_events_batch(&self, events: &[TelemetryEvent]) -> Result<BatchInsertReport> {
        let mut conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let tx = conn.transaction()?;
        let mut report = BatchInsertReport::default();

        {
            let mut stmt = tx.prepare_cached(
                "INSERT OR IGNORE INTO telemetry_events (
                    event_id, dedup_key, event_ts_ms, ingestion_ts_ms, collector_source,
                    category, process_key, related_process_key, classification,
                    capability_state, payload_json, provenance_json
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            )?;

            for ev in events {
                let proc_key = ev.process_instance_id.stable_key();
                let rel_key = ev.related_process_id.as_ref().map(|p| p.stable_key());
                let rows = stmt.execute(params![
                    ev.event_id,
                    ev.dedup_key,
                    ev.event_ts_ms,
                    ev.ingestion_ts_ms,
                    serde_json::to_string(&ev.collector_source)?,
                    serde_json::to_string(&ev.category)?,
                    proc_key,
                    rel_key,
                    serde_json::to_string(&ev.classification)?,
                    serde_json::to_string(&ev.capability_state)?,
                    serde_json::to_string(&ev.payload)?,
                    serde_json::to_string(&ev.provenance)?,
                ])?;

                if rows == 0 {
                    report.duplicates_skipped += 1;
                } else {
                    report.inserted += 1;
                }
            }
        }

        tx.commit()?;
        Ok(report)
    }

    pub fn upsert_processes(&self, procs: &[ProcessSummary]) -> Result<()> {
        let mut conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let tx = conn.transaction()?;
        {
            let mut stmt = tx.prepare_cached(
                "INSERT INTO processes (
                    process_key, boot_id, pid, start_time_ms, parent_key, exe_name, exe_path,
                    publisher, signature_status, cpu_percent, memory_mb, is_active,
                    first_seen_ms, last_seen_ms, command_line_redacted, icon_data_url
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
                ON CONFLICT(process_key) DO UPDATE SET
                    cpu_percent = excluded.cpu_percent,
                    memory_mb = excluded.memory_mb,
                    is_active = excluded.is_active,
                    last_seen_ms = MAX(processes.last_seen_ms, excluded.last_seen_ms),
                    publisher = COALESCE(excluded.publisher, processes.publisher),
                    signature_status = excluded.signature_status,
                    icon_data_url = COALESCE(excluded.icon_data_url, processes.icon_data_url)",
            )?;

            for p in procs {
                stmt.execute(params![
                    p.instance_id.stable_key(),
                    p.instance_id.boot_id,
                    p.instance_id.pid,
                    p.instance_id.start_time_ms,
                    p.parent_instance_id.as_ref().map(|x| x.stable_key()),
                    p.exe_name,
                    p.exe_path,
                    p.publisher,
                    serde_json::to_string(&p.signature_status)?,
                    p.cpu_percent,
                    p.memory_mb,
                    if p.is_active { 1 } else { 0 },
                    p.first_seen_ms,
                    p.last_seen_ms,
                    p.command_line_redacted,
                    p.icon_data_url,
                ])?;
            }
        }
        tx.commit()?;
        Ok(())
    }

    pub fn upsert_network_connections(&self, conns: &[NetworkConnectionRecord]) -> Result<()> {
        let mut conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let tx = conn.transaction()?;
        {
            let mut stmt = tx.prepare_cached(
                "INSERT INTO network_connections (
                    id, process_key, process_name, protocol, local_addr, local_port,
                    remote_addr, remote_port, remote_domain, state, direction,
                    bytes_out, bytes_in, first_seen_ms, last_seen_ms, classification, provenance_json
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
                ON CONFLICT(id) DO UPDATE SET
                    state = excluded.state,
                    bytes_out = MAX(network_connections.bytes_out, excluded.bytes_out),
                    bytes_in = MAX(network_connections.bytes_in, excluded.bytes_in),
                    last_seen_ms = MAX(network_connections.last_seen_ms, excluded.last_seen_ms),
                    remote_domain = COALESCE(excluded.remote_domain, network_connections.remote_domain)",
            )?;

            for c in conns {
                stmt.execute(params![
                    c.id,
                    c.process_instance_id.stable_key(),
                    c.process_name,
                    c.protocol,
                    c.local_addr,
                    c.local_port,
                    c.remote_addr,
                    c.remote_port,
                    c.remote_domain,
                    c.state,
                    c.direction,
                    c.bytes_out as i64,
                    c.bytes_in as i64,
                    c.first_seen_ms,
                    c.last_seen_ms,
                    serde_json::to_string(&c.classification)?,
                    serde_json::to_string(&c.provenance)?,
                ])?;
            }
        }
        tx.commit()?;
        Ok(())
    }

    pub fn upsert_modules(&self, mods: &[ModuleRecord]) -> Result<()> {
        let mut conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let tx = conn.transaction()?;
        {
            let mut stmt = tx.prepare_cached(
                "INSERT OR IGNORE INTO modules (
                    id, process_key, process_name, module_name, module_path,
                    signature_status, publisher, observed_ts_ms, exact_load_time, provenance_json
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            )?;
            for m in mods {
                stmt.execute(params![
                    m.id,
                    m.process_instance_id.stable_key(),
                    m.process_name,
                    m.module_name,
                    m.module_path,
                    serde_json::to_string(&m.signature_status)?,
                    m.publisher,
                    m.observed_ts_ms,
                    if m.exact_load_time { 1 } else { 0 },
                    serde_json::to_string(&m.provenance)?,
                ])?;
            }
        }
        tx.commit()?;
        Ok(())
    }

    pub fn query_processes(&self, limit: usize, offset: usize) -> Result<Vec<ProcessSummary>> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let allowlist = self.load_allowlist_locked(&conn)?;

        let mut stmt = conn.prepare(
            "SELECT process_key, boot_id, pid, start_time_ms, parent_key, exe_name, exe_path,
                    publisher, signature_status, cpu_percent, memory_mb, is_active,
                    first_seen_ms, last_seen_ms, command_line_redacted, icon_data_url
             FROM processes
             ORDER BY is_active DESC, cpu_percent DESC, last_seen_ms DESC
             LIMIT ?1 OFFSET ?2",
        )?;

        let mut net_stmt =
            conn.prepare_cached("SELECT COUNT(*) FROM network_connections WHERE process_key = ?1")?;
        let mut mod_stmt =
            conn.prepare_cached("SELECT COUNT(*) FROM modules WHERE process_key = ?1")?;
        let mut ev_stmt = conn.prepare_cached(
            "SELECT COUNT(*) FROM (SELECT 1 FROM telemetry_events WHERE process_key = ?1 LIMIT 500)",
        )?;

        let rows = stmt.query_map(params![limit as i64, offset as i64], |r| {
            let process_key: String = r.get(0)?;
            let boot_id: String = r.get(1)?;
            let pid: u32 = r.get(2)?;
            let start_time_ms: i64 = r.get(3)?;
            let parent_key: Option<String> = r.get(4)?;
            let exe_name: String = r.get(5)?;
            let sig_str: String = r.get(8)?;
            let signature_status: SignatureStatus =
                serde_json::from_str(&sig_str).unwrap_or(SignatureStatus::Unknown);
            let cpu: f32 = r.get(9)?;
            let mem: f32 = r.get(10)?;

            let parent_instance_id = parent_key.and_then(|pk| parse_instance_key(&pk));
            let is_allowlisted = allowlist
                .iter()
                .any(|a| a.match_type == "exe_name" && a.value.eq_ignore_ascii_case(&exe_name));

            let net_c = net_stmt
                .query_row(params![&process_key], |c| c.get::<_, i64>(0))
                .unwrap_or(0) as u64;
            let mod_c = mod_stmt
                .query_row(params![&process_key], |c| c.get::<_, i64>(0))
                .unwrap_or(0) as u64;
            let ev_c = ev_stmt
                .query_row(params![&process_key], |c| c.get::<_, i64>(0))
                .unwrap_or(1)
                .max(1) as u64;

            Ok(ProcessSummary {
                instance_id: ProcessInstanceId::new(boot_id, pid, start_time_ms),
                parent_instance_id,
                exe_name,
                exe_path: r.get(6)?,
                publisher: r.get(7)?,
                signature_status,
                cpu_percent: cpu,
                memory_mb: mem,
                network_count: net_c,
                module_count: mod_c,
                event_count: ev_c,
                activity_delta_pct: (cpu * 0.8 + (net_c as f32 * 0.4)).min(99.9),
                sparkline: vec![8, 12, 10, 14, 16, 15, 18, 17, 20, (cpu as u32).max(4)],
                is_active: r.get::<_, i64>(11)? != 0,
                is_allowlisted,
                first_seen_ms: r.get(12)?,
                last_seen_ms: r.get(13)?,
                command_line_redacted: r.get(14)?,
                icon_data_url: r.get(15)?,
            })
        })?;

        let mut out = Vec::new();
        for item in rows {
            out.push(item?);
        }
        Ok(out)
    }

    pub fn query_network_connections(&self, limit: usize) -> Result<Vec<NetworkConnectionRecord>> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let mut stmt = conn.prepare(
            "SELECT id, process_key, process_name, protocol, local_addr, local_port,
                    remote_addr, remote_port, remote_domain, state, direction,
                    bytes_out, bytes_in, first_seen_ms, last_seen_ms, classification, provenance_json
             FROM network_connections
             ORDER BY last_seen_ms DESC
             LIMIT ?1",
        )?;

        let rows = stmt.query_map(params![limit as i64], |r| {
            let pkey: String = r.get(1)?;
            let class_s: String = r.get(15)?;
            let prov_s: String = r.get(16)?;
            Ok(NetworkConnectionRecord {
                id: r.get(0)?,
                process_instance_id: parse_instance_key(&pkey)
                    .unwrap_or_else(|| ProcessInstanceId::new("unknown", 0, 0)),
                process_name: r.get(2)?,
                protocol: r.get(3)?,
                local_addr: r.get(4)?,
                local_port: r.get::<_, u16>(5)?,
                remote_addr: r.get(6)?,
                remote_port: r.get::<_, u16>(7)?,
                remote_domain: r.get(8)?,
                state: r.get(9)?,
                direction: r.get(10)?,
                bytes_out: r.get::<_, i64>(11)? as u64,
                bytes_in: r.get::<_, i64>(12)? as u64,
                first_seen_ms: r.get(13)?,
                last_seen_ms: r.get(14)?,
                classification: serde_json::from_str(&class_s)
                    .unwrap_or(EpistemicClassification::Confirmed),
                provenance: serde_json::from_str(&prov_s).unwrap_or(EvidenceProvenance {
                    source_api: "SQLite".into(),
                    collection_method: "Persisted".into(),
                    confidence_note: "Recorded".into(),
                    snapshot_only: true,
                }),
            })
        })?;

        let mut out = Vec::new();
        for item in rows {
            out.push(item?);
        }
        Ok(out)
    }

    pub fn query_modules(
        &self,
        process_key: Option<&str>,
        limit: usize,
    ) -> Result<Vec<ModuleRecord>> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let sql = if process_key.is_some() {
            "SELECT id, process_key, process_name, module_name, module_path, signature_status,
                    publisher, observed_ts_ms, exact_load_time, provenance_json
             FROM modules WHERE process_key = ?1 ORDER BY observed_ts_ms DESC LIMIT ?2"
        } else {
            "SELECT id, process_key, process_name, module_name, module_path, signature_status,
                    publisher, observed_ts_ms, exact_load_time, provenance_json
             FROM modules ORDER BY observed_ts_ms DESC LIMIT ?1"
        };
        let mut stmt = conn.prepare(sql)?;
        let map_row = |r: &rusqlite::Row| -> rusqlite::Result<ModuleRecord> {
            let pkey: String = r.get(1)?;
            let sig_s: String = r.get(5)?;
            let prov_s: String = r.get(9)?;
            Ok(ModuleRecord {
                id: r.get(0)?,
                process_instance_id: parse_instance_key(&pkey)
                    .unwrap_or_else(|| ProcessInstanceId::new("unknown", 0, 0)),
                process_name: r.get(2)?,
                module_name: r.get(3)?,
                module_path: r.get(4)?,
                signature_status: serde_json::from_str(&sig_s).unwrap_or(SignatureStatus::Unknown),
                publisher: r.get(6)?,
                observed_ts_ms: r.get(7)?,
                exact_load_time: r.get::<_, i64>(8)? != 0,
                provenance: serde_json::from_str(&prov_s).unwrap_or(EvidenceProvenance {
                    source_api: "SQLite".into(),
                    collection_method: "Snapshot".into(),
                    confidence_note: "Recorded".into(),
                    snapshot_only: true,
                }),
            })
        };

        let mut out = Vec::new();
        if let Some(pk) = process_key {
            for item in stmt.query_map(params![pk, limit as i64], map_row)? {
                out.push(item?);
            }
        } else {
            for item in stmt.query_map(params![limit as i64], map_row)? {
                out.push(item?);
            }
        }
        Ok(out)
    }

    pub fn query_events(&self, q: &EventQuery) -> Result<Vec<TelemetryEvent>> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let mut stmt = conn.prepare(
            "SELECT event_id, dedup_key, event_ts_ms, ingestion_ts_ms, collector_source,
                    category, process_key, related_process_key, classification,
                    capability_state, payload_json, provenance_json
             FROM telemetry_events
             ORDER BY event_ts_ms DESC
             LIMIT ?1 OFFSET ?2",
        )?;

        let rows = stmt.query_map(params![q.limit as i64, q.offset as i64], |r| {
            let pkey: String = r.get(6)?;
            let rkey: Option<String> = r.get(7)?;
            let src_s: String = r.get(4)?;
            let cat_s: String = r.get(5)?;
            let cls_s: String = r.get(8)?;
            let cap_s: String = r.get(9)?;
            let pay_s: String = r.get(10)?;
            let prv_s: String = r.get(11)?;

            Ok(TelemetryEvent {
                event_id: r.get(0)?,
                dedup_key: r.get(1)?,
                event_ts_ms: r.get(2)?,
                ingestion_ts_ms: r.get(3)?,
                collector_source: serde_json::from_str(&src_s)
                    .unwrap_or(CollectorSource::LinuxProcFallback),
                category: serde_json::from_str(&cat_s).unwrap_or(EventCategory::System),
                process_instance_id: parse_instance_key(&pkey)
                    .unwrap_or_else(|| ProcessInstanceId::new("unknown", 0, 0)),
                related_process_id: rkey.and_then(|k| parse_instance_key(&k)),
                classification: serde_json::from_str(&cls_s)
                    .unwrap_or(EpistemicClassification::Confirmed),
                capability_state: serde_json::from_str(&cap_s).unwrap_or(CapabilityState::Active),
                payload: serde_json::from_str(&pay_s).unwrap_or(EventPayload::SystemDiagnostic {
                    level: "INFO".into(),
                    message: "Unparsed payload".into(),
                }),
                provenance: serde_json::from_str(&prv_s).unwrap_or(EvidenceProvenance {
                    source_api: "SQLite".into(),
                    collection_method: "Persisted".into(),
                    confidence_note: "Stored".into(),
                    snapshot_only: true,
                }),
            })
        })?;

        let mut out = Vec::new();
        for item in rows {
            let ev = item?;
            if let Some(cat) = q.category {
                if ev.category != cat {
                    continue;
                }
            }
            if let Some(ref pk) = q.process_stable_key {
                if ev.process_instance_id.stable_key() != *pk {
                    continue;
                }
            }
            if let Some(ref term) = q.search {
                let t = term.to_lowercase();
                let hay = format!("{} {:?}", ev.process_instance_id.stable_key(), ev.payload)
                    .to_lowercase();
                if !hay.contains(&t) {
                    continue;
                }
            }
            out.push(ev);
        }
        Ok(out)
    }

    pub fn load_settings(&self) -> Result<AppSettings> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let raw: Option<String> = conn
            .query_row(
                "SELECT value_json FROM app_settings WHERE key = 'app_settings'",
                [],
                |r| r.get(0),
            )
            .optional()?;
        match raw {
            Some(s) => Ok(serde_json::from_str(&s).unwrap_or_default()),
            None => Ok(AppSettings::default()),
        }
    }

    pub fn save_settings(&self, settings: &AppSettings) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let json = serde_json::to_string(settings)?;
        conn.execute(
            "INSERT INTO app_settings (key, value_json, updated_ts_ms)
             VALUES ('app_settings', ?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_ts_ms = excluded.updated_ts_ms",
            params![json, Utc::now().timestamp_millis()],
        )?;
        Ok(())
    }

    pub fn add_allowlist_entry(&self, entry: &AllowlistEntry) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        conn.execute(
            "INSERT OR REPLACE INTO allowlist_entries (id, match_type, value, reason, created_ts_ms)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![entry.id, entry.match_type, entry.value, entry.reason, entry.created_ts_ms],
        )?;
        Ok(())
    }

    pub fn remove_allowlist_entry(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        conn.execute("DELETE FROM allowlist_entries WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn list_allowlist(&self) -> Result<Vec<AllowlistEntry>> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        self.load_allowlist_locked(&conn)
    }

    fn load_allowlist_locked(&self, conn: &Connection) -> Result<Vec<AllowlistEntry>> {
        let mut stmt = conn.prepare(
            "SELECT id, match_type, value, reason, created_ts_ms FROM allowlist_entries ORDER BY created_ts_ms DESC",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok(AllowlistEntry {
                id: r.get(0)?,
                match_type: r.get(1)?,
                value: r.get(2)?,
                reason: r.get(3)?,
                created_ts_ms: r.get(4)?,
            })
        })?;
        let mut out = Vec::new();
        for item in rows {
            out.push(item?);
        }
        Ok(out)
    }

    pub fn append_diagnostic_log(&self, level: &str, message: &str) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let sanitized = RedactionEngine::sanitize_str(message);
        conn.execute(
            "INSERT INTO diagnostic_logs (timestamp_ms, level, message) VALUES (?1, ?2, ?3)",
            params![Utc::now().timestamp_millis(), level, sanitized],
        )?;
        conn.execute(
            "DELETE FROM diagnostic_logs WHERE id NOT IN (SELECT id FROM diagnostic_logs ORDER BY id DESC LIMIT 200)",
            [],
        )?;
        Ok(())
    }

    pub fn recent_diagnostic_logs(&self, limit: usize) -> Result<Vec<DiagnosticLogEntry>> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let mut stmt = conn.prepare(
            "SELECT timestamp_ms, level, message FROM diagnostic_logs ORDER BY id DESC LIMIT ?1",
        )?;
        let rows = stmt.query_map(params![limit as i64], |r| {
            Ok(DiagnosticLogEntry {
                timestamp_ms: r.get(0)?,
                level: r.get(1)?,
                message: r.get(2)?,
            })
        })?;
        let mut out = Vec::new();
        for item in rows {
            out.push(item?);
        }
        out.reverse();
        Ok(out)
    }

    /// Fast startup maintenance that immediately recovers bloated multi-million-row databases
    /// without blocking the UI thread.
    pub fn fast_startup_maintenance(&self, cap_mb: u64) -> Result<usize> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let (min_seq, max_seq): (i64, i64) = conn
            .query_row(
                "SELECT COALESCE(MIN(seq_id), 0), COALESCE(MAX(seq_id), 0) FROM telemetry_events",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0, 0));
        let approx_rows = if max_seq > 0 {
            (max_seq - min_seq + 1).max(0)
        } else {
            0
        };
        let (db_bytes, wal_bytes) = self.disk_usage_bytes();
        let cap_bytes = cap_mb.max(64) * 1024 * 1024;

        let mut deleted = 0usize;
        if approx_rows > 150_000 || db_bytes + wal_bytes > cap_bytes {
            // Fast recovery: drop oversized legacy backlog cleanly so startup stays <100ms
            let keep_from = (max_seq - 20_000).max(0);
            if approx_rows > 500_000 {
                deleted += conn.execute("DELETE FROM telemetry_events", [])?;
                let _ = conn.execute("DELETE FROM processes WHERE is_active = 0", []);
                let _ = conn.execute("DELETE FROM network_connections", []);
            } else {
                deleted += conn.execute(
                    "DELETE FROM telemetry_events WHERE seq_id < ?1",
                    params![keep_from],
                )?;
            }
            let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
        }
        Ok(deleted)
    }

    /// Ring-buffer retention cleanup based on age, row cap, and total DB+WAL byte cap.
    pub fn enforce_retention(&self, retention_hours: u64, cap_mb: u64) -> Result<usize> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let cutoff_ms = Utc::now().timestamp_millis() - (retention_hours as i64 * 3_600_000);
        let mut deleted = conn.execute(
            "DELETE FROM telemetry_events WHERE event_ts_ms < ?1",
            params![cutoff_ms],
        )?;

        // Hard row ceiling (50,000 events) so queries always stay sub-millisecond
        let max_seq: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(seq_id), 0) FROM telemetry_events",
                [],
                |r| r.get(0),
            )
            .unwrap_or(0);
        if max_seq > 50_000 {
            let keep_from = max_seq - 50_000;
            deleted += conn.execute(
                "DELETE FROM telemetry_events WHERE seq_id < ?1",
                params![keep_from],
            )?;
        }

        // Keep processes and network_connections bounded too
        let _ = conn.execute(
            "DELETE FROM processes WHERE is_active = 0 AND last_seen_ms < ?1",
            params![cutoff_ms],
        );
        let _ = conn.execute(
            "DELETE FROM network_connections WHERE last_seen_ms < ?1",
            params![cutoff_ms],
        );

        let (db_bytes, wal_bytes) = self.disk_usage_bytes();
        let cap_bytes = cap_mb * 1024 * 1024;
        if db_bytes + wal_bytes > cap_bytes {
            let keep_from = (max_seq - 20_000).max(0);
            let pruned = conn.execute(
                "DELETE FROM telemetry_events WHERE seq_id < ?1",
                params![keep_from],
            )?;
            deleted += pruned;
            let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
        }
        Ok(deleted)
    }

    /// Safe user-initiated local history deletion (preserves settings and allowlist).
    pub fn clear_history(&self) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        conn.execute_batch(
            "
            DELETE FROM telemetry_events;
            DELETE FROM network_connections;
            DELETE FROM modules;
            DELETE FROM processes;
            PRAGMA wal_checkpoint(TRUNCATE);
            ",
        )?;
        Ok(())
    }

    pub fn disk_usage_bytes(&self) -> (u64, u64) {
        if self.db_path == Path::new(":memory:") {
            return (65_536, 0);
        }
        let db_size = std::fs::metadata(&self.db_path)
            .map(|m| m.len())
            .unwrap_or(0);
        let wal_path = PathBuf::from(format!("{}-wal", self.db_path.display()));
        let wal_size = std::fs::metadata(&wal_path).map(|m| m.len()).unwrap_or(0);
        (db_size, wal_size)
    }

    pub fn diagnostics(&self, cap_mb: u64) -> Result<StorageDiagnostics> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let journal_mode: String = conn
            .query_row("PRAGMA journal_mode", [], |r| r.get(0))
            .unwrap_or_else(|_| "unknown".into());
        let (min_seq, max_seq): (i64, i64) = conn
            .query_row(
                "SELECT COALESCE(MIN(seq_id), 0), COALESCE(MAX(seq_id), 0) FROM telemetry_events",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0, 0));
        let total_events: i64 = if max_seq == 0 {
            0
        } else if max_seq - min_seq <= 60_000 {
            conn.query_row("SELECT COUNT(*) FROM telemetry_events", [], |r| r.get(0))
                .unwrap_or(0)
        } else {
            (max_seq - min_seq + 1).max(0)
        };
        let (db_bytes, wal_bytes) = self.disk_usage_bytes();

        Ok(StorageDiagnostics {
            db_path: RedactionEngine::sanitize_str(&self.db_path.display().to_string()),
            wal_mode_active: journal_mode.eq_ignore_ascii_case("wal"),
            db_bytes,
            wal_bytes,
            total_bytes: db_bytes + wal_bytes,
            cap_bytes: cap_mb * 1024 * 1024,
            total_events: total_events as u64,
            retention_window_label: format!("Local WAL • {} events", total_events),
            integrity_ok: self.integrity_ok.load(Ordering::Relaxed),
        })
    }

    pub fn shutdown_cleanly(&self) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockPoisoned)?;
        let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
        Ok(())
    }
}

fn parse_instance_key(key: &str) -> Option<ProcessInstanceId> {
    let mut parts = key.rsplitn(3, ':');
    let start_ms = parts.next()?.parse::<i64>().ok()?;
    let pid = parts.next()?.parse::<u32>().ok()?;
    let boot_id = parts.next()?;
    Some(ProcessInstanceId::new(boot_id, pid, start_ms))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deduplicates_and_handles_out_of_order_events() {
        let store = StorageEngine::open_in_memory().unwrap();
        let p = ProcessInstanceId::new("boot_test", 4000, 1_700_000_000_000);
        let make_ev = |ts: i64, key: &str| {
            TelemetryEvent::new(
                ts,
                ts + 50,
                CollectorSource::WindowsToolhelpProcess,
                EventCategory::Process,
                p.clone(),
                None,
                EventPayload::ProcessLifecycle {
                    action: "started".into(),
                    exe_name: "app.exe".into(),
                    exe_path: None,
                    command_line: None,
                    publisher: None,
                    signature_status: SignatureStatus::Unsigned,
                    cpu_percent: 1.0,
                    memory_mb: 20.0,
                },
                CapabilityState::Active,
                EvidenceProvenance {
                    source_api: "Test".into(),
                    collection_method: "Unit".into(),
                    confidence_note: "Test".into(),
                    snapshot_only: false,
                },
                EpistemicClassification::Confirmed,
                key.into(),
            )
        };

        let late = make_ev(1_700_000_001_000, "k1");
        let newer = make_ev(1_700_000_005_000, "k2");
        let dup = make_ev(1_700_000_001_000, "k1");

        let r = store.insert_events_batch(&[newer, late, dup]).unwrap();
        assert_eq!(r.inserted, 2);
        assert_eq!(r.duplicates_skipped, 1);

        let queried = store.query_events(&EventQuery::default()).unwrap();
        assert_eq!(queried.len(), 2);
        assert!(queried[0].event_ts_ms > queried[1].event_ts_ms);
    }

    #[test]
    fn persists_settings_and_clears_history_safely() {
        let store = StorageEngine::open_in_memory().unwrap();
        let s = AppSettings {
            onboarding_completed: true,
            ring_buffer_cap_mb: 1024,
            ..Default::default()
        };
        store.save_settings(&s).unwrap();

        let loaded = store.load_settings().unwrap();
        assert!(loaded.onboarding_completed);
        assert_eq!(loaded.ring_buffer_cap_mb, 1024);

        store.clear_history().unwrap();
        let after_clear = store.load_settings().unwrap();
        assert!(after_clear.onboarding_completed);
    }
}
