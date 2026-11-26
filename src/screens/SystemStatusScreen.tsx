import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { SystemStatusSnapshot } from '@/types/telemetry';

interface SystemStatusScreenProps {
  status: SystemStatusSnapshot | null;
}

export const SystemStatusScreen: React.FC<SystemStatusScreenProps> = ({ status }) => {
  const [copied, setCopied] = useState(false);

  const usedMb = Math.round((status?.storage.total_bytes ?? 0) / (1024 * 1024));
  const capMb = Math.max(
    Math.round((status?.storage.cap_bytes ?? 512 * 1024 * 1024) / (1024 * 1024)),
    1,
  );
  const pct = ((usedMb / capMb) * 100).toFixed(1);
  const recentLogs = (status?.logs ?? []).slice(-6);

  const copyDiagnostics = () => {
    if (!status) return;
    navigator.clipboard?.writeText(JSON.stringify(status, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em' }}>
            System Status
          </h1>
          <span className="mono" style={{ fontSize: 12, color: status?.monitoring_active ? '#5ED18A' : '#E5B567' }}>
            {status?.monitoring_active ? 'Engine Healthy' : 'Collectors Paused'} • SQLite WAL{' '}
            {status?.storage.wal_mode_active ? 'Active' : 'Off'}
          </span>
        </div>

        <button type="button" className="sw-cta-secondary" onClick={copyDiagnostics}>
          {copied ? <Check size={14} color="#5ED18A" /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy Diagnostics'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <div className="sw-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 600, color: '#F8F7FA' }}>
            Collectors
          </h2>
          {(status?.capabilities ?? []).map((cap) => {
            const stateColor =
              cap.state === 'active'
                ? '#5ED18A'
                : cap.state === 'elevation_required'
                  ? '#E5B567'
                  : '#8E8894';
            return (
              <div
                key={cap.id}
                style={{
                  padding: '9px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#F8F7FA' }}>{cap.name}</div>
                  <div style={{ fontSize: 11, color: '#8E8894', marginTop: 2 }}>{cap.limitations}</div>
                </div>
                <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: stateColor, whiteSpace: 'nowrap' }}>
                  {cap.state === 'active'
                    ? 'ACTIVE'
                    : cap.state === 'elevation_required'
                      ? 'UAC REQ.'
                      : cap.state.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="sw-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: '#F8F7FA' }}>
            Storage &amp; IPC
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { k: 'Database', v: status?.storage.wal_mode_active ? 'SQLite WAL' : 'Journal' },
              { k: 'Ring Buffer', v: `${usedMb} / ${capMb} MB (${pct}%)` },
              { k: 'Integrity', v: status?.storage.integrity_ok ? 'Passed' : 'Check' },
              { k: 'IPC', v: `v${status?.ipc_protocol_version ?? 1} ${status?.ipc_healthy ? 'OK' : 'Err'}` },
              { k: 'Dropped', v: String(status?.dropped_events ?? 0) },
              { k: 'Restarts', v: String(status?.collector_restarts ?? 0) },
            ].map((m) => (
              <div key={m.k} className="sw-tile" style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#8E8894' }}>{m.k}</div>
                <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: '#F8F7FA', marginTop: 4 }}>
                  {m.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sw-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: '#F8F7FA' }}>
          Recent Engine Activity
        </h2>
        {recentLogs.length === 0 ? (
          <div className="mono" style={{ fontSize: 12, color: '#8E8894' }}>
            No runtime warnings recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {recentLogs.map((log, i) => (
              <div key={i} className="mono" style={{ fontSize: 11.5, color: '#B4AEB8' }}>
                <span style={{ color: '#7E7886' }}>
                  {new Date(log.timestamp_ms).toISOString().slice(11, 19)}
                </span>{' '}
                <span style={{ color: log.level === 'WARN' ? '#E5B567' : '#5ED18A' }}>
                  [{log.level}]
                </span>{' '}
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
