import { useState, useEffect, useMemo, useCallback } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import ActionDropdown from '../../components/ui/ActionDropdown';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  'April 2026', 'March 2026', 'February 2026', 'January 2026',
  'December 2025', 'November 2025', 'October 2025',
];

const INCENTIVE_TYPES = ['Performance', 'Customer Rating', 'Special Duty', 'Referral', 'Project Bonus'];

const RECOVERY_OPTIONS = [
  { label: '1 month (full)',   months: 1 },
  { label: '2 months (split)', months: 2 },
  { label: '3 months (split)', months: 3 },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────
const EMPLOYEES = {
  'EMP-RK': { name: 'Ramesh Kumar',  role: 'Senior Technician',  avatar: 'RK', avatarBg: '#faeeda', avatarCol: '#854f0b' },
  'EMP-VS': { name: 'Vijay Singh',   role: 'Senior Technician',  avatar: 'VS', avatarBg: '#e6f1fb', avatarCol: '#185fa5' },
  'EMP-AD': { name: 'Arjun Das',     role: 'Technician',         avatar: 'AD', avatarBg: '#eaf3de', avatarCol: '#3b6d11' },
  'EMP-SY': { name: 'Suresh Yadav',  role: 'Junior Technician',  avatar: 'SY', avatarBg: '#faece7', avatarCol: '#993c1d' },
  'EMP-KN': { name: 'Kishore Naik',  role: 'Technician',         avatar: 'KN', avatarBg: '#eeedfe', avatarCol: '#534ab7' },
};

// ── Dynamically register a tech from outside (e.g. from TechniciansPage) ──
// so that prefilled modals can look up avatar/role even for API-fetched techs
const DYNAMIC_EMPLOYEES = {};

const resolveEmployee = (empId) =>
  EMPLOYEES[empId] || DYNAMIC_EMPLOYEES[empId] || {
    name: empId, role: 'Technician',
    avatar: empId.slice(0, 2).toUpperCase(), avatarBg: '#F3F4F6', avatarCol: '#374151',
  };

const INITIAL_ADVANCE_REQUESTS = [
  { id: 'ADV-001', empId: 'EMP-RK', amount: 5000,  requestDate: '12 Apr 2026', month: 'April 2026',    reason: 'Medical emergency — family hospitalisation',   recoveryMonths: 1, recoveryPlan: '₹5,000 in May 2026',             status: 'pending',  approvedBy: null,    approvedDate: null,          remarks: '' },
  { id: 'ADV-002', empId: 'EMP-VS', amount: 5000,  requestDate: '01 Mar 2026', month: 'March 2026',    reason: 'House rent deposit payment',                   recoveryMonths: 2, recoveryPlan: '₹2,500/month for 2 months',     status: 'approved', approvedBy: 'Admin', approvedDate: '02 Mar 2026', remarks: 'Approved — recovery starts Apr 2026' },
  { id: 'ADV-003', empId: 'EMP-AD', amount: 8000,  requestDate: '15 Apr 2026', month: 'April 2026',    reason: 'School fee payment for daughter',              recoveryMonths: 2, recoveryPlan: '₹4,000/month for 2 months',     status: 'pending',  approvedBy: null,    approvedDate: null,          remarks: '' },
  { id: 'ADV-004', empId: 'EMP-SY', amount: 2000,  requestDate: '05 Feb 2026', month: 'February 2026', reason: 'Two-wheeler repair for daily commute',         recoveryMonths: 1, recoveryPlan: '₹2,000 in Mar 2026',            status: 'approved', approvedBy: 'Admin', approvedDate: '06 Feb 2026', remarks: 'Approved' },
  { id: 'ADV-005', empId: 'EMP-KN', amount: 4000,  requestDate: '16 Apr 2026', month: 'April 2026',    reason: 'Wedding ceremony expenses',                   recoveryMonths: 2, recoveryPlan: '₹2,000/month for 2 months',     status: 'pending',  approvedBy: null,    approvedDate: null,          remarks: '' },
  { id: 'ADV-006', empId: 'EMP-RK', amount: 3000,  requestDate: '10 Jan 2026', month: 'January 2026',  reason: 'Emergency home repair after flooding',         recoveryMonths: 1, recoveryPlan: '₹3,000 in Feb 2026',            status: 'rejected', approvedBy: 'Admin', approvedDate: '11 Jan 2026', remarks: 'Rejected — advance already pending from Dec 2025' },
];

const INITIAL_INCENTIVE_REQUESTS = [
  { id: 'INC-001', empId: 'EMP-RK', amount: 4800, requestDate: '28 Mar 2026', month: 'March 2026',  reason: 'Completed 12 service calls with zero callbacks',     type: 'Performance',    approvedBy: 'Admin', approvedDate: '30 Mar 2026', status: 'approved', remarks: 'Excellent performance — approved in full' },
  { id: 'INC-002', empId: 'EMP-VS', amount: 3600, requestDate: '28 Mar 2026', month: 'March 2026',  reason: '10 service calls completed, 1 escalation resolved',  type: 'Performance',    approvedBy: 'Admin', approvedDate: '30 Mar 2026', status: 'approved', remarks: '' },
  { id: 'INC-003', empId: 'EMP-AD', amount: 2000, requestDate: '28 Mar 2026', month: 'March 2026',  reason: 'Positive customer feedback from 6 service visits',   type: 'Customer Rating', approvedBy: 'Admin', approvedDate: '30 Mar 2026', status: 'approved', remarks: '' },
  { id: 'INC-004', empId: 'EMP-SY', amount: 1200, requestDate: '28 Mar 2026', month: 'March 2026',  reason: 'Attended weekend emergency breakdown call',          type: 'Special Duty',   approvedBy: 'Admin', approvedDate: '30 Mar 2026', status: 'approved', remarks: '' },
  { id: 'INC-005', empId: 'EMP-KN', amount: 3000, requestDate: '28 Mar 2026', month: 'March 2026',  reason: 'Highest CSAT score this month — top performer',      type: 'Performance',    approvedBy: 'Admin', approvedDate: '30 Mar 2026', status: 'approved', remarks: '' },
  { id: 'INC-006', empId: 'EMP-RK', amount: 6000, requestDate: '17 Apr 2026', month: 'April 2026',  reason: 'Referral bonus — 2 new technicians onboarded',       type: 'Referral',       approvedBy: null,    approvedDate: null,          status: 'pending',  remarks: '' },
  { id: 'INC-007', empId: 'EMP-KN', amount: 8000, requestDate: '17 Apr 2026', month: 'April 2026',  reason: 'Project completion bonus — chiller unit overhaul',   type: 'Project Bonus',  approvedBy: null,    approvedDate: null,          status: 'pending',  remarks: '' },
];

const INITIAL_HISTORY = [
  { id: 'H-001', empId: 'EMP-VS', type: 'Advance',   month: 'March 2026',    amount: 5000, status: 'recovering', note: '₹2,500 deducted in Mar · ₹2,500 remaining in Apr', ref: 'ADV-002', requestDate: '01 Mar 2026', approvedBy: 'Admin', approvedDate: '02 Mar 2026', reason: 'House rent deposit payment',                   recoveryPlan: '₹2,500/month for 2 months',  remarks: 'Approved — recovery starts Apr 2026' },
  { id: 'H-002', empId: 'EMP-SY', type: 'Advance',   month: 'February 2026', amount: 2000, status: 'recovered',  note: 'Fully recovered in Mar payroll',                    ref: 'ADV-004', requestDate: '05 Feb 2026', approvedBy: 'Admin', approvedDate: '06 Feb 2026', reason: 'Two-wheeler repair for daily commute',          recoveryPlan: '₹2,000 in Mar 2026',         remarks: 'Approved' },
  { id: 'H-003', empId: 'EMP-RK', type: 'Incentive', month: 'March 2026',    amount: 4800, status: 'paid',       note: 'Added to Mar gross earnings',                       ref: 'INC-001', requestDate: '28 Mar 2026', approvedBy: 'Admin', approvedDate: '30 Mar 2026', reason: 'Completed 12 service calls with zero callbacks', incentiveType: 'Performance',    remarks: 'Excellent performance — approved in full' },
  { id: 'H-004', empId: 'EMP-VS', type: 'Incentive', month: 'March 2026',    amount: 3600, status: 'paid',       note: 'Added to Mar gross earnings',                       ref: 'INC-002', requestDate: '28 Mar 2026', approvedBy: 'Admin', approvedDate: '30 Mar 2026', reason: '10 service calls, 1 escalation resolved',        incentiveType: 'Performance',    remarks: '' },
  { id: 'H-005', empId: 'EMP-AD', type: 'Incentive', month: 'March 2026',    amount: 2000, status: 'paid',       note: 'Added to Mar gross earnings',                       ref: 'INC-003', requestDate: '28 Mar 2026', approvedBy: 'Admin', approvedDate: '30 Mar 2026', reason: 'Positive customer feedback from 6 service visits', incentiveType: 'Customer Rating', remarks: '' },
  { id: 'H-006', empId: 'EMP-SY', type: 'Incentive', month: 'March 2026',    amount: 1200, status: 'paid',       note: 'Added to Mar gross earnings',                       ref: 'INC-004', requestDate: '28 Mar 2026', approvedBy: 'Admin', approvedDate: '30 Mar 2026', reason: 'Attended weekend emergency breakdown call',       incentiveType: 'Special Duty',   remarks: '' },
  { id: 'H-007', empId: 'EMP-KN', type: 'Incentive', month: 'March 2026',    amount: 3000, status: 'paid',       note: 'Added to Mar gross earnings',                       ref: 'INC-005', requestDate: '28 Mar 2026', approvedBy: 'Admin', approvedDate: '30 Mar 2026', reason: 'Highest CSAT score this month — top performer',   incentiveType: 'Performance',    remarks: '' },
  { id: 'H-008', empId: 'EMP-RK', type: 'Advance',   month: 'January 2026',  amount: 3000, status: 'rejected',   note: 'Request rejected — duplicate advance',              ref: 'ADV-006', requestDate: '10 Jan 2026', approvedBy: 'Admin', approvedDate: '11 Jan 2026', reason: 'Emergency home repair after flooding',            recoveryPlan: '₹3,000 in Feb 2026',         remarks: 'Rejected — duplicate advance' },
];

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:    { label: 'Pending',    bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  approved:   { label: 'Approved',   bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  rejected:   { label: 'Rejected',   bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  paid:       { label: 'Paid',       bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  recovering: { label: 'Recovering', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  recovered:  { label: 'Recovered',  bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
};

function inr(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}
function genId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

const thStyle = (align = 'left') => ({
  padding: '10px 12px', fontSize: 11, fontWeight: 700, color: COLORS.faint,
  background: '#FAFAFA', borderBottom: `1px solid ${COLORS.border}`,
  textAlign: align, whiteSpace: 'nowrap',
});
const tdStyle = (extra = {}) => ({
  padding: '12px 12px', fontSize: 12.5,
  borderBottom: `1px solid ${COLORS.border}22`,
  verticalAlign: 'middle', ...extra,
});

// ─── Shared UI Primitives ─────────────────────────────────────────────────────
const EmpCell = ({ empId }) => {
  const e = resolveEmployee(empId);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: e.avatarBg, color: e.avatarCol, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
        {e.avatar}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{e.name}</div>
        <div style={{ fontSize: 10, color: COLORS.faint, fontFamily: FONTS.mono }}>{empId}</div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const m = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: m.bg, color: m.color, border: `1px solid ${m.border}`, whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
};

const TypeChip = ({ type }) => (
  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#F3F4F6', color: '#4B5563', border: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap' }}>
    {type}
  </span>
);

const KCard = ({ label, value, sub, icon, iconBg, color }) => (
  <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
    <div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: FONTS.mono, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.faint, marginTop: 4 }}>{sub}</div>
    </div>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
  </div>
);

const Overlay = ({ children, onClose }) => (
  <div
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

const ModalShell = ({ title, subtitle, accentColor = '#1a2e5c', wide = false, onClose, children }) => (
  <div style={{ background: '#fff', borderRadius: 14, width: wide ? 'min(720px,96vw)' : 'min(520px,95vw)', overflowY: 'auto', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,.22)', fontFamily: FONTS.sans }}>
    <div style={{ background: accentColor, borderRadius: '14px 14px 0 0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{title}</div>
        {subtitle && <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', fontSize: 16, lineHeight: 1 }}>✕</button>
    </div>
    {children}
  </div>
);

const DRow = ({ label, value }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}22` }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.faint, letterSpacing: '0.04em' }}>{label}</span>
    <span style={{ fontSize: 13, color: COLORS.h1 }}>{value}</span>
  </div>
);

// ─── REMARKS MODAL ────────────────────────────────────────────────────────────
const RemarksModal = ({ title, onConfirm, onClose }) => {
  const [remarks, setRemarks] = useState('');
  return (
    <Overlay onClose={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, width: 'min(420px,95vw)', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.2)', fontFamily: FONTS.sans }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 14 }}>Add remarks (optional) before confirming.</div>
        <textarea
          value={remarks} onChange={e => setRemarks(e.target.value)}
          placeholder="e.g. Approved — recovery starts next month"
          rows={3}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, resize: 'none', outline: 'none', boxSizing: 'border-box', color: COLORS.h1 }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: COLORS.muted }}>Cancel</button>
          <button onClick={() => onConfirm(remarks)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: '#fff' }}>Confirm</button>
        </div>
      </div>
    </Overlay>
  );
};

// ─── NEW REQUEST MODAL ────────────────────────────────────────────────────────
// prefillTech: { empId, name, role } — when opened from TechniciansPage
const NewRequestModal = ({ mode, onSubmit, onClose, prefillTech = null }) => {
  const isAdv = mode === 'advance';

  // ── If prefillTech is provided, register it in DYNAMIC_EMPLOYEES ──────────
  useEffect(() => {
    if (prefillTech?.empId && !EMPLOYEES[prefillTech.empId]) {
      DYNAMIC_EMPLOYEES[prefillTech.empId] = {
        name:      prefillTech.name,
        role:      prefillTech.role || 'Technician',
        avatar:    prefillTech.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        avatarBg:  '#EFF6FF',
        avatarCol: '#0369A1',
      };
    }
  }, [prefillTech]);

  const [form, setForm] = useState({
    empId:          prefillTech?.empId  || '',
    amount:         '',
    month:          'April 2026',
    reason:         '',
    recoveryMonths: 1,
    type:           'Performance',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.empId)  e.empId  = 'Select a technician';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const amt = Number(form.amount);
    const newItem = isAdv
      ? {
          id: genId('ADV'), empId: form.empId, amount: amt,
          requestDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          month: form.month, reason: form.reason,
          recoveryMonths: Number(form.recoveryMonths),
          recoveryPlan: Number(form.recoveryMonths) === 1
            ? `${inr(amt)} in full next month`
            : `${inr(Math.round(amt / form.recoveryMonths))}/month for ${form.recoveryMonths} months`,
          status: 'pending', approvedBy: null, approvedDate: null, remarks: '',
        }
      : {
          id: genId('INC'), empId: form.empId, amount: amt,
          requestDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          month: form.month, reason: form.reason, type: form.type,
          status: 'pending', approvedBy: null, approvedDate: null, remarks: '',
        };
    onSubmit(newItem);
  };

  const inputSt = (hasErr) => ({
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${hasErr ? '#DC2626' : COLORS.border}`,
    fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h1,
    outline: 'none', boxSizing: 'border-box', background: '#fff',
  });

  const Field = ({ label, required, children, error }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.faint, marginBottom: 5, letterSpacing: '0.05em' }}>
        {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 3 }}>{error}</div>}
    </div>
  );

  const amt      = Number(form.amount) || 0;
  const perMonth = form.recoveryMonths > 0 ? Math.round(amt / form.recoveryMonths) : 0;
  const emp      = resolveEmployee(form.empId);

  return (
    <Overlay onClose={onClose}>
      <ModalShell
        title={isAdv ? 'New Advance Request' : 'New Incentive Request'}
        subtitle={isAdv ? 'Deducted from payroll once approved' : 'Added to gross earnings once approved'}
        accentColor={isAdv ? '#1a2e5c' : '#0f3d2c'}
        onClose={onClose}
      >
        <div style={{ padding: '20px 24px 24px' }}>

          {/* ── If prefilled: show tech profile card instead of dropdown ── */}
          {prefillTech ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: emp.avatarBg, color: emp.avatarCol, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {emp.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>{emp.name}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{emp.role}</div>
              </div>
              <div style={{ fontSize: 11, fontFamily: FONTS.mono, color: '#0369A1', fontWeight: 700, background: '#E0F2FE', padding: '3px 9px', borderRadius: 6 }}>{prefillTech.empId}</div>
            </div>
          ) : (
            <Field label="TECHNICIAN" required error={errors.empId}>
              <select value={form.empId} onChange={e => set('empId', e.target.value)} style={inputSt(errors.empId)}>
                <option value="">— Select technician —</option>
                {Object.entries(EMPLOYEES).map(([id, e]) => (
                  <option key={id} value={id}>{e.name} ({id})</option>
                ))}
              </select>
            </Field>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="MONTH" required>
              <select value={form.month} onChange={e => set('month', e.target.value)} style={inputSt(false)}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>

            <Field label="AMOUNT (₹)" required error={errors.amount}>
              <input type="number" min="1" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="e.g. 5000" style={inputSt(errors.amount)} />
            </Field>

            {isAdv
              ? <Field label="RECOVERY PLAN" required>
                  <select value={form.recoveryMonths} onChange={e => set('recoveryMonths', e.target.value)} style={inputSt(false)}>
                    {RECOVERY_OPTIONS.map(o => <option key={o.months} value={o.months}>{o.label}</option>)}
                  </select>
                </Field>
              : <Field label="INCENTIVE TYPE" required>
                  <select value={form.type} onChange={e => set('type', e.target.value)} style={inputSt(false)}>
                    {INCENTIVE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
            }
          </div>

          <Field label="REASON / NOTES" required error={errors.reason}>
            <textarea
              value={form.reason} onChange={e => set('reason', e.target.value)}
              placeholder={isAdv ? 'Briefly explain why the advance is needed…' : 'Describe the performance or contribution…'}
              rows={3}
              style={{ ...inputSt(errors.reason), resize: 'none' }}
            />
          </Field>

          {/* Live preview */}
          {isAdv && amt > 0 && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#185FA5' }}>RECOVERY PREVIEW</div>
                <div style={{ fontSize: 12, color: '#2563EB', marginTop: 2 }}>{inr(perMonth)}/month × {form.recoveryMonths} month{form.recoveryMonths > 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#185FA5', fontFamily: FONTS.mono }}>{inr(amt)}</div>
            </div>
          )}
          {!isAdv && amt > 0 && form.empId && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>PAYOUT PREVIEW</div>
                <div style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>Added to {emp.name}'s gross in {form.month}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A', fontFamily: FONTS.mono }}>+{inr(amt)}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: COLORS.muted }}>Cancel</button>
            <button onClick={handleSubmit} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: '#fff' }}>Submit Request</button>
          </div>
        </div>
      </ModalShell>
    </Overlay>
  );
};

// ─── REQUEST DETAIL MODAL ─────────────────────────────────────────────────────
const RequestDetailModal = ({ item, mode, onClose }) => {
  if (!item) return null;
  const emp = resolveEmployee(item.empId);
  const isAdv = mode === 'advance';
  return (
    <Overlay onClose={onClose}>
      <ModalShell
        title={`${isAdv ? 'Advance' : 'Incentive'} Request — ${item.id}`}
        subtitle={item.month}
        accentColor={isAdv ? '#1a2e5c' : '#0f3d2c'}
        onClose={onClose}
      >
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '12px 14px', background: '#F9FAFB', borderRadius: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: emp.avatarBg, color: emp.avatarCol, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{emp.avatar}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>{emp.name}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>{emp.role} · {item.empId}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}><StatusBadge status={item.status} /></div>
          </div>
          <DRow label="AMOUNT"       value={<span style={{ fontFamily: FONTS.mono, fontWeight: 800, fontSize: 16, color: isAdv ? COLORS.brand : '#7C3AED' }}>{inr(item.amount)}</span>} />
          <DRow label="REQUESTED ON" value={item.requestDate} />
          <DRow label="MONTH"        value={item.month} />
          <DRow label="REASON"       value={item.reason} />
          {isAdv  && <DRow label="RECOVERY PLAN"  value={item.recoveryPlan} />}
          {!isAdv && <DRow label="TYPE"            value={<TypeChip type={item.type} />} />}
          {item.approvedBy && <DRow label="ACTIONED BY" value={`${item.approvedBy} on ${item.approvedDate}`} />}
          {item.remarks    && <DRow label="REMARKS"     value={<span style={{ color: COLORS.muted }}>{item.remarks}</span>} />}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: COLORS.muted }}>Close</button>
          </div>
        </div>
      </ModalShell>
    </Overlay>
  );
};

// ─── HISTORY DETAIL MODAL ─────────────────────────────────────────────────────
const HistoryDetailModal = ({ item, onClose }) => {
  if (!item) return null;
  const emp = resolveEmployee(item.empId);
  const isAdv = item.type === 'Advance';
  return (
    <Overlay onClose={onClose}>
      <ModalShell
        title={`Transaction Detail — ${item.ref}`}
        subtitle={`${item.type} · ${item.month}`}
        accentColor={isAdv ? '#1a2e5c' : '#0f3d2c'}
        onClose={onClose}
      >
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '12px 14px', background: '#F9FAFB', borderRadius: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: emp.avatarBg, color: emp.avatarCol, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{emp.avatar}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>{emp.name}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>{emp.role} · {item.empId}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}><StatusBadge status={item.status} /></div>
          </div>
          <DRow label="TYPE"         value={<span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: isAdv ? '#FEF2F2' : '#F5F3FF', color: isAdv ? '#DC2626' : '#7C3AED', border: `1px solid ${isAdv ? '#FECACA' : '#DDD6FE'}` }}>{item.type}</span>} />
          <DRow label="AMOUNT"       value={<span style={{ fontFamily: FONTS.mono, fontWeight: 800, fontSize: 16, color: isAdv ? '#DC2626' : '#7C3AED' }}>{inr(item.amount)}</span>} />
          <DRow label="MONTH"        value={item.month} />
          <DRow label="REQUESTED ON" value={item.requestDate} />
          <DRow label="REASON"       value={item.reason} />
          {isAdv && item.recoveryPlan   && <DRow label="RECOVERY PLAN"  value={item.recoveryPlan} />}
          {!isAdv && item.incentiveType && <DRow label="INCENTIVE TYPE" value={<TypeChip type={item.incentiveType} />} />}
          <DRow label="APPROVED BY"  value={`${item.approvedBy} on ${item.approvedDate}`} />
          {item.remarks && <DRow label="REMARKS"      value={<span style={{ color: COLORS.muted }}>{item.remarks}</span>} />}
          <DRow label="PAYROLL NOTE" value={<span style={{ color: COLORS.muted }}>{item.note}</span>} />
          <DRow label="REF ID"       value={<span style={{ fontFamily: FONTS.mono, color: COLORS.faint }}>{item.ref}</span>} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: COLORS.muted }}>Close</button>
          </div>
        </div>
      </ModalShell>
    </Overlay>
  );
};

// ─── TECHNICIAN HISTORY MODAL ─────────────────────────────────────────────────
const TechnicianHistoryModal = ({ empId, onClose }) => {
  const emp = resolveEmployee(empId);
  const records = INITIAL_HISTORY.filter(r => r.empId === empId);
  const [typeFilter, setTypeFilter] = useState('');
  const visible = typeFilter ? records.filter(r => r.type === typeFilter) : records;

  const totalAdv   = records.filter(r => r.type === 'Advance').reduce((s, r) => s + r.amount, 0);
  const totalInc   = records.filter(r => r.type === 'Incentive').reduce((s, r) => s + r.amount, 0);
  const recovering = records.filter(r => r.status === 'recovering').length;

  return (
    <Overlay onClose={onClose}>
      <ModalShell
        title={`All Transactions — ${emp.name}`}
        subtitle={`${emp.role} · ${empId} · ${records.length} total records`}
        accentColor="#1a2e5c"
        wide
        onClose={onClose}
      >
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Advances',    value: inr(totalAdv),  color: '#DC2626', bg: '#FEF2F2' },
              { label: 'Total Incentives',  value: inr(totalInc),  color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Active Recoveries', value: recovering,     color: '#2563EB', bg: '#EFF6FF' },
            ].map(k => (
              <div key={k.label} style={{ background: k.bg, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: FONTS.mono, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['', 'Advance', 'Incentive'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer', fontWeight: 600, border: `1px solid ${COLORS.border}`, background: typeFilter === t ? COLORS.brand : '#fff', color: typeFilter === t ? '#fff' : COLORS.muted }}>{t || 'All'}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.faint, alignSelf: 'center' }}>{visible.length} records</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
            {visible.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: COLORS.faint }}>No records found</div>}
            {visible.map(rec => {
              const isAdv = rec.type === 'Advance';
              return (
                <div key={rec.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px', background: '#FAFAFA', display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: isAdv ? '#FEF2F2' : '#F5F3FF', color: isAdv ? '#DC2626' : '#7C3AED', border: `1px solid ${isAdv ? '#FECACA' : '#DDD6FE'}` }}>{rec.type}</span>
                      <span style={{ fontSize: 11, color: COLORS.faint, fontFamily: FONTS.mono }}>{rec.ref}</span>
                      <span style={{ fontSize: 11, color: COLORS.muted }}>{rec.month}</span>
                      <StatusBadge status={rec.status} />
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.h2, marginBottom: 4 }}>{rec.reason}</div>
                    <div style={{ fontSize: 11, color: COLORS.faint }}>{rec.note}</div>
                    {isAdv && rec.recoveryPlan  && <div style={{ fontSize: 11, color: '#2563EB', marginTop: 3 }}>Recovery: {rec.recoveryPlan}</div>}
                    {!isAdv && rec.incentiveType && <div style={{ marginTop: 4 }}><TypeChip type={rec.incentiveType} /></div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: FONTS.mono, color: isAdv ? '#DC2626' : '#7C3AED' }}>{inr(rec.amount)}</div>
                    <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 2 }}>Req: {rec.requestDate}</div>
                    <div style={{ fontSize: 10, color: COLORS.faint }}>By: {rec.approvedBy}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: COLORS.muted }}>Close</button>
          </div>
        </div>
      </ModalShell>
    </Overlay>
  );
};

// ─── ADVANCE TAB ──────────────────────────────────────────────────────────────
// accepts prefillTech from parent (passed down from openModal context)
const AdvanceTab = ({ prefillTech = null, onClearPrefill }) => {
  const [data, setData]               = useState(INITIAL_ADVANCE_REQUESTS);
  const [selMonth, setSelMonth]       = useState('April 2026');
  // Auto-open modal if prefillTech provided
  const [showNew, setShowNew]         = useState(!!prefillTech);
  const [activePrefill, setActivePrefill] = useState(prefillTech);
  const [remarksModal, setRemarksModal] = useState(null);
  const [detailItem, setDetailItem]   = useState(null);

  // When prefillTech changes (e.g. user clicks "Give Advance" for a different tech), update
  useEffect(() => {
    if (prefillTech) {
      setActivePrefill(prefillTech);
      setShowNew(true);
    }
  }, [prefillTech]);

  const { q, setQ, activeFilters, setFilter, filtered } = useTableSearch(data, ['empId', 'reason', 'id'], { status: '' });
  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } = usePagination(filtered, 10);

  const handleAction = (id, action, remarks) => {
    setData(prev => prev.map(r => r.id === id ? { ...r, status: action, approvedBy: 'Admin', approvedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), remarks } : r));
    setRemarksModal(null);
  };

  const summary = useMemo(() => ({
    pending:     data.filter(r => r.status === 'pending').length,
    totalReq:    data.filter(r => r.month === selMonth).reduce((s, r) => s + r.amount, 0),
    approved:    data.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0),
    outstanding: data.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0),
  }), [data, selMonth]);

  const COLS = [
    { label: 'Ref ID',       key: 'id',          width: 10 },
    { label: 'Emp ID',       key: 'empId',        width: 9  },
    { label: 'Name',         key: 'empId',        width: 16, format: v => resolveEmployee(v)?.name || v },
    { label: 'Amount',       key: 'amount',       width: 9,  format: v => `₹${Number(v).toLocaleString()}` },
    { label: 'Requested On', key: 'requestDate',  width: 12 },
    { label: 'Month',        key: 'month',        width: 12 },
    { label: 'Reason',       key: 'reason',       width: 28 },
    { label: 'Recovery',     key: 'recoveryPlan', width: 16 },
    { label: 'Status',       key: 'status',       width: 10 },
    { label: 'Actioned By',  key: 'approvedBy',   width: 10, format: v => v || '—' },
    { label: 'Remarks',      key: 'remarks',      width: 18, format: v => v || '—' },
  ];
  const { exportProps } = useExport({ title: 'Advance Requests', filename: `advance-requests-${selMonth.replace(' ', '-')}`, template: 'generic_list', subtitle: `CoolTech AC Services · ${selMonth} · ${filtered.length} records`, docId: 'ADV-EXPORT', columns: COLS, rows: filtered });

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <KCard label="Pending Approvals"   value={summary.pending}           sub="awaiting action"  icon="⏳" iconBg="#FFFBEB" color="#D97706" />
        <KCard label="Requested (Month)"   value={inr(summary.totalReq)}     sub={selMonth}         icon="💸" iconBg="#FEF2F2" color="#DC2626" />
        <KCard label="Total Approved"      value={inr(summary.approved)}     sub="all time"         icon="✓" iconBg="#F0FDF4" color="#16A34A" />
        <KCard label="Outstanding Balance" value={inr(summary.outstanding)}  sub="to be recovered"  icon="↩" iconBg="#EFF6FF" color="#2563EB" />
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, reason, ref ID…" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['pending', 'approved', 'rejected']} allLabel="All Statuses" />
          <select value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12.5, background: '#fff', color: COLORS.h1, cursor: 'pointer', outline: 'none', fontFamily: FONTS.sans }}>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => { setActivePrefill(null); setShowNew(true); }} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 700, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: '#fff', cursor: 'pointer' }}>+ New Request</button>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1160 }}>
            <thead>
              <tr>
                <th style={thStyle()}>TECHNICIAN</th>
                <th style={thStyle('right')}>AMOUNT</th>
                <th style={thStyle()}>REQUESTED ON</th>
                <th style={thStyle()}>MONTH</th>
                <th style={thStyle()}>REASON</th>
                <th style={thStyle()}>RECOVERY PLAN</th>
                <th style={thStyle()}>STATUS</th>
                <th style={thStyle()}>ACTIONED BY</th>
                <th style={thStyle()}>REMARKS</th>
                <th style={thStyle()}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={10} style={{ ...tdStyle(), textAlign: 'center', padding: 40, color: COLORS.faint }}>No advance requests found.</td></tr>
              )}
              {paginated.map((req, i) => (
                <tr key={req.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', cursor: 'pointer' }} onClick={() => setDetailItem(req)}>
                  <td style={tdStyle()}><EmpCell empId={req.empId} /></td>
                  <td style={tdStyle({ textAlign: 'right' })}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800, color: COLORS.brand }}>{inr(req.amount)}</span></td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: COLORS.muted }}>{req.requestDate}</span></td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: COLORS.muted }}>{req.month}</span></td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: COLORS.h2, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason}</span></td>
                  <td style={tdStyle()}><span style={{ fontSize: 11, color: COLORS.muted, fontFamily: FONTS.mono }}>{req.recoveryPlan}</span></td>
                  <td style={tdStyle()}><StatusBadge status={req.status} /></td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: req.approvedBy ? COLORS.muted : COLORS.faint }}>{req.approvedBy || '—'}</span></td>
                  <td style={tdStyle()}><span style={{ fontSize: 11, color: COLORS.faint, maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.remarks || '—'}</span></td>
                  <td style={tdStyle()}>
                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => setRemarksModal({ id: req.id, action: 'approved' })} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => setRemarksModal({ id: req.id, action: 'rejected' })} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>Reject</button>
                        </>
                      )}
                      <button onClick={() => setDetailItem(req)} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: '#fff', color: COLORS.muted, cursor: 'pointer' }}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      {showNew      && <NewRequestModal    mode="advance"  prefillTech={activePrefill} onSubmit={item => { setData(p => [item, ...p]); setShowNew(false); setActivePrefill(null); if (onClearPrefill) onClearPrefill(); }} onClose={() => { setShowNew(false); setActivePrefill(null); if (onClearPrefill) onClearPrefill(); }} />}
      {remarksModal && <RemarksModal       title={remarksModal.action === 'approved' ? 'Approve Advance Request' : 'Reject Advance Request'} onConfirm={r => handleAction(remarksModal.id, remarksModal.action, r)} onClose={() => setRemarksModal(null)} />}
      {detailItem   && <RequestDetailModal item={detailItem} mode="advance"  onClose={() => setDetailItem(null)} />}
    </>
  );
};

// ─── INCENTIVE TAB ────────────────────────────────────────────────────────────
const IncentiveTab = () => {
  const [data, setData]               = useState(INITIAL_INCENTIVE_REQUESTS);
  const [selMonth, setSelMonth]       = useState('April 2026');
  const [showNew, setShowNew]         = useState(false);
  const [remarksModal, setRemarksModal] = useState(null);
  const [detailItem, setDetailItem]   = useState(null);

  const { q, setQ, activeFilters, setFilter, filtered } = useTableSearch(data, ['empId', 'reason', 'id', 'type'], { status: '', type: '' });
  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } = usePagination(filtered, 10);

  const handleAction = (id, action, remarks) => {
    setData(prev => prev.map(r => r.id === id ? { ...r, status: action, approvedBy: 'Admin', approvedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), remarks } : r));
    setRemarksModal(null);
  };

  const summary = useMemo(() => ({
    pending:  data.filter(r => r.status === 'pending').length,
    totalReq: data.filter(r => r.month === selMonth).reduce((s, r) => s + r.amount, 0),
    approved: data.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0),
    avgPer: (() => {
      const a = data.filter(r => r.status === 'approved' && r.month === selMonth);
      return a.length ? Math.round(a.reduce((s, r) => s + r.amount, 0) / a.length) : 0;
    })(),
  }), [data, selMonth]);

  const COLS = [
    { label: 'Ref ID',       key: 'id',          width: 9  },
    { label: 'Emp ID',       key: 'empId',        width: 9  },
    { label: 'Name',         key: 'empId',        width: 16, format: v => resolveEmployee(v)?.name || v },
    { label: 'Amount',       key: 'amount',       width: 9,  format: v => `₹${Number(v).toLocaleString()}` },
    { label: 'Type',         key: 'type',         width: 14 },
    { label: 'Requested On', key: 'requestDate',  width: 12 },
    { label: 'Month',        key: 'month',        width: 12 },
    { label: 'Reason',       key: 'reason',       width: 28 },
    { label: 'Status',       key: 'status',       width: 10 },
    { label: 'Actioned By',  key: 'approvedBy',   width: 10, format: v => v || '—' },
    { label: 'Remarks',      key: 'remarks',      width: 16, format: v => v || '—' },
  ];
  const { exportProps } = useExport({ title: 'Incentive Requests', filename: `incentive-requests-${selMonth.replace(' ', '-')}`, template: 'generic_list', subtitle: `CoolTech AC Services · ${selMonth} · ${filtered.length} records`, docId: 'INC-EXPORT', columns: COLS, rows: filtered });

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <KCard label="Pending Approvals" value={summary.pending}        sub="awaiting action"   icon="⏳" iconBg="#FFFBEB" color="#D97706" />
        <KCard label="Requested (Month)" value={inr(summary.totalReq)} sub={selMonth}           icon="🎯" iconBg="#F5F3FF" color="#7C3AED" />
        <KCard label="Total Approved"    value={inr(summary.approved)} sub="all time"           icon="✓" iconBg="#F0FDF4" color="#16A34A" />
        <KCard label="Avg per Technician"value={inr(summary.avgPer)}   sub={`${selMonth} avg`} icon="📈" iconBg="#EFF6FF" color="#2563EB" />
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, type, reason…" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['pending', 'approved', 'rejected']} allLabel="All Statuses" />
          <FilterSelect value={activeFilters.type}   onChange={val => setFilter('type', val)}   options={INCENTIVE_TYPES} allLabel="All Types" />
          <select value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12.5, background: '#fff', color: COLORS.h1, cursor: 'pointer', outline: 'none', fontFamily: FONTS.sans }}>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setShowNew(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 700, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: '#fff', cursor: 'pointer' }}>+ New Request</button>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1120 }}>
            <thead>
              <tr>
                <th style={thStyle()}>TECHNICIAN</th>
                <th style={thStyle('right')}>AMOUNT</th>
                <th style={thStyle()}>TYPE</th>
                <th style={thStyle()}>REQUESTED ON</th>
                <th style={thStyle()}>MONTH</th>
                <th style={thStyle()}>REASON / NOTE</th>
                <th style={thStyle()}>STATUS</th>
                <th style={thStyle()}>ACTIONED BY</th>
                <th style={thStyle()}>REMARKS</th>
                <th style={thStyle()}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={10} style={{ ...tdStyle(), textAlign: 'center', padding: 40, color: COLORS.faint }}>No incentive requests found.</td></tr>
              )}
              {paginated.map((req, i) => (
                <tr key={req.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', cursor: 'pointer' }} onClick={() => setDetailItem(req)}>
                  <td style={tdStyle()}><EmpCell empId={req.empId} /></td>
                  <td style={tdStyle({ textAlign: 'right' })}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800, color: '#7C3AED' }}>{inr(req.amount)}</span></td>
                  <td style={tdStyle()}><TypeChip type={req.type} /></td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: COLORS.muted }}>{req.requestDate}</span></td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: COLORS.muted }}>{req.month}</span></td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: COLORS.h2, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason}</span></td>
                  <td style={tdStyle()}><StatusBadge status={req.status} /></td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: req.approvedBy ? COLORS.muted : COLORS.faint }}>{req.approvedBy || '—'}</span></td>
                  <td style={tdStyle()}><span style={{ fontSize: 11, color: COLORS.faint, maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.remarks || '—'}</span></td>
                  <td style={tdStyle()}>
                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => setRemarksModal({ id: req.id, action: 'approved' })} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => setRemarksModal({ id: req.id, action: 'rejected' })} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>Reject</button>
                        </>
                      )}
                      <button onClick={() => setDetailItem(req)} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: '#fff', color: COLORS.muted, cursor: 'pointer' }}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      {showNew      && <NewRequestModal    mode="incentive" onSubmit={item => { setData(p => [item, ...p]); setShowNew(false); }} onClose={() => setShowNew(false)} />}
      {remarksModal && <RemarksModal       title={remarksModal.action === 'approved' ? 'Approve Incentive Request' : 'Reject Incentive Request'} onConfirm={r => handleAction(remarksModal.id, remarksModal.action, r)} onClose={() => setRemarksModal(null)} />}
      {detailItem   && <RequestDetailModal item={detailItem} mode="incentive" onClose={() => setDetailItem(null)} />}
    </>
  );
};

// ─── HISTORY TAB ──────────────────────────────────────────────────────────────
const HistoryTab = () => {
  const [detailItem, setDetailItem]   = useState(null);
  const [techHistEmp, setTechHistEmp] = useState(null);

  const { q, setQ, activeFilters, setFilter, filtered } = useTableSearch(INITIAL_HISTORY, ['empId', 'note', 'ref', 'reason'], { type: '', month: '' });
  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } = usePagination(filtered, 10);

  const summary = useMemo(() => ({
    totalAdvance:   INITIAL_HISTORY.filter(r => r.type === 'Advance').reduce((s, r) => s + r.amount, 0),
    totalIncentive: INITIAL_HISTORY.filter(r => r.type === 'Incentive').reduce((s, r) => s + r.amount, 0),
    recovering:     INITIAL_HISTORY.filter(r => r.status === 'recovering').length,
    txCount:        INITIAL_HISTORY.length,
  }), []);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <KCard label="Total Advances"     value={inr(summary.totalAdvance)}   sub="all time disbursed"   icon="💸" iconBg="#FEF2F2" color="#DC2626" />
        <KCard label="Total Incentives"   value={inr(summary.totalIncentive)} sub="all time paid out"    icon="🏆" iconBg="#F5F3FF" color="#7C3AED" />
        <KCard label="Active Recoveries"  value={summary.recovering}          sub="advances in progress" icon="↩" iconBg="#EFF6FF" color="#2563EB" />
        <KCard label="Total Transactions" value={summary.txCount}             sub="all records"          icon="📋" iconBg="#F9FAFB" color={COLORS.h2} />
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, ref ID, note…" />
          <FilterSelect value={activeFilters.type}  onChange={val => setFilter('type', val)}  options={['Advance', 'Incentive']} allLabel="All Types" />
          <FilterSelect value={activeFilters.month} onChange={val => setFilter('month', val)} options={['April 2026', 'March 2026', 'February 2026', 'January 2026']} allLabel="All Months" />
          <div style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.faint }}>{filtered.length} records</div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
            <thead>
              <tr>
                <th style={thStyle()}>TECHNICIAN</th>
                <th style={thStyle()}>TYPE</th>
                <th style={thStyle()}>MONTH</th>
                <th style={thStyle('right')}>AMOUNT</th>
                <th style={thStyle()}>STATUS</th>
                <th style={thStyle()}>NOTE</th>
                <th style={thStyle()}>REF ID</th>
                <th style={thStyle()}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((rec, i) => {
                const isAdv = rec.type === 'Advance';
                return (
                  <tr key={rec.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', cursor: 'pointer' }} onClick={() => setDetailItem(rec)}>
                    <td style={tdStyle()}><EmpCell empId={rec.empId} /></td>
                    <td style={tdStyle()}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: isAdv ? '#FEF2F2' : '#F5F3FF', color: isAdv ? '#DC2626' : '#7C3AED', border: `1px solid ${isAdv ? '#FECACA' : '#DDD6FE'}` }}>{rec.type}</span>
                    </td>
                    <td style={tdStyle()}><span style={{ fontSize: 12, color: COLORS.muted }}>{rec.month}</span></td>
                    <td style={tdStyle({ textAlign: 'right' })}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800, color: isAdv ? '#DC2626' : '#7C3AED' }}>{inr(rec.amount)}</span></td>
                    <td style={tdStyle()}><StatusBadge status={rec.status} /></td>
                    <td style={tdStyle()}><span style={{ fontSize: 12, color: COLORS.muted }}>{rec.note}</span></td>
                    <td style={tdStyle()}><span style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.faint }}>{rec.ref}</span></td>
                    <td style={tdStyle()}>
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setDetailItem(rec)} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: '#fff', color: COLORS.muted, cursor: 'pointer' }}>View</button>
                        <button onClick={() => setTechHistEmp(rec.empId)} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: '#fff', color: COLORS.muted, cursor: 'pointer' }}>History</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      {detailItem  && <HistoryDetailModal     item={detailItem}  onClose={() => setDetailItem(null)} />}
      {techHistEmp && <TechnicianHistoryModal empId={techHistEmp} onClose={() => setTechHistEmp(null)} />}
    </>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'advance',   label: 'Advance Requests'   },
  { key: 'incentive', label: 'Incentive Requests'  },
  { key: 'history',   label: 'Transaction History' },
];

// prefillAdvance:     { empId, name, role } — passed from App when "Give Advance" clicked on a tech
// onPrefillConsumed:  callback to clear prefillAdvance in App after modal opens (prevents re-trigger on back navigation)
const AdvanceIncentivePage = ({ prefillAdvance = null, onPrefillConsumed }) => {
  const [activeTab,   setActiveTab]   = useState('advance');
  const [prefillTech, setPrefillTech] = useState(prefillAdvance);

  // When App passes a new prefillAdvance (e.g. user clicks Give Advance on a different tech),
  // switch to the Advance tab and store it locally, then tell App to clear it.
  useEffect(() => {
    if (prefillAdvance) {
      setActiveTab('advance');
      setPrefillTech(prefillAdvance);
      // Clear in App so navigating away and back doesn't re-open the modal
      if (onPrefillConsumed) onPrefillConsumed();
    }
  }, [prefillAdvance]);

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.h1 }}>Advance & Incentive</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Manage requests, approvals, and payroll deduction history</div>
      </div>

      <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s', fontFamily: FONTS.sans, background: activeTab === tab.key ? '#fff' : 'transparent', color: activeTab === tab.key ? COLORS.h1 : COLORS.muted, boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}
          >{tab.label}</button>
        ))}
      </div>

      {activeTab === 'advance'   && <AdvanceTab prefillTech={prefillTech} onClearPrefill={() => setPrefillTech(null)} />}
      {activeTab === 'incentive' && <IncentiveTab />}
      {activeTab === 'history'   && <HistoryTab />}
    </div>
  );
};

export default AdvanceIncentivePage;