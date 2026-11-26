import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface LaunchIntroProps {
  onFinished: () => void;
}

/**
 * Every-launch 3.2-second luminous orb intro inspired by intro.mp4 (strictly <= 5s max).
 * Pure obsidian void -> electric indigo/magenta glowing ring sweep -> center pinpoint flash -> SilentWatch reveal.
 */
export const LaunchIntro: React.FC<LaunchIntroProps> = ({ onFinished }) => {
  useEffect(() => {
    const timer = window.setTimeout(onFinished, 3200);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onFinished();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onFinished]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      onClick={onFinished}
      aria-label="SilentWatch launch intro"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Subtle floor reflection glow matching intro.mp4 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.55, 0.35], scale: [0.8, 1.15, 1.0] }}
        transition={{ duration: 2.6, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: 240,
          height: 54,
          bottom: 'calc(50% - 134px)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.45) 0%, rgba(217, 70, 239, 0.16) 50%, transparent 75%)',
          filter: 'blur(22px)',
          pointerEvents: 'none',
        }}
      />

      {/* Luminous Sweeping Electric Ring + Obsidian Orb (intro.mp4) */}
      <div style={{ position: 'relative', width: 152, height: 152, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ rotate: -140, scale: 0.72, opacity: 0 }}
          animate={{ rotate: 220, scale: [0.72, 1.04, 1.0], opacity: [0, 1, 1] }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'conic-gradient(from 0deg, transparent 0deg, #6366F1 95deg, #D946EF 195deg, #FFFFFF 265deg, transparent 340deg)',
            filter: 'blur(7px)',
          }}
        />

        <motion.div
          initial={{ scale: 0.78, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            inset: 5,
            borderRadius: '50%',
            background: '#030306',
            border: '2.5px solid rgba(235, 225, 255, 0.92)',
            boxShadow:
              '0 0 28px rgba(129, 140, 248, 0.75), inset 0 0 22px rgba(168, 85, 247, 0.38)',
          }}
        />

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.45, 0.9, 1.05], opacity: [0, 1, 0.95, 1] }}
          transition={{ delay: 0.75, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative',
            zIndex: 3,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 0 18px #FFFFFF, 0 0 36px #A855F7',
          }}
        />
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 2.2, 2.5], opacity: [0, 0.7, 0] }}
          transition={{ delay: 0.9, duration: 1.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            zIndex: 2,
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.65)',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginTop: 28, textAlign: 'center' }}
      >
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', color: '#F8F7FA' }}>
          SilentWatch
        </div>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', color: '#8E889B', marginTop: 5, textTransform: 'uppercase' }}>
          Local Telemetry Engine
        </div>
      </motion.div>
    </motion.div>
  );
};
