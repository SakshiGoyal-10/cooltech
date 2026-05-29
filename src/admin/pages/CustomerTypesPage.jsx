import { customerTypesApi } from '../services/api';
// CustomerTypesPage.jsx
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';

// ─── Add Type Modal ───────────────────────────────────────────────────────────
const AddTypeModal = ({ onClose, onSave }) => {
  const [value, setValue] = useState('');
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: COLORS.white, borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', width: 420, padding: '28px 28px 24px', fontFamily: FONTS.sans }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>Add Customer Type</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: COLORS.muted, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6 }}>
            Customer Type <span style={{ color: '#DC2626' }}>*</span>
          </div>
          <input
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { onSave(value.trim()); onClose(); } }}
            placeholder="e.g. Industrial, Government, Hospital…"
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
            style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: value.trim() ? 'linear-gradient(135deg,#EA580C,#C2410C)' : COLORS.border, color: value.trim() ? 'white' : COLORS.muted, fontSize: 13, fontWeight: 700, cursor: value.trim() ? 'pointer' : 'not-allowed', fontFamily: FONTS.sans, transition: 'background .15s' }}>
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
      background: active ? '#16A34A' : '#D62626',
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

// ─── CustomerTypesPage ────────────────────────────────────────────────────────
// Props:
//   types         — array of { name, active } objects
//   onAdd(name)   — adds a new active type
//   onDelete(name)— removes type by name
//   onToggle(name)— flips active flag by name
const CustomerTypesPage = ({ types, onAdd, onDelete, onToggle }) => {
  const [showAdd,      setShowAdd]      = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = types
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    .filter(t => statusFilter === 'all' ? true : statusFilter === 'active' ? t.active : !t.active);

  const activeCount   = types.filter(t => t.active).length;
  const inactiveCount = types.filter(t => !t.active).length;

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Customer Types</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
            {types.length} type{types.length !== 1 ? 's' : ''} · {activeCount} active · {inactiveCount} inactive
          </div>
        </div>
        <button
          className="btn"
          onClick={() => setShowAdd(true)}
          style={{ padding: '9px 22px', borderRadius: 9, background: 'linear-gradient(135deg,#EA580C,#C2410C)', color: 'white', fontSize: 13, fontWeight: 700, border: 'none', boxShadow: '0 3px 10px #EA580C40', cursor: 'pointer' }}>
          + Add Type
        </button>
      </div>

      {/* ── Info banner ── */}
      <div style={{ padding: '11px 16px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#1D4ED8', fontWeight: 500 }}>
        ℹ️ Types added here appear in the <strong>Type</strong> dropdown when adding a customer.
        Only <strong>Active</strong> types show in the dropdown. Inactive types are hidden but not deleted.
      </div>

      {/* ── Table ── */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>

        {/* ── Toolbar ── */}
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: COLORS.faint }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search types…"
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h2, background: COLORS.white, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: 3 }}>
            {[['all', `All (${types.length})`], ['active', `Active (${activeCount})`], ['inactive', `Inactive (${inactiveCount})`]].map(([k, l]) => (
              <button key={k} onClick={() => setStatusFilter(k)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: statusFilter === k ? COLORS.white : 'transparent',
                color: statusFilter === k ? COLORS.h1 : COLORS.muted,
                border: `1px solid ${statusFilter === k ? COLORS.border : 'transparent'}`,
                fontFamily: FONTS.sans,
              }}>{l}</button>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: `1px solid ${COLORS.border}` }}>
              {['#', 'Type Name', 'Status', 'Action', 'Added', ''].map((col, i) => (
                <th key={i} style={{
                  padding: '11px 16px',
                  textAlign: i === 5 ? 'right' : 'left',
                  fontSize: 11, fontWeight: 700, color: COLORS.faint,
                  textTransform: 'uppercase', letterSpacing: .6,
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: COLORS.faint }}>
                  {search ? `No types matching "${search}"` : 'No types found.'}
                </td>
              </tr>
            ) : (
              filtered.map((type, i) => {
                const originalIndex = types.findIndex(t => t.name === type.name);
                return (
                  <tr
                    key={type.name}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}22`,
                      background: type.active ? (i % 2 === 0 ? COLORS.white : '#FAFAFA') : '#FAFAFA',
                      opacity: type.active ? 1 : 0.65,
                      transition: 'opacity .2s',
                    }}
                  >
                    {/* # */}
                    <td style={{ padding: '13px 16px', width: 48 }}>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.faint }}>{originalIndex + 1}</span>
                    </td>

                    {/* Name */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          background: type.active ? '#FFF7ED' : '#F3F4F6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                        }}>
                          👤
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: type.active ? COLORS.h1 : COLORS.muted }}>
                          {type.name}
                        </span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 99,
                        background: type.active ? '#F0FDF4' : '#F3F4F6',
                        color: type.active ? '#16A34A' : '#D62626',
                        border: `1px solid ${type.active ? '#BBF7D0' : '#E5E7EB'}`,
                      }}>
                        {type.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>

                    {/* Toggle */}
                    <td style={{ padding: '13px 16px' }}>
                      <ToggleSwitch active={type.active} onChange={() => onToggle(type.name)} />
                    </td>

                    {/* Added */}
                    <td style={{ padding: '13px 16px', fontSize: 12, color: COLORS.muted, fontFamily: FONTS.mono }}>
                      {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Delete */}
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <button
                        className="btn"
                        onClick={() => setDeleteTarget({ name: type.name, index: originalIndex })}
                        style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        {filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${COLORS.border}`, fontSize: 12, color: COLORS.faint, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing {filtered.length} of {types.length} types</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: '#16A34A', fontWeight: 600 }}>{activeCount} active</span>
              <span style={{ color: COLORS.muted, fontWeight: 600 }}>{inactiveCount} inactive</span>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddTypeModal
          onClose={() => setShowAdd(false)}
          onSave={name => { onAdd(name); setShowAdd(false); }}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => { onDelete(deleteTarget.name); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        message={`"${deleteTarget?.name}" will be permanently removed from Customer Types.`}
      />
    </div>
  );
};


// ─── API Wrapper ──────────────────────────────────────────────────────────────
const CustomerTypesPageWrapper = () => {
  const [types, setTypes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState('');

  const flash = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    customerTypesApi.list({ limit: 500 }).then(res => {
      const raw = res?.data || res || [];
      setTypes(raw.map(t => ({ ...t, name: t.name, active: t.isActive !== false })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (name) => {
    try {
      const created = await customerTypesApi.create({ name, isActive: true });
      setTypes(p => [...p, { ...created, name: created.name, active: true }]);
      flash('Type added.');
    } catch (e) { flash(e.message || 'Failed to add.'); }
  };

  const handleDelete = async (name) => {
    const type = types.find(t => t.name === name);   // ← add this lookup
    if (!type?._id) return flash('Type not found.');
    try {
      await customerTypesApi.remove(type._id);
      setTypes(p => p.filter(t => t._id !== type._id));
      flash('Deleted.');
    } catch (e) { flash(e.message || 'Delete failed.'); }
  };

  const handleToggle = async (name) => {
    const type = types.find(t => t.name === name);   // ← add this lookup
    if (!type?._id) return;
    try {
      await customerTypesApi.update(type._id, { isActive: !type.active });
      setTypes(p => p.map(t => t._id === type._id ? { ...t, active: !t.active } : t));
    } catch (e) { flash(e.message || 'Update failed.'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading…</div>;

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1E293B', color: '#fff', padding: '10px 20px', borderRadius: 10, zIndex: 9999, fontSize: 13, fontWeight: 600 }}>
          {toast}
        </div>
      )}
      <CustomerTypesPage
        types={types}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />
    </>
  );
};

export default CustomerTypesPageWrapper;