import logoImg      from '../../assets/logo.png';
import signatureImg from '../../assets/signature.png';

// ─── Shared CoolTech header ───────────────────────────────────────────────────
const Header = ({ title, id, meta = [] }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottom: "2px solid #F97316" }}>
    <div>
      <div style={{ fontSize: 20, fontWeight: 900, color: "#F97316" }}>❄ CoolTech AC Services</div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>GSTIN: 29AABCT1234A1Z5 · +91 98765 43210</div>
      <div style={{ fontSize: 11, color: "#888" }}>Bengaluru, Karnataka · cooltech@services.com</div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>{title}</div>
      {id && <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#F97316", marginTop: 4 }}>{id}</div>}
      {meta.map(([k, v, red]) => (
        <div key={k} style={{ fontSize: 11, color: red ? "#DC2626" : "#888", marginTop: 3 }}>{k}{k ? ': ' : ''}{v}</div>
      ))}
    </div>
  </div>
);

const Footer = ({ text = "Thank you for your business · CoolTech AC Services · cooltech@services.com" }) => (
  <div style={{ marginTop: 36, paddingTop: 14, borderTop: "1px solid #E5E7EB", fontSize: 11, color: "#aaa", textAlign: "center" }}>{text}</div>
);

const InfoRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F3F4F6", fontSize: 12 }}>
    <span style={{ color: "#888" }}>{label}</span>
    <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{value}</span>
  </div>
);

// ─── Shared Alisha constants ──────────────────────────────────────────────────
const VENDOR = {
  company: "Alisha Engineering",
  address: "L.I.G-II -164 G.I.D.C HOUSING BOARD NEAR CHHOTALAL CHAR RASTA BESIDE SWAMINARAYAN MANDIR ODAHAV AHMEDABAD-382415",
  contact: "Vakil Yadav",
  phone:   "9724763909",
  email:   "alishaengineering@gmail.com",
};

const NAVY   = "#1a2e5c";
const ORANGE = "#F97316";

const cell = (extra = {}) => ({
  border: `1px solid ${NAVY}`, padding: "5px 8px",
  fontSize: 11, color: "#111", verticalAlign: "top", ...extra,
});

// ─── buildAddress ─────────────────────────────────────────────────────────────
// Composes the structured AddressFields data (stored with a prefix) into a
// single printable address string.
// `data`   — the full data object (contract, customer, job, etc.)
// `prefix` — the AddressFields prefix used in the modal (e.g. "con_", "cust_", "job_")
// Falls back to data.address if no prefixed fields are found.
const buildAddress = (data, prefix = "con_") => {
  if (!data) return "—";
  const f = key => (data[`${prefix}${key}`] || "").trim();
  const street  = f("street");   // from the FInput above <AddressFields>
  const area    = f("area");     // Area / Locality
  const city    = f("city");     // City dropdown
  const state   = f("state");    // State dropdown
  const zip     = f("zip");      // ZIP / PIN Code
  const country = f("country");  // Country dropdown

  const composed = [street, area, city, state, zip, country]
    .filter(Boolean)
    .join(", ");

  // Fall back to legacy single-field `address` if no structured data present
  return composed || data.address || "—";
};

const AlishaHeader = ({ date }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 0 10px" }}>
    <div style={{ flex: 1, marginRight: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.5, borderBottom: "1px solid blue", paddingBottom: 4 }}>
        Installation Maintenance &amp; Repair of Air Conditioning,<br />
        Electronics Appliance, Fabrication &amp; Insulation Works.
      </div>
      <div style={{ fontSize: 10, color: "#555", marginTop: 5, lineHeight: 1.55, textTransform: "uppercase" }}>
        {VENDOR.address}
      </div>
    </div>
    <div style={{ flexShrink: 0, textAlign: "right" }}>
      <img src={logoImg} alt="Alisha Engineering" style={{ height: 60, width: "auto", objectFit: "contain" }} />
      {date && <div style={{ fontSize: 11, marginTop: 6, color: "#333" }}><strong>Date:</strong> {date}</div>}
    </div>
  </div>
);

const AlishaFooter = () => (
  <div style={{ padding: "16px 0 0", borderTop: `1px solid ${NAVY}`, marginTop: 14 }}>
    <div style={{ fontSize: 11, color: "#222", lineHeight: 2 }}>
      <div>Thanking You,</div>
      <div style={{ fontWeight: 700 }}>Mr. VAKIL YADAV</div>
      <div>{VENDOR.phone}</div>
      <div>From: {VENDOR.company}</div>
    </div>
    <img src={signatureImg} alt="Signature" style={{ height: 44, width: "auto", display: "block", marginTop: 8, mixBlendMode: "multiply", filter: "contrast(1.4) brightness(0.7)" }} />
    <div style={{ fontSize: 10, fontWeight: 700, color: "#555", borderTop: "1px solid #ccc", paddingTop: 4, marginTop: 4, width: 160 }}>[Authorized Signatory]</div>
  </div>
);

// ─── VendorClientTable ────────────────────────────────────────────────────────
// `clientRows` — the raw data object (contract, quotation, etc.)
// `prefix`     — AddressFields prefix used when creating this record (default "con_")
const VendorClientTable = ({ clientRows, prefix = "con_" }) => {
  const clientAddress = buildAddress(clientRows, prefix);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
      <tbody>
        <tr>
          <td style={{ ...cell({ background: NAVY, color: "white", fontWeight: 700, textAlign: "center", width: "50%" }) }}>Vendor Details:</td>
          <td style={{ ...cell({ background: NAVY, color: "white", fontWeight: 700, textAlign: "center" }) }}>Client Details:</td>
        </tr>
        {[
          ["Company Name",  VENDOR.company,  clientRows.company || clientRows.customer || "—"],
          ["Address",       VENDOR.address,  clientAddress],
          ["Contact Person",VENDOR.contact,  clientRows.contact  || "—"],
          ["Phone No",      VENDOR.phone,    clientRows.phone    || "—"],
          ["Email",         VENDOR.email,    clientRows.email    || "—"],
        ].map(([k, v, cv]) => (
          <tr key={k}>
            <td style={cell()}><strong>{k}: </strong>{v}</td>
            <td style={cell()}><strong>{k}: </strong>{cv}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ─── 1. Quotation ─────────────────────────────────────────────────────────────
export const QuotationTemplate = ({ data: q }) => {
  const subtotal = q.subtotal ?? q.items.reduce((s, x) => s + (parseFloat(x.qty)||0) * (parseFloat(x.rate)||0), 0);
  const total    = q.total ?? subtotal;
  const MIN_ROWS = 5;
  const fillerCount = Math.max(0, MIN_ROWS - q.items.length);
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#111" }}>
      <AlishaHeader date={q.created} />
      <div style={{ textAlign: "center", padding: "12px 0 8px", borderTop: `1px solid ${NAVY}`, borderBottom: `1px solid ${NAVY}`, marginBottom: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, textDecoration: "underline", letterSpacing: 1 }}>SUBJECT: QUOTATION FOR {String(q.type || "").toUpperCase()}</span>
      </div>
      {/* Quotations use "cust_" prefix from NewCustomerModal / NewQuotationModal */}
      <VendorClientTable clientRows={q} prefix="cust_" />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: NAVY }}>
            {[["SR. NO","9%","center"],["DESCRIPTION","42%","left"],["QTY","10%","center"],["RATE","17%","right"],["TOTAL","22%","right"]].map(([l,w,a]) => (
              <th key={l} style={{ border: `1px solid ${NAVY}`, padding: "6px", fontSize: 11, fontWeight: 700, color: "white", textAlign: a, width: w, letterSpacing: .5 }}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {q.items.map((item, i) => (
            <tr key={i}>
              <td style={{ ...cell({ textAlign: "center" }) }}>{i + 1}</td>
              <td style={cell()}>{item.desc}</td>
              <td style={{ ...cell({ textAlign: "center" }) }}>{item.qty}</td>
              <td style={{ ...cell({ textAlign: "right" }) }}>{item.rate ? `₹${Number(item.rate).toLocaleString()}` : ""}</td>
              <td style={{ ...cell({ textAlign: "right", fontWeight: 700 }) }}>{item.qty && item.rate ? `₹${((parseFloat(item.qty)||0) * (parseFloat(item.rate)||0)).toLocaleString()}` : ""}</td>
            </tr>
          ))}
          {Array.from({ length: fillerCount }).map((_, i) => (
            <tr key={`f${i}`}><td style={{ ...cell({ textAlign: "center", color: "#aaa" }) }}>{q.items.length + i + 1}</td><td style={cell()}>&nbsp;</td><td style={cell()} /><td style={cell()} /><td style={cell()} /></tr>
          ))}
          {[["SUBTOTAL", subtotal ? `₹${subtotal.toLocaleString()}` : ""], ["DISCOUNT", "—"], ["TOTAL", total ? `₹${total.toLocaleString()}` : ""]].map(([k, v]) => (
            <tr key={k}><td colSpan={3} style={{ border: `1px solid ${NAVY}`, padding: "5px 8px" }} /><td style={{ ...cell({ textAlign: "right", fontWeight: 700 }) }}>{k}</td><td style={{ ...cell({ textAlign: "right", fontWeight: k === "TOTAL" ? 800 : 600 }) }}>{v}</td></tr>
          ))}
          <tr><td colSpan={5} style={{ textAlign: "center", padding: "7px 20px", border: `1px solid ${NAVY}`, fontSize: 10, color: "#333", fontStyle: "italic" }}>* If you have any questions about this quotation, feel free to contact us.</td></tr>
        </tbody>
      </table>

      {/* Notes */}
      {q.notes && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr style={{ background: NAVY }}>
              <th style={{ border: `1px solid ${NAVY}`, padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "white", textAlign: "left", letterSpacing: .5 }}>NOTES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: `1px solid ${NAVY}`, padding: "7px 10px", fontSize: 11, color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{q.notes}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Terms & Conditions */}
      {q.terms && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr style={{ background: NAVY }}>
              <th style={{ border: `1px solid ${NAVY}`, padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "white", textAlign: "left", letterSpacing: .5 }}>TERMS &amp; CONDITIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: `1px solid ${NAVY}`, padding: "7px 10px", fontSize: 11, color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{q.terms}</td>
            </tr>
          </tbody>
        </table>
      )}

      <AlishaFooter />
    </div>
  );
};

// ─── 2. Contract ──────────────────────────────────────────────────────────────
export const ContractTemplate = ({ data: c }) => {
  const st = ({ active: { label: "Active", bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" }, draft: { label: "Draft", bg: "#F9FAFB", color: "#64748B", border: "#E2E8F0" }, expired: { label: "Expired", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" }, pending_signature: { label: "Pending Signature", bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" }, terminated: { label: "Terminated", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" } })[c.status] || { label: c.status, bg: "#F9FAFB", color: "#64748B", border: "#E2E8F0" };
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#111" }}>
      <AlishaHeader date={c.startDate} />
      <div style={{ textAlign: "center", padding: "12px 0 8px", borderTop: `1px solid ${NAVY}`, borderBottom: `1px solid ${NAVY}`, marginBottom: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, textDecoration: "underline", letterSpacing: 1 }}>CONTRACT AGREEMENT — {String(c.type || "").toUpperCase()}</span>
      </div>
      {/* Contracts use "con_" prefix from NewAMCModal */}
      <VendorClientTable clientRows={c} prefix="con_" />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <thead><tr style={{ background: NAVY }}><th colSpan={4} style={{ border: `1px solid ${NAVY}`, padding: "7px 10px", fontSize: 12, fontWeight: 700, color: "white", textAlign: "center", letterSpacing: .5 }}>CONTRACT DETAILS</th></tr></thead>
        <tbody>
          <tr><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff", width: "20%" }) }}>Contract ID</td><td style={{ ...cell({ fontFamily: "monospace", fontWeight: 700, color: NAVY, width: "30%" }) }}>{c.id}</td><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff", width: "20%" }) }}>Status</td><td style={{ ...cell({ width: "30%" }) }}><span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{st.label}</span></td></tr>
          <tr><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Contract Title</td><td colSpan={3} style={{ ...cell({ fontWeight: 600 }) }}>{c.title}</td></tr>
          <tr><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Type</td><td style={cell()}>{c.type}</td><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Contract Value</td><td style={{ ...cell({ fontFamily: "monospace", fontWeight: 800, color: NAVY, fontSize: 13 }) }}>₹{c.value?.toLocaleString()}</td></tr>
          <tr><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Start Date</td><td style={cell()}>{c.startDate || "—"}</td><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>End Date</td><td style={cell()}>{c.endDate || "—"}</td></tr>
          <tr><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Auto-Renew</td><td style={cell()}>{c.autoRenew ? "Yes" : "No"}</td><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Clauses</td><td style={cell()}>{c.clauses}</td></tr>
          {c.linkedAMC && <tr><td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Linked AMC</td><td colSpan={3} style={cell()}>{c.linkedAMC}</td></tr>}
        </tbody>
      </table>
      {c.terms && <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}><thead><tr style={{ background: NAVY }}><th style={{ border: `1px solid ${NAVY}`, padding: "7px 10px", fontSize: 12, fontWeight: 700, color: "white", textAlign: "left", letterSpacing: .5 }}>KEY TERMS &amp; CONDITIONS</th></tr></thead><tbody><tr><td style={{ ...cell({ lineHeight: 1.7 }) }}>{c.terms}</td></tr></tbody></table>}
      {c.signatories?.length > 0 && <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}><thead><tr style={{ background: NAVY }}><th style={{ border: `1px solid ${NAVY}`, padding: "7px 10px", fontSize: 12, fontWeight: 700, color: "white", textAlign: "left" }}>SIGNATORIES</th><th style={{ border: `1px solid ${NAVY}`, padding: "7px 10px", fontSize: 12, fontWeight: 700, color: "white", textAlign: "center", width: "20%" }}>STATUS</th></tr></thead><tbody>{c.signatories.map((s, i) => <tr key={i}><td style={{ ...cell({ fontWeight: 600 }) }}>{s}</td><td style={{ ...cell({ textAlign: "center" }) }}>{s.includes("PENDING") ? <span style={{ color: "#B45309", fontWeight: 700 }}>⏳ Pending</span> : <span style={{ color: "#16A34A", fontWeight: 700 }}>✓ Signed</span>}</td></tr>)}</tbody></table>}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}><tbody><tr><td style={{ ...cell({ textAlign: "center", padding: "14px 10px", fontStyle: "italic", fontSize: 10, color: "#555" }) }} colSpan={2}>This contract is entered into between Alisha Engineering and the client named above. Both parties agree to the terms and conditions stated herein.</td></tr></tbody></table>
      <AlishaFooter />
    </div>
  );
};

// ─── 3. Invoice ───────────────────────────────────────────────────────────────
export const InvoiceTemplate = ({ data: inv }) => (
  <div>
    <Header title="Invoice" id={inv.id} meta={[["Date", inv.date], ["Due", inv.due, true]]} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Bill To</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>{inv.customer}</div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>{buildAddress(inv, "cust_")}</div>
        <div style={{ fontSize: 12, color: "#666" }}>{inv.phone}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Job Reference</div>
        <InfoRow label="Job ID" value={inv.jobId} /><InfoRow label="Type" value={inv.type} /><InfoRow label="Technician" value={inv.tech} />
      </div>
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
      <thead><tr style={{ background: "#F9FAFB" }}>{["Description","Qty","Rate (₹)","Amount (₹)"].map((h,i) => <th key={h} style={{ padding: "9px 12px", textAlign: i===0?"left":"center", fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 0.4, borderBottom: "2px solid #E5E7EB" }}>{h}</th>)}</tr></thead>
      <tbody>{(inv.items||[]).map((item,i) => <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}><td style={{ padding:"11px 12px",fontSize:13,color:"#1a1a1a" }}>{item.desc}</td><td style={{ padding:"11px 12px",textAlign:"center",fontFamily:"monospace",fontSize:13 }}>{item.qty}</td><td style={{ padding:"11px 12px",textAlign:"center",fontFamily:"monospace",fontSize:13 }}>{Number(item.rate).toLocaleString()}</td><td style={{ padding:"11px 12px",textAlign:"center",fontFamily:"monospace",fontWeight:700,fontSize:13 }}>{(item.qty*item.rate).toLocaleString()}</td></tr>)}</tbody>
    </table>
    <div style={{ display:"flex",justifyContent:"flex-end" }}>
      <div style={{ width:280 }}>
        {[["Subtotal",`₹${inv.subtotal?.toLocaleString()}`],["GST @ 18%",`₹${inv.gst?.toLocaleString()}`]].map(([k,v]) => <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #E5E7EB",fontSize:13 }}><span style={{ color:"#888" }}>{k}</span><span style={{ fontFamily:"monospace" }}>{v}</span></div>)}
        <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",fontSize:17,fontWeight:800 }}><span>Total</span><span style={{ fontFamily:"monospace",color:"#F97316" }}>₹{inv.total?.toLocaleString()}</span></div>
      </div>
    </div>
    <Footer />
  </div>
);

// ─── 4. AMC Contract ──────────────────────────────────────────────────────────
const PLAN_COLORS = { Comprehensive: "#3B82F6", Premium: "#8B5CF6", Basic: "#10B981" };

export const AMCContractPDFTemplate = ({ data: c }) => {
  const planColor = PLAN_COLORS[c.plan] || "#64748B";
  const isActive  = c.status === "active" || c.status === "Active";
  const pct       = c.visits > 0 ? Math.round((c.done / c.visits) * 100) : 0;
  const ca        = (extra = {}) => ({ border: `1px solid ${NAVY}`, padding: "6px 10px", fontSize: 11, color: "#111", verticalAlign: "top", ...extra });
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#111", background: "white" }}>
      <AlishaHeader date={c.startDate} />
      <div style={{ textAlign: "center", padding: "10px 0", borderTop: `1px solid ${NAVY}`, marginBottom: 16 }}><span style={{ fontSize: 13, fontWeight: 700, textDecoration: "underline", letterSpacing: 1, textTransform: "uppercase" }}>AMC CONTRACT — {c.plan} Plan</span></div>
      <div style={{ border: `1.5px solid ${NAVY}`, borderRadius: 10, padding: "16px 20px", marginBottom: 16, background: "#FAFCFF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: isActive ? "#F0FDF4" : "#FFFBEB", color: isActive ? "#16A34A" : "#B45309", border: `1px solid ${isActive ? "#BBF7D0" : "#FDE68A"}` }}>{isActive ? "Active" : "Expiring"}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: `${planColor}18`, color: planColor, border: `1px solid ${planColor}40` }}>{c.plan} Plan</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a", marginBottom: 4 }}>{c.customer}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{c.units} AC Units · {c.start} to {c.end}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>Contract Value</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontFamily: "monospace", letterSpacing: -1 }}>₹{Number(c.value).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>₹{Math.round(c.value / 12).toLocaleString()}/mo</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, paddingTop: 14, borderTop: "1px solid #E2E8F0" }}>
          {[["TOTAL VISITS/YEAR",c.visits],["VISITS DONE",c.done],["REMAINING",c.visits-c.done],["NEXT VISIT",c.nextVisit]].map(([label,value]) => (
            <div key={label} style={{ background: "white", borderRadius: 8, padding: "10px 12px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .5, marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: "monospace" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ border: `1px solid ${NAVY}`, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>Visit Progress</div><span style={{ fontSize: 13, fontWeight: 800, color: ORANGE }}>{pct}%</span></div>
        <div style={{ height: 10, background: "#F1F5F9", borderRadius: 99, overflow: "hidden", marginBottom: 14 }}><div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${ORANGE},#EA580C)`, borderRadius: 99 }} /></div>
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: c.visits }).map((_,i) => (
            <div key={i} style={{ flex: 1, padding: "10px 6px", borderRadius: 8, textAlign: "center", background: i<c.done?"#F0FDF4":"#F8FAFC", border: `1px solid ${i<c.done?"#BBF7D0":"#E2E8F0"}` }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{i<c.done?"✅":"📅"}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: i<c.done?"#16A34A":"#94A3B8" }}>Visit {i+1}</div>
              <div style={{ fontSize: 9, color: "#94A3B8" }}>{i<c.done?"Done":"Pending"}</div>
            </div>
          ))}
        </div>
      </div>
      <AlishaFooter />
    </div>
  );
};

// ─── 5. Campaign Report ───────────────────────────────────────────────────────
export const CampaignReportTemplate = ({ data: c }) => {
  const roas      = c.spent > 0 ? (c.revenue / c.spent).toFixed(1) : "0";
  const cpl       = c.leads > 0 ? Math.round(c.spent / c.leads) : 0;
  const convRate  = c.leads > 0 ? Math.round((c.conversions / c.leads) * 100) : 0;
  const budgetPct = Math.min(Math.round((c.spent / c.budget) * 100), 100);

  const CHANNEL_META = {
    facebook:  { emoji: "📘", color: "#1877F2", name: "Facebook"  },
    instagram: { emoji: "📸", color: "#E1306C", name: "Instagram" },
    twitter:   { emoji: "🐦", color: "#1DA1F2", name: "Twitter"   },
    linkedin:  { emoji: "💼", color: "#0A66C2", name: "LinkedIn"  },
    youtube:   { emoji: "▶️", color: "#FF0000", name: "YouTube"   },
    google:    { emoji: "⭐", color: "#FBBC05", name: "Google"    },
    whatsapp:  { emoji: "💬", color: "#25D366", name: "WhatsApp"  },
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#111" }}>
      <AlishaHeader date={new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
      <div style={{ textAlign: "center", padding: "12px 0 8px", borderTop: `1px solid ${NAVY}`, borderBottom: `1px solid ${NAVY}`, marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 700, textDecoration: "underline", letterSpacing: 1, textTransform: "uppercase" }}>CAMPAIGN PERFORMANCE REPORT</span>
      </div>
      <div style={{ border: `1.5px solid ${NAVY}`, borderRadius: 10, padding: "14px 18px", marginBottom: 14, background: "#FAFCFF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: c.status === "active" ? "#F0FDF4" : "#F8FAFC", color: c.status === "active" ? "#16A34A" : "#64748B", border: `1px solid ${c.status === "active" ? "#BBF7D0" : "#E2E8F0"}` }}>● {c.status}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>{c.goal}</span>
              {(c.channels || []).map(ch => {
                const meta = CHANNEL_META[ch] || { emoji: "🌐", color: "#94A3B8", name: ch };
                return <span key={ch} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: meta.color + "18", color: meta.color }}>{meta.emoji} {meta.name}</span>;
              })}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#1a1a1a", marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{c.startDate} – {c.endDate}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 2, textTransform: "uppercase", letterSpacing: .5 }}>Campaign ID</div>
            <div style={{ fontFamily: "monospace", fontWeight: 800, color: NAVY, fontSize: 14 }}>{c.id}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          ["ROAS",       roas + "x",    "Revenue per ₹1 spent", "#16A34A"],
          ["CPL",        "₹" + cpl,     "Cost per lead",         "#0369A1"],
          ["CONV. RATE", convRate + "%", "Leads → Customers",     "#7C3AED"],
          ["leads",      c.leads,        "Generated",             "#EA580C"],
        ].map(([label, value, sub, color]) => (
          <div key={label} style={{ border: `1px solid ${NAVY}`, borderRadius: 8, padding: "12px 14px", textAlign: "center", background: "#FAFCFF" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "monospace" }}>{value}</div>
            <div style={{ fontSize: 9, color: "#64748B", marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <thead><tr style={{ background: NAVY }}><th colSpan={4} style={{ border: `1px solid ${NAVY}`, padding: "7px 10px", fontSize: 12, fontWeight: 700, color: "white", textAlign: "center", letterSpacing: .5 }}>ENGAGEMENT METRICS</th></tr></thead>
        <tbody>
          <tr>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff", width: "22%" }) }}>Impressions</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 700, width: "28%" }) }}>{Number(c.impressions || 0).toLocaleString()}</td>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff", width: "22%" }) }}>Reach</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 700, width: "28%" }) }}>{Number(c.reach || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Clicks</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 700 }) }}>{Number(c.clicks || 0).toLocaleString()}</td>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Conversions</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 700 }) }}>{c.conversions}</td>
          </tr>
          <tr>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Leads Generated</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 800, color: "#EA580C" }) }}>{c.leads}</td>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Conversion Rate</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 800, color: "#7C3AED" }) }}>{convRate}%</td>
          </tr>
        </tbody>
      </table>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <thead><tr style={{ background: NAVY }}><th colSpan={4} style={{ border: `1px solid ${NAVY}`, padding: "7px 10px", fontSize: 12, fontWeight: 700, color: "white", textAlign: "center", letterSpacing: .5 }}>BUDGET UTILISATION</th></tr></thead>
        <tbody>
          <tr>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff", width: "22%" }) }}>Total Budget</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 700, width: "28%" }) }}>₹{Number(c.budget).toLocaleString()}</td>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff", width: "22%" }) }}>Amount Spent</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 800, color: "#EA580C", width: "28%" }) }}>₹{Number(c.spent).toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>Remaining</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 700, color: "#16A34A" }) }}>₹{(c.budget - c.spent).toLocaleString()}</td>
            <td style={{ ...cell({ fontWeight: 700, background: "#f0f4ff" }) }}>% Used</td>
            <td style={{ ...cell({ fontFamily: "monospace", fontWeight: 800 }) }}>{budgetPct}%</td>
          </tr>
          <tr>
            <td colSpan={4} style={{ border: `1px solid ${NAVY}`, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748B", marginBottom: 6 }}>
                <span>₹0</span>
                <span style={{ fontWeight: 700, color: "#EA580C" }}>₹{Number(c.spent).toLocaleString()} spent ({budgetPct}%)</span>
                <span>₹{Number(c.budget).toLocaleString()}</span>
              </div>
              <div style={{ height: 12, background: "#F1F5F9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${budgetPct}%`, height: "100%", background: "linear-gradient(90deg,#EA580C,#F97316)", borderRadius: 6 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginTop: 5 }}>
                <span>{budgetPct}% used</span>
                <span>₹{(c.budget - c.spent).toLocaleString()} remaining</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ border: `1.5px solid #16A34A`, borderRadius: 10, padding: "14px 18px", marginBottom: 14, background: "#F0FDF4" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>REVENUE GENERATED</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#16A34A", fontFamily: "monospace" }}>₹{Number(c.revenue).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#16A34A", marginTop: 3 }}>ROAS: {roas}x — For every ₹1 spent, ₹{roas} was earned</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#166534", marginBottom: 3 }}>Cost Per Lead</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0369A1", fontFamily: "monospace" }}>₹{cpl.toLocaleString()}</div>
          </div>
        </div>
      </div>
      <AlishaFooter />
    </div>
  );
};

// ─── 6. Generic list ──────────────────────────────────────────────────────────
export const GenericListTemplate = ({ data }) => {
  const { title, subtitle, docId, columns, rows, summaryPills, showTotals, totalColumns } = data;
  return (
    <div>
      <Header title={title} id={docId} meta={subtitle ? [["", subtitle]] : []} />
      {summaryPills?.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          {summaryPills.map(p => (
            <div key={p.label} style={{ background: "#FFF7ED", borderRadius: 8, padding: "8px 16px", fontSize: 12 }}>
              <div style={{ color: "#888", marginBottom: 2 }}>{p.label}</div>
              <div style={{ fontWeight: 800, color: "#F97316", fontSize: 15 }}>{p.value}</div>
            </div>
          ))}
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "#F9FAFB" }}>{columns.map(c => <th key={c.key} style={{ padding: "9px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 0.4, borderBottom: "2px solid #E5E7EB" }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
              {columns.map(c => { const val = row[c.key]; const display = c.format ? c.format(val) : (val ?? "—"); return <td key={c.key} style={{ padding: "9px 10px", fontSize: 12, color: "#1a1a1a", ...(c.tdStyle || {}) }}>{String(display)}</td>; })}
            </tr>
          ))}
          {showTotals && totalColumns?.length > 0 && (
            <tr style={{ background: "#FFF7ED" }}>
              {columns.map((c, i) => { if (totalColumns.includes(c.key)) { const sum = rows.reduce((s, r) => s + (parseFloat(r[c.key]) || 0), 0); const display = c.format ? c.format(sum) : sum.toLocaleString(); return <td key={c.key} style={{ padding: "9px 10px", fontSize: 12, fontWeight: 800, color: "#F97316", fontFamily: "monospace" }}>{String(display)}</td>; } return <td key={c.key} style={{ padding: "9px 10px", fontSize: 12, fontWeight: 800, color: "#888" }}>{i === 0 ? "TOTAL" : ""}</td>; })}
            </tr>
          )}
        </tbody>
      </table>
      <Footer />
    </div>
  );
};

// ─── 7. Service Job Sheet ─────────────────────────────────────────────────────
export const ServiceJobSheetTemplate = ({ data: s }) => {
  const CAT_COLOR = { Installation: { bg: "#EFF6FF", color: "#1D4ED8" }, Service: { bg: "#F0FDF4", color: "#15803D" }, Repair: { bg: "#FEF2F2", color: "#DC2626" }, AMC: { bg: "#FFF7ED", color: "#C2410C" } };
  const cat   = CAT_COLOR[s.category] || CAT_COLOR.Service;
  const total = Math.round(s.price * (1 + s.gst / 100));
  const cs    = (extra = {}) => ({ border: `1px solid ${NAVY}`, padding: "6px 10px", fontSize: 11, color: "#111", verticalAlign: "top", ...extra });
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#111" }}>
      <AlishaHeader date={new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
      <div style={{ textAlign: "center", padding: "10px 0 8px", borderTop: `1px solid ${NAVY}`, borderBottom: `1px solid ${NAVY}`, marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 700, textDecoration: "underline", letterSpacing: 1, textTransform: "uppercase" }}>SERVICE JOB SHEET</span></div>
      <div style={{ border: `1.5px solid ${NAVY}`, borderRadius: 8, padding: "14px 18px", marginBottom: 14, background: "#FAFCFF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30` }}>{s.category}</span>{s.popular && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#FEF9C3", color: "#854D0E", border: "1px solid #FEF08A" }}>⭐ Popular</span>}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#1a1a1a", marginBottom: 4 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6, maxWidth: 480 }}>{s.description}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 20 }}><div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontFamily: "monospace" }}>₹{Number(s.price).toLocaleString()}</div><div style={{ fontSize: 10, color: "#94A3B8" }}>+{s.gst}% GST = ₹{total.toLocaleString()}</div></div>
        </div>
      </div>
      {s.checklist?.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
          <thead><tr style={{ background: NAVY }}><th style={{ ...cs({ color: "white", fontWeight: 700, textAlign: "left", fontSize: 12 }) }} colSpan={2}>✅ SERVICE CHECKLIST ({s.checklist.length} STEPS)</th></tr></thead>
          <tbody>
            {s.checklist.map((step, i) => <tr key={i} style={{ background: i%2===0?"white":"#F8FAFC" }}><td style={{ ...cs({ textAlign:"center",width:28,fontWeight:700,color:ORANGE,fontFamily:"monospace" }) }}>{i+1}</td><td style={{ ...cs({ lineHeight:1.6 }) }}>{step}</td></tr>)}
            <tr><td colSpan={2} style={{ ...cs({ background:"#FFF7ED",paddingTop:10,paddingBottom:10 }) }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><span style={{ fontSize:11,fontWeight:700,color:"#C2410C" }}>Technician Sign-off:</span><span style={{ fontSize:11,color:"#888" }}>Signature: ___________________</span><span style={{ fontSize:11,color:"#888" }}>Date: ___________</span></div></td></tr>
          </tbody>
        </table>
      )}
      <AlishaFooter />
    </div>
  );
};

// ─── 8. Staff Scorecard (matches modal visual style) ─────────────────────────
export const ScorecardTemplate = ({ data: t }) => {
  const pct       = t.target ? Math.round((t.jobsDone / t.target) * 100) : 0;
  const perfColor = pct >= 100 ? "#16A34A" : pct >= 85 ? "#B45309" : "#DC2626";
  const trendData = t.trend || [22, 25, 28, 26, t.jobsDone];
  const months    = ["Oct", "Nov", "Dec", "Jan", "Feb"];

  // Sparkline SVG path
  const W = 480, H = 70, PAD = 8;
  const minV = Math.min(...trendData), maxV = Math.max(...trendData);
  const pts = trendData.map((v, i) => ({
    x: PAD + (i / (trendData.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((v - minV) / (maxV - minV || 1)) * (H - PAD * 2),
  }));
  const sparkLine = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const sparkArea = `${sparkLine} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  // Gauge donut
  const GR = 38, GCX = 46, GCY = 46;
  const gCirc = 2 * Math.PI * GR;
  const gDash = (Math.min(pct, 100) / 100) * gCirc;

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 12, color: "#111", background: "#fff" }}>

      {/* ── Dark hero header — same as modal ── */}
      <div style={{ background: "#18181B", borderRadius: "10px 10px 0 0", padding: "22px 28px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "repeating-linear-gradient(45deg,#EA580C,#EA580C 2px,transparent 2px,transparent 16px)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, position: "relative" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#EA580C" }}>❄ CoolTech AC Services</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>Staff Performance Scorecard · February 2026</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Generated</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div style={{ width: 54, height: 54, borderRadius: 13, background: "linear-gradient(135deg,#EA580C,#C2410C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
            {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(234,88,12,0.2)", border: "1px solid rgba(234,88,12,0.4)", borderRadius: 6, padding: "2px 10px", marginBottom: 7, fontSize: 10, fontWeight: 700, color: "#FB923C" }}>
              ★ #{t.rank} Top Performer · February 2026
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{t.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Senior Technician · Zone A – Ahmedabad North</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#EA580C", fontFamily: "monospace", lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>of monthly target</div>
          </div>
        </div>
      </div>

      {/* Orange accent stripe */}
      <div style={{ height: 4, background: "linear-gradient(90deg,#EA580C,#F97316,#EA580C)", marginBottom: 18 }} />

      {/* ── Overview section label ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Overview</div>

      {/* Gauge + bars — same layout as modal */}
      <div style={{ display: "flex", gap: 18, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <svg width={92} height={92} viewBox="0 0 92 92">
            <circle cx={GCX} cy={GCY} r={GR} fill="none" stroke="#E2E8F0" strokeWidth={10} />
            <circle cx={GCX} cy={GCY} r={GR} fill="none" stroke={perfColor} strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${gDash} ${gCirc}`}
              strokeDashoffset={gCirc / 4}
              transform={`rotate(-90 ${GCX} ${GCY})`}
            />
            <text x={GCX} y={GCY - 3} textAnchor="middle" fill={perfColor} fontSize={14} fontWeight={700} fontFamily="monospace">{pct}%</text>
            <text x={GCX} y={GCY + 11} textAnchor="middle" fill="#94A3B8" fontSize={8}>of target</text>
          </svg>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>{t.jobsDone} / {t.target} jobs</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
          {[
            ["Jobs Completed",        t.jobsDone,             t.target, perfColor, `${t.jobsDone} / ${t.target}`],
            ["On-Time Delivery",      t.onTime,               100,      "#16A34A", `${t.onTime}%`],
            ["Customer Satisfaction", (t.rating / 5) * 100,  100,      "#D97706", `${t.rating} / 5.0★`],
          ].map(([label, val, maxVal, color, display]) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748B", marginBottom: 4 }}>
                <span>{label}</span>
                <span style={{ fontWeight: 700, color }}>{display}</span>
              </div>
              <div style={{ height: 7, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(Math.round((val / maxVal) * 100), 100)}%`, height: "100%", background: color, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 stat cards — same as modal */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Rating",     value: `${t.rating}★`,                        badge: "Above avg",  bc: "#B45309", bb: "#FFFBEB" },
          { label: "On-Time",    value: `${t.onTime}%`,                         badge: "+5% vs avg", bc: "#16A34A", bb: "#F0FDF4" },
          { label: "Complaints", value: `${t.complaints}`,                      badge: t.complaints === 0 ? "Clean ✓" : `${t.complaints} flagged`, bc: t.complaints === 0 ? "#16A34A" : "#DC2626", bb: t.complaints === 0 ? "#F0FDF4" : "#FEF2F2" },
          { label: "Revenue",    value: `₹${(t.revenue / 1000).toFixed(0)}K`,  badge: "35% share",  bc: "#EA580C", bb: "#FFF7ED" },
        ].map(({ label, value, badge, bc, bb }) => (
          <div key={label} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#1E293B" }}>{value}</div>
            <div style={{ display: "inline-block", marginTop: 6, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: bb, color: bc }}>{badge}</div>
          </div>
        ))}
      </div>

      {/* ── Trend section label ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>5-Month Jobs Trend</div>

      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 16px 12px", marginBottom: 18 }}>
        {/* Sparkline */}
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          <defs>
            <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA580C" stopOpacity=".15" />
              <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={sparkArea} fill="url(#sg2)" />
          <path d={sparkLine} fill="none" stroke="#EA580C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill="#EA580C" />
              <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize={10} fontWeight={700} fill="#1E293B">{trendData[i]}</text>
            </g>
          ))}
        </svg>

        {/* Month labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {months.map(m => (
            <div key={m} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#94A3B8" }}>{m}</div>
          ))}
        </div>

        {/* Summary pills — same as modal trend tab */}
        <div style={{ display: "flex", gap: 10, marginTop: 12, borderTop: "1px solid #E2E8F0", paddingTop: 12 }}>
          {[
            ["Peak Month",       months[trendData.indexOf(Math.max(...trendData))], `${Math.max(...trendData)} jobs`],
            ["5-Month Average",  `${Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length)} jobs`, "per month"],
            ["This Month",       `${t.jobsDone} jobs`, `${pct}% of target`],
          ].map(([title, main, sub]) => (
            <div key={title} style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: title === "This Month" ? "#EA580C" : "#1E293B" }}>{main}</div>
              <div style={{ fontSize: 10, color: "#64748B" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Details section label ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Technician Details</div>

      {/* Details rows — same as modal details tab */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[
          ["Technician ID",    t.techId || "TECH-001"],
          ["Department",       "Field Operations"],
          ["Zone",             "Zone A – North Ahmedabad"],
          ["Period",           "February 2026"],
          ["Total Revenue",    `₹${t.revenue?.toLocaleString()}`],
          ["Incentive Earned", `₹${(t.incentive || 0).toLocaleString()}`],
          ["Complaint Record", t.complaints === 0 ? "✓ Clean – No complaints" : `${t.complaints} complaint(s)`],
          ["Team Rank",        `#${t.rank} of 5 technicians`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: "#64748B" }}>{k}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1E293B" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#94A3B8" }}>❄ CoolTech AC Services · cooltech@services.com · +91 98765 43210</div>
        <div style={{ fontSize: 10, color: "#94A3B8" }}>Confidential — Internal Use Only</div>
      </div>
    </div>
  );
};

// ─── Registry ─────────────────────────────────────────────────────────────────
export const TEMPLATES = {
  quotation:         QuotationTemplate,
  contract:          ContractTemplate,
  invoice:           InvoiceTemplate,
  amc_contract:      AMCContractPDFTemplate,
  campaign_report:   CampaignReportTemplate,
  generic_list:      GenericListTemplate,
  service_job_sheet: ServiceJobSheetTemplate,
  scorecard: ScorecardTemplate,
};