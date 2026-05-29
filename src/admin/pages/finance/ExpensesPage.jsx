import { EXP_STATUS } from '../../constants/statusMaps';
import { expensesApi } from '../../services/api';
import { useState, useEffect, useRef } from 'react';
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

// ─── Column config for export ─────────────────────────────────────────────────
const EXPENSE_COLUMNS = [
  { label: '#',          key: 'id',       width: 10 },
  { label: 'Category',   key: 'category', width: 14 },
  { label: 'Technician', key: 'tech',     width: 20, tdStyle: { fontWeight: 600 } },
  { label: 'Description',key: 'desc',     width: 28 },
  { label: 'Date',       key: 'date',     width: 14 },
  { label: 'Amount',     key: 'amount',   width: 12, format: v => `₹${v.toLocaleString()}`, tdStyle: { fontFamily: 'monospace', fontWeight: 700 } },
  { label: 'Receipt',    key: 'receipt',  width: 10, format: v => v ? 'Yes' : 'No' },
  { label: 'Status',     key: 'status',   width: 10, format: v => v.charAt(0).toUpperCase() + v.slice(1) },
];

// ─── Category color map ───────────────────────────────────────────────────────
const CAT_COLORS = {
  Fuel:          { dot: "#EF9F27", bg: "#FAEEDA", color: "#633806" },
  Tools:         { dot: "#378ADD", bg: "#E6F1FB", color: "#042C53" },
  Training:      { dot: "#7F77DD", bg: "#EEEDFE", color: "#26215C" },
  Office:        { dot: "#1D9E75", bg: "#E1F5EE", color: "#04342C" },
  Miscellaneous: { dot: "#888780", bg: "#F1EFE8", color: "#2C2C2A" },
  Parts:         { dot: "#D85A30", bg: "#FAECE7", color: "#4A1B0C" },
};

// ─── FIX: normalize a raw API expense row into the shape the UI expects ───────
const normalizeExpense = (e, idx) => ({
  ...e,
  // Guarantee a unique id regardless of backend field name
  id: e.id ?? e._id ?? e.expenseId ?? `exp-${idx}`,
  // Resolve tech name from object or any common field name
  tech: typeof e.technician === 'object'
    ? (e.technician?.name ?? 'Unknown')
    : (e.tech || e.techName || e.technicianName || 'Unknown'),
  // Normalize amount to a number (API sometimes returns string)
  amount: Number(e.amount) || 0,
  // Normalize status to lowercase
  status: (e.status ?? 'pending').toLowerCase(),
});

// ─── StatusChip — clickable pill → mini dropdown ──────────────────────────────
const StatusChip = ({ status, onChangeStatus }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const STATUS_MAP = {
    approved: { dot: "#639922", bg: "#EAF3DE", color: "#3B6D11", label: "Approved", icon: "✓" },
    pending:  { dot: "#EF9F27", bg: "#FAEEDA", color: "#633806", label: "Pending",  icon: "⏳" },
    rejected: { dot: "#E24B4A", bg: "#FCEBEB", color: "#A32D2D", label: "Rejected", icon: "✕" },
  };

  const current = STATUS_MAP[status] || STATUS_MAP.pending;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 9px", borderRadius: 99, border: "none", cursor: "pointer",
          background: current.bg, color: current.color,
          fontSize: 11, fontWeight: 600, fontFamily: FONTS.sans,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: current.dot, flexShrink: 0, display: "inline-block" }} />
        {current.label}
        <span style={{ fontSize: 8, opacity: 0.55, marginLeft: 1 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200,
          background: COLORS.white, border: `1px solid ${COLORS.border}`,
          borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,.10)",
          minWidth: 130, overflow: "hidden",
        }}>
          {Object.entries(STATUS_MAP).map(([key, s]) => (
            <button
              key={key}
              onClick={(e) => { e.stopPropagation(); onChangeStatus(key); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "9px 13px", border: "none",
                background: key === status ? s.bg : "transparent",
                cursor: "pointer", fontSize: 12, fontWeight: key === status ? 700 : 500,
                color: key === status ? s.color : COLORS.body,
                fontFamily: FONTS.sans, textAlign: "left",
                borderBottom: key !== "rejected" ? `1px solid ${COLORS.border}22` : "none",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0, display: "inline-block" }} />
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── CatTag (inline table cell) ───────────────────────────────────────────────
const CatTag = ({ cat }) => {
  const c = CAT_COLORS[cat] || { dot: COLORS.muted };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, flexShrink: 0, display: "inline-block" }} />
      <span style={{ fontSize: 12, color: COLORS.body, fontWeight: 500 }}>{cat}</span>
    </div>
  );
};

// ─── Safe avatar name: handles undefined / single-word names ─────────────────
// FIX: the crash was here — e.tech was undefined so .split() threw
const avatarName = (techName) => {
  if (!techName || typeof techName !== 'string') return '?';
  const parts = techName.trim().split(' ');
  const first = parts[0] ?? '';
  const second = parts[1] ? parts[1][0] : '.';
  return `${first} ${second}`;
};

// ─── ExpensesPage ─────────────────────────────────────────────────────────────
const ExpensesPage = ({ openModal }) => {
  const [catFilter, setCatFilter] = useState(null);
  const [expenses, setExpenses]   = useState([]);

  useEffect(() => {
    expensesApi.list({ limit: 200 }).then(r => {
      // FIX: normalize every row so tech, id, amount, status are always defined
      const data = (r.data ?? []).map(normalizeExpense);
      setExpenses(data);
    }).catch(() => {});
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setExpenses(prev => prev.map(e => (e._id ?? e.id) === id ? { ...e, status: newStatus } : e));
    if (newStatus === 'approved') expensesApi.approve(id).catch(() => {});
    else if (newStatus === 'rejected') expensesApi.reject(id).catch(() => {});
  };

  const totalApproved = expenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0);
  const totalPending  = expenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const totalAll      = expenses.reduce((s, e) => s + e.amount, 0);

  const byCat = Object.keys(CAT_COLORS).map(c => ({
    cat:   c,
    total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter(e => e.category === c).length,
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);

  const maxCatTotal = Math.max(...byCat.map(c => c.total), 1);

  // ── Search + filters ──────────────────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: searchFiltered,
  } = useTableSearch(expenses, ['tech', 'desc', 'category', 'id'], { status: '', category: '' });

  const filtered = searchFiltered
    .filter(r => !activeFilters.status   || r.status   === activeFilters.status)
    .filter(r => !activeFilters.category || r.category === activeFilters.category)
    .filter(r => !catFilter              || r.category === catFilter);

  // ── Pagination ────────────────────────────────────────────────────────────
  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filtered, 10);

  // ── Export ────────────────────────────────────────────────────────────────
  const { exportProps } = useExport({
    title:    "Expenses",
    filename: "cooltech-expenses",
    template: "generic_list",
    subtitle: "AC Services Platform · Field & Office Expenses",
    docId:    "expenses-EXPORT",
    columns:  EXPENSE_COLUMNS,
    rows:     filtered,
  });

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHdr
        title="Expenses"
        sub="Track field and office expenses"
        action="+ Add Expense"
        onAction={() => openModal("new_expense")}
      />

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KCard label="Total This Month" value={`₹${(totalAll / 1000).toFixed(1)}K`}      sub="all expenses"    icon="💸" iconBg="#FFF7ED" color={COLORS.brand} delay=""  />
        <KCard label="Approved"         value={`₹${(totalApproved / 1000).toFixed(1)}K`} sub="cleared"         icon="✅" iconBg="#F0FDF4" color="#16A34A"       delay="1" />
        <KCard label="Pending Approval" value={`₹${(totalPending / 1000).toFixed(1)}K`}  sub="awaiting review" icon="⏳" iconBg="#FFFBEB" color="#B45309"       delay="2" />
        <KCard label="Expense Claims"   value={expenses.length}                           sub="this month"      icon="📋" iconBg="#EFF6FF" color="#0369A1"       delay="3" />
      </div>

      {/* ── Single card: category summary + table ── */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "clip" }}>

        {/* ── Toolbar ── */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by technician, description…" />

          <FilterSelect
            value={activeFilters.status}
            onChange={val => setFilter("status", val)}
            options={["approved", "pending", "rejected"]}
            allLabel="All Statuses"
          />

          <FilterSelect
            value={activeFilters.category}
            onChange={val => setFilter("category", val)}
            options={Object.keys(CAT_COLORS)}
            allLabel="All Categories"
          />

          <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        {/* ── By Category summary row ── */}
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, background: "#FAFAFA" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1 }}>By Category</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {catFilter && (
                <button onClick={() => setCatFilter(null)} style={{
                  padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: "#FEF2F2", color: "#A32D2D", border: "1px solid #FECACA", fontFamily: FONTS.sans,
                }}>✕ Clear filter</button>
              )}
              <span style={{ fontSize: 11, color: COLORS.muted }}>
                Total approved:&nbsp;
                <strong style={{ color: COLORS.brand, fontFamily: FONTS.mono }}>₹{totalApproved.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Category cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {byCat.map(({ cat, total, count }) => {
              const c = CAT_COLORS[cat] || { dot: COLORS.muted, bg: COLORS.bg, color: COLORS.muted };
              const isActive = catFilter === cat;
              return (
                <div
                  key={cat}
                  onClick={() => setCatFilter(isActive ? null : cat)}
                  style={{
                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    background: isActive ? c.bg : COLORS.white,
                    border: `1px solid ${isActive ? c.dot + "55" : COLORS.border}`,
                    transition: "all .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? c.color : COLORS.body }}>{cat}</span>
                  </div>
                  <div style={{ height: 3, background: "#F1F5F9", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ width: `${(total / maxCatTotal) * 100}%`, height: "100%", background: c.dot, borderRadius: 99 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: COLORS.faint }}>{count} claim{count > 1 ? "s" : ""}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? c.color : COLORS.h2, fontFamily: FONTS.mono }}>₹{total.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <Thead cols={["#", "Category", "Technician", "Description", "Date", "Amount", "Receipt", "Status"]} />
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 14px", textAlign: "center", fontSize: 13, color: COLORS.faint }}>
                    No expenses match your filters.
                  </td>
                </tr>
              )}
              {paginated.map((e, i) => (
                // FIX: key uses normalized e.id which is always a defined unique string
                <tr key={e.id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>

                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, color: COLORS.brand }}>{e.id}</span>
                  </td>

                  <td style={{ padding: "12px 14px" }}>
                    <CatTag cat={e.category} />
                  </td>

                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {/* FIX: avatarName() safely handles undefined/single-word tech names */}
                      <Avatar name={avatarName(e.tech)} size={24} />
                      <span style={{ fontSize: 12, color: COLORS.body }}>{e.tech}</span>
                    </div>
                  </td>

                  <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.body, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.desc}
                  </td>

                  <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted, whiteSpace: "nowrap" }}>
                    {e.date}
                  </td>

                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>₹{e.amount.toLocaleString()}</span>
                  </td>

                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    {e.receipt
                      ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 4, background: "#EAF3DE" }}>
                          <span style={{ fontSize: 11, color: "#3B6D11", fontWeight: 700 }}>✓</span>
                        </span>
                      : <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 4, background: "#FCEBEB" }}>
                          <span style={{ fontSize: 11, color: "#A32D2D", fontWeight: 700 }}>✕</span>
                        </span>
                    }
                  </td>

                  <td style={{ padding: "12px 14px" }}>
                    <StatusChip
                      status={e.status}
                      onChangeStatus={(newStatus) => handleStatusChange(e.id, newStatus)}
                    />
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

export default ExpensesPage;