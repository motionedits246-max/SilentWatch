import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Database,
  Download,
  Film,
  Keyboard,
  Power,
  RefreshCw,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  AppSettings,
  CloseWindowBehavior,
  MotionTier,
  PrivilegeMode,
  UpdateCheckResult,
} from '@/types/telemetry';

interface SettingsScreenProps {
  settings: AppSettings;
  monitoringActive: boolean;
  updateInfo: UpdateCheckResult | null;
  checkingUpdates: boolean;
  onSave: (next: AppSettings) => Promise<void>;
  onClearHistory: () => Promise<void>;
  onStopMonitoring: () => Promise<void>;
  onStartMonitoring: () => Promise<void>;
  onQuitApp: () => Promise<void>;
  onCheckUpdates: () => Promise<void>;
  onOpenWhatsNew: () => void;
}

type SectionId = 'monitoring' | 'storage' | 'appearance' | 'tray' | 'updates' | 'lifecycle';

const SECTIONS: Array<{ id: SectionId; label: string; icon: LucideIcon }> = [
  { id: 'monitoring', label: 'Monitoring & ETW', icon: Shield },
  { id: 'storage', label: 'Storage & Buffer', icon: Database },
  { id: 'appearance', label: 'Appearance & Motion', icon: Sliders },
  { id: 'tray', label: 'Tray & Shortcuts', icon: Keyboard },
  { id: 'updates', label: 'Updates & Release Reel', icon: Sparkles },
  { id: 'lifecycle', label: 'Privacy & Lifecycle', icon: Power },
];

const AppleToggle: React.FC<{ checked: boolean; onChange: (next: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    style={{
      width: 44,
      height: 24,
      borderRadius: 999,
      padding: 2,
      border: '1px solid rgba(255,255,255,0.14)',
      background: checked ? 'linear-gradient(135deg, #D946EF, #A855F7)' : 'rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: checked ? 'flex-end' : 'flex-start',
      transition: 'background 180ms ease',
    }}
  >
    <motion.span
      layout
      transition={{ type: 'spring', stiffness: 520, damping: 32 }}
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
      }}
    />
  </button>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  monitoringActive,
  updateInfo,
  checkingUpdates,
  onSave,
  onClearHistory,
  onStopMonitoring,
  onStartMonitoring,
  onQuitApp,
  onCheckUpdates,
  onOpenWhatsNew,
}) => {
  const [section, setSection] = useState<SectionId>('monitoring');
  const [confirmClear, setConfirmClear] = useState(false);
  const [uacNotice, setUacNotice] = useState(false);

  const patch = (partial: Partial<AppSettings>) => {
    void onSave({ ...settings, ...partial });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', padding: '2px 4px' }}>
        Settings
      </h1>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 16 }}>
        <nav
          aria-label="Settings categories"
          className="sw-card"
          style={{
            width: 224,
            minWidth: 224,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignSelf: 'flex-start',
          }}
        >
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                style={{
                  position: 'relative',
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 12,
                  border: active ? '1px solid rgba(232, 121, 249, 0.4)' : '1px solid transparent',
                  background: active
                    ? 'linear-gradient(90deg, rgba(217, 70, 239, 0.24), rgba(168, 85, 247, 0.08))'
                    : 'transparent',
                  color: active ? '#FFFFFF' : '#A49EAE',
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'left',
                  transition: 'background 140ms ease, color 140ms ease',
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <motion.div
          key={section}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1, maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {section === 'monitoring' && (
            <div className="sw-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>
                    Background Monitoring Service
                  </div>
                  <div style={{ fontSize: 12.5, color: '#9E98A4', marginTop: 3 }}>
                    Collects live CPU %, RAM MB, sockets, and module loads while minimized to tray.
                  </div>
                </div>
                <AppleToggle
                  checked={monitoringActive}
                  label="Toggle background monitoring"
                  onChange={(next) => (next ? void onStartMonitoring() : void onStopMonitoring())}
                />
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#F8F7FA' }}>
                    Observation Scope (Privilege Model)
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: settings.privilege_mode === 'enhanced_etw' ? '#5ED18A' : '#E5B567' }}>
                    {settings.privilege_mode === 'enhanced_etw' ? 'Enhanced ETW' : 'Standard Per-User'}
                  </span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#9E98A4', lineHeight: 1.5 }}>
                  Standard mode monitors your user session with zero elevation. Enhanced ETW requests explicit Windows UAC approval for kernel image-load timestamps.
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
                      style={{
                        borderColor: settings.privilege_mode === modeVal ? '#E879F9' : undefined,
                        background: settings.privilege_mode === modeVal ? 'rgba(217, 70, 239, 0.2)' : undefined,
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                {uacNotice && (
                  <div className="sw-tile" style={{ marginTop: 12, padding: 14, borderColor: '#E5B567' }}>
                    <div style={{ fontSize: 12.5, color: '#E5B567', fontWeight: 600 }}>
                      Windows UAC Elevation Required
                    </div>
                    <div style={{ fontSize: 12, color: '#B4AEB8', margin: '4px 0 10px' }}>
                      Enabling Enhanced ETW requires Administrator privileges for Microsoft-Windows-Kernel-Process providers.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="sw-cta-primary"
                        style={{ height: 30, fontSize: 12 }}
                        onClick={() => {
                          patch({ privilege_mode: 'enhanced_etw' });
                          setUacNotice(false);
                        }}
                      >
                        Approve Enhanced ETW
                      </button>
                      <button
                        type="button"
                        className="sw-cta-secondary"
                        style={{ height: 30, fontSize: 12 }}
                        onClick={() => setUacNotice(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {section === 'storage' && (
            <div className="sw-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', marginBottom: 4 }}>
                  Local SQLite WAL Ring Buffer
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#9E98A4' }}>
                  Automatic FIFO pruning accounting for both .db and .db-wal disk usage. 100% local with zero cloud uploads.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[256, 512, 1024, 2048].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => patch({ ring_buffer_cap_mb: cap })}
                    className="mono"
                    style={{
                      height: 36,
                      padding: '0 16px',
                      borderRadius: 999,
                      border:
                        settings.ring_buffer_cap_mb === cap
                          ? '1px solid #E879F9'
                          : '1px solid rgba(255,255,255,0.1)',
                      background:
                        settings.ring_buffer_cap_mb === cap
                          ? 'rgba(217, 70, 239, 0.22)'
                          : 'rgba(255,255,255,0.03)',
                      color: settings.ring_buffer_cap_mb === cap ? '#FFFFFF' : '#A49EAE',
                      fontSize: 12.5,
                    }}
                  >
                    {cap} MB
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div className="sw-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', marginBottom: 4 }}>
                  Motion &amp; Liquid Glass Tier
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#9E98A4' }}>
                  Controls Orbital Core, launch intro, and spring transitions. Honors Windows Reduced Motion automatically.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['full', 'balanced', 'off'] as MotionTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => patch({ motion_tier: tier })}
                    style={{
                      height: 36,
                      padding: '0 18px',
                      borderRadius: 999,
                      border:
                        settings.motion_tier === tier
                          ? '1px solid #E879F9'
                          : '1px solid rgba(255,255,255,0.1)',
                      background:
                        settings.motion_tier === tier
                          ? 'rgba(217, 70, 239, 0.22)'
                          : 'rgba(255,255,255,0.03)',
                      color: settings.motion_tier === tier ? '#FFFFFF' : '#A49EAE',
                      fontSize: 12.5,
                      textTransform: 'capitalize',
                    }}
                  >
                    {tier === 'off' ? 'Off (Reduced Motion)' : tier}
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === 'tray' && (
            <div className="sw-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', marginBottom: 4 }}>
                  Windows System Tray Behavior
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#9E98A4' }}>
                  Choose what happens when you click the close button (×). You can always pause or stop services from the Windows System Tray icon.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
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
                    style={{
                      borderColor: settings.close_behavior === b ? '#E879F9' : undefined,
                      background: settings.close_behavior === b ? 'rgba(217, 70, 239, 0.2)' : undefined,
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div className="mono" style={{ fontSize: 12, color: '#A49EAE' }}>
                Command Palette: {settings.shortcuts.command_palette} • Export: {settings.shortcuts.export_report}
              </div>
            </div>
          )}

          {section === 'updates' && (
            <div className="sw-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>
                    GitHub Releases Auto-Update
                  </div>
                  <div style={{ fontSize: 12.5, color: '#9E98A4', marginTop: 3 }}>
                    Checks motionedits246-max/SilentWatch releases and shows a What&apos;s New video on every new release.
                  </div>
                </div>
                <AppleToggle
                  checked={settings.auto_check_updates}
                  label="Auto-check for GitHub updates"
                  onChange={(next) => patch({ auto_check_updates: next })}
                />
              </div>

              <div className="sw-tile" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F7FA' }}>
                    {updateInfo?.update_available
                      ? `New Release Available: v${updateInfo.latest_version}`
                      : `Installed Version: v${updateInfo?.current_version ?? '0.1.0'}`}
                  </div>
                  <div className="mono" style={{ fontSize: 11.5, color: '#9E98A4', marginTop: 2 }}>
                    {updateInfo?.update_available
                      ? 'A newer Windows installer is available on GitHub Releases.'
                      : 'Up to date with the latest GitHub release.'}
                  </div>
                </div>
                <div style={{ display: 'inline-flex', gap: 8 }}>
                  <button
                    type="button"
                    className="sw-cta-secondary"
                    onClick={() => void onCheckUpdates()}
                    disabled={checkingUpdates}
                  >
                    <RefreshCw size={13} />
                    <span>{checkingUpdates ? 'Checking...' : 'Check Now'}</span>
                  </button>
                  {updateInfo?.update_available && (updateInfo.installer_url || updateInfo.release_page_url) && (
                    <a
                      href={updateInfo.installer_url ?? updateInfo.release_page_url}
                      target="_blank"
                      rel="noreferrer"
                      className="sw-cta-primary"
                      style={{ textDecoration: 'none' }}
                    >
                      <Download size={13} /> Download
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button type="button" className="sw-cta-secondary" onClick={onOpenWhatsNew}>
                  <Film size={14} color="#E879F9" />
                  <span>Watch What&apos;s New Video</span>
                </button>
              </div>
            </div>
          )}

          {section === 'lifecycle' && (
            <div className="sw-card" style={{ padding: 22, borderColor: 'rgba(251, 113, 133, 0.35)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#FB7185', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} /> Privacy &amp; Service Lifecycle
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: '#9E98A4', lineHeight: 1.5 }}>
                Stop Monitoring pauses collectors while keeping the window open. Quit SilentWatch stops all background services cleanly with zero hidden processes.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {!confirmClear ? (
                  <button
                    type="button"
                    className="sw-cta-secondary"
                    onClick={() => setConfirmClear(true)}
                    style={{ color: '#FB7185', borderColor: 'rgba(251,113,133,0.35)' }}
                  >
                    <Trash2 size={13} /> Clear Local History
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sw-cta-secondary"
                    onClick={async () => {
                      await onClearHistory();
                      setConfirmClear(false);
                    }}
                    style={{ background: 'rgba(251,113,133,0.2)', color: '#FFFFFF', borderColor: '#FB7185' }}
                  >
                    Confirm Wipe Local DB
                  </button>
                )}

                <button
                  type="button"
                  className="sw-cta-secondary"
                  onClick={() => (monitoringActive ? void onStopMonitoring() : void onStartMonitoring())}
                >
                  {monitoringActive ? 'Pause Background Service' : 'Resume Background Service'}
                </button>

                <button
                  type="button"
                  className="sw-cta-secondary"
                  onClick={() => void onQuitApp()}
                  style={{ color: '#FB7185' }}
                >
                  <Power size={13} /> Stop Services &amp; Quit
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
