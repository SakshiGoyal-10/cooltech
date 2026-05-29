import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { KCard, SectionHdr, Thead } from '../components/ui/Cards';
import ActionDropdown from '../components/ui/ActionDropdown';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import PDFPreview from '../components/layout/PDFPreview';
import { useTableSearch } from '../hooks/useTableSearch';
import TableSearchBar from '../components/ui/TableSearchBar';
import FilterSelect from '../components/ui/FilterSelect';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import ExportDropdown from '../components/layout/ExportDropdown';
import useExport from '../hooks/useExport';

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_SERVICES = [
  { id: "SVC-001", name: "AC Installation", category: "Installation", acType: "Split AC", duration: "4-6 hrs", warranty: "1 Year", price: 2500, gst: 18, includes: "Site visit, piping up to 3ft, stabilizer connection", checklist: ["Measure & mark wall position","Drill holes & fix brackets","Mount indoor unit","Run copper piping","Connect refrigerant lines","Electrical wiring","Vacuum & gas charging","Test run & demo"], tools: ["Drill machine","Pipe bender","Vacuum pump","Manifold gauge"], active: true, popular: true, description: "Full split AC installation including brackets, piping, wiring and test run." },
  { id: "SVC-002", name: "AC Service / Cleaning", category: "Service", acType: "All Types", duration: "1-2 hrs", warranty: "30 Days", price: 699, gst: 18, includes: "Filter cleaning, coil wash, drain flush, check thermostat", checklist: ["Check error codes","Clean filters","Wash indoor coil","Flush drain pipe","Check refrigerant level","Inspect electrical connections","Test cooling performance","Customer sign-off"], tools: ["Pressure washer","Fin comb","Multimeter"], active: true, popular: true, description: "Complete AC servicing with deep clean, gas check and performance test." },
  { id: "SVC-003", name: "Gas Refilling (R-32)", category: "Repair", acType: "Inverter Split", duration: "1 hr", warranty: "90 Days", price: 1800, gst: 18, includes: "Gas top-up, leak check, pressure test", checklist: ["Check for leaks with detector","Purge old gas if required","Connect manifold gauge","Fill R-32 to specified pressure","Check suction & discharge pressure","Test cooling"], tools: ["Manifold gauge set","Leak detector","R-32 cylinder","Vacuum pump"], active: true, popular: false, description: "R-32 refrigerant refill with leak detection and pressure testing." },
  { id: "SVC-004", name: "AMC – Basic Plan", category: "AMC", acType: "All Types", duration: "1 Year / 2 Visits", warranty: "Contract Period", price: 1499, gst: 18, includes: "2 service visits, filter cleaning, minor repairs, priority support", checklist: ["Schedule visit 1 (summer)","Full service & clean","Schedule visit 2 (monsoon)","Coil wash & drain check","Minor repairs covered","24hr support access"], tools: ["Standard service kit"], active: true, popular: true, description: "Annual maintenance contract with 2 service visits and priority support." },
  { id: "SVC-005", name: "AMC – Comprehensive Plan", category: "AMC", acType: "All Types", duration: "1 Year / 4 Visits", warranty: "Contract Period", price: 3499, gst: 18, includes: "4 service visits, gas top-up covered, parts discount 20%, emergency calls", checklist: ["Quarterly scheduled visits","Deep service each visit","Gas top-up if needed","20% off on spare parts","Emergency response <4hrs","End-of-year report"], tools: ["Full service kit","Manifold gauge"], active: true, popular: false, description: "Premium AMC with quarterly visits, gas coverage and emergency support." },
  { id: "SVC-006", name: "Compressor Replacement", category: "Repair", acType: "Split / Cassette", duration: "3-5 hrs", warranty: "1 Year", price: 8500, gst: 18, includes: "Labour only — compressor cost extra, gas refill included", checklist: ["Diagnose compressor failure","Source compatible compressor","Recover old refrigerant","Remove & install new compressor","Vacuum & leak test","Gas charge","Run test & handover"], tools: ["Manifold gauge","Vacuum pump","Spanner set","Refrigerant recovery unit"], active: true, popular: false, description: "Full compressor swap with gas recovery, vacuum and re-charge." },
];

const CATEGORIES = ["Installation", "Service", "Repair", "AMC"];
const CAT_COLOR = {
  Installation: { bg: "#EFF6FF", color: "#1D4ED8" },
  Service:      { bg: "#F0FDF4", color: "#15803D" },
  Repair:       { bg: "#FEF2F2", color: "#DC2626" },
  AMC:          { bg: "#FFF7ED", color: "#C2410C" },
};

const SERVICE_COLUMNS = [
  { label: 'ID',               key: 'id',       width: 10, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: COLORS.brand, fontSize: 11 } },
  { label: 'Service Name',     key: 'name',     width: 22, tdStyle: { fontWeight: 600 } },
  { label: 'Category',         key: 'category', width: 14, tdStyle: { fontSize: 12 } },
  { label: 'AC Type',          key: 'acType',   width: 14, tdStyle: { fontSize: 12 } },
  { label: 'Duration',         key: 'duration', width: 12, tdStyle: { fontSize: 12 } },
  { label: 'Warranty',         key: 'warranty', width: 12, tdStyle: { fontSize: 12 } },
  { label: 'Price (ex-GST)',   key: 'price',    width: 12, format: v => v, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: COLORS.brand } },
  { label: 'GST %',            key: 'gst',      width:  8, format: v => `${v}%`, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Total (incl-GST)', key: 'totalAmt', width: 14, format: v => v, tdStyle: { fontFamily: 'monospace', fontWeight: 800, color: COLORS.brand } },
  { label: 'Status',           key: 'active',   width:  8, format: v => (v ? 'Active' : 'Inactive'), tdStyle: { fontSize: 12 } },
];

const BLANK = {
  id: "", name: "", category: "Service", acType: "All Types",
  duration: "", warranty: "", price: "", gst: 18,
  includes: "", description: "", active: true, popular: false,
  checklist: [], tools: [],
};

// ─── Shared input style ───────────────────────────────────────────────────────
const iStyle = (extra = {}) => ({
  padding: "7px 10px", borderRadius: 8,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13, color: COLORS.h2,
  background: "#FAFAFA", fontFamily: FONTS.sans,
  width: "100%", outline: "none",
  boxSizing: "border-box", ...extra,
});

const FieldLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: "uppercase", letterSpacing: .5, marginBottom: 5 }}>{children}</div>
);

// ─── ServiceCard ──────────────────────────────────────────────────────────────
const ServiceCard = ({ svc, onView, onEdit, onDelete }) => {
  const cat   = CAT_COLOR[svc.category] || CAT_COLOR.Service;
  const total = Math.round(svc.price * (1 + svc.gst / 100));
  return (
    <div onClick={onView} style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px 18px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.05)", cursor: "pointer", position: "relative", transition: "box-shadow .15s, transform .15s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: cat.bg, color: cat.color }}>{svc.category}</span>
          {svc.popular && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "#FEF9C3", color: "#854D0E" }}>⭐ Popular</span>}
          {!svc.active && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "#F1F5F9", color: "#64748B" }}>Inactive</span>}
        </div>
        <div onClick={e => e.stopPropagation()}>
          <ActionDropdown onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.h1, marginBottom: 4 }}>{svc.name}</div>
      <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 10, fontFamily: FONTS.mono }}>{svc.id}</div>
      <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.55, marginBottom: 12, minHeight: 36 }}>{svc.description}</div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: COLORS.muted }}>❄️ <strong style={{ color: COLORS.h2 }}>{svc.acType}</strong></div>
        <div style={{ fontSize: 11, color: COLORS.muted }}>⏱ <strong style={{ color: COLORS.h2 }}>{svc.duration}</strong></div>
        <div style={{ fontSize: 11, color: COLORS.muted }}>🛡 <strong style={{ color: COLORS.h2 }}>{svc.warranty}</strong></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.faint }}>Base price</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono }}>₹{Number(svc.price).toLocaleString()}</div>
          <div style={{ fontSize: 10, color: COLORS.faint }}>+{svc.gst}% GST = ₹{total.toLocaleString()}</div>
        </div>
        <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ padding: "6px 14px", borderRadius: 7, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Edit</button>
      </div>
    </div>
  );
};

// ─── Add New Service Modal (used ONLY for new services) ───────────────────────
const ServiceFormModal = ({ onSave, onClose }) => {
  const [form, setForm]         = useState({ ...BLANK });
  const [checklistInput, setCI] = useState("");
  const [toolInput, setTI]      = useState("");
  const [tab, setTab]           = useState("basic");

  const set    = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const toggle = (key) => () => setForm(p => ({ ...p, [key]: !p[key] }));

  const addChecklist    = () => { if (!checklistInput.trim()) return; setForm(p => ({ ...p, checklist: [...p.checklist, checklistInput.trim()] })); setCI(""); };
  const removeChecklist = (i) => setForm(p => ({ ...p, checklist: p.checklist.filter((_, j) => j !== i) }));
  const addTool         = () => { if (!toolInput.trim()) return; setForm(p => ({ ...p, tools: [...p.tools, toolInput.trim()] })); setTI(""); };
  const removeTool      = (i) => setForm(p => ({ ...p, tools: p.tools.filter((_, j) => j !== i) }));

  const fStyle = iStyle();
  const label  = (txt) => <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: "uppercase", letterSpacing: .5, marginBottom: 5 }}>{txt}</div>;
  const tabBtn = (key, txt) => (
    <button type="button" onClick={() => setTab(key)} style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", background: tab === key ? COLORS.brand : "transparent", color: tab === key ? "white" : COLORS.muted, border: `1px solid ${tab === key ? COLORS.brand : COLORS.border}` }}>{txt}</button>
  );
  const total = form.price ? Math.round(Number(form.price) * (1 + Number(form.gst) / 100)) : 0;

  const suggestedSteps = { Installation: ["Site inspection","Bracket installation","Pipe routing","Electrical connection","Vacuum & leak test","Gas charging","Test run","Customer demo & sign-off"], Service: ["Check error codes","Clean air filter","Wash indoor coil","Flush drain pipe","Check refrigerant pressure","Inspect wiring","Test thermostat","Performance test"], Repair: ["Diagnose fault","Quote customer","Source parts","Repair / replace","Test operation","Log parts used","Customer sign-off"], AMC: ["Schedule visit","Full service","Check all units","Log readings","Update AMC card","Next visit date"] };
  const commonTools = ["Manifold gauge set","Vacuum pump","Leak detector","Digital thermometer","Clamp meter","Drill machine","Pipe bender","Fin comb","Pressure washer","R-32 cylinder","R-410A cylinder","Wire stripper","Torque wrench","Spanner set","Insulation tape"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: COLORS.white, borderRadius: 16, width: "min(680px,100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.2)", overflow: "hidden" }}>
        {/* Modal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>Add New Service</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>Fill in the service details for your catalogue</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: "pointer", fontSize: 16, color: COLORS.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "12px 22px", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
          {tabBtn("basic",     "📋 Basic Info")}
          {tabBtn("checklist", `✅ Checklist (${form.checklist.length})`)}
          {tabBtn("tools",     `🔧 Tools (${form.tools.length})`)}
        </div>
        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>
          {tab === "basic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
                <div>{label("Service Name *")}<input value={form.name} onChange={set("name")} placeholder="e.g. AC Installation – Split" style={fStyle} /></div>
                <div>{label("Service ID")}<input value={form.id} onChange={set("id")} placeholder="Auto / SVC-007" style={fStyle} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>{label("Category *")}<select value={form.category} onChange={set("category")} style={fStyle}>{["Installation","Service","Repair","AMC"].map(c => <option key={c}>{c}</option>)}</select></div>
                <div>{label("AC Type")}<select value={form.acType} onChange={set("acType")} style={fStyle}>{["All Types","Split AC","Cassette AC","Window AC","Inverter Split","Ductable AC","Tower AC"].map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div>{label("Description")}<textarea value={form.description} onChange={set("description")} rows={3} placeholder="Brief description..." style={{ ...fStyle, resize: "vertical", lineHeight: 1.5 }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr", gap: 12 }}>
                <div>{label("Base Price (₹) *")}<input type="number" value={form.price} onChange={set("price")} placeholder="2500" style={fStyle} /></div>
                <div>{label("GST %")}<select value={form.gst} onChange={set("gst")} style={fStyle}>{[0,5,12,18,28].map(g => <option key={g} value={g}>{g}%</option>)}</select></div>
                <div>{label("Total (incl. GST)")}<div style={{ padding: "8px 11px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: "#F0FDF4", fontSize: 14, fontWeight: 800, color: "#15803D", fontFamily: FONTS.mono }}>₹{total.toLocaleString()}</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>{label("Duration")}<input value={form.duration} onChange={set("duration")} placeholder="e.g. 2-3 hrs" style={fStyle} /></div>
                <div>{label("Warranty / Validity")}<input value={form.warranty} onChange={set("warranty")} placeholder="e.g. 90 Days" style={fStyle} /></div>
              </div>
              <div>{label("What's Included")}<textarea value={form.includes} onChange={set("includes")} rows={2} placeholder="Filter cleaning, coil wash..." style={{ ...fStyle, resize: "vertical", lineHeight: 1.5 }} /></div>
              <div style={{ display: "flex", gap: 20 }}>
                {[["active","Active (visible)"],["popular","Mark as Popular ⭐"]].map(([key, lbl]) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: COLORS.body }}>
                    <div onClick={toggle(key)} style={{ width: 38, height: 22, borderRadius: 99, background: form[key] ? COLORS.brand : "#CBD5E1", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: form[key] ? 18 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                    </div>
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === "checklist" && (
            <div>
              <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 14 }}>Define the step-by-step checklist technicians must complete.</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  value={checklistInput}
                  onChange={e => setCI(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addChecklist(); } }}
                  placeholder="Add checklist step… (press Enter)"
                  style={{ ...fStyle, flex: 1 }}
                />
                <button type="button" onClick={addChecklist} style={{ padding: "8px 16px", borderRadius: 8, background: COLORS.brand, color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>+ Add</button>
              </div>
              {form.checklist.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: COLORS.faint, fontSize: 13 }}>No steps yet.</div>}
              {form.checklist.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: i % 2 === 0 ? "#FAFAFA" : COLORS.white, border: `1px solid ${COLORS.border}`, marginBottom: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: `${COLORS.brand}15`, color: COLORS.brand, fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, color: COLORS.h2 }}>{step}</span>
                  <button type="button" onClick={() => removeChecklist(i)} style={{ padding: "3px 7px", borderRadius: 5, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>
              ))}
              <div style={{ marginTop: 16, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 8 }}>✅ Suggested steps for {form.category}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(suggestedSteps[form.category] || []).map(s => (
                    <button type="button" key={s}
                      onClick={() => setForm(p => ({ ...p, checklist: p.checklist.includes(s) ? p.checklist : [...p.checklist, s] }))}
                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: form.checklist.includes(s) ? "#BBF7D0" : "white", border: "1px solid #BBF7D0", color: "#15803D", cursor: "pointer", fontWeight: form.checklist.includes(s) ? 700 : 400 }}>
                      {form.checklist.includes(s) ? "✓ " : "+ "}{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "tools" && (
            <div>
              <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 14 }}>List the tools and equipment required for this service.</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  value={toolInput}
                  onChange={e => setTI(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTool(); } }}
                  placeholder="Add tool… (press Enter)"
                  style={{ ...fStyle, flex: 1 }}
                />
                <button type="button" onClick={addTool} style={{ padding: "8px 16px", borderRadius: 8, background: COLORS.brand, color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>+ Add</button>
              </div>
              {form.tools.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: COLORS.faint, fontSize: 13 }}>No tools added yet.</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {form.tools.map((tool, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 10px", borderRadius: 7, background: "#F1F5F9", border: `1px solid ${COLORS.border}`, color: COLORS.h2 }}>
                    🔧 {tool}
                    <button type="button" onClick={() => removeTool(i)} style={{ border: "none", background: "none", color: "#94A3B8", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#C2410C", marginBottom: 8 }}>🔧 Common AC service tools</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {commonTools.map(t => (
                    <button type="button" key={t}
                      onClick={() => setForm(p => ({ ...p, tools: p.tools.includes(t) ? p.tools : [...p.tools, t] }))}
                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: form.tools.includes(t) ? "#FED7AA" : "white", border: "1px solid #FED7AA", color: "#C2410C", cursor: "pointer", fontWeight: form.tools.includes(t) ? 700 : 400 }}>
                      {form.tools.includes(t) ? "✓ " : "+ "}{t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: `1px solid ${COLORS.border}`, flexShrink: 0, background: "#FAFAFA" }}>
          <button type="button" onClick={onClose} style={{ padding: "9px 22px", borderRadius: 9, border: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.white, color: COLORS.body }}>Cancel</button>
          <button type="button" onClick={() => onSave(form)} style={{ padding: "9px 26px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", boxShadow: `0 4px 12px ${COLORS.brand}40` }}>
            ✓ Add Service
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ServiceEditView — inline edit (used when Edit is clicked) ────────────────
const ServiceEditView = ({ svc, onBack, onSave, onDelete }) => {
  const [form, setForm]         = useState({ ...svc });
  const [checklistInput, setCI] = useState("");
  const [toolInput, setTI]      = useState("");
  const [showJobSheet, setShowJobSheet] = useState(false);

  const set    = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const toggle = (key) => () => setForm(p => ({ ...p, [key]: !p[key] }));

  // ── Checklist handlers (fixed: type="button" prevents any form submit, explicit state update) ──
  const addChecklist = () => {
    const val = checklistInput.trim();
    if (!val) return;
    setForm(p => ({ ...p, checklist: [...p.checklist, val] }));
    setCI("");
  };
  const removeChecklist = (i) => setForm(p => ({ ...p, checklist: p.checklist.filter((_, j) => j !== i) }));

  // ── Tool handlers ─────────────────────────────────────────────────────────
  const addTool = () => {
    const val = toolInput.trim();
    if (!val) return;
    setForm(p => ({ ...p, tools: [...p.tools, val] }));
    setTI("");
  };
  const removeTool = (i) => setForm(p => ({ ...p, tools: p.tools.filter((_, j) => j !== i) }));

  const cat   = CAT_COLOR[form.category] || CAT_COLOR.Service;
  const total = form.price ? Math.round(Number(form.price) * (1 + Number(form.gst) / 100)) : 0;

  const fStyle = iStyle();
  const suggestedSteps = { Installation: ["Site inspection","Bracket installation","Pipe routing","Electrical connection","Vacuum & leak test","Gas charging","Test run","Customer demo & sign-off"], Service: ["Check error codes","Clean air filter","Wash indoor coil","Flush drain pipe","Check refrigerant pressure","Inspect wiring","Test thermostat","Performance test"], Repair: ["Diagnose fault","Quote customer","Source parts","Repair / replace","Test operation","Log parts used","Customer sign-off"], AMC: ["Schedule visit","Full service","Check all units","Log readings","Update AMC card","Next visit date"] };
  const commonTools = ["Manifold gauge set","Vacuum pump","Leak detector","Digital thermometer","Clamp meter","Drill machine","Pipe bender","Fin comb","Pressure washer","R-32 cylinder","R-410A cylinder","Wire stripper","Torque wrench","Spanner set","Insulation tape"];

  return (
    <>
      <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <span style={{ fontSize: 14, color: COLORS.muted }}>Services /</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.brand, fontFamily: FONTS.mono }}>{svc.id}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button type="button" onClick={onBack} style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.white, color: COLORS.body }}>Cancel</button>
            <button type="button" onClick={() => onDelete(svc.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #FECACA", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#FEF2F2", color: "#DC2626" }}>🗑</button>
            <button type="button" onClick={() => onSave(form)} style={{ padding: "7px 22px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", boxShadow: `0 3px 10px ${COLORS.brand}40` }}>✓ Save Changes</button>
          </div>
        </div>

        {/* Edit banner */}
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#92400E", display: "flex", alignItems: "center", gap: 8 }}>
          ✏️ Editing <strong>{svc.name}</strong> — changes won't be saved until you click <strong>Save Changes</strong>.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Main info card */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.brand}`, padding: 22, boxShadow: `0 0 0 3px ${COLORS.brand}15` }}>
              {/* Badges row */}
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                <select value={form.category} onChange={set("category")} style={{ ...fStyle, width: "auto", padding: "4px 10px" }}>
                  {["Installation","Service","Repair","AMC"].map(c => <option key={c}>{c}</option>)}
                </select>
                {[["active","Active"],["popular","⭐ Popular"]].map(([key, lbl]) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: COLORS.body }}>
                    <div onClick={toggle(key)} style={{ width: 34, height: 20, borderRadius: 99, background: form[key] ? COLORS.brand : "#CBD5E1", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: form[key] ? 16 : 2, transition: "left .2s" }} />
                    </div>
                    {lbl}
                  </label>
                ))}
              </div>

              {/* Name */}
              <div style={{ marginBottom: 12 }}>
                <FieldLabel>Service Name</FieldLabel>
                <input value={form.name} onChange={set("name")} style={{ ...fStyle, fontSize: 18, fontWeight: 700 }} />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>Description</FieldLabel>
                <textarea value={form.description} onChange={set("description")} rows={3} style={{ ...fStyle, resize: "vertical", lineHeight: 1.5 }} />
              </div>

              {/* AC Type / Duration / Warranty */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
                <div>
                  <FieldLabel>AC Type</FieldLabel>
                  <select value={form.acType} onChange={set("acType")} style={fStyle}>
                    {["All Types","Split AC","Cassette AC","Window AC","Inverter Split","Ductable AC","Tower AC"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Duration</FieldLabel>
                  <input value={form.duration} onChange={set("duration")} style={fStyle} />
                </div>
                <div>
                  <FieldLabel>Warranty</FieldLabel>
                  <input value={form.warranty} onChange={set("warranty")} style={fStyle} />
                </div>
              </div>

              {/* What's Included */}
              <div>
                <FieldLabel>What's Included</FieldLabel>
                <textarea value={form.includes} onChange={set("includes")} rows={2} style={{ ...fStyle, resize: "vertical", lineHeight: 1.5 }} />
              </div>
            </div>

            {/* ── Checklist card ── */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.brand}`, padding: 22, boxShadow: `0 0 0 3px ${COLORS.brand}15` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>
                ✅ Service Checklist <span style={{ fontWeight: 400, color: COLORS.faint, fontSize: 13 }}>({form.checklist.length} steps)</span>
              </div>

              {/* Add step row */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  value={checklistInput}
                  onChange={e => setCI(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addChecklist(); } }}
                  placeholder="Add step… (press Enter)"
                  style={{ ...fStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addChecklist}
                  style={{ padding: "7px 16px", borderRadius: 8, background: COLORS.brand, color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  + Add
                </button>
              </div>

              {form.checklist.length === 0 && (
                <div style={{ fontSize: 13, color: COLORS.faint, textAlign: "center", padding: "12px 0" }}>No steps yet. Add one above.</div>
              )}

              {form.checklist.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: `1px solid ${COLORS.border}22`, alignItems: "center" }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: `${COLORS.brand}12`, color: COLORS.brand, fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, color: COLORS.h2, lineHeight: 1.55 }}>{step}</span>
                  <button type="button" onClick={() => removeChecklist(i)} style={{ padding: "3px 7px", borderRadius: 5, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>✕</button>
                </div>
              ))}

              {/* Suggested steps */}
              {(suggestedSteps[form.category] || []).length > 0 && (
                <div style={{ marginTop: 14, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 8 }}>✅ Suggested for {form.category}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(suggestedSteps[form.category] || []).map(s => (
                      <button type="button" key={s}
                        onClick={() => setForm(p => ({ ...p, checklist: p.checklist.includes(s) ? p.checklist : [...p.checklist, s] }))}
                        style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: form.checklist.includes(s) ? "#BBF7D0" : "white", border: "1px solid #BBF7D0", color: "#15803D", cursor: "pointer", fontWeight: form.checklist.includes(s) ? 700 : 400 }}>
                        {form.checklist.includes(s) ? "✓ " : "+ "}{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Pricing card */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.brand}`, padding: "18px", boxShadow: `0 0 0 3px ${COLORS.brand}15` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Pricing</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <FieldLabel>Base Price (₹)</FieldLabel>
                  <input type="number" value={form.price} onChange={set("price")} style={{ ...fStyle, fontFamily: FONTS.mono }} />
                </div>
                <div>
                  <FieldLabel>GST %</FieldLabel>
                  <select value={form.gst} onChange={set("gst")} style={fStyle}>
                    {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}
                  </select>
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 2 }}>Total (incl. GST)</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#15803D", fontFamily: FONTS.mono }}>₹{total.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Tools card */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.brand}`, padding: "16px 18px", boxShadow: `0 0 0 3px ${COLORS.brand}15` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>🔧 Required Tools</div>

              {/* Add tool row */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input
                  value={toolInput}
                  onChange={e => setTI(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTool(); } }}
                  placeholder="Add tool… (Enter)"
                  style={{ ...fStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addTool}
                  style={{ padding: "6px 12px", borderRadius: 7, background: COLORS.brand, color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  +
                </button>
              </div>

              {form.tools.length === 0 && <div style={{ fontSize: 12, color: COLORS.faint, marginBottom: 8 }}>No tools added.</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: form.tools.length ? 10 : 0 }}>
                {form.tools.map((t, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "4px 9px", borderRadius: 6, background: "#FFF7ED", border: "1px solid #FED7AA", color: "#C2410C" }}>
                    {t}
                    <button type="button" onClick={() => removeTool(i)} style={{ border: "none", background: "none", color: "#C2410C", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>

              {/* Common tools suggestions */}
              <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C2410C", marginBottom: 6 }}>Quick add:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {commonTools.map(t => (
                    <button type="button" key={t}
                      onClick={() => setForm(p => ({ ...p, tools: p.tools.includes(t) ? p.tools : [...p.tools, t] }))}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: form.tools.includes(t) ? "#FED7AA" : "white", border: "1px solid #FED7AA", color: "#C2410C", cursor: "pointer", fontWeight: form.tools.includes(t) ? 700 : 400 }}>
                      {form.tools.includes(t) ? "✓" : "+"} {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save shortcut */}
            <button type="button" onClick={() => onSave(form)}
              style={{ padding: "11px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", boxShadow: `0 4px 12px ${COLORS.brand}40` }}>
              ✓ Save Changes
            </button>
            <button type="button" onClick={onBack}
              style={{ padding: "9px", borderRadius: 9, border: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.white, color: COLORS.body }}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      <PDFPreview
        open={showJobSheet}
        onClose={() => setShowJobSheet(false)}
        title={`Job Sheet — ${svc.name}`}
        filename={`job-sheet-${svc.id}`}
        template="service_job_sheet"
        data={svc}
      />
    </>
  );
};

// ─── ServiceDetail — view-only (no edit mode) ─────────────────────────────────
const ServiceDetail = ({ svc, onBack, onEdit }) => {
  const [showJobSheet, setShowJobSheet] = useState(false);
  const cat   = CAT_COLOR[svc.category] || CAT_COLOR.Service;
  const total = Math.round(svc.price * (1 + svc.gst / 100));

  return (
    <>
      <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <span style={{ fontSize: 14, color: COLORS.muted }}>Services /</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>{svc.name}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button type="button" onClick={onEdit} style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${COLORS.brand}`, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.brandL, color: COLORS.brand }}>✎ Edit</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: cat.bg, color: cat.color }}>{svc.category}</span>
                {svc.popular && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "#FEF9C3", color: "#854D0E" }}>⭐ Popular</span>}
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: svc.active ? "#F0FDF4" : "#F1F5F9", color: svc.active ? "#15803D" : "#64748B" }}>● {svc.active ? "Active" : "Inactive"}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.h1, marginBottom: 6 }}>{svc.name}</div>
              <div style={{ fontSize: 12, color: COLORS.faint, fontFamily: FONTS.mono, marginBottom: 12 }}>{svc.id}</div>
              <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.65, marginBottom: 18 }}>{svc.description}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
                {[["❄️ AC Type", svc.acType],["⏱ Duration", svc.duration],["🛡 Warranty", svc.warranty]].map(([k, v]) => (
                  <div key={k} style={{ background: "#F8FAFC", borderRadius: 9, padding: "12px 14px", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, marginBottom: 8 }}>What's Included</div>
                <div style={{ fontSize: 13, color: COLORS.body, lineHeight: 1.65, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: `1px solid ${COLORS.border}` }}>{svc.includes}</div>
              </div>
            </div>

            {svc.checklist.length > 0 && (
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>✅ Service Checklist ({svc.checklist.length} steps)</div>
                {svc.checklist.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: `${COLORS.brand}12`, color: COLORS.brand, fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: COLORS.h2, lineHeight: 1.55 }}>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Pricing</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono, marginBottom: 4 }}>₹{Number(svc.price).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 14 }}>Base price (ex-GST)</div>
              {[["GST",`${svc.gst}%`,`+₹${Math.round(svc.price * svc.gst / 100).toLocaleString()}`],["Total","",`₹${total.toLocaleString()}`]].map(([k, pct, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                  <span style={{ color: COLORS.muted }}>{k} {pct}</span>
                  <span style={{ fontWeight: 800, color: k === "Total" ? COLORS.brand : COLORS.h2, fontFamily: FONTS.mono }}>{v}</span>
                </div>
              ))}
            </div>

            {svc.tools.length > 0 && (
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>🔧 Required Tools</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {svc.tools.map(t => <span key={t} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 6, background: "#FFF7ED", border: "1px solid #FED7AA", color: "#C2410C" }}>{t}</span>)}
                </div>
              </div>
            )}

            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <button type="button" style={{ padding: "9px", borderRadius: 8, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📄 Use in Quotation</button>
                <button type="button" style={{ padding: "9px", borderRadius: 8, background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔧 Create Job from Service</button>
                <button type="button" onClick={() => setShowJobSheet(true)} style={{ padding: "9px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📋 Print Job Sheet</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PDFPreview
        open={showJobSheet}
        onClose={() => setShowJobSheet(false)}
        title={`Job Sheet — ${svc.name}`}
        filename={`job-sheet-${svc.id}`}
        template="service_job_sheet"
        data={svc}
      />
    </>
  );
};

// ─── ServicesPage ─────────────────────────────────────────────────────────────
const ServicesPage = ({ openModal }) => {
  const [services,      setServices]      = useState(INITIAL_SERVICES);
  const [viewMode,      setViewMode]      = useState("grid");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [showAddModal,  setShowAddModal]  = useState(false);   // Add modal only
  const [viewTarget,    setViewTarget]    = useState(null);    // { svc, mode: "view"|"edit" }
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  // ── Search + filters ──────────────────────────────────────────────────────
  const { q, setQ, activeFilters, setFilter, filtered: filteredBySearch } = useTableSearch(
    services, ['id', 'name', 'category', 'acType', 'description'], { category: '' }
  );
  const filtered = statusFilter
    ? filteredBySearch.filter(s => (statusFilter === 'Active') === s.active)
    : filteredBySearch;

  const rowsForExport = filtered.map(s => ({ ...s, totalAmt: Math.round(s.price * (1 + s.gst / 100)) }));

  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } = usePagination(filtered, 12);

  const { exportProps } = useExport({
    title: "Services Catalogue", filename: "cooltech-services", template: "generic_list",
    subtitle: `AC Services Platform · Services · ${filtered.length} records`, docId: "SVC-EXPORT",
    columns: SERVICE_COLUMNS, rows: rowsForExport, showTotals: true, totalColumns: ["price", "totalAmt"],
  });

  const handleAddSave = (form) => {
    const newId = `SVC-${String(services.length + 1).padStart(3, "0")}`;
    setServices(prev => [...prev, { ...form, id: form.id || newId }]);
    setShowAddModal(false);
  };

  const handleEditSave = (updated) => {
    setServices(prev => prev.map(s => s.id === updated.id ? { ...updated } : s));
    setViewTarget(null);
  };

  const handleDelete = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setDeleteTarget(null);
    if (viewTarget?.svc?.id === id) setViewTarget(null);
  };

  const active   = services.filter(s => s.active).length;
  const avgPrice = Math.round(services.reduce((s, x) => s + Number(x.price), 0) / services.length);
  const popular  = services.filter(s => s.popular).length;

  // ── Detail / Edit views ───────────────────────────────────────────────────
  if (viewTarget?.mode === "edit") {
    return (
      <ServiceEditView
        svc={viewTarget.svc}
        onBack={() => setViewTarget(null)}
        onSave={handleEditSave}
        onDelete={(id) => { setDeleteTarget(id); }}
      />
    );
  }

  if (viewTarget?.mode === "view") {
    return (
      <ServiceDetail
        svc={viewTarget.svc}
        onBack={() => setViewTarget(null)}
        onEdit={() => setViewTarget({ svc: viewTarget.svc, mode: "edit" })}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionHdr title="Services Catalogue" sub={`${services.length} services · manage your AC service offerings`} />
        <button type="button" onClick={() => setShowAddModal(true)}
          style={{ padding: "9px 22px", borderRadius: 9, background: `linear-gradient(135deg,#EA580C,#C2410C)`, color: "white", fontSize: 13, fontWeight: 700, border: "none", boxShadow: "0 3px 10px #EA580C40", cursor: "pointer" }}>
          + Add Service
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KCard label="Total Services" value={services.length} sub="in catalogue"     icon="🗂" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Active"         value={active}          sub="visible to staff"  icon="✅" iconBg="#F0FDF4" color="#15803D"      delay="1" />
        <KCard label="Popular"        value={popular}         sub="marked as popular" icon="⭐" iconBg="#FEFCE8" color="#B45309"      delay="2" />
        <KCard label="Avg Price"      value={`₹${avgPrice.toLocaleString()}`} sub="ex-GST" icon="💰" iconBg="#EFF6FF" color="#1D4ED8" delay="3" />
      </div>

      {/* Toolbar */}
      <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "12px 16px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
        <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, category, AC type…" />
        <FilterSelect value={activeFilters.category} onChange={val => setFilter("category", val)} options={CATEGORIES} allLabel="All Categories" />
        <FilterSelect value={statusFilter} onChange={val => setStatusFilter(val)} options={["Active", "Inactive"]} allLabel="All Statuses" />
        <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
        <div style={{display: "flex", gap: 1, background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: 3 }}>
          {[["grid","⊞ Grid"],["table","≡ Table"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setViewMode(k)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", background: viewMode === k ? COLORS.white : "transparent", color: viewMode === k ? COLORS.h1 : COLORS.muted, border: `1px solid ${viewMode === k ? COLORS.border : "transparent"}` }}>{l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.faint, fontSize: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>No services match your search.
        </div>
      )}

      {/* Grid view */}
      {viewMode === "grid" && filtered.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {paginated.map(svc => (
              <ServiceCard key={svc.id} svc={svc}
                onView={() => setViewTarget({ svc, mode: "view" })}
                onEdit={() => setViewTarget({ svc, mode: "edit" })}
                onDelete={() => setDeleteTarget(svc.id)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
              <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
            </div>
          )}
        </>
      )}

      {/* Table view */}
      {viewMode === "table" && filtered.length > 0 && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "clip" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <Thead cols={["ID","Service Name","Category","AC Type","Duration","Warranty","Price (ex-GST)","GST","Total","Status",""]} />
              <tbody>
                {paginated.map((s, i) => {
                  const cat = CAT_COLOR[s.category] || CAT_COLOR.Service;
                  const tot = Math.round(s.price * (1 + s.gst / 100));
                  return (
                    <tr key={s.id} className="row"
                      onClick={() => setViewTarget({ svc: s, mode: "view" })}
                      style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA", cursor: "pointer" }}>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, color: COLORS.brand }}>{s.id}</span></td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{s.name}</div>
                        {s.popular && <div style={{ fontSize: 10, color: "#B45309", fontWeight: 600 }}>⭐ Popular</div>}
                      </td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: cat.bg, color: cat.color }}>{s.category}</span></td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted }}>{s.acType}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted }}>{s.duration}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted }}>{s.warranty}</td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>₹{Number(s.price).toLocaleString()}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>{s.gst}%</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: COLORS.brand }}>₹{tot.toLocaleString()}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: s.active ? "#F0FDF4" : "#F1F5F9", color: s.active ? "#15803D" : "#64748B" }}>● {s.active ? "Active" : "Inactive"}</span></td>
                      <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                        <ActionDropdown
                          onView={()  => setViewTarget({ svc: s, mode: "view" })}
                          onEdit={()  => setViewTarget({ svc: s, mode: "edit" })}
                          onDelete={() => setDeleteTarget(s.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        </div>
      )}

      {/* Add modal — only for new services */}
      {showAddModal && (
        <ServiceFormModal
          onSave={handleAddSave}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        message="This service will be permanently removed from your catalogue."
      />
    </div>
  );
};

export default ServicesPage;