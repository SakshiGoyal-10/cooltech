import { useState, useEffect, useMemo } from 'react';
import { salaryApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import ActionDropdown from '../../components/ui/ActionDropdown';
import { ALL_ATTENDANCE } from '../../data/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWorkingDays(month, year) {
  const total = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= total; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function parseSelMonth(selMonth) {
  // selMonth is e.g. "March 2026"
  const [monthStr, yearStr] = selMonth.split(' ');
  const monthIdx = MONTH_NAMES.indexOf(monthStr);
  const year = parseInt(yearStr, 10);
  return { monthIdx, year };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MONTHS = [
  'April 2026','March 2026','February 2026','January 2026',
  'December 2025','November 2025','October 2025',
];

// Base salary config — NO daysWorked / leavesTaken / lop here; those come from attendance
const salaries_DATA = [
  {
    id: 'SAL-001', empId: 'EMP-RK', name: 'Ramesh Kumar', role: 'Senior Technician',
    avatar: 'RK', avatarBg: '#faeeda', avatarCol: '#854f0b',
    bank: 'SBI ••4521',
    basic: 32000, hra: 6400, travel: 2000, incentive: 4800,
    uniformAllw: 500, toolAllw: 800, overtime: 2400,
    pf: 1920, tds: 0, advance: 0,
    ytdGross: 321600,
  },
  {
    id: 'SAL-002', empId: 'EMP-VS', name: 'Vijay Singh', role: 'Senior Technician',
    avatar: 'VS', avatarBg: '#e6f1fb', avatarCol: '#185fa5',
    bank: 'HDFC ••8834',
    basic: 30000, hra: 6000, travel: 2000, incentive: 3600,
    uniformAllw: 500, toolAllw: 800, overtime: 1800,
    pf: 1800, tds: 0, advance: 5000,
    ytdGross: 296400,
  },
  {
    id: 'SAL-003', empId: 'EMP-AD', name: 'Arjun Das', role: 'Technician',
    avatar: 'AD', avatarBg: '#eaf3de', avatarCol: '#3b6d11',
    bank: 'ICICI ••3310',
    basic: 25000, hra: 5000, travel: 1500, incentive: 2000,
    uniformAllw: 500, toolAllw: 600, overtime: 0,
    pf: 1500, tds: 0, advance: 0,
    ytdGross: 204000,
  },
  {
    id: 'SAL-004', empId: 'EMP-SY', name: 'Suresh Yadav', role: 'Junior Technician',
    avatar: 'SY', avatarBg: '#faece7', avatarCol: '#993c1d',
    bank: 'BOB ••7721',
    basic: 20000, hra: 4000, travel: 1500, incentive: 1200,
    uniformAllw: 500, toolAllw: 400, overtime: 600,
    pf: 1200, tds: 0, advance: 2000,
    ytdGross: 160000,
  },
  {
    id: 'SAL-005', empId: 'EMP-KN', name: 'Kishore Naik', role: 'Technician',
    avatar: 'KN', avatarBg: '#eeedfe', avatarCol: '#534ab7',
    bank: 'Axis ••9900',
    basic: 26000, hra: 5200, travel: 2000, incentive: 3000,
    uniformAllw: 500, toolAllw: 600, overtime: 1200,
    pf: 1560, tds: 0, advance: 0,
    ytdGross: 231600,
  },
];

const STATUS_MAP = {
  paid:      { label: '✓ Paid',    bg: '#F0FDF4', color: '#16A34A' },
  pending:   { label: 'Pending',   bg: '#FFFBEB', color: '#D97706' },
  processed: { label: 'Processed', bg: '#EFF6FF', color: '#2563EB' },
  hold:      { label: 'On Hold',   bg: '#FEF2F2', color: '#DC2626' },
};

function inr(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KCard = ({ label, value, sub, icon, iconBg, color }) => (
  <div style={{
    background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 14,
    padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    boxShadow: '0 1px 4px rgba(0,0,0,.04)',
  }}>
    <div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: FONTS.mono, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.faint, marginTop: 4 }}>{sub}</div>
    </div>
    <div style={{
      width: 38, height: 38, borderRadius: 10, background: iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
    }}>{icon}</div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const m = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, background: m.bg, color: m.color,
      padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  );
};

// ─── Attendance Source Badge ───────────────────────────────────────────────────
const AttSourceBadge = ({ live }) => (
  <span style={{
    fontSize: 10, fontWeight: 700,
    background: live ? '#F0FDF4' : '#FFFBEB',
    color: live ? '#16A34A' : '#D97706',
    padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap',
    border: `1px solid ${live ? '#BBF7D0' : '#FDE68A'}`,
    marginLeft: 4,
  }}>
    {live ? '● Live' : '○ Static'}
  </span>
);

// ─── Payslip Modal ────────────────────────────────────────────────────────────
const PayslipModal = ({ emp, month, onClose }) => {
  if (!emp) return null;
  const NAVY = '#1a2e5c';
  const row = (label, value, bold = false, color = '#111') => (
    <tr>
      <td style={{
        padding: '6px 12px', fontSize: 12, color: '#555',
        borderBottom: '1px solid #f0f0f0', width: '50%',
      }}>{label}</td>
      <td style={{
        padding: '6px 12px', fontSize: 12, fontWeight: bold ? 700 : 400,
        color, borderBottom: '1px solid #f0f0f0',
        fontFamily: bold ? FONTS.mono : 'inherit', textAlign: 'right',
      }}>{value}</td>
    </tr>
  );
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: 'min(520px,95vw)',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', fontFamily: FONTS.sans,
      }}>
        {/* Header */}
        <div style={{
          background: NAVY, borderRadius: '14px 14px 0 0',
          padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>
              Payslip — {month}
              {emp.attLive && (
                <span style={{
                  marginLeft: 8, fontSize: 10, background: '#16A34A', color: '#fff',
                  padding: '2px 7px', borderRadius: 99, fontWeight: 700, verticalAlign: 'middle',
                }}>● Live Attendance</span>
              )}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{emp.id} · {emp.empId}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8,
              width: 30, height: 30, cursor: 'pointer', color: '#fff', fontSize: 16,
            }}
          >✕</button>
        </div>

        <div style={{ padding: '0 0 20px' }}>
          {/* Employee info strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
            borderBottom: '1px solid #f0f0f0', padding: '14px 20px',
          }}>
            {[
              ['Employee',    emp.name],
              ['Role',        emp.role],
              ['Emp ID',      emp.empId],
              ['Bank',        emp.bank],
              ['Days Worked', `${emp.daysWorked} / ${emp.totalDays}`],
              ['Leaves Taken',emp.leavesTaken],
              ['Absent Days', emp.absentDays ?? 0],
              ['Payment Date',emp.payDate],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '4px 0' }}>
                <span style={{ fontSize: 10, color: COLORS.faint, fontWeight: 700, display: 'block' }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.h1 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Attendance source note */}
          {emp.attLive && (
            <div style={{
              margin: '10px 20px 0',
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#16A34A',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ✓ Days worked & LOP auto-calculated from Attendance module
            </div>
          )}

          {/* Earnings */}
          <div style={{
            padding: '12px 20px 4px', fontSize: 11, fontWeight: 700,
            color: COLORS.faint, letterSpacing: '0.05em',
          }}>EARNINGS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {row('Basic Salary', inr(emp.basic))}
              {row('HRA (House Rent Allowance)', inr(emp.hra))}
              {row('Travel Allowance', inr(emp.travel))}
              {row('Performance Incentive', inr(emp.incentive))}
              {row('Uniform Allowance', inr(emp.uniformAllw))}
              {row('Tool & Equipment Allowance', inr(emp.toolAllw))}
              {emp.overtime > 0 && row('Overtime Pay', inr(emp.overtime), false, '#16A34A')}
              {row('Gross Earnings', inr(emp.gross), true, COLORS.brand)}
            </tbody>
          </table>

          {/* Deductions */}
          <div style={{
            padding: '12px 20px 4px', fontSize: 11, fontWeight: 700,
            color: COLORS.faint, letterSpacing: '0.05em', marginTop: 8,
          }}>DEDUCTIONS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {row('Provident Fund (PF)', inr(emp.pf), false, '#DC2626')}
              {row('TDS (Tax Deducted at Source)',
                emp.tds > 0 ? inr(emp.tds) : '—', false,
                emp.tds > 0 ? '#DC2626' : '#9ca3af')}
              {row('Advance Recovery',
                emp.advance > 0 ? inr(emp.advance) : '—', false,
                emp.advance > 0 ? '#DC2626' : '#9ca3af')}
              {row(
                `LOP — ${emp.absentDays ?? 0} absent day(s) × ${inr(Math.round(emp.basic / emp.totalDays))}/day`,
                emp.lop > 0 ? inr(emp.lop) : '—', false,
                emp.lop > 0 ? '#DC2626' : '#9ca3af',
              )}
              {row('Total Deductions', inr(emp.totalDed), true, '#DC2626')}
            </tbody>
          </table>

          {/* Net Pay */}
          <div style={{
            margin: '16px 20px 0',
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: 10, padding: '14px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>NET PAY (Take Home)</div>
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{emp.bank} · {emp.payDate}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A', fontFamily: FONTS.mono }}>
              {inr(emp.net)}
            </div>
          </div>

          {/* YTD */}
          <div style={{
            margin: '10px 20px 0',
            background: '#F9FAFB', border: `1px solid ${COLORS.border}`,
            borderRadius: 10, padding: '10px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, color: COLORS.muted }}>Year-to-Date Gross (YTD)</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.brand, fontFamily: FONTS.mono }}>
              {inr(emp.ytdGross)}
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, padding: '16px 20px 0', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
                background: '#fff', fontSize: 13, cursor: 'pointer', color: COLORS.muted,
              }}
            >Close</button>
            <button style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              📥 Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SalaryPage ───────────────────────────────────────────────────────────────
const SalaryPage = ({ openModal }) => {
  const [salaries, setSalaries] = useState([]);
  useEffect(() => { salaryApi.list({limit:200}).then(r=>setSalaries(r.data??[])).catch(()=>{}); }, []);
  const [selMonth, setSelMonth]       = useState('March 2026');
  const [payslipEmp, setPayslipEmp]   = useState(null);
  // Store only paid overrides separately so attendance data stays reactive
  const [paidOverrides, setPaidOverrides] = useState({});

  // ── Derive enriched data from attendance + selMonth ──────────────────────
  const data = useMemo(() => {
    const { monthIdx, year } = parseSelMonth(selMonth);
    const totalDays = getWorkingDays(monthIdx, year);

    return salaries_DATA.map(e => {
      // Look up live attendance record by empId ↔ techId
      const att = ALL_ATTENDANCE.find(a => a.techId === e.empId);
      const attLive = !!att;

      const daysWorked  = attLive ? att.presentDays : 0;
      const leavesTaken = attLive ? att.leaves      : 0;
      const absentDays  = attLive ? att.absentDays  : 0;

      // LOP = absent days × daily basic rate (weekends already excluded)
      const dailyRate = totalDays > 0 ? e.basic / totalDays : 0;
      const lop       = Math.round(absentDays * dailyRate);

      const gross    = e.basic + e.hra + e.travel + e.incentive + e.uniformAllw + e.toolAllw + e.overtime;
      const totalDed = e.pf + e.tds + e.advance + lop;
      const net      = gross - totalDed;

      // Default status based on whether they have any absent days
      const defaultStatus = 'pending';
      const payDate = '—';

      return {
        ...e,
        daysWorked, leavesTaken, absentDays,
        totalDays, lop, gross, totalDed, net,
        attLive,
        status:  (paidOverrides[e.id]?.status)  ?? defaultStatus,
        payDate: (paidOverrides[e.id]?.payDate) ?? payDate,
      };
    });
  }, [selMonth, paidOverrides]);

  const markPaid = (id) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    setPaidOverrides(prev => ({ ...prev, [id]: { status: 'paid', payDate: dateStr } }));
  };

  // ── Search + filter ───────────────────────────────────────────────────────
  const { q, setQ, activeFilters, setFilter, filtered } = useTableSearch(
    data, ['name', 'role', 'empId', 'bank'], { status: '' }
  );

  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filtered, 10);

  // ── KPI summaries ─────────────────────────────────────────────────────────
  const summary = useMemo(() => ({
    totalGross: data.reduce((s, e) => s + e.gross, 0),
    totalNet:   data.reduce((s, e) => s + e.net, 0),
    totalAdv:   data.reduce((s, e) => s + e.advance, 0),
    totalOT:    data.reduce((s, e) => s + e.overtime, 0),
    totalLOP:   data.reduce((s, e) => s + e.lop, 0),
    paid:       data.filter(e => e.status === 'paid').length,
    total:      data.length,
    ytdGross:   data.reduce((s, e) => s + e.ytdGross, 0),
    liveCount:  data.filter(e => e.attLive).length,
  }), [data]);

  // ── Export columns ────────────────────────────────────────────────────────
  const COLS = [
    { label: 'Emp ID',    key: 'empId',      width: 10, tdStyle: { fontFamily: 'monospace', fontWeight: 700, fontSize: 11 } },
    { label: 'Name',      key: 'name',       width: 16, tdStyle: { fontWeight: 600 } },
    { label: 'Role',      key: 'role',       width: 16 },
    { label: 'Days',      key: 'daysWorked', width: 7,  format: v => `${v}` },
    { label: 'Total Days',key: 'totalDays',  width: 8,  format: v => `${v}` },
    { label: 'Absent',    key: 'absentDays', width: 7,  format: v => `${v}` },
    { label: 'Basic',     key: 'basic',      width: 9,  format: v => `₹${Number(v).toLocaleString()}` },
    { label: 'HRA',       key: 'hra',        width: 8,  format: v => `₹${Number(v).toLocaleString()}` },
    { label: 'Travel',    key: 'travel',     width: 7,  format: v => `₹${Number(v).toLocaleString()}` },
    { label: 'Incentive', key: 'incentive',  width: 9,  format: v => `₹${Number(v).toLocaleString()}` },
    { label: 'Overtime',  key: 'overtime',   width: 9,  format: v => v ? `₹${Number(v).toLocaleString()}` : '—' },
    { label: 'Gross',     key: 'gross',      width: 10, format: v => `₹${Number(v).toLocaleString()}` },
    { label: 'PF',        key: 'pf',         width: 8,  format: v => `₹${Number(v).toLocaleString()}` },
    { label: 'TDS',       key: 'tds',        width: 7,  format: v => v ? `₹${Number(v).toLocaleString()}` : '—' },
    { label: 'Advance',   key: 'advance',    width: 8,  format: v => v ? `₹${Number(v).toLocaleString()}` : '—' },
    { label: 'LOP',       key: 'lop',        width: 7,  format: v => v ? `₹${Number(v).toLocaleString()}` : '—' },
    { label: 'Net Pay',   key: 'net',        width: 10, format: v => `₹${Number(v).toLocaleString()}` },
    { label: 'Status',    key: 'status',     width: 9 },
    { label: 'Pay Date',  key: 'payDate',    width: 11 },
  ];

  const { exportProps } = useExport({
    title: 'Salary Register', filename: `salary-${selMonth.replace(' ', '-')}`,
    template: 'generic_list',
    subtitle: `CoolTech AC Services · ${selMonth} · ${filtered.length} records`,
    docId: 'SAL-EXPORT', columns: COLS, rows: filtered,
    showTotals: true, totalColumns: ['basic', 'gross', 'pf', 'net'],
  });

  // ── Table helpers ─────────────────────────────────────────────────────────
  const th = (label, align = 'left') => (
    <th style={{
      padding: '10px 12px', fontSize: 11, fontWeight: 700, color: COLORS.faint,
      background: '#FAFAFA', borderBottom: `1px solid ${COLORS.border}`,
      textAlign: align, whiteSpace: 'nowrap',
    }}>
      {label}
    </th>
  );

  const td = (content, extra = {}) => (
    <td style={{
      padding: '12px 12px', fontSize: 12.5,
      borderBottom: `1px solid ${COLORS.border}22`,
      verticalAlign: 'middle', ...extra,
    }}>
      {content}
    </td>
  );

  // ── Attendance info banner ─────────────────────────────────────────────────
  const { monthIdx, year } = parseSelMonth(selMonth);
  const workingDays = getWorkingDays(monthIdx, year);

  return (
    <>
      <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.h1 }}>Salary</div>
            <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
              {selMonth} · Process monthly salaries
            </div>
            {/* Attendance sync status */}
            <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: '#F0FDF4', color: '#16A34A', fontWeight: 600,
                border: '1px solid #BBF7D0',
              }}>
                ● {summary.liveCount}/{summary.total} employees linked to Attendance
              </span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: '#EFF6FF', color: '#0369A1', fontWeight: 600,
                border: '1px solid #BFDBFE',
              }}>
                📅 {workingDays} working days
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={selMonth}
              onChange={e => setSelMonth(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8,
                border: `1px solid ${COLORS.border}`, fontSize: 13,
                background: '#fff', color: COLORS.h1, cursor: 'pointer',
                outline: 'none', fontFamily: FONTS.sans,
              }}
            >
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
            <button
              onClick={() => openModal?.('process_all_salary')}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
                color: '#fff', cursor: 'pointer',
                boxShadow: `0 3px 10px ${COLORS.brand}40`,
              }}
            >
              Process All
            </button>
          </div>
        </div>

        {/* ── KPI cards ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
          <KCard label="Total Gross"   value={`₹${(summary.totalGross / 1000).toFixed(1)}K`} sub="before deductions"   icon="💰" iconBg="#FFF7ED" color={COLORS.brand} />
          <KCard label="Total Net Pay" value={`₹${(summary.totalNet / 1000).toFixed(1)}K`}   sub="after all deductions" icon="✅" iconBg="#F0FDF4" color="#16A34A" />
          <KCard label="Overtime Pay"  value={`₹${(summary.totalOT / 1000).toFixed(1)}K`}    sub="this month total"     icon="⏱" iconBg="#F0F9FF" color="#0369A1" />
          <KCard label="Total LOP"     value={inr(summary.totalLOP)}                          sub="loss of pay (live)"   icon="📉" iconBg="#FEF2F2" color="#DC2626" />
          <KCard label="Paid"          value={`${summary.paid}/${summary.total}`}              sub="staff paid"           icon="✓" iconBg="#F0FDF4" color="#16A34A" />
          <KCard label="YTD Gross"     value={`₹${(summary.ytdGross / 100000).toFixed(2)}L`}  sub="year to date"         icon="📊" iconBg="#F5F3FF" color="#7C3AED" />
        </div>

        {/* ── Table card ──────────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`,
          boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip',
        }}>

          {/* Search + filter bar */}
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, role, bank…" />
            <FilterSelect
              value={activeFilters.status}
              onChange={val => setFilter('status', val)}
              options={['paid', 'pending', 'processed', 'hold']}
              allLabel="All Statuses"
            />
            <select
              value={selMonth}
              onChange={e => setSelMonth(e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
                fontSize: 12.5, background: '#fff', color: COLORS.h1,
                cursor: 'pointer', outline: 'none', fontFamily: FONTS.sans,
              }}
            >
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <ExportDropdown {...exportProps} />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1280 }}>
              <thead>
                <tr>
                  {th('TECHNICIAN')}
                  {th('ROLE')}
                  {th('DAYS', 'center')}
                  {th('ABSENT', 'center')}
                  {th('BASIC', 'right')}
                  {th('HRA', 'right')}
                  {th('TRAVEL', 'right')}
                  {th('INCENTIVE', 'right')}
                  {th('UNIFORM+TOOL', 'right')}
                  {th('OVERTIME', 'right')}
                  {th('GROSS', 'right')}
                  {th('PF', 'right')}
                  {th('TDS', 'right')}
                  {th('ADVANCE', 'right')}
                  {th('LOP', 'right')}
                  {th('NET PAY', 'right')}
                  {th('BANK')}
                  {th('PAY DATE')}
                  {th('STATUS')}
                  {th('')}
                </tr>
              </thead>
              <tbody>
                {paginated.map((emp, i) => (
                  <tr
                    key={emp.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', cursor: 'pointer' }}
                    onClick={() => setPayslipEmp(emp)}
                  >
                    {/* Technician */}
                    {td(
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: emp.avatarBg, color: emp.avatarCol,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                          {emp.avatar}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.h1 }}>{emp.name}</span>
                            <AttSourceBadge live={emp.attLive} />
                          </div>
                          <div style={{ fontSize: 10, color: COLORS.faint, fontFamily: FONTS.mono }}>{emp.empId}</div>
                        </div>
                      </div>
                    )}

                    {td(<span style={{ fontSize: 12, color: COLORS.muted }}>{emp.role}</span>)}

                    {/* Days worked — from attendance */}
                    {td(
                      <div style={{ textAlign: 'center' }}>
                        <span style={{
                          fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600,
                          color: emp.leavesTaken > 0 ? '#D97706' : COLORS.h2,
                        }}>
                          {emp.daysWorked}
                        </span>
                        <span style={{ fontSize: 10, color: COLORS.faint }}>/{emp.totalDays}</span>
                        {emp.leavesTaken > 0 && (
                          <div style={{ fontSize: 10, color: '#D97706' }}>{emp.leavesTaken}L</div>
                        )}
                      </div>,
                      { textAlign: 'center' }
                    )}

                    {/* Absent days — drives LOP */}
                    {td(
                      <div style={{ textAlign: 'center' }}>
                        <span style={{
                          fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600,
                          color: emp.absentDays > 0 ? '#DC2626' : COLORS.faint,
                        }}>
                          {emp.absentDays > 0 ? emp.absentDays : '—'}
                        </span>
                      </div>,
                      { textAlign: 'center' }
                    )}

                    {td(<span style={{ fontFamily: FONTS.mono, fontSize: 12 }}>{inr(emp.basic)}</span>, { textAlign: 'right' })}
                    {td(<span style={{ fontFamily: FONTS.mono, fontSize: 12 }}>{inr(emp.hra)}</span>, { textAlign: 'right' })}
                    {td(<span style={{ fontFamily: FONTS.mono, fontSize: 12 }}>{inr(emp.travel)}</span>, { textAlign: 'right' })}
                    {td(<span style={{ fontFamily: FONTS.mono, fontSize: 12 }}>{inr(emp.incentive)}</span>, { textAlign: 'right' })}

                    {/* Uniform + Tool combined */}
                    {td(
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 12 }}>
                          {inr(emp.uniformAllw + emp.toolAllw)}
                        </span>
                        <div style={{ fontSize: 10, color: COLORS.faint }}>
                          U:{inr(emp.uniformAllw)} T:{inr(emp.toolAllw)}
                        </div>
                      </div>
                    )}

                    {/* Overtime */}
                    {td(
                      <span style={{
                        fontFamily: FONTS.mono, fontSize: 12,
                        color: emp.overtime > 0 ? '#0369A1' : COLORS.faint,
                        fontWeight: emp.overtime > 0 ? 600 : 400,
                      }}>
                        {emp.overtime > 0 ? inr(emp.overtime) : '—'}
                      </span>,
                      { textAlign: 'right' }
                    )}

                    {td(<span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.brand }}>{inr(emp.gross)}</span>, { textAlign: 'right' })}
                    {td(<span style={{ fontFamily: FONTS.mono, fontSize: 12, color: '#DC2626' }}>{inr(emp.pf)}</span>, { textAlign: 'right' })}
                    {td(<span style={{ fontFamily: FONTS.mono, fontSize: 12, color: emp.tds > 0 ? '#DC2626' : COLORS.faint }}>{emp.tds > 0 ? inr(emp.tds) : '—'}</span>, { textAlign: 'right' })}
                    {td(<span style={{ fontFamily: FONTS.mono, fontSize: 12, color: emp.advance > 0 ? '#DC2626' : COLORS.faint }}>{emp.advance > 0 ? inr(emp.advance) : '—'}</span>, { textAlign: 'right' })}

                    {/* LOP — live from attendance */}
                    {td(
                      <span style={{
                        fontFamily: FONTS.mono, fontSize: 12,
                        color: emp.lop > 0 ? '#DC2626' : COLORS.faint,
                        fontWeight: emp.lop > 0 ? 600 : 400,
                      }}>
                        {emp.lop > 0 ? inr(emp.lop) : '—'}
                      </span>,
                      { textAlign: 'right' }
                    )}

                    {td(<span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800, color: '#16A34A' }}>{inr(emp.net)}</span>, { textAlign: 'right' })}
                    {td(<span style={{ fontSize: 11, color: COLORS.muted, fontFamily: FONTS.mono }}>{emp.bank}</span>)}
                    {td(<span style={{ fontSize: 11, color: emp.payDate === '—' ? COLORS.faint : COLORS.muted }}>{emp.payDate}</span>)}
                    {td(<StatusBadge status={emp.status} />)}
                    {td(
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {emp.status !== 'paid' && (
                          <button
                            onClick={() => markPaid(emp.id)}
                            style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                              border: 'none', background: '#F0FDF4', color: '#16A34A', cursor: 'pointer',
                            }}
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => setPayslipEmp(emp)}
                          style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                            border: `1px solid ${COLORS.border}`, background: '#fff',
                            color: COLORS.muted, cursor: 'pointer',
                          }}
                        >
                          Slip
                        </button>
                        <ActionDropdown
                          onView={() => setPayslipEmp(emp)}
                          onEdit={() => openModal?.('edit_salary', { id: emp.id })}
                          onDelete={() => openModal?.('delete_salary', { id: emp.id })}
                        />
                      </div>
                    )}
                  </tr>
                ))}
              </tbody>

              {/* Totals footer */}
              <tfoot>
                <tr style={{ background: '#F9FAFB' }}>
                  <td colSpan={10} style={{
                    padding: '10px 12px', fontSize: 12, fontWeight: 700, color: COLORS.h1,
                    borderTop: `2px solid ${COLORS.border}`,
                  }}>
                    Totals ({filtered.length} employees)
                  </td>
                  <td style={{
                    padding: '10px 12px', fontFamily: FONTS.mono, fontWeight: 800,
                    color: COLORS.brand, textAlign: 'right',
                    borderTop: `2px solid ${COLORS.border}`, fontSize: 13,
                  }}>
                    {inr(filtered.reduce((s, e) => s + e.gross, 0))}
                  </td>
                  <td style={{
                    padding: '10px 12px', fontFamily: FONTS.mono, fontWeight: 700,
                    color: '#DC2626', textAlign: 'right',
                    borderTop: `2px solid ${COLORS.border}`, fontSize: 12,
                  }}>
                    {inr(filtered.reduce((s, e) => s + e.pf, 0))}
                  </td>
                  <td style={{
                    padding: '10px 12px', fontFamily: FONTS.mono, color: COLORS.faint,
                    textAlign: 'right', borderTop: `2px solid ${COLORS.border}`, fontSize: 12,
                  }}>—</td>
                  <td style={{
                    padding: '10px 12px', fontFamily: FONTS.mono, fontWeight: 700,
                    color: '#DC2626', textAlign: 'right',
                    borderTop: `2px solid ${COLORS.border}`, fontSize: 12,
                  }}>
                    {inr(filtered.reduce((s, e) => s + e.advance, 0))}
                  </td>
                  <td style={{
                    padding: '10px 12px', fontFamily: FONTS.mono, fontWeight: 700,
                    color: '#DC2626', textAlign: 'right',
                    borderTop: `2px solid ${COLORS.border}`, fontSize: 12,
                  }}>
                    {inr(filtered.reduce((s, e) => s + e.lop, 0))}
                  </td>
                  <td style={{
                    padding: '10px 12px', fontFamily: FONTS.mono, fontWeight: 800,
                    color: '#16A34A', textAlign: 'right',
                    borderTop: `2px solid ${COLORS.border}`, fontSize: 13,
                  }}>
                    {inr(filtered.reduce((s, e) => s + e.net, 0))}
                  </td>
                  <td colSpan={4} style={{ borderTop: `2px solid ${COLORS.border}` }} />
                </tr>
              </tfoot>
            </table>
          </div>

          <Pagination
            page={page} totalPages={totalPages} setPage={setPage}
            pageSize={pageSize} setPageSize={setPageSize}
            from={from} to={to} total={total}
          />
        </div>
      </div>

      {/* Payslip modal */}
      {payslipEmp && (
        <PayslipModal
          emp={payslipEmp}
          month={selMonth}
          onClose={() => setPayslipEmp(null)}
        />
      )}
    </>
  );
};

export default SalaryPage;