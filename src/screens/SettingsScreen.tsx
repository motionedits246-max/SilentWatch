import React, { useState } from 'react';
import { AlertTriangle, Power, RotateCcw, Shield, Trash2 } from 'lucide-react';
import type { AppSettings, CloseWindowBehavior, MotionTier, PrivilegeMode } from '@/types/telemetry';

interface SettingsScreenProps {
  settings: AppSettings;
  monitoringActive: boolean;
  onSave: (next: AppSettings) => Promise<void>;
  onClearHistory: () => Promise<void>;
  onStopMonitoring: () => Promise<void>;
  onStartMonitoring: () => Promise<void>;
  onQuitApp: () => Promise<void>;
  onReplayOnboarding: () => void;
}

type SectionId = 'monitoring' | 'storage' | 'motion' | 'tray' | 'privacy';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  monitoringActive,
  onSave,
  onClearHistory,
  onStopMonitoring,
  onStartMonitoring,
  onQuitApp,
  onReplayOnboarding,
}) => {
  const [section, setSection] = useState<SectionId>('motion');
  const [confirmClear, setConfirmClear] = useState(false);
  const [uacNotice, setUacNotice] = useState(false);

  const patch = (partial: Partial<AppSettings>) => {
    void onSave({ ...settings, ...partial });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 23, fontWeight: 500, letterSpacing: '-0.02em', padding: '2px 4px' }}>Settings</h1>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 14 }}>
        <nav className="sw-card" style={{ width: 200, minWidth: 200, padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(
            [
              ['monitoring', 'Monitoring & ETW'],
              ['storage', 'Storage & Buffer'],
              ['motion', 'Appearance & Motion'],
              ['tray', 'Tray & Shortcuts'],
              ['privacy', 'Privacy & Lifecycle'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              style={{ height: 36, padding: '0 12px', borderRadius: 9, border: section === id ? '1px solid rgba(203,166,197,0.4)' : '1px solid transparent', background: section === id ? 'rgba(141,122,140,0.22)' : 'transparent', color: section === id ? '#FFFFFF' : '#A8A2A8', fontSize: 12.5, textAlign: 'left' }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
          <div className="sw-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#F5F3F5', marginBottom: 6 }}>Motion &amp; Animation Tier</div>
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#847C84' }}>
              Controls all 19 SilentWatch animations. Automatically honors Windows OS reduced-motion preferences.
            </p>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              {(['full', 'balanced', 'off'] as MotionTier[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => patch({ motion_tier: tier })}
                  style={{ height: 34, padding: '0 16px', borderRadius: 999, border: settings.motion_tier === tier ? '1px solid #CBA6C5' : '1px solid #2A2529', background: settings.motion_tier === tier ? 'var(--sw-mauve-pill-bg)' : '#100E10', color: settings.motion_tier === tier ? '#F5F3F5' : '#A8A2A8', fontSize: 12.5, textTransform: 'capitalize' }}
                >
                  {tier === 'off' ? 'Off (Reduced Motion)' : tier}
                </button>
              ))}
            </div>
          </div>

          <div className="sw-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#F5F3F5', marginBottom: 6 }}>Local SQLite WAL Ring Buffer</div>
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#847C84' }}>
              Automatic FIFO pruning accounting for both .db and .db-wal disk usage. Zero cloud sync.
            </p>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              {[256, 512, 1024, 2048].map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => patch({ ring_buffer_cap_mb: cap })}
                  className="mono"
                  style={{ height: 32, padding: '0 14px', borderRadius: 999, border: settings.ring_buffer_cap_mb === cap ? '1px solid #CBA6C5' : '1px solid #2A2529', background: settings.ring_buffer_cap_mb === cap ? 'var(--sw-mauve-pill-bg)' : '#100E10', color: settings.ring_buffer_cap_mb === cap ? '#F5F3F5' : '#A8A2A8', fontSize: 12 }}
                >
                  {cap} MB
                </button>
              ))}
            </div>
          </div>

          <div className="sw-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: '#F5F3F5', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Shield size={15} color="#CBA6C5" /> Observation Scope (Privilege Model)
              </span>
              <span className="mono" style={{ fontSize: 11, color: settings.privilege_mode === 'enhanced_etw' ? '#5ED18A' : '#E5B567' }}>
                {settings.privilege_mode === 'enhanced_etw' ? 'Enhanced ETW' : 'Standard Per-User'}
              </span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#847C84' }}>
              Standard mode runs with ordinary user privileges. Enhanced ETW requests explicit Windows UAC approval for kernel DLL load timestamps and cross-user visibility.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(
                [
                  ['standard_per_user', 'Standard Per-User'],
                  ['enhanced_etw', 'Request Elevated ETW'],
                ] as Array<[PrivilegeMode, string]>
              ).map(([modeVal, lbl]) => (
                <button
                  key={modeVal}
                  type="button"
                  onClick={() => {
                    if (modeVal === 'enhanced_etw' && settings.privilege_mode !== 'enhanced_etw') {
                      setUacNotice(true);
                    } else {
                      setUacNotice(false);
                      patch({ privilege_mode: modeVal });
                    }
                  }}
                  className="sw-cta-secondary"
                  style={{ borderColor: settings.privilege_mode === modeVal ? '#CBA6C5' : '#2A2529', background: settings.privilege_mode === modeVal ? 'var(--sw-mauve-pill-bg)' : '#100E10' }}
                >
                  {lbl}
                </button>
              ))}
            </div>
            {uacNotice && (
              <div className="sw-tile" style={{ marginTop: 12, padding: 12, borderColor: '#E5B567' }}>
                <div style={{ fontSize: 12.5, color: '#E5B567', fontWeight: 500 }}>Windows UAC Elevation Explanation</div>
                <div style={{ fontSize: 11.5, color: '#A8A2A8', margin: '4px 0 10px' }}>
                  Enabling Enhanced ETW requires Administrator privileges for Microsoft-Windows-Kernel-Process and ImageLoad providers. You can cancel without interrupting Standard monitoring.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="sw-cta-primary" style={{ height: 30, fontSize: 12 }} onClick={() => { patch({ privilege_mode: 'enhanced_etw' }); setUacNotice(false); }}>
                    Approve Enhanced ETW
                  </button>
                  <button type="button" className="sw-cta-secondary" style={{ height: 30, fontSize: 12 }} onClick={() => setUacNotice(false)}>
                    Cancel (Stay Per-User)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="sw-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#F5F3F5', marginBottom: 8 }}>Tray Lifecycle &amp; Global Shortcuts</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(
                [
                  ['hide_to_tray', 'Close Hides to Tray'],
                  ['stop_and_quit', 'Close Stops & Quits'],
                ] as Array<[CloseWindowBehavior, string]>
              ).map(([b, lbl]) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => patch({ close_behavior: b })}
                  className="sw-cta-secondary"
                  style={{ borderColor: settings.close_behavior === b ? '#CBA6C5' : '#2A2529', background: settings.close_behavior === b ? 'var(--sw-mauve-pill-bg)' : '#100E10' }}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: '#847C84' }}>
              Command Palette: {settings.shortcuts.command_palette} • Export: {settings.shortcuts.export_report}
            </div>
          </div>

          <div className="sw-card" style={{ padding: 20, borderColor: 'rgba(224, 108, 117, 0.45)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#E06C75', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={15} /> Danger &amp; Lifecycle Controls
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#847C84' }}>
              Stop Monitoring pauses all collectors while keeping the UI open. Quit SilentWatch stops all collectors and closes the host cleanly with no hidden background process.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {!confirmClear ? (
                <button type="button" className="sw-cta-secondary" onClick={() => setConfirmClear(true)} style={{ color: '#E06C75', borderColor: 'rgba(224,108,117,0.4)' }}>
                  <Trash2 size={13} /> Clear Local History
                </button>
              ) : (
                <button type="button" className="sw-cta-secondary" onClick={async () => { await onClearHistory(); setConfirmClear(false); }} style={{ background: 'rgba(224,108,117,0.2)', color: '#F5F3F5', borderColor: '#E06C75' }}>
                  Confirm Wipe Local DB
                </button>
              )}

              <button type="button" className="sw-cta-secondary" onClick={() => (monitoringActive ? onStopMonitoring() : onStartMonitoring())}>
                {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>

              <button type="button" className="sw-cta-secondary" onClick={onReplayOnboarding}>
                <RotateCcw size={13} /> Replay Welcome Tour
              </button>

              <button type="button" className="sw-cta-secondary" onClick={onQuitApp} style={{ color: '#E06C75' }}>
                <Power size={13} /> Quit SilentWatch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
