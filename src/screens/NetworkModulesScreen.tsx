import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Search } from 'lucide-react';
import { SPRINGS } from '@/animations/motionTokens';
import type { ModuleRecord, MotionTier, NetworkConnectionRecord, PrivilegeMode } from '@/types/telemetry';
import { formatStableKey } from '@/types/telemetry';

interface NetworkModulesScreenProps {
  connections: NetworkConnectionRecord[];
  modules: ModuleRecord[];
  privilegeMode: PrivilegeMode;
  motionTier: MotionTier;
  onInspectProcess: (stableKey: string) => void;
}

type SubTab = 'connections' | 'domains' | 'modules';

export const NetworkModulesScreen: React.FC<NetworkModulesScreenProps> = ({
  connections,
  modules,
  privilegeMode,
  motionTier,
  onInspectProcess,
}) => {
  const [tab, setTab] = useState<SubTab>('connections');
  const [search, setSearch] = useState('');
  const [selectedConnId, setSelectedConnId] = useState<string | null>(connections[0]?.id ?? null);

  const uniqueDomains = useMemo(() => {
    const map = new Map<string, { endpoint: string; ip: string; count: number; processes: Set<string> }>();
    connections.forEach((c) => {
      const key = c.remote_domain ?? c.remote_addr;
      const existing = map.get(key) ?? { endpoint: key, ip: c.remote_addr, count: 0, processes: new Set() };
      existing.count += 1;
      existing.processes.add(c.process_name);
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [connections]);

  const filteredConns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return connections;
    return connections.filter(
      (c) =>
        (c.remote_domain ?? '').toLowerCase().includes(q) ||
        c.remote_addr.includes(q) ||
        c.process_name.toLowerCase().includes(q) ||
        c.protocol.toLowerCase().includes(q),
    );
  }, [connections, search]);

  const filteredMods = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.module_name.toLowerCase().includes(q) ||
        m.module_path.toLowerCase().includes(q) ||
        m.process_name.toLowerCase().includes(q),
    );
  }, [modules, search]);

  const selectedConn =
    filteredConns.find((c) => c.id === selectedConnId) ?? filteredConns[0] ?? null;

  const formatBytes = (b: number) => {
    if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    if (b >= 1024) return `${Math.round(b / 1024)} KB`;
    return `${b} B`;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '2px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 23, fontWeight: 500, letterSpacing: '-0.02em' }}>
            Network &amp; Modules
          </h1>
          <div role="tablist" style={{ display: 'inline-flex', background: '#0A0A0A', border: '1px solid #2A2529', borderRadius: 999, padding: 3 }}>
            {(
              [
                ['connections', 'Connections'],
                ['domains', 'Domains & IPs'],
                ['modules', 'DLL Loads'],
              ] as const
            ).map(([id, label]) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setTab(id)}
                  style={{ position: 'relative', height: 28, padding: '0 14px', border: 'none', borderRadius: 999, background: 'transparent', color: active ? '#F5F3F5' : '#847C84', fontSize: 12, fontWeight: active ? 500 : 400 }}
                >
                  {active && (
                    <motion.span layoutId="net-subtab-pill" transition={motionTier === 'off' ? { duration: 0 } : SPRINGS.pillGlide} style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--sw-mauve-pill-bg)', border: '1px solid #CBA6C5', zIndex: 0 }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ width: 240, height: 34, padding: '0 10px', borderRadius: 999, background: '#0A0A0A', border: '1px solid #2A2529', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Search size={13} color="#847C84" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter endpoints or DLLs..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F5F3F5', fontSize: 12 }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="sw-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 11.5, color: '#847C84' }}>Active Sockets</div>
          <div className="tabular" style={{ fontSize: 24, fontWeight: 600, color: '#89B4FA', marginTop: 4 }}>{connections.length}</div>
        </div>
        <div className="sw-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 11.5, color: '#847C84' }}>Unique Domains / IPs</div>
          <div className="tabular" style={{ fontSize: 24, fontWeight: 600, color: '#F5F3F5', marginTop: 4 }}>{uniqueDomains.length}</div>
        </div>
        <div className="sw-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 11.5, color: '#847C84' }}>Kernel Image-Load ETW</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: privilegeMode === 'enhanced_etw' ? '#5ED18A' : '#E5B567', marginTop: 8 }}>
            {privilegeMode === 'enhanced_etw' ? 'Enhanced ETW Active' : 'Requires ETW (Snapshot Active)'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12 }}>
        <div className="sw-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {tab === 'connections' && (
            <>
              <div className="mono" style={{ display: 'grid', gridTemplateColumns: '2fr 0.9fr 1.1fr 0.9fr', padding: '11px 16px', borderBottom: '1px solid #221D22', fontSize: 10.5, color: '#847C84', textTransform: 'uppercase' }}>
                <span>Remote Endpoint</span>
                <span>Protocol</span>
                <span>Process</span>
                <span style={{ textAlign: 'right' }}>Bytes Out</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                {filteredConns.map((c) => {
                  const active = selectedConn?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConnId(c.id)}
                      style={{ width: '100%', display: 'grid', gridTemplateColumns: '2fr 0.9fr 1.1fr 0.9fr', alignItems: 'center', padding: '11px 12px', borderRadius: 10, border: active ? '1px solid #89B4FA' : '1px solid transparent', background: active ? '#121822' : 'transparent', textAlign: 'left' }}
                    >
                      <span className="mono" style={{ fontSize: 12.5, color: active ? '#89B4FA' : '#F5F3F5' }}>
                        {c.remote_domain ? `${c.remote_domain}:${c.remote_port}` : `${c.remote_addr}:${c.remote_port}`}
                      </span>
                      <span className="mono" style={{ fontSize: 11.5, color: '#A8A2A8' }}>{c.protocol}</span>
                      <span style={{ fontSize: 12.5, color: '#F5F3F5' }}>{c.process_name}</span>
                      <span className="mono" style={{ fontSize: 12, color: '#A8A2A8', textAlign: 'right' }}>{formatBytes(c.bytes_out)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'domains' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {uniqueDomains.map((d) => (
                <div key={d.endpoint} className="sw-tile" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="mono" style={{ fontSize: 13, color: '#F5F3F5' }}>{d.endpoint}</div>
                    <div className="mono" style={{ fontSize: 11, color: '#847C84', marginTop: 2 }}>
                      IP: {d.ip} • Processes: {Array.from(d.processes).join(', ')}
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: '#89B4FA' }}>{d.count} sockets</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'modules' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
              <div className="mono" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr 0.9fr', padding: '8px 10px', borderBottom: '1px solid #221D22', fontSize: 10.5, color: '#847C84', textTransform: 'uppercase' }}>
                <span>Module</span>
                <span>Path</span>
                <span>Host Process</span>
                <span style={{ textAlign: 'right' }}>Signature</span>
              </div>
              {filteredMods.map((m) => (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr 0.9fr', padding: '9px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                  <span className="mono" style={{ color: m.signature_status === 'unsigned' ? '#E06C75' : '#F5F3F5' }}>{m.module_name}</span>
                  <span className="mono" style={{ fontSize: 11, color: '#847C84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.module_path}</span>
                  <span style={{ color: '#A8A2A8' }}>{m.process_name}</span>
                  <span className="mono" style={{ textAlign: 'right', color: m.signature_status === 'unsigned' ? '#E5B567' : '#5ED18A' }}>
                    {m.signature_status === 'unsigned' ? 'Unsigned' : 'Signed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedConn && tab === 'connections' && (
          <aside className="sw-card" style={{ width: 340, minWidth: 340, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: 'rgba(137, 180, 250, 0.35)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#F5F3F5' }}>Endpoint Inspector</div>
              <div className="mono" style={{ fontSize: 12.5, color: '#89B4FA' }}>
                {selectedConn.remote_domain ? `${selectedConn.remote_domain}:${selectedConn.remote_port}` : `${selectedConn.remote_addr}:${selectedConn.remote_port}`}
              </div>
              {[
                ['Remote IP', `${selectedConn.remote_addr} (${selectedConn.classification})`],
                ['Local Socket', `${selectedConn.local_addr}:${selectedConn.local_port}`],
                ['Initiator', `${selectedConn.process_name} (PID ${selectedConn.process_instance_id.pid})`],
                ['Protocol / State', `${selectedConn.protocol} • ${selectedConn.state}`],
                ['Provenance', selectedConn.provenance.source_api],
                ['Confidence Note', selectedConn.provenance.confidence_note],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10.5, color: '#847C84' }}>{k}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: '#D4CED4', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            <button type="button" className="sw-cta-primary" onClick={() => onInspectProcess(formatStableKey(selectedConn.process_instance_id))}>
              Open in Behavior Explorer <ArrowRight size={14} />
            </button>
          </aside>
        )}
      </div>
    </div>
  );
};
