import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Play } from 'lucide-react';
import { EmptyStateEmblem, ProcessAppIcon, SystemActivityCore } from '@/assets/VisualAssets';
import { ActivityTimelineChart } from '@/components/ActivityTimelineChart';
import { EASINGS, SPRINGS } from '@/animations/motionTokens';
import type { MotionTier, OverviewSnapshot, ScreenId } from '@/types/telemetry';
import { formatStableKey } from '@/types/telemetry';

interface OverviewScreenProps {
  snapshot: OverviewSnapshot | null;
  range: string;
  motionTier: MotionTier;
  coldOpen: boolean;
  onRangeChange: (range: string) => void;
  onInspectProcess: (stableKey: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onResumeMonitoring: () => void;
}

const MiniSparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 56;
      const y = 18 - (v / max) * 15;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={56} height={20} viewBox="0 0 56 20" fill="none" aria-hidden="true">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  snapshot,
  range,
  motionTier,
  coldOpen,
  onRangeChange,
  onInspectProcess,
  onNavigate,
  onResumeMonitoring,
}) => {
  const [appFilter, setAppFilter] = useState<'active' | 'network' | 'flagged'>('active');

  const isDemo = snapshot?.mode === 'demo';
  const filteredApps = useMemo(() => {
    const list = snapshot?.high_activity_apps ?? [];
    if (appFilter === 'network') {
      return [...list].sort((a, b) => b.network_count - a.network_count).slice(0, 5);
    }
    if (appFilter === 'flagged') {
      return list.filter((p) => p.signature_status === 'unsigned' || !p.publisher).slice(0, 5);
    }
    return list.slice(0, 5);
  }, [snapshot, appFilter]);

  const usedMb = Math.round((snapshot?.storage.total_bytes ?? 0) / (1024 * 1024));
  const capMb = Math.max(Math.round((snapshot?.storage.cap_bytes ?? 512 * 1024 * 1024) / (1024 * 1024)), 1);
  const bufferPct = Math.min(100, Math.round((usedMb / capMb) * 100));

  const staggerProps = (index: number) =>
    coldOpen && motionTier !== 'off'
      ? {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.24, delay: index * 0.035, ease: EASINGS.fluidOut },
        }
      : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', overflowY: 'auto', paddingRight: 2 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '2px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 23, fontWeight: 500, letterSpacing: '-0.02em', color: '#F5F3F5' }}>
            Overview
          </h1>
          <span className="mono" style={{ fontSize: 12, color: isDemo ? '#C4DAFF' : '#E5CBE0' }}>
            {snapshot?.active_process_count ?? 0} Active Processes • {(snapshot?.total_events_window ?? 0).toLocaleString()} Events / {range}
          </span>
        </div>
        {snapshot && !snapshot.monitoring_active && !isDemo && (
          <button type="button" className="sw-cta-primary" onClick={onResumeMonitoring}>
            <Play size={13} /> Resume Monitoring
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(230px, 0.92fr) minmax(290px, 1.25fr) minmax(250px, 1.05fr)', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <motion.div className="sw-card" style={{ padding: '18px 20px' }} {...staggerProps(0)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#A8A2A8', fontWeight: 500 }}>Active Telemetry ({range})</span>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: isDemo ? '#89B4FA' : '#5ED18A',
                  background: isDemo ? 'rgba(137,180,250,0.12)' : 'rgba(94,209,138,0.12)',
                  border: `1px solid ${isDemo ? 'rgba(137,180,250,0.3)' : 'rgba(94,209,138,0.3)'}`,
                  borderRadius: 999,
                  padding: '1px 8px',
                }}
              >
                {isDemo ? 'DEMO' : snapshot?.monitoring_active ? 'LIVE' : 'PAUSED'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
              <span className="tabular" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', color: '#F5F3F5' }}>
                {(snapshot?.total_events_window ?? 0).toLocaleString()}
              </span>
              <span className="mono" style={{ fontSize: 11.5, color: '#847C84' }}>
                events recorded
              </span>
            </div>
          </motion.div>

          <motion.div
            className="sw-card"
            style={{
              padding: '16px 20px 18px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              background: 'radial-gradient(ellipse 80% 55% at 50% 105%, rgba(203, 166, 197, 0.16) 0%, #0A0A0A 68%)',
            }}
            {...staggerProps(1)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: '#EAE6EA' }}>System Activity Core</span>
              <span className="mono" style={{ fontSize: 10.5, color: '#847C84' }}>
                WAL {snapshot?.storage.wal_mode_active ? 'OK' : 'OFF'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
              <SystemActivityCore
                active={Boolean(snapshot?.monitoring_active)}
                isDemo={isDemo}
                motionTier={motionTier}
                eventsPerMin={Math.max(Math.round((snapshot?.total_events_window ?? 0) / 60), 1)}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: '#847C84' }}>
                  Ring Buffer: {usedMb} / {capMb} MB
                </span>
                <span className="mono" style={{ fontSize: 11, color: '#A8A2A8' }}>
                  {bufferPct}%
                </span>
              </div>
              <div style={{ width: '100%', height: 4, borderRadius: 999, background: '#2A2529', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${bufferPct}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: bufferPct > 85 ? '#E5B567' : isDemo ? '#89B4FA' : '#CBA6C5',
                    transition: 'width 260ms ease-out',
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div className="sw-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} {...staggerProps(2)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#EAE6EA' }}>High Activity Applications</h2>
            <div style={{ display: 'inline-flex', gap: 4 }}>
              {(
                [
                  ['active', 'Most Active'],
                  ['network', 'Network'],
                  ['flagged', 'Unsigned'],
                ] as const
              ).map(([key, lbl]) => {
                const active = appFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAppFilter(key)}
                    style={{
                      position: 'relative',
                      height: 26,
                      padding: '0 10px',
                      borderRadius: 999,
                      border: active ? '1px solid #CBA6C5' : '1px solid #2A2529',
                      background: active ? 'var(--sw-mauve-pill-bg)' : 'transparent',
                      color: active ? '#F5F3F5' : '#847C84',
                      fontSize: 11.5,
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {active && motionTier !== 'off' && (
                      <motion.span layoutId="high-act-filter" transition={SPRINGS.pillGlide} style={{ position: 'absolute', inset: 0, borderRadius: 999, zIndex: 0 }} />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>{lbl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredApps.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 }}>
              <EmptyStateEmblem variant="paused" />
              <div style={{ fontSize: 12.5, color: '#847C84' }}>No applications match this filter right now.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredApps.map((app) => {
                const key = formatStableKey(app.instance_id);
                const unsigned = app.signature_status === 'unsigned';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onInspectProcess(key)}
                    style={{
                      height: 52,
                      padding: '0 10px',
                      borderRadius: 10,
                      border: '1px solid transparent',
                      background: 'transparent',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'center',
                      gap: 12,
                      textAlign: 'left',
                      transition: 'background-color 110ms ease, border-color 110ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#141115';
                      e.currentTarget.style.borderColor = '#2A2529';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <ProcessAppIcon exeName={app.exe_name} iconDataUrl={app.icon_data_url} size={28} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#F5F3F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.exe_name}
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: unsigned ? '#E5B567' : '#847C84' }}>
                          {unsigned ? 'Unsigned' : app.publisher ?? 'Verified'} • PID {app.instance_id.pid}
                        </div>
                      </div>
                    </div>

                    <MiniSparkline values={app.sparkline} color={unsigned ? '#E5B567' : '#CBA6C5'} />

                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: unsigned ? '#E5B567' : '#5ED18A' }}>
                        +{app.activity_delta_pct.toFixed(1)}%
                      </div>
                      <div className="mono" style={{ fontSize: 10.5, color: '#847C84' }}>
                        {app.event_count} ev
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div className="sw-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} {...staggerProps(3)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#EAE6EA' }}>Live Telemetry Breakdown</h2>
            <button
              type="button"
              onClick={() => onNavigate('applications')}
              style={{ height: 26, padding: '0 10px', borderRadius: 999, border: '1px solid #2A2529', background: '#100E10', color: '#A8A2A8', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              See all <ArrowUpRight size={12} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
            {[
              { label: 'Process Spawns', value: snapshot?.process_spawns_count ?? 0, color: '#5ED18A', target: 'applications' as ScreenId },
              { label: 'Network Calls', value: snapshot?.network_calls_count ?? 0, color: '#89B4FA', target: 'network_modules' as ScreenId },
              { label: 'DLL Loads', value: snapshot?.dll_loads_count ?? 0, color: '#CBA6C5', target: 'network_modules' as ScreenId },
              { label: 'Rule Matches', value: snapshot?.rule_matches_count ?? 0, color: (snapshot?.rule_matches_count ?? 0) > 0 ? '#E06C75' : '#A8A2A8', target: 'detections_logs' as ScreenId },
            ].map((tile) => (
              <button
                key={tile.label}
                type="button"
                className="sw-tile"
                onClick={() => onNavigate(tile.target)}
                style={{ padding: '14px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <span style={{ fontSize: 12, color: '#A8A2A8' }}>{tile.label}</span>
                <span className="tabular" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: tile.color }}>
                  {tile.value.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div {...staggerProps(4)}>
        <ActivityTimelineChart
          buckets={snapshot?.timeline ?? []}
          range={range}
          isDemo={isDemo}
          motionTier={motionTier}
          onRangeChange={onRangeChange}
        />
      </motion.div>
    </div>
  );
};
