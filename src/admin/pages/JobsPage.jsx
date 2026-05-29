// JobsPage.jsx — fully responsive for mobile & tablet

import { JOB_STATUS, TECH_STATUS } from '../constants/statusMaps';
import { techsApi, jobsApi } from '../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, PBadge, Avatar, Divider } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
import ActionDropdown from '../components/ui/ActionDropdown';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import EditableDetailView from '../components/ui/EditableDetailView';
import { useTableSearch } from '../hooks/useTableSearch';
import { technicians, customers } from '../data/mockData';
import TableSearchBar from '../components/ui/TableSearchBar';
import FilterSelect from '../components/ui/FilterSelect';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import ExportDropdown from '../components/layout/ExportDropdown';
import useExport from '../hooks/useExport';
import { addToDeleted } from '../store/deletedStore';

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

const FieldLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, color: COLORS.faint,
    textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4,
  }}>
    {children}
  </div>
);

const inputStyle = {
  padding: '7px 10px', borderRadius: 8,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13, color: COLORS.h2,
  background: '#FAFAFA', fontFamily: FONTS.sans,
  width: '100%', outline: 'none',
  transition: 'border-color .15s',
  boxSizing: 'border-box',
};

const JOB_FIELDS = [
  { key: 'customer' }, { key: 'address' }, { key: 'ac' },
  { key: 'issue' },   { key: 'date' },     { key: 'time' },
  { key: 'tech' },    { key: 'type' },     { key: 'priority' },
  { key: 'status' },  { key: 'notes', type: 'textarea' },
];

const JOB_COLUMNS = [
  { label: 'Job ID',     key: 'id',       width: 12, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: COLORS.brand, fontSize: 11 } },
  { label: 'Customer',   key: 'customer', width: 18, tdStyle: { fontWeight: 600 } },
  { label: 'Type',       key: 'type',     width: 12, render: (val) => <TypeTag type={val} />, format: (val) => val },
  { label: 'Issue',      key: 'issue',    width: 20, tdStyle: { fontSize: 12, color: COLORS.muted } },
  { label: 'AC Unit',    key: 'ac',       width: 16, tdStyle: { fontSize: 12 } },
  { label: 'Technician', key: 'tech',     width: 14, tdStyle: { fontSize: 12 } },
  { label: 'Date',       key: 'date',     width: 12, tdStyle: { fontSize: 12, color: COLORS.muted } },
  {
    label: 'Amount', key: 'amount', width: 10, excelKey: 'Amount (₹)',
    render: (val) => <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: COLORS.h2 }}>₹{Number(val).toLocaleString()}</span>,
    format: (val) => val, tdStyle: { fontFamily: 'monospace', fontWeight: 700 },
  },
  {
    label: 'Status', key: 'status', width: 12,
    render: (val) => <SBadge s={val} map={JOB_STATUS} />,
    format: (val) => JOB_STATUS[val]?.label ?? val,
  },
];

// ─── Normalise a raw job from the API ─────────────────────────────────────────
const normaliseJob = (j) => ({
  ...j,
  // ── short human-readable ID: prefer backend jobId, else slice _id ──
  id:       j.jobId || ('JOB-' + String(j._id).slice(-6).toUpperCase()),
  customer: typeof j.customer === 'object' ? j.customer?.name  : (j.customerName || j.customer || ''),
  tech:     typeof j.technician === 'object' ? j.technician?.name : (j.techName || j.tech || 'Unassigned'),
  date:     j.scheduledDate
              ? new Date(j.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : (j.date || ''),
  time:     j.scheduledTime || j.time || '',
  ac:       j.ac || '',
  address:  j.address || (typeof j.customer === 'object' ? j.customer?.address : '') || '',
  amount:   j.amount ?? 0,
});

// ─── JobsPage ─────────────────────────────────────────────────────────────────
const JobsPage = ({ openJob, setOpenJob, openModal }) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [sf, setSf] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [liveTechs, setLiveTechs] = useState(technicians);

  useEffect(() => {
    jobsApi.list({ limit: 200 })
      .then(r => setJobs((r.data ?? []).map(normaliseJob)))
      .catch(() => {});
    techsApi.list({ limit: 200 })
      .then(r => {
        const apiTechs = (r.data ?? []).map(t => ({
          id: t._id, name: t.name,
          status: t.status || 'available',
        }));
        if (apiTechs.length) setLiveTechs(apiTechs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
  if (openJob && parts.length === 0) seedParts();
}, [openJob]); // ← seeds parts when a job detail is opened


  const TECH_OPTIONS = [...new Set(jobs.map(j => j.tech).filter(t => t && t !== 'Unassigned'))].sort();
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [parts, setParts] = useState([]);

  const counts = Object.keys(JOB_STATUS).reduce(
    (a, s) => ({ ...a, [s]: jobs.filter(j => j.status === s).length }), {}
  );

  const handleDelete = async (id) => {
    const item = jobs.find(x => (x._id ?? x.id) === id);
    if (item) addToDeleted({
      id:     item.id ?? item._id,
      name:   item.name ?? item.customer ?? item.id,
      module: 'Job',
      by:     'Admin',
    });
    try {
      await jobsApi.remove(id);
      setJobs(prev => prev.filter(x => (x._id ?? x.id) !== id));
    } catch (e) { alert(e.message); }
  };

  const handleBack = () => { setOpenJob(null); setInitialEditMode(false); };

  // ── Save: re-normalise so ID/dates stay formatted ─────────────────────────
  const handleSave = async (updated) => {
    try {
      const res = await jobsApi.update(updated._id, updated);
      const raw = res.data ?? res;
      const doc = normaliseJob(raw);
      setJobs(prev => prev.map(j => j._id === doc._id ? doc : j));
    } catch (e) { alert(e.message); }
  };

  const seedParts = () => setParts([
    { name: 'R-32 Refrigerant', qty: 1, rate: 2800 },
    { name: 'Capacitor 25µF',   qty: 1, rate: 85 },
  ]);

  const { q, setQ, activeFilters, setFilter, filtered: searchedJobs } = useTableSearch(
    jobs,
    ['id', 'customer', 'address', 'type', 'issue', 'ac', 'tech', 'status'],
    { type: '', tech: '' }
  );

  const filtered = searchedJobs.filter(j => sf === 'all' || j.status === sf);

  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } =
    usePagination(filtered, 10);

  const { exportProps } = useExport({
    title:        'Work Orders',
    filename:     'cooltech-workorders',
    template:     'generic_list',
    subtitle:     `AC Services Platform · Work Orders · ${filtered.length} records`,
    docId:        'JB-EXPORT',
    columns:      JOB_COLUMNS,
    rows:         filtered,
    showTotals:   true,
    totalColumns: ['amount'],
  });

  // ── Detail / Edit view ────────────────────────────────────────────────────
  if (openJob) {
    const job = jobs.find(j => j._id === openJob);

    return (
      <EditableDetailView
        id={job._id}
        breadcrumb="Jobs"
        onBack={handleBack}
        fields={JOB_FIELDS}
        data={{ ...job, notes: '' }}
        initialEditMode={initialEditMode}
        onSave={handleSave}
        onDelete={() => { handleDelete(job._id); setOpenJob(null); }}
      >
        {({ editMode, editData, setEditData }) => {
          const set = (key) => (e) => setEditData(prev => ({ ...prev, [key]: e.target.value }));
          // if (editMode && parts.length === 0) seedParts();

          return (
            <div className="job-detail-grid">

              {/* ── Main card ── */}
              <div style={{
                background: COLORS.white,
                borderRadius: 14,
                border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
                padding: isMobile ? '14px 14px' : '20px',
                boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : '0 1px 4px rgba(0,0,0,.05)',
                transition: 'all .2s',
                minWidth: 0,
                overflow: 'hidden',
              }}>

                {/* ── Header: badges + customer + job ID ── */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {editMode ? (
                      <>
                        <select value={editData.type}     onChange={set('type')}
                          style={{ ...inputStyle, width: 'auto', flex: '1 1 100px' }}>
                          {['Service','Repair','Installation','AMC Visit'].map(t => <option key={t}>{t}</option>)}
                        </select>
                        <select value={editData.priority} onChange={set('priority')}
                          style={{ ...inputStyle, width: 'auto', flex: '1 1 80px' }}>
                          {['Low','Medium','High','Critical'].map(p => <option key={p}>{p}</option>)}
                        </select>
                        <select value={editData.status}   onChange={set('status')}
                          style={{ ...inputStyle, width: 'auto', flex: '1 1 100px' }}>
                          {Object.entries(JOB_STATUS).map(([k, v]) =>
                            <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </>
                    ) : (
                      <>
                        <TypeTag type={job.type} />
                        <PBadge p={job.priority} />
                        <SBadge s={job.status} map={JOB_STATUS} />
                      </>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'flex-start',
                    gap: isMobile ? 6 : 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editMode
                        ? <input value={editData.customer} onChange={set('customer')}
                            style={{ ...inputStyle, fontSize: 18, fontWeight: 800 }} />
                        : <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: COLORS.h1, wordBreak: 'break-word' }}>
                            {job.customer}
                          </div>
                      }
                      <div style={{ marginTop: 5 }}>
                        {editMode
                          ? <input value={editData.address} onChange={set('address')}
                              style={{ ...inputStyle, fontSize: 12 }} />
                          : <div style={{ fontSize: 12, color: COLORS.muted }}>📍 {job.address}</div>
                        }
                      </div>
                    </div>

                    {/* ── Short Job ID in detail header ── */}
                    <div style={{
                      fontFamily: FONTS.mono,
                      fontSize: 11,
                      color: COLORS.muted,
                      textAlign: isMobile ? 'left' : 'right',
                      flexShrink: 0,
                      paddingTop: isMobile ? 0 : 2,
                    }}>
                      <div style={{ fontWeight: 700, color: COLORS.brand, marginBottom: 3 }}>{job.id}</div>
                      <div style={{ whiteSpace: 'nowrap' }}>Created {job.created}</div>
                    </div>
                  </div>
                </div>

                <Divider />

                <div className="job-field-grid" style={{ margin: '14px 0' }}>
                  {editMode
                    ? [['AC Unit','ac'],['Issue','issue'],['Date','date'],['Time','time']].map(([label,key]) => (
                        <div key={key}>
                          <FieldLabel>{label}</FieldLabel>
                          <input value={editData[key]} onChange={set(key)} style={inputStyle} />
                        </div>
                      ))
                    : [['AC Unit',job.ac],['Issue',job.issue],['Scheduled',`${job.date}, ${job.time}`],['Technician',job.tech]].map(([k,v]) => (
                        <div key={k}>
                          <FieldLabel>{k}</FieldLabel>
                          <div style={{ fontSize: 13, color: COLORS.h2, lineHeight: 1.5, wordBreak: 'break-word' }}>{v}</div>
                        </div>
                      ))
                  }
                </div>

                <Divider />

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 8 }}>Service Notes</div>
                  <textarea
                    placeholder="Add work done, observations, parts used…"
                    value={editMode ? editData.notes : undefined}
                    onChange={editMode ? set('notes') : undefined}
                    readOnly={!editMode}
                    style={{
                      width: '100%', padding: '11px 13px', borderRadius: 8,
                      border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.h2,
                      background: editMode ? '#FAFAFA' : '#F9FAFB',
                      resize: 'vertical', minHeight: 80,
                      fontFamily: FONTS.sans, cursor: editMode ? 'text' : 'default',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 8 }}>Parts Used</div>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {(editMode
                      ? parts
                      : [{ name: 'R-32 Refrigerant', qty: 1, rate: 2800 },{ name: 'Capacitor 25µF', qty: 1, rate: 85 }]
                    ).map((p, i) => (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '1fr 60px 70px 34px',
                        gap: 8, alignItems: 'center', padding: '7px 0',
                        borderTop: `1px solid ${COLORS.border}`, minWidth: 260,
                      }}>
                        <input value={p.name} readOnly={!editMode}
                          onChange={editMode ? e => setParts(ps => ps.map((x,j) => j===i?{...x,name:e.target.value}:x)) : undefined}
                          style={{ padding:'6px 9px', borderRadius:7, border:`1px solid ${editMode?COLORS.border:'transparent'}`, fontSize:12, fontFamily:FONTS.sans, background:editMode?'#FAFAFA':'transparent', color:COLORS.h2 }} />
                        <input value={p.qty} readOnly={!editMode}
                          onChange={editMode ? e => setParts(ps => ps.map((x,j) => j===i?{...x,qty:e.target.value}:x)) : undefined}
                          style={{ padding:'6px 9px', borderRadius:7, border:`1px solid ${editMode?COLORS.border:'transparent'}`, fontSize:12, fontFamily:FONTS.mono, textAlign:'center', background:editMode?'#FAFAFA':'transparent', color:COLORS.h2 }} />
                        <input value={p.rate} readOnly={!editMode}
                          onChange={editMode ? e => setParts(ps => ps.map((x,j) => j===i?{...x,rate:e.target.value}:x)) : undefined}
                          style={{ padding:'6px 9px', borderRadius:7, border:`1px solid ${editMode?COLORS.border:'transparent'}`, fontSize:12, fontFamily:FONTS.mono, textAlign:'center', background:editMode?'#FAFAFA':'transparent', color:COLORS.h2 }} />
                        {editMode
                          ? <button onClick={() => setParts(ps => ps.filter((_,j) => j!==i))}
                              style={{ padding:'6px', borderRadius:6, background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', cursor:'pointer', fontSize:11 }}>✕</button>
                          : <div />}
                      </div>
                    ))}
                  </div>
                  {editMode && (
                    <button onClick={() => setParts(ps => [...ps, {name:'',qty:1,rate:0}])}
                      style={{ marginTop:7, fontSize:12, color:COLORS.brand, background:'none', border:`1px dashed ${COLORS.brand}`, borderRadius:7, padding:'6px 14px', cursor:'pointer', fontWeight:600 }}>
                      + Add Part
                    </button>
                  )}
                </div>

                {!editMode && (
                  <div className="job-action-btns" style={{ marginTop: 18 }}>
                    <button className="btn" onClick={() => openModal('new_job')}
                      style={{ flex:'1 1 140px', padding:'11px 12px', borderRadius:10, background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color:'white', fontSize:12, fontWeight:700, boxShadow:`0 4px 12px ${COLORS.brand}40` }}>
                      ✓ Mark Complete
                    </button>
                    <button className="btn" onClick={() => openModal('new_invoice')}
                      style={{ flex:'1 1 100px', padding:'11px 12px', borderRadius:10, background:'#F0F9FF', border:'1px solid #BAE6FD', color:'#0369A1', fontSize:12, fontWeight:700 }}>
                      📄 Invoice
                    </button>
                    <button className="btn" onClick={() => openModal('new_quotation')}
                      style={{ flex:'1 1 100px', padding:'11px 12px', borderRadius:10, background:'#F5F3FF', border:'1px solid #DDD6FE', color:'#7C3AED', fontSize:12, fontWeight:700 }}>
                      📋 Quotation
                    </button>
                    <button className="btn" onClick={() => openModal('mark_attendance')}
                      style={{ flex:'1 1 100px', padding:'11px 12px', borderRadius:10, background:'#FFFBEB', border:'1px solid #FDE68A', color:'#B45309', fontSize:12, fontWeight:700 }}>
                      📅 Reschedule
                    </button>
                    {/* ── Cancel button uses short ID ── */}
                    <button className="btn" onClick={() => openModal('report', { title: `Cancel Job ${job.id}`, format: 'Update' })}
                      style={{ flex:'1 1 80px', padding:'11px 12px', borderRadius:10, background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:12, fontWeight:700 }}>
                      ✕ Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* ── Sidebar ── */}
              <div className="job-detail-sidebar">

                {!editMode && (
                  <div style={{ background:COLORS.white, borderRadius:14, border:`1px solid ${COLORS.border}`, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:COLORS.h1, marginBottom:10 }}>Update Status</div>
                    {['assigned','in_progress','completed','invoiced'].map(s => {
                      const m = JOB_STATUS[s];
                      return (
                        <button key={s} className="btn"
                          onClick={() => openModal('report', { title: `Update status to ${m.label}`, format: 'Update' })}
                          style={{ width:'100%', marginBottom:5, padding:'9px 14px', borderRadius:8, background:m.bg, color:m.color, fontSize:12, fontWeight:700, textAlign:'left', border:`1px solid ${m.color}25` }}>
                          → {m.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={{ background:COLORS.white, borderRadius:14, border:`1px solid ${editMode?COLORS.brand:COLORS.border}`, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,.05)', transition:'border-color .2s' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:COLORS.h1, marginBottom:10 }}>
                    Assign Technician
                    {editMode && <span style={{ fontSize:11, fontWeight:400, color:COLORS.brand, marginLeft:8 }}>← click to assign</span>}
                  </div>
                  {liveTechs.map(t => {
                    const isSelected = editMode ? editData.tech === t.name : job.tech === t.name;
                    return (
                      <div key={t.id}
                        onClick={editMode ? () => setEditData(prev => ({ ...prev, tech: t.name })) : undefined}
                        style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 10px', borderRadius:8, marginBottom:5, background:isSelected?COLORS.brandL:COLORS.bg, border:`1px solid ${isSelected?COLORS.brand:COLORS.border}`, cursor:editMode?'pointer':'default', transition:'all .15s' }}>
                        <Avatar name={t.name} size={26} color={t.status==='available'?'#10B981':COLORS.brand} />
                        <div style={{ flex:1, minWidth:0, fontSize:12, fontWeight:600, color:COLORS.h2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</div>
                        <SBadge s={t.status} map={TECH_STATUS} />
                        {editMode && isSelected && <span style={{ fontSize:11, color:COLORS.brand, fontWeight:700 }}>✓</span>}
                      </div>
                    );
                  })}
                </div>

                <div style={{ background:COLORS.white, borderRadius:14, border:`1px solid ${COLORS.border}`, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:COLORS.h1, marginBottom:10 }}>Cost Summary</div>
                  {[['Labour',1200],['Parts',2885],['Service Charge',500]].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${COLORS.border}`, fontSize:12 }}>
                      <span style={{ color:COLORS.muted }}>{k}</span>
                      <span style={{ fontFamily:FONTS.mono, fontWeight:600, color:COLORS.h2 }}>₹{v.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', fontSize:14, fontWeight:700 }}>
                    <span style={{ color:COLORS.h1 }}>Total (incl. GST)</span>
                    <span style={{ fontFamily:FONTS.mono, color:COLORS.brand }}>₹5,409</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </EditableDetailView>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="fi" style={{ display:'flex', flexDirection:'column', gap:16 }}>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <SectionHdr title="Work Orders" sub={`${total} of ${jobs.length} total jobs`} />
        <div style={{ flexShrink:0 }}>
          <button onClick={() => openModal('new_job')}
            style={{ padding:'8px 16px', borderRadius:8, border:'none', fontSize:13, fontWeight:700, background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color:'white', cursor:'pointer', boxShadow:`0 3px 10px ${COLORS.brand}40` }}>
            + New Job
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:2 }}>
        <div style={{ display:'flex', gap:0, background:COLORS.white, borderRadius:10, border:`1px solid ${COLORS.border}`, padding:3, width:'max-content', minWidth:'100%' }}>
          {[['all','All',jobs.length], ...Object.entries(JOB_STATUS).map(([k,v]) => [k,v.label,counts[k]||0])].map(([k,l,c]) => (
            <button key={k} onClick={() => setSf(k)}
              style={{ padding:isMobile?'6px 8px':'6px 12px', borderRadius:7, fontSize:isMobile?11:12, fontWeight:600, background:sf===k?COLORS.brandL:'transparent', color:sf===k?COLORS.brand:COLORS.muted, border:'none', cursor:'pointer', display:'flex', gap:5, alignItems:'center', whiteSpace:'nowrap', flexShrink:0 }}>
              {l}
              <span style={{ fontSize:10, background:sf===k?`${COLORS.brand}20`:'#F3F4F6', color:sf===k?COLORS.brand:COLORS.faint, padding:'1px 6px', borderRadius:99 }}>{c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div style={{ background:COLORS.white, borderRadius:14, border:`1px solid ${COLORS.border}`, boxShadow:'0 1px 4px rgba(0,0,0,.05)', overflow:'clip' }}>

        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${COLORS.border}`, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ width: isMobile ? '60%' : 'auto' }}>
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by job ID, customer, issue…" />
          </div>
          <FilterSelect value={activeFilters.type} onChange={val => setFilter('type',val)} options={['Service','Repair','Installation','AMC Visit']} allLabel="All Types" />
          <FilterSelect value={activeFilters.tech} onChange={val => setFilter('tech',val)} options={TECH_OPTIONS} allLabel="All Technicians" />
          <div style={{ marginLeft:'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth: 640 }}>
            <Thead cols={['Job ID','Customer','Type','Issue / AC','Technician','Date','Amount','Status','']} />
            <tbody>
              {paginated.map((job, i) => (
                <tr key={job._id} className="row"
                  onClick={() => { setInitialEditMode(false); setOpenJob(job._id); }}
                  style={{ borderBottom:`1px solid ${COLORS.border}22`, background:i%2===0?COLORS.white:'#FAFAFA', cursor:'pointer' }}>
                  {/* ── Short Job ID ── */}
                  <td style={{ padding:'13px 14px' }}>
                    <span style={{ fontFamily:FONTS.mono, fontSize:12, fontWeight:600, color:COLORS.brand }}>{job.id}</span>
                  </td>
                  <td style={{ padding:'13px 14px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:COLORS.h1 }}>{job.customer}</div>
                    <div style={{ fontSize:11, color:COLORS.faint, marginTop:2 }}>{job.address.split(',')[0]}</div>
                  </td>
                  <td style={{ padding:'13px 14px' }}><TypeTag type={job.type} /></td>
                  <td style={{ padding:'13px 14px' }}>
                    <div style={{ fontSize:12, color:COLORS.body, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.issue}</div>
                    <div style={{ fontSize:11, color:COLORS.faint, marginTop:2 }}>{job.ac}</div>
                  </td>
                  <td style={{ padding:'13px 14px' }}>
                    {job.tech === 'Unassigned'
                      ? <span style={{ fontSize:12, color:'#DC2626', fontWeight:600 }}>⚠ Unassigned</span>
                      : <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <Avatar name={job.tech} size={24} />
                          <span style={{ fontSize:12 }}>{job.tech}</span>
                        </div>}
                  </td>
                  <td style={{ padding:'13px 14px' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:COLORS.h2 }}>{job.date}</div>
                    <div style={{ fontSize:11, color:COLORS.faint, fontFamily:FONTS.mono }}>{job.time}</div>
                  </td>
                  <td style={{ padding:'13px 14px' }}>
                    <span style={{ fontFamily:FONTS.mono, fontSize:13, fontWeight:700, color:COLORS.h2 }}>₹{job.amount.toLocaleString()}</span>
                  </td>
                  <td style={{ padding:'13px 14px' }}><SBadge s={job.status} map={JOB_STATUS} /></td>
                  <td style={{ padding:'13px 14px' }} onClick={e => e.stopPropagation()}>
                    <ActionDropdown
                      onView  ={() => { setInitialEditMode(false); setOpenJob(job._id); }}
                      onEdit  ={() => { setInitialEditMode(true);  setOpenJob(job._id); }}
                      onDelete={() => setDeleteTarget(job._id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} setPage={setPage}
          pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        message="This work order will be deleted permanently."
      />
    </div>
  );
};

export default JobsPage;