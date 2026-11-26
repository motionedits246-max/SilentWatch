import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CustomVideoPlayerProps {
  src?: string | null;
  version: string;
}

const SLIDES = [
  {
    tag: 'CLARITY FIRST',
    title: 'Everything starts with Clarity',
    sub: 'Real-time Windows telemetry rebuilt in Apple Liquid Glass.',
    accent: '#E4FF3B',
    bg: 'radial-gradient(circle 320px at 22% 72%, rgba(228, 255, 59, 0.28), transparent 65%), radial-gradient(circle 360px at 80% 28%, rgba(16, 185, 129, 0.3), transparent 70%), #071A15',
    light: false,
  },
  {
    tag: 'LIVE TELEMETRY',
    title: 'Live CPU % & Real RAM MB',
    sub: 'Per-process counters and true local-time timelines with zero freeze.',
    accent: '#E879F9',
    bg: 'radial-gradient(circle 320px at 25% 25%, rgba(217, 70, 239, 0.3), transparent 68%), radial-gradient(circle 340px at 78% 75%, rgba(96, 165, 250, 0.26), transparent 70%), #0B0A12',
    light: false,
  },
  {
    tag: 'NO CLUTTER',
    title: 'Pure Real-Time Flow',
    sub: 'Iconsax floating pill rail, Apple Settings, and background System Tray.',
    accent: '#0A4A36',
    bg: 'radial-gradient(circle 320px at 18% 50%, rgba(187, 247, 208, 0.85), transparent 65%), #F2FCE8',
    light: true,
  },
  {
    tag: 'AUTO-UPDATES',
    title: 'GitHub Releases Built-In',
    sub: 'One-click release checks, release videos, and instant installer downloads.',
    accent: '#38F9A6',
    bg: 'radial-gradient(circle 320px at 72% 30%, rgba(56, 249, 166, 0.28), transparent 68%), radial-gradient(circle 300px at 25% 78%, rgba(228, 255, 59, 0.22), transparent 68%), #071A15',
    light: false,
  },
];

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ src, version }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [useVideo, setUseVideo] = useState(Boolean(src));
  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(12);

  useEffect(() => {
    setUseVideo(Boolean(src));
    setVideoReady(false);
    setCurrentTime(0);
    setPlaying(true);
  }, [src]);

  useEffect(() => {
    if (useVideo || !playing) return;
    setDuration(12);
    const id = window.setInterval(() => {
      setCurrentTime((prev) => (prev + 0.1 >= 12 ? 0 : prev + 0.1));
    }, 100);
    return () => window.clearInterval(id);
  }, [useVideo, playing]);

  const togglePlay = () => {
    if (useVideo && videoRef.current) {
      if (videoRef.current.paused) {
        void videoRef.current.play().catch(() => undefined);
        setPlaying(true);
      } else {
        videoRef.current.pause();
        setPlaying(false);
      }
    } else {
      setPlaying((p) => !p);
    }
  };

  const toggleMute = () => {
    if (useVideo && videoRef.current) {
      videoRef.current.muted = !muted;
    }
    setMuted((m) => !m);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const nextTime = ratio * duration;
    setCurrentTime(nextTime);
    if (useVideo && videoRef.current) {
      videoRef.current.currentTime = nextTime;
    }
  };

  const handleReplay = () => {
    setCurrentTime(0);
    setPlaying(true);
    if (useVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      void videoRef.current.play().catch(() => undefined);
    }
  };

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void el.requestFullscreen?.().catch(() => undefined);
    }
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const slideIdx = Math.min(SLIDES.length - 1, Math.floor((currentTime / 12) * SLIDES.length));
  const slide = SLIDES[slideIdx];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        background: '#09090D',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {useVideo && src ? (
        <>
          <video
            ref={videoRef}
            key={src}
            src={src}
            autoPlay
            loop
            muted={muted}
            playsInline
            preload="metadata"
            onClick={togglePlay}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (Number.isFinite(v.duration) && v.duration > 0) {
                setDuration(v.duration);
              }
              setVideoReady(true);
            }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => {
              setUseVideo(false);
              setVideoReady(false);
              setCurrentTime(0);
              setPlaying(true);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: videoReady ? 1 : 0,
              transition: 'opacity 220ms ease',
            }}
          />
          {!videoReady && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0B0A10',
                color: '#A8A2B2',
                fontSize: 12.5,
              }}
            >
              Loading release video...
            </div>
          )}
        </>
      ) : (
        <div
          onClick={togglePlay}
          style={{
            width: '100%',
            height: '100%',
            background: slide.bg,
            padding: '34px 40px 72px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'background 360ms ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '4px 11px',
                borderRadius: 999,
                color: slide.light ? '#0A4A36' : slide.accent,
                background: slide.light ? 'rgba(10, 74, 54, 0.1)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${slide.light ? 'rgba(10, 74, 54, 0.25)' : `${slide.accent}55`}`,
              }}
            >
              {slide.tag} • v{version}
            </span>
            <div style={{ display: 'inline-flex', gap: 6 }}>
              {SLIDES.map((s, idx) => (
                <span
                  key={s.tag}
                  style={{
                    width: idx === slideIdx ? 22 : 7,
                    height: 7,
                    borderRadius: 999,
                    background:
                      idx === slideIdx
                        ? slide.accent
                        : slide.light
                          ? 'rgba(10,74,54,0.22)'
                          : 'rgba(255,255,255,0.2)',
                    transition: 'width 200ms ease',
                  }}
                />
              ))}
            </div>
          </div>

          <motion.div
            key={slideIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: 560 }}
          >
            <h2
              style={{
                margin: '0 0 10px',
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: slide.light ? '#0A3628' : '#FFFFFF',
                lineHeight: 1.12,
              }}
            >
              {slide.title}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: slide.light ? '#2E624F' : '#C9C3D2',
                lineHeight: 1.5,
              }}
            >
              {slide.sub}
            </p>
          </motion.div>

          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: Cpu, label: 'Async Rust Collectors' },
              { icon: Sparkles, label: 'Apple Liquid Glass' },
              { icon: ShieldCheck, label: 'Local-First SQLite' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                  color: slide.light ? '#0A4A36' : '#F2EFF6',
                  background: slide.light ? 'rgba(10, 74, 54, 0.08)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${slide.light ? 'rgba(10, 74, 54, 0.16)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <Icon size={13} color={slide.accent} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          padding: '8px 12px',
          borderRadius: 14,
          background: 'rgba(12, 11, 16, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            border: '1px solid rgba(232, 121, 249, 0.45)',
            background: 'rgba(217, 70, 239, 0.22)',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
        </button>

        <button
          type="button"
          onClick={handleReplay}
          aria-label="Replay"
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            border: 'none',
            background: 'transparent',
            color: '#B4AEB8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <RotateCcw size={13} />
        </button>

        <span className="mono" style={{ fontSize: 11, color: '#D6CEDB', minWidth: 34 }}>
          {formatTime(currentTime)}
        </span>

        <div
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          onClick={handleSeek}
          style={{
            flex: 1,
            height: 16,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 4,
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.16)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #E879F9, #38F9A6)',
                transition: 'width 80ms linear',
              }}
            />
          </div>
        </div>

        <span className="mono" style={{ fontSize: 11, color: '#8E8894', minWidth: 34, textAlign: 'right' }}>
          {formatTime(duration)}
        </span>

        {useVideo && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              color: '#B4AEB8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}

        <button
          type="button"
          onClick={handleFullscreen}
          aria-label="Fullscreen"
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            border: 'none',
            background: 'transparent',
            color: '#B4AEB8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </div>
  );
};
