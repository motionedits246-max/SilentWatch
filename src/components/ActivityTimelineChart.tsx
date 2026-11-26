import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { SPRINGS } from '@/animations/motionTokens';
import type { MotionTier, TimelineBucket } from '@/types/telemetry';

interface ActivityTimelineChartProps {
  buckets: TimelineBucket[];
  range: string;
  isDemo: boolean;
  motionTier: MotionTier;
  onRangeChange: (range: string) => void;
}

const RANGES = ['15M', '1H', '6H', '24H', '7D'] as const;

export const ActivityTimelineChart: React.FC<ActivityTimelineChartProps> = ({
  buckets,
  range,
  isDemo,
  motionTier,
  onRangeChange,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 920;
  const height = 168;
  const padL = 42;
  const padR = 18;
  const padT = 18;
  const padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const { linePath, areaPath, points, maxVal } = useMemo(() => {
    if (!buckets.length) {
      return { linePath: '', areaPath: '', points: [], maxVal: 100 };
    }
    const maxV = Math.max(...buckets.map((b) => b.total_events), 10) * 1.15;
    const pts = buckets.map((b, i) => {
      const x = padL + (buckets.length === 1 ? plotW / 2 : (i / (buckets.length - 1)) * plotW);
      const y = padT + plotH - (b.total_events / maxV) * plotH;
      return { x, y, bucket: b };
    });

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = ((p0.x + p1.x) / 2).toFixed(1);
      d += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;
    return { linePath: d, areaPath: area, points: pts, maxVal: Math.round(maxV) };
  }, [buckets, plotW, plotH]);

  const strokeColor = isDemo ? '#89B4FA' : '#CBA6C5';
  const dotColor = isDemo ? '#C4DAFF' : '#FDCEF1';
  const activePoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : points[Math.floor(points.length * 0.65)];

  return (
    <div className="sw-card" style={{ padding: '18px 20px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em', color: '#EAE6EA' }}>
            System Activity Timeline
          </h2>
          <span className="mono" style={{ fontSize: 11, color: '#847C84' }}>
            {buckets.reduce((acc, b) => acc + b.total_events, 0).toLocaleString()} events in {range}
          </span>
        </div>

        <div role="group" aria-label="Timeline range" style={{ display: 'inline-flex', background: '#0A0A0A', border: '1px solid #2A2529', borderRadius: 999, padding: 2 }}>
          {RANGES.map((r) => {
            const active = range === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onRangeChange(r)}
                className="mono"
                style={{
                  position: 'relative',
                  height: 24,
                  padding: '0 10px',
                  border: 'none',
                  borderRadius: 999,
                  background: 'transparent',
                  color: active ? '#F5F3F5' : '#847C84',
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {active && (
                  <motion.span
                    layoutId="timeline-range-pill"
                    transition={motionTier === 'off' ? { duration: 0 } : SPRINGS.pillGlide}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 999,
                      background: isDemo ? 'rgba(137,180,250,0.22)' : 'var(--sw-mauve-pill-bg)',
                      border: `1px solid ${strokeColor}`,
                      zIndex: 0,
                    }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{r}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 170 }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="swAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((t) => {
            const y = padT + plotH * t;
            const val = Math.round(maxVal * (1 - t));
            return (
              <g key={t}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={padL - 8} y={y + 3} textAnchor="end" fill="#847C84" fontSize="10" fontFamily="var(--font-mono)">
                  {val}
                </text>
              </g>
            );
          })}

          {areaPath && (
            <motion.path d={areaPath} fill="url(#swAreaGrad)" animate={{ d: areaPath }} transition={{ duration: motionTier === 'off' ? 0 : 0.24 }} />
          )}
          {linePath && (
            <motion.path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" animate={{ d: linePath }} transition={{ duration: motionTier === 'off' ? 0 : 0.24 }} />
          )}

          {activePoint && (
            <g>
              <line x1={activePoint.x} y1={activePoint.y} x2={activePoint.x} y2={padT + plotH} stroke="rgba(253, 206, 241, 0.35)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={activePoint.x} cy={activePoint.y} r="9" fill={dotColor} fillOpacity="0.2" />
              <circle cx={activePoint.x} cy={activePoint.y} r="4.5" fill={dotColor} stroke="#0A0A0A" strokeWidth="1.5" />
            </g>
          )}

          {points.map((pt, idx) => (
            <g key={pt.bucket.label + idx}>
              <text x={pt.x} y={height - 5} textAnchor="middle" fill={activePoint === pt ? '#F5F3F5' : '#847C84'} fontSize="10.5" fontFamily="var(--font-mono)">
                {pt.bucket.label}
              </text>
              <rect x={pt.x - plotW / Math.max(points.length * 2, 1)} y={padT} width={plotW / Math.max(points.length, 1)} height={plotH} fill="transparent" onMouseEnter={() => setHoverIdx(idx)} />
            </g>
          ))}
        </svg>

        {activePoint && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: `${Math.min(Math.max((activePoint.x / width) * 100, 14), 74)}%`,
              transform: 'translateX(-50%)',
              background: 'var(--sw-glass)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(203, 166, 197, 0.35)',
              borderRadius: 10,
              padding: '7px 11px',
              pointerEvents: 'none',
              transition: motionTier === 'off' ? 'none' : 'left 60ms ease-out',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            }}
          >
            <div className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: '#F5F3F5' }}>
              {activePoint.bucket.label} &nbsp;|&nbsp; {activePoint.bucket.total_events} events
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: '#A8A2A8', marginTop: 2 }}>
              <span style={{ color: '#5ED18A' }}>{activePoint.bucket.process_events} Proc</span> •{' '}
              <span style={{ color: '#89B4FA' }}>{activePoint.bucket.network_events} Net</span> •{' '}
              <span style={{ color: '#CBA6C5' }}>{activePoint.bucket.module_events} DLL</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
