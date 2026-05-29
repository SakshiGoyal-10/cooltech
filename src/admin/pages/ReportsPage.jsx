import { useState, useEffect } from 'react';
import { customersApi, techsApi } from '../services/api';
import { COLORS, FONTS } from '../constants/tokens';
import { KCard } from '../components/ui/Cards';
import { CustomReportModal } from '../components/modals/Modals';

// ─── RevenueChart ─────────────────────────────────────────────────────────────

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.revenue ?? d.value ?? 0));
  const chartH = 80;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: chartH }}>
      {data.map((d, i) => {
        const val = d.revenue ?? d.value ?? 0;
        const barH = max > 0 ? (val / max) * chartH : 0;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
            <div
              title={`₹${val.toLocaleString()}`}
              style={{
                width: "100%",
                height: barH,
                borderRadius: "4px 4px 0 0",
                background: `linear-gradient(180deg,${COLORS.brand},${COLORS.brandD})`,
                opacity: 0.85,
                transition: "height .3s",
                cursor: "pointer",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─── LiveBar ──────────────────────────────────────────────────────────────────

const LiveBar = ({ label, value, max, color, prefix = "" }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: COLORS.h2 }}>{prefix}{value?.toLocaleString()}</span>
      </div>
      <div style={{ height: 7, borderRadius: 99, background: "#E2E8F0", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: color }} />
      </div>
    </div>
  );
};

// ─── Download Helpers ──────────────────────────────────────────────────────────

const downloadBlob = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const toCSV = (headers, rows) => {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
};

const printAsPDF = (title, htmlBody) => {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: sans-serif; padding: 32px; color: #111; }
      h1   { font-size: 20px; margin-bottom: 16px; }
      table{ border-collapse: collapse; width: 100%; font-size: 13px; }
      th,td{ border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
      th   { background: #f4f4f4; font-weight: 700; }
    </style></head>
    <body><h1>${title}</h1>${htmlBody}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
};

// ─── ReportsPage ──────────────────────────────────────────────────────────────

const ReportsPage = ({ openModal }) => {
 const [activeChart, setActiveChart] = useState("revenue");
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [showCustomReport, setShowCustomReport] = useState(false);

   useEffect(() => {
    customersApi.list().then(res => setCustomers(res?.data || res || [])).catch(() => {});
techsApi.list().then(res => setTechnicians(res?.data || res || [])).catch(() => {});
    // If revenueData comes from an API, fetch it similarly.
    // Otherwise set static fallback data:
    setRevenueData([
      { m: "Jul", revenue: 120000 },
      { m: "Aug", revenue: 95000 },
      { m: "Sep", revenue: 140000 },
      { m: "Oct", revenue: 160000 },
      { m: "Nov", revenue: 175000 },
      { m: "Dec", revenue: 195000 },
    ]);
  }, []);

  const topCustomers = customers.slice().sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const techPerf = technicians.map(t => ({ name: t.name.split(" ")[0], jobs: t.completed, rating: t.rating })).sort((a, b) => b.jobs - a.jobs);

  const handleDownload = (title, format) => {
  const ts   = new Date().toISOString().slice(0, 10);
  const slug = title.replace(/\s+/g, '_');

  // ── build data per report ──────────────────────────────────────────────────
  let headers = [], rows = [], tableHTML = '';

  if (title === 'Revenue Report') {
    headers = ['Month', 'Revenue (₹)'];
    rows    = revenueData.map(d => [d.m, d.revenue ?? d.value ?? 0]);
  } else if (title === 'Top Customers by Revenue' || title === 'Customer Report') {
    headers = ['Name', 'Phone', 'Total Spent (₹)'];
    rows    = [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map(c => [c.name, c.phone ?? '-', c.totalSpent ?? 0]);
  } else if (title === 'Technician Performance') {
    headers = ['Name', 'Jobs Completed', 'Rating'];
    rows    = technicians.map(t => [t.name, t.completed ?? 0, t.rating ?? '-']);
  } else if (title === 'Job Summary Report') {
    headers = ['Technician', 'Jobs', 'Rating'];
    rows    = technicians.map(t => [t.name, t.completed ?? 0, t.rating ?? '-']);
  } else {
    // Generic fallback
    headers = ['Report', 'Generated'];
    rows    = [[title, ts]];
  }

  // ── build HTML table for PDF ───────────────────────────────────────────────
  tableHTML = `<table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;

  // ── dispatch by format ─────────────────────────────────────────────────────
  if (format === 'CSV') {
    downloadBlob(toCSV(headers, rows), `${slug}_${ts}.csv`, 'text/csv');
  } else if (format === 'XLSX') {
    // Simple TSV works in Excel without SheetJS dependency
    const tsv = [headers, ...rows].map(r => r.join('\t')).join('\n');
    downloadBlob(tsv, `${slug}_${ts}.xls`, 'application/vnd.ms-excel');
  } else if (format === 'PDF') {
    printAsPDF(title, tableHTML);
  }
};

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Reports & Analytics</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Live business intelligence dashboard</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* <button className="btn" onClick={() => openModal("set_reminder")} style={{ padding: "9px 18px", borderRadius: 9, background: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 13, fontWeight: 600 }}>📅 Schedule Report</button> */}
          <button className="btn" onClick={() => setShowCustomReport(true)} style={{ padding: "9px 22px", borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}>+ Custom Report</button>
        </div>
      </div>
      {/* Live Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {/* Revenue chart */}
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Revenue Trend (6 months)</div>
          <RevenueChart data={revenueData} />
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.faint }}>
            {revenueData.map(d => <span key={d.m}>{d.m}</span>)}
          </div>
          <div style={{ marginTop: 10, padding: "8px 10px", background: COLORS.brandL, borderRadius: 7, border: `1px solid ${COLORS.brand}20`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: COLORS.muted }}>Peak Month</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.brand }}>Dec – ₹1.95L</span>
          </div>
        </div>

        {/* Top customers */}
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Top Customers by Revenue</div>
          {topCustomers.map(c => <LiveBar key={c._id || c.id} label={c.name} value={c.totalSpent} max={topCustomers[0].totalSpent} color={COLORS.brand} prefix="₹" />)}
        </div>

        {/* Technician jobs */}
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Technician Performance</div>
          {techPerf.map(t => (
            <div key={t.name} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
                <span>{t.name}</span>
                <span style={{ fontWeight: 700, color: COLORS.h2 }}>{t.jobs} jobs · ⭐{t.rating}</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "#E2E8F0", overflow: "hidden" }}>
                <div style={{ width: `${(t.jobs / techPerf[0].jobs) * 100}%`, height: "100%", background: "#3B82F6", borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Revenue (6mo)", value: "₹9.77L", change: "+14%", up: true },
          { label: "Jobs Completed", value: "110", change: "+8%", up: true },
          { label: "Invoice Collection", value: "78%", change: "-2%", up: false },
          { label: "Customer Satisfaction", value: "4.6★", change: "+0.2", up: true },
        ].map(s => (
          <div key={s.label} style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.h1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.up ? "#16A34A" : "#EF4444" }}>{s.up ? "↑" : "↓"} {s.change} vs last period</div>
          </div>
        ))}
      </div>

      {/* Downloadable reports grid */}
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.h1, marginTop: 4 }}>Downloadable Reports</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { title: "Revenue Report",          desc: "Monthly/yearly revenue, payment status, top customers",           icon: "💰", color: "#F59E0B" },
          { title: "Job Summary Report",       desc: "Jobs by type, status, technician performance, completion rate",   icon: "📋", color: "#3B82F6" },
          { title: "Technician Performance",   desc: "Jobs per tech, ratings, avg resolution time, efficiency",         icon: "👷", color: "#10B981" },
          { title: "AMC Analytics",            desc: "Contract renewal rate, visit completion, AMC revenue",            icon: "📄", color: "#8B5CF6" },
          { title: "Customer Report",          desc: "Customer growth, repeat jobs, LTV, churn analysis",              icon: "👥", color: "#EC4899" },
          { title: "Inventory Usage",          desc: "Parts consumed, reorder frequency, cost per job, wastage",       icon: "📦", color: "#06B6D4" },
          { title: "Invoice Aging Report",     desc: "Outstanding invoices, overdue analysis, collection efficiency",   icon: "📊", color: "#EF4444" },
          { title: "Salary & Payroll Report",  desc: "Monthly salary disbursement, incentives, advances",              icon: "💵", color: "#16A34A" },
          { title: "Attendance Report",        desc: "Monthly attendance summary, leaves, absenteeism trends",         icon: "📅", color: "#7C3AED" },
          { title: "Expense Report",           desc: "Field expenses by category, tech, approval status",              icon: "🧾", color: "#0369A1" },
          { title: "Complaint Analysis",       desc: "Complaint categories, resolution time, tech performance",        icon: "💬", color: "#DC2626" },
          { title: "Quotation Conversion",     desc: "Quote approval rate, value converted, pending follow-ups",       icon: "📝", color: "#F97316" },
        ].map(r => (
          <div key={r.title} className="card" style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,.05)", padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${r.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 3 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5, marginBottom: 10 }}>{r.desc}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => handleDownload(r.title, 'CSV')} style={{ padding: "5px 12px", borderRadius: 7, background: "#F9FAFB", border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 11 }}>CSV</button>
                <button className="btn" onClick={() => handleDownload(r.title, 'XLSX')} style={{ padding: "5px 12px", borderRadius: 7, background: "#F9FAFB", border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 11 }}>XLSX</button>
                <button className="btn" onClick={() => handleDownload(r.title, 'PDF')} style={{ padding: "5px 12px", borderRadius: 7, background: `${r.color}15`, border: `1px solid ${r.color}30`, color: r.color, fontSize: 11, fontWeight: 700 }}>⬇ PDF</button>
              </div>
            </div>
          </div>
        ))}
      </div>
       {/* Custom Report Modal */}
  {showCustomReport && (
    <CustomReportModal
      open={showCustomReport}
      onClose={() => setShowCustomReport(false)}
      onSave={() => setShowCustomReport(false)}
    />
  )}
    </div>
  );
};

export default ReportsPage;