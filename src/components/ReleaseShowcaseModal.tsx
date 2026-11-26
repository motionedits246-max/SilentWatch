import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, ArrowRight, Cpu, Download, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { UpdateCheckResult } from '@/types/telemetry';

interface ReleaseShowcaseModalProps {
  version: string;
  updateInfo: UpdateCheckResult | null;
  onContinue: () => void;
}

export const ReleaseShowcaseModal: React.FC<ReleaseShowcaseModalProps> = ({
  version,
  updateInfo,
  onContinue,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const isUpdate = Boolean(updateInfo?.update_available);
  const videoSrc =
    (isUpdate && updateInfo?.whats_new_video_url) || '/videos/whats-new.mp4';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: 'rgba(4, 3, 7, 0.84)',
        backdropFilter: 'blur(26px)',
        WebkitBackdropFilter: 'blur(26px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 780,
          maxWidth: '94vw',
          borderRadius: 24,
          background:
            'linear-gradient(180deg, rgba(28, 22, 36, 0.96) 0%, rgba(12, 11, 16, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow:
            '0 32px 96px rgba(0, 0, 0, 0.78), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <Sparkles size={16} color="#E879F9" />
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: '#F8F7FA',
              }}
            >
              {isUpdate
                ? `What's New in SilentWatch v${updateInfo?.latest_version}`
                : `What's New in SilentWatch v${version}`}
            </span>
          </div>
          <button
            type="button"
            aria-label="Close What's New"
            onClick={onContinue}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#A8A2A8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            position: 'relative',
            background: '#050408',
            aspectRatio: '16 / 9',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {!videoFailed ? (
            <video
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              controls
              onError={() => setVideoFailed(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background:
                  'radial-gradient(ellipse 65% 60% at 24% 20%, rgba(217, 70, 239, 0.34) 0%, rgba(168, 85, 247, 0.14) 38%, #07060A 78%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '32px 36px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: '#F0ABFC',
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(217, 70, 239, 0.16)',
                    border: '1px solid rgba(232, 121, 249, 0.4)',
                  }}
                >
                  RELEASE v{isUpdate ? updateInfo?.latest_version : version}
                </span>
                <span style={{ fontSize: 12, color: '#A8A2A8' }}>
                  Local-First Windows Telemetry
                </span>
              </div>

              <div>
                <h2
                  style={{
                    margin: '0 0 8px',
                    fontSize: 30,
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    color: '#FFFFFF',
                  }}
                >
                  SilentWatch Liquid Glass
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#C7C1CA',
                    maxWidth: 520,
                    lineHeight: 1.5,
                  }}
                >
                  Real-time CPU &amp; RAM process counters, background Windows System Tray
                  monitoring, Behavior Explorer, and automatic GitHub release updates.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                }}
              >
                {[
                  {
                    icon: Cpu,
                    title: 'Live CPU & RAM',
                    desc: 'Per-process telemetry refreshed every 3s.',
                  },
                  {
                    icon: Activity,
                    title: 'Background Tray',
                    desc: 'Pause, resume, or stop collectors from tray.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Auto-Updates',
                    desc: 'Tracks GitHub Releases with release reels.',
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + idx * 0.1, duration: 0.36 }}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <Icon size={16} color="#E879F9" />
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#F8F7FA',
                          marginTop: 8,
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#A8A2A8', marginTop: 3 }}>
                        {item.desc}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div style={{ fontSize: 12.5, color: '#A8A2A8', lineHeight: 1.45 }}>
            {isUpdate
              ? updateInfo?.release_notes.slice(0, 140)
              : 'Live CPU/RAM monitoring, Apple Liquid Glass workspace, Behavior Explorer, and background System Tray service are ready.'}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            {isUpdate && (updateInfo?.installer_url || updateInfo?.release_page_url) && (
              <a
                href={updateInfo.installer_url ?? updateInfo.release_page_url}
                target="_blank"
                rel="noreferrer"
                className="sw-cta-secondary"
                style={{ textDecoration: 'none' }}
              >
                <Download size={14} /> Download v{updateInfo.latest_version}
              </a>
            )}
            <button type="button" className="sw-cta-primary" onClick={onContinue}>
              <span>Open Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
