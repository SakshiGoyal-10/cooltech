import { useState, useEffect } from 'react';
import { techsApi, timelogsApi } from '../../services/api';
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
const TIMELOG_COLUMNS = [
  { label: 'ID',           key: 'id',       width: 12, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: '#F97316', fontSize: 11 } },
  { label: 'Technician',   key: 'tech',     width: 18, tdStyle: { fontWeight: 600 } },
  { label: 'Job',          key: 'job',      width: 14, tdStyle: { fontFamily: 'monospace', fontSize: 12 } },
  { label: 'Type',         key: 'type',     width: 14, tdStyle: { fontSize: 12 } },
  { label: 'Customer',     key: 'customer', width: 18, tdStyle: { fontSize: 12 } },
  { label: 'Date',         key: 'date',     width: 14, tdStyle: { fontFamily: 'monospace', fontSize: 12 } },
  { label: 'Start',        key: 'start',    width: 10, tdStyle: { fontFamily: 'monospace' } },
  { label: 'End',          key: 'end',      width: 10, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Hours',        key: 'hrs',      width: 8,  format: v => `${Number(v).toFixed(1)}h`, tdStyle: { fontFamily: 'monospace', fontWeight: 800 } },
  { label: 'Billable',     key: 'billable', width: 10, format: v => v ? 'Yes' : 'No' },
  { label: 'Notes',        key: 'notes',    width: 28, tdStyle: { fontSize: 11 } },
];

// ─── TimeLogPage ──────────────────────────────────────────────────────────────
const TimeLogPage = ({ openModal }) => {

  const [timeLogs, setTimeLogs] = useState([]);
  const [technicians, setTechnicians] = useState([]);

 useEffect(() => {
  timelogsApi.list()
    .then(res => setTimeLogs(Array.isArray(res) ? res : res?.data || []))
    .catch(() => setTimeLogs([]));

  techsApi.list()
    .then(res => setTechnicians(res?.data || []))  // ← always use res.data
    .catch(() => setTechnicians([]));
}, []);

  // ── Search + filters ──────────────────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: searchFiltered,
  } = useTableSearch(
    timeLogs,
    ['id', 'tech', 'job', 'type', 'customer', 'notes'],
    { tech: '' }
  );

  const [billableFilter, setBillableFilter] = useState("");

  const filtered = searchFiltered
    .filter(t => !activeFilters.tech || t.tech === activeFilters.tech)
    .filter(t => !billableFilter || (billableFilter === "Billable" ? t.billable : !t.billable));

  // ── Pagination ────────────────────────────────────────────────────────────
  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filtered, 10);

  // ── Export ────────────────────────────────────────────────────────────────
  const { exportProps } = useExport({
    title:        "Time Log",
    filename:     "cooltech-timelog",
    template:     "generic_list",
    subtitle:     `AC Services Platform · Time Tracker · ${filtered.length} entries`,
    docId:        "TIMELOG-EXPORT",
    columns:      TIMELOG_COLUMNS,
    rows:         filtered,
    showTotals:   true,
    totalColumns: ['hrs'],
  });

  // ── KPI (from filtered) ───────────────────────────────────────────────────
  const totalHrs = filtered.reduce((a, t) => a + t.hrs, 0);
  const billHrs  = filtered.filter(t => t.billable).reduce((a, t) => a + t.hrs, 0);
  const avgHrs   = filtered.length ? totalHrs / filtered.length : 0;

  const techNames = (technicians || []).map(t => t.name);

  return (
    <div className="fu" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Time Tracker</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Log & track time spent on each job</div>
        </div>
        <button className="btn" onClick={() => openModal("new_timelog")}
          style={{ padding: "9px 20px", borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40`, border: "none", cursor: "pointer" }}>
          + Log Time
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KCard label="Total Hours"   value={`${totalHrs.toFixed(1)}h`}          icon="⏱" color="#3B82F6"    iconBg="#EFF6FF" delay=""  />
        <KCard label="Billable Hours" value={`${billHrs.toFixed(1)}h`}           icon="💰" color={COLORS.brand} iconBg={COLORS.brandL} delay="1" />
        <KCard label="Non-Billable"  value={`${(totalHrs - billHrs).toFixed(1)}h`} icon="📋" color="#64748B"    iconBg="#F1F5F9" delay="2" />
        <KCard label="Avg per Entry" value={`${avgHrs.toFixed(1)}h`}             icon="📈" color="#8B5CF6"    iconBg="#F5F3FF" delay="3" />
      </div>

      {/* Table card */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "clip", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>

        {/* Toolbar */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <TableSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search by technician, job, customer…"
          />

          <FilterSelect
            value={activeFilters.tech}
            onChange={val => setFilter("tech", val)}
            options={techNames}
            allLabel="All Technicians"
          />

          <FilterSelect
            value={billableFilter}
            onChange={setBillableFilter}
            options={["Billable", "Non-Billable"]}
            allLabel="All Entries"
          />

          <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <Thead cols={["ID", "Technician", "Job / Activity", "Customer", "Date", "Start", "End", "Hours", "Billable", "Notes"]} />
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: 36, color: COLORS.faint, fontSize: 13 }}>No time logs found.</td></tr>
              )}
              {paginated.map((t, i) => (
                <tr key={t.id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                  <td style={{ padding: "11px 14px", fontFamily: FONTS.mono, fontSize: 12, color: COLORS.brand, fontWeight: 700 }}>{t.id}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Avatar name={t.tech} size={26} color={COLORS.brand} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{t.tech.split(" ")[0]}</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{t.job === "—" ? t.type : t.job}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>{t.type}</div>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: COLORS.body }}>{t.customer}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: COLORS.muted }}>{t.date}</td>
                  <td style={{ padding: "11px 14px", fontFamily: FONTS.mono, fontSize: 12, color: COLORS.body }}>{t.start}</td>
                  <td style={{ padding: "11px 14px", fontFamily: FONTS.mono, fontSize: 12, color: COLORS.body }}>{t.end}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: "#1E293B" }}>{t.hrs.toFixed(1)}</span>
                    <span style={{ fontSize: 10, color: COLORS.faint, marginLeft: 2 }}>h</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: t.billable ? "#F0FDF4" : "#F8FAFC", color: t.billable ? "#166534" : "#64748B" }}>
                      {t.billable ? "✓ Billable" : "Non-Bill"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: COLORS.muted, maxWidth: 180 }}>{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        )}
      </div>

      {/* Summary by technician — unchanged */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Summary by Technician</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
          {technicians.map(tech => {
            const logs = timeLogs.filter(t => t.tech === tech.name);
            const hrs  = logs.reduce((a, t) => a + t.hrs, 0);
            const bill = logs.filter(t => t.billable).reduce((a, t) => a + t.hrs, 0);
            return (
              <div key={tech._id || tech.id || tech.name} style={{ background: COLORS.bg, borderRadius: 10, padding: "11px 13px", border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <Avatar name={tech.name} size={28} color={COLORS.brand} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>{tech.name.split(" ")[0]}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.h1 }}>
                  {hrs.toFixed(1)}<span style={{ fontSize: 11, color: COLORS.faint, fontWeight: 400 }}>h</span>
                </div>
                <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 2 }}>{bill.toFixed(1)}h billable · {logs.length} entries</div>
                <div style={{ marginTop: 7, height: 4, borderRadius: 99, background: "#E2E8F0", overflow: "hidden" }}>
                  <div style={{ width: `${hrs > 0 ? (bill / hrs) * 100 : 0}%`, height: "100%", borderRadius: 99, background: COLORS.brand }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeLogPage;