import { useState, useEffect, useCallback, useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_EMPLOYEES = [
  { name: "Ramesh Kumar",  role: "Senior Technician",  basic: 32000, hra: 6400, travel: 2000, incentive: 4800, pf: 1920, advance: 0 },
  { name: "Vijay Singh",   role: "Senior Technician",  basic: 30000, hra: 6000, travel: 2000, incentive: 3600, pf: 1800, advance: 5000 },
  { name: "Arjun Das",     role: "Technician",         basic: 25000, hra: 5000, travel: 1500, incentive: 2000, pf: 1500, advance: 0 },
  { name: "Suresh Yadav",  role: "Junior Technician",  basic: 20000, hra: 4000, travel: 1500, incentive: 1200, pf: 1200, advance: 2000 },
  { name: "Kishore Naik",  role: "Technician",         basic: 26000, hra: 5200, travel: 2000, incentive: 3000, pf: 1560, advance: 0 },
].map((e) => ({
  ...e,
  gross: e.basic + e.hra + e.travel + e.incentive,
  net:   e.basic + e.hra + e.travel + e.incentive - e.pf - e.advance,
}));

const AV_COLORS = [
  { bg: "#faeeda", col: "#854f0b" },
  { bg: "#e6f1fb", col: "#185fa5" },
  { bg: "#eaf3de", col: "#3b6d11" },
  { bg: "#faece7", col: "#993c1d" },
  { bg: "#eeedfe", col: "#534ab7" },
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const ALL_CYCLES   = ["Monthly", "Weekly", "Bi-weekly", "Custom"];
const DEPARTMENTS  = ["All departments", "Senior Technician", "Technician", "Junior Technician"];
const PAYMENT_MODES = ["Bank Transfer", "Cash", "Cheque", "UPI"];

// ── Dynamically generate years: from 2024 up to current year + 1 ─────────────
function getYears() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = 2024; y <= current + 1; y++) years.push(String(y));
  return years;
}

// ── Generate all months for a given year (up to current month if current year) ─
function getMonthsForYear(year) {
  const now     = new Date();
  const curYear = now.getFullYear();
  const curMon  = now.getMonth(); // 0-indexed
  const months  = [];
  const maxMon  = Number(year) === curYear ? curMon : 11;
  for (let m = maxMon; m >= 0; m--) {
    months.push(`${MONTH_NAMES[m]} ${year}`);
  }
  return months;
}

// ── Generate week options for a year+month ────────────────────────────────────
function getWeeksForMonth(monthStr) {
  if (!monthStr) return [];
  const [mName, yr] = monthStr.split(" ");
  const mIdx = MONTH_NAMES.indexOf(mName);
  if (mIdx === -1 || !yr) return [];
  const year   = Number(yr);
  const weeks  = [];
  let weekNum  = 1;
  let date     = new Date(year, mIdx, 1);
  while (date.getMonth() === mIdx) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 6);
    if (end.getMonth() !== mIdx) end.setDate(new Date(year, mIdx + 1, 0).getDate());
    weeks.push({
      label: `Week ${weekNum} (${start.getDate()} – ${end.getDate()} ${mName})`,
      value: `W${weekNum}-${mName}-${yr}`,
    });
    date.setDate(date.getDate() + 7);
    weekNum++;
  }
  return weeks;
}

// ── Generate bi-weekly options for a year+month ───────────────────────────────
function getBiweeksForMonth(monthStr) {
  if (!monthStr) return [];
  const [mName, yr] = monthStr.split(" ");
  const mIdx = MONTH_NAMES.indexOf(mName);
  if (mIdx === -1 || !yr) return [];
  const year     = Number(yr);
  const lastDay  = new Date(year, mIdx + 1, 0).getDate();
  return [
    { label: `1st – 15th ${mName} ${yr}`,       value: `BW1-${mName}-${yr}` },
    { label: `16th – ${lastDay}th ${mName} ${yr}`, value: `BW2-${mName}-${yr}` },
  ];
}

// ── Quarter options ───────────────────────────────────────────────────────────
function getQuartersForYear(year) {
  return [
    { label: `Q1 (Jan – Mar ${year})`, value: `Q1-${year}` },
    { label: `Q2 (Apr – Jun ${year})`, value: `Q2-${year}` },
    { label: `Q3 (Jul – Sep ${year})`, value: `Q3-${year}` },
    { label: `Q4 (Oct – Dec ${year})`, value: `Q4-${year}` },
  ];
}

function inr(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}
function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function OptCard({ label, desc, checked, onChange }) {
  return (
    <label className={`gp-opt-card${checked ? " checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <div>
        <div className="gp-opt-label">{label}</div>
        <div className="gp-opt-desc">{desc}</div>
      </div>
    </label>
  );
}

function SummaryCard({ label, value, colorClass }) {
  return (
    <div className="gp-summary-card">
      <div className="gp-summary-label">{label}</div>
      <div className={`gp-summary-value${colorClass ? ` ${colorClass}` : ""}`}>{value}</div>
    </div>
  );
}

// ─── Period selector — changes based on active cycle ─────────────────────────
function PeriodSelector({ cycle, year, selMonth, setSelMonth, selWeek, setSelWeek, selBiweek, setSelBiweek, selQuarter, setSelQuarter, customFrom, setCustomFrom, customTo, setCustomTo }) {
  const months   = useMemo(() => getMonthsForYear(year), [year]);
  const weeks    = useMemo(() => getWeeksForMonth(selMonth), [selMonth]);
  const biweeks  = useMemo(() => getBiweeksForMonth(selMonth), [selMonth]);
  const quarters = useMemo(() => getQuartersForYear(year), [year]);

  if (cycle === "Monthly") {
    return (
      <div className="gp-period-field">
        <label className="gp-label">Select month</label>
        <select className="gp-select" value={selMonth} onChange={(e) => setSelMonth(e.target.value)}>
          {months.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
    );
  }

  if (cycle === "Weekly") {
    return (
      <div className="gp-period-fields">
        <div className="gp-period-field">
          <label className="gp-label">Select month</label>
          <select className="gp-select" value={selMonth} onChange={(e) => { setSelMonth(e.target.value); setSelWeek(""); }}>
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="gp-period-field">
          <label className="gp-label">Select week</label>
          <select className="gp-select" value={selWeek} onChange={(e) => setSelWeek(e.target.value)}>
            <option value="">All weeks</option>
            {weeks.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
      </div>
    );
  }

  if (cycle === "Bi-weekly") {
    return (
      <div className="gp-period-fields">
        <div className="gp-period-field">
          <label className="gp-label">Select month</label>
          <select className="gp-select" value={selMonth} onChange={(e) => { setSelMonth(e.target.value); setSelBiweek(""); }}>
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="gp-period-field">
          <label className="gp-label">Select period</label>
          <select className="gp-select" value={selBiweek} onChange={(e) => setSelBiweek(e.target.value)}>
            <option value="">Both periods</option>
            {biweeks.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
      </div>
    );
  }

  if (cycle === "Quarterly") {
    return (
      <div className="gp-period-field">
        <label className="gp-label">Select quarter</label>
        <select className="gp-select" value={selQuarter} onChange={(e) => setSelQuarter(e.target.value)}>
          {quarters.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
        </select>
      </div>
    );
  }

  if (cycle === "Custom") {
    return (
      <div className="gp-period-fields">
        <div className="gp-period-field">
          <label className="gp-label">From date</label>
          <input type="date" className="gp-input" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
        </div>
        <div className="gp-period-field">
          <label className="gp-label">To date</label>
          <input type="date" className="gp-input" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GeneratePayroll() {
  // ── Dynamic years — auto-includes next year when calendar rolls over ────────
  const YEARS = useMemo(() => getYears(), []);
  const currentYear = String(new Date().getFullYear());

  const [selectedYear,  setSelectedYear]  = useState(currentYear);
  const [selectedCycle, setSelectedCycle] = useState("Monthly");

  // Period selectors per cycle
  const initialMonths = useMemo(() => getMonthsForYear(currentYear), [currentYear]);
  const [selMonth,    setSelMonth]    = useState(initialMonths[0] || "");
  const [selWeek,     setSelWeek]     = useState("");
  const [selBiweek,   setSelBiweek]   = useState("");
  const [selQuarter,  setSelQuarter]  = useState(`Q1-${currentYear}`);
  const [customFrom,  setCustomFrom]  = useState("");
  const [customTo,    setCustomTo]    = useState("");

  // Other form state
  const [selDept,     setSelDept]     = useState("");
  const [selEmp,      setSelEmp]      = useState("");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [cutoff,      setCutoff]      = useState(`${currentYear}-04-30`);
  const [opts,        setOpts]        = useState({ expense: true, timelog: false, attendance: false, advances: false });
  const [selectAll,   setSelectAll]   = useState(true);
  const [rowChecks,   setRowChecks]   = useState([]);
  const [generating,  setGenerating]  = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [showToast,   setShowToast]   = useState(false);
  const [toastMsg,    setToastMsg]    = useState("");

  // When year changes (tab or dropdown) — reset period fields for that year
  const handleYearChange = (year) => {
    setSelectedYear(year);
    const months = getMonthsForYear(year);
    setSelMonth(months[0] || "");
    setSelWeek("");
    setSelBiweek("");
    setSelQuarter(`Q1-${year}`);
    setCustomFrom("");
    setCustomTo("");
  };

  // When cycle changes — keep selMonth but reset sub-selectors
  const handleCycleChange = (cycle) => {
    setSelectedCycle(cycle);
    setSelWeek("");
    setSelBiweek("");
  };

  // Filtered employees
  const filtered = ALL_EMPLOYEES.filter((e) => {
    if (selDept && e.role !== selDept) return false;
    if (selEmp  && e.name !== selEmp)  return false;
    return true;
  });

  useEffect(() => {
    setRowChecks(filtered.map(() => true));
    setSelectAll(true);
  }, [selDept, selEmp]);

  const checkedEmps = filtered.filter((_, i) => rowChecks[i]);
  const totalGross  = checkedEmps.reduce((s, e) => s + e.gross, 0);
  const totalDed    = checkedEmps.reduce((s, e) => s + e.pf + e.advance, 0);
  const totalNet    = checkedEmps.reduce((s, e) => s + e.net, 0);

  const toggleRow = (i) => {
    const next = [...rowChecks];
    next[i] = !next[i];
    setRowChecks(next);
    setSelectAll(next.every(Boolean));
  };
  const toggleAll = (v) => {
    setSelectAll(v);
    setRowChecks(filtered.map(() => v));
  };

  // Human-readable period label for toast + month tag
  const periodLabel = useMemo(() => {
    if (selectedCycle === "Monthly")   return selMonth;
    if (selectedCycle === "Weekly")    return selWeek   || selMonth;
    if (selectedCycle === "Bi-weekly") return selBiweek || selMonth;
    if (selectedCycle === "Quarterly") return selQuarter;
    if (selectedCycle === "Custom")    return customFrom && customTo ? `${customFrom} → ${customTo}` : "Custom range";
    return "";
  }, [selectedCycle, selMonth, selWeek, selBiweek, selQuarter, customFrom, customTo]);

  const monthTag = selMonth
    ? selMonth.split(" ")[0].substring(0, 3) + " " + (selMonth.split(" ")[1] || selectedYear)
    : selectedYear;

  const handleGenerate = useCallback(() => {
    if (!checkedEmps.length) return;
    setGenerating(true);
    setProgress(0);
    setShowToast(false);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setProgress(100);
        setTimeout(() => {
          setGenerating(false);
          setProgress(0);
          setToastMsg(`${checkedEmps.length} employee${checkedEmps.length !== 1 ? "s" : ""} processed for ${periodLabel}.`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
        }, 300);
      } else {
        setProgress(Math.round(p));
      }
    }, 120);
  }, [checkedEmps, periodLabel]);

  return (
    <div className="gp-page">

      {/* ── Page Header ── */}
      <div className="gp-page-header">
        <div>
          <div className="gp-page-title">Generate Payroll</div>
          <div className="gp-page-sub">Configure and process monthly salaries for your team</div>
        </div>
        {/* Year tabs — visual only, don't change the year dropdown below */}
        <div className="gp-year-tabs">
          {YEARS.map((y) => (
            <button
              key={y}
              className={`gp-year-tab${selectedYear === y ? " active" : ""}`}
              onClick={() => handleYearChange(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* ── Configuration Card ── */}
      <div className="gp-card">
        <div className="gp-card-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#e85d26" strokeWidth="1.4">
            <rect x="1" y="3" width="14" height="10" rx="1.5" />
            <path d="M1 7h14M5 7v6M11 7v6" />
          </svg>
          Payroll configuration
        </div>
        <div className="gp-card-sub">Set the cycle, period, and inclusion options before generating</div>

        {/* ── Salary cycle tabs ── */}
        <div className="gp-section-label">Salary cycle</div>
        <div className="gp-cycle-row">
          {ALL_CYCLES.map((c) => (
            <button
              key={c}
              className={`gp-cycle-btn${selectedCycle === c ? " active" : ""}`}
              onClick={() => handleCycleChange(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* ── Form grid ── */}
        <div className="gp-form-grid">

          {/* Period selector — changes with cycle */}
          <PeriodSelector
            cycle={selectedCycle}
            year={selectedYear}
            selMonth={selMonth}    setSelMonth={setSelMonth}
            selWeek={selWeek}      setSelWeek={setSelWeek}
            selBiweek={selBiweek}  setSelBiweek={setSelBiweek}
            selQuarter={selQuarter} setSelQuarter={setSelQuarter}
            customFrom={customFrom} setCustomFrom={setCustomFrom}
            customTo={customTo}     setCustomTo={setCustomTo}
          />

          <div>
            <label className="gp-label">Department</label>
            <select className="gp-select" value={selDept} onChange={(e) => setSelDept(e.target.value)}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d === "All departments" ? "" : d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="gp-label">Select employee</label>
            <select className="gp-select" value={selEmp} onChange={(e) => setSelEmp(e.target.value)}>
              <option value="">All employees</option>
              {ALL_EMPLOYEES.map((e) => <option key={e.name}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="gp-label">Payment mode</label>
            <select className="gp-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="gp-label">Cut-off date</label>
            <input type="date" className="gp-input" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
          </div>
        </div>

        <div className="gp-divider" />

        <div className="gp-section-label">Include in payroll</div>
        <div className="gp-opts-row">
          <OptCard label="Expense claims"         desc="Approved reimbursements"  checked={opts.expense}    onChange={() => setOpts(p => ({ ...p, expense:    !p.expense    }))} />
          <OptCard label="Add timelogs to salary" desc="Overtime & extra hours"   checked={opts.timelog}    onChange={() => setOpts(p => ({ ...p, timelog:    !p.timelog    }))} />
          <OptCard label="Use attendance"         desc="Deduct absent days"       checked={opts.attendance} onChange={() => setOpts(p => ({ ...p, attendance: !p.attendance }))} />
          <OptCard label="Include advances"       desc="Recover given advances"   checked={opts.advances}   onChange={() => setOpts(p => ({ ...p, advances:   !p.advances   }))} />
        </div>
      </div>

      {/* ── Preview Card ── */}
      <div className="gp-card">
        <div className="gp-preview-header">
          <div>
            <div className="gp-preview-title">Payroll preview</div>
            <div className="gp-preview-sub">
              {checkedEmps.length} employee{checkedEmps.length !== 1 ? "s" : ""} selected
              {periodLabel && <span className="gp-period-badge">{periodLabel}</span>}
            </div>
          </div>
          <button className="gp-btn-sec">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M2 8a6 6 0 1 1 10.4-4.4M14 2v4h-4" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="gp-summary-grid">
          <SummaryCard label="Total gross"      value={inr(totalGross)} colorClass="orange" />
          <SummaryCard label="Total deductions" value={inr(totalDed)}   colorClass="red"    />
          <SummaryCard label="Total net pay"    value={inr(totalNet)}   colorClass="green"  />
          <SummaryCard label="Employees"        value={checkedEmps.length} />
        </div>

        {generating && (
          <div className="gp-progress-wrap">
            <div className="gp-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        {showToast && (
          <div className="gp-toast">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3b6d11" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" /><path d="M5 8l2 2 4-4" />
            </svg>
            Payroll generated successfully! {toastMsg}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="gp-empty">
            <div className="gp-empty-icon">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.3">
                <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11v.5" />
              </svg>
            </div>
            No employees match the selected filters
          </div>
        ) : (
          <div className="gp-table-wrap">
            <table className="gp-table">
              <thead>
                <tr>
                  <th className="gp-th" style={{ width: 36 }}>
                    <input type="checkbox" checked={selectAll} onChange={(e) => toggleAll(e.target.checked)} style={{ accentColor: "#e85d26", cursor: "pointer" }} />
                  </th>
                  {["Technician","Role","Basic","HRA","Travel","Incentive","Gross","PF","Advance","Net pay","Period"].map(h => (
                    <th key={h} className="gp-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => {
                  const ci = ALL_EMPLOYEES.indexOf(emp) % AV_COLORS.length;
                  const { bg, col } = AV_COLORS[ci];
                  const checked = rowChecks[i] ?? true;
                  return (
                    <tr key={emp.name} className={checked ? "gp-row-checked" : "gp-row-unchecked"}>
                      <td className="gp-td">
                        <input type="checkbox" checked={checked} onChange={() => toggleRow(i)} style={{ accentColor: "#e85d26", cursor: "pointer" }} />
                      </td>
                      <td className="gp-td">
                        <div className="gp-name-cell">
                          <div className="gp-avatar" style={{ background: bg, color: col }}>{initials(emp.name)}</div>
                          <span className="gp-emp-name">{emp.name}</span>
                        </div>
                      </td>
                      <td className="gp-td muted">{emp.role}</td>
                      <td className="gp-td">{inr(emp.basic)}</td>
                      <td className="gp-td">{inr(emp.hra)}</td>
                      <td className="gp-td">{inr(emp.travel)}</td>
                      <td className="gp-td">{inr(emp.incentive)}</td>
                      <td className="gp-td orange">{inr(emp.gross)}</td>
                      <td className="gp-td red">{inr(emp.pf)}</td>
                      <td className={`gp-td${emp.advance ? " red" : " faint"}`}>{emp.advance ? inr(emp.advance) : "—"}</td>
                      <td className="gp-td green">{inr(emp.net)}</td>
                      <td className="gp-td"><span className="gp-month-tag">{monthTag}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="gp-tfoot-td">Total</td>
                  <td className="gp-tfoot-td orange">{inr(totalGross)}</td>
                  <td className="gp-tfoot-td red">{inr(checkedEmps.reduce((s, e) => s + e.pf, 0))}</td>
                  <td className="gp-tfoot-td red">{inr(checkedEmps.reduce((s, e) => s + e.advance, 0))}</td>
                  <td className="gp-tfoot-td green">{inr(totalNet)}</td>
                  <td className="gp-tfoot-td" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="gp-divider" />
        <div className="gp-btn-row">
          <button className="gp-btn-sec">Save as draft</button>
          <button className="gp-btn-sec">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M2 8a6 6 0 1 1 10.4-4.4M14 2v4h-4" />
            </svg>
            Preview
          </button>
          <button className="gp-btn-prim" onClick={handleGenerate} disabled={generating || checkedEmps.length === 0}>
            {generating ? (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.5" className="gp-spin">
                  <path d="M8 2a6 6 0 1 1-4.24 1.76" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13 7H9V3H7v4H3v2h4v4h2V9h4V7z" />
                </svg>
                Generate payroll
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}