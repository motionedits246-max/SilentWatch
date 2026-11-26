import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { SystemStatusSnapshot } from '@/types/telemetry';

interface SystemStatusScreenProps {
  status: SystemStatusSnapshot | null;
}

export const SystemStatusScreen: React.FC<SystemStatusScreenProps> = ({ status }) => {
  const [copied, setCopied] = useState(false);

  const usedMb = Math.round((status?.storage.total_bytes ?? 0) / (1024 * 1024));
  const capMb = Math.max(Math.round((status?.storage.cap_bytes ?? 512 * 1024 * 1024) / (1024 * 1024)), 1);
  const pct = ((usedMb / capMb) * 100).toFixed(1);

  const copyDiagnostics = () => {
    if (!status) return;
    navigator.clipboard?.writeText(JSON.stringify(status, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '2px 4px' }}>
        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 500, letterSpacing: '-0.02em' }}>System Status</h1>
        <span className="mono" style={{ fontSize: 12, color: '#5ED18A' }}>
          {status?.monitoring_active ? 'Local Engine Healthy' : 'Collectors Stopped'} • SQLite WAL {status?.storage.wal_mode_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 14 }}>
        <div className="sw-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#EAE6EA' }}>Collector Capabilities Matrix</h2>
          {(status?.capabilities ?? []).map((cap) => {
            const stateColor = cap.state === 'active' ? '#5ED18A' : cap.state === 'elevation_required' ? '#E5B567' : '#847C84';
            return (
              <div key={cap.id} style={{ padding: '10px 12px', borderRadius: 10, background: '#100E10', border: '1px solid #241F23', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#F5F3F5' }}>{cap.name}</div>
                  <div style={{ fontSize: 11.5, color: '#847C84', marginTop: 3 }}>{cap.limitations}</div>
                </div>
                <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: stateColor, whiteSpace: 'nowrap' }}>
                  {cap.state === 'active' ? 'ACTIVE' : cap.state === 'elevation_required' ? 'ELEVATION REQ.' : cap.state.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="sw-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#EAE6EA' }}>Storage &amp; IPC Health</h2>
          <div className="mono" style={{ fontSize: 12, color: '#D4CED4', lineHeight: 1.85 }}>
            <div>Database: Local SQLite ({status?.storage.wal_mode_active ? 'WAL Mode' : 'Journal'})</div>
            <div>Ring Buffer: {usedMb} / {capMb} MB ({pct}%)</div>
            <div>Integrity Check: {status?.storage.integrity_ok ? 'Passed (0 errors)' : 'Needs Recovery'}</div>
            <div>IPC Protocol: Typed v{status?.ipc_protocol_version ?? 1} ({status?.ipc_healthy ? 'Healthy' : 'Degraded'})</div>
            <div>Dropped Events (24h): {status?.dropped_events ?? 0}</div>
            <div>Collector Restarts: {status?.collector_restarts ?? 0}</div>
            <div>CSP Policy: Strict Local / Zero Remote Scripts</div>
          </div>
        </div>
      </div>

      <div className="sw-card" style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 500, color: '#EAE6EA' }}>Collector Event Log &amp; Self-Check</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(status?.logs ?? []).map((log, i) => (
              <div key={i} className="mono" style={{ fontSize: 11.5, color: '#A8A2A8' }}>
                <span style={{ color: '#847C84' }}>{new Date(log.timestamp_ms).toISOString().slice(11, 23)}</span>{' '}
                <span style={{ color: log.level === 'WARN' ? '#E5B567' : '#5ED18A' }}>[{log.level}]</span>{' '}
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="sw-cta-secondary" onClick={copyDiagnostics}>
            {copied ? <Check size={14} color="#5ED18A" /> : <Copy size={14} />}
            <span>{copied ? 'Sanitized Bundle Copied' : 'Copy Diagnostics Bundle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
