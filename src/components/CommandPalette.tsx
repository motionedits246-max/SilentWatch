import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  AppWindow,
  CornerDownLeft,
  Download,
  GitFork,
  Globe,
  HeartPulse,
  LayoutDashboard,
  Network,
  Play,
  RotateCcw,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { EASINGS, resolveDurationSec } from '@/animations/motionTokens';
import type { MotionTier, NetworkConnectionRecord, ProcessSummary, ScreenId } from '@/types/telemetry';
import { formatStableKey } from '@/types/telemetry';

interface CommandPaletteProps {
  open: boolean;
  motionTier: MotionTier;
  processes: ProcessSummary[];
  connections: NetworkConnectionRecord[];
  isFirstSummon: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
  onInspectProcess: (stableKey: string) => void;
  onExecuteAction: (actionId: string) => void;
}

interface PaletteRow {
  id: string;
  group: 'Applications' | 'Network Endpoints' | 'Screens' | 'Quick Actions';
  title: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  motionTier,
  processes,
  connections,
  isFirstSummon,
  onClose,
  onNavigate,
  onInspectProcess,
  onExecuteAction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const allRows = useMemo<PaletteRow[]>(() => {
    const procRows: PaletteRow[] = processes.slice(0, 8).map((p) => ({
      id: `proc-${formatStableKey(p.instance_id)}`,
      group: 'Applications',
      title: p.exe_name,
      subtitle: `PID ${p.instance_id.pid} • ${p.publisher ?? 'Unsigned'} • ${p.memory_mb.toFixed(0)} MB`,
      badge: 'Explorer',
      icon: AppWindow,
      onSelect: () => {
        onInspectProcess(formatStableKey(p.instance_id));
        onClose();
      },
    }));

    const netRows: PaletteRow[] = connections.slice(0, 5).map((c) => ({
      id: `net-${c.id}`,
      group: 'Network Endpoints',
      title: c.remote_domain ? `${c.remote_domain}:${c.remote_port}` : `${c.remote_addr}:${c.remote_port}`,
      subtitle: `${c.process_name} • ${c.protocol} • ${c.state}`,
      badge: 'Network',
      icon: Globe,
      onSelect: () => {
        onNavigate('network_modules');
        onClose();
      },
    }));

    const screenRows: PaletteRow[] = [
      { id: 'nav-overview', group: 'Screens', title: 'Overview Dashboard', subtitle: 'Active telemetry & timeline', badge: 'View', icon: LayoutDashboard, onSelect: () => { onNavigate('overview'); onClose(); } },
      { id: 'nav-explorer', group: 'Screens', title: 'Behavior Explorer', subtitle: 'Interactive process & edge replay graph', badge: 'View', icon: GitFork, onSelect: () => { onNavigate('behavior_explorer'); onClose(); } },
      { id: 'nav-apps', group: 'Screens', title: 'Applications', subtitle: 'Full searchable process inventory', badge: 'View', icon: AppWindow, onSelect: () => { onNavigate('applications'); onClose(); } },
      { id: 'nav-net', group: 'Screens', title: 'Network & Modules', subtitle: 'Sockets, domains, and loaded DLLs', badge: 'View', icon: Network, onSelect: () => { onNavigate('network_modules'); onClose(); } },
      { id: 'nav-det', group: 'Screens', title: 'Detections, Event Stream & Exports', subtitle: 'Declarative rules & sanitized reports', badge: 'View', icon: ShieldAlert, onSelect: () => { onNavigate('detections_logs'); onClose(); } },
      { id: 'nav-settings', group: 'Screens', title: 'Settings', subtitle: 'Monitoring scope, retention & motion tier', badge: 'View', icon: Settings, onSelect: () => { onNavigate('settings'); onClose(); } },
      { id: 'nav-status', group: 'Screens', title: 'System Status & Diagnostics', subtitle: 'Collector capability matrix & SQLite WAL', badge: 'View', icon: HeartPulse, onSelect: () => { onNavigate('system_status'); onClose(); } },
    ];

    const actionRows: PaletteRow[] = [
      { id: 'act-toggle-mode', group: 'Quick Actions', title: 'Toggle Live Local / Demo Fixture', subtitle: 'Switch atmospheric mode with strict isolation', badge: 'Action', icon: Sparkles, onSelect: () => { onExecuteAction('toggle_data_source_mode'); onClose(); } },
      { id: 'act-export', group: 'Quick Actions', title: 'Export Sanitized Markdown Report', subtitle: 'Redacts paths & tokens to local disk', badge: 'Ctrl+E', icon: Download, onSelect: () => { onExecuteAction('export_sanitized_markdown'); onClose(); } },
      { id: 'act-mon', group: 'Quick Actions', title: 'Pause / Resume Local Monitoring', subtitle: 'Explicitly toggle collector state', badge: 'Action', icon: Play, onSelect: () => { onExecuteAction('toggle_monitoring'); onClose(); } },
      { id: 'act-tour', group: 'Quick Actions', title: 'Replay Welcome Tour', subtitle: 'Launch Mindly-inspired 5-step setup wizard', badge: 'Action', icon: RotateCcw, onSelect: () => { onExecuteAction('replay_welcome_tour'); onClose(); } },
    ];

    return [...procRows, ...netRows, ...screenRows, ...actionRows];
  }, [processes, connections, onInspectProcess, onNavigate, onExecuteAction, onClose]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRows.slice(0, 12);
    return allRows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q),
    );
  }, [allRows, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredRows.length ? (prev + 1) % filteredRows.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredRows.length ? (prev - 1 + filteredRows.length) % filteredRows.length : 0,
      );
    } else if (e.key === 'Enter' && filteredRows[selectedIndex]) {
      e.preventDefault();
      filteredRows[selectedIndex].onSelect();
    }
  };

  const duration = resolveDurationSec('ANIM-05', motionTier);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTier === 'off' ? 0.06 : 0.12 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(5, 5, 5, 0.56)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '14vh',
          }}
        >
          <motion.div
            key="palette-card"
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            initial={motionTier === 'off' ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={motionTier === 'off' ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration, ease: EASINGS.fluidOut }}
            className={isFirstSummon && motionTier !== 'off' ? 'sw-rim-sweep-once' : ''}
            style={{
              width: 620,
              maxWidth: 'calc(100vw - 48px)',
              maxHeight: 440,
              background: 'var(--sw-glass)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 14,
              border: '1px solid rgba(203, 166, 197, 0.32)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Search size={16} color="#CBA6C5" strokeWidth={1.7} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search processes, remote IPs, views, or allowlisted commands..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F5F3F5', fontSize: 13.5, fontFamily: 'var(--font-sans)' }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  style={{ border: 'none', background: '#262026', color: '#A8A2A8', borderRadius: 6, fontSize: 11, padding: '2px 7px' }}
                >
                  Clear
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {filteredRows.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: '#847C84', fontSize: 13 }}>
                  No matching processes, endpoints, or allowlisted actions for &ldquo;{query}&rdquo;.
                </div>
              ) : (
                filteredRows.map((row, idx) => {
                  const Icon = row.icon;
                  const active = idx === selectedIndex;
                  const showGroupHeader = idx === 0 || filteredRows[idx - 1].group !== row.group;
                  return (
                    <React.Fragment key={row.id}>
                      {showGroupHeader && (
                        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: '#847C84', textTransform: 'uppercase', padding: idx === 0 ? '4px 10px 4px' : '10px 10px 4px' }}>
                          {row.group}
                        </div>
                      )}
                      <button
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={row.onSelect}
                        style={{
                          width: '100%',
                          height: 38,
                          padding: '0 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: active ? '#2B232A' : 'transparent',
                          color: active ? '#F5F3F5' : '#A8A2A8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <Icon size={15} strokeWidth={1.6} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#F5F3F5', whiteSpace: 'nowrap' }}>{row.title}</span>
                          <span className="mono" style={{ fontSize: 11.5, color: '#847C84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.subtitle}
                          </span>
                        </span>
                        <span className="mono" style={{ fontSize: 10.5, color: active ? '#CBA6C5' : '#847C84', flexShrink: 0 }}>
                          {row.badge}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            <div style={{ height: 36, padding: '0 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(10, 10, 10, 0.72)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#847C84' }}>
              <span>Allowlisted local actions only</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CornerDownLeft size={11} /> Open
                </span>
                <span>↑↓ Navigate</span>
                <span>Esc Close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
