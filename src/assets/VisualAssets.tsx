import React from 'react';
import type { MotionTier } from '@/types/telemetry';

/**
 * Original SilentWatch Visual Asset Suite
 * Asset #1: Official SilentWatch Brand Mark
 * Asset #3: Sculptural Optical-Glass Centerpiece (ART-DIR-01)
 * Asset #6: Luminous Orbital Liquid-Glass System Activity Core
 * Asset #7: Empty-State Monochrome Hairline Illustrations
 * Asset #9: Frosted Export Folder Sleeve Illustration
 */

export const SilentWatchMark: React.FC<{
  size?: number;
  variant?: 'dark' | 'light';
  className?: string;
}> = ({ size = 22, className = '' }) => {
  return (
    <img
      src="/icons/app-logo.png"
      alt="SilentWatch"
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        borderRadius: Math.max(4, Math.round(size * 0.22)),
      }}
    />
  );
};

export const OpticalLensCenterpiece: React.FC<{
  size?: number;
  motionTier: MotionTier;
}> = ({ size = 216, motionTier }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '8% -12% -16% 12%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 42% 45%, rgba(24, 22, 20, 0.24) 0%, rgba(24, 22, 20, 0.11) 42%, transparent 72%)',
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        className={motionTier === 'full' ? 'sw-core-breathe' : ''}
        style={{ position: 'relative', zIndex: 2 }}
        aria-label="SilentWatch Optical Aperture Centerpiece"
      >
        <defs>
          <radialGradient id="swLensHousing" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#3B393E" />
            <stop offset="32%" stopColor="#1D1C1F" />
            <stop offset="72%" stopColor="#111013" />
            <stop offset="100%" stopColor="#070709" />
          </radialGradient>
          <linearGradient id="swPrismRim" x1="15%" y1="10%" x2="88%" y2="90%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.68)" />
            <stop offset="22%" stopColor="rgba(203,166,197,0.42)" />
            <stop offset="48%" stopColor="rgba(137,180,250,0.34)" />
            <stop offset="75%" stopColor="rgba(229,181,103,0.28)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.52)" />
          </linearGradient>
          <radialGradient id="swSmokedGlass" cx="42%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#2D2933" />
            <stop offset="45%" stopColor="#141218" />
            <stop offset="82%" stopColor="#09080B" />
            <stop offset="100%" stopColor="#040406" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="108" fill="url(#swLensHousing)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
        <circle cx="120" cy="120" r="97" fill="none" stroke="url(#swPrismRim)" strokeWidth="3.2" />
        <circle cx="120" cy="120" r="72" fill="#0B0A0D" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" />
        <circle cx="120" cy="120" r="64" fill="url(#swSmokedGlass)" stroke="rgba(203,166,197,0.22)" strokeWidth="1" />
        <circle cx="120" cy="120" r="24" fill="#050407" stroke="rgba(255,255,255,0.12)" strokeWidth="0.9" />
      </svg>
    </div>
  );
};

export const SystemActivityCore: React.FC<{
  active: boolean;
  isDemo: boolean;
  motionTier: MotionTier;
  eventsPerMin: number;
}> = ({ active, isDemo, motionTier, eventsPerMin }) => {
  const primary = isDemo ? '#60A5FA' : '#E879F9';
  const secondary = isDemo ? '#38BDF8' : '#A855F7';
  const animate = active && motionTier !== 'off';

  return (
    <div
      style={{
        position: 'relative',
        width: 118,
        height: 118,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="System Activity Core"
    >
      <div
        className={animate ? 'sw-core-breathe' : ''}
        style={{
          position: 'absolute',
          inset: 6,
          borderRadius: '50%',
          background: active
            ? `radial-gradient(circle, ${primary}48 0%, ${secondary}20 48%, transparent 72%)`
            : 'radial-gradient(circle, rgba(140,132,148,0.14) 0%, transparent 70%)',
          filter: 'blur(10px)',
          pointerEvents: 'none',
        }}
      />
      <div
        className={animate ? 'sw-orbit-spin' : ''}
        style={{
          position: 'absolute',
          inset: 8,
          borderRadius: '50%',
          padding: 2,
          background: active
            ? `conic-gradient(from 0deg, transparent 0deg, ${primary} 90deg, #FFFFFF 135deg, ${secondary} 195deg, transparent 295deg)`
            : 'conic-gradient(from 0deg, rgba(255,255,255,0.08), rgba(255,255,255,0.16), rgba(255,255,255,0.06))',
          WebkitMask:
            'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px))',
          opacity: active ? 0.96 : 0.45,
        }}
      />
      <svg
        width={118}
        height={118}
        viewBox="0 0 118 118"
        fill="none"
        className={animate ? 'sw-orbit-spin-reverse' : ''}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      >
        <circle
          cx="59"
          cy="59"
          r="43"
          stroke={active ? `${primary}55` : 'rgba(255,255,255,0.08)'}
          strokeWidth="1"
          strokeDasharray="18 12 4 12"
        />
        <circle
          cx="59"
          cy="16"
          r="2.4"
          fill={active ? '#FFFFFF' : '#6A6470'}
          style={{ filter: active ? `drop-shadow(0 0 6px ${primary})` : undefined }}
        />
      </svg>
      <div
        style={{
          position: 'relative',
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: active
            ? `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.34) 0%, ${primary}66 24%, #1A1324 68%, #07050B 100%)`
            : 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.14) 0%, #1B1820 55%, #09080C 100%)',
          border: `1px solid ${active ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: active
            ? `0 0 26px ${primary}44, inset 0 2px 6px rgba(255,255,255,0.28)`
            : 'inset 0 1px 4px rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: active ? '#FFFFFF' : '#8E8894',
            lineHeight: 1,
          }}
        >
          {active ? eventsPerMin : '—'}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 8.5,
            letterSpacing: '0.06em',
            color: active ? 'rgba(255,255,255,0.72)' : '#6E6874',
            marginTop: 3,
          }}
        >
          {active ? 'EV/MIN' : 'PAUSED'}
        </span>
      </div>
    </div>
  );
};

export const ExportFolderIllustration: React.FC<{ size?: number; tucked?: boolean }> = ({
  size = 44,
  tucked = false,
}) => (
  <svg width={size} height={size * 0.86} viewBox="0 0 48 42" fill="none" aria-hidden="true">
    <path
      d="M4 10C4 7.8 5.8 6 8 6H18L22 10H40C42.2 10 44 11.8 44 14V34C44 36.2 42.2 38 40 38H8C5.8 38 4 36.2 4 34V10Z"
      fill="#1A151A"
      stroke="#443B43"
      strokeWidth="1.2"
    />
    <rect
      x="11"
      y={tucked ? 14 : 9}
      width="26"
      height="18"
      rx="3"
      fill="#261F26"
      stroke="#E879F9"
      strokeWidth="1"
      style={{ transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    />
    <line x1="15" y1={tucked ? 19 : 14} x2="31" y2={tucked ? 19 : 14} stroke="#F5D0FE" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="15" y1={tucked ? 23 : 18} x2="26" y2={tucked ? 23 : 18} stroke="#847C84" strokeWidth="1.2" strokeLinecap="round" />
    <path
      d="M4 18C4 16.3 5.3 15 7 15H41C42.7 15 44 16.3 44 18V34C44 36.2 42.2 38 40 38H8C5.8 38 4 36.2 4 34V18Z"
      fill="rgba(24, 20, 24, 0.88)"
      stroke="rgba(255,255,255,0.14)"
      strokeWidth="1.1"
    />
  </svg>
);

export const EmptyStateEmblem: React.FC<{ variant: 'paused' | 'search' | 'rules' | 'etw' }> = ({
  variant,
}) => (
  <svg width={104} height={82} viewBox="0 0 120 96" fill="none" aria-hidden="true">
    <rect x="16" y="14" width="88" height="68" rx="14" stroke="#3D363D" strokeWidth="1.2" strokeDasharray="4 4" />
    {variant === 'paused' && (
      <>
        <circle cx="60" cy="48" r="18" stroke="#524852" strokeWidth="1.4" />
        <line x1="55" y1="41" x2="55" y2="55" stroke="#E879F9" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="65" y1="41" x2="65" y2="55" stroke="#E879F9" strokeWidth="2.2" strokeLinecap="round" />
      </>
    )}
    {variant === 'search' && (
      <>
        <circle cx="56" cy="45" r="14" stroke="#524852" strokeWidth="1.5" />
        <line x1="66" y1="55" x2="76" y2="65" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" />
      </>
    )}
    {variant === 'rules' && (
      <>
        <path d="M60 28L78 36V50C78 60 70 68 60 71C50 68 42 60 42 50V36L60 28Z" stroke="#524852" strokeWidth="1.4" />
        <circle cx="60" cy="49" r="3.5" fill="#5ED18A" />
      </>
    )}
    {variant === 'etw' && (
      <>
        <rect x="44" y="44" width="32" height="22" rx="5" stroke="#524852" strokeWidth="1.4" />
        <path d="M52 44V37C52 32.5 55.5 29 60 29C64.5 29 68 32.5 68 37V44" stroke="#E5B567" strokeWidth="1.5" />
        <circle cx="60" cy="55" r="2.5" fill="#E5B567" />
      </>
    )}
  </svg>
);

export const ProcessAppIcon: React.FC<{ exeName: string; iconDataUrl?: string | null; size?: number }> = ({
  exeName,
  iconDataUrl,
  size = 28,
}) => {
  if (iconDataUrl) {
    return (
      <img
        src={iconDataUrl}
        alt={exeName}
        width={size}
        height={size}
        style={{ borderRadius: 8, objectFit: 'contain' }}
      />
    );
  }
  const low = exeName.toLowerCase();
  let bg = '#18141C';
  let accent = '#E879F9';
  let glyph = exeName.slice(0, 2).toUpperCase();

  if (low.includes('chrome')) {
    bg = '#151B24';
    accent = '#89B4FA';
    glyph = 'Cr';
  } else if (low.includes('code')) {
    bg = '#131C2B';
    accent = '#60A5FA';
    glyph = 'VS';
  } else if (low.includes('powershell') || low.includes('pwsh')) {
    bg = '#121926';
    accent = '#93C5FD';
    glyph = '>_';
  } else if (low.includes('svchost')) {
    bg = '#16161C';
    accent = '#A8A2A8';
    glyph = 'OS';
  } else if (low.includes('update') || low.includes('helper')) {
    bg = '#241B15';
    accent = '#E5B567';
    glyph = 'Up';
  } else if (low.includes('node')) {
    bg = '#132018';
    accent = '#5ED18A';
    glyph = 'JS';
  }

  return (
    <div
      className="mono"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: bg,
        border: `1px solid ${accent}40`,
        color: accent,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(9.5, Math.round(size * 0.36)),
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {glyph}
    </div>
  );
};
