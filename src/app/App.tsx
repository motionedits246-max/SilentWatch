import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Titlebar } from '@/components/Titlebar';
import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { SilentWatchMark } from '@/assets/VisualAssets';
import { OnboardingWizard } from '@/screens/OnboardingWizard';
import { OverviewScreen } from '@/screens/OverviewScreen';
import { BehaviorExplorerScreen } from '@/screens/BehaviorExplorerScreen';
import { ApplicationsScreen } from '@/screens/ApplicationsScreen';
import { NetworkModulesScreen } from '@/screens/NetworkModulesScreen';
import { DetectionsLogsScreen } from '@/screens/DetectionsLogsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SystemStatusScreen } from '@/screens/SystemStatusScreen';
import { EASINGS, effectiveMotionTier, resolveDurationSec } from '@/animations/motionTokens';
import { ipc } from '@/state/ipcClient';
import type {
  AllowlistEntry,
  AppSettings,
  BehaviorGraph,
  DataSourceMode,
  ExportFormat,
  ModuleRecord,
  NetworkConnectionRecord,
  OverviewSnapshot,
  ProcessSummary,
  RuleMatchRecord,
  ScreenId,
  SystemStatusSnapshot,
  TelemetryEvent,
} from '@/types/telemetry';

export const App: React.FC = () => {
  const [bootPhase, setBootPhase] = useState<'loading' | 'onboarding' | 'ready'>('loading');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSummonCount, setPaletteSummonCount] = useState(0);
  const [range, setRange] = useState('1H');
  const [selectedProcessKey, setSelectedProcessKey] = useState<string | undefined>(undefined);
  const [coldOpenOverview, setColdOpenOverview] = useState(true);
  const [trayToast, setTrayToast] = useState(false);

  const [overview, setOverview] = useState<OverviewSnapshot | null>(null);
  const [processes, setProcesses] = useState<ProcessSummary[]>([]);
  const [connections, setConnections] = useState<NetworkConnectionRecord[]>([]);
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [graph, setGraph] = useState<BehaviorGraph | null>(null);
  const [rules, setRules] = useState<RuleMatchRecord[]>([]);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [sysStatus, setSysStatus] = useState<SystemStatusSnapshot | null>(null);

  const motionTier = effectiveMotionTier(settings?.motion_tier ?? 'full');
  const activeMode: DataSourceMode = settings?.data_source_mode ?? 'live';

  const refreshData = useCallback(
    async (mode: DataSourceMode, activeRange: string, procKey?: string) => {
      const [ov, procs, conns, mods, gr, rls, evts, allow, st] = await Promise.all([
        ipc.getOverview(activeRange, mode),
        ipc.getProcesses(mode),
        ipc.getNetworkConnections(mode),
        ipc.getModules(mode, procKey),
        ipc.getBehaviorGraph(mode, procKey).catch(() => null),
        ipc.getRuleMatches(mode),
        ipc.getEvents(mode),
        ipc.listAllowlist(),
        ipc.getSystemStatus(mode),
      ]);
      setOverview(ov);
      setProcesses(procs);
      setConnections(conns);
      setModules(mods);
      setGraph(gr);
      setRules(rls);
      setEvents(evts);
      setAllowlist(allow);
      setSysStatus(st);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await ipc.getSettings();
      if (cancelled) return;
      setSettings(loaded);
      await ipc.signalUiReady();
      if (!loaded.onboarding_completed) {
        setBootPhase('onboarding');
      } else {
        await refreshData(loaded.data_source_mode, '1H');
        if (!cancelled) setBootPhase('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshData]);

  useEffect(() => {
    document.documentElement.setAttribute('data-motion', motionTier);
  }, [motionTier]);

  useEffect(() => {
    const onVis = () => {
      document.documentElement.setAttribute('data-page-hidden', document.hidden ? 'true' : 'false');
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1180) setSidebarCollapsed(true);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (bootPhase === 'ready') {
          setPaletteOpen((prev) => {
            if (!prev) setPaletteSummonCount((c) => c + 1);
            return !prev;
          });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bootPhase]);

  const handleCompleteOnboarding = async (finalSettings: AppSettings, startDemo: boolean) => {
    const saved = await ipc.saveSettings(finalSettings);
    setSettings(saved);
    if (!startDemo) {
      await ipc.startMonitoring();
    }
    await refreshData(saved.data_source_mode, range);
    setColdOpenOverview(true);
    setBootPhase('ready');
  };

  const handleModeChange = async (mode: DataSourceMode) => {
    if (!settings || settings.data_source_mode === mode) return;
    const saved = await ipc.saveSettings({ ...settings, data_source_mode: mode });
    setSettings(saved);
    await refreshData(mode, range, selectedProcessKey);
  };

  const handleRangeChange = async (nextRange: string) => {
    setRange(nextRange);
    const ov = await ipc.getOverview(nextRange, activeMode);
    setOverview(ov);
  };

  const handleInspectProcess = async (stableKey: string) => {
    setSelectedProcessKey(stableKey);
    setColdOpenOverview(false);
    setActiveScreen('behavior_explorer');
    const gr = await ipc.getBehaviorGraph(activeMode, stableKey).catch(() => null);
    setGraph(gr);
  };

  const handleSaveSettings = async (next: AppSettings) => {
    const saved = await ipc.saveSettings(next);
    setSettings(saved);
    await refreshData(saved.data_source_mode, range, selectedProcessKey);
  };

  const handleExport = async (format: ExportFormat, targetKey: string | null = null) => {
    return ipc.exportReport({
      format,
      mode: activeMode,
      include_processes: true,
      include_network: true,
      include_rules: true,
      target_process_key: targetKey,
    });
  };

  if (bootPhase === 'loading') {
    return (
      <div style={{ width: '100%', height: '100%', background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <motion.div initial={{ scale: 1.15, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.34, ease: EASINGS.signatureInOut }}>
          <SilentWatchMark size={42} variant="dark" />
        </motion.div>
        <span className="mono" style={{ fontSize: 11.5, color: '#847C84' }}>
          Connecting local telemetry engine...
        </span>
      </div>
    );
  }

  if (bootPhase === 'onboarding' && settings) {
    return <OnboardingWizard initialSettings={settings} onComplete={handleCompleteOnboarding} />;
  }

  const ruleMatchCount = rules.filter((r) => r.verdict === 'matched').length;

  return (
    <div className={`sw-shell ${activeMode === 'demo' ? 'is-demo' : ''}`}>
      <Titlebar
        mode={activeMode}
        privilegeMode={settings?.privilege_mode ?? 'standard_per_user'}
        monitoringActive={overview?.monitoring_active ?? false}
        motionTier={motionTier}
        onModeChange={handleModeChange}
        onOpenPalette={() => {
          setPaletteSummonCount((c) => c + 1);
          setPaletteOpen(true);
        }}
        onHideToTray={() => {
          setTrayToast(true);
          setTimeout(() => setTrayToast(false), 2600);
        }}
      />

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12, padding: '6px 12px 12px' }}>
        <Sidebar
          activeScreen={activeScreen}
          collapsed={sidebarCollapsed}
          motionTier={motionTier}
          ruleMatchCount={ruleMatchCount}
          onSelect={(scr) => {
            setColdOpenOverview(false);
            setActiveScreen(scr);
          }}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />

        <main style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeScreen}
              initial={motionTier === 'off' ? { opacity: 0 } : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={motionTier === 'off' ? { opacity: 0 } : { opacity: 0, x: -6 }}
              transition={{ duration: resolveDurationSec('ANIM-06', motionTier), ease: EASINGS.fluidOut }}
              style={{ width: '100%', height: '100%' }}
            >
              {activeScreen === 'overview' && (
                <OverviewScreen
                  snapshot={overview}
                  range={range}
                  motionTier={motionTier}
                  coldOpen={coldOpenOverview}
                  onRangeChange={handleRangeChange}
                  onInspectProcess={handleInspectProcess}
                  onNavigate={(scr) => {
                    setColdOpenOverview(false);
                    setActiveScreen(scr);
                  }}
                  onResumeMonitoring={async () => {
                    await ipc.startMonitoring();
                    await refreshData(activeMode, range, selectedProcessKey);
                  }}
                />
              )}

              {activeScreen === 'behavior_explorer' && (
                <BehaviorExplorerScreen
                  graph={graph}
                  processes={processes}
                  motionTier={motionTier}
                  onBack={() => setActiveScreen('overview')}
                  onSelectProcess={handleInspectProcess}
                  onAllowlistProcess={async (exeName) => {
                    await ipc.addAllowlist('exe_name', exeName, 'Allowlisted from Behavior Explorer');
                    await refreshData(activeMode, range, selectedProcessKey);
                  }}
                  onExportIncident={(targetKey) => handleExport('markdown', targetKey)}
                />
              )}

              {activeScreen === 'applications' && (
                <ApplicationsScreen processes={processes} onInspectProcess={handleInspectProcess} />
              )}

              {activeScreen === 'network_modules' && (
                <NetworkModulesScreen
                  connections={connections}
                  modules={modules}
                  privilegeMode={settings?.privilege_mode ?? 'standard_per_user'}
                  motionTier={motionTier}
                  onInspectProcess={handleInspectProcess}
                />
              )}

              {activeScreen === 'detections_logs' && (
                <DetectionsLogsScreen
                  mode={activeMode}
                  rules={rules}
                  events={events}
                  allowlist={allowlist}
                  motionTier={motionTier}
                  onAddAllowlist={async (value, reason) => {
                    await ipc.addAllowlist('exe_name', value, reason);
                    await refreshData(activeMode, range, selectedProcessKey);
                  }}
                  onRemoveAllowlist={async (id) => {
                    await ipc.removeAllowlist(id);
                    await refreshData(activeMode, range, selectedProcessKey);
                  }}
                  onExport={(fmt) => handleExport(fmt)}
                />
              )}

              {activeScreen === 'settings' && settings && (
                <SettingsScreen
                  settings={settings}
                  monitoringActive={overview?.monitoring_active ?? false}
                  onSave={handleSaveSettings}
                  onClearHistory={async () => {
                    await ipc.clearLocalHistory();
                    await refreshData(activeMode, range, selectedProcessKey);
                  }}
                  onStopMonitoring={async () => {
                    await ipc.stopMonitoring();
                    await refreshData(activeMode, range, selectedProcessKey);
                  }}
                  onStartMonitoring={async () => {
                    await ipc.startMonitoring();
                    await refreshData(activeMode, range, selectedProcessKey);
                  }}
                  onQuitApp={async () => {
                    await ipc.quitApplication();
                  }}
                  onReplayOnboarding={() => setBootPhase('onboarding')}
                />
              )}

              {activeScreen === 'system_status' && <SystemStatusScreen status={sysStatus} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        motionTier={motionTier}
        processes={processes}
        connections={connections}
        isFirstSummon={paletteSummonCount <= 1}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(scr) => {
          setColdOpenOverview(false);
          setActiveScreen(scr);
        }}
        onInspectProcess={handleInspectProcess}
        onExecuteAction={async (act) => {
          if (act === 'toggle_data_source_mode') {
            await handleModeChange(activeMode === 'live' ? 'demo' : 'live');
          } else if (act === 'toggle_monitoring') {
            if (overview?.monitoring_active) await ipc.stopMonitoring();
            else await ipc.startMonitoring();
            await refreshData(activeMode, range, selectedProcessKey);
          } else if (act === 'export_sanitized_markdown') {
            await handleExport('markdown');
          } else if (act === 'replay_welcome_tour') {
            setBootPhase('onboarding');
          }
        }}
      />

      <AnimatePresence>
        {trayToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.985, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 6 }}
            transition={{ duration: resolveDurationSec('ANIM-01', motionTier) }}
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--sw-glass)',
              border: '1px solid #CBA6C5',
              borderRadius: 999,
              padding: '8px 16px',
              fontSize: 12,
              color: '#F5F3F5',
              zIndex: 95,
            }}
          >
            Window hides to Windows System Tray — collectors continue running locally.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
