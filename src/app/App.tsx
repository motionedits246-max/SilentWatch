import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Titlebar } from '@/components/Titlebar';
import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { LaunchIntro } from '@/components/LaunchIntro';
import { ReleaseShowcaseModal } from '@/components/ReleaseShowcaseModal';
import { OverviewScreen } from '@/screens/OverviewScreen';
import { BehaviorExplorerScreen } from '@/screens/BehaviorExplorerScreen';
import { ApplicationsScreen } from '@/screens/ApplicationsScreen';
import { NetworkModulesScreen } from '@/screens/NetworkModulesScreen';
import { DetectionsLogsScreen } from '@/screens/DetectionsLogsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SystemStatusScreen } from '@/screens/SystemStatusScreen';
import { effectiveMotionTier, resolveDurationSec } from '@/animations/motionTokens';
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
  UpdateCheckResult,
} from '@/types/telemetry';

interface PanelErrorBoundaryState {
  hasError: boolean;
}

class PanelErrorBoundary extends Component<
  { children: React.ReactNode; onReset: () => void },
  PanelErrorBoundaryState
> {
  state: PanelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PanelErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="sw-card"
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>
            View recovered safely
          </div>
          <button
            type="button"
            className="sw-cta-primary"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset();
            }}
          >
            Return to Overview
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSummonCount, setPaletteSummonCount] = useState(0);
  const [range, setRange] = useState('1H');
  const [selectedProcessKey, setSelectedProcessKey] = useState<string | undefined>(undefined);
  const [coldOpenOverview, setColdOpenOverview] = useState(true);
  const [trayToast, setTrayToast] = useState(false);

  // GitHub Releases Auto-Update state
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const pollingInFlight = useRef(false);

  // Live telemetry state
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
  const activeMode: DataSourceMode = 'live';

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

  const runUpdateCheck = useCallback(async () => {
    setCheckingUpdates(true);
    try {
      const res = await ipc.checkForUpdates();
      setUpdateInfo(res);
      if (res.update_available) {
        setShowReleaseModal(true);
      }
    } catch {
      // Offline or rate-limited: remain silent locally
    } finally {
      setCheckingUpdates(false);
    }
  }, []);

  // Direct-to-dashboard boot: signal window immediately so startup animation plays while data preloads in parallel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      void ipc.signalUiReady();
      try {
        const loaded = await ipc.getSettings();
        if (cancelled) return;
        setSettings({ ...loaded, data_source_mode: 'live' });
        await refreshData('live', '1H');
        if (!cancelled) setDataReady(true);

        const shouldShowVideo = await ipc.shouldShowReleaseVideo().catch(() => false);
        if (!cancelled && shouldShowVideo) {
          setShowReleaseModal(true);
        }
        if (!cancelled && loaded.auto_check_updates) {
          void runUpdateCheck();
        }
      } catch {
        if (!cancelled) setDataReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshData, runUpdateCheck]);

  // Active-screen-only 5-second live polling with overlap guard
  useEffect(() => {
    if (activeMode !== 'live' || showIntro || showReleaseModal) return;
    const id = window.setInterval(async () => {
      if (document.hidden || pollingInFlight.current) return;
      pollingInFlight.current = true;
      try {
        if (activeScreen === 'overview') {
          const ov = await ipc.getOverview(range, 'live');
          setOverview(ov);
        } else if (activeScreen === 'applications') {
          const procs = await ipc.getProcesses('live');
          setProcesses(procs);
        } else if (activeScreen === 'network_modules') {
          const [conns, mods] = await Promise.all([
            ipc.getNetworkConnections('live'),
            ipc.getModules('live', selectedProcessKey),
          ]);
          setConnections(conns);
          setModules(mods);
        } else if (activeScreen === 'system_status') {
          const st = await ipc.getSystemStatus('live');
          setSysStatus(st);
        }
      } catch {
        // Ignore transient poll errors
      } finally {
        pollingInFlight.current = false;
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [activeMode, activeScreen, range, selectedProcessKey, showIntro, showReleaseModal]);

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

  // Global keyboard shortcuts (Ctrl+K Command Palette)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => {
          if (!prev) setPaletteSummonCount((c) => c + 1);
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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

  const ruleMatchCount = rules.filter((r) => r.verdict === 'matched').length;

  return (
    <div className="sw-shell">
      {/* Every-Launch Intro Animation (max 5s, parallel telemetry preload) */}
      <AnimatePresence>
        {showIntro && (
          <LaunchIntro
            startupVideoUrl={updateInfo?.startup_video_url}
            dataReady={dataReady}
            onFinished={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>

      {/* What's New Showcase Video Modal (fresh install, reinstall, or new GitHub Release) */}
      {!showIntro && showReleaseModal && (
        <ReleaseShowcaseModal
          version={updateInfo?.current_version ?? '0.1.0'}
          updateInfo={updateInfo}
          checkingUpdates={checkingUpdates}
          onCheckUpdates={() => void runUpdateCheck()}
          onContinue={() => {
            setShowReleaseModal(false);
            void ipc.markReleaseVideoSeen().catch(() => undefined);
          }}
        />
      )}

      <Titlebar
        privilegeMode={settings?.privilege_mode ?? 'standard_per_user'}
        monitoringActive={overview?.monitoring_active ?? false}
        sidebarCollapsed={sidebarCollapsed}
        updateInfo={updateInfo}
        checkingUpdates={checkingUpdates}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        onOpenPalette={() => {
          setPaletteSummonCount((c) => c + 1);
          setPaletteOpen(true);
        }}
        onCheckAndOpenReleases={() => {
          setShowReleaseModal(true);
          void runUpdateCheck();
        }}
        onHideToTray={() => {
          setTrayToast(true);
          setTimeout(() => setTrayToast(false), 2600);
        }}
      />

      {/* Main Inset Workspace Frame */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          gap: 14,
          padding: '6px 14px 14px',
        }}
      >
        <Sidebar
          activeScreen={activeScreen}
          collapsed={sidebarCollapsed}
          motionTier={motionTier}
          ruleMatchCount={ruleMatchCount}
          onSelect={(scr) => {
            setColdOpenOverview(false);
            setActiveScreen(scr);
          }}
        />

        {/* Direct, crash-safe main workspace */}
        <main style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative' }}>
          <PanelErrorBoundary onReset={() => setActiveScreen('overview')}>
            <div style={{ width: '100%', height: '100%' }}>
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
                <ApplicationsScreen
                  processes={processes}
                  onInspectProcess={handleInspectProcess}
                />
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
                  updateInfo={updateInfo}
                  checkingUpdates={checkingUpdates}
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
                  onCheckUpdates={runUpdateCheck}
                  onOpenWhatsNew={() => setShowReleaseModal(true)}
                />
              )}

              {activeScreen === 'system_status' && <SystemStatusScreen status={sysStatus} />}
            </div>
          </PanelErrorBoundary>
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
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
          if (act === 'toggle_monitoring') {
            if (overview?.monitoring_active) await ipc.stopMonitoring();
            else await ipc.startMonitoring();
            await refreshData(activeMode, range, selectedProcessKey);
          } else if (act === 'export_sanitized_markdown') {
            await handleExport('markdown');
          } else if (act === 'replay_welcome_tour') {
            setShowReleaseModal(true);
          }
        }}
      />

      {/* Tray Hide Feedback Toast */}
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
              border: '1px solid #E879F9',
              borderRadius: 999,
              padding: '8px 16px',
              fontSize: 12,
              color: '#F8F7FA',
              zIndex: 95,
            }}
          >
            Window hidden to Windows System Tray — collectors continue running locally.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
