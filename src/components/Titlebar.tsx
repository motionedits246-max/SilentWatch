import React from 'react';
import { motion } from 'motion/react';
import { Minus, PanelLeft, Search, Sparkles, Square, X } from 'lucide-react';
import { SilentWatchMark } from '@/assets/VisualAssets';
import { SPRINGS } from '@/animations/motionTokens';
import type { DataSourceMode, MotionTier, PrivilegeMode, UpdateCheckResult } from '@/types/telemetry';
import { ipc, isTauriRuntime } from '@/state/ipcClient';

interface TitlebarProps {
  mode: DataSourceMode;
  privilegeMode: PrivilegeMode;
  monitoringActive: boolean;
  motionTier: MotionTier;
  sidebarCollapsed: boolean;
  updateInfo: UpdateCheckResult | null;
  onModeChange: (mode: DataSourceMode) => void;
  onToggleSidebar: () => void;
  onOpenPalette: () => void;
  onOpenUpdateModal: () => void;
  onHideToTray: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  mode,
  privilegeMode,
  monitoringActive,
  motionTier,
  sidebarCollapsed,
  updateInfo,
  onModeChange,
  onToggleSidebar,
  onOpenPalette,
  onOpenUpdateModal,
  onHideToTray,
}) => {
  const isDemo = mode === 'demo';
  const dotColor = isDemo ? '#60A5FA' : monitoringActive ? '#5ED18A' : '#847C84';

  const handleWindowAction = async (action: 'minimize' | 'maximize' | 'close') => {
    if (action === 'minimize') {
      await ipc.windowMinimize().catch(() => undefined);
    } else if (action === 'maximize') {
      await ipc.windowToggleMaximize().catch(() => undefined);
    } else if (action === 'close') {
      if (isTauriRuntime()) {
        await ipc.windowCloseToTray().catch(() => undefined);
      } else {
        onHideToTray();
      }
    }
  };

  return (
    <header
      data-tauri-drag-region
      onDoubleClick={() => void handleWindowAction('maximize')}
      style={{
        height: 46,
        minHeight: 46,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px 0 14px',
        gap: 12,
        position: 'relative',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} data-tauri-drag-region>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: sidebarCollapsed ? 'rgba(217, 70, 239, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            color: sidebarCollapsed ? '#F5D0FE' : '#B4AEB8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 140ms ease, color 140ms ease',
          }}
        >
          <PanelLeft size={15} strokeWidth={1.65} />
        </button>

        <SilentWatchMark size={19} variant="dark" />
        <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.02em', color: '#F8F7FA' }}>
          SilentWatch
        </span>
        <span style={{ color: 'rgba(255,255,255,0.16)', fontSize: 12 }}>|</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: dotColor,
              boxShadow: `0 0 9px ${dotColor}`,
            }}
          />
          <span
            style={{
              color: isDemo ? '#93C5FD' : '#E5D9EC',
              fontWeight: 500,
              letterSpacing: isDemo ? '0.03em' : '-0.01em',
            }}
          >
            {isDemo
              ? 'DEMO FIXTURE'
              : monitoringActive
                ? privilegeMode === 'enhanced_etw'
                  ? 'Live Local • Enhanced ETW'
                  : 'Live Local • Background Active'
                : 'Monitoring Paused'}
          </span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {updateInfo?.update_available && (
          <button
            type="button"
            onClick={onOpenUpdateModal}
            style={{
              height: 28,
              padding: '0 11px',
              borderRadius: 999,
              border: '1px solid rgba(232, 121, 249, 0.5)',
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.28), rgba(147, 51, 234, 0.24))',
              color: '#FAF5FF',
              fontSize: 11.5,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={12} color="#F0ABFC" />
            <span>Update v{updateInfo.latest_version}</span>
          </button>
        )}

        <div
          role="group"
          aria-label="Data source mode"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(14, 12, 18, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 999,
            padding: 2,
            height: 30,
          }}
        >
          {(['live', 'demo'] as const).map((opt) => {
            const active = mode === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onModeChange(opt)}
                style={{
                  position: 'relative',
                  height: 24,
                  padding: '0 11px',
                  border: 'none',
                  background: 'transparent',
                  color: active ? '#FFFFFF' : '#8E8894',
                  fontSize: 11.5,
                  fontWeight: active ? 500 : 400,
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {active && (
                  <motion.span
                    layoutId="titlebar-mode-pill"
                    transition={motionTier === 'off' ? { duration: 0 } : SPRINGS.pillGlide}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 999,
                      background:
                        opt === 'demo'
                          ? 'rgba(96, 165, 250, 0.22)'
                          : 'rgba(217, 70, 239, 0.24)',
                      border: `1px solid ${opt === 'demo' ? '#60A5FA' : '#E879F9'}`,
                      zIndex: 0,
                    }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {opt === 'live' ? 'Live Local' : 'Demo Fixture'}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Open Command Palette (Ctrl+K)"
          style={{
            width: 232,
            height: 30,
            padding: '0 10px 0 12px',
            borderRadius: 999,
            background: 'rgba(14, 12, 18, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#8E8894',
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Search size={13} strokeWidth={1.6} color="#8E8894" />
            <span>Search processes, IPs...</span>
          </span>
          <kbd
            className="mono"
            style={{
              fontSize: 10,
              color: '#B4AEB8',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 5,
              padding: '1px 5px',
            }}
          >
            Ctrl+K
          </kbd>
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 2 }}>
          <button
            type="button"
            title="Minimize"
            aria-label="Minimize window"
            onClick={() => void handleWindowAction('minimize')}
            style={{
              width: 34,
              height: 28,
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              color: '#B4AEB8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Minus size={13} strokeWidth={1.7} />
          </button>
          <button
            type="button"
            title="Maximize / Full Screen"
            aria-label="Maximize window"
            onClick={() => void handleWindowAction('maximize')}
            style={{
              width: 34,
              height: 28,
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              color: '#B4AEB8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Square size={11} strokeWidth={1.7} />
          </button>
          <button
            type="button"
            title="Hide to System Tray"
            aria-label="Hide to system tray"
            onClick={() => void handleWindowAction('close')}
            style={{
              width: 34,
              height: 28,
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              color: '#B4AEB8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} strokeWidth={1.7} />
          </button>
        </div>
      </div>
    </header>
  );
};
