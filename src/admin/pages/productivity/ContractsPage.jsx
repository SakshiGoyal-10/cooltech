// ContractsPage.jsx
import { useState, useEffect } from 'react';
import { contractsApi } from '../../services/api';
import { contracts as initialContracts } from '../../data/mockData';
import { COLORS, FONTS } from '../../constants/tokens';

// ─── Contract status colour map ───────────────────────────────────────────────
const conStatus = {
  active:            { label: 'Active',            bg: '#F0FDF4', color: '#166534', dot: '#22C55E' },
  draft:             { label: 'Draft',             bg: '#F8FAFC', color: '#475569', dot: '#94A3B8' },
  pending_signature: { label: 'Pending Signature', bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  expired:           { label: 'Expired',           bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  inactive:          { label: 'Inactive',          bg: '#F8FAFC', color: '#64748B', dot: '#94A3B8' },
};
import { KCard, Thead } from '../../components/ui/Cards';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import EditableDetailView from '../../components/ui/EditableDetailView';
import PDFPreview from '../../components/layout/PDFPreview';
import { useTableSearch } from '../..//hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';

// ─── Column config for export ─────────────────────────────────────────────────
const CONTRACT_COLUMNS = [
  { label: "Contract ID", key: "id",        width: 13, tdStyle: { fontFamily: "monospace", fontWeight: 700, color: COLORS.brand, fontSize: 11 } },
  { label: "Title",       key: "title",      width: 28, tdStyle: { fontWeight: 600 } },
  { label: "Customer",    key: "customer",   width: 18, tdStyle: { fontSize: 12 } },
  { label: "Type",        key: "type",       width: 14, tdStyle: { fontSize: 12 } },
  { label: "Value (₹)",   key: "value",      width: 12, format: (v) => v, tdStyle: { fontFamily: "monospace", fontWeight: 700, color: COLORS.brand } },
  { label: "Status",      key: "status",     width: 12, format: (v) => v, tdStyle: { fontSize: 12 } },
  { label: "Signed",      key: "signed",     width: 8,  format: (v) => (v ? "Yes" : "No"), tdStyle: { fontSize: 12 } },
  { label: "Auto-Renew",  key: "autoRenew",  width: 10, format: (v) => (v ? "Yes" : "No"), tdStyle: { fontSize: 12 } },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FieldLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint, textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>
    {children}
  </div>
);

const FieldValue = ({ children }) => (
  <div style={{ fontSize: 13, color: COLORS.h2 }}>{children || "—"}</div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.h1, borderBottom: `2px solid ${COLORS.brand}22`, paddingBottom: 7, marginBottom: 14, marginTop: 20, letterSpacing: .3, textTransform: "uppercase" }}>
    {children}
  </div>
);

const iStyle = (extra = {}) => ({
  padding: "6px 10px", borderRadius: 7, border: `1.5px solid ${COLORS.border}`,
  fontSize: 13, color: COLORS.h2, background: "#FAFAFA",
  fontFamily: FONTS.sans, outline: "none", width: "100%", boxSizing: "border-box", ...extra,
});

// ─── ContractDetail ───────────────────────────────────────────────────────────
const ContractDetail = ({ contract, onBack, onSave, onDelete, openModal, initialEditMode }) => {
  const [showPDF, setShowPDF] = useState(false);

  const fields = [
    { key: "status" }, { key: "title" }, { key: "customer" }, { key: "contact" },
    { key: "phone" }, { key: "officePhone" }, { key: "email" }, { key: "type" }, { key: "plan" },
    { key: "startDate" }, { key: "endDate" }, { key: "autoRenew" }, { key: "noDueDate" },
    { key: "clauses" }, { key: "linkedAMC" }, { key: "linkedLead" }, { key: "terms" },
    { key: "value" }, { key: "currency" }, { key: "paymentTerms" }, { key: "visitsPerYear" },
    { key: "acUnitsCovered" }, { key: "acBrand" }, { key: "acCapacity" },
    { key: "assignedTechnician" },
    // Address fields (matching AddressFields prefix "con_")
    { key: "con_street" }, { key: "con_city" }, { key: "con_state" },
    { key: "con_pincode" }, { key: "con_country" },
    { key: "altAddress" }, { key: "internalNotes" },
  ];

  const signatories = (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Signatories</div>
      {contract.signed
        ? contract.signatories.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0", marginBottom: 6 }}>
              <span style={{ color: "#16A34A", fontSize: 16 }}>✓</span>
              <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>{s}</span>
            </div>
          ))
        : contract.signatories.length === 0
          ? <div style={{ padding: "14px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A", fontSize: 13, color: "#92400E" }}>📋 Contract not yet sent for signature.</div>
          : contract.signatories.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: s.includes("PENDING") ? "#FFFBEB" : "#F0FDF4", borderRadius: 8, border: `1px solid ${s.includes("PENDING") ? "#FDE68A" : "#BBF7D0"}`, marginBottom: 6 }}>
                <span style={{ color: s.includes("PENDING") ? "#F59E0B" : "#16A34A", fontSize: 16 }}>{s.includes("PENDING") ? "⏳" : "✓"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.includes("PENDING") ? "#92400E" : "#166534" }}>{s}</span>
              </div>
            ))
      }
    </div>
  );

  const actions = (openModal) => (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {!contract.signed && (
        <button className="btn" onClick={() => openModal("report", { title: "Send for E-Signature", format: "Send" })}
          style={{ flex: 1, padding: "11px", borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700, border: "none" }}>
          ✉ Send for E-Signature
        </button>
      )}
      <button className="btn" onClick={() => setShowPDF(true)}
        style={{ padding: "11px 16px", borderRadius: 9, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", fontSize: 13, fontWeight: 700 }}>
        📥 Download PDF
      </button>
      {contract.status === "active" && (
        <button className="btn" onClick={() => openModal("schedule_amc")}
          style={{ padding: "11px 16px", borderRadius: 9, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontSize: 13, fontWeight: 700 }}>
          📅 Schedule Visit
        </button>
      )}
    </div>
  );

  return (
    <>
      <EditableDetailView
        id={contract.id}
        breadcrumb="Contracts"
        onBack={onBack}
        fields={fields}
        data={contract}
        initialEditMode={initialEditMode}
        onSave={onSave}
        onDelete={() => onDelete(contract.id)}
      >
        {({ editMode, editData, setEditData }) => {
          const val  = (key) => editData[key] ?? contract[key] ?? "";
          const setK = (key) => (e) => setEditData(p => ({ ...p, [key]: e.target.value }));
          const st   = conStatus[editMode ? val("status") : contract.status] || conStatus.draft;

          // ── Sidebar ──────────────────────────────────────────────────────
          const sidebar = (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Contact Card */}
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)", transition: "border-color .2s" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>
                  Contact
                  {editMode && <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.brand, marginLeft: 8 }}>← editable</span>}
                </div>
                {editMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[["Contact Name","contact"],["Phone","phone"],["Office Phone","officePhone"],["Email","email"]].map(([label, key]) => (
                      <div key={key}>
                        <FieldLabel>{label}</FieldLabel>
                        <input value={val(key)} onChange={setK(key)}
                          style={{ padding: "6px 10px", borderRadius: 7, border: `1.5px solid ${COLORS.border}`, fontSize: 12, color: COLORS.h2, background: "#FAFAFA", fontFamily: FONTS.sans, width: "100%", outline: "none" }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  [["Name", contract.contact], ["Phone", contract.phone], ["Office", contract.officePhone], ["Email", contract.email]].map(([k, v]) => v ? (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <span style={{ fontSize: 11, color: COLORS.faint }}>{k}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{v}</span>
                    </div>
                  ) : null)
                )}
              </div>

              {/* Financial Summary */}
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Financial</div>
                {[
                  ["Currency",      contract.currency || "INR (₹)"],
                  ["Payment Terms", contract.paymentTerms || "—"],
                  ["Auto-Renew",    contract.autoRenew ? "Yes" : "No"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 11, color: COLORS.faint }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* AC Equipment Summary */}
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>AC Equipment</div>
                {[
                  ["Units Covered",  contract.acUnitsCovered],
                  ["Brand / Model",  contract.acBrand],
                  ["Capacity",       contract.acCapacity],
                  ["Visits / Year",  contract.visitsPerYear],
                  ["Technician",     contract.assignedTechnician],
                ].map(([k, v]) => v ? (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 11, color: COLORS.faint }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{v}</span>
                  </div>
                ) : null)}
              </div>

              {/* Linked Lead */}
              {contract.linkedLead && (
                <div style={{ background: "#FFF7ED", borderRadius: 14, border: "1px solid #FED7AA", padding: "14px 16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.brandD, marginBottom: 6 }}>Linked Lead</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.h1 }}>{contract.linkedLead}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>CRM lead that generated this contract</div>
                </div>
              )}

              {/* Quick Actions */}
              {!editMode && (
                <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, marginBottom: 8 }}>Quick Actions</div>
                  {["Clone Contract", "Add Clause", "View Audit Trail"].map(a => (
                    <button key={a} className="ib"
                      onClick={() => openModal("report", { title: a, format: "Action" })}
                      style={{ width: "100%", padding: "9px 12px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: COLORS.body, borderRadius: 7, marginBottom: 2 }}>
                      › {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );

          // ── Main panel ───────────────────────────────────────────────────
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`, padding: 24, boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : "0 1px 4px rgba(0,0,0,.05)", transition: "all .2s" }}>

                {/* ── Header: status / title / value ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ flex: 1, marginRight: 16 }}>
                    {editMode ? (
                      <select value={val("status")} onChange={setK("status")}
                        style={{ ...iStyle(), width: "auto", marginBottom: 8, fontSize: 12 }}>
                        {Object.entries(conStatus).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="badge" style={{ background: st.bg, color: st.color, marginBottom: 8, display: "inline-block" }}>{st.label}</span>
                    )}

                    {editMode
                      ? <input value={val("title")} onChange={setK("title")} style={iStyle({ fontSize: 18, fontWeight: 800, marginBottom: 6 })} />
                      : <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.h1, lineHeight: 1.3 }}>{contract.title}</div>
                    }

                    {editMode ? (
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <input value={val("customer")} onChange={setK("customer")} placeholder="Customer" style={iStyle({ fontSize: 12 })} />
                        <input value={val("contact")}  onChange={setK("contact")}  placeholder="Contact"  style={iStyle({ fontSize: 12 })} />
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>{contract.customer} · {contract.contact}</div>
                    )}
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 4 }}>Contract Value</div>
                    {editMode
                      ? <input value={val("value")} onChange={setK("value")} type="number" style={iStyle({ fontSize: 22, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono, textAlign: "right", width: 160 })} />
                      : <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono }}>₹{contract.value?.toLocaleString()}</div>
                    }
                  </div>
                </div>

                {/* ── Section: Contract Details ── */}
                <SectionTitle>Contract Details</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 4 }}>
                  {editMode ? (
                    <>
                      {[["Type","type"],["Plan","plan"],["Start Date","startDate"],["End Date","endDate"],["Linked AMC","linkedAMC"],["Linked Lead","linkedLead"]].map(([label, key]) => (
                        <div key={key}>
                          <FieldLabel>{label}</FieldLabel>
                          <input value={val(key)} onChange={setK(key)} style={iStyle({ fontSize: 12 })} />
                        </div>
                      ))}
                      <div>
                        <FieldLabel>Clauses</FieldLabel>
                        <input value={val("clauses")} onChange={setK("clauses")} type="number" style={iStyle({ fontSize: 12 })} />
                      </div>
                      <div>
                        <FieldLabel>Auto-Renew</FieldLabel>
                        <select value={val("autoRenew") === true || val("autoRenew") === "yes" ? "yes" : "no"}
                          onChange={e => setEditData(p => ({ ...p, autoRenew: e.target.value === "yes" }))}
                          style={iStyle({ fontSize: 12 })}>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {[
                        ["Type",        contract.type],
                        ["Plan",        contract.plan],
                        ["Start",       contract.startDate || "—"],
                        ["End",         contract.endDate || "—"],
                        ["Auto-Renew",  contract.autoRenew ? "Yes" : "No"],
                        ["Clauses",     contract.clauses ? `${contract.clauses} clauses` : "—"],
                        ["Linked AMC",  contract.linkedAMC || "—"],
                        ["Linked Lead", contract.linkedLead || "—"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <FieldLabel>{k}</FieldLabel>
                          <FieldValue>{v}</FieldValue>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* ── Section: Financial Details ── */}
                <SectionTitle>Financial Details</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 4 }}>
                  {editMode ? (
                    <>
                      <div>
                        <FieldLabel>Currency</FieldLabel>
                        <select value={val("currency") || "INR (₹)"} onChange={setK("currency")} style={iStyle({ fontSize: 12 })}>
                          {["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "AED (د.إ)"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel>Payment Terms</FieldLabel>
                        <select value={val("paymentTerms")} onChange={setK("paymentTerms")} style={iStyle({ fontSize: 12 })}>
                          {["Upfront / Full Payment","Quarterly","Half-Yearly","Monthly","On Completion","Net 15","Net 30"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel>Visits / Year</FieldLabel>
                        <input value={val("visitsPerYear")} onChange={setK("visitsPerYear")} type="number" style={iStyle({ fontSize: 12 })} />
                      </div>
                    </>
                  ) : (
                    [
                      ["Currency",      contract.currency || "INR (₹)"],
                      ["Payment Terms", contract.paymentTerms || "—"],
                      ["Visits / Year", contract.visitsPerYear || "—"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <FieldLabel>{k}</FieldLabel>
                        <FieldValue>{v}</FieldValue>
                      </div>
                    ))
                  )}
                </div>

                {/* ── Section: AC Equipment ── */}
                <SectionTitle>AC Equipment</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 4 }}>
                  {editMode ? (
                    <>
                      <div>
                        <FieldLabel>Units Covered</FieldLabel>
                        <input value={val("acUnitsCovered")} onChange={setK("acUnitsCovered")} type="number" style={iStyle({ fontSize: 12 })} />
                      </div>
                      <div>
                        <FieldLabel>Brand / Model</FieldLabel>
                        <input value={val("acBrand")} onChange={setK("acBrand")} placeholder="e.g. Daikin, Voltas" style={iStyle({ fontSize: 12 })} />
                      </div>
                      <div>
                        <FieldLabel>Capacity</FieldLabel>
                        <select value={val("acCapacity")} onChange={setK("acCapacity")} style={iStyle({ fontSize: 12 })}>
                          {["Any / Mixed","0.75 T","1.0 T","1.5 T","2.0 T","2.5 T +","VRF / Cassette"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <FieldLabel>Assigned Technician</FieldLabel>
                        <input value={val("assignedTechnician")} onChange={setK("assignedTechnician")} style={iStyle({ fontSize: 12 })} />
                      </div>
                    </>
                  ) : (
                    [
                      ["Units Covered",  contract.acUnitsCovered],
                      ["Brand / Model",  contract.acBrand],
                      ["Capacity",       contract.acCapacity],
                      ["Technician",     contract.assignedTechnician],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <FieldLabel>{k}</FieldLabel>
                        <FieldValue>{v}</FieldValue>
                      </div>
                    ))
                  )}
                </div>

                {/* ── Section: Client Address ── */}
                <SectionTitle>Client Address</SectionTitle>
                <div style={{ marginBottom: 20 }}>
                  {/* Street */}
                  <div style={{ marginBottom: 12 }}>
                    <FieldLabel>Street / Flat / Building</FieldLabel>
                    {editMode ? (
                      <input value={val("con_street")} onChange={setK("con_street")}
                        placeholder="e.g. Flat 4B, Green Apartments, SG Road"
                        style={iStyle({ fontSize: 12 })} />
                    ) : (
                      <FieldValue>{contract.con_street}</FieldValue>
                    )}
                  </div>

                  {/* City / State / Pincode / Country */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                    {editMode ? (
                      <>
                        {[
                          ["City",    "con_city",    "e.g. Ahmedabad"],
                          ["State",   "con_state",   "e.g. Gujarat"],
                          ["Pincode", "con_pincode", "380001"],
                          ["Country", "con_country", "India"],
                        ].map(([label, key, placeholder]) => (
                          <div key={key}>
                            <FieldLabel>{label}</FieldLabel>
                            <input value={val(key)} onChange={setK(key)} placeholder={placeholder}
                              style={iStyle({ fontSize: 12 })} />
                          </div>
                        ))}
                      </>
                    ) : (
                      [
                        ["City",    contract.con_city],
                        ["State",   contract.con_state],
                        ["Pincode", contract.con_pincode],
                        ["Country", contract.con_country],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <FieldLabel>{k}</FieldLabel>
                          <FieldValue>{v}</FieldValue>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Alternate / Site Address */}
                  <div style={{ marginTop: 12 }}>
                    <FieldLabel>Alternate / Site Address</FieldLabel>
                    {editMode ? (
                      <textarea value={val("altAddress")} onChange={setK("altAddress")} rows={2}
                        placeholder="Site address if different from billing…"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1.5px solid ${COLORS.border}`, fontSize: 12, fontFamily: FONTS.sans, color: COLORS.h2, background: "#FAFAFA", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                    ) : (
                      <FieldValue>{contract.altAddress}</FieldValue>
                    )}
                  </div>
                </div>

                {/* ── Section: Internal Notes ── */}
                {/* {(contract.internalNotes || editMode) && (
                  <>
                    <SectionTitle>Internal Notes</SectionTitle>
                    <div style={{ marginBottom: 20 }}>
                      {editMode ? (
                        <textarea value={val("internalNotes")} onChange={setK("internalNotes")} rows={3}
                          placeholder="Internal notes, special instructions for the team…"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1.5px solid ${COLORS.border}`, fontSize: 12, fontFamily: FONTS.sans, color: COLORS.h2, background: "#FAFAFA", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                      ) : (
                        <div style={{ fontSize: 13, color: COLORS.h2, lineHeight: 1.6 }}>{contract.internalNotes}</div>
                      )}
                    </div>
                  </>
                )} */}

                {/* ── Section: Key Terms ── */}
                <SectionTitle>Key Terms</SectionTitle>
                <div style={{ background: editMode ? "#FAFAFA" : "#F9FAFB", borderRadius: 10, padding: "14px 16px", marginBottom: 20, border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`, transition: "border-color .2s" }}>
                  {editMode ? (
                    <textarea value={val("terms")} onChange={setK("terms")}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1.5px solid ${COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h2, background: COLORS.white, resize: "vertical", minHeight: 70, outline: "none", boxSizing: "border-box" }} />
                  ) : (
                    <div style={{ fontSize: 13, color: COLORS.body, lineHeight: 1.7 }}>{contract.terms || "—"}</div>
                  )}
                </div>

                {/* ── Signatories + Actions (view mode only) ── */}
                {!editMode && (
                  <>
                    {signatories}
                    {actions(openModal)}
                  </>
                )}
              </div>

              {sidebar}
            </div>
          );
        }}
      </EditableDetailView>

      <PDFPreview
        open={showPDF}
        onClose={() => setShowPDF(false)}
        title={contract.id}
        filename={`contract-${contract.id}`}
        template="contract"
        data={contract}
      />
    </>
  );
};

// ─── ContractsPage ────────────────────────────────────────────────────────────
const ContractsPage = ({ openModal }) => {
  const [open, setOpen]                       = useState(null);
  const [contracts, setContracts]             = useState(initialContracts);
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [initialEditMode, setInitialEditMode] = useState(false);

  const contract    = open ? contracts.find(c => c.id === open) : null;
  const totalActive = [].filter(c => c.status === "active").reduce((s, c) => s + c.value, 0);

  const {
    q, setQ, activeFilters, setFilter, filtered: filteredContracts,
  } = useTableSearch(
    contracts,
    ['id', 'title', 'customer', 'contact', 'type', 'status'],
    { type: '', status: '' }
  );

  const {
    paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total,
  } = usePagination(filteredContracts, 10);

  const { exportProps } = useExport({
    title:        "Contracts",
    filename:     "cooltech-contracts",
    template:     "generic_list",
    subtitle:     `AC Services Platform · Contracts · ${filteredContracts.length} records`,
    docId:        "CON-EXPORT",
    columns:      CONTRACT_COLUMNS,
    rows:         filteredContracts,
    showTotals:   true,
    totalColumns: ["value"],
  });

  const handleSave   = (updated) => setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
  const handleDelete = (id)      => { setContracts(prev => prev.filter(c => c.id !== id)); setOpen(null); };
  const handleBack   = ()        => { setOpen(null); setInitialEditMode(false); };

  if (contract) {
    return (
      <ContractDetail
        contract={contract}
        onBack={handleBack}
        onSave={handleSave}
        onDelete={handleDelete}
        openModal={openModal}
        initialEditMode={initialEditMode}
      />
    );
  }

  return (
    <div className="fu">

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Contracts</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
            {total} of {contracts.length} contracts
          </div>
        </div>
        <button className="btn" onClick={() => openModal("new_amc")}
          style={{ padding: "9px 20px", borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}>
          + New Contract
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Contracts",   value: contracts.length,                                                   icon: "📄", color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Active Value",      value: `₹${(totalActive / 1000).toFixed(0)}K`,                            icon: "💰", color: COLORS.brand, bg: COLORS.brandL },
          { label: "Pending Signature", value: contracts.filter(c => c.status === "pending_signature").length,     icon: "✍",  color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Auto-Renewing",     value: contracts.filter(c => c.autoRenew && c.status === "active").length, icon: "🔄", color: "#22C55E", bg: "#F0FDF4" },
        ].map(s => <KCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} iconBg={s.bg} />)}
      </div>

      {/* Table */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "clip", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>

        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by title, customer, type…" />
          <FilterSelect value={activeFilters.type} onChange={val => setFilter("type", val)}
            options={["AMC", "Service", "Installation", "Maintenance", "Comprehensive"]} allLabel="All Types" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter("status", val)}
            options={["active", "draft", "expired", "pending_signature", "terminated"]} allLabel="All Statuses" />
          <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <Thead cols={["Contract ID", "Title", "Customer", "Type", "Value", "Status", "Signed", "Auto-Renew", ""]} />
            <tbody>
              {paginated.map((c, i) => {
                const st = conStatus[c.status] || conStatus.draft;
                return (
                  <tr key={c.id} className="row" onClick={() => { setInitialEditMode(false); setOpen(c.id); }}
                    style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.brand }}>{c.id}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, maxWidth: 240 }}>{c.title}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 12, color: COLORS.body }}>{c.customer}</div>
                      <div style={{ fontSize: 11, color: COLORS.faint }}>{c.contact}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, background: "#F5F3FF", color: "#5B21B6", padding: "3px 8px", borderRadius: 99 }}>{c.type}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800, color: COLORS.brand }}>₹{c.value.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 15 }}>{c.signed ? "✅" : "⏳"}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: c.autoRenew ? "#16A34A" : "#64748B" }}>{c.autoRenew ? "Yes" : "No"}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                      <ActionDropdown
                        onView={()   => { setInitialEditMode(false); setOpen(c.id); }}
                        onEdit={()   => { setInitialEditMode(true);  setOpen(c.id); }}
                        onDelete={() => setDeleteTarget(c.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page} totalPages={totalPages} setPage={setPage}
          pageSize={pageSize} setPageSize={setPageSize}
          from={from} to={to} total={total}
        />
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => { handleDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        message="This contract will be permanently removed."
      />
    </div>
  );
};

export default ContractsPage;