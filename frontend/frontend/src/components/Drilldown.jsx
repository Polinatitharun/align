import React, { useMemo, useState, useCallback } from 'react';
import { X, Search } from 'lucide-react';

/** Generic groupBy helper */
export function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item) || '—';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return Array.from(map.entries())
    .map(([key, rows]) => ({ key, count: rows.length, rows }))
    .sort((a, b) => b.count - a.count);
}

/** Clickable stat card */
export function ClickableStatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'info',
  onClick,
  disabled = false,
}) {
  const handleKey = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      type="button"
      className="clickable-stat"
      data-tone={tone}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKey}
      disabled={disabled}
      aria-label={`${label}: ${value}. Open details`}
    >
      {Icon && (
        <span className="stat-icon" aria-hidden>
          <Icon size={18} />
        </span>
      )}
      <span>
        <p className="stat-label">{label}</p>
        <div className="stat-value">{value}</div>
        {sub != null && <div className="stat-sub">{sub}</div>}
      </span>
    </button>
  );
}

/**
 * DrillDownModal
 * tabs: [{ id, label, type: 'groups' | 'list' | 'custom', groups?, columns?, rows?, render? }]
 * chips: [{ label, value }]
 */
export function DrillDownModal({
  open,
  onClose,
  title,
  icon: Icon,
  chips = [],
  tabs = [],
  footer = null,
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  React.useEffect(() => {
    if (open && tabs.length) setActiveTab(tabs[0].id);
    if (!open) {
      setQuery('');
      setSortKey(null);
    }
  }, [open, tabs]);

  React.useEffect(() => {
    if (open) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [open]);

  const current = tabs.find((t) => t.id === activeTab) || tabs[0];

  const filteredRows = useMemo(() => {
    if (!current || current.type !== 'list') return [];
    let rows = current.rows || [];
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((r) =>
        (current.searchKeys || Object.keys(r)).some((k) =>
          String(r[k] ?? '').toLowerCase().includes(q)
        )
      );
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [current, query, sortKey, sortDir]);

  const toggleSort = useCallback((key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  if (!open) return null;

  const maxGroup = current?.type === 'groups'
    ? Math.max(1, ...(current.groups || []).map((g) => g.count))
    : 1;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content drill-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drill-title"
      >
        <div className="modal-header">
          <h2 id="drill-title">
            {Icon && <Icon size={22} />}
            {title}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ paddingTop: '1.25rem' }}>
          {chips.length > 0 && (
            <div className="drill-summary-chips">
              {chips.map((c) => (
                <span key={c.label} className="drill-chip">
                  <strong>{c.value}</strong> {c.label}
                </span>
              ))}
            </div>
          )}

          {tabs.length > 1 && (
            <div className="drill-tabs" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  className={`drill-tab ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {current?.type === 'groups' && (
            <div className="drill-group-list">
              {(current.groups || []).map((g) => (
                <div key={g.key} className="drill-group-row">
                  <span style={{ fontWeight: 600 }}>{g.key}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(g.count / maxGroup) * 100}%` }}
                    />
                  </div>
                  <span style={{ fontWeight: 700, minWidth: 32, textAlign: 'right' }}>
                    {g.count}
                  </span>
                </div>
              ))}
              {(current.groups || []).length === 0 && (
                <p className="no-data" style={{ padding: '1.5rem' }}>No groups</p>
              )}
            </div>
          )}

          {current?.type === 'list' && (
            <>
              <div className="drill-search search-input-wrapper">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Search…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search records"
                />
              </div>
              <div className="drill-table-wrap">
                <table className="drill-table">
                  <thead>
                    <tr>
                      {(current.columns || []).map((col) => (
                        <th key={col.key}>
                          {col.sortable ? (
                            <button
                              type="button"
                              className="btn-ghost"
                              style={{ padding: 0, minHeight: 0, boxShadow: 'none', fontSize: 'inherit' }}
                              onClick={() => toggleSort(col.key)}
                            >
                              {col.label}
                              {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={row.id ?? row.userId ?? idx}>
                        {(current.columns || []).map((col) => (
                          <td key={col.key}>
                            {col.render ? col.render(row) : row[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={(current.columns || []).length} className="no-data">
                          No matching records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {current?.type === 'custom' && current.render?.()}
        </div>

        {(footer || true) && (
          <div className="modal-actions">
            {footer}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}