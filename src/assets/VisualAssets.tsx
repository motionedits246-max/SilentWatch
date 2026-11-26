import React from 'react';
import type { MotionTier } from '@/types/telemetry';

export const SilentWatchMark: React.FC<{
  size?: number;
  variant?: 'dark' | 'light';
  className?: string;
}> = ({ size = 22, variant = 'dark', className = '' }) => {
  const topColor = variant === 'dark' ? '#FDCEF1' : '#181818';
  const leftColor = variant === 'dark' ? '#CBA6C5' : '#404040';
  const rightColor = variant === 'dark' ? '#F5F3F5' : '#181818';
  const ringColor = variant === 'dark' ? 'rgba(203,166,197,0.34)' : 'rgba(24,24,24,0.18)';
  const lineColor = variant === 'dark' ? 'rgba(203,166,197,0.45)' : 'rgba(24,24,24,0.28)';

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="13.5" stroke={ringColor} strokeWidth="1.25" />
      <path d="M16 7.5L23.36 20.25H8.64L16 7.5Z" stroke={lineColor} strokeWidth="1.15" />
      <circle cx="16" cy="7.5" r="3.1" fill={topColor} />
      <circle cx="23.36" cy="20.25" r="3.1" fill={rightColor} />
      <circle cx="8.64" cy="20.25" r="3.1" fill={leftColor} />
      <circle cx="16" cy="16" r="1.6" fill={variant === 'dark' ? '#0A0A0A' : '#FBFAF6'} stroke={leftColor} strokeWidth="1.1" />
    </svg>
  );
};

export const OpticalLensCenterpiece: React.FC<{
  size?: number;
  motionTier: MotionTier;
}> = ({ size = 216, motionTier }) => {
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          position: 'absolute',
          inset: '8% -12% -16% 12%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 42% 45%, rgba(24, 22, 20, 0.24) 0%, rgba(24, 22, 20, 0.11) 42%, transparent 72%)',
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
          <linearGradient id="swGlassSpec" x1="20%" y1="14%" x2="65%" y2="62%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
            <stop offset="45%" stopColor="rgba(253,206,241,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <radialGradient id="swCoatingGlint" cx="68%" cy="70%" r="40%">
            <stop offset="0%" stopColor="rgba(203,166,197,0.36)" />
            <stop offset="55%" stopColor="rgba(137,180,250,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="108" fill="url(#swLensHousing)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
        <circle cx="120" cy="120" r="97" fill="none" stroke="url(#swPrismRim)" strokeWidth="3.2" />
        <circle cx="120" cy="120" r="90" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        <circle cx="120" cy="120" r="84" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.9" />
        <circle cx="120" cy="120" r="78" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx="120" cy="120" r="72" fill="#0B0A0D" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" />
        <circle cx="120" cy="120" r="64" fill="url(#swSmokedGlass)" stroke="rgba(203,166,197,0.22)" strokeWidth="1" />
        <g opacity="0.86">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <path
              key={deg}
              d="M120 62 C142 74, 152 94, 134 114 L109 102 C104 86, 108 72, 120 62 Z"
              fill="#151418"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.8"
              transform={`rotate(${deg} 120 120)`}
            />
          ))}
        </g>
        <circle cx="120" cy="120" r="24" fill="#050407" stroke="rgba(255,255,255,0.12)" strokeWidth="0.9" />
        <circle cx="120" cy="120" r="14" fill="#020203" />
        <circle cx="120" cy="120" r="62" fill="url(#swCoatingGlint)" />
        <path d="M72 95 C80 68, 108 56, 138 62 C112 68, 90 86, 82 112 C76 108, 73 102, 72 95 Z" fill="url(#swGlassSpec)" />
        <ellipse cx="101" cy="98" rx="6.5" ry="3.2" transform="rotate(-32 101 98)" fill="rgba(255,255,255,0.52)" />
        <circle cx="143" cy="144" r="2.6" fill="rgba(253,206,241,0.45)" />
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
  const accent = isDemo ? '#89B4FA' : '#CBA6C5';
  const luminous = isDemo ? '#C4DAFF' : '#FDCEF1';
  const breathe = active && motionTier === 'full';

  return (
    <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={96} height={96} viewBox="0 0 96 96" fill="none" aria-label="System Activity Core">
        <defs>
          <radialGradient id="swCoreHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={luminous} stopOpacity={active ? '0.45' : '0.12'} />
            <stop offset="55%" stopColor={accent} stopOpacity={active ? '0.18' : '0.05'} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="swGrooveRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="50%" stopColor={accent} stopOpacity="0.45" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r="42" fill="#0D0B0E" stroke="#2A2529" strokeWidth="1.2" />
        <circle cx="48" cy="48" r="37" fill="#070608" stroke="url(#swGrooveRim)" strokeWidth="1.4" />
        <circle cx="48" cy="48" r="30" fill="url(#swCoreHalo)" className={breathe ? 'sw-core-breathe' : ''} />
        <circle
          cx="48"
          cy="48"
          r="17"
          fill={active ? accent : '#3A353A'}
          fillOpacity={active ? 0.88 : 0.45}
          stroke={luminous}
          strokeOpacity={active ? 0.55 : 0.15}
          strokeWidth="1.2"
          className={breathe ? 'sw-core-breathe' : ''}
        />
        <circle cx="44" cy="43" r="4" fill="#FFFFFF" fillOpacity={active ? 0.35 : 0.1} />
      </svg>
      <div
        className="mono"
        style={{
          position: 'absolute',
          bottom: -2,
          fontSize: 10,
          color: 'var(--sw-text-muted)',
          background: '#0A0A0A',
          padding: '1px 6px',
          borderRadius: 999,
          border: '1px solid #2A2529',
        }}
      >
        {active ? `${eventsPerMin}/m` : 'PAUSED'}
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
      stroke="#CBA6C5"
      strokeWidth="1"
      style={{ transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    />
    <line x1="15" y1={tucked ? 19 : 14} x2="31" y2={tucked ? 19 : 14} stroke="#FDCEF1" strokeWidth="1.2" strokeLinecap="round" />
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
        <line x1="55" y1="41" x2="55" y2="55" stroke="#CBA6C5" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="65" y1="41" x2="65" y2="55" stroke="#CBA6C5" strokeWidth="2.2" strokeLinecap="round" />
      </>
    )}
    {variant === 'search' && (
      <>
        <circle cx="56" cy="45" r="14" stroke="#524852" strokeWidth="1.5" />
        <line x1="66" y1="55" x2="76" y2="65" stroke="#CBA6C5" strokeWidth="2" strokeLinecap="round" />
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
      <img src={iconDataUrl} alt={exeName} width={size} height={size} style={{ borderRadius: 7, objectFit: 'contain' }} />
    );
  }
  const low = exeName.toLowerCase();
  let bg = '#18141A';
  let accent = '#CBA6C5';
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
    bg = '#16161A';
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
        borderRadius: 7,
        background: bg,
        border: `1px solid ${accent}38`,
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
