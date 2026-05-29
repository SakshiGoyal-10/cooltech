import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { Avatar } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import EditableDetailView from '../../components/ui/EditableDetailView';
import { gaslogApi } from '../../services/api';

// ─── Column config for export ─────────────────────────────────────────────────
const GASLOG_COLUMNS = [
  { label: 'Log ID',        key: 'id',            width: 12, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: '#F97316', fontSize: 11 } },
  { label: 'Job',           key: 'job',            width: 12, tdStyle: { fontFamily: 'monospace', color: '#0369A1' } },
  { label: 'Technician',    key: 'tech',           width: 18, tdStyle: { fontWeight: 600 } },
  { label: 'Customer',      key: 'customer',       width: 20, tdStyle: { fontWeight: 600 } },
  { label: 'Date',          key: 'date',           width: 14, tdStyle: { fontFamily: 'monospace', fontSize: 12 } },
  { label: 'Gas Type',      key: 'gasType',        width: 12, tdStyle: { fontFamily: 'monospace', fontWeight: 700 } },
  { label: 'Cylinders',     key: 'cylinders',      width: 10, tdStyle: { fontFamily: 'monospace', textAlign: 'center' } },
  { label: 'Kg Used',       key: 'kgUsed',         width: 10, format: v => `${v} kg`, tdStyle: { fontFamily: 'monospace', fontWeight: 700 } },
  { label: 'Kg Recovered',  key: 'kgRecovered',    width: 10, format: v => v ? `${v} kg` : '—' },
  { label: 'Reason',        key: 'reason',         width: 24, tdStyle: { fontSize: 12 } },
  { label: 'Leak Test',     key: 'leakTest',       width: 10, format: v => v ? 'Pass' : 'Fail' },
  { label: 'Certification', key: 'certification',  width: 18, tdStyle: { fontFamily: 'monospace', fontSize: 11 } },
  { label: 'Compliant',     key: 'compliant',      width: 10, format: v => v ? 'Yes' : 'No' },
];

// ─── SectionDivider ───────────────────────────────────────────────────────────
const SectionDivider = ({ title, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 800, color: COLORS.h1,
    textTransform: 'uppercase', letterSpacing: 0.5,
    borderBottom: `2px solid ${COLORS.brand}22`,
    paddingBottom: 8, marginTop: 24, marginBottom: 14,
  }}>
    {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
    {title}
  </div>
);

// ─── DetailRow ────────────────────────────────────────────────────────────────
const DetailRow = ({ label, value, highlight, mono, warn }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 3,
    padding: '10px 14px', borderRadius: 8,
    background: warn ? '#FFF7ED' : highlight ? `${COLORS.brand}08` : '#F9FAFB',
    border: `1px solid ${warn ? '#FED7AA' : highlight ? COLORS.brand + '30' : COLORS.border}`,
  }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: warn ? '#9A3412' : COLORS.faint, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
      {label}
    </span>
    <span style={{
      fontSize: 13, fontWeight: 600,
      color: warn ? COLORS.brand : highlight ? COLORS.brand : COLORS.h2,
      fontFamily: mono ? FONTS.mono : FONTS.sans,
    }}>
      {value ?? <span style={{ color: COLORS.muted, fontWeight: 400 }}>—</span>}
    </span>
  </div>
);

// ─── GasLogDetailView ─────────────────────────────────────────────────────────
const GasLogDetailView = ({ log, onBack, onSave }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [editMode,  setEditMode]  = useState(false);
  const [editData,  setEditData]  = useState({});

  const d = editMode ? { ...log, ...editData } : log;
  const isComp = d.compliant !== false;

  const TABS = [
    { key: 'details',    label: 'Gas Details',  icon: '🧪' },
    { key: 'compliance', label: 'Compliance',   icon: '✅' },
    { key: 'notes',      label: 'Notes',        icon: '📝' },
  ];

  const set     = key => e => setEditData(p => ({ ...p, [key]: e.target.value }));
  const setBool = key => e => setEditData(p => ({ ...p, [key]: e.target.value === 'true' }));

  const inputBase = {
    padding: '7px 10px', borderRadius: 7,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 13, color: COLORS.h2, background: '#FAFAFA',
    fontFamily: FONTS.sans, width: '100%', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color .15s',
  };

  const tabBar = (
    <div style={{ display: 'flex', gap: 2, borderBottom: `2px solid ${COLORS.border}`, marginBottom: 20 }}>
      {TABS.map(t => (
        <button
          key={t.key}
          onClick={() => setActiveTab(t.key)}
          style={{
            padding: '9px 18px', fontSize: 13, fontWeight: 600,
            fontFamily: FONTS.sans, cursor: 'pointer', border: 'none',
            borderBottom: activeTab === t.key ? `2px solid ${COLORS.brand}` : '2px solid transparent',
            marginBottom: -2,
            background: 'transparent',
            color: activeTab === t.key ? COLORS.brand : COLORS.muted,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'color .15s',
          }}
        >
          <span style={{ fontSize: 14 }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );

  const Cell = ({ fKey, label, highlight, mono, warn, type = 'text', options, boolOptions }) => {
    const rawVal = d[fKey];
    if (!editMode) {
      let displayVal = rawVal;
      if (boolOptions) displayVal = rawVal == null ? null : rawVal ? boolOptions[0] : boolOptions[1];
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 3,
          padding: '10px 14px', borderRadius: 8,
          background: warn ? '#FFF7ED' : highlight ? `${COLORS.brand}08` : '#F9FAFB',
          border: `1px solid ${warn ? '#FED7AA' : highlight ? COLORS.brand + '30' : COLORS.border}`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: warn ? '#9A3412' : COLORS.faint, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: warn ? COLORS.brand : highlight ? COLORS.brand : COLORS.h2, fontFamily: mono ? FONTS.mono : FONTS.sans }}>
            {displayVal ?? <span style={{ color: COLORS.muted, fontWeight: 400 }}>—</span>}
          </span>
        </div>
      );
    }
    if (type === 'select') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
          <select value={editData[fKey] ?? log[fKey] ?? ''} onChange={set(fKey)} style={{ ...inputBase, cursor: 'pointer' }}>
            {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    if (boolOptions) {
      const cur = editData[fKey] !== undefined ? editData[fKey] : log[fKey];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
          <select value={String(cur ?? '')} onChange={setBool(fKey)} style={{ ...inputBase, cursor: 'pointer' }}>
            <option value="">—</option>
            <option value="true">{boolOptions[0]}</option>
            <option value="false">{boolOptions[1]}</option>
          </select>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <input type={type} value={editData[fKey] ?? log[fKey] ?? ''} onChange={set(fKey)}
          style={{ ...inputBase, fontFamily: mono ? FONTS.mono : FONTS.sans }} />
      </div>
    );
  };

  const header = (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderRadius: 12, marginBottom: 20,
      background: isComp ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${isComp ? '#BBF7D0' : '#FECACA'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 36 }}>⚗️</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.h1 }}>
            {d.gasType || '—'} — {d.kgUsed != null ? `${d.kgUsed} kg` : '—'} used
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
            {d.tech} · {d.customer} · {d.date}
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{d.job}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{
          padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          background: isComp ? '#F0FDF4' : '#FEF2F2',
          color: isComp ? '#16A34A' : '#DC2626',
          border: `1px solid ${isComp ? '#BBF7D0' : '#FECACA'}`,
        }}>
          {isComp ? '✅ Compliant' : '❌ Non-Compliant'}
        </span>
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
          {d.gasType || '—'}
        </span>
      </div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {

      case 'details':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionDivider title="Job & Technician" icon="👷" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <Cell fKey="id"       label="Log ID"              mono highlight />
              <Cell fKey="job"      label="Job Ref"             mono />
              <Cell fKey="date"     label="Date"                mono type="date" />
              <Cell fKey="tech"     label="Technician" />
              <Cell fKey="customer" label="Customer" />
              <Cell fKey="acUnit"   label="AC Unit / Equipment" />
            </div>

            <SectionDivider title="Gas Usage" icon="🧪" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <Cell fKey="gasType"        label="Gas Type"                 mono highlight
                type="select" options={['R-32','R-410A','R-22','R-134a','R-407C','R-404A']} />
              <Cell fKey="cylinders"      label="Cylinders Used"           mono type="number" />
              <Cell fKey="kgUsed"         label="Kg Used"                  mono warn type="number" />
              <Cell fKey="kgRecovered"    label="Kg Recovered"             mono type="number" />
              <Cell fKey="kgRemaining"    label="Kg Remaining in Cylinder" mono type="number" />
              <Cell fKey="reason"         label="Reason / Purpose" />
              <Cell fKey="pressureBefore" label="Pressure Before (PSI)"    mono type="number" />
              <Cell fKey="pressureAfter"  label="Pressure After (PSI)"     mono type="number" />
              <Cell fKey="gwp"            label="GWP Value"                mono type="number" />
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionDivider title="Leak Test & Compliance" icon="🔍" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <Cell fKey="leakTestDone"   label="Leak Test Done"          boolOptions={['Yes','No']} />
              <Cell fKey="leakTest"       label="Leak Test Result"        highlight boolOptions={['Pass ✓','Fail ✗']} />
              <Cell fKey="certification"  label="F-Gas Cert. No."         mono />
              <Cell fKey="regulation"     label="Regulation Reference" />
              <Cell fKey="disposalMethod" label="Disposal Method" />
              <Cell fKey="supervisor"     label="Supervisor Sign-off" />
              <Cell fKey="compliant"      label="Overall Compliant"       highlight boolOptions={['Yes — Compliant','No — Non-Compliant']} />
            </div>

            {!isComp && (
              <div style={{ padding: '12px 16px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#DC2626', lineHeight: 1.6, marginTop: 4 }}>
                <span style={{ fontWeight: 700 }}>⚠️ Non-Compliance Alert: </span>
                This entry is flagged as non-compliant. Review certification details and ensure corrective action is taken.
              </div>
            )}

            <div style={{ padding: '12px 16px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#1D4ED8', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700 }}>ℹ️ F-Gas Notice: </span>
              All technicians handling R-32 and R-410A must hold valid F-Gas certification. Records are retained for 5 years per regulations.
            </div>
          </div>
        );

      case 'notes':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionDivider title="Notes" icon="📝" />
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Notes</span>
                <textarea
                  value={editData.notes ?? log.notes ?? ''}
                  onChange={set('notes')}
                  rows={6}
                  style={{ ...inputBase, resize: 'vertical', minHeight: 120, lineHeight: 1.5 }}
                />
              </div>
            ) : d.notes ? (
              <div style={{ padding: '14px 16px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 13, color: COLORS.h2, lineHeight: 1.7 }}>
                {d.notes}
              </div>
            ) : (
              <div style={{ padding: '60px 14px', borderRadius: 8, background: '#F9FAFB', border: `1px dashed ${COLORS.border}`, textAlign: 'center', fontSize: 13, color: COLORS.muted }}>
                No notes added for this log entry.
              </div>
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Breadcrumb + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: COLORS.muted, padding: '0 4px', lineHeight: 1 }}>←</button>
          <span style={{ fontSize: 12, color: COLORS.muted }}>Gas / F-Gas Log /</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.brand, fontFamily: FONTS.mono }}>{log.id}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editMode ? (
            <>
              <button onClick={() => { setEditMode(false); setEditData({}); }}
                style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>
                Cancel
              </button>
              <button onClick={() => { onSave({ ...log, ...editData }); setEditMode(false); setEditData({}); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.sans }}>
                ✓ Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)}
              style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${COLORS.brand}`, background: COLORS.white, color: COLORS.brand, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.sans }}>
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {header}

      <div style={{
        background: COLORS.white, borderRadius: 14,
        border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
        padding: '20px 24px',
        boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : '0 1px 4px rgba(0,0,0,.04)',
        transition: 'all .2s',
      }}>
        {tabBar}
        {renderTab()}
      </div>

    </div>
  );
};

// ─── GasLogPage ───────────────────────────────────────────────────────────────
const GasLogPage = ({ openModal }) => {

  const [selectedLog, setSelectedLog] = useState(null);

  const handleDelete = async (log) => {
    if (!window.confirm('Delete this gas log entry?')) return;
    try {
      await gaslogApi.remove(log._id || log.id);
      setGasLogs(p => p.filter(g => (g._id || g.id) !== (log._id || log.id)));
      if (selectedLog && (selectedLog._id || selectedLog.id) === (log._id || log.id)) setSelectedLog(null);
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  const [gasLogs, setGasLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    gaslogApi.list({ limit: 500 }).then(res => {
      const raw = res?.data || res || [];
      // Normalise backend fields to match existing UI field names
      setGasLogs(raw.map(g => ({
        ...g,
        id: g.logId || g._id,
        job: g.jobRef || g.job || '—',
        tech: g.techName || '—',
        customer: g.customerName || '—',
        date: g.date ? new Date(g.date).toLocaleDateString('en-IN') : '—',
        kgUsed: g.quantity || 0,
        kgRecovered: g.kgRecovered || null,
        cylinders: g.cylinders || 0,
        reason: g.notes || g.operation || '—',
        leakTest: g.operation === 'leak-check' ? true : null,
        certification: g.certNumber || '—',
        compliant: true,
      })));
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, []);

  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: searchFiltered,
  } = useTableSearch(
    gasLogs,
    ['id', 'job', 'tech', 'customer', 'gasType', 'reason'],
    { gasType: '' }
  );

  const [compliantFilter, setCompliantFilter] = useState('');

  const filtered = searchFiltered
    .filter(g => !compliantFilter || (compliantFilter === 'Compliant' ? g.compliant : !g.compliant));

  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filtered, 10);

  const { exportProps } = useExport({
    title:        'Gas / F-Gas Log',
    filename:     'cooltech-gaslog',
    template:     'generic_list',
    subtitle:     'AC Services Platform · Refrigerant Usage & Compliance',
    docId:        'GASLOG-EXPORT',
    columns:      GASLOG_COLUMNS,
    rows:         filtered,
    showTotals:   true,
    totalColumns: ['kgUsed', 'cylinders'],
  });

  const totalKg  = gasLogs.reduce((s, g) => s + (g.kgUsed || 0), 0);
  const totalCyl = gasLogs.reduce((s, g) => s + (g.cylinders || 0), 0);
  const gasTypes = [...new Set(gasLogs.map(g => g.gasType))];

  // Detail drill-in view
  if (selectedLog) {
    return (
      <GasLogDetailView
        log={selectedLog}
        onBack={() => setSelectedLog(null)}
        onSave={async (updated) => {
          try {
            const saved = await gaslogApi.update(updated._id || updated.id, {
              gasType: updated.gasType, quantity: updated.kgUsed,
              operation: updated.operation || 'charge',
              certNumber: updated.certification || updated.certNumber,
              notes: updated.reason || updated.notes,
              pressure: updated.pressure, temperature: updated.temperature,
            });
            setGasLogs(p => p.map(g => (g._id === updated._id || g.id === updated.id) ? { ...g, ...updated } : g));
            setSelectedLog({ ...updated });
          } catch (e) { alert('Save failed: ' + e.message); }
        }}
      />
    );
  }

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <SectionHdr
        title="Gas / F-Gas Log"
        sub="Refrigerant usage & compliance records"
        action="+ Log Gas Usage"
        onAction={() => openModal('log_gas', {
    onSave: async (form) => {
      try {
        const created = await gaslogApi.create({
          gasType: form.gasType || 'R-32', quantity: Number(form.kgUsed || form.quantity || 0),
          operation: form.operation || 'charge', techName: form.tech || form.techName,
          customerName: form.customer || form.customerName, jobRef: form.job || form.jobRef,
          certNumber: form.certification || form.certNumber, notes: form.reason || form.notes,
          date: form.date || new Date(),
        });
        setGasLogs(p => [{ ...created, id: created.logId || created._id, job: created.jobRef || '—', tech: created.techName || '—', customer: created.customerName || '—', date: new Date(created.date).toLocaleDateString('en-IN'), kgUsed: created.quantity || 0, kgRecovered: null, cylinders: 0, reason: created.notes || created.operation || '—', leakTest: null, certification: created.certNumber || '—', compliant: true }, ...p]);
      } catch (e) { alert('Create failed: ' + e.message); }
    }
  })}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <KCard label="Total Entries"  value={gasLogs.length}           sub="this month"   icon="🧪" iconBg="#EFF6FF" color="#0369A1"     delay=""  />
        <KCard label="Total Kg Used"  value={`${totalKg.toFixed(1)} kg`}  sub="refrigerant"  icon="⚗️" iconBg="#FFF7ED" color={COLORS.brand} delay="1" />
        <KCard label="Cylinders Used" value={totalCyl}                     sub="total"         icon="🔵" iconBg="#F0FDF4" color="#16A34A"     delay="2" />
        <KCard label="Compliant"      value="100%"                         sub="all certified" icon="✅" iconBg="#F0FDF4" color="#16A34A"     delay="3" />
      </div>

      <div style={{ padding: '12px 18px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>ℹ️</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>F-Gas Compliance Notice</div>
          <div style={{ fontSize: 12, color: '#1D4ED8', marginTop: 2 }}>All technicians handling R-32 and R-410A refrigerants must hold valid F-Gas certification. Records are kept for 5 years as per regulations.</div>
        </div>
      </div>

      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by job, technician, customer, gas type…" />
          <FilterSelect value={activeFilters.gasType} onChange={val => setFilter('gasType', val)} options={gasTypes} allLabel="All Gas Types" />
          <FilterSelect value={compliantFilter} onChange={setCompliantFilter} options={['Compliant', 'Non-Compliant']} allLabel="Compliance: All" />
          <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <Thead cols={['Log ID', 'Job', 'Technician', 'Customer', 'Date', 'Gas Type', 'Cylinders', 'Kg Used', 'Kg Recovered', 'Reason', 'Leak Test', 'Certification', 'Compliant', '']} />
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={14} style={{ padding: '40px 14px', textAlign: 'center', color: COLORS.faint, fontSize: 13 }}>No gas log entries match your filters.</td></tr>
              )}
              {paginated.map((g, i) => (
                <tr key={g.id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : '#FAFAFA' }}>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.brand }}>{g.id}</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#0369A1' }}>{g.job}</span></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Avatar name={g.tech} size={24} />
                      <span style={{ fontSize: 12, color: COLORS.body }}>{g.tech}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>{g.customer}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{g.date}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: 5 }}>{g.gasType}</span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}><span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: COLORS.h2 }}>{g.cylinders}</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.brand }}>{g.kgUsed} kg</span></td>
                  <td style={{ padding: '12px 14px' }}>
                    {g.kgRecovered
                      ? <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: '#16A34A', fontWeight: 600 }}>{g.kgRecovered} kg</span>
                      : <span style={{ color: COLORS.faint }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.body, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.reason}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {g.leakTest == null ? <span style={{ color: COLORS.faint }}>—</span>
                      : g.leakTest
                        ? <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#F0FDF4', color: '#16A34A' }}>Pass</span>
                        : <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#FEF2F2', color: '#DC2626' }}>Fail</span>}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: COLORS.muted, fontFamily: FONTS.mono }}>{g.certification}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {g.compliant ? <span style={{ color: '#16A34A', fontSize: 14 }}>✅</span> : <span style={{ color: '#DC2626', fontSize: 14 }}>❌</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn"
                      onClick={() => setSelectedLog(g)}
                      style={{ padding: '4px 9px', borderRadius: 5, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        )}
      </div>
    </div>
  );
};

export default GasLogPage;