import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Maximize2,
  Pause,
  Play,
  ShieldCheck,
  SkipBack,
  SkipForward,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ExportActionButton } from '@/components/ExportActionButton';
import { EASINGS, resolveDurationSec } from '@/animations/motionTokens';
import type { BehaviorGraph, BehaviorNode, MotionTier, ProcessSummary } from '@/types/telemetry';
import { formatStableKey } from '@/types/telemetry';

interface BehaviorExplorerScreenProps {
  graph: BehaviorGraph | null;
  processes: ProcessSummary[];
  motionTier: MotionTier;
  onBack: () => void;
  onSelectProcess: (stableKey: string) => void;
  onAllowlistProcess: (exeName: string) => Promise<void>;
  onExportIncident: (targetKey: string) => Promise<{ filename: string; saved_path: string | null }>;
}

type CategoryFilter = 'all' | 'process' | 'network' | 'module' | 'rule';

export const BehaviorExplorerScreen: React.FC<BehaviorExplorerScreenProps> = ({
  graph,
  processes,
  motionTier,
  onBack,
  onSelectProcess,
  onAllowlistProcess,
  onExportIncident,
}) => {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showInferred, setShowInferred] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-pwsh');
  const [dllExpanded, setDllExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [playheadPct, setPlayheadPct] = useState(100);
  const [copiedJson, setCopiedJson] = useState(false);
  const [allowlistedDone, setAllowlistedDone] = useState(false);

  const startMs = graph?.timeline_start_ms ?? 0;
  const endMs = graph?.timeline_end_ms ?? 1000;
  const spanMs = Math.max(endMs - startMs, 100);
  const currentTsMs = startMs + (playheadPct / 100) * spanMs;

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setPlayheadPct((prev) => {
        const next = prev + 1.4 * speed;
        if (next >= 100) {
          setPlaying(false);
          return 100;
        }
        return next;
      });
    }, 45);
    return () => window.clearInterval(interval);
  }, [playing, speed]);

  const visibleNodes = useMemo(() => {
    if (!graph) return [];
    return graph.nodes.filter((n) => {
      if (!showInferred && n.classification === 'inferred') return false;
      if (filter === 'all') return true;
      if (n.id === 'node-root') return true;
      if (filter === 'process') return n.kind === 'process';
      if (filter === 'network') return n.kind === 'network_endpoint';
      if (filter === 'module') return n.kind === 'dll_cluster';
      if (filter === 'rule') return n.kind === 'rule_match';
      return true;
    });
  }, [graph, filter, showInferred]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    if (!graph) return [];
    return graph.edges.filter(
      (e) =>
        visibleNodeIds.has(e.source) &&
        visibleNodeIds.has(e.target) &&
        (showInferred || e.classification !== 'inferred'),
    );
  }, [graph, visibleNodeIds, showInferred]);

  const selectedNode: BehaviorNode | null =
    graph?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const sortedEventTimestamps = useMemo(() => {
    if (!graph) return [];
    return Array.from(new Set(graph.nodes.map((n) => n.timestamp_ms))).sort((a, b) => a - b);
  }, [graph]);

  const stepEvent = (dir: -1 | 1) => {
    setPlaying(false);
    if (!sortedEventTimestamps.length) return;
    const currentIdx = sortedEventTimestamps.findIndex((ts) => ts >= currentTsMs - 5);
    const nextIdx = Math.min(
      sortedEventTimestamps.length - 1,
      Math.max(0, (currentIdx === -1 ? sortedEventTimestamps.length - 1 : currentIdx) + dir),
    );
    const targetPct = ((sortedEventTimestamps[nextIdx] - startMs) / spanMs) * 100;
    setPlayheadPct(Math.max(0, Math.min(100, targetPct)));
  };

  const formatTimestamp = (ms: number) => new Date(ms).toISOString().slice(11, 23);

  if (!graph) {
    return (
      <div className="sw-card" style={{ height: '100%', padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Select a process to explore</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {processes.slice(0, 6).map((p) => (
            <button
              key={formatStableKey(p.instance_id)}
              type="button"
              className="sw-cta-secondary"
              onClick={() => onSelectProcess(formatStableKey(p.instance_id))}
            >
              {p.exe_name} (PID {p.instance_id.pid})
            </button>
          ))}
        </div>
      </div>
    );
  }

  const getNodeCenter = (node: BehaviorNode) => {
    const w = node.kind === 'network_endpoint' ? 210 : node.kind === 'dll_cluster' ? 228 : 204;
    const h = node.kind === 'network_endpoint' ? 52 : 70;
    return { rightX: node.x + w, leftX: node.x, midY: node.y + h / 2 };
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="sw-card" style={{ height: 52, minHeight: 52, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #2A2529', background: '#141115', color: '#F5F3F5', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <ArrowLeft size={13} /> Overview
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#F5F3F5' }}>{graph.root_process.exe_name}</span>
          <span className="mono" style={{ fontSize: 11.5, color: '#847C84' }}>
            PID {graph.root_process.instance_id.pid} ({graph.root_process.instance_id.boot_id})
          </span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {(['all', 'process', 'network', 'module', 'rule'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              style={{
                height: 26,
                padding: '0 10px',
                borderRadius: 999,
                border: filter === cat ? '1px solid #CBA6C5' : '1px solid #2A2529',
                background: filter === cat ? 'var(--sw-mauve-pill-bg)' : 'transparent',
                color: filter === cat ? '#F5F3F5' : '#847C84',
                fontSize: 11.5,
                textTransform: 'capitalize',
              }}
            >
              {cat === 'module' ? 'DLLs' : cat === 'process' ? 'Processes' : cat === 'rule' ? 'Rules' : cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 11.5 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#CBA6C5' }}>
            <span style={{ width: 16, height: 2, background: '#CBA6C5', display: 'inline-block' }} />
            Confirmed
          </span>
          <button
            type="button"
            onClick={() => setShowInferred((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: showInferred ? '#E5B567' : '#847C84', fontSize: 11.5, opacity: showInferred ? 1 : 0.6 }}
          >
            <span style={{ width: 16, borderTop: '2px dashed #E5B567', display: 'inline-block' }} />
            Inferred
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 10 }}>
        <div
          className="sw-card sw-dot-grid"
          style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            setDragging(true);
            setDragOrigin({ x: e.clientX - pan.x, y: e.clientY - pan.y });
          }}
          onMouseMove={(e) => {
            if (!dragging) return;
            setPan({ x: e.clientX - dragOrigin.x, y: e.clientY - dragOrigin.y });
          }}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: dragging || motionTier === 'off' ? 'none' : 'transform 180ms ease-out',
            }}
          >
            <svg width={1100} height={560} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}>
              {visibleEdges.map((edge) => {
                const src = visibleNodes.find((n) => n.id === edge.source);
                const tgt = visibleNodes.find((n) => n.id === edge.target);
                if (!src || !tgt) return null;
                const a = getNodeCenter(src);
                const b = getNodeCenter(tgt);
                const cx = (a.rightX + b.leftX) / 2;
                const d = `M ${a.rightX} ${a.midY} C ${cx} ${a.midY}, ${cx} ${b.midY}, ${b.leftX} ${b.midY}`;
                const reached = edge.timestamp_ms <= currentTsMs;
                const isInferred = edge.classification === 'inferred';
                const stroke = isInferred
                  ? '#E5B567'
                  : edge.category === 'network'
                    ? '#89B4FA'
                    : edge.category === 'rule'
                      ? '#E06C75'
                      : '#CBA6C5';

                return (
                  <g key={edge.id} style={{ opacity: reached ? 1 : 0.14, transition: 'opacity 220ms ease' }}>
                    <path
                      d={d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={selectedNodeId === edge.target ? 2.2 : 1.6}
                      strokeDasharray={isInferred ? '5 5' : '1'}
                      pathLength={1}
                      strokeDashoffset={isInferred ? 0 : reached ? 0 : 0.85}
                      style={{
                        transition:
                          motionTier === 'off'
                            ? 'none'
                            : `stroke-dashoffset ${resolveDurationSec('ANIM-15', motionTier)}s cubic-bezier(0.16, 1, 0.3, 1)`,
                      }}
                    />
                    <text x={cx} y={(a.midY + b.midY) / 2 - 6} textAnchor="middle" fill={stroke} fontSize="10" fontFamily="var(--font-mono)">
                      {edge.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {visibleNodes.map((node) => {
              const reached = node.timestamp_ms <= currentTsMs;
              const isSelected = selectedNodeId === node.id;
              const isInferred = node.classification === 'inferred';
              const isNet = node.kind === 'network_endpoint';
              const isDll = node.kind === 'dll_cluster';
              const isRule = node.kind === 'rule_match';

              const borderColor = isSelected
                ? '#FDCEF1'
                : isInferred
                  ? '#E5B567'
                  : isNet
                    ? '#89B4FA'
                    : isRule
                      ? '#E06C75'
                      : node.signature_status === 'signed_verified'
                        ? '#5ED18A'
                        : '#CBA6C5';

              return (
                <motion.div
                  key={node.id}
                  layout={motionTier !== 'off'}
                  transition={{ duration: resolveDurationSec('ANIM-11', motionTier), ease: EASINGS.fluidOut }}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: isDll && dllExpanded ? 268 : isDll ? 228 : isNet ? 216 : 204,
                    opacity: reached ? 1 : 0.16,
                    zIndex: isSelected ? 6 : 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      if (isDll) setDllExpanded((v) => !v);
                    }}
                    className={node.id === 'node-root' && motionTier !== 'off' ? 'sw-rim-sweep-once' : ''}
                    style={{
                      width: '100%',
                      padding: isNet ? '10px 16px' : '11px 14px',
                      borderRadius: isNet ? 999 : 12,
                      background: isNet ? '#121822' : isRule ? '#1A1114' : '#141115',
                      border: `1.2px ${isInferred ? 'dashed' : 'solid'} ${borderColor}`,
                      boxShadow: isSelected ? `0 0 0 2px ${borderColor}40, 0 10px 28px rgba(0,0,0,0.5)` : '0 6px 20px rgba(0,0,0,0.4)',
                      textAlign: 'left',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: isInferred ? '#E5B567' : isNet ? '#C4DAFF' : '#F5F3F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node.label}
                      </span>
                      {isDll && (dllExpanded ? <ChevronUp size={14} color="#CBA6C5" /> : <ChevronDown size={14} color="#CBA6C5" />)}
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: '#847C84', marginTop: 4 }}>
                      {node.subtitle}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isDll && dllExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 158, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: resolveDurationSec('ANIM-10', motionTier), ease: EASINGS.fluidOut }}
                        style={{ marginTop: 6, background: '#100E10', border: '1px solid #3A3039', borderRadius: 10, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}
                      >
                        {node.modules.slice(0, 18).map((m) => (
                          <div
                            key={m.id}
                            className="mono"
                            style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, padding: '3px 6px', borderRadius: 6, background: m.signature_status === 'unsigned' ? 'rgba(224,108,117,0.12)' : 'transparent' }}
                          >
                            <span style={{ color: m.signature_status === 'unsigned' ? '#E06C75' : '#F5F3F5' }}>{m.module_name}</span>
                            <span style={{ color: m.signature_status === 'unsigned' ? '#E5B567' : '#5ED18A' }}>
                              {m.signature_status === 'unsigned' ? 'Unsigned' : 'Signed'}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div style={{ position: 'absolute', left: 14, bottom: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(10,10,10,0.88)', border: '1px solid #2A2529', borderRadius: 10, padding: '5px 8px' }}>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))} aria-label="Zoom out" style={{ background: 'transparent', border: 'none', color: '#A8A2A8', padding: 4 }}>
              <ZoomOut size={13} />
            </button>
            <span className="mono" style={{ fontSize: 11, color: '#A8A2A8', minWidth: 38, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button type="button" onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))} aria-label="Zoom in" style={{ background: 'transparent', border: 'none', color: '#A8A2A8', padding: 4 }}>
              <ZoomIn size={13} />
            </button>
            <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Fit to view" aria-label="Fit to view" style={{ background: 'transparent', border: 'none', color: '#CBA6C5', padding: 4 }}>
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {selectedNode && (
            <motion.aside
              initial={motionTier === 'off' ? { opacity: 0 } : { x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={motionTier === 'off' ? { opacity: 0 } : { x: 40, opacity: 0 }}
              transition={{ duration: resolveDurationSec('ANIM-09', motionTier), ease: EASINGS.fluidOut }}
              className="sw-card"
              style={{ width: 340, minWidth: 340, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: 'rgba(203, 166, 197, 0.3)' }}
            >
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: motionTier === 'off' ? 0 : 0.09 }}
                style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: '#F5F3F5' }}>Event Inspector</span>
                  <button type="button" aria-label="Close inspector" onClick={() => setSelectedNodeId(null)} style={{ background: 'transparent', border: 'none', color: '#847C84', padding: 4 }}>
                    <X size={15} />
                  </button>
                </div>

                <div className="mono" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: selectedNode.classification === 'inferred' ? '#E5B567' : '#5ED18A' }}>
                  {selectedNode.classification === 'inferred' ? 'INFERRED CONTEXT (CORRELATION ONLY)' : 'CONFIRMED RECORDED TELEMETRY'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#847C84' }}>Entity</div>
                    <div className="mono" style={{ fontSize: 12.5, color: '#F5F3F5', marginTop: 2 }}>{selectedNode.label}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#847C84' }}>Timestamp (UTC)</div>
                    <div className="mono" style={{ fontSize: 12, color: '#A8A2A8', marginTop: 2 }}>{formatTimestamp(selectedNode.timestamp_ms)}</div>
                  </div>
                  {Object.entries(selectedNode.metadata).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10.5, color: '#847C84', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                      <div className="mono" style={{ fontSize: 11.5, color: k.includes('warning') ? '#E5B567' : '#D4CED4', marginTop: 2, wordBreak: 'break-word', lineHeight: 1.45 }}>
                        {String(v ?? 'Unavailable')}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid #1E1A1E' }}>
                <ExportActionButton
                  label="Export Sanitized Incident"
                  motionTier={motionTier}
                  onExport={() => onExportIncident(formatStableKey(graph.root_process.instance_id))}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    className="sw-cta-secondary"
                    onClick={async () => {
                      await onAllowlistProcess(graph.root_process.exe_name);
                      setAllowlistedDone(true);
                      setTimeout(() => setAllowlistedDone(false), 2000);
                    }}
                  >
                    {allowlistedDone ? <Check size={13} color="#5ED18A" /> : <ShieldCheck size={13} />}
                    <span>{allowlistedDone ? 'Allowlisted' : 'Allowlist'}</span>
                  </button>
                  <button
                    type="button"
                    className="sw-cta-secondary"
                    onClick={() => {
                      navigator.clipboard?.writeText(JSON.stringify(selectedNode, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 1800);
                    }}
                  >
                    {copiedJson ? <Check size={13} color="#5ED18A" /> : <Copy size={13} />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <div className="sw-card" style={{ height: 74, minHeight: 74, padding: '10px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                if (!playing && playheadPct >= 99) setPlayheadPct(0);
                setPlaying((p) => !p);
              }}
              style={{ height: 28, padding: '0 12px', borderRadius: 999, border: '1px solid #CBA6C5', background: playing ? 'var(--sw-mauve)' : 'var(--sw-mauve-pill-bg)', color: playing ? '#0A0A0A' : '#F5F3F5', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
              {playing ? 'Pause' : 'Replay'}
            </button>
            <button type="button" onClick={() => stepEvent(-1)} aria-label="Step back" style={{ background: '#141115', border: '1px solid #2A2529', borderRadius: 7, color: '#A8A2A8', padding: '5px 7px' }}>
              <SkipBack size={12} />
            </button>
            <button type="button" onClick={() => stepEvent(1)} aria-label="Step forward" style={{ background: '#141115', border: '1px solid #2A2529', borderRadius: 7, color: '#A8A2A8', padding: '5px 7px' }}>
              <SkipForward size={12} />
            </button>
            <div style={{ display: 'inline-flex', gap: 4, marginLeft: 6 }}>
              {([0.5, 1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className="mono"
                  style={{ height: 24, padding: '0 8px', borderRadius: 999, border: speed === s ? '1px solid #CBA6C5' : '1px solid #2A2529', background: speed === s ? '#2B232A' : 'transparent', color: speed === s ? '#F5F3F5' : '#847C84', fontSize: 11 }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="mono" style={{ fontSize: 11.5, color: '#A8A2A8' }}>
            <span style={{ color: '#FDCEF1' }}>{formatTimestamp(currentTsMs)}</span>
            {' / '}
            <span>{formatTimestamp(endMs)}</span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={playheadPct}
          aria-label="Chronological replay playhead"
          onChange={(e) => {
            setPlaying(false);
            setPlayheadPct(Number(e.target.value));
          }}
          style={{ width: '100%', accentColor: '#FDCEF1', height: 4 }}
        />
      </div>
    </div>
  );
};
