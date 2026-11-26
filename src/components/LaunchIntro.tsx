import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface LaunchIntroProps {
  startupVideoUrl?: string | null;
  dataReady: boolean;
  onFinished: () => void;
}

const WORDMARK_LETTERS = 'SILENTWATCH'.split('');

/**
 * Every-launch 5-second SilentWatch logo sting matching the dark midnight-blue
 * geometric reveal reference. Uses a release-attached `startup*.mp4` if published
 * on GitHub Releases, and renders a native 60fps retina vector logo reveal by default
 * (zero video-decoder overhead) while backend telemetry preloads in parallel.
 */
export const LaunchIntro: React.FC<LaunchIntroProps> = ({
  startupVideoUrl,
  dataReady,
  onFinished,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const finishedRef = useRef(false);
  const useRemoteVideo = Boolean(startupVideoUrl && !videoFailed);

  const triggerFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinished();
  };

  useEffect(() => {
    if (introDone && dataReady) {
      triggerFinish();
    }
  }, [introDone, dataReady]);

  useEffect(() => {
    // 4.6s crisp logo sting + hard 9.5s safety cap so startup never stalls
    const introTimer = window.setTimeout(() => setIntroDone(true), useRemoteVideo ? 5400 : 4600);
    const hardCap = window.setTimeout(triggerFinish, 9500);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        setIntroDone(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(introTimer);
      window.clearTimeout(hardCap);
      window.removeEventListener('keydown', onKey);
    };
  }, [useRemoteVideo]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.015 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => setIntroDone(true)}
      aria-label="SilentWatch launch intro"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background:
          'radial-gradient(ellipse 68% 62% at 50% 56%, #131b3f 0%, #070a18 46%, #03040a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {useRemoteVideo && startupVideoUrl ? (
        <video
          key={startupVideoUrl}
          src={startupVideoUrl}
          autoPlay
          muted
          playsInline
          onEnded={() => setIntroDone(true)}
          onError={() => setVideoFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100vw',
            maxHeight: '100vh',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            position: 'relative',
            padding: '0 24px',
          }}
        >
          {/* Glowing SilentWatch 3-node orbital aperture mark */}
          <motion.div
            initial={{ x: 165, scale: 0.72, opacity: 0 }}
            animate={{ x: [165, 165, 0], scale: [0.72, 1.06, 1], opacity: [0, 1, 1] }}
            transition={{
              duration: 2.05,
              times: [0, 0.54, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              width: 84,
              height: 84,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 0 24px rgba(129, 140, 248, 0.65))',
              flexShrink: 0,
            }}
          >
            <svg width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="swIntroRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="55%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#E879F9" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="42"
                cy="42"
                r="35"
                stroke="url(#swIntroRing)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray="220"
                initial={{ strokeDashoffset: 220, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: 1 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.path
                d="M42 20L61 53H23L42 20Z"
                stroke="rgba(165, 180, 252, 0.85)"
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeDasharray="220"
                initial={{ strokeDashoffset: 220, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.circle
                cx="42"
                cy="20"
                r="7.5"
                fill="#F5D0FE"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 320, damping: 18 }}
              />
              <motion.circle
                cx="61"
                cy="53"
                r="7.5"
                fill="#60A5FA"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.44, type: 'spring', stiffness: 320, damping: 18 }}
              />
              <motion.circle
                cx="23"
                cy="53"
                r="7.5"
                fill="#D946EF"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.52, type: 'spring', stiffness: 320, damping: 18 }}
              />
              <motion.circle
                cx="42"
                cy="42"
                r="6.2"
                fill="#FFFFFF"
                stroke="#38BDF8"
                strokeWidth="2.4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.6 }}
              />
            </svg>
          </motion.div>

          {/* Geometric wide-tracked SILENTWATCH wordmark slice reveal */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              overflow: 'hidden',
              padding: '6px 4px',
            }}
          >
            {WORDMARK_LETTERS.map((ch, idx) => (
              <motion.span
                key={`${ch}-${idx}`}
                initial={{ opacity: 0, y: 18, clipPath: 'inset(100% 0% 0% 0%)' }}
                animate={{ opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' }}
                transition={{
                  delay: 1.28 + idx * 0.048,
                  duration: 0.42,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  fontSize: 44,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#F8FAFC',
                  textShadow: '0 0 24px rgba(148, 163, 255, 0.35)',
                  lineHeight: 1,
                  display: 'inline-block',
                }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Subtle telemetry preload status pill */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 999,
          background: 'rgba(10, 12, 22, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          fontSize: 11.5,
          color: dataReady ? '#94A3B8' : '#E2E8F0',
          letterSpacing: '0.02em',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dataReady ? '#4ADE80' : '#A855F7',
            boxShadow: dataReady ? '0 0 8px #4ADE80' : '0 0 8px #A855F7',
          }}
        />
        <span>{dataReady ? 'Telemetry ready' : 'Loading live telemetry...'}</span>
      </div>
    </motion.div>
  );
};
