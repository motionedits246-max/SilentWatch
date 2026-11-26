import React from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AppWindow,
  GitFork,
  HeartPulse,
  LayoutDashboard,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { SPRINGS } from '@/animations/motionTokens';
import type { MotionTier, ScreenId } from '@/types/telemetry';

interface SidebarProps {
  activeScreen: ScreenId;
  collapsed: boolean;
  motionTier: MotionTier;
  ruleMatchCount: number;
  onSelect: (screen: ScreenId) => void;
  onToggleCollapse: () => void;
}

const PRIMARY_ITEMS: Array<{ id: ScreenId; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'behavior_explorer', label: 'Behavior Explorer', icon: GitFork },
  { id: 'applications', label: 'Applications', icon: AppWindow },
  { id: 'network_modules', label: 'Network & Modules', icon: Network },
  { id: 'detections_logs', label: 'Detections & Logs', icon: ShieldAlert },
];

const UTILITY_ITEMS: Array<{ id: ScreenId; label: string; icon: LucideIcon }> = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'system_status', label: 'System Status', icon: HeartPulse },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  collapsed,
  motionTier,
  ruleMatchCount,
  onSelect,
  onToggleCollapse,
}) => {
  const renderNavItem = (item: (typeof PRIMARY_ITEMS)[number]) => {
    const Icon = item.icon;
    const isActive = activeScreen === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect(item.id)}
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
        style={{
          position: 'relative',
          width: '100%',
          height: 38,
          padding: '0 12px',
          border: 'none',
          borderRadius: 10,
          background: 'transparent',
          color: isActive ? '#FFFFFF' : '#A8A2A8',
          fontSize: 13,
          fontWeight: isActive ? 500 : 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
          transition: 'color 120ms ease-out',
        }}
      >
        {isActive && (
          <motion.span
            layoutId="sidebar-active-pill"
            transition={motionTier === 'off' ? { duration: 0 } : SPRINGS.pillGlide}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 10,
              background:
                'linear-gradient(90deg, rgba(141, 122, 140, 0.42) 0%, rgba(141, 122, 140, 0.14) 72%, rgba(141, 122, 140, 0.02) 100%)',
              border: '1px solid rgba(203, 166, 197, 0.34)',
              zIndex: 0,
            }}
          />
        )}
        <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Icon size={16} strokeWidth={1.6} />
          {!collapsed && (
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.label}
            </span>
          )}
        </span>
        {!collapsed && item.id === 'detections_logs' && ruleMatchCount > 0 && (
          <span
            className="mono"
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 10.5,
              color: '#E06C75',
              background: 'rgba(224, 108, 117, 0.14)',
              border: '1px solid rgba(224, 108, 117, 0.32)',
              borderRadius: 999,
              padding: '1px 6px',
            }}
          >
            {ruleMatchCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      aria-label="Primary navigation"
      className="sw-card"
      style={{
        width: collapsed ? 64 : 224,
        minWidth: collapsed ? 64 : 224,
        height: '100%',
        padding: collapsed ? '14px 8px' : '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: motionTier === 'off' ? 'none' : 'width 180ms cubic-bezier(0.16, 1, 0.3, 1), min-width 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!collapsed && (
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: '#847C84',
              padding: '2px 10px 8px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Workspace</span>
            <Activity size={12} color="#CBA6C5" />
          </div>
        )}
        {PRIMARY_ITEMS.map(renderNavItem)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid #1E1A1E', paddingTop: 10 }}>
        {UTILITY_ITEMS.map(renderNavItem)}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            marginTop: 4,
            height: 32,
            borderRadius: 8,
            border: '1px solid transparent',
            background: 'transparent',
            color: '#847C84',
            fontSize: 11.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            padding: collapsed ? 0 : '0 12px',
          }}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          {!collapsed && <span>Collapse rail</span>}
        </button>
      </div>
    </aside>
  );
};
