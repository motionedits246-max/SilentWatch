import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Download, RefreshCw, Sparkles, X } from 'lucide-react';
import type { UpdateCheckResult } from '@/types/telemetry';

interface ReleaseShowcaseModalProps {
  version: string;
  updateInfo: UpdateCheckResult | null;
  checkingUpdates?: boolean;
  onCheckUpdates?: () => void;
  onContinue: () => void;
}

export const ReleaseShowcaseModal: React.FC<ReleaseShowcaseModalProps> = ({
  version,
  updateInfo,
  checkingUpdates = false,
  onCheckUpdates,
  onContinue,
}) => {
  const [fallbackLocal, setFallbackLocal] = useState(false);
  const isUpdate = Boolean(updateInfo?.update_available);
  const videoSrc =
    (!fallbackLocal && isUpdate && updateInfo?.whats_new_video_url) || '/videos/whats-new.mp4';
  const downloadHref = updateInfo?.installer_url ?? updateInfo?.release_page_url;

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
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
            padding: '15px 22px',
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
                ? `New Release Available — SilentWatch v${updateInfo?.latest_version}`
                : `What's New in SilentWatch v${version}`}
            </span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {onCheckUpdates && (
              <button
                type="button"
                className="sw-cta-secondary"
                style={{ height: 28, fontSize: 11.5, padding: '0 11px' }}
                onClick={onCheckUpdates}
                disabled={checkingUpdates}
              >
                <RefreshCw size={12} className={checkingUpdates ? 'sw-orbit-spin' : ''} />
                <span>{checkingUpdates ? 'Checking...' : 'Check Releases'}</span>
              </button>
            )}
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
        </div>

        <div
          style={{
            position: 'relative',
            background: '#18181B',
            aspectRatio: '16 / 9',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <video
            key={videoSrc}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            controls
            onError={() => {
              if (!fallbackLocal && isUpdate && updateInfo?.whats_new_video_url) {
                setFallbackLocal(true);
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>

        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#E879F9', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              {isUpdate ? `What's New in v${updateInfo?.latest_version}` : 'Release Highlights'}
            </div>
            <div style={{ fontSize: 12.5, color: '#C5BDCC', lineHeight: 1.45, maxHeight: 58, overflowY: 'auto' }}>
              {updateInfo?.release_notes ||
                'Live CPU/RAM counters, true local-time timelines, Apple Liquid Glass workspace, background System Tray service, and GitHub auto-updates.'}
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            {isUpdate && downloadHref && (
              <a
                href={downloadHref}
                target="_blank"
                rel="noreferrer"
                className="sw-cta-primary"
                style={{ textDecoration: 'none' }}
              >
                <Download size={14} />
                <span>Download Release</span>
              </a>
            )}
            <button
              type="button"
              className={isUpdate ? 'sw-cta-secondary' : 'sw-cta-primary'}
              onClick={onContinue}
            >
              <span>Open Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
