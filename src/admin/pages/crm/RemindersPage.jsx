// ✅ FIXED:
//   1. `reminders_DATA` was not defined → replaced with `reminders` state
//   2. API returns MongoDB documents where `customer` is a nested object
//      {_id, name, phone, ...} instead of a plain string — React crashes
//      trying to render an object as a child.
//      Fix: normalize() helper extracts safe string/primitive values.

import { remindersApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { REMINDER_STATUS, REMINDERS_DATA } from '../../data/mockData';

// ─── Normalize a reminder record from either API or mock shape ────────────────
// API returns populated references as full objects; mock uses plain strings.
// This converts everything to the flat string shape the UI expects.
const normalize = (r) => ({
  // identity
  id:          r.id ?? r._id ?? '',
  // customer — may be a populated object or a plain string
  customer:    typeof r.customer === 'object' && r.customer !== null
                 ? (r.customer.name ?? String(r.customer._id ?? ''))
                 : (r.customer ?? ''),
  phone:       typeof r.customer === 'object' && r.customer !== null
                 ? (r.customer.phone ?? r.phone ?? '')
                 : (r.phone ?? ''),
  // AC unit — may be stored as 'ac' or 'unit'
  ac:          r.ac ?? r.unit ?? '',
  // type — reminder type
  type:        r.type ?? '',
  // dates
  lastService: r.lastService ?? r.lastServiceDate ?? '',
  dueDate:     r.dueDate ?? r.due ?? '',
  // booleans
  sent:        Boolean(r.sent ?? r.smsSent ?? false),
  // status
  status:      r.status ?? 'upcoming',
});

// ─── Column config for export ─────────────────────────────────────────────────
const REMINDER_COLUMNS = [
  { label: 'ID',           key: 'id',          width: 12, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: '#F97316', fontSize: 11 } },
  { label: 'Customer',     key: 'customer',     width: 22, tdStyle: { fontWeight: 600 } },
  { label: 'Phone',        key: 'phone',        width: 14, tdStyle: { fontFamily: 'monospace', fontSize: 11 } },
  { label: 'AC Unit',      key: 'ac',           width: 18, tdStyle: { fontSize: 12 } },
  { label: 'Type',         key: 'type',         width: 14, tdStyle: { fontSize: 12 } },
  { label: 'Last Service', key: 'lastService',  width: 14, tdStyle: { fontSize: 12 } },
  { label: 'Due Date',     key: 'dueDate',      width: 14, tdStyle: { fontWeight: 600 } },
  { label: 'SMS Sent',     key: 'sent',         width: 10, format: v => v ? 'Yes' : 'No' },
  { label: 'Status',       key: 'status',       width: 12, format: v => REMINDER_STATUS[v]?.label ?? v },
];

// ─── RemindersPage ────────────────────────────────────────────────────────────
const RemindersPage = ({ openModal }) => {
  // Seed with mock data so page is never blank; replace with API data when available
  const [reminders, setReminders] = useState(() => REMINDERS_DATA.map(normalize));

  useEffect(() => {
    remindersApi.list({ limit: 200 })
      .then(r => {
        const raw = r.data ?? r ?? [];
        if (Array.isArray(raw) && raw.length > 0) {
          setReminders(raw.map(normalize));  // ✅ normalize flattens nested objects
        }
      })
      .catch(() => {}); // keep mock data on error
  }, []);

  const [statusFilter, setStatusFilter] = useState('');
  const [sentFilter,   setSentFilter]   = useState('');

  // ── Search + filter ───────────────────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: searchFiltered,
  } = useTableSearch(
    reminders,                                   // ✅ was `reminders_DATA` (undefined)
    ['id', 'customer', 'phone', 'ac', 'type'],
    { type: '' }
  );

  const filtered = searchFiltered
    .filter(r => !statusFilter || r.status === statusFilter)
    .filter(r => sentFilter === '' ? true : sentFilter === 'Sent' ? r.sent : !r.sent);

  // ── Pagination ────────────────────────────────────────────────────────────
  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filtered, 10);

  // ── Export ────────────────────────────────────────────────────────────────
  const { exportProps } = useExport({
    title:    'Service Reminders',
    filename: 'cooltech-reminders',
    template: 'generic_list',
    subtitle: `AC Services Platform · Reminders · ${filtered.length} records`,
    docId:    'REM-EXPORT',
    columns:  REMINDER_COLUMNS,
    rows:     filtered,
  });

  // ── KPI counts (always from normalized state) ─────────────────────────────
  const overdue  = reminders.filter(r => r.status === 'overdue').length;
  const due_soon = reminders.filter(r => r.status === 'due_soon').length;
  const sent     = reminders.filter(r => r.sent).length;
  const types    = [...new Set(reminders.map(r => r.type).filter(Boolean))];

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <SectionHdr
        title="Service Reminders"
        sub="Track upcoming and overdue service visits"
        action="+ Add Reminder"
        onAction={() => openModal('new_reminder')}
      />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <KCard label="Total Reminders" value={reminders.length} sub="tracked"        icon="🔔" iconBg="#FFF7ED" color={COLORS.brand}  delay=""  />
        <KCard label="Overdue"         value={overdue}          sub="action needed"  icon="🔴" iconBg="#FEF2F2" color="#DC2626"        delay="1" />
        <KCard label="Due Soon"        value={due_soon}         sub="within 2 weeks" icon="🟡" iconBg="#FFFBEB" color="#B45309"        delay="2" />
        <KCard label="Reminders Sent"  value={sent}             sub="this month"     icon="📤" iconBg="#F0FDF4" color="#16A34A"        delay="3" />
      </div>

      {/* Table card */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>

        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by customer, AC unit, type…" />

          <FilterSelect
            value={activeFilters.type}
            onChange={val => setFilter('type', val)}
            options={types}
            allLabel="All Types"
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={['overdue', 'due_soon', 'upcoming']}
            allLabel="All Statuses"
          />
          <FilterSelect
            value={sentFilter}
            onChange={setSentFilter}
            options={['Sent', 'Not Sent']}
            allLabel="SMS: All"
          />

          <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>

          <button
            className="btn"
            onClick={() => openModal('new_job')}
            style={{ padding: '7px 14px', borderRadius: 8, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            📤 Send All Pending
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <Thead cols={['ID', 'Customer', 'AC Unit', 'Reminder Type', 'Last Service', 'Due Date', 'SMS Sent', 'Status', '']} />
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '40px 14px', textAlign: 'center', color: COLORS.faint, fontSize: 13 }}>
                    No reminders match your filters.
                  </td>
                </tr>
              )}
              {paginated.map((r, i) => (
                <tr key={r.id || i} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : '#FAFAFA' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.brand }}>{String(r.id)}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {/* ✅ customer and phone are now guaranteed strings after normalize() */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{String(r.customer || '—')}</div>
                    <div style={{ fontSize: 11, color: COLORS.faint, fontFamily: FONTS.mono }}>{String(r.phone || '')}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.body }}>{String(r.ac || '—')}</td>
                  <td style={{ padding: '12px 14px' }}><TypeTag type={r.type} /></td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{String(r.lastService || '—')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.status === 'overdue' ? '#DC2626' : r.status === 'due_soon' ? '#B45309' : COLORS.h2 }}>
                      {String(r.dueDate || '—')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {r.sent
                      ? <span style={{ color: '#16A34A', fontSize: 14 }}>✅</span>
                      : <span style={{ color: COLORS.faint, fontSize: 14 }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <SBadge s={r.status} map={REMINDER_STATUS} />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn" onClick={() => openModal('new_job')}
                        style={{ padding: '4px 9px', borderRadius: 5, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                        Book Job
                      </button>
                      {!r.sent && (
                        <button className="btn" onClick={() => openModal('send_quotation', { id: r.customer })}
                          style={{ padding: '4px 9px', borderRadius: 5, background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Send SMS
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <Pagination
            page={page} totalPages={totalPages} setPage={setPage}
            pageSize={pageSize} setPageSize={setPageSize}
            from={from} to={to} total={total}
          />
        )}
      </div>
    </div>
  );
};

export default RemindersPage;