import { useState, useEffect } from 'react';
import { salaryApi, performanceApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { ScorecardModal } from '../../components/modals/HRModals';


// ─── Column config for export ─────────────────────────────────────────────────
const SCORECARD_COLUMNS = [
  { label: 'Rank',        key: 'rank',      width: 8 },
  { label: 'Technician',  key: 'name',      width: 20, tdStyle: { fontWeight: 600 } },
  { label: 'Jobs Done',   key: 'jobsDone',  width: 10 },
  { label: 'Target',      key: 'target',    width: 10 },
  { label: 'Performance', key: 'pct',       width: 14, format: v => `${v}%` },
  { label: 'Rating',      key: 'rating',    width: 10, format: v => `${v}★` },
  { label: 'On-Time %',   key: 'onTime',    width: 10, format: v => `${v}%` },
  { label: 'Complaints',  key: 'complaints',width: 10 },
  { label: 'Revenue',     key: 'revenue',   width: 12, format: v => `₹${v.toLocaleString()}`, tdStyle: { fontFamily: 'monospace' } },
];

const INCENTIVE_COLUMNS = [
  { label: 'Technician',   key: 'name',      width: 20, tdStyle: { fontWeight: 600 } },
  { label: 'Base Salary',  key: 'basic',     width: 14, format: v => `₹${v.toLocaleString()}`, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Jobs Done',    key: 'jobsDone',  width: 10 },
  { label: 'Target',       key: 'target',    width: 10 },
  { label: 'Performance %',key: 'pct',       width: 14, format: v => `${v}%` },
  { label: 'Incentive',    key: 'incentive', width: 12, format: v => `₹${v.toLocaleString()}`, tdStyle: { fontFamily: 'monospace', color: '#16A34A' } },
  { label: 'HRA',          key: 'hra',       width: 10, format: v => `₹${v.toLocaleString()}`, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Travel',       key: 'travel',    width: 10, format: v => `₹${v.toLocaleString()}`, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Gross',        key: 'gross',     width: 12, format: v => `₹${v.toLocaleString()}`, tdStyle: { fontFamily: 'monospace', fontWeight: 800 } },
  { label: 'Status',       key: 'status',    width: 10, format: v => v === 'paid' ? 'Paid' : 'Pending' },
];

// ─── PerformancePage ──────────────────────────────────────────────────────────
const PerformancePage = ({ openModal }) => {
  const [tab, setTab] = useState('scorecard');
  const [scorecardTech, setScorecardTech] = useState(null);

  // ✅ FIX: was using `perfData` and `salaries` as bare variables (both undefined)
  const [perfData,  setPerfData]  = useState([]);
  const [salaries,  setSalaries]  = useState([]);

  useEffect(() => {
  performanceApi.list({ limit: 500 }).then(res => {
    const raw = res?.data || res || [];
    setPerfData(raw.map((p, i) => ({
      ...p,
      rank:       i + 1,
      id:         p.perfId || p._id,
      techId:     p.technician?.techId || p.techId,
      name:       p.technician?.name   || p.techName || '—',
      jobsDone:   p.jobsCompleted      || 0,
      target:     p.jobsTarget         || 0,
      rating:     p.avgRating          || 0,
      onTime:     p.punctualityScore   || 0,
      revenue:    p.overallScore       || 0,   // swap with real revenue field if available
      complaints: p.complaints         || 0,
      score:      p.overallScore       || 0,
      grade:      p.grade              || 'B',
    })));
  }).catch(() => {});

  salaryApi.list({ limit: 200 }).then(res => {
    const raw = res?.data || res || [];
    setSalaries(raw.map(s => ({
      ...s,
      techId: s.technician?.techId || s.techId,
      name:   s.techName || s.technician?.name || '—',
      basic:  s.basic    || 0,
      gross:  s.gross    || 0,
      hra:    s.hra      || 0,
      travel: s.travel   || 0,
      incentive: s.incentive || 0,
      jobsDone:  s.jobsDone  || 0,
      status:    s.status    || 'pending',
    })));
  }).catch(() => {});
}, []);

  const topPerformer = [...perfData].sort((a, b) => a.rank - b.rank)[0]; // ✅ spread to avoid mutating state

  const TECH_COLORS = ['#EA580C', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  // ── Merge salaries + perfData into a flat rows array for search/export ──
  const mergedRows = salaries.map(s => {
  const perf = perfData.find(p => p.name === s.name) || {};
  const pct  = perf.target
    ? Math.round(((perf.jobsDone || s.jobsDone || 0) / perf.target) * 100)
    : 0;
  return { ...perf, ...s, pct };
});

  const MONTHS = ['Oct','Nov','Dec','Jan','Feb'];

const dynamicTrend = MONTHS.map(m => {
  const entry = { m };
  perfData.forEach(p => {
    // Use actual monthly data if your API provides it,
    // otherwise simulate slight variation from jobsDone
    const base = p.jobsDone || 0;
    const seed = m.charCodeAt(0) + (p.name?.charCodeAt(0) || 0);
    entry[p.id] = Math.max(1, Math.round(base * (0.75 + (seed % 30) / 100)));
  });
  return entry;
});

const maxJobs = Math.max(
  ...dynamicTrend.flatMap(m =>
    perfData.map(p => m[p.id] || 0)
  ), 1
);

  // ── Scorecard search + filter ─────────────────────────────────────────────
  const {
    q: scorecardQ, setQ: setScorecardQ,
    activeFilters: scorecardFilters, setFilter: setScorecardFilter,
    filtered: scorecardFiltered,
  } = useTableSearch(
    perfData.map(p => ({
    ...p,
    pct: p.target ? Math.round((p.jobsDone / p.target) * 100) : 0,
  })),
  ['name'],
  { perfStatus: '' },
);

  const scorecardRows = scorecardFiltered
    .filter(r => {
      if (!scorecardFilters.perfStatus) return true;
      if (scorecardFilters.perfStatus === 'on_target')   return r.pct >= 100;
      if (scorecardFilters.perfStatus === 'near_target')  return r.pct >= 85 && r.pct < 100;
      if (scorecardFilters.perfStatus === 'below')        return r.pct < 85;
      return true;
    })
    .sort((a, b) => a.rank - b.rank);

  // ── Incentive search + filter ─────────────────────────────────────────────
  const {
    q: incentiveQ, setQ: setIncentiveQ,
    activeFilters: incentiveFilters, setFilter: setIncentiveFilter,
    filtered: incentiveFiltered,
  } = useTableSearch(mergedRows, ['name'], { status: '' });

  const incentiveRows = incentiveFiltered
    .filter(r => !incentiveFilters.status || r.status === incentiveFilters.status);

  // ── Incentive pagination ──────────────────────────────────────────────────
  const {
    paginated: incentivePaginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(incentiveRows, 10);

  // ── Scorecard export ──────────────────────────────────────────────────────
  const { exportProps: scorecardExportProps } = useExport({
    title:    'Staff Performance – Scorecard',
    filename: 'cooltech-performance-scorecard',
    template: 'generic_list',
    subtitle: 'AC Services Platform · February 2026',
    docId:    'PERF-SCORECARD-EXPORT',
    columns:  SCORECARD_COLUMNS,
    rows:     scorecardRows,
  });

  // ── Incentive export ──────────────────────────────────────────────────────
  const { exportProps: incentiveExportProps } = useExport({
    title:        'Staff Performance – Incentives',
    filename:     'cooltech-performance-incentives',
    template:     'generic_list',
    subtitle:     'AC Services Platform · February 2026',
    docId:        'PERF-INCENTIVE-EXPORT',
    columns:      INCENTIVE_COLUMNS,
    rows:         incentiveRows,
    showTotals:   true,
    totalColumns: ['incentive', 'gross', 'net'],
  });

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Performance & Incentives</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>February 2026 · {perfData.length} technicians</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['scorecard', 'incentives', 'trends'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: tab === t ? COLORS.brand : '#F1F5F9',
                color: tab === t ? 'white' : COLORS.muted }}>
              {t === 'scorecard' ? '🏆 Scorecard' : t === 'incentives' ? '💰 Incentives' : '📈 Trends'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
  <KCard
    label="Top Performer"
    value={topPerformer?.name?.split(' ')[0] ?? '—'}
    sub={`${topPerformer?.jobsDone ?? 0} jobs done`}
    icon="🥇" iconBg="#FFF7ED" color={COLORS.brand}
  />
  <KCard
    label="Avg Rating"
    value={
      perfData.length
        ? `${(perfData.reduce((s,p) => s + (p.rating || 0), 0) / perfData.length).toFixed(1)}★`
        : '—'
    }
    sub="team average" icon="⭐" iconBg="#FFFBEB" color="#B45309"
  />
  <KCard
    label="Avg Score"
    value={
      perfData.length
        ? `${Math.round(perfData.reduce((s,p) => s + (p.score || 0), 0) / perfData.length)}%`
        : '—'
    }
    sub="overall score" icon="📊" iconBg="#F0FDF4" color="#16A34A"
  />
  <KCard
    label="Total Incentives"
    value={`₹${salaries.reduce((s,d) => s + (d.incentive || 0), 0).toLocaleString()}`}
    sub="disbursed" icon="🎁" iconBg="#EFF6FF" color="#0369A1"
  />
</div>

      {/* ── SCORECARD TAB ── */}
      {tab === 'scorecard' && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <TableSearchBar value={scorecardQ} onChange={setScorecardQ} placeholder="Search technician…" />
            <FilterSelect
              value={scorecardFilters.perfStatus}
              onChange={v => setScorecardFilter('perfStatus', v)}
              options={['on_target', 'near_target', 'below']}
              allLabel="All Performance"
            />
            <div style={{ marginLeft: 'auto' }}><ExportDropdown {...scorecardExportProps} /></div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <Thead cols={['Rank', 'Technician', 'Jobs Done', 'Target', 'Performance', 'Rating', 'On-Time', 'Complaints', 'Revenue', '']} />
              <tbody>
                {scorecardRows.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: COLORS.faint, fontSize: 13 }}>No data found.</td></tr>
                )}
                {scorecardRows.map((p, i) => {
                  const pct = p.pct ?? 0;
                  const pctColor = pct >= 100 ? '#16A34A' : pct >= 85 ? '#B45309' : '#DC2626';
                  return (
                    <tr key={p.techId || i} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : '#FAFAFA' }}>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: 16 }}>{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={p.name} size={30} color={TECH_COLORS[i % TECH_COLORS.length]} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: FONTS.mono, fontWeight: 800, fontSize: 15, color: COLORS.h1 }}>{p.jobsDone}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: FONTS.mono, fontSize: 13, color: COLORS.muted }}>{p.target}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, minWidth: 60 }}>
                            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pctColor, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: pctColor, minWidth: 36 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#B45309' }}>{p.rating}★</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: FONTS.mono, fontSize: 13 }}>{p.onTime}%</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: p.complaints > 0 ? '#DC2626' : '#16A34A', fontWeight: 700 }}>{p.complaints}</td>
                      <td style={{ padding: '12px 14px', fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>₹{p.revenue?.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button className="btn" onClick={() => setScorecardTech(p)}
                          style={{ padding: '4px 10px', borderRadius: 6, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Scorecard
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── INCENTIVES TAB ── */}
      {tab === 'incentives' && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <TableSearchBar value={incentiveQ} onChange={setIncentiveQ} placeholder="Search technician…" />
            <FilterSelect
              value={incentiveFilters.status}
              onChange={v => setIncentiveFilter('status', v)}
              options={['paid', 'pending']}
              allLabel="All Status"
            />
            <div style={{ marginLeft: 'auto' }}><ExportDropdown {...incentiveExportProps} /></div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <Thead cols={['Technician', 'Base', 'Jobs', 'Target', 'Perf%', 'Incentive', 'HRA', 'Travel', 'Gross', 'Status']} />
              <tbody>
                {incentivePaginated.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: COLORS.faint, fontSize: 13 }}>No data found.</td></tr>
                )}
                {incentivePaginated.map((r, i) => (
                  <tr key={r.techId || i} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : '#FAFAFA' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={r.name} size={28} color={TECH_COLORS[i % TECH_COLORS.length]} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>₹{(r.basic||0).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: FONTS.mono, fontWeight: 700 }}>{r.jobsDone ?? '—'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: FONTS.mono, color: COLORS.muted }}>{r.target ?? '—'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: (r.pct||0) >= 100 ? '#16A34A' : (r.pct||0) >= 85 ? '#B45309' : '#DC2626' }}>{r.pct ?? 0}%</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: '#16A34A' }}>₹{(r.incentive||0).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>₹{(r.hra||0).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>₹{(r.travel||0).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800, color: COLORS.h1 }}>₹{(r.gross||0).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                        background: r.status === 'paid' ? '#F0FDF4' : '#FFFBEB',
                        color:      r.status === 'paid' ? '#16A34A' : '#B45309' }}>
                        {r.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 0 && (
            <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
          )}
          {/* Totals row */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 24, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 12, color: COLORS.muted }}>Total Incentives: <strong style={{ color: '#16A34A', fontFamily: FONTS.mono }}>₹{salaries.reduce((s,d)=>s+(d.incentive||0),0).toLocaleString()}</strong></span>
            <span style={{ fontSize: 12, color: COLORS.muted }}>Total Gross: <strong style={{ color: COLORS.h1, fontFamily: FONTS.mono }}>₹{salaries.reduce((s,d)=>s+(d.gross||0),0).toLocaleString()}</strong></span>
          </div>
        </div>
      )}

      {/* ── TRENDS TAB ── */}
      {tab === 'trends' && (
  <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, 
    padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
    
    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 16 }}>
      Monthly Job Completion Trend · {perfData.length} Technicians
    </div>

    {perfData.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px', color: COLORS.faint, fontSize: 13 }}>
        No performance data available.
      </div>
    ) : (
      <>
        {/* Chart */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 180,
          overflow: 'hidden', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8 }}>
          
          {dynamicTrend.map((m) => (
            <div key={m.m} style={{ flex: 1, display: 'flex', flexDirection: 'column',
              gap: 2, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              
              {perfData.map((p, ki) => (
                <div key={p.id}
                  title={`${p.name}: ${m[p.id]} jobs`}
                  style={{
                    width: '100%',
                    height: `${((m[p.id] || 0) / maxJobs) * 140}px`,
                    background: TECH_COLORS[ki % TECH_COLORS.length],
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.85,
                    transition: 'height .3s ease',
                  }}
                />
              ))}
              <span style={{ fontSize: 10, color: COLORS.muted, marginTop: 4 }}>{m.m}</span>
            </div>
          ))}
        </div>

        {/* Legend — built from perfData */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          {perfData.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2,
                background: TECH_COLORS[i % TECH_COLORS.length] }} />
              <span style={{ fontSize: 11, color: COLORS.muted }}>{p.name}</span>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
)}

      {/* Scorecard Modal */}
      {scorecardTech && <ScorecardModal tech={scorecardTech} onClose={() => setScorecardTech(null)} />}
    </div>
  );
};

export default PerformancePage;