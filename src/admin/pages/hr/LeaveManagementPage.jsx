import { useState, useEffect, useRef } from 'react';
import { techsApi, leavesApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, Avatar } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { LEAVE_BALANCE, LEAVE_DATA, LEAVE_STATUS, TECHNICIANS } from '../../data/mockData';

// ─── Column config for export ──────────────────────────────────────────────────
const LEAVE_COLUMNS = [
  { label: 'ID',          key: 'id',         width: 12 },
  { label: 'Technician',  key: 'tech',       width: 20 },
  { label: 'Type',        key: 'type',       width: 14 },
  { label: 'From',        key: 'from',       width: 14 },
  { label: 'To',          key: 'to',         width: 14 },
  { label: 'Days',        key: 'days',       width: 8  },
  { label: 'Reason',      key: 'reason',     width: 28 },
  { label: 'Approved By', key: 'approvedBy', width: 18 },
  { label: 'Status',      key: 'status',     width: 12, format: v => LEAVE_STATUS[v]?.label ?? v },
];

// ─── Date helpers ──────────────────────────────────────────────────────────────
const calcDays = (f, t) => {
  if (!f || !t) return 0;
  const diff = Math.ceil((new Date(t) - new Date(f)) / 86400000) + 1;
  return diff > 0 ? diff : 0;
};

// "Mar 10, 2026" OR "2026-03-10" OR ISO → always "2026-03-10" for <input type="date">
const toISO = (raw) => {
  if (!raw) return '';
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  // Use UTC to avoid timezone shift
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// For display in table & view modal
const fmtDisplay = (raw) => {
  if (!raw) return '—';
  const iso = toISO(raw);
  if (!iso) return String(raw);
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+m - 1]} ${+d}, ${y}`;
};

// ─── Input style ───────────────────────────────────────────────────────────────
const IS = (focused = false) => ({
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${focused ? COLORS.brand : COLORS.border}`,
  borderRadius: 8, padding: '9px 12px',
  fontSize: 13.5, color: COLORS.h1,
  background: COLORS.bg, outline: 'none',
  fontFamily: FONTS.sans, transition: 'border-color .15s',
});

// ─── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </label>
    {children}
  </div>
);

// ─── Focus-aware input components ─────────────────────────────────────────────
const FInput = ({ type = 'text', value, onChange, placeholder }) => {
  const [f, setF] = useState(false);
  return (
    <input type={type} value={value ?? ''} onChange={onChange} placeholder={placeholder}
      onFocus={() => setF(true)} onBlur={() => setF(false)} style={IS(f)} />
  );
};
const FSelect = ({ value, onChange, children }) => {
  const [f, setF] = useState(false);
  return (
    <select value={value ?? ''} onChange={onChange}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...IS(f), cursor: 'pointer' }}>
      {children}
    </select>
  );
};
const FTextarea = ({ value, onChange, placeholder, rows = 3 }) => {
  const [f, setF] = useState(false);
  return (
    <textarea value={value ?? ''} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...IS(f), resize: 'vertical' }} />
  );
};

// ─── Button ────────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = 'primary', small, disabled }) => {
  const V = {
    primary:           { background: COLORS.brand, color: '#fff',      border: 'none' },
    ghost:             { background: 'transparent', color: COLORS.body, border: `1px solid ${COLORS.border}` },
    success:           { background: '#16A34A',     color: '#fff',      border: 'none' },
    danger:            { background: '#DC2626',     color: '#fff',      border: 'none' },
    'outline-success': { background: '#F0FDF4',     color: '#16A34A',   border: '1px solid #BBF7D0' },
    'outline-danger':  { background: '#FEF2F2',     color: '#DC2626',   border: '1px solid #FECACA' },
    'outline-gray':    { background: COLORS.bg,     color: COLORS.body, border: `1px solid ${COLORS.border}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...V[variant],
      padding: small ? '4px 11px' : '9px 20px',
      borderRadius: 8, fontSize: small ? 11.5 : 13.5, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: FONTS.sans, opacity: disabled ? 0.6 : 1, whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  );
};

// ─── Modal shell ───────────────────────────────────────────────────────────────
const Modal = ({ show, onClose, title, width = 480, children }) => {
  if (!show) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.55)',
        zIndex: 900, backdropFilter: 'blur(3px)',
      }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 1000, background: '#fff', borderRadius: 16,
        padding: '28px 30px', width: `min(96vw,${width}px)`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
        border: `1px solid ${COLORS.border}`,
        fontFamily: FONTS.sans, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.h1 }}>{title}</span>
          <button onClick={onClose} style={{
            background: COLORS.bg, border: 'none', borderRadius: 8,
            width: 30, height: 30, cursor: 'pointer', fontSize: 18, color: COLORS.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
        {children}
      </div>
    </>
  );
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ t }) => {
  if (!t) return null;
  const bg = { success: '#16A34A', error: '#DC2626', info: COLORS.brand };
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      background: bg[t.type] || bg.info, color: '#fff',
      padding: '11px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)', fontFamily: FONTS.sans,
    }}>
      {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : 'ℹ '}{t.msg}
    </div>
  );
};

// ─── Row ⋯ dropdown ────────────────────────────────────────────────────────────
const ActionMenu = ({ leave, onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const item = (label, color, cb) => (
    <button key={label} onClick={() => { cb(); setOpen(false); }} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '8px 14px', border: 'none', background: 'transparent',
      fontSize: 13, color: color || COLORS.body, cursor: 'pointer',
      fontFamily: FONTS.sans, fontWeight: 600,
    }}
      onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >{label}</button>
  );

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        padding: '4px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`,
        background: COLORS.bg, cursor: 'pointer', fontSize: 16, color: COLORS.muted,
        fontFamily: FONTS.sans, lineHeight: 1,
      }}>⋯</button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 4px)',
          background: '#fff', border: `1px solid ${COLORS.border}`,
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 600, minWidth: 130, overflow: 'hidden',
        }}>
          {item('👁  View',   COLORS.h2, () => onView(leave))}
          {item('✏️  Edit',   COLORS.h2, () => onEdit(leave))}
          {item('🗑  Delete', '#DC2626', () => onDelete(leave))}
        </div>
      )}
    </div>
  );
};

// ─── View Modal ────────────────────────────────────────────────────────────────
const ViewModal = ({ leave, onClose }) => {
  const SC  = { approved: '#16A34A', pending: '#D97706', rejected: '#DC2626' };
  const SBG = { approved: '#F0FDF4', pending: '#FFFBEB', rejected: '#FEF2F2' };
  const TBG = { sick: '#FFF7ED', casual: '#EFF6FF', earned: '#F0FDF4' };
  const TC  = { sick: '#C2410C', casual: '#1D4ED8', earned: '#15803D' };

  return (
    <Modal show={!!leave} title="Leave Request Details" onClose={onClose} width={440}>
      {leave && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px 16px', background: COLORS.bg, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <Avatar name={leave.tech || leave.technicianName || '?'} size={42} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.h1 }}>{leave.tech || leave.technicianName}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>Technician</div>
            </div>
            <span style={{
              marginLeft: 'auto', padding: '4px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
              background: SBG[leave.status] || '#F3F4F6',
              color: SC[leave.status] || COLORS.body,
              border: `1px solid ${SC[leave.status] || COLORS.border}44`,
            }}>
              {LEAVE_STATUS[leave.status]?.label || leave.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 20 }}>
            {[
              ['Leave Type', (
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, background: TBG[leave.type] || '#F3F4F6', color: TC[leave.type] || COLORS.body, fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
                  {leave.type}
                </span>
              )],
              ['Duration',    <strong style={{ color: COLORS.h1 }}>{leave.days} day{leave.days > 1 ? 's' : ''}</strong>],
              ['From',        <span style={{ fontFamily: FONTS.mono, fontSize: 13 }}>{fmtDisplay(leave.from)}</span>],
              ['To',          <span style={{ fontFamily: FONTS.mono, fontSize: 13 }}>{fmtDisplay(leave.to)}</span>],
              ['Reason',      leave.reason || '—'],
              ['Approved By', leave.approvedBy || '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 13.5, color: COLORS.body }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
          </div>
        </>
      )}
    </Modal>
  );
};

// ─── Leave Form — KEY fix: useEffect resets form when `initial` changes ────────
const LeaveForm = ({ initial, technicians, onSave, onCancel, loading }) => {
  const blank = { tech: '', type: 'sick', from: '', to: '', reason: '' };
  const [form, setForm] = useState(blank);

  // Reset whenever the modal opens with new data (or blank for Apply)
  useEffect(() => {
    if (initial) {
      setForm({
        tech:   initial.tech   || initial.technicianName || '',
        type:   initial.type   || 'sick',
        from:   toISO(initial.from),   // ← normalise date format
        to:     toISO(initial.to),     // ← normalise date format
        reason: initial.reason || '',
      });
    } else {
      setForm(blank);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const s    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const days = calcDays(form.from, form.to);

  const handleSave = () => {
    if (!form.tech)   return alert('Please select a technician');
    if (!form.from)   return alert('Please select a start date');
    if (!form.to)     return alert('Please select an end date');
    if (!form.reason) return alert('Please enter a reason');
    onSave({ ...form, days });
  };

  return (
    <>
      <Field label="Technician">
        <FSelect value={form.tech} onChange={e => s('tech', e.target.value)}>
          <option value="">Select technician</option>
          {technicians.map(t => (
            <option key={t.id || t._id} value={t.name}>{t.name}</option>
          ))}
        </FSelect>
      </Field>

      <Field label="Leave Type">
        <FSelect value={form.type} onChange={e => s('type', e.target.value)}>
          {['sick', 'casual', 'earned'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} Leave</option>
          ))}
        </FSelect>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="From">
          <FInput type="date" value={form.from} onChange={e => s('from', e.target.value)} />
        </Field>
        <Field label="To">
          <FInput type="date" value={form.to} onChange={e => s('to', e.target.value)} />
        </Field>
      </div>

      {days > 0 && (
        <p style={{ margin: '-4px 0 14px', fontSize: 12.5, color: COLORS.muted }}>
          Duration: <strong style={{ color: COLORS.brand }}>{days} day{days > 1 ? 's' : ''}</strong>
        </p>
      )}

      <Field label="Reason">
        <FInput value={form.reason} onChange={e => s('reason', e.target.value)} placeholder="e.g. Fever and flu" />
      </Field>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save Changes' : 'Submit Request'}
        </Btn>
      </div>
    </>
  );
};

// ─── Apply Modal ───────────────────────────────────────────────────────────────
const ApplyModal = ({ show, onClose, onSave, loading, technicians }) => (
  <Modal show={show} title="Apply Leave" onClose={onClose}>
    {/* Unmount form when closed so state resets cleanly */}
    {show && (
      <LeaveForm
        initial={null}
        technicians={technicians}
        onSave={onSave}
        onCancel={onClose}
        loading={loading}
      />
    )}
  </Modal>
);

// ─── Edit Modal ────────────────────────────────────────────────────────────────
const EditModal = ({ leave, onClose, onSave, loading, technicians }) => (
  <Modal show={!!leave} title="Edit Leave Request" onClose={onClose}>
    {leave && (
      <LeaveForm
        initial={leave}
        technicians={technicians}
        onSave={onSave}
        onCancel={onClose}
        loading={loading}
      />
    )}
  </Modal>
);

// ─── Delete Modal ──────────────────────────────────────────────────────────────
const DeleteModal = ({ leave, onClose, onConfirm, loading }) => (
  <Modal show={!!leave} title="Delete Leave Request" onClose={onClose} width={400}>
    {leave && (
      <>
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 16px', marginBottom: 20, color: '#7F1D1D', fontSize: 13.5, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{leave.tech || leave.technicianName}</strong>'s{' '}
          <strong>{leave.type}</strong> leave ({leave.days} day{leave.days > 1 ? 's' : ''})?
          <br /><span style={{ fontSize: 12, color: '#991B1B' }}>This action cannot be undone.</span>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </Btn>
        </div>
      </>
    )}
  </Modal>
);

// ─── Approve / Reject Modal ────────────────────────────────────────────────────
const ActionModal = ({ target, onClose, onConfirm, loading }) => {
  const [note, setNote] = useState('');
  const isApprove = target?.action === 'approve';

  const handleClose   = () => { setNote(''); onClose(); };
  const handleConfirm = () => { onConfirm(target.action, note); setNote(''); };

  return (
    <Modal
      show={!!target}
      title={isApprove ? '✓ Approve Leave Request' : '✗ Reject Leave Request'}
      onClose={handleClose}
      width={420}
    >
      {target && (
        <>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Avatar name={target.leave.tech || target.leave.technicianName || '?'} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.h1 }}>{target.leave.tech || target.leave.technicianName}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>
                  {target.leave.type} leave · {target.leave.days} day{target.leave.days > 1 ? 's' : ''}
                </div>
              </div>
              <TypeTag type={target.leave.type} style={{ marginLeft: 'auto' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12.5, color: COLORS.body }}>
              <div><span style={{ color: COLORS.faint }}>From: </span>{fmtDisplay(target.leave.from)}</div>
              <div><span style={{ color: COLORS.faint }}>To: </span>{fmtDisplay(target.leave.to)}</div>
              <div style={{ gridColumn: '1/-1' }}><span style={{ color: COLORS.faint }}>Reason: </span>{target.leave.reason}</div>
            </div>
          </div>

          <Field label={isApprove ? 'Approval note (optional)' : 'Rejection reason (optional)'}>
            <FTextarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={isApprove ? 'Add a note for the technician…' : 'Explain the rejection…'}
            />
          </Field>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={handleClose}>Cancel</Btn>
            <Btn variant={isApprove ? 'success' : 'danger'} onClick={handleConfirm} disabled={loading}>
              {loading ? 'Processing…' : isApprove ? '✓ Confirm Approve' : '✗ Confirm Reject'}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const LeaveManagementPage = ({ openModal }) => {
  const [leaves,       setLeaves]       = useState(LEAVE_DATA);
  const [technicians,  setTechnicians]  = useState(TECHNICIANS);
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingAct,   setLoadingAct]   = useState(false);
  const [toast,        setToast]        = useState(null);

  // modal state
  const [showApply,    setShowApply]    = useState(false);
  const [viewTarget,   setViewTarget]   = useState(null);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── fetch on mount ────────────────────────────────────────────────────────────
useEffect(() => {
  leavesApi.list({ limit: 200 })
    .then(r => {
      const rows = Array.isArray(r) ? r : (r?.data ?? []);
      if (rows.length) {
        setLeaves(rows.map(l => ({
          ...l,
          id:   l.id   || l._id  || '',
          tech: l.tech || l.technicianName || l.technician?.name || '?',
          from: l.from ? String(l.from).slice(0, 10) : '',
          to:   l.to   ? String(l.to).slice(0, 10)   : '',
        })));
      }
    })
    .catch(() => {});

  techsApi.list({ limit: 200 })
    .then(r => {
      const rows = Array.isArray(r) ? r : (r?.data ?? []);
      if (rows.length) {
        // normalize: ensure both id and _id exist
        setTechnicians(rows.map(t => ({
          ...t,
          id: t.id || t._id || t.techId || '',
        })));
      }
    })
    .catch(() => {});
}, []);

  // ── search + filter ───────────────────────────────────────────────────────
  const { q, setQ, activeFilters, setFilter, filtered: searchFiltered } = useTableSearch(
    leaves, ['id', 'tech', 'type', 'reason'], { type: '' }
  );
  const filtered = searchFiltered.filter(l => !statusFilter || l.status === statusFilter);

  // ── pagination ────────────────────────────────────────────────────────────
  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } = usePagination(filtered, 10);

  // ── export ────────────────────────────────────────────────────────────────
  const { exportProps } = useExport({
    title: 'Leave Management', filename: 'cooltech-leave-requests',
    template: 'generic_list',
    subtitle: `AC Services Platform · Leave Requests · ${filtered.length} records`,
    docId: 'LEAVE-EXPORT', columns: LEAVE_COLUMNS, rows: filtered,
    showTotals: true, totalColumns: ['days'],
  });

  const leaveTypes = [...new Set(leaves.map(l => l.type).filter(Boolean))];

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  // Apply (Create)
  const handleApply = async (form) => {
    setLoadingAct(true);
    const newLeave = {
      id:         `LV-${Date.now()}`,
      tech:       form.tech,
      technicianName: form.tech,
      type:       form.type,
      from:       form.from,
      to:         form.to,
      days:       form.days,
      reason:     form.reason,
      approvedBy: '',
      status:     'pending',
    };
    // Optimistic
    setLeaves(prev => [newLeave, ...prev]);
    setShowApply(false);
    notify('Leave request submitted');
    try {
      const r = await leavesApi.create({
        technicianName: form.tech, type: form.type,
        from: form.from, to: form.to, days: form.days, reason: form.reason,
      });
      const saved = r?.data || r;
      if (saved?._id || saved?.id) {
        setLeaves(prev => prev.map(l =>
          l.id === newLeave.id
            ? { ...saved, id: saved.id || saved._id, tech: saved.technicianName || form.tech }
            : l
        ));
      }
    } catch {
      notify('Saved locally — backend unavailable', 'info');
    } finally {
      setLoadingAct(false);
    }
  };

  // Edit (Update)
  const handleEdit = async (form) => {
    setLoadingAct(true);
    const id = editTarget.id || editTarget._id;
    // Optimistic
    setLeaves(prev => prev.map(l =>
      (l.id === id || l._id === id)
        ? { ...l, tech: form.tech, technicianName: form.tech, type: form.type, from: form.from, to: form.to, days: form.days, reason: form.reason }
        : l
    ));
    setEditTarget(null);
    notify('Leave updated');
    try {
      await leavesApi.update(id, {
        technicianName: form.tech, type: form.type,
        from: form.from, to: form.to, days: form.days, reason: form.reason,
      });
    } catch {
      notify('Updated locally — backend unavailable', 'info');
    } finally {
      setLoadingAct(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    setLoadingAct(true);
    const id = deleteTarget.id || deleteTarget._id;
    setLeaves(prev => prev.filter(l => l.id !== id && l._id !== id));
    setDeleteTarget(null);
    notify('Leave deleted');
    try {
      await leavesApi.delete(id);
    } catch {
      notify('Deleted locally — backend unavailable', 'info');
    } finally {
      setLoadingAct(false);
    }
  };

  // Approve / Reject
  const handleAction = async (action, note) => {
    setLoadingAct(true);
    const leave = actionTarget.leave;
    const id    = leave.id || leave._id;
    setLeaves(prev => prev.map(l =>
      (l.id === id || l._id === id)
        ? { ...l, status: action === 'approve' ? 'approved' : 'rejected', approvedBy: action === 'approve' ? 'Admin User' : '', approvalNote: note }
        : l
    ));
    notify(action === 'approve' ? 'Leave approved!' : 'Leave rejected.', action === 'approve' ? 'success' : 'error');
    setActionTarget(null);
    try {
      await leavesApi[action === 'approve' ? 'approve' : 'reject'](id, { note, approvedBy: 'Admin User' });
    } catch {
      notify(`${action === 'approve' ? 'Approved' : 'Rejected'} locally — backend unavailable`, 'info');
    } finally {
      setLoadingAct(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <SectionHdr
        title="Leave Management"
        sub="Manage technician leave requests"
        action="+ Apply Leave"
        onAction={() => setShowApply(true)}
      />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <KCard label="Pending"    value={leaves.filter(l => l.status === 'pending').length}   sub="to review"      icon="⏳" iconBg="#FFFBEB" color="#B45309"      delay=""  />
        <KCard label="Approved"   value={leaves.filter(l => l.status === 'approved').length}  sub="this month"     icon="✅" iconBg="#F0FDF4" color="#16A34A"      delay="1" />
        <KCard label="Total Days" value={leaves.reduce((s, l) => s + (l.days || 0), 0)}       sub="days off taken" icon="📅" iconBg="#EFF6FF" color="#0369A1"      delay="2" />
        <KCard label="On Leave"   value={leaves.filter(l => l.status === 'approved' && l.days >= 2).length} sub="today" icon="🌴" iconBg="#FFF7ED" color={COLORS.brand} delay="3" />
      </div>

      {/* Leave Balance */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>Leave Balance – March 2026</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {technicians.map(t => {
            const tid = t.id || t._id;
            const bal = LEAVE_BALANCE[tid] || LEAVE_BALANCE[t.techId]  || LEAVE_BALANCE[t.name] || { casual: 10, sick: 6, earned: 12 };
            return (
              <div key={tid} style={{ background: COLORS.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Avatar name={t.name} size={28} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name.split(' ')[0]}
                  </div>
                </div>
                {[['Casual', bal.casual, 10], ['Sick', bal.sick, 7], ['Earned', bal.earned, 12]].map(([k, v, tot]) => (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: COLORS.faint, marginBottom: 2 }}>
                      <span>{k}</span>
                      <span style={{ fontWeight: 700, color: COLORS.h2 }}>{v}/{tot}</span>
                    </div>
                    <div style={{ height: 3, background: '#F1F5F9', borderRadius: 2 }}>
                      <div style={{ width: `${(v / tot) * 100}%`, height: '100%', background: COLORS.brand, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>

        {/* filter bar */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by technician, type, reason…" />
          <FilterSelect value={activeFilters.type} onChange={val => setFilter('type', val)} options={leaveTypes} allLabel="All Types" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={['pending', 'approved', 'rejected']} allLabel="All Statuses" />
          <div style={{ marginLeft: 'auto' }}><ExportDropdown {...exportProps} /></div>
        </div>

        {/* table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <Thead cols={['ID', 'Technician', 'Type', 'From', 'To', 'Days', 'Reason', 'Approved By', 'Status', '']} />
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '40px 14px', textAlign: 'center', color: COLORS.faint, fontSize: 13 }}>
                    No leave requests match your filters.
                  </td>
                </tr>
              )}
              {paginated.map((l, i) => (
                <tr key={l.id || l._id || i} className="row"
                  style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : '#FAFAFA' }}>

                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.brand }}>{l.id?.length > 10 ? `LV-${l.id.slice(-6).toUpperCase()}` : l.id}</span>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={l.tech || l.technicianName || '?'} size={26} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{l.tech || l.technicianName}</span>
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}><TypeTag type={l.type} /></td>

                  {/* ← fmtDisplay handles "Mar 10, 2026" AND "2026-03-10" */}
                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{fmtDisplay(l.from)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{fmtDisplay(l.to)}</td>

                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: COLORS.h2 }}>{l.days}</span>
                  </td>

                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.body, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.reason}
                  </td>

                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{l.approvedBy || ''}</td>

                  <td style={{ padding: '12px 14px' }}><SBadge s={l.status} map={LEAVE_STATUS} /></td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {l.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setActionTarget({ leave: l, action: 'approve' })}
                            style={{ padding: '4px 9px', borderRadius: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.sans, whiteSpace: 'nowrap' }}
                          >✓ Approve</button>
                          <button
                            onClick={() => setActionTarget({ leave: l, action: 'reject' })}
                            style={{ padding: '4px 9px', borderRadius: 5, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.sans, whiteSpace: 'nowrap' }}
                          >✗ Reject</button>
                        </>
                      )}
                      <ActionMenu
                        leave={l}
                        onView={setViewTarget}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <Pagination page={page} totalPages={totalPages} setPage={setPage}
            pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        )}
      </div>

      {/* ══ Modals ══════════════════════════════════════════════════════════ */}
      <ApplyModal
        show={showApply}
        onClose={() => setShowApply(false)}
        onSave={handleApply}
        loading={loadingAct}
        technicians={technicians}
      />
      <ViewModal   leave={viewTarget}   onClose={() => setViewTarget(null)} />
      <EditModal
        leave={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEdit}
        loading={loadingAct}
        technicians={technicians}
      />
      <DeleteModal leave={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loadingAct} />
      <ActionModal target={actionTarget} onClose={() => setActionTarget(null)} onConfirm={handleAction} loading={loadingAct} />

      <Toast t={toast} />
    </div>
  );
};

export default LeaveManagementPage;