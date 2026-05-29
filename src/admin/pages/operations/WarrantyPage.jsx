import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { warrantyApi } from '../../services/api';

// ─── Column config for export ─────────────────────────────────────────────────
const WARRANTY_COLUMNS = [
  { label: 'ID',           key: 'id',          width: 10, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Customer',     key: 'customer',    width: 20, tdStyle: { fontWeight: 600 } },
  { label: 'Unit',         key: 'unit',        width: 22 },
  { label: 'Brand',        key: 'brand',       width: 12 },
  { label: 'Model',        key: 'model',       width: 14, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Serial No.',   key: 'serial',      width: 14, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Install Date', key: 'installDate', width: 13 },
  { label: 'Warranty End', key: 'warrantyEnd', width: 13 },
  { label: 'Type',         key: 'type',        width: 18 },
  { label: 'AMC',          key: 'extendedAMC', width: 6,  format: v => v ? 'Yes' : 'No' },
  { label: 'Status',       key: 'status',      width: 8,  format: v => (v ?? '').charAt(0).toUpperCase() + (v ?? '').slice(1) },
];

// ─── FIX: normalize a raw API warranty row so every display field is a string ─
// The blank columns (unit, installDate, warrantyEnd) were empty because the API
// uses different field names (product, installationDate, endDate, etc.)
const normalizeWarranty = (w, idx) => {
  const fmtDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d) ? String(val) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const daysLeft = (endVal) => {
    if (!endVal) return 0;
    return Math.max(0, Math.ceil((new Date(endVal) - new Date()) / 86400000));
  };

  // Backend schema fields (extendedModels.js → warrantySchema):
  //   warrantyId, customerName, product, brand, model, serial,
  //   type, startDate, endDate, status, claimsCount, notes
  // customer field is populated as { _id, name, ... } object via populate: ['customer']
  return {
    ...w,
    // Identity — backend auto-generates warrantyId (WRT-0001 etc.)
    id:          w.warrantyId ?? w.id ?? w._id ?? `wrt-${idx}`,

    // Customer — populated object or plain string fallback
    customer:    typeof w.customer === 'object'
                   ? (w.customer?.name ?? w.customerName ?? '—')
                   : (w.customerName   ?? w.customer     ?? '—'),

    // Unit — backend field is `product`
    unit:        w.product      || w.unit        || '—',

    // Dates — backend fields are startDate / endDate
    warrantyEnd: fmtDate(w.endDate    || w.warrantyEnd  || w.expiryDate),
    startDate:   fmtDate(w.startDate  || w.start_date),
    installDate: fmtDate(w.installDate || w.installationDate || w.startDate),
    purchaseDate:fmtDate(w.purchaseDate || w.startDate),

    // Other
    brand:       w.brand   || '—',
    model:       w.model   || '—',
    serial:      w.serial  || '—',
    type:        w.type    || 'AC Unit',
    status:      (w.status || 'active').toLowerCase(),
    extendedAMC: Boolean(w.extendedAMC || w.amcLinked),
    claimsCount: w.claimsCount || 0,
    notes:       w.notes   || '',
    daysLeft:    daysLeft(w.endDate || w.warrantyEnd || w.expiryDate),
  };
};

// ─── Field definitions for detail view ───────────────────────────────────────
const WARRANTY_FIELDS = [
  { key: 'customer',    label: 'Customer',                 large: true },
  { key: 'unit',        label: 'AC Unit Description' },
  { key: 'acType',      label: 'AC Type' },
  { key: 'brand',       label: 'Brand' },
  { key: 'model',       label: 'Model No.',                mono: true },
  { key: 'serial',      label: 'Serial No.',               mono: true },
  { key: 'capacity',    label: 'Capacity' },
  { key: 'technician',  label: 'Technician Installed By' },
  { key: 'purchaseDate',   label: 'Purchase Date',      type: 'date' },
  { key: 'invoiceNo',      label: 'Invoice / Bill No.', mono: true },
  { key: 'purchaseSource', label: 'Purchase Source' },
  { key: 'installDate',    label: 'Install Date',       type: 'date' },
  { key: 'type', label: 'Warranty Type', type: 'select', options: ['Comprehensive', 'Compressor', 'Parts & Labour', 'Parts Only'] },
  { key: 'warrantyEnd',    label: 'Warranty End',             type: 'date' },
  { key: 'compressorEnd',  label: 'Compressor Warranty End',  type: 'date' },
  { key: 'partsWarranty',  label: 'Parts Warranty Period' },
  { key: 'labourCovered',  label: 'Labour Covered' },
  { key: 'amcRequired',    label: 'AMC Required' },
  { key: 'amcRef',         label: 'Linked AMC Ref',           mono: true },
  { key: 'alertBefore',    label: 'Alert Before Expiry' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'expired'] },
  { key: 'claimNotes', label: 'Claim Notes', type: 'textarea', span: 2 },
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

// ─── WarrantyDetailView ───────────────────────────────────────────────────────
// FIX: handleCreate was referenced inside this component but defined in the
// parent (WarrantyPage). It is now passed in as a prop so there's no
// ReferenceError when the Renew button calls openModal('new_warranty', { onSave }).
const WarrantyDetailView = ({ warranty, onBack, onSave, onRenew, openModal }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode,  setEditMode]  = useState(false);
  const [editData,  setEditData]  = useState({});

  const d        = editMode ? { ...warranty, ...editData } : warranty;
  const isExpired = d.status === 'expired';

  const set     = key => e => setEditData(p => ({ ...p, [key]: e.target.value }));

  const inputBase = {
    padding: '7px 10px', borderRadius: 7,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 13, color: COLORS.h2, background: '#FAFAFA',
    fontFamily: FONTS.sans, width: '100%', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color .15s',
  };

  const TABS = [
    { key: 'overview',  label: 'Overview',  icon: '🛡️' },
    { key: 'coverage',  label: 'Coverage',  icon: '📋' },
    { key: 'claims',    label: 'Claims',    icon: '⚠️' },
    { key: 'documents', label: 'Documents', icon: '📄' },
  ];

  const tabBar = (
    <div style={{ display: 'flex', gap: 2, borderBottom: `2px solid ${COLORS.border}`, marginBottom: 20 }}>
      {TABS.map(t => (
        <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
          padding: '9px 18px', fontSize: 13, fontWeight: 600,
          fontFamily: FONTS.sans, cursor: 'pointer', border: 'none',
          borderBottom: activeTab === t.key ? `2px solid ${COLORS.brand}` : '2px solid transparent',
          marginBottom: -2, background: 'transparent',
          color: activeTab === t.key ? COLORS.brand : COLORS.muted,
          display: 'flex', alignItems: 'center', gap: 6, transition: 'color .15s',
        }}>
          <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>
  );

  const Cell = ({ fKey, label, highlight, mono, type = 'text', options }) => {
    if (!editMode) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 14px', borderRadius: 8, background: highlight ? `${COLORS.brand}08` : '#F9FAFB', border: `1px solid ${highlight ? COLORS.brand + '30' : COLORS.border}` }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: highlight ? COLORS.brand : COLORS.h2, fontFamily: mono ? FONTS.mono : FONTS.sans }}>
          {d[fKey] || <span style={{ color: COLORS.muted, fontWeight: 400 }}>—</span>}
        </span>
      </div>
    );
    if (type === 'select') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <select value={editData[fKey] ?? warranty[fKey] ?? ''} onChange={set(fKey)} style={{ ...inputBase, cursor: 'pointer' }}>
          {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <input type={type} value={editData[fKey] ?? warranty[fKey] ?? ''} onChange={set(fKey)} style={{ ...inputBase, fontFamily: mono ? FONTS.mono : FONTS.sans }} />
      </div>
    );
  };

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 12, marginBottom: 20, background: isExpired ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${isExpired ? '#FECACA' : '#BBF7D0'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 36 }}>🛡️</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.h1 }}>{d.unit || '—'}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{d.brand} · {d.model} · S/N: {d.serial}</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{d.customer}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: isExpired ? '#FEF2F2' : '#F0FDF4', color: isExpired ? '#DC2626' : '#16A34A', border: `1px solid ${isExpired ? '#FECACA' : '#BBF7D0'}` }}>
          {isExpired ? '● Expired' : '● Active'}
        </span>
        {d.extendedAMC && (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>✓ AMC Linked</span>
        )}
      </div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionDivider title="Customer & Unit" icon="🪪" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <Cell fKey="customer" label="Customer" />
            <Cell fKey="unit"     label="AC Unit Description" />
            <Cell fKey="acType"   label="AC Type" />
            <Cell fKey="brand"    label="Brand" />
            <Cell fKey="model"    label="Model No."  mono />
            <Cell fKey="serial"   label="Serial No." mono />
            <Cell fKey="capacity"    label="Capacity" />
            <Cell fKey="technician"  label="Installed By" />
          </div>
          <SectionDivider title="Purchase & Installation" icon="🧾" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <Cell fKey="purchaseDate"   label="Purchase Date"      type="date" />
            <Cell fKey="invoiceNo"      label="Invoice / Bill No." mono />
            <Cell fKey="purchaseSource" label="Purchase Source" />
            <Cell fKey="installDate"    label="Install Date"       type="date" />
          </div>
        </div>
      );
      case 'coverage': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionDivider title="Warranty Coverage" icon="🛡️" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <Cell fKey="type"          label="Warranty Type" type="select" options={['Comprehensive','Compressor','Parts & Labour','Parts Only']} />
            <Cell fKey="warrantyEnd"   label="Warranty End"            type="date" highlight />
            <Cell fKey="compressorEnd" label="Compressor Warranty End" type="date" highlight />
            <Cell fKey="partsWarranty" label="Parts Warranty Period" />
            <Cell fKey="labourCovered" label="Labour Covered" />
            <Cell fKey="amcRequired"   label="AMC Required" />
            <Cell fKey="amcRef"        label="Linked AMC Ref" mono />
            <Cell fKey="alertBefore"   label="Alert Before Expiry" />
            <Cell fKey="status"        label="Status" type="select" options={['active','expired']} />
          </div>
        </div>
      );
      case 'claims': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionDivider title="Claim History" icon="📋" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <Cell fKey="claimsUsed"    label="No. of Claims Used" type="number" />
            <Cell fKey="lastClaimDate" label="Last Claim Date"    type="date" />
          </div>
          <div style={{ marginTop: 4 }}>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Claim Notes</span>
                <textarea value={editData.claimNotes ?? warranty.claimNotes ?? ''} onChange={set('claimNotes')} rows={4}
                  style={{ ...inputBase, resize: 'vertical', minHeight: 90, lineHeight: 1.5 }} />
              </div>
            ) : d.claimNotes ? (
              <div style={{ padding: '12px 14px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 13, color: COLORS.h2, lineHeight: 1.6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Claim Notes</span>
                {d.claimNotes}
              </div>
            ) : (
              <div style={{ padding: '40px 14px', borderRadius: 8, background: '#F9FAFB', border: `1px dashed ${COLORS.border}`, textAlign: 'center', fontSize: 13, color: COLORS.muted }}>
                No warranty claims filed yet.
              </div>
            )}
          </div>
        </div>
      );
      case 'documents': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionDivider title="Uploaded Documents" icon="📄" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Warranty Card',    icon: '🛡️', file: d.warrantyCardFile },
              { label: 'Purchase Invoice', icon: '🧾', file: d.invoiceFile },
            ].map(({ label, icon, file }) => (
              <div key={label} style={{ padding: '18px 20px', borderRadius: 12, border: `1px solid ${file ? COLORS.brand + '40' : COLORS.border}`, background: file ? `${COLORS.brand}06` : '#F9FAFB', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 30 }}>{file ? '✅' : icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                  {file
                    ? <a href={file} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: COLORS.brand, fontWeight: 600, textDecoration: 'none' }}>View / Download →</a>
                    : <span style={{ fontSize: 12, color: COLORS.muted }}>Not uploaded yet</span>}
                </div>
              </div>
            ))}
          </div>
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
          <span style={{ fontSize: 12, color: COLORS.muted }}>Warranties /</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.brand, fontFamily: FONTS.mono }}>{warranty.id}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editMode ? (
            <>
              <button onClick={() => { setEditMode(false); setEditData({}); }}
                style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => { onSave({ ...warranty, ...editData }); setEditMode(false); setEditData({}); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ✓ Save Changes
              </button>
            </>
          ) : (
            <>
              {isExpired && (
                // FIX: was openModal('new_warranty', { onSave: handleCreate }) — handleCreate
                // is defined in WarrantyPage not here. Now calls onRenew prop instead.
                <button onClick={() => onRenew ? onRenew(warranty) : openModal('new_warranty')}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  🔄 Renew
                </button>
              )}
              <button onClick={() => openModal('schedule_amc')}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.h2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                📅 Schedule AMC
              </button>
              <button onClick={() => setEditMode(true)}
                style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${COLORS.brand}`, background: COLORS.white, color: COLORS.brand, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ✏️ Edit
              </button>
            </>
          )}
        </div>
      </div>

      {header}

      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`, padding: '20px 24px', boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : '0 1px 4px rgba(0,0,0,.04)', transition: 'all .2s' }}>
        {tabBar}
        {renderTab()}
      </div>
    </div>
  );
};

// ─── WarrantyPage ─────────────────────────────────────────────────────────────
const WarrantyPage = ({ openModal }) => {
  const [warranties,   setWarranties]   = useState([]);
  const [loadingData,  setLoadingData]  = useState(true);
  const [selectedWarranty, setSelectedWarranty] = useState(null);

  useEffect(() => {
    warrantyApi.list({ limit: 500 })
      .then(res => {
        const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        // FIX: every row goes through normalizeWarranty so all display fields are defined
        setWarranties(raw.map(normalizeWarranty));
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  // ── CRUD helpers ────────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    try {
      // Backend schema (warrantySchema): customerName, product, brand, model,
      // serial, type, startDate, endDate, status, notes
      // warrantyApi.create() returns raw Mongoose doc — no { data: } wrapper
      const doc = await warrantyApi.create({
        customerName: form.customerName || form.customer  || '',
        product:      form.unit         || form.product   || '',
        brand:        form.brand        || '',
        model:        form.model        || '',
        serial:       form.serial       || '',
        type:         form.type         || 'AC Unit',
        startDate:    form.startDate    || form.installDate || new Date(),
        endDate:      form.endDate      || form.warrantyEnd || form.expiryDate,
        status:       'active',
        notes:        form.notes        || form.claimNotes || '',
      });
      // Merge form + backend doc — backend provides warrantyId (_id, timestamps)
      // form provides display-ready field names (unit, warrantyEnd, customer)
      const merged = {
        customerName: form.customerName || form.customer || '',
        product:      form.unit         || form.product  || '',
        brand:        form.brand        || '',
        model:        form.model        || '',
        serial:       form.serial       || '',
        type:         form.type         || 'AC Unit',
        startDate:    form.startDate    || form.installDate,
        endDate:      form.endDate      || form.warrantyEnd || form.expiryDate,
        status:       'active',
        ...doc,
      };
      setWarranties(p => [normalizeWarranty(merged, p.length), ...p]);
    } catch (e) { alert('Create failed: ' + e.message); }
  };

  const handleSave = async (updated) => {
    try {
      await warrantyApi.update(updated._id || updated.id, {
        customerName: updated.customerName || updated.customer || '',
        product:      updated.unit         || updated.product  || '',
        brand:        updated.brand        || '',
        model:        updated.model        || '',
        serial:       updated.serial       || '',
        type:         updated.type         || 'AC Unit',
        startDate:    updated.startDate,
        endDate:      updated.warrantyEnd  || updated.endDate  || updated.expiryDate,
        status:       updated.status,
        notes:        updated.claimNotes   || updated.notes    || '',
      });
      const normalized = normalizeWarranty(updated, 0);
      setWarranties(p => p.map(w => (w._id === updated._id || w.id === updated.id) ? normalized : w));
      setSelectedWarranty(normalized);
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const handleDelete = async (w) => {
    if (!window.confirm('Delete this warranty record?')) return;
    try {
      await warrantyApi.remove(w._id || w.id);
      setWarranties(p => p.filter(x => (x._id || x.id) !== (w._id || w.id)));
      if (selectedWarranty && (selectedWarranty._id || selectedWarranty.id) === (w._id || w.id)) setSelectedWarranty(null);
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  // ── Search + filter ──────────────────────────────────────────────────────────
  const { q, setQ, activeFilters, setFilter, filtered: searchFiltered } = useTableSearch(
    warranties, ['customer', 'brand', 'model', 'serial', 'unit', 'id'], { status: '', brand: '', type: '' }
  );
  const filtered = searchFiltered
    .filter(r => !activeFilters.status || r.status === activeFilters.status)
    .filter(r => !activeFilters.brand  || r.brand  === activeFilters.brand)
    .filter(r => !activeFilters.type   || r.type   === activeFilters.type);

  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } = usePagination(filtered, 10);

  const { exportProps } = useExport({
    title:    'Warranty Tracker',
    filename: 'cooltech-warranties',
    template: 'generic_list',
    subtitle: 'AC Services Platform · Warranty Register',
    docId:    'WARRANTY-EXPORT',
    columns:  WARRANTY_COLUMNS,
    rows:     filtered,
  });

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedWarranty) {
    return (
      <WarrantyDetailView
        warranty={selectedWarranty}
        onBack={() => setSelectedWarranty(null)}
        onSave={handleSave}
        onRenew={() => openModal('new_warranty', { onSave: handleCreate })}
        openModal={openModal}
      />
    );
  }

  const active    = warranties.filter(w => w.status === 'active');
  const expired   = warranties.filter(w => w.status === 'expired');
  const brands    = [...new Set(warranties.map(w => w.brand).filter(Boolean))];
  const types     = [...new Set(warranties.map(w => w.type).filter(Boolean))];
  const total_w   = warranties.length || 1; // FIX: avoid division by zero in brand chart

  const brandData = brands.map(b => ({
    brand:  b,
    count:  warranties.filter(w => w.brand === b).length,
    active: warranties.filter(w => w.brand === b && w.status === 'active').length,
  })).sort((a, b) => b.count - a.count);

  const BRAND_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Warranty Tracker</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
            Track AC unit warranties · {active.length} active · {expired.length} expired
          </div>
        </div>
        <button className="btn" onClick={() => openModal('new_warranty', { onSave: handleCreate })}
          style={{ padding: '9px 20px', borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}>
          + Register Warranty
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <KCard label="Active Warranties" value={active.length}                                sub="under cover"   icon="✅" iconBg="#F0FDF4" color="#16A34A"     delay=""  />
        <KCard label="Expired"           value={expired.length}                               sub="need renewal"  icon="⚠️" iconBg="#FEF2F2" color="#DC2626"     delay="1" />
        <KCard label="Extended via AMC"  value={warranties.filter(w => w.extendedAMC).length} sub="AMC covered"   icon="📋" iconBg="#EFF6FF" color="#0369A1"     delay="2" />
        <KCard label="Brands Tracked"    value={brands.length}                                sub="manufacturers" icon="🏭" iconBg="#FFF7ED" color={COLORS.brand} delay="3" />
      </div>

      {/* ── Expiry timeline + Brand breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>Warranty Expiry Timeline</div>
          {warranties.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: 13, color: COLORS.faint, padding: '30px 0' }}>No warranties yet.</div>
          )}
          {[...warranties].sort((a, b) => new Date(a.warrantyEnd) - new Date(b.warrantyEnd)).map(w => {
            const isExp = w.status === 'expired';
            return (
              <div key={w.id} onClick={() => setSelectedWarranty(w)}
                style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: isExp ? '#FEF2F2' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {isExp ? '⚠️' : '✅'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.customer}</div>
                  <div style={{ fontSize: 10, color: COLORS.muted }}>{w.brand} · {w.type}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isExp ? '#DC2626' : '#16A34A' }}>{w.warrantyEnd}</div>
                  {isExp && (
                    <button className="btn" onClick={e => { e.stopPropagation(); openModal('new_warranty', { onSave: handleCreate }); }}
                      style={{ fontSize: 9, fontWeight: 700, background: '#FFF7ED', border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, padding: '2px 7px', borderRadius: 99, cursor: 'pointer' }}>
                      Renew
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>Brand Distribution</div>
          {brandData.map((b, i) => (
            <div key={b.brand} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.muted, marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: BRAND_COLORS[i % BRAND_COLORS.length] }} />
                  <span style={{ fontWeight: 600, color: COLORS.h2 }}>{b.brand}</span>
                </div>
                <span>{b.active} active / {b.count} total</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                {/* FIX: divide by total_w (min 1) not warranties.length to avoid NaN bars */}
                <div style={{ position: 'absolute', left: 0, height: '100%', width: `${(b.count  / total_w) * 100}%`, background: `${BRAND_COLORS[i % BRAND_COLORS.length]}40`, borderRadius: 99 }} />
                <div style={{ position: 'absolute', left: 0, height: '100%', width: `${(b.active / total_w) * 100}%`, background: BRAND_COLORS[i % BRAND_COLORS.length], borderRadius: 99 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '12px 14px', background: '#F9FAFB', borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, marginBottom: 6 }}>Type Breakdown</div>
            {['Comprehensive', 'Compressor', 'Parts & Labour', 'Parts Only'].map(type => {
              const count = warranties.filter(w => w.type === type).length;
              if (!count) return null;
              return (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', color: COLORS.muted }}>
                  <span>{type}</span>
                  <span style={{ fontWeight: 700, color: COLORS.h2 }}>{count} unit{count > 1 ? 's' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Full table ── */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search customer, brand, model, serial…" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['active','expired']} allLabel="All Statuses" labelMap={{ active: 'Active', expired: 'Expired' }} />
          <FilterSelect value={activeFilters.brand}  onChange={val => setFilter('brand',  val)} options={brands} allLabel="All Brands" />
          <FilterSelect value={activeFilters.type}   onChange={val => setFilter('type',   val)} options={types}  allLabel="All Types"  />
          <div style={{ marginLeft: 'auto' }}><ExportDropdown {...exportProps} /></div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <Thead cols={['ID', 'Customer', 'Unit', 'Brand', 'Model', 'Serial No.', 'Install Date', 'Warranty End', 'Type', 'AMC', 'Status', '']} />
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={12} style={{ padding: '40px 14px', textAlign: 'center', color: COLORS.faint, fontSize: 13 }}>
                  {loadingData ? 'Loading…' : 'No warranties match your filters.'}
                </td></tr>
              )}
              {paginated.map((w, i) => (
                // FIX: key={w.id} is always defined — normalizeWarranty guarantees it
                <tr key={w.id} className="row"
                  onClick={() => setSelectedWarranty(w)}
                  style={{ borderBottom: `1px solid ${COLORS.border}22`, background: w.status === 'expired' ? '#FFFBF7' : i % 2 === 0 ? COLORS.white : '#FAFAFA', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.brand }}>{w.id}</span></td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{w.customer}</td>
                  {/* FIX: these columns were blank because raw API had `product` not `unit`,
                      `installationDate` not `installDate`, `endDate` not `warrantyEnd`.
                      normalizeWarranty maps all variants to the correct field names. */}
                  <td style={{ padding: '12px 14px', fontSize: 11, color: COLORS.body, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.unit}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{w.brand}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: FONTS.mono, color: COLORS.muted }}>{w.model}</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted }}>{w.serial}</span></td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{w.installDate}</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontSize: 12, fontWeight: 700, color: w.status === 'expired' ? '#DC2626' : COLORS.h2 }}>{w.warrantyEnd}</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#EFF6FF', color: '#0369A1' }}>{w.type}</span></td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>{w.extendedAMC ? <span style={{ color: '#16A34A' }}>✅</span> : <span style={{ color: COLORS.faint }}>—</span>}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: w.status === 'active' ? '#F0FDF4' : '#FEF2F2', color: w.status === 'active' ? '#16A34A' : '#DC2626' }}>
                      ● {w.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                    {w.status === 'expired'
                      ? <button className="btn" onClick={() => openModal('new_warranty', { onSave: handleCreate })} style={{ padding: '4px 9px', borderRadius: 5, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 11, fontWeight: 700 }}>Renew</button>
                      : <button className="btn" onClick={() => setSelectedWarranty(w)} style={{ padding: '4px 9px', borderRadius: 5, background: '#F8FAFC', border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 11 }}>View →</button>
                    }
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

export default WarrantyPage;