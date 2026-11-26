import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Cpu, Flame, Globe, MemoryStick, Play, ShieldAlert } from 'lucide-react';
import {
  EmptyStateEmblem,
  ProcessAppIcon,
  SystemActivityCore,
} from '@/assets/VisualAssets';
import { ActivityTimelineChart } from '@/components/ActivityTimelineChart';
import { EASINGS } from '@/animations/motionTokens';
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

const DotMeter: React.FC<{ pct: number; activeColor: string }> = ({ pct, activeColor }) => {
  const filled = Math.max(1, Math.min(10, Math.round(pct / 10)));
  return (
    <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < filled ? activeColor : 'rgba(255, 255, 255, 0.1)',
            boxShadow: i < filled ? `0 0 8px ${activeColor}80` : 'none',
          }}
        />
      ))}
    </div>
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
  const allApps = snapshot?.high_activity_apps ?? [];

  const filteredApps = useMemo(() => {
    if (appFilter === 'network') {
      return [...allApps].sort((a, b) => b.network_count - a.network_count).slice(0, 5);
    }
    if (appFilter === 'flagged') {
      return allApps.filter((p) => p.signature_status === 'unsigned' || !p.publisher).slice(0, 5);
    }
    return [...allApps]
      .sort((a, b) => b.cpu_percent + b.memory_mb / 200 - (a.cpu_percent + a.memory_mb / 200))
      .slice(0, 5);
  }, [allApps, appFilter]);

  const totalCpu = useMemo(
    () => Math.min(100, allApps.reduce((acc, p) => acc + p.cpu_percent, 0)),
    [allApps],
  );
  const totalRamMb = useMemo(
    () => allApps.reduce((acc, p) => acc + p.memory_mb, 0),
    [allApps],
  );

  const usedMb = Math.round((snapshot?.storage.total_bytes ?? 0) / (1024 * 1024));
  const capMb = Math.max(
    Math.round((snapshot?.storage.cap_bytes ?? 512 * 1024 * 1024) / (1024 * 1024)),
    1,
  );
  const bufferPct = Math.min(100, Math.round((usedMb / capMb) * 100));

  const staggerProps = (index: number) =>
    coldOpen && motionTier !== 'off'
      ? {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.24, delay: index * 0.03, ease: EASINGS.fluidOut },
        }
      : {};

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        height: '100%',
        overflowY: 'auto',
        paddingRight: 2,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
            }}
          >
            Overview
          </h1>
          <span className="mono" style={{ fontSize: 12, color: isDemo ? '#93C5FD' : '#E9D5FF' }}>
            {snapshot?.active_process_count ?? 0} Running •{' '}
            {(snapshot?.total_events_window ?? 0).toLocaleString()} Events / {range}
          </span>
        </div>
        {snapshot && !snapshot.monitoring_active && !isDemo && (
          <button type="button" className="sw-cta-primary" onClick={onResumeMonitoring}>
            <Play size={13} /> Resume Monitoring
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(245px, 0.95fr) minmax(300px, 1.3fr) minmax(260px, 1.05fr)',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <motion.div
            className="sw-card"
            style={{
              padding: '18px 20px',
              background: isDemo
                ? 'radial-gradient(ellipse 90% 80% at 10% 0%, rgba(96, 165, 250, 0.26) 0%, rgba(14, 13, 19, 0.88) 70%)'
                : 'radial-gradient(ellipse 90% 80% at 10% 0%, rgba(217, 70, 239, 0.28) 0%, rgba(14, 13, 19, 0.88) 70%)',
            }}
            {...staggerProps(0)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: '#D6CEDB', fontWeight: 500 }}>
                Active Telemetry ({range})
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: isDemo ? '#93C5FD' : '#5ED18A',
                  background: isDemo ? 'rgba(96,165,250,0.14)' : 'rgba(94,209,138,0.14)',
                  border: `1px solid ${isDemo ? 'rgba(96,165,250,0.34)' : 'rgba(94,209,138,0.34)'}`,
                  borderRadius: 999,
                  padding: '2px 9px',
                }}
              >
                {isDemo ? 'DEMO' : snapshot?.monitoring_active ? 'LIVE' : 'PAUSED'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
              <span
                className="tabular"
                style={{
                  fontSize: 34,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#FFFFFF',
                }}
              >
                {(snapshot?.total_events_window ?? 0).toLocaleString()}
              </span>
              <span className="mono" style={{ fontSize: 11.5, color: '#A8A0B0' }}>
                events
              </span>
            </div>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#C5BDCC' }}>
                  <Cpu size={13} color="#E879F9" /> CPU
                </span>
                <DotMeter pct={totalCpu} activeColor="#E879F9" />
                <span className="mono" style={{ fontSize: 11.5, color: '#FFFFFF', width: 42, textAlign: 'right' }}>
                  {totalCpu.toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#C5BDCC' }}>
                  <MemoryStick size={13} color="#89B4FA" /> RAM
                </span>
                <DotMeter pct={Math.min(100, (totalRamMb / 4096) * 100)} activeColor="#89B4FA" />
                <span className="mono" style={{ fontSize: 11.5, color: '#FFFFFF', width: 42, textAlign: 'right' }}>
                  {totalRamMb >= 1024 ? `${(totalRamMb / 1024).toFixed(1)}G` : `${Math.round(totalRamMb)}M`}
                </span>
              </div>
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
              gap: 10,
            }}
            {...staggerProps(1)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: '#F5F3F7' }}>
                System Activity Core
              </span>
              <span className="mono" style={{ fontSize: 10.5, color: '#8E8894' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span className="mono" style={{ fontSize: 11, color: '#8E8894' }}>
                  Ring Buffer: {usedMb} / {capMb} MB
                </span>
                <span className="mono" style={{ fontSize: 11, color: '#C5BDCC' }}>
                  {bufferPct}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${bufferPct}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: isDemo
                      ? 'linear-gradient(90deg, #60A5FA, #38BDF8)'
                      : 'linear-gradient(90deg, #D946EF, #A855F7)',
                    transition: 'width 260ms ease-out',
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="sw-card"
          style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
          {...staggerProps(2)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#F8F7FA' }}>
              High Activity Applications
            </h2>
            <div role="group" aria-label="Filter applications" style={{ display: 'inline-flex', gap: 6 }}>
              {(
                [
                  { key: 'active', label: 'Most Active', icon: Flame },
                  { key: 'network', label: 'Network Activity', icon: Globe },
                  { key: 'flagged', label: 'Unsigned / Flagged', icon: ShieldAlert },
                ] as const
              ).map(({ key, label, icon: Icon }) => {
                const active = appFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAppFilter(key)}
                    title={label}
                    aria-label={label}
                    aria-pressed={active}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      border: active
                        ? '1px solid rgba(232, 121, 249, 0.65)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      background: active
                        ? 'radial-gradient(circle at 30% 30%, rgba(232, 121, 249, 0.34), rgba(168, 85, 247, 0.16))'
                        : 'rgba(255, 255, 255, 0.03)',
                      color: active ? '#FFFFFF' : '#9E98A4',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: active ? '0 0 12px rgba(217, 70, 239, 0.25)' : 'none',
                      transition: 'all 140ms ease',
                    }}
                  >
                    <Icon size={14} strokeWidth={active ? 2 : 1.65} />
                  </button>
                );
              })}
            </div>
          </div>

          {filteredApps.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 16,
              }}
            >
              <EmptyStateEmblem variant="paused" />
              <div style={{ fontSize: 12.5, color: '#8E8894' }}>
                No applications match this filter right now.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredApps.map((app) => {
                const key = formatStableKey(app.instance_id);
                const unsigned = app.signature_status === 'unsigned';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onInspectProcess(key)}
                    style={{
                      height: 54,
                      padding: '0 12px',
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      background: 'rgba(255, 255, 255, 0.025)',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: 12,
                      textAlign: 'left',
                      transition: 'background 140ms ease, border-color 140ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(217, 70, 239, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(232, 121, 249, 0.32)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <ProcessAppIcon
                        exeName={app.exe_name}
                        iconDataUrl={app.icon_data_url}
                        size={30}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#F8F7FA',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {app.exe_name}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: 11, color: unsigned ? '#E5B567' : '#8E8894' }}
                        >
                          {unsigned ? 'Unsigned' : app.publisher ?? 'Verified'} • PID{' '}
                          {app.instance_id.pid}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        className="mono"
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: unsigned ? '#E5B567' : '#F0ABFC',
                        }}
                      >
                        {app.cpu_percent.toFixed(1)}% CPU
                      </div>
                      <div className="mono" style={{ fontSize: 10.5, color: '#9E98A4' }}>
                        {Math.round(app.memory_mb)} MB RAM
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div
          className="sw-card"
          style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
          {...staggerProps(3)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#F8F7FA' }}>
              Live Telemetry Breakdown
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('applications')}
              style={{
                height: 26,
                padding: '0 10px',
                borderRadius: 999,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#C5BDCC',
                fontSize: 11.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              See all <ArrowUpRight size={12} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
            {[
              {
                label: 'Process Spawns',
                value: snapshot?.process_spawns_count ?? 0,
                color: '#5ED18A',
                target: 'applications' as ScreenId,
              },
              {
                label: 'Network Calls',
                value: snapshot?.network_calls_count ?? 0,
                color: '#60A5FA',
                target: 'network_modules' as ScreenId,
              },
              {
                label: 'DLL Loads',
                value: snapshot?.dll_loads_count ?? 0,
                color: '#E879F9',
                target: 'network_modules' as ScreenId,
              },
              {
                label: 'Rule Matches',
                value: snapshot?.rule_matches_count ?? 0,
                color: (snapshot?.rule_matches_count ?? 0) > 0 ? '#FB7185' : '#A8A2B0',
                target: 'detections_logs' as ScreenId,
              },
            ].map((tile) => (
              <button
                key={tile.label}
                type="button"
                className="sw-tile"
                onClick={() => onNavigate(tile.target)}
                style={{
                  padding: '14px 15px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 12, color: '#A8A0B0', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {tile.label === 'Rule Matches' && <ShieldAlert size={12} color={tile.color} />}
                  {tile.label}
                </span>
                <span
                  className="tabular"
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: '-0.025em',
                    color: tile.color,
                  }}
                >
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
