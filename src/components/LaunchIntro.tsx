import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface LaunchIntroProps {
  startupVideoUrl?: string | null;
  onFinished: () => void;
}

export const LaunchIntro: React.FC<LaunchIntroProps> = ({ startupVideoUrl, onFinished }) => {
  const [fallbackLocal, setFallbackLocal] = useState(false);
  const src = (!fallbackLocal && startupVideoUrl) || '/videos/startup.mp4';

  useEffect(() => {
    const timer = window.setTimeout(onFinished, 6200);
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
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      onClick={onFinished}
      aria-label="SilentWatch launch intro"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#1B1B1D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 340,
          height: 340,
          maxWidth: '72vw',
          maxHeight: '58vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          key={src}
          src={src}
          autoPlay
          muted
          playsInline
          onEnded={onFinished}
          onError={() => {
            if (!fallbackLocal && startupVideoUrl) {
              setFallbackLocal(true);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginTop: 10, textAlign: 'center' }}
      >
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', color: '#F8F7FA' }}>
          SilentWatch
        </div>
      </motion.div>
    </motion.div>
  );
};
