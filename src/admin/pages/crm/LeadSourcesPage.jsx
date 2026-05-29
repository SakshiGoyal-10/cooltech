// LeadSourcesPage.jsx — fully responsive for mobile & tablet
import { useState, useEffect } from 'react';
import { useLeadSources } from '../../hooks/useLeadSources';
import { COLORS, FONTS } from '../../constants/tokens';
import { SectionHdr } from '../../components/ui/Cards';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

// ─── Breakpoint Hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile:  width < 640,
    isTablet:  width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

// ─── Add Source Modal ─────────────────────────────────────────────────────────
const AddSourceModal = ({ onClose, onSave }) => {
  const [value, setValue] = useState('');
  const { isMobile } = useBreakpoint();

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '16px' : 0 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: COLORS.white, borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', width: '100%', maxWidth: 420, padding: isMobile ? '20px 18px 18px' : '28px 28px 24px', fontFamily: FONTS.sans }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>Add Lead Source</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: COLORS.muted, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6 }}>
            Lead Source <span style={{ color: '#DC2626' }}>*</span>
          </div>
          <input
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { onSave(value.trim()); onClose(); } }}
            placeholder="e.g. Instagram, Trade Fair…"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${value ? COLORS.brand : COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h2, background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose}
            style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>
            Close
          </button>
          <button
            onClick={() => { if (value.trim()) { onSave(value.trim()); onClose(); } }}
            disabled={!value.trim()}
            style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: value.trim() ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : COLORS.border, color: value.trim() ? 'white' : COLORS.muted, fontSize: 13, fontWeight: 700, cursor: value.trim() ? 'pointer' : 'not-allowed', fontFamily: FONTS.sans, transition: 'background .15s' }}>
            ✓ Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const ToggleSwitch = ({ active, onChange }) => (
  <button
    onClick={onChange}
    title={active ? 'Click to deactivate' : 'Click to activate'}
    style={{
      position: 'relative',
      width: 40, height: 22,
      borderRadius: 99,
      background: active ? '#16A34A' : '#D1D5DB',
      border: 'none', cursor: 'pointer',
      padding: 0, flexShrink: 0,
      transition: 'background .2s',
    }}
  >
    <span style={{
      position: 'absolute',
      top: 3, left: active ? 21 : 3,
      width: 16, height: 16,
      borderRadius: '50%',
      background: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      transition: 'left .2s',
      display: 'block',
    }} />
  </button>
);

// ─── LeadSourcesPage ──────────────────────────────────────────────────────────
const LeadSourcesPage = ({ sources, onAdd, onDelete, onToggle }) => {
  const { isMobile, isTablet } = useBreakpoint();

  const [showAdd,      setShowAdd]      = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = sources
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => statusFilter === 'all' ? true : statusFilter === 'active' ? s.active : !s.active);

  const activeCount   = sources.filter(s => s.active).length;
  const inactiveCount = sources.filter(s => !s.active).length;

  // On mobile, hide "Added" column to save space
  const showAddedCol = !isMobile;

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <SectionHdr
          title="Lead Sources"
          sub={`${sources.length} source${sources.length !== 1 ? 's' : ''} · ${activeCount} active · ${inactiveCount} inactive`}
        />
        <button
          className="btn"
          onClick={() => setShowAdd(true)}
          style={{
            padding: isMobile ? '8px 16px' : '9px 22px',
            borderRadius: 9,
            background: 'linear-gradient(135deg,#EA580C,#C2410C)',
            color: 'white',
            fontSize: isMobile ? 12 : 13,
            fontWeight: 700,
            border: 'none',
            boxShadow: '0 3px 10px #EA580C40',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
          + Add Source
        </button>
      </div>

      {/* ── Info banner ── */}
      <div style={{
        padding: isMobile ? '10px 12px' : '11px 16px',
        borderRadius: 10,
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        fontSize: isMobile ? 11 : 12,
        color: '#1D4ED8',
        fontWeight: 500,
        lineHeight: 1.5,
      }}>
        ℹ️ Sources added here appear in the <strong>Lead Source</strong> dropdown when creating a lead.
        Only <strong>Active</strong> sources show in the dropdown. Inactive sources are hidden but not deleted.
      </div>

      {/* ── Table Card ── */}
      <div style={{
        background: COLORS.white,
        borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        overflow: 'clip',
      }}>

        {/* ── Toolbar ── */}
        <div style={{
          padding: isMobile ? '10px 12px' : '12px 18px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 8 : 10,
          alignItems: isMobile ? 'stretch' : 'center',
          flexWrap: isTablet ? 'wrap' : 'nowrap',
        }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: isMobile ? 'none' : '1 1 180px', maxWidth: isMobile ? '100%' : 320 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: COLORS.faint }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sources…"
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: 9,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13,
                fontFamily: FONTS.sans,
                color: COLORS.h2,
                background: COLORS.white,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Status filter tabs — scrollable on very small screens */}
          <div style={{
            display: 'flex',
            gap: 4,
            background: COLORS.bg,
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            padding: 3,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            flexShrink: 0,
          }}>
            {[
              ['all',      `All (${sources.length})`],
              ['active',   `Active (${activeCount})`],
              ['inactive', `Inactive (${inactiveCount})`],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setStatusFilter(k)} style={{
                padding: isMobile ? '5px 10px' : '5px 12px',
                borderRadius: 6,
                fontSize: isMobile ? 11 : 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === k ? COLORS.white : 'transparent',
                color: statusFilter === k ? COLORS.h1 : COLORS.muted,
                border: `1px solid ${statusFilter === k ? COLORS.border : 'transparent'}`,
                fontFamily: FONTS.sans,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* ── Scrollable table wrapper ── */}
        <div style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          // Custom scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: `${COLORS.border} transparent`,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 480 : 560 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: `1px solid ${COLORS.border}` }}>
                {['#', 'Source Name', 'Status', 'Toggle', ...(showAddedCol ? ['Added'] : []), ''].map((col, i, arr) => (
                  <th key={i} style={{
                    padding: isMobile ? '10px 12px' : '11px 16px',
                    textAlign: i === arr.length - 1 ? 'right' : 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.faint,
                    textTransform: 'uppercase',
                    letterSpacing: .6,
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={showAddedCol ? 6 : 5} style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: COLORS.faint }}>
                    {search ? `No sources matching "${search}"` : 'No sources found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((source, i) => {
                  const originalIndex = sources.findIndex(s => s.name === source.name);
                  return (
                    <tr
                      key={source.name}
                      className="row"
                      style={{
                        borderBottom: `1px solid ${COLORS.border}22`,
                        background: source.active
                          ? (i % 2 === 0 ? COLORS.white : '#FAFAFA')
                          : '#FAFAFA',
                        opacity: source.active ? 1 : 0.65,
                        transition: 'opacity .2s',
                      }}
                    >
                      {/* # */}
                      <td style={{ padding: isMobile ? '11px 12px' : '13px 16px', width: 40 }}>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.faint }}>{originalIndex + 1}</span>
                      </td>

                      {/* Name */}
                      <td style={{ padding: isMobile ? '11px 12px' : '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10 }}>
                          <div style={{
                            width: isMobile ? 26 : 30,
                            height: isMobile ? 26 : 30,
                            borderRadius: 8,
                            flexShrink: 0,
                            background: source.active ? '#FFF7ED' : '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isMobile ? 12 : 14,
                          }}>
                            📌
                          </div>
                          <span style={{
                            fontSize: isMobile ? 12 : 13,
                            fontWeight: 700,
                            color: source.active ? COLORS.h1 : COLORS.muted,
                            whiteSpace: 'nowrap',
                          }}>
                            {source.name}
                          </span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: isMobile ? '11px 12px' : '13px 16px' }}>
                        <span style={{
                          fontSize: isMobile ? 10 : 11,
                          fontWeight: 600,
                          padding: isMobile ? '3px 8px' : '4px 10px',
                          borderRadius: 99,
                          background: source.active ? '#F0FDF4' : '#F3F4F6',
                          color: source.active ? '#16A34A' : '#6B7280',
                          border: `1px solid ${source.active ? '#BBF7D0' : '#E5E7EB'}`,
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}>
                          {source.active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>

                      {/* Toggle */}
                      <td style={{ padding: isMobile ? '11px 12px' : '13px 16px' }}>
                        <ToggleSwitch
                          active={source.active}
                          onChange={() => onToggle(source.name)}
                        />
                      </td>

                      {/* Added — hidden on mobile */}
                      {showAddedCol && (
                        <td style={{ padding: '13px 16px', fontSize: 12, color: COLORS.muted, fontFamily: FONTS.mono, whiteSpace: 'nowrap' }}>
                          {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      )}

                      {/* Delete */}
                      <td style={{ padding: isMobile ? '11px 12px' : '13px 16px', textAlign: 'right' }}>
                        <button
                          className="btn"
                          onClick={() => setDeleteTarget({ name: source.name, index: originalIndex })}
                          style={{
                            padding: isMobile ? '5px 10px' : '6px 14px',
                            borderRadius: 7,
                            border: '1px solid #FECACA',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: isMobile ? 11 : 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap',
                          }}>
                          🗑{!isMobile && ' Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        {filtered.length > 0 && (
          <div style={{
            padding: isMobile ? '8px 12px' : '10px 16px',
            borderTop: `1px solid ${COLORS.border}`,
            fontSize: isMobile ? 11 : 12,
            color: COLORS.faint,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
          }}>
            <span>Showing {filtered.length} of {sources.length} sources</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: '#16A34A', fontWeight: 600 }}>{activeCount} active</span>
              <span style={{ color: COLORS.muted, fontWeight: 600 }}>{inactiveCount} inactive</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Add modal ── */}
      {showAdd && (
        <AddSourceModal
          onClose={() => setShowAdd(false)}
          onSave={name => { onAdd(name); setShowAdd(false); }}
        />
      )}

      {/* ── Delete confirm ── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => { onDelete(deleteTarget.name); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        message={`"${deleteTarget?.name}" will be permanently removed from Lead Sources.`}
      />
    </div>
  );
};

// ─── API Wrapper ──────────────────────────────────────────────────────────────
const LeadSourcesPageWrapper = () => {
  const { sources, loading, addSource, deleteSource, toggleSource } = useLeadSources();

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, color:'#94A3B8', fontSize:14 }}>
      Loading lead sources…
    </div>
  );

  return (
    <LeadSourcesPage
      sources={sources}
      onAdd={addSource}
      onDelete={deleteSource}
      onToggle={toggleSource}
    />
  );
};

export default LeadSourcesPageWrapper;