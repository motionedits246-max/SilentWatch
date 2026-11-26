import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2 } from 'lucide-react';
import { ExportActionButton } from '@/components/ExportActionButton';
import { ExportFolderIllustration } from '@/assets/VisualAssets';
import { SPRINGS } from '@/animations/motionTokens';
import type {
  AllowlistEntry,
  DataSourceMode,
  ExportFormat,
  MotionTier,
  RuleMatchRecord,
  TelemetryEvent,
} from '@/types/telemetry';

interface DetectionsLogsScreenProps {
  mode: DataSourceMode;
  rules: RuleMatchRecord[];
  events: TelemetryEvent[];
  allowlist: AllowlistEntry[];
  motionTier: MotionTier;
  onAddAllowlist: (value: string, reason: string) => Promise<void>;
  onRemoveAllowlist: (id: string) => Promise<void>;
  onExport: (format: ExportFormat) => Promise<{ filename: string; saved_path: string | null }>;
}

type SubTab = 'rules' | 'stream' | 'allowlist';

export const DetectionsLogsScreen: React.FC<DetectionsLogsScreenProps> = ({
  mode,
  rules,
  events,
  allowlist,
  motionTier,
  onAddAllowlist,
  onRemoveAllowlist,
  onExport,
}) => {
  const [tab, setTab] = useState<SubTab>('rules');
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [newExe, setNewExe] = useState('');
  const [newReason, setNewReason] = useState('');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '2px 4px' }}>
        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 500, letterSpacing: '-0.02em' }}>
          Detections &amp; Logs
        </h1>
        <div role="tablist" style={{ display: 'inline-flex', background: '#0A0A0A', border: '1px solid #2A2529', borderRadius: 999, padding: 3 }}>
          {(
            [
              ['rules', 'Rule Matches'],
              ['stream', 'Event Stream'],
              ['allowlist', 'Allowlist'],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                style={{ position: 'relative', height: 28, padding: '0 14px', border: 'none', borderRadius: 999, background: 'transparent', color: active ? '#F5F3F5' : '#847C84', fontSize: 12, fontWeight: active ? 500 : 400 }}
              >
                {active && (
                  <motion.span layoutId="det-subtab-pill" transition={motionTier === 'off' ? { duration: 0 } : SPRINGS.pillGlide} style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--sw-mauve-pill-bg)', border: '1px solid #CBA6C5', zIndex: 0 }} />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 14 }}>
        <div className="sw-card" style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {tab === 'rules' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#EAE6EA' }}>Declarative Rule Evaluations (Tri-State)</div>
              {rules.map((r) => {
                const badgeColor = r.verdict === 'matched' ? '#E06C75' : r.verdict === 'insufficient_capability' ? '#E5B567' : '#847C84';
                return (
                  <div
                    key={r.id}
                    className={r.verdict === 'matched' && motionTier !== 'off' ? 'sw-rim-sweep-once' : ''}
                    style={{ padding: '14px 16px', borderRadius: 12, background: '#100E10', border: `1px solid ${r.verdict === 'matched' ? 'rgba(224, 108, 117, 0.55)' : '#262126'}`, position: 'relative' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#F5F3F5' }}>{r.rule_id}: {r.rule_name}</span>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: badgeColor, textTransform: 'uppercase' }}>
                        {r.verdict === 'matched' ? 'MATCHED' : r.verdict === 'insufficient_capability' ? 'NEEDS ETW' : r.verdict === 'allowlisted' ? 'ALLOWLISTED' : 'CLEAR'}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 8px', fontSize: 12.5, color: '#A8A2A8', lineHeight: 1.45 }}>{r.explanation}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {r.evidence.map((ev, i) => (
                        <div key={i} className="mono" style={{ fontSize: 11, color: '#847C84' }}>• {ev}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {tab === 'stream' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#EAE6EA' }}>Unified Chronological Event Stream ({events.length})</div>
              {events.map((ev) => (
                <div key={ev.event_id} className="sw-tile" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 12, color: '#F5F3F5' }}>
                      [{ev.category.toUpperCase()}] {ev.process_instance_id.boot_id}:{ev.process_instance_id.pid}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: '#847C84', marginTop: 3 }}>
                      {ev.provenance.source_api} — {ev.provenance.confidence_note}
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 10.5, color: ev.classification === 'inferred' ? '#E5B567' : '#5ED18A', alignSelf: 'center' }}>
                    {ev.classification.toUpperCase()}
                  </span>
                </div>
              ))}
            </>
          )}

          {tab === 'allowlist' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#EAE6EA' }}>Local Allowlist Management</div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newExe.trim()) return;
                  await onAddAllowlist(newExe.trim(), newReason.trim() || 'User-verified local executable');
                  setNewExe('');
                  setNewReason('');
                }}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  type="text"
                  value={newExe}
                  onChange={(e) => setNewExe(e.target.value)}
                  placeholder="Executable name (e.g. build_tool.exe)"
                  style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 8, background: '#100E10', border: '1px solid #2A2529', color: '#F5F3F5', fontSize: 12 }}
                />
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Reason"
                  style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 8, background: '#100E10', border: '1px solid #2A2529', color: '#F5F3F5', fontSize: 12 }}
                />
                <button type="submit" className="sw-cta-secondary"><Plus size={13} /> Add</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allowlist.map((entry) => (
                  <div key={entry.id} className="sw-tile" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="mono" style={{ fontSize: 12.5, color: '#F5F3F5' }}>{entry.value}</div>
                      <div style={{ fontSize: 11.5, color: '#847C84', marginTop: 2 }}>{entry.reason}</div>
                    </div>
                    <button type="button" onClick={() => onRemoveAllowlist(entry.id)} aria-label={`Remove ${entry.value}`} style={{ background: 'transparent', border: 'none', color: '#E06C75', padding: 6 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="sw-card" style={{ width: 340, minWidth: 340, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: 'rgba(203, 166, 197, 0.34)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#F5F3F5' }}>Sanitized Export Center</span>
              <ExportFolderIllustration size={34} />
            </div>

            <div>
              <div style={{ fontSize: 11.5, color: '#847C84', marginBottom: 8 }}>Report Format</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {(['markdown', 'json', 'csv'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className="mono"
                    style={{ height: 32, borderRadius: 9, border: format === fmt ? '1px solid #CBA6C5' : '1px solid #2A2529', background: format === fmt ? 'var(--sw-mauve-pill-bg)' : '#100E10', color: format === fmt ? '#F5F3F5' : '#847C84', fontSize: 11.5, textTransform: 'uppercase' }}
                  >
                    {fmt === 'markdown' ? 'MD' : fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="sw-tile" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#EAE6EA' }}>Redaction Preview (Active)</div>
              <div className="mono" style={{ fontSize: 11, color: '#A8A2A8', lineHeight: 1.55 }}>
                • User profile paths → <span style={{ color: '#5ED18A' }}>%USERPROFILE%</span>
                <br />• Auth tokens / Bearer → <span style={{ color: '#5ED18A' }}>[REDACTED_TOKEN]</span>
                <br />• CLI secrets → <span style={{ color: '#5ED18A' }}>[REDACTED_SECRET]</span>
                <br />• Source: <span style={{ color: mode === 'demo' ? '#89B4FA' : '#CBA6C5' }}>{mode === 'demo' ? 'Demo Fixture' : 'Live Local'}</span>
                <br />• Zero cloud upload (Local disk only)
              </div>
            </div>
          </div>

          <ExportActionButton label={`Export ${format.toUpperCase()} Report`} motionTier={motionTier} onExport={() => onExport(format)} />
        </aside>
      </div>
    </div>
  );
};
