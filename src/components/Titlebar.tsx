import React from 'react';
import { motion } from 'motion/react';
import { Minus, Search, Square, X } from 'lucide-react';
import { SilentWatchMark } from '@/assets/VisualAssets';
import { SPRINGS } from '@/animations/motionTokens';
import type { DataSourceMode, MotionTier, PrivilegeMode } from '@/types/telemetry';
import { isTauriRuntime } from '@/state/ipcClient';

interface TitlebarProps {
  mode: DataSourceMode;
  privilegeMode: PrivilegeMode;
  monitoringActive: boolean;
  motionTier: MotionTier;
  onModeChange: (mode: DataSourceMode) => void;
  onOpenPalette: () => void;
  onHideToTray: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  mode,
  privilegeMode,
  monitoringActive,
  motionTier,
  onModeChange,
  onOpenPalette,
  onHideToTray,
}) => {
  const isDemo = mode === 'demo';
  const dotColor = isDemo ? '#89B4FA' : monitoringActive ? '#5ED18A' : '#847C84';

  const handleWindowAction = async (action: 'minimize' | 'maximize' | 'close') => {
    if (isTauriRuntime()) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      if (action === 'minimize') await win.minimize();
      if (action === 'maximize') await win.toggleMaximize();
      if (action === 'close') await win.close();
    } else if (action === 'close') {
      onHideToTray();
    }
  };

  return (
    <header
      data-tauri-drag-region
      style={{
        height: 42,
        minHeight: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px 0 16px',
        gap: 12,
        position: 'relative',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} data-tauri-drag-region>
        <SilentWatchMark size={18} variant="dark" />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.015em', color: '#F5F3F5' }}>
          SilentWatch
        </span>
        <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>|</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}80` }} />
          <span style={{ color: isDemo ? '#89B4FA' : '#E5CBE0', fontWeight: 500, letterSpacing: isDemo ? '0.03em' : '0' }}>
            {isDemo
              ? 'DEMO FIXTURE'
              : monitoringActive
                ? privilegeMode === 'enhanced_etw'
                  ? 'Live Local (Enhanced ETW)'
                  : 'Live Local (Standard Per-User)'
                : 'Monitoring Paused'}
          </span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          role="group"
          aria-label="Data source mode"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#0A0A0A',
            border: '1px solid var(--sw-border)',
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
                  color: active ? '#F5F3F5' : '#847C84',
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
                      background: opt === 'demo' ? 'rgba(137, 180, 250, 0.22)' : 'var(--sw-mauve-pill-bg)',
                      border: `1px solid ${opt === 'demo' ? '#89B4FA' : '#CBA6C5'}`,
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
            width: 248,
            height: 30,
            padding: '0 10px 0 12px',
            borderRadius: 999,
            background: '#0A0A0A',
            border: '1px solid var(--sw-border)',
            color: '#847C84',
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            transition: 'border-color 120ms ease-out',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Search size={13} strokeWidth={1.6} color="#847C84" />
            <span>Search processes, IPs...</span>
          </span>
          <kbd
            className="mono"
            style={{
              fontSize: 10,
              color: '#A8A2A8',
              background: '#161316',
              border: '1px solid #2A2529',
              borderRadius: 5,
              padding: '1px 5px',
            }}
          >
            Ctrl+K
          </kbd>
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
          <button
            type="button"
            title="Minimize"
            aria-label="Minimize window"
            onClick={() => handleWindowAction('minimize')}
            style={{ width: 36, height: 30, border: 'none', borderRadius: 6, background: 'transparent', color: '#A8A2A8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Minus size={13} strokeWidth={1.6} />
          </button>
          <button
            type="button"
            title="Maximize"
            aria-label="Maximize window"
            onClick={() => handleWindowAction('maximize')}
            style={{ width: 36, height: 30, border: 'none', borderRadius: 6, background: 'transparent', color: '#A8A2A8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Square size={11} strokeWidth={1.6} />
          </button>
          <button
            type="button"
            title="Hide to System Tray"
            aria-label="Hide to system tray"
            onClick={() => handleWindowAction('close')}
            style={{ width: 36, height: 30, border: 'none', borderRadius: 6, background: 'transparent', color: '#A8A2A8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </header>
  );
};
