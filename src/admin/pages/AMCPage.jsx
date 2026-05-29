// AMCPage.jsx — SearchBar + FilterDropdowns + ExportDropdown + Pagination + PDF (matches detail view)
import { amcApi } from '../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { KCard, Thead } from '../components/ui/Cards';
import EditableDetailView from '../components/ui/EditableDetailView';
import ActionDropdown from '../components/ui/ActionDropdown';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import PDFPreview from '../components/layout/PDFPreview';
import { useTableSearch } from '../hooks/useTableSearch';
import TableSearchBar from '../components/ui/TableSearchBar';
import FilterSelect from '../components/ui/FilterSelect';
import ExportDropdown from '../components/layout/ExportDropdown';
import useExport from '../hooks/useExport';
import { usePagination } from '../hooks/usePagination';   // ← NEW
import Pagination from '../components/ui/Pagination';     // ← NEW
import { addToDeleted } from '../store/deletedStore';

import logoImg      from '../assets/logo.png';
import signatureImg from '../assets/signature.png';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_COLORS = { Comprehensive: "#3B82F6", Premium: "#8B5CF6", Basic: "#10B981" };
const NAVY  = "#1a2e5c";
const ORANGE = "#F97316";

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizeContract = (c) => ({
  ...c,
  id:        c.amcId || ('AMC-' + String(c._id).slice(-6).toUpperCase()),
  customer:  typeof c.customer === 'object' && c.customer !== null
               ? c.customer.name : (c.customerName || c.customer || ''),
  customerId: typeof c.customer === 'object' && c.customer !== null
               ? c.customer._id : c.customerId,
  start:     formatDate(c.start     || c.startDate),
  end:       formatDate(c.end       || c.endDate),
  nextVisit: formatDate(c.nextVisit || c.nextVisitDate),
  value:     c.value  ?? 0,
  units:     c.units  ?? 1,
  visits:    c.visits ?? 0,
  done:      c.done   ?? 0,
  plan:      c.plan   || 'Basic',
  status:    c.status || 'active',
  autoRenew: c.autoRenew ?? false,
});


// ─── Column config for export ─────────────────────────────────────────────────
const AMC_COLUMNS = [
  { label: "Contract ID", key: "id",        width: 12, tdStyle: { fontFamily: "monospace", fontWeight: 700, color: COLORS.brand, fontSize: 11 } },
  { label: "Customer",    key: "customer",  width: 20, tdStyle: { fontWeight: 600 } },
  { label: "Plan",        key: "plan",      width: 14, format: v => v },
  { label: "Units",       key: "units",     width: 8,  tdStyle: { fontFamily: "monospace", textAlign: "center" }, format: v => v },
  { label: "Value (₹)",   key: "value",     width: 12, excelKey: "Value (₹)", format: v => v, tdStyle: { fontFamily: "monospace", fontWeight: 700, color: COLORS.brand } },
  { label: "Start",       key: "start",     width: 10, tdStyle: { fontSize: 11, color: COLORS.muted } },
  { label: "End",         key: "end",       width: 10, tdStyle: { fontSize: 11, color: COLORS.muted } },
  { label: "Visits/Yr",   key: "visits",    width: 8,  tdStyle: { fontFamily: "monospace", textAlign: "center" }, format: v => v },
  { label: "Done",        key: "done",      width: 8,  tdStyle: { fontFamily: "monospace", textAlign: "center" }, format: v => v },
  { label: "Next Visit",  key: "nextVisit", width: 10, tdStyle: { fontSize: 11 } },
  { label: "Status",      key: "status",    width: 10, format: v => v === "active" ? "Active" : "Expiring" },
];

// ─── AMC PDF Template — mirrors the detail view screenshot exactly ────────────
// Register this in documentTemplates.jsx:  amc_contract: AMCContractPDFTemplate
export const AMCContractPDFTemplate = ({ data: c }) => {
  const planColor = PLAN_COLORS[c.plan] || "#64748B";
  const isActive  = c.status === "active" || c.status === "Active";
  const pct       = c.visits > 0 ? Math.round((c.done / c.visits) * 100) : 0;

  const cell = (extra = {}) => ({
    border: `1px solid ${NAVY}`, padding: "6px 10px",
    fontSize: 11, color: "#111", verticalAlign: "top", ...extra,
  });

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#111", background: "white" }}>

      {/* ── Header: logo + company info ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, borderBottom: `2px solid ${ORANGE}`, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: ORANGE }}>❄ CoolTech AC Services</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>GSTIN: 29AABCT1234A1Z5 · +91 98765 43210</div>
          <div style={{ fontSize: 10, color: "#888" }}>Bengaluru, Karnataka · cooltech@services.com</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <img src={logoImg} alt="Logo" style={{ height: 52, width: "auto", objectFit: "contain" }} />
          <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>Date: {c.start}</div>
        </div>
      </div>

      {/* ── Title bar ── */}
      <div style={{ textAlign: "center", padding: "10px 0", borderTop: `1px solid ${NAVY}`, borderBottom: `1px solid ${NAVY}`, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, textDecoration: "underline", letterSpacing: 1, textTransform: "uppercase" }}>
          AMC CONTRACT — {c.plan} Plan
        </span>
      </div>

      {/* ── Hero card: mirrors the top white card from screenshot ── */}
      <div style={{ border: `1.5px solid ${NAVY}`, borderRadius: 10, padding: "16px 20px", marginBottom: 16, background: "#FAFCFF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            {/* Status + Plan badges */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                background: isActive ? "#F0FDF4" : "#FFFBEB",
                color: isActive ? "#16A34A" : "#B45309",
                border: `1px solid ${isActive ? "#BBF7D0" : "#FDE68A"}`,
              }}>
                {isActive ? "Active" : "Expiring"}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                background: `${planColor}18`, color: planColor, border: `1px solid ${planColor}40`,
              }}>
                {c.plan} Plan
              </span>
            </div>
            {/* Customer name — large, like in screenshot */}
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a", marginBottom: 4 }}>{c.customer}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{c.units} AC Units · {c.start} to {c.end}</div>
          </div>
          {/* Contract value — right-aligned, orange, big */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>Contract Value</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontFamily: "monospace", letterSpacing: -1 }}>
              ₹{Number(c.value).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>₹{Math.round(c.value / 12).toLocaleString()}/mo</div>
          </div>
        </div>

        {/* 4-stat grid — mirrors TOTAL VISITS/YEAR · VISITS DONE · REMAINING · NEXT VISIT */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, paddingTop: 14, borderTop: "1px solid #E2E8F0" }}>
          {[
            ["TOTAL VISITS/YEAR", c.visits],
            ["VISITS DONE",       c.done],
            ["REMAINING",         c.visits - c.done],
            ["NEXT VISIT",        c.nextVisit],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "white", borderRadius: 8, padding: "10px 12px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .5, marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: "monospace" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Visit Progress — mirrors the Visit Progress card ── */}
      <div style={{ border: `1px solid ${NAVY}`, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>Visit Progress</div>
          <span style={{ fontSize: 13, fontWeight: 800, color: ORANGE }}>{pct}%</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 10, background: "#F1F5F9", borderRadius: 99, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${ORANGE},#EA580C)`, borderRadius: 99 }} />
        </div>
        {/* Visit cards — same as screenshot */}
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: c.visits }).map((_, i) => (
            <div key={i} style={{
              flex: 1, padding: "10px 6px", borderRadius: 8, textAlign: "center",
              background: i < c.done ? "#F0FDF4" : "#F8FAFC",
              border: `1px solid ${i < c.done ? "#BBF7D0" : "#E2E8F0"}`,
            }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{i < c.done ? "✅" : "📅"}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: i < c.done ? "#16A34A" : "#94A3B8" }}>Visit {i + 1}</div>
              <div style={{ fontSize: 9, color: "#94A3B8" }}>{i < c.done ? "Done" : "Pending"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contract details table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <thead>
          <tr style={{ background: NAVY }}>
            <th colSpan={4} style={{ ...cell({ color: "white", fontWeight: 700, textAlign: "center", fontSize: 12 }) }}>
              CONTRACT DETAILS
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Contract ID",    <span style={{ fontFamily: "monospace", fontWeight: 700, color: NAVY }}>{c.id}</span>,
             "Plan",           <span style={{ background: `${planColor}18`, color: planColor, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{c.plan}</span>],
            ["Customer",       <strong>{c.customer}</strong>,
             "Status",         <span style={{ background: isActive ? "#F0FDF4" : "#FFFBEB", color: isActive ? "#16A34A" : "#B45309", padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{isActive ? "Active" : "Expiring"}</span>],
            ["AC Units",       <span style={{ fontFamily: "monospace", fontWeight: 800 }}>{c.units}</span>,
             "Contract Value", <span style={{ fontFamily: "monospace", fontWeight: 900, color: ORANGE, fontSize: 13 }}>₹{Number(c.value).toLocaleString()}</span>],
            ["Start Date",     c.start,   "End Date",     c.end],
            ["Visits / Year",  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{c.visits}</span>,
             "Next Visit",     <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#B45309" }}>{c.nextVisit}</span>],
            ["Monthly Value",  <span style={{ fontFamily: "monospace", fontWeight: 700, color: ORANGE }}>₹{Math.round(c.value / 12).toLocaleString()}/mo</span>,
             "Auto-Renew",     "Yes"],
          ].map(([k1, v1, k2, v2], idx) => (
            <tr key={idx}>
              <td style={{ ...cell({ fontWeight: 700, background: "#EEF2FF", width: "22%" }) }}>{k1}</td>
              <td style={{ ...cell({ width: "28%" }) }}>{v1}</td>
              <td style={{ ...cell({ fontWeight: 700, background: "#EEF2FF", width: "22%" }) }}>{k2}</td>
              <td style={{ ...cell({ width: "28%" }) }}>{v2}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Terms ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <thead>
          <tr style={{ background: NAVY }}>
            <th style={{ ...cell({ color: "white", fontWeight: 700, textAlign: "left", fontSize: 12 }) }}>
              TERMS &amp; CONDITIONS
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...cell({ lineHeight: 1.9, color: "#333" }) }}>
              This Annual Maintenance Contract covers <strong>{c.units}</strong> AC unit(s) under the <strong>{c.plan} Plan</strong> for the
              period <strong>{c.start}</strong> to <strong>{c.end}</strong>. Total <strong>{c.visits}</strong> scheduled service visits per year.
              Contract value <strong>₹{Number(c.value).toLocaleString()}</strong> (₹{Math.round(c.value / 12).toLocaleString()}/mo).
              Services include preventive maintenance, filter cleaning, gas top-up checks, and priority breakdown support.
              Any parts/consumables required during visits will be charged separately as per actuals.
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Signature footer ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 14, borderTop: `1px solid ${NAVY}`, marginTop: 8 }}>
        <div style={{ fontSize: 11, color: "#222", lineHeight: 2 }}>
          <div>Thanking You,</div>
          <div style={{ fontWeight: 700 }}>Mr. VAKIL YADAV</div>
          <div>9724763909</div>
          <div>From: Alisha Engineering</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <img
            src={signatureImg}
            alt="Signature"
            style={{ height: 44, width: "auto", display: "block", marginBottom: 4, mixBlendMode: "multiply", filter: "contrast(1.4) brightness(0.7)" }}
          />
          <div style={{ fontSize: 10, fontWeight: 700, color: "#555", borderTop: "1px solid #ccc", paddingTop: 4, width: 160, textAlign: "left" }}>
            [Authorized Signatory]
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1px solid #E5E7EB", fontSize: 10, color: "#aaa", textAlign: "center" }}>
        Thank you for choosing CoolTech AC Services · cooltech@services.com · +91 98765 43210
      </div>
    </div>
  );
};

// ─── AMCDetail ────────────────────────────────────────────────────────────────
const AMCDetail = ({ contract, onBack, onSave, openModal, initialEditMode }) => {
  const [showPDF, setShowPDF] = useState(false);

  const fields = [
    { key: "customer" }, { key: "plan" }, { key: "status" },
    { key: "value" }, { key: "units" }, { key: "start" },
    { key: "end" }, { key: "nextVisit" },
  ];

  const iStyle = (extra = {}) => ({
    padding: "6px 10px", borderRadius: 7, border: `1.5px solid ${COLORS.border}`,
    fontSize: 13, color: COLORS.h2, background: "#FAFAFA",
    fontFamily: FONTS.sans, outline: "none", width: "100%", boxSizing: "border-box", ...extra,
  });

  const FL = ({ children }) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>
      {children}
    </div>
  );

  return (
    <>
      <EditableDetailView
        id={contract.id}
        breadcrumb="AMC Contracts"
        onBack={onBack}
        fields={fields}
        data={contract}
        initialEditMode={initialEditMode}
        onSave={onSave}
      >
        {({ editMode, editData, setEditData }) => {
          const val  = (key) => editData[key] ?? contract[key] ?? "";
          const setK = (key) => (e) => setEditData(p => ({ ...p, [key]: e.target.value }));
          const pct  = Math.round((contract.done / contract.visits) * 100);
          const planColor = PLAN_COLORS[editMode ? val("plan") : contract.plan] || "#64748B";
          const isActive  = (editMode ? val("status") : contract.status) === "active";

          const sidebar = (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Actions</div>
                {!editMode ? (
                  <>
                    <button className="btn" onClick={() => openModal("schedule_amc", { id: contract.id })}
                      style={{ width: "100%", padding: "10px", borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700, border: "none", marginBottom: 8 }}>
                      📅 Schedule Next Visit
                    </button>
                    <button className="btn" onClick={() => openModal("new_invoice")}
                      style={{ width: "100%", padding: "10px", borderRadius: 9, background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                      💰 Generate Invoice
                    </button>
                    <button className="btn" onClick={() => openModal("new_amc")}
                      style={{ width: "100%", padding: "10px", borderRadius: 9, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                      🔄 Renew Contract
                    </button>
                    {/* ── Download Contract → opens PDF with AMC detail layout ── */}
                    <button className="btn" onClick={() => setShowPDF(true)}
                      style={{ width: "100%", padding: "10px", borderRadius: 9, background: "#F8FAFC", border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 12, fontWeight: 600 }}>
                      📄 Download Contract
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: COLORS.muted, textAlign: "center", padding: "8px 0" }}>
                    Actions available in view mode
                  </div>
                )}
              </div>

              <div style={{ background: "#FFFBEB", borderRadius: 14, border: "1px solid #FDE68A", padding: "14px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>⏱ Next Visit Due</div>
                {editMode ? (
                  <input value={val("nextVisit")} onChange={setK("nextVisit")}
                    style={iStyle({ fontSize: 14, fontWeight: 800, color: "#B45309", background: "#FFFBEB", border: "1.5px solid #FDE68A" })} />
                ) : (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#B45309" }}>{contract.nextVisit}</div>
                    <div style={{ fontSize: 11, color: "#92400E", marginTop: 3 }}>{contract.units} unit{contract.units > 1 ? "s" : ""} to service</div>
                  </>
                )}
              </div>
            </div>
          );

          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`, padding: 22, boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : "0 1px 4px rgba(0,0,0,.05)", transition: "all .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div style={{ flex: 1, marginRight: 16 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        {editMode ? (
                          <>
                            <select value={val("status")} onChange={setK("status")}
                              style={{ padding: "4px 9px", borderRadius: 99, border: `1.5px solid ${COLORS.border}`, fontSize: 11, fontWeight: 700, background: "#FAFAFA", outline: "none" }}>
                              <option value="active">Active</option>
                              <option value="expiring">Expiring</option>
                            </select>
                            <select value={val("plan")} onChange={setK("plan")}
                              style={{ padding: "4px 9px", borderRadius: 99, border: `1.5px solid ${COLORS.border}`, fontSize: 11, fontWeight: 700, background: "#FAFAFA", outline: "none" }}>
                              {["Comprehensive","Premium","Basic"].map(p => <option key={p}>{p}</option>)}
                            </select>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: isActive ? "#F0FDF4" : "#FFFBEB", color: isActive ? "#16A34A" : "#B45309" }}>
                              {isActive ? "Active" : "Expiring"}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: `${planColor}15`, color: planColor }}>
                              {contract.plan} Plan
                            </span>
                          </>
                        )}
                      </div>
                      {editMode
                        ? <input value={val("customer")} onChange={setK("customer")} style={iStyle({ fontSize: 18, fontWeight: 800, marginBottom: 6 })} />
                        : <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>{contract.customer}</div>
                      }
                      {editMode ? (
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <div style={{ flex: "0 0 100px" }}>
                            <FL>Units</FL>
                            <input value={val("units")} onChange={setK("units")} type="number" style={iStyle({ fontSize: 12 })} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <FL>Start Date</FL>
                            <input value={val("start")} onChange={setK("start")} style={iStyle({ fontSize: 12 })} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <FL>End Date</FL>
                            <input value={val("end")} onChange={setK("end")} style={iStyle({ fontSize: 12 })} />
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>
                          {contract.units} AC Units · {contract.start} to {contract.end}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 4 }}>Contract Value</div>
                      {editMode
                        ? <input value={val("value")} onChange={setK("value")} type="number" style={iStyle({ fontSize: 22, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono, textAlign: "right", width: 160 })} />
                        : <>
                            <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono }}>₹{contract.value.toLocaleString()}</div>
                            <div style={{ fontSize: 11, color: COLORS.muted }}>₹{Math.round(contract.value / 12).toLocaleString()}/mo</div>
                          </>
                      }
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[["Total Visits/Year", contract.visits], ["Visits Done", contract.done], ["Remaining", contract.visits - contract.done], ["Next Visit", contract.nextVisit]].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>{k}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>Visit Progress</div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.brand }}>{pct}%</span>
                  </div>
                  <div style={{ height: 10, background: "#F1F5F9", borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${COLORS.brand},${COLORS.brandD})`, borderRadius: 99, transition: "width .5s" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Array.from({ length: contract.visits }).map((_, i) => (
                      <div key={i} style={{ flex: 1, minWidth: 60, padding: "10px 8px", borderRadius: 8, background: i < contract.done ? "#F0FDF4" : "#F8FAFC", border: `1px solid ${i < contract.done ? "#BBF7D0" : COLORS.border}`, textAlign: "center" }}>
                        <div style={{ fontSize: 16 }}>{i < contract.done ? "✅" : "📅"}</div>
                        <div style={{ fontSize: 10, color: i < contract.done ? "#16A34A" : COLORS.faint, marginTop: 3, fontWeight: 600 }}>Visit {i + 1}</div>
                        <div style={{ fontSize: 9, color: COLORS.faint }}>{i < contract.done ? "Done" : "Pending"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {sidebar}
            </div>
          );
        }}
      </EditableDetailView>

      {/* ── PDF Preview — amc_contract template (matches detail view) ── */}
      <PDFPreview
        open={showPDF}
        onClose={() => setShowPDF(false)}
        title={contract.id}
        filename={`amc-contract-${contract.id}`}
        template="amc_contract"
        data={contract}
      />
    </>
  );
};

// ─── AMCPage ──────────────────────────────────────────────────────────────────
const AMCPage = ({ openModal }) => {
  const [open, setOpen]                       = useState(null);
  const [tab, setTab]                         = useState("contracts");
  const [contracts, setContracts] = useState([]);



  const fetchContracts = () => {
    amcApi.list({ limit: 200 })
      .then(r => setContracts((r.data ?? []).map(normalizeContract)))
      .catch(() => {});
  };

  useEffect(() => {
    fetchContracts();
    window.addEventListener('focus', fetchContracts);
    return () => window.removeEventListener('focus', fetchContracts);
  }, []);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget]       = useState(null);

  // ── Search + filters ──────────────────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: filteredContracts,
  } = useTableSearch(
    contracts,
    ['id', 'customer', 'plan', 'status', 'nextVisit'],
    { plan: '', status: '' }
  );

  // ── Pagination — contracts tab ────────────────────────────────────────────
  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filteredContracts, 10);

  // ── Pagination — visits tab (separate state) ──────────────────────────────
  const {
    paginated: paginatedVisits,
    page: visitsPage, totalPages: visitsTotalPages, setPage: setVisitsPage,
    pageSize: visitsPageSize, setPageSize: setVisitsPageSize,
    from: visitsFrom, to: visitsTo, total: visitsTotal,
  } = usePagination(filteredContracts, 10);

  // ── Export ────────────────────────────────────────────────────────────────
  const { exportProps } = useExport({
    title:        "AMC Contracts",
    filename:     "amc-contracts",
    template:     "generic_list",
    subtitle:     `CoolTech AC Services · AMC Contracts · ${filteredContracts.length} records`,
    docId:        "AMC-EXPORT",
    columns:      AMC_COLUMNS,
    rows:         filteredContracts,
    showTotals:   true,
    totalColumns: ["value"],
  });

  const contract       = open ? contracts.find(c => c._id === open) : null;
  const totalVal       = contracts.reduce((s, c) => s + c.value, 0);
  const totalUnits     = contracts.reduce((s, c) => s + c.units, 0);
  const visitsAllTotal = contracts.reduce((s, c) => s + c.visits, 0);
  const visitsDone     = contracts.reduce((s, c) => s + c.done, 0);

  const planBreakdown = ["Comprehensive", "Premium", "Basic"].map(p => ({
    plan:  p,
    count: contracts.filter(c => c.plan === p).length,
    value: contracts.filter(c => c.plan === p).reduce((s, c) => s + c.value, 0),
  }));

  const handleSave = async (updated) => {
    try {
      const doc = await amcApi.update(updated._id, updated);
      setContracts(prev => prev.map(c => c._id === doc._id ? normalizeContract(doc) : c));
    } catch(e) { alert(e.message); }
  };
  const handleBack   = () => { setOpen(null); setInitialEditMode(false); };
  const handleDelete = async (id) => {
      const item = contracts.find(x => (x._id ?? x.id) === id);
      if (item) addToDeleted({
        id:     item.id ?? item._id,
        name:   item.name ?? item.customer ?? item.id,
        module: 'AMC Contracts',
        by:     'Admin',
      });
      try {
        await amcApi.remove(id);
        setContracts(prev => prev.filter(x => (x._id ?? x.id) !== id));
      } catch (e) { alert(e.message); }
    };
  
  if (contract) {
    return (
      <AMCDetail
        contract={contract}
        onBack={handleBack}
        onSave={handleSave}
        openModal={openModal}
        initialEditMode={initialEditMode}
      />
    );
  }

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>AMC Contracts</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Annual Maintenance Contracts · ₹{(totalVal / 100000).toFixed(1)}L recurring revenue</div>
        </div>
        <button className="btn" onClick={() => openModal("new_amc")}
          style={{ padding: "9px 20px", borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}>
          + New AMC
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
        <KCard label="Active Contracts" value={contracts.filter(c => c.status === "active").length}   sub="live"        icon="📋" iconBg="#F0FDF4" color="#16A34A" delay="" />
        <KCard label="Expiring Soon"    value={contracts.filter(c => c.status === "expiring").length}  sub="renew now"   icon="⚠️" iconBg="#FFFBEB" color="#B45309" delay="1" />
        <KCard label="Units Covered"    value={totalUnits}                                              sub="AC units"    icon="❄️" iconBg="#EFF6FF" color="#0369A1" delay="2" />
        <KCard label="Visit Completion" value={`${Math.round((visitsDone / visitsAllTotal) * 100)}%`}  sub={`${visitsDone}/${visitsAllTotal} done`} icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="3" />
        <KCard label="Monthly Revenue"  value={`₹${(totalVal / 12 / 1000).toFixed(0)}K`}              sub="recurring"   icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="3" />
      </div>

      {/* Plan breakdown + renewal pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>Plan Breakdown</div>
          {planBreakdown.map(p => (
            <div key={p.plan} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{p.plan}</span>
                <span style={{ fontWeight: 700, color: COLORS.h2 }}>{p.count} contracts · ₹{(p.value / 1000).toFixed(0)}K</span>
              </div>
              <div style={{ height: 8, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${(p.value / totalVal) * 100}%`, height: "100%", background: PLAN_COLORS[p.plan] || "#64748B", borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>Renewal Pipeline</div>
          {contracts.filter(c => c.status === "expiring").map(c => (
            <div key={c._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#FFFBEB", border: "1px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{c.customer}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{c.units} units · {c.plan} · expires {c.end}</div>
              </div>
              <button className="btn" onClick={() => openModal("new_amc")}
                style={{ padding: "5px 12px", borderRadius: 7, background: COLORS.brand, color: "white", fontSize: 11, fontWeight: 700, border: "none", whiteSpace: "nowrap" }}>Renew</button>
            </div>
          ))}
          {contracts.filter(c => c.status === "expiring").length === 0 && (
            <div style={{ fontSize: 12, color: COLORS.faint, textAlign: "center", padding: 16 }}>No contracts expiring soon ✓</div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "clip" }}>

        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 6, alignItems: "center" }}>
          {["contracts", "visits"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: tab === t ? COLORS.brandL : COLORS.bg, color: tab === t ? COLORS.brand : COLORS.muted, border: `1px solid ${tab === t ? COLORS.brand : COLORS.border}`, cursor: "pointer", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: COLORS.faint }}>
            {from}–{to} of {total} contracts
          </span>
        </div>

        {/* ── Search + Filter + Export ── */}
          <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by customer, contract ID, plan…" />
            <FilterSelect
              value={activeFilters.plan}
              onChange={val => setFilter("plan", val)}
              options={["Comprehensive", "Premium", "Basic"]}
              allLabel="All Plans"
            />
            <FilterSelect
              value={activeFilters.status}
              onChange={val => setFilter("status", val)}
              options={["active", "expiring"]}
              allLabel="All Status"
            />
            <div style={{ marginLeft: 'auto' }}>
                <ExportDropdown {...exportProps} />
              </div>
          </div>

        {/* ── Contracts tab ── */}
        {tab === "contracts" && (
          <>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <Thead cols={["Contract ID", "Customer", "Units", "Plan", "Value", "Period", "Visits", "Next Visit", "Status", ""]} />
                <tbody>
                  {paginated.map((c, i) => (
                    <tr key={c._id} className="row" onClick={() => { setInitialEditMode(false); setOpen(c._id); }}
                      style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                      <td style={{ padding: "13px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.brand }}>{c.id}</span></td>
                      <td style={{ padding: "13px 14px", fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{c.customer}</td>
                      <td style={{ padding: "13px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 700, color: COLORS.h2 }}>{c.units}</span></td>
                      <td style={{ padding: "13px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: `${PLAN_COLORS[c.plan] || "#64748B"}15`, color: PLAN_COLORS[c.plan] || "#64748B" }}>{c.plan}</span>
                      </td>
                      <td style={{ padding: "13px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.brand }}>₹{c.value.toLocaleString()}</span></td>
                      <td style={{ padding: "13px 14px", fontSize: 11, color: COLORS.muted }}>{c.start} – {c.end}</td>
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${(c.done / c.visits) * 100}%`, height: "100%", background: "#10B981", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.muted }}>{c.done}/{c.visits}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 14px", fontSize: 12, color: COLORS.body }}>{c.nextVisit}</td>
                      <td style={{ padding: "13px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: c.status === "active" ? "#F0FDF4" : "#FFFBEB", color: c.status === "active" ? "#16A34A" : "#B45309" }}>
                          {c.status === "active" ? "Active" : "Expiring"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 14px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button className="btn"
                            onClick={e => { e.stopPropagation(); openModal("schedule_amc", { id: c._id }); }}
                            style={{ padding: "5px 10px", borderRadius: 6, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            📅 Schedule
                          </button>
                          <ActionDropdown
                            onView={()  => { setInitialEditMode(false); setOpen(c._id); }}
                            onEdit={()  => { setInitialEditMode(true);  setOpen(c._id); }}
                            onDelete={() => setDeleteTarget(c._id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ padding: "32px", textAlign: "center", fontSize: 13, color: COLORS.faint }}>
                        No contracts match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* ── Pagination ── */}
            <Pagination
              page={page} totalPages={totalPages} setPage={setPage}
              pageSize={pageSize} setPageSize={setPageSize}
              from={from} to={to} total={total}
            />
          </>
        )}

        {/* ── Visits tab ── */}
        {tab === "visits" && (
          <>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <Thead cols={["Contract", "Customer", "Plan", "Visits/Year", "Done", "Remaining", "% Complete", "Next Visit", "Action"]} />
                <tbody>
                  {paginatedVisits.map((c, i) => {
                    const pct = Math.round((c.done / c.visits) * 100);
                    return (
                      <tr key={c._id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                        <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.brand }}>{c.id}</span></td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{c.customer}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${PLAN_COLORS[c.plan] || "#64748B"}15`, color: PLAN_COLORS[c.plan] || "#64748B" }}>{c.plan}</span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800, color: COLORS.h2, fontFamily: FONTS.mono }}>{c.visits}</td>
                        <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800, color: "#16A34A", fontFamily: FONTS.mono }}>{c.done}</td>
                        <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800, color: c.visits - c.done > 0 ? "#B45309" : COLORS.faint, fontFamily: FONTS.mono }}>{c.visits - c.done}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#22C55E" : COLORS.brand, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? "#16A34A" : COLORS.brand, minWidth: 30 }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: COLORS.body }}>{c.nextVisit}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <button className="btn" onClick={() => openModal("schedule_amc", { id: c._id })}
                            style={{ padding: "5px 10px", borderRadius: 6, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 11, fontWeight: 700 }}>📅 Book</button>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedVisits.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: "32px", textAlign: "center", fontSize: 13, color: COLORS.faint }}>
                        No contracts match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* ── Pagination for visits tab ── */}
            <Pagination
              page={visitsPage} totalPages={visitsTotalPages} setPage={setVisitsPage}
              pageSize={visitsPageSize} setPageSize={setVisitsPageSize}
              from={visitsFrom} to={visitsTo} total={visitsTotal}
            />
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        message="This AMC contract will be permanently removed."
      />
    </div>
  );
};

export default AMCPage;