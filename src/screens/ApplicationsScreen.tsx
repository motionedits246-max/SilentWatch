import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpDown, Search } from 'lucide-react';
import { EmptyStateEmblem, ProcessAppIcon } from '@/assets/VisualAssets';
import type { ProcessSummary } from '@/types/telemetry';
import { formatStableKey } from '@/types/telemetry';

interface ApplicationsScreenProps {
  processes: ProcessSummary[];
  onInspectProcess: (stableKey: string) => void;
}

type FilterPill = 'all' | 'active' | 'unsigned' | 'high_net' | 'allowlisted';
type SortField = 'cpu' | 'memory' | 'events' | 'name';

export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  processes,
  onInspectProcess,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterPill>('all');
  const [sortBy, setSortBy] = useState<SortField>('cpu');

  const unsignedCount = useMemo(
    () => processes.filter((p) => p.signature_status === 'unsigned').length,
    [processes],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return processes
      .filter((p) => {
        if (filter === 'active' && !p.is_active) return false;
        if (filter === 'unsigned' && p.signature_status !== 'unsigned') return false;
        if (filter === 'high_net' && p.network_count < 3) return false;
        if (filter === 'allowlisted' && !p.is_allowlisted) return false;
        if (!q) return true;
        return (
          p.exe_name.toLowerCase().includes(q) ||
          String(p.instance_id.pid).includes(q) ||
          (p.publisher ?? '').toLowerCase().includes(q) ||
          (p.exe_path ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'cpu') return b.cpu_percent - a.cpu_percent;
        if (sortBy === 'memory') return b.memory_mb - a.memory_mb;
        if (sortBy === 'events') return b.event_count - a.event_count;
        return a.exe_name.localeCompare(b.exe_name);
      });
  }, [processes, query, filter, sortBy]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '2px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 23, fontWeight: 500, letterSpacing: '-0.02em' }}>Applications</h1>
          <span className="mono" style={{ fontSize: 12, color: '#E5CBE0' }}>
            {processes.filter((p) => p.is_active).length} Running • {unsignedCount} Unsigned
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 320, height: 36, padding: '0 12px', borderRadius: 10, background: '#0A0A0A', border: '1px solid #2A2529', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Search size={14} color="#847C84" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by process, PID, publisher..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F5F3F5', fontSize: 12.5 }}
          />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {(
            [
              ['all', 'All'],
              ['active', 'Active'],
              ['unsigned', `Unsigned (${unsignedCount})`],
              ['high_net', 'High Network'],
              ['allowlisted', 'Allowlisted'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              style={{
                height: 28,
                padding: '0 11px',
                borderRadius: 999,
                border: filter === id ? '1px solid #CBA6C5' : '1px solid #2A2529',
                background: filter === id ? 'var(--sw-mauve-pill-bg)' : '#0A0A0A',
                color: filter === id ? '#F5F3F5' : '#A8A2A8',
                fontSize: 11.5,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="sw-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="mono" style={{ display: 'grid', gridTemplateColumns: '2.1fr 1.1fr 1.1fr 0.7fr 0.8fr 0.7fr 0.9fr', padding: '12px 18px', borderBottom: '1px solid #221D22', fontSize: 10.5, color: '#847C84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <button type="button" onClick={() => setSortBy('name')} style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}>
            Application <ArrowUpDown size={11} />
          </button>
          <span>Identity (PID)</span>
          <span>Signature</span>
          <button type="button" onClick={() => setSortBy('cpu')} style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'right', padding: 0 }}>
            CPU %
          </button>
          <button type="button" onClick={() => setSortBy('memory')} style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'right', padding: 0 }}>
            RAM MB
          </button>
          <button type="button" onClick={() => setSortBy('events')} style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'right', padding: 0 }}>
            Events
          </button>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {rows.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <EmptyStateEmblem variant="search" />
              <div style={{ fontSize: 13, color: '#847C84' }}>No processes match your filter.</div>
              <button type="button" className="sw-cta-secondary" onClick={() => { setQuery(''); setFilter('all'); }}>
                Clear Filters
              </button>
            </div>
          ) : (
            rows.map((p) => {
              const key = formatStableKey(p.instance_id);
              const unsigned = p.signature_status === 'unsigned';
              return (
                <div
                  key={key}
                  onClick={() => onInspectProcess(key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onInspectProcess(key)}
                  style={{ display: 'grid', gridTemplateColumns: '2.1fr 1.1fr 1.1fr 0.7fr 0.8fr 0.7fr 0.9fr', alignItems: 'center', padding: '10px 12px', borderRadius: 10, border: '1px solid transparent', transition: 'background-color 100ms ease, border-color 100ms ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#141115';
                    e.currentTarget.style.borderColor = '#342C34';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <ProcessAppIcon exeName={p.exe_name} iconDataUrl={p.icon_data_url} size={26} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#F5F3F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.exe_name}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: '#847C84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.exe_path ?? 'Protected path'}
                      </div>
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: '#A8A2A8' }}>PID {p.instance_id.pid}</span>
                  <span style={{ fontSize: 12, color: unsigned ? '#E5B567' : '#5ED18A' }}>
                    {unsigned ? 'Unsigned' : p.publisher ?? 'Verified'}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: '#F5F3F5', textAlign: 'right' }}>{p.cpu_percent.toFixed(1)}%</span>
                  <span className="mono" style={{ fontSize: 12, color: '#A8A2A8', textAlign: 'right' }}>{p.memory_mb.toFixed(0)} MB</span>
                  <span className="mono" style={{ fontSize: 12, color: '#A8A2A8', textAlign: 'right' }}>{p.event_count}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: '#CBA6C5', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Explore <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
