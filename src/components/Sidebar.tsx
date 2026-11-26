import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import {
  AppWindow,
  GitFork,
  HeartPulse,
  LayoutDashboard,
  Network,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { SilentWatchMark } from '@/assets/VisualAssets';
import { SPRINGS } from '@/animations/motionTokens';
import type { MotionTier, ScreenId } from '@/types/telemetry';

interface SidebarProps {
  activeScreen: ScreenId;
  collapsed: boolean;
  motionTier: MotionTier;
  ruleMatchCount: number;
  onSelect: (screen: ScreenId) => void;
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
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        style={{
          position: 'relative',
          width: collapsed ? 44 : '100%',
          height: collapsed ? 44 : 40,
          margin: collapsed ? '0 auto' : 0,
          padding: collapsed ? 0 : '0 14px',
          border: 'none',
          borderRadius: collapsed ? 999 : 14,
          background: 'transparent',
          color: isActive ? '#FFFFFF' : '#9E98A4',
          fontSize: 13,
          fontWeight: isActive ? 500 : 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
          transition: 'color 140ms ease-out',
        }}
      >
        {isActive && (
          <motion.span
            layoutId="sidebar-edge-glow"
            transition={motionTier === 'off' ? { duration: 0 } : SPRINGS.pillGlide}
            style={{
              position: 'absolute',
              left: collapsed ? -7 : -11,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: 18,
              borderRadius: 999,
              background: '#E879F9',
              boxShadow: '0 0 12px #E879F9, 0 0 22px rgba(217, 70, 239, 0.7)',
            }}
          />
        )}

        {isActive && (
          <motion.span
            layoutId="sidebar-active-pill"
            transition={motionTier === 'off' ? { duration: 0 } : SPRINGS.pillGlide}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: collapsed ? 999 : 14,
              background: collapsed
                ? 'radial-gradient(circle at 30% 30%, rgba(232, 121, 249, 0.38) 0%, rgba(168, 85, 247, 0.16) 65%, rgba(20, 16, 26, 0.85) 100%)'
                : 'linear-gradient(90deg, rgba(217, 70, 239, 0.28) 0%, rgba(168, 85, 247, 0.12) 48%, rgba(255, 255, 255, 0.03) 100%)',
              border: '1px solid rgba(232, 121, 249, 0.42)',
              boxShadow: '0 0 20px rgba(217, 70, 239, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
              zIndex: 0,
            }}
          />
        )}

        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 11,
            minWidth: 0,
          }}
        >
          <Icon
            size={collapsed ? 18 : 16}
            strokeWidth={isActive ? 1.9 : 1.55}
            color={isActive ? '#FAF5FF' : '#9E98A4'}
          />
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
              color: '#F5D0FE',
              background: 'rgba(217, 70, 239, 0.2)',
              border: '1px solid rgba(232, 121, 249, 0.35)',
              borderRadius: 999,
              padding: '1px 7px',
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
      style={{
        width: collapsed ? 62 : 224,
        minWidth: collapsed ? 62 : 224,
        height: '100%',
        padding: collapsed ? '18px 8px' : '16px 12px',
        borderRadius: collapsed ? 999 : 22,
        background:
          'linear-gradient(180deg, rgba(22, 19, 28, 0.82) 0%, rgba(11, 10, 15, 0.92) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow:
          '0 18px 44px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        transition:
          motionTier === 'off'
            ? 'none'
            : 'width 200ms cubic-bezier(0.16, 1, 0.3, 1), min-width 200ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {collapsed ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <SilentWatchMark size={22} variant="dark" />
          </div>
        ) : (
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#7E7886',
              padding: '2px 12px 10px',
              textTransform: 'uppercase',
            }}
          >
            Monitor
          </div>
        )}
        {PRIMARY_ITEMS.map(renderNavItem)}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          paddingTop: 12,
        }}
      >
        {UTILITY_ITEMS.map(renderNavItem)}
      </div>
    </aside>
  );
};
