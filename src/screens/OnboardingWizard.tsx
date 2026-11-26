import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  GitFork,
  Globe,
  Lock,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { OpticalLensCenterpiece, SilentWatchMark } from '@/assets/VisualAssets';
import { EASINGS } from '@/animations/motionTokens';
import type {
  AppSettings,
  CloseWindowBehavior,
  MotionTier,
  PrivilegeMode,
} from '@/types/telemetry';

interface OnboardingWizardProps {
  initialSettings: AppSettings;
  onComplete: (finalSettings: AppSettings, startDemo: boolean) => Promise<void>;
}

const STEP_LABELS = ['Welcome', 'How It Thinks', 'Permissions', 'Preferences', 'Ready'];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialSettings,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [privilegeMode, setPrivilegeMode] = useState<PrivilegeMode>(initialSettings.privilege_mode);
  const [motionTier, setMotionTier] = useState<MotionTier>(initialSettings.motion_tier);
  const [closeBehavior, setCloseBehavior] = useState<CloseWindowBehavior>(initialSettings.close_behavior);
  const [bridging, setBridging] = useState(false);

  const finishWizard = async (demoMode: boolean) => {
    setBridging(true);
    const updated: AppSettings = {
      ...initialSettings,
      onboarding_completed: true,
      privilege_mode: privilegeMode,
      motion_tier: motionTier,
      close_behavior: closeBehavior,
      data_source_mode: demoMode ? 'demo' : 'live',
    };
    await onComplete(updated, demoMode);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bridging ? '#151017' : 'var(--sw-light-bg)',
        color: 'var(--sw-light-ink)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: motionTier === 'off' ? 'background 180ms ease' : 'background 750ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <header
        data-tauri-drag-region
        style={{
          height: 48,
          minHeight: 48,
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: bridging ? '1px solid transparent' : '1px solid rgba(24, 24, 24, 0.06)',
          opacity: bridging ? 0 : 1,
          transition: 'opacity 260ms ease',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <SilentWatchMark size={20} variant="light" />
          <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.02em', color: '#181818' }}>
            SilentWatch
          </span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }} aria-label={`Step ${step} of 5`}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {STEP_LABELS.map((lbl, idx) => {
              const s = idx + 1;
              const isCurrent = s === step;
              const isDone = s < step;
              return (
                <button
                  key={lbl}
                  type="button"
                  title={`${s}. ${lbl}`}
                  aria-label={`Step ${s}: ${lbl}`}
                  onClick={() => s <= step && setStep(s)}
                  style={{
                    width: isCurrent ? 26 : 8,
                    height: 8,
                    borderRadius: 999,
                    border: 'none',
                    padding: 0,
                    background: isCurrent || isDone ? '#141414' : '#DCDAD4',
                    transition: 'all 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              );
            })}
          </div>
          <span className="mono" style={{ fontSize: 11, color: '#686663', marginLeft: 4 }}>
            Step {step} of 5
          </span>
        </div>

        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: '#686663', textTransform: 'uppercase' }}>
          Local-First • Zero Cloud
        </span>
      </header>

      <AnimatePresence>
        {bridging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: 'radial-gradient(ellipse 80% 50% at 50% 0%, #4D4449 0%, #241D24 55%, #151017 100%)',
            }}
          >
            <motion.div initial={{ scale: 1.15, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.45, ease: EASINGS.signatureInOut }}>
              <SilentWatchMark size={44} variant="dark" />
            </motion.div>
            <div style={{ fontSize: 13, color: '#E5CBE0', fontWeight: 500 }}>
              Initializing local telemetry engine &amp; SQLite WAL...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px 36px 28px',
          opacity: bridging ? 0 : 1,
          transform: bridging ? 'scale(0.96)' : 'scale(1)',
          transition: 'all 320ms ease',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={motionTier === 'off' ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={motionTier === 'off' ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: motionTier === 'off' ? 0.12 : 0.34, ease: EASINGS.cinematicEditorial }}
            style={{ width: '100%', maxWidth: 920, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
          >
            {step === 1 && (
              <>
                <h1 className="serif-editorial" style={{ margin: 0, fontSize: 'clamp(42px, 5vw, 56px)', lineHeight: 1.04, letterSpacing: '-0.03em', fontWeight: 400, color: '#181818' }}>
                  See what runs
                  <br />
                  <em style={{ fontStyle: 'italic' }}>in the quiet.</em>
                </h1>
                <p style={{ margin: '14px 0 22px', maxWidth: '54ch', fontSize: 15, lineHeight: 1.55, color: 'var(--sw-light-body)' }}>
                  SilentWatch observes local process, network, and module activity on your PC — privately, with zero cloud uploads.
                </p>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{ height: 42, padding: '0 24px', borderRadius: 999, border: 'none', background: '#141414', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <span>Get Started</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => finishWizard(true)}
                    style={{ height: 42, padding: '0 22px', borderRadius: 999, border: '1px solid var(--sw-light-border)', background: '#FFFFFF', color: '#181818', fontSize: 13.5, fontWeight: 500 }}
                  >
                    Try Demo Fixture
                  </button>
                </div>

                <div style={{ position: 'relative', width: '100%', maxWidth: 780, height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 780 256" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true">
                    <ellipse cx="390" cy="132" rx="260" ry="82" stroke="rgba(24,24,24,0.12)" strokeWidth="1" transform="rotate(-9 390 132)" />
                    <ellipse cx="390" cy="132" rx="230" ry="68" stroke="rgba(24,24,24,0.09)" strokeWidth="0.9" transform="rotate(11 390 132)" />
                  </svg>

                  <div
                    className={motionTier === 'full' ? 'sw-glass-float-1' : ''}
                    style={{ position: 'absolute', left: 16, top: 34, width: 214, padding: '13px 15px', borderRadius: 16, background: 'var(--sw-light-glass)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.92)', boxShadow: '0 12px 32px rgba(24,24,24,0.07), inset 0 1px 0 #FFFFFF', textAlign: 'left', zIndex: 3 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 8, background: '#D9F99D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GitFork size={14} color="#181818" />
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#181818' }}>Process Tree</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#686663', lineHeight: 1.4 }}>
                      Every spawn &amp; verified parent-child link with PID-reuse protection.
                    </div>
                  </div>

                  <OpticalLensCenterpiece size={208} motionTier={motionTier} />

                  <div
                    className={motionTier === 'full' ? 'sw-glass-float-2' : ''}
                    style={{ position: 'absolute', right: 16, top: 16, width: 214, padding: '13px 15px', borderRadius: 16, background: 'var(--sw-light-glass)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.92)', boxShadow: '0 12px 32px rgba(24,24,24,0.07), inset 0 1px 0 #FFFFFF', textAlign: 'left', zIndex: 3 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 8, background: '#DDD6FE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={14} color="#181818" />
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#181818' }}>Network Calls</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#686663', lineHeight: 1.4 }}>
                      Exact owning-process endpoints without inspecting private payloads.
                    </div>
                  </div>

                  <div
                    className={motionTier === 'full' ? 'sw-glass-float-3' : ''}
                    style={{ position: 'absolute', right: 36, bottom: 10, width: 214, padding: '13px 15px', borderRadius: 16, background: 'var(--sw-light-glass)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.92)', boxShadow: '0 12px 32px rgba(24,24,24,0.07), inset 0 1px 0 #FFFFFF', textAlign: 'left', zIndex: 3 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 8, background: '#FED7AA', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={14} color="#181818" />
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#181818' }}>Behavior Timeline</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#686663', lineHeight: 1.4 }}>
                      Chronological event replay with millisecond evidence inspection.
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="serif-editorial" style={{ margin: 0, fontSize: 48, lineHeight: 1.05, fontWeight: 400 }}>
                  Facts first. <em style={{ fontStyle: 'italic' }}>Never guesswork.</em>
                </h1>
                <p style={{ margin: '12px 0 26px', maxWidth: '56ch', fontSize: 15, color: 'var(--sw-light-body)', lineHeight: 1.55 }}>
                  SilentWatch never disguises heuristic guesses as proven causation. Every relationship in the Behavior Explorer clearly distinguishes recorded OS evidence from temporal correlation.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, width: '100%', maxWidth: 720, textAlign: 'left' }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DC', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22A06B' }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Confirmed Recorded Telemetry</span>
                    </div>
                    <div style={{ padding: '12px 14px', background: '#F7F6F3', borderRadius: 10, marginBottom: 12 }}>
                      <svg width="100%" height="26" viewBox="0 0 260 26">
                        <line x1="8" y1="13" x2="246" y2="13" stroke="#181818" strokeWidth="2" />
                        <polygon points="246,8 256,13 246,18" fill="#181818" />
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#686663', lineHeight: 1.5 }}>
                      Rendered as a <strong>solid line</strong> exclusively when verified by Windows OS APIs (parent PID + creation time, owning socket table, or module snapshot).
                    </p>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DC', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#D97706' }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Inferred / Correlated Context</span>
                    </div>
                    <div style={{ padding: '12px 14px', background: '#F7F6F3', borderRadius: 10, marginBottom: 12 }}>
                      <svg width="100%" height="26" viewBox="0 0 260 26">
                        <line x1="8" y1="13" x2="250" y2="13" stroke="#B45309" strokeWidth="2" strokeDasharray="6 5" />
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#686663', lineHeight: 1.5 }}>
                      Rendered strictly as a <strong>dashed amber line</strong> with an explicit <span className="mono">Inferred</span> label when processes are only temporally adjacent.
                    </p>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="serif-editorial" style={{ margin: 0, fontSize: 48, lineHeight: 1.05, fontWeight: 400 }}>
                  Choose how deeply <em style={{ fontStyle: 'italic' }}>to observe.</em>
                </h1>
                <p style={{ margin: '12px 0 24px', maxWidth: '58ch', fontSize: 15, color: 'var(--sw-light-body)', lineHeight: 1.55 }}>
                  SilentWatch runs with ordinary user privileges by default. You can enable Elevated ETW later at any time — elevation is never forced or concealed.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 740, textAlign: 'left' }}>
                  <button
                    type="button"
                    onClick={() => setPrivilegeMode('standard_per_user')}
                    style={{ padding: 20, borderRadius: 16, textAlign: 'left', background: privilegeMode === 'standard_per_user' ? '#FFFFFF' : '#F4F3EE', border: privilegeMode === 'standard_per_user' ? '2px solid #141414' : '1px solid #E2E0DC' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 600 }}>
                        <ShieldCheck size={16} /> Standard Per-User Mode
                      </span>
                      <span className="mono" style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: '#E7F6EC', color: '#166534' }}>
                        Recommended
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#686663', lineHeight: 1.5 }}>
                      Zero UAC prompt. Captures per-user processes, parent-child trees, CPU/RAM, active TCP/UDP sockets, and user-space DLL snapshots immediately.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivilegeMode('enhanced_etw')}
                    style={{ padding: 20, borderRadius: 16, textAlign: 'left', background: privilegeMode === 'enhanced_etw' ? '#FFFFFF' : '#F4F3EE', border: privilegeMode === 'enhanced_etw' ? '2px solid #141414' : '1px solid #E2E0DC' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 600 }}>
                        <Lock size={16} /> Enhanced ETW Telemetry
                      </span>
                      <span className="mono" style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: '#FEF3C7', color: '#92400E' }}>
                        Requires UAC
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#686663', lineHeight: 1.5 }}>
                      Requests Windows Administrator approval for Microsoft-Windows-Kernel-Process &amp; ImageLoad ETW exact timestamps and cross-user visibility. Falls back cleanly if cancelled.
                    </p>
                  </button>
                </div>

                <div className="mono" style={{ marginTop: 18, fontSize: 11, color: '#686663' }}>
                  100% Local SQLite WAL Ring Buffer • Automatic Path &amp; Token Redaction • Zero Cloud Telemetry
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="serif-editorial" style={{ margin: 0, fontSize: 48, lineHeight: 1.05, fontWeight: 400 }}>
                  Quiet by <em style={{ fontStyle: 'italic' }}>default.</em>
                </h1>
                <p style={{ margin: '12px 0 24px', maxWidth: '56ch', fontSize: 15, color: 'var(--sw-light-body)', lineHeight: 1.55 }}>
                  Configure how SilentWatch behaves in your Windows system tray and choose your preferred motion responsiveness tier.
                </p>

                <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DC', borderRadius: 16, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600 }}>
                        <Sliders size={15} /> Motion &amp; Animation Tier
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: '#686663' }}>Honors OS Reduced Motion</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {(['full', 'balanced', 'off'] as const).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setMotionTier(tier)}
                          style={{ height: 36, borderRadius: 10, border: motionTier === tier ? '2px solid #141414' : '1px solid #E2E0DC', background: motionTier === tier ? '#141414' : '#FAF9F5', color: motionTier === tier ? '#FFFFFF' : '#181818', fontSize: 12.5, fontWeight: 500, textTransform: 'capitalize' }}
                        >
                          {tier === 'off' ? 'Off (Reduced)' : tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DC', borderRadius: 16, padding: '16px 20px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>Window Close &amp; Tray Lifecycle</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setCloseBehavior('hide_to_tray')}
                        style={{ padding: '10px 12px', borderRadius: 10, textAlign: 'left', border: closeBehavior === 'hide_to_tray' ? '2px solid #141414' : '1px solid #E2E0DC', background: closeBehavior === 'hide_to_tray' ? '#F7F6F2' : '#FFFFFF' }}
                      >
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>Hide to System Tray</div>
                        <div style={{ fontSize: 11, color: '#686663', marginTop: 2 }}>
                          Monitoring stays active in background; Quit stops everything cleanly.
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCloseBehavior('stop_and_quit')}
                        style={{ padding: '10px 12px', borderRadius: 10, textAlign: 'left', border: closeBehavior === 'stop_and_quit' ? '2px solid #141414' : '1px solid #E2E0DC', background: closeBehavior === 'stop_and_quit' ? '#F7F6F2' : '#FFFFFF' }}
                      >
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>Stop Monitoring &amp; Quit</div>
                        <div style={{ fontSize: 11, color: '#686663', marginTop: 2 }}>
                          Closing the window stops collectors immediately and exits.
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h1 className="serif-editorial" style={{ margin: 0, fontSize: 50, lineHeight: 1.05, fontWeight: 400 }}>
                  Everything is ready <br />
                  <em style={{ fontStyle: 'italic' }}>for your first look.</em>
                </h1>
                <p style={{ margin: '14px 0 24px', maxWidth: '52ch', fontSize: 15, color: 'var(--sw-light-body)', lineHeight: 1.55 }}>
                  Your preferences will be saved locally to SQLite before transitioning into the Helios obsidian workspace. Press <span className="mono">Ctrl+K</span> anytime to search.
                </p>

                <div style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #E2E0DC', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 24 }}>
                  {[
                    ['Observation Mode', privilegeMode === 'enhanced_etw' ? 'Enhanced ETW (UAC)' : 'Standard Per-User'],
                    ['Motion Tier', motionTier.toUpperCase()],
                    ['Close Behavior', closeBehavior === 'hide_to_tray' ? 'Hide to System Tray' : 'Stop & Quit'],
                    ['Storage Cap', `${initialSettings.ring_buffer_cap_mb} MB Local SQLite WAL`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#686663' }}>{k}</span>
                      <span className="mono" style={{ fontWeight: 600, color: '#181818', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Check size={13} color="#166534" /> {v}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => finishWizard(false)}
                  style={{ height: 44, padding: '0 28px', borderRadius: 999, border: 'none', background: '#141414', color: '#FFFFFF', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <span>Enter SilentWatch</span>
                  <ArrowRight size={15} />
                </button>
              </>
            )}

            {step > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  style={{ height: 38, padding: '0 18px', borderRadius: 999, border: '1px solid #E2E0DC', background: '#FFFFFF', color: '#181818', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                {step < 5 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(5, s + 1))}
                    style={{ height: 38, padding: '0 22px', borderRadius: 999, border: 'none', background: '#141414', color: '#FFFFFF', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Continue <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
