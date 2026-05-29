// LeadsPage.jsx — fully responsive for mobile & tablet

import { leadsApi } from '../../services/api';
import { useState, useRef, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import EditableDetailView from '../../components/ui/EditableDetailView';
import TableSearchBar from '../../components/ui/TableSearchBar';
import { useTableSearch } from '../../hooks/useTableSearch';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { LEAD_ACTIVITIES } from '../../data/mockData';

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

// ─── Local constants ──────────────────────────────────────────────────────────
const LEAD_STAGES = {
  new:           { label: 'New',           color: '#3B82F6', bg: '#EFF6FF' },
  follow_up:     { label: 'Follow Up',     color: '#F59E0B', bg: '#FFFBEB' },
  proposal_sent: { label: 'Proposal Sent', color: '#8B5CF6', bg: '#F5F3FF' },
  negotiation:   { label: 'Negotiation',   color: '#EA580C', bg: '#FFF7ED' },
  won:           { label: 'Won',           color: '#16A34A', bg: '#F0FDF4' },
  lost:          { label: 'Lost',          color: '#DC2626', bg: '#FEF2F2' },
};

const stageOrder = ['new', 'follow_up', 'proposal_sent', 'negotiation', 'won', 'lost'];
const ACT_ICONS  = { call: '📞', email: '📧', whatsapp: '💬', visit: '🚗', note: '📝', quote: '📄' };

const SOURCE_OPTIONS = [...new Set([].map(l => l.source).filter(Boolean))].sort();
const TYPE_OPTIONS   = [...new Set([].map(l => l.type).filter(Boolean))].sort();

// ─── Export column config ─────────────────────────────────────────────────────
const LEAD_COLUMNS = [
  { label: 'Lead ID',      key: 'id',          width: 12, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: '#EA580C', fontSize: 11 } },
  { label: 'Company',      key: 'name',         width: 20, tdStyle: { fontWeight: 600 } },
  { label: 'Contact',      key: 'contact',      width: 16, tdStyle: { fontSize: 12 } },
  { label: 'Phone',        key: 'phone',        width: 14, tdStyle: { fontFamily: 'monospace', fontSize: 11 } },
  { label: 'Type',         key: 'type',         width: 12, render: (val) => <TypeTag type={val} />, format: (val) => val },
  { label: 'Stage',        key: 'stage',        width: 14, render: (val) => <SBadge s={val} map={LEAD_STAGES} />, format: (val) => LEAD_STAGES[val]?.label ?? val },
  { label: 'Source',       key: 'source',       width: 14, tdStyle: { fontSize: 12, color: COLORS.muted } },
  { label: 'Value',        key: 'value',        width: 12, excelKey: 'Value (₹)', render: (val) => <span style={{ fontFamily: FONTS.mono, fontWeight: 800, color: '#EA580C' }}>₹{Number(val).toLocaleString()}</span>, format: (val) => val, tdStyle: { fontFamily: 'monospace', fontWeight: 800, color: '#EA580C' } },
  { label: 'Assigned',     key: 'assignedTo',   width: 14, tdStyle: { fontSize: 12 } },
  { label: 'Last Contact', key: 'lastContact',  width: 12, tdStyle: { fontSize: 12, color: COLORS.muted } },
];

// ─── ScoreBadge ───────────────────────────────────────────────────────────────
const ScoreBadge = ({ score, temp }) => {
  const tempColor = { hot: '#DC2626', warm: '#F59E0B', cold: '#3B82F6' }[temp] || COLORS.muted;
  const tempBg    = { hot: '#FEF2F2', warm: '#FFFBEB', cold: '#EFF6FF' }[temp] || COLORS.bg;
  const tempIcon  = { hot: '🔥', warm: '☀️', cold: '❄️' }[temp] || '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800, color: COLORS.h1 }}>{score}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: tempBg, color: tempColor }}>{tempIcon} {temp}</span>
    </div>
  );
};

// ─── LeadDetail ───────────────────────────────────────────────────────────────
const LeadDetail = ({ lead, onBack, onSave, onDelete, openModal, initialEditMode }) => {
  const { isMobile, isTablet } = useBreakpoint();

  const inputStyle = (extra = {}) => ({
    padding: '6px 10px', borderRadius: 7, border: `1.5px solid ${COLORS.border}`,
    fontSize: 12, color: COLORS.h2, background: '#FAFAFA',
    fontFamily: FONTS.sans, outline: 'none', width: '100%',
    boxSizing: 'border-box', ...extra,
  });

  const sidebar = (
    <>
      {/* Move Stage */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Move Stage</div>
        {stageOrder.map(s => {
          const m = LEAD_STAGES[s];
          return (
            <button key={s} className="btn"
              onClick={() => openModal('report', { title: `Move to ${m.label}`, format: 'Update' })}
              style={{ width: '100%', marginBottom: 5, padding: '9px 14px', borderRadius: 8, background: lead.stage === s ? m.bg : '#F9FAFB', color: lead.stage === s ? m.color : COLORS.muted, fontSize: 12, fontWeight: lead.stage === s ? 700 : 500, textAlign: 'left', border: `1px solid ${lead.stage === s ? m.color + '30' : COLORS.border}`, cursor: 'pointer' }}>
              {lead.stage === s ? '● ' : '○ '}{m.label}
            </button>
          );
        })}
      </div>

      {/* Contact Info */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)', width: '100%' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Contact Info</div>
        {[['Contact', lead.contact], ['Phone', lead.phone], ['Email', lead.email], ['Assigned', lead.assignedTo]].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, gap: 8 }}>
            <span style={{ color: COLORS.muted, flexShrink: 0 }}>{k}</span>
            <span style={{ fontWeight: 600, color: COLORS.h2, textAlign: 'right', wordBreak: 'break-word' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Schedule Follow-up */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Schedule Follow-up</div>
        <input type="date" defaultValue="2026-03-10" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, marginBottom: 8, boxSizing: 'border-box' }} />
        <select style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, background: COLORS.white, color: COLORS.body, marginBottom: 8, boxSizing: 'border-box' }}>
          <option>📞 Call</option><option>💬 WhatsApp</option><option>📧 Email</option><option>🏠 Site Visit</option>
        </select>
        <button className="btn" onClick={() => openModal('set_reminder')}
          style={{ width: '100%', padding: '9px', borderRadius: 8, background: '#FFF7ED', border: `1px solid #EA580C30`, color: '#EA580C', fontSize: 12, fontWeight: 700 }}>
          Set Reminder
        </button>
      </div>
    </>
  );

  const activityAndActions = (
    <>
      {/* Activity Log */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Activity Log</div>
        {(LEAD_ACTIVITIES[lead.id] || [{ date: '—', by: 'Admin', note: 'No activity yet.', type: 'note' }]).map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `${COLORS.brand}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 1 }}>
              {ACT_ICONS[a.type] || '📝'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: COLORS.h2, wordBreak: 'break-word' }}>{a.note}</div>
              <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 2 }}>{a.by}</div>
            </div>
            <div style={{ fontSize: 11, color: COLORS.faint, flexShrink: 0, fontFamily: FONTS.mono }}>{a.date}</div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <select style={{ padding: '7px 10px', borderRadius: 7, border: `1px solid ${COLORS.border}`, fontSize: 12, background: COLORS.white, color: COLORS.body, flex: '0 0 auto' }}>
            <option>📞 Call</option><option>📧 Email</option><option>💬 WhatsApp</option><option>🚗 Visit</option><option>📝 Note</option>
          </select>
          <textarea placeholder="Add follow-up note…"
            style={{ flex: '1 1 160px', padding: '9px 12px', borderRadius: 7, border: `1px solid ${COLORS.border}`, fontSize: 12, fontFamily: FONTS.sans, color: COLORS.h2, background: COLORS.bg, resize: 'none', height: 55, boxSizing: 'border-box' }} />
          <button className="btn" onClick={() => openModal('set_reminder')}
            style={{ padding: '8px 14px', borderRadius: 7, background: COLORS.brand, color: 'white', fontSize: 12, fontWeight: 700, border: 'none', alignSelf: 'flex-end' }}>Log</button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => openModal('new_quotation')}
          style={{ flex: '1 1 120px', padding: '11px', borderRadius: 9, background: `linear-gradient(135deg,#EA580C,#C2410C)`, color: 'white', fontSize: 13, fontWeight: 700, border: 'none', justifyContent: 'center' }}>
          📄 Create Quote
        </button>
        <button className="btn" onClick={() => openModal('report', { title: `Mark ${lead.id} as Won`, format: 'Update' })}
          style={{ flex: '1 1 80px', padding: '11px 16px', borderRadius: 9, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: 13, fontWeight: 700, justifyContent: 'center' }}>
          ✓ Won
        </button>
        <button className="btn" onClick={() => openModal('report', { title: `Mark ${lead.id} as Lost`, format: 'Update' })}
          style={{ flex: '1 1 80px', padding: '11px 16px', borderRadius: 9, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, fontWeight: 700, justifyContent: 'center' }}>
          ✗ Lost
        </button>
      </div>
    </>
  );

  const fieldKeys   = ['contact', 'phone', 'email', 'units', 'source', 'assignedTo'];
  const fieldLabels = { contact: 'Contact', phone: 'Phone', email: 'Email', units: 'Units', source: 'Source', assignedTo: 'Assigned To' };

  const fields = [
    { key: 'stage' }, { key: 'type' }, { key: 'name' }, { key: 'address' },
    { key: 'value' }, { key: 'contact' }, { key: 'phone' }, { key: 'email' },
    { key: 'units' }, { key: 'source' }, { key: 'assignedTo' }, { key: 'notes' },
  ];

  return (
    <EditableDetailView
      id={lead.id}
      breadcrumb="Leads"
      onBack={onBack}
      fields={fields}
      data={lead}
      initialEditMode={initialEditMode}
      onSave={onSave}
      onDelete={() => onDelete(lead.id)}
    >
      {({ editMode, editData, setEditData }) => {
        const val  = (key) => editData[key] ?? lead[key] ?? '';
        const setK = (key) => (e) => setEditData(p => ({ ...p, [key]: e.target.value }));

        const editSidebar = (
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.brand}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>
              Contact Info <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.brand }}>← editable</span>
            </div>
            {[['Contact', 'contact'], ['Phone', 'phone'], ['Email', 'email'], ['Assigned To', 'assignedTo']].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{label}</div>
                <input value={val(key)} onChange={setK(key)} style={inputStyle()} />
              </div>
            ))}
          </div>
        );

        // isDesktop derived from hook (not destructured above in this scope)
        const isDesktop = !isMobile && !isTablet;

        // Responsive detail grid
        const detailGridStyle = {
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 300px' : '1fr',
          gap: isMobile ? 12 : 16,
          minWidth: 0,
        };

        // Sidebar layout: 2-col on tablet, 1-col on mobile & desktop
        const sidebarStyle = {
          display: isTablet ? 'grid' : 'flex',
          gridTemplateColumns: isTablet ? '1fr 1fr' : undefined,
          flexDirection: isTablet ? undefined : 'column',
          gap: 12,
          alignItems: 'start',
          minWidth: 0,
        };

        return (
          <div style={detailGridStyle}>

            {/* ── Main card ── */}
            <div style={{
              background: COLORS.white,
              borderRadius: 14,
              border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
              padding: isMobile ? '14px 14px' : '20px 24px',
              boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : '0 1px 4px rgba(0,0,0,.05)',
              transition: 'all .2s',
              minWidth: 0,
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}>

              {/* Badges row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {editMode ? (
                  <>
                    <select value={val('stage')} onChange={setK('stage')} style={{ padding: '6px 10px', borderRadius: 7, border: `1.5px solid ${COLORS.border}`, fontSize: 13, background: '#FAFAFA', fontFamily: FONTS.sans, outline: 'none', flex: '1 1 120px' }}>
                      {stageOrder.map(s => <option key={s} value={s}>{LEAD_STAGES[s].label}</option>)}
                    </select>
                    <select value={val('type')} onChange={setK('type')} style={{ padding: '6px 10px', borderRadius: 7, border: `1.5px solid ${COLORS.border}`, fontSize: 13, background: '#FAFAFA', fontFamily: FONTS.sans, outline: 'none', flex: '1 1 100px' }}>
                      {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </>
                ) : (
                  <><SBadge s={lead.stage} map={LEAD_STAGES} /><TypeTag type={lead.type} /></>
                )}
              </div>

              {/* Company name + value */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-start',
                gap: isMobile ? 8 : 16,
                marginBottom: 20,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editMode
                    ? <input value={val('name')} onChange={setK('name')} style={inputStyle({ fontSize: isMobile ? 16 : 18, fontWeight: 800, marginBottom: 6 })} />
                    : <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: COLORS.h1 }}>{lead.name}</div>
                  }
                  {editMode
                    ? <input value={val('address')} onChange={setK('address')} placeholder="Address" style={inputStyle({ marginTop: 6 })} />
                    : <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>📍 {lead.address}</div>
                  }
                </div>
                <div style={{ textAlign: isMobile ? 'left' : 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Potential Value</div>
                  {editMode
                    ? <input value={val('value')} type="number" onChange={setK('value')} style={inputStyle({ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono, textAlign: isMobile ? 'left' : 'right', width: isMobile ? '100%' : 160 })} />
                    : <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono }}>₹{lead.value.toLocaleString()}</div>
                  }
                </div>
              </div>

              {/* Fields grid — 2-col on sm+, 1-col on mobile */}
              <div className="job-field-grid" style={{ marginBottom: 20 }}>
                {fieldKeys.map(key => (
                  <div key={key}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{fieldLabels[key]}</div>
                    {editMode
                      ? <input value={val(key)} onChange={setK(key)} style={inputStyle()} />
                      : <div style={{ fontSize: 13, color: COLORS.h2, wordBreak: 'break-word' }}>{lead[key]}</div>
                    }
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Lead Score</div>
                  <ScoreBadge score={lead.score} temp={lead.temp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Touchpoints</div>
                  <div style={{ fontSize: 13, color: COLORS.h2 }}>📞{lead.calls} · 📧{lead.emails} · 🚗{lead.visits}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Created</div>
                  <div style={{ fontSize: 13, color: COLORS.h2 }}>{lead.created}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Last Contact</div>
                  <div style={{ fontSize: 13, color: COLORS.h2 }}>{lead.lastContact}</div>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 8 }}>Notes</div>
                {editMode
                  ? <textarea value={val('notes')} onChange={setK('notes')} style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: `1.5px solid ${COLORS.brand}`, fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h2, background: '#FAFAFA', resize: 'vertical', minHeight: 75, outline: 'none', boxSizing: 'border-box' }} />
                  : <textarea defaultValue={lead.notes} readOnly style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h2, background: '#FAFAFA', resize: 'vertical', minHeight: 75, boxSizing: 'border-box' }} />
                }
              </div>

              {!editMode && activityAndActions}
            </div>

            {/* ── Sidebar ── */}
            <div style={sidebarStyle}>
              {editMode ? editSidebar : sidebar}
            </div>

          </div>
        );
      }}
    </EditableDetailView>
  );
};

// ─── LeadsPage ────────────────────────────────────────────────────────────────
const LeadsPage = ({ openModal }) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [view, setView]                       = useState('table');
  const [open, setOpen]                       = useState(null);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [leads, setLeads]                     = useState([]);

  const [draggingId,    setDraggingId]    = useState(null);
  const [dragOverCol,   setDragOverCol]   = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const dragGhost = useRef(null);

  // ── Normalise backend lead → UI shape ──────────────────────────────────────
  const normaliseLead = (l) => ({
    ...l,
    id:          l.leadId || l._id,
    value:       l.value       ?? 0,
    score:       l.score       ?? 0,
    calls:       l.calls       ?? 0,
    emails:      l.emails      ?? 0,
    visits:      l.visits      ?? 0,
    activities:  Array.isArray(l.activities) ? l.activities : [],
    lastContact: l.lastContact
      ? new Date(l.lastContact).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
  });

  // ── Fetch leads from backend ───────────────────────────────────────────────
  const fetchLeads = () => {
    leadsApi.list({ limit: 200 })
      .then(r => setLeads((r.data ?? []).map(normaliseLead)))
      .catch(() => {});
  };

  useEffect(() => {
    fetchLeads();
    // Refetch when window regains focus (catches modal-created leads)
    window.addEventListener('focus', fetchLeads);
    return () => window.removeEventListener('focus', fetchLeads);
  }, []);

  const totalPipeline = leads.filter(l => !['won', 'lost'].includes(l.stage)).reduce((s, l) => s + (l.value || 0), 0);
  const wonValue      = leads.filter(l => l.stage === 'won').reduce((s, l) => s + (l.value || 0), 0);
  const lead          = open ? leads.find(l => l.id === open || l._id === open) : null;

  const handleSave = async (updated) => {
    try {
      const mongoId = leads.find(l => l.id === (updated.id || open))?._id || updated._id;
      const doc = await leadsApi.update(mongoId, updated);
      setLeads(prev => prev.map(l => l._id === doc._id ? normaliseLead(doc) : l));
    } catch {
      setLeads(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
    }
  };
  const handleDelete = async (id) => {
    try {
      const mongoId = leads.find(l => l.id === id || l._id === id)?._id || id;
      await leadsApi.remove(mongoId);
    } catch { /* optimistic */ }
    setLeads(prev => prev.filter(l => l.id !== id && l._id !== id));
    setOpen(null);
  };
  const handleBack   = ()        => { setOpen(null); setInitialEditMode(false); };

  const { q, setQ, activeFilters, setFilter, filtered: searchedLeads } = useTableSearch(
    leads,
    ['id', 'name', 'contact', 'phone', 'email', 'address', 'type', 'source', 'stage', 'assignedTo', 'notes'],
    { type: '', stage: '' }
  );

  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } =
    usePagination(searchedLeads, 10);

  const { exportProps } = useExport({
    title:        'Leads & CRM',
    filename:     'cooltech-leads',
    template:     'generic_list',
    subtitle:     `AC Services Platform · Leads · ${searchedLeads.length} records`,
    docId:        'LD-EXPORT',
    columns:      LEAD_COLUMNS,
    rows:         searchedLeads,
    summaryPills: [
      { label: 'Total Leads', value: searchedLeads.length },
      { label: 'Won',         value: searchedLeads.filter(l => l.stage === 'won').length },
      { label: 'Pipeline',    value: `₹${searchedLeads.filter(l => !['won','lost'].includes(l.stage)).reduce((s,l) => s+l.value, 0).toLocaleString()}` },
      { label: 'Total Value', value: `₹${searchedLeads.reduce((s,l) => s+l.value, 0).toLocaleString()}` },
    ],
    showTotals:   true,
    totalColumns: ['value'],
  });

  // ── Kanban drag handlers ──────────────────────────────────────────────────
  const handleDragStart = (e, leadId) => {
    setDraggingId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
    const el = e.currentTarget, rect = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.style.cssText = `position:fixed;top:-1000px;left:-1000px;width:${rect.width}px;opacity:.85;transform:rotate(2deg) scale(1.02);box-shadow:0 12px 32px rgba(0,0,0,.18);border-radius:10px;pointer-events:none;z-index:9999;`;
    document.body.appendChild(ghost);
    dragGhost.current = ghost;
    e.dataTransfer.setDragImage(ghost, rect.width / 2, 30);
  };

  const handleDragEnd = () => {
    setDraggingId(null); setDragOverCol(null); setDropIndicator(null);
    if (dragGhost.current) { document.body.removeChild(dragGhost.current); dragGhost.current = null; }
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: targetStage } : l));
      const mongoId = leads.find(l => l.id === id)?._id;
      if (mongoId) leadsApi.update(mongoId, { stage: targetStage }).catch(() => {});
    }
    setDraggingId(null); setDragOverCol(null); setDropIndicator(null);
  };

  // ── Detail view ───────────────────────────────────────────────────────────
  if (lead) {
    return (
      <LeadDetail
        lead={lead}
        onBack={handleBack}
        onSave={handleSave}
        onDelete={handleDelete}
        openModal={openModal}
        initialEditMode={initialEditMode}
      />
    );
  }

  // ── List / Kanban view ────────────────────────────────────────────────────
  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <SectionHdr title="Leads & CRM" sub={`${total} of ${leads.length} leads`} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 1, background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: 3 }}>
            {[['table','Table'],['kanban','Kanban']].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)}
                style={{ padding: isMobile ? '5px 10px' : '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: view===k ? COLORS.white : 'transparent', color: view===k ? COLORS.h1 : COLORS.muted, border: `1px solid ${view===k ? COLORS.border : 'transparent'}`, cursor: 'pointer' }}>
                {l}
              </button>
            ))}
          </div>
          <button className="btn"
            style={{ padding: isMobile ? '8px 14px' : '9px 22px', borderRadius: 9, background: `linear-gradient(135deg,#EA580C,#C2410C)`, color: 'white', fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px #EA580C40` }}
            onClick={() => openModal('new_lead')}>
            + New Lead
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="quot-kpi-grid">
        <KCard label="Pipeline Value" value={`₹${(totalPipeline/1000).toFixed(0)}K`} sub="active leads"   icon="🎯" iconBg="#FFF7ED" color="#EA580C" delay="" />
        <KCard label="Won This Month" value={`₹${(wonValue/1000).toFixed(0)}K`}      sub={`${leads.filter(l=>l.stage==='won').length} closed`} icon="🏆" iconBg="#F0FDF4" color="#16A34A" delay="1" />
        <KCard label="Open Leads"     value={leads.filter(l=>!['won','lost'].includes(l.stage)).length} sub="in progress" icon="📊" iconBg="#EFF6FF" color="#0369A1" delay="2" />
        <KCard label="Conversion"     value="42%" sub="to customer" icon="📈" iconBg="#F5F3FF" color="#7C3AED" delay="3" />
      </div>

      {/* ── Kanban ── */}
      {view === 'kanban' ? (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: isMobile ? 900 : 'auto' }}>
            {stageOrder.map(stage => {
              const m = LEAD_STAGES[stage], sl = leads.filter(l => l.stage === stage), isOver = dragOverCol === stage;
              return (
                <div key={stage}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCol(stage); }}
                  onDrop={e => handleDrop(e, stage)}
                  style={{ minWidth: isMobile ? 160 : 200, flex: '1 1 0', background: isOver ? m.bg : '#F9FAFB', borderRadius: 12, border: `2px ${isOver ? 'dashed' : 'solid'} ${isOver ? m.color : COLORS.border}`, padding: 10, flexShrink: 0, transition: 'background .15s, border-color .15s', minHeight: 120 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{m.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: m.bg, color: m.color }}>{sl.length}</span>
                  </div>
                  {sl.length === 0 && isOver && (
                    <div style={{ border: `2px dashed ${m.color}60`, borderRadius: 8, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>Drop here</span>
                    </div>
                  )}
                  {sl.map((l, idx) => {
                    const isDragging = draggingId === l.id;
                    return (
                      <div key={l.id}>
                        {isOver && dropIndicator?.col === stage && dropIndicator?.index === idx && !isDragging && (
                          <div style={{ height: 3, borderRadius: 99, background: m.color, marginBottom: 4 }} />
                        )}
                        <div draggable
                          onDragStart={e => handleDragStart(e, l.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDropIndicator({ col: stage, index: idx }); }}
                          onClick={() => !isDragging && setOpen(l.id)}
                          className="card"
                          style={{ background: COLORS.white, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: '10px 11px', marginBottom: 7, cursor: isDragging ? 'grabbing' : 'grab', boxShadow: isDragging ? 'none' : '0 1px 3px rgba(0,0,0,.05)', opacity: isDragging ? 0.3 : 1, transform: isDragging ? 'scale(0.97)' : 'scale(1)', transition: 'opacity .15s, transform .15s', userSelect: 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1 }}>{l.name}</div>
                            <div style={{ fontSize: 10, color: COLORS.faint, letterSpacing: 1, paddingLeft: 4, flexShrink: 0 }}>⠿</div>
                          </div>
                          <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 5 }}>{l.contact} · {l.units}u</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', fontFamily: FONTS.mono }}>₹{(l.value ?? 0).toLocaleString()}</span>
                            <span style={{ fontSize: 9, color: COLORS.faint, padding: '1px 5px', background: COLORS.bg, borderRadius: 4, border: `1px solid ${COLORS.border}` }}>{l.source}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isOver && dropIndicator?.col === stage && dropIndicator?.index === sl.length && sl.length > 0 && (
                    <div style={{ height: 3, borderRadius: 99, background: m.color, marginTop: -4 }} />
                  )}
                  {sl.length === 0 && !isOver && (
                    <div style={{ fontSize: 11, color: COLORS.faint, textAlign: 'center', padding: '16px 0' }}>Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (

        /* ── Table ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>

            {/* Search + filters */}
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

              {/* Full-width search bar on mobile */}
              <div style={{ flex: isMobile ? '0 0 100%' : '1 1 180px', minWidth: isMobile ? '100%' : 140 }}>
                <TableSearchBar
                  value={q}
                  onChange={setQ}
                  placeholder="Search by name, contact, phone, source…"
                />
              </div>

              <FilterSelect
                value={activeFilters.type}
                onChange={val => setFilter('type', val)}
                options={TYPE_OPTIONS}
                allLabel="All Types"
              />
              <FilterSelect
                value={activeFilters.stage}
                onChange={val => setFilter('stage', val)}
                options={stageOrder}
                allLabel="All Stages"
              />
              <div style={{ marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : 'auto' }}>
                <ExportDropdown {...exportProps} />
              </div>
            </div>

            {/* Table — always horizontally scrollable */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <Thead cols={['ID', 'Company', 'Contact', 'Type', 'Units', 'Source', 'Value', 'Score', 'Assigned', 'Stage', 'Last Contact', '']} />
                <tbody>
                  {paginated.map((l, i) => (
                    <tr key={l.id} className="row"
                      onClick={() => { setInitialEditMode(false); setOpen(l.id); }}
                      style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i%2===0 ? COLORS.white : '#FAFAFA', cursor: 'pointer' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: '#EA580C' }}>{l.id}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.faint }}>{(l.address || '').split(',')[0]}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, color: COLORS.body }}>{l.contact}</div>
                        <div style={{ fontSize: 11, color: COLORS.faint, fontFamily: FONTS.mono }}>{l.phone}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}><TypeTag type={l.type} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>{l.units}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{l.source}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: '#EA580C' }}>₹{(l.value ?? 0).toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}><ScoreBadge score={l.score} temp={l.temp} /></td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.body }}>{l.assignedTo}</td>
                      <td style={{ padding: '12px 14px' }}><SBadge s={l.stage} map={LEAD_STAGES} /></td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{l.lastContact}</td>
                      <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                        <ActionDropdown
                          onView  ={() => { setInitialEditMode(false); setOpen(l.id); }}
                          onEdit  ={() => { setInitialEditMode(true);  setOpen(l.id); }}
                          onDelete={() => setDeleteTarget(l.id)}
                        />
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>
                        No leads match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page} totalPages={totalPages} setPage={setPage}
              pageSize={pageSize} setPageSize={setPageSize}
              from={from} to={to} total={total}
            />
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => { handleDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        message="This lead will be removed permanently."
      />
    </div>
  );
};

export default LeadsPage;