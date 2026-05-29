// ─── QuotationsPage.jsx — fully responsive for mobile & tablet ───────────────

import { useState, useEffect } from 'react';
import { QUOT_STATUS } from '../constants/statusMaps';
import { quotationsApi } from '../services/api';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
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
import useMagicImport from '../hooks/useMagicImport';
import MagicImportPanel from '../components/layout/MagicImportPanel';
import logoImg      from '../assets/logo.png';
import signatureImg from '../assets/signature.png';

const VENDOR = {
  company: "Alisha Engineering",
  address: "L.I.G-II -164 G.I.D.C HOUSING BOARD NEAR CHHOTALAL CHAR RASTA BESIDE SWAMINARAYAN MANDIR ODAHAV AHMEDABAD-382415",
  contact: "Vakil Yadav",
  phone:   "9724763909",
  email:   "alishaengineering@gmail.com",
};

const QUOT_COLUMNS = [
  { label: "Quote ID",   key: "id",       width: 12, tdStyle: { fontFamily: "monospace", fontWeight: 700, color: COLORS.brand, fontSize: 11 } },
  { label: "Customer",   key: "customer", width: 20, tdStyle: { fontWeight: 600 } },
  { label: "Contact",    key: "contact",  width: 16, tdStyle: { fontSize: 12 } },
  { label: "Phone",      key: "phone",    width: 14, tdStyle: { fontFamily: "monospace", fontSize: 11 } },
  { label: "Type",       key: "type",     width: 14, render: (val) => <TypeTag type={val} />, format: (val) => val },
  { label: "Status",     key: "status",   width: 10, render: (val) => <SBadge s={val} map={QUOT_STATUS} />, format: (val) => val },
  { label: "Subtotal",   key: "subtotal", width: 12, excelKey: "Subtotal (₹)", render: (val) => <span style={{ fontFamily: FONTS.mono, color: COLORS.h2 }}>₹{Number(val).toLocaleString()}</span>, format: (val) => val },
  { label: "GST",        key: "gst",      width: 10, excelKey: "GST (₹)",     render: (val) => <span style={{ fontFamily: FONTS.mono, color: COLORS.muted }}>₹{Number(val).toLocaleString()}</span>, format: (val) => val },
  { label: "Total",      key: "total",    width: 12, excelKey: "Total (₹)",   render: (val) => <span style={{ fontFamily: FONTS.mono, fontWeight: 800, color: COLORS.brand }}>₹{Number(val).toLocaleString()}</span>, format: (val) => val },
  { label: "Valid Till", key: "valid",    width: 12, tdStyle: { fontSize: 12, color: COLORS.muted } },
];

const Logo      = () => <img src={logoImg}      alt="Alisha Engineering" style={{ height: 60, width: "auto", display: "block", objectFit: "contain" }} />;
const Signature = () => <img src={signatureImg} alt="Signature"          style={{ height: 48, width: "auto", display: "block", mixBlendMode: "multiply", filter: "contrast(1.4) brightness(0.7)", objectFit: "contain" }} />;

// ─── QuotationDocView ─────────────────────────────────────────────────────────
const QuotationDocView = ({ quot, editMode, editData, setEditData, editItems, setEditItems }) => {
  const NAVY = "#1a2e5c";
  const fm   = FONTS.mono;
  const set     = (key) => (e) => setEditData(p => ({ ...p, [key]: e.target.value }));
  const setItem = (i, key) => (e) => setEditItems(prev => prev.map((x, j) => j === i ? { ...x, [key]: e.target.value } : x));
  const addItem    = () => setEditItems(prev => [...prev, { desc: "", qty: "", rate: "" }]);
  const removeItem = (i) => setEditItems(prev => prev.filter((_, j) => j !== i));
  const items      = editMode ? editItems : quot.items;
  const subtotal   = editMode ? editItems.reduce((s, x) => s + (parseFloat(x.qty)||0)*(parseFloat(x.rate)||0), 0) : quot.subtotal;
  const total      = editMode ? subtotal : quot.total;
  const MIN_ROWS    = 3;
  const fillerCount = Math.max(0, MIN_ROWS - items.length);
  const cell = (extra = {}) => ({ border: `1px solid ${NAVY}`, padding: "5px 8px", fontSize: 12, color: "#111", verticalAlign: "top", ...extra });
  const eIn  = (extra = {}) => ({ width: "100%", padding: "3px 6px", border: "1.5px solid #94a3b8", borderRadius: 4, fontSize: 12, fontFamily: FONTS.sans, outline: "none", background: "#FAFAFA", boxSizing: "border-box", ...extra });

  return (
    /* Outer wrapper: scrollable on mobile so the fixed-layout document doesn't break the page */
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: 10, border: `1.5px solid ${editMode ? COLORS.brand : COLORS.border}`, boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}18` : "0 2px 12px rgba(0,0,0,.08)", transition: "all .2s" }}>
      <div style={{ minWidth: 520, background: "white", fontFamily: FONTS.sans }}>

        {/* ── Header: logo + company info ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 18px 8px", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, lineHeight: 1.5, borderBottom: "1px solid blue" }}>
              Installation Maintenance &amp; Repair of Air Conditioning,<br />Electronics Appliance, Fabrication &amp; Insulation Works.
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 4, lineHeight: 1.55, textTransform: "uppercase" }}>{VENDOR.address}</div>
          </div>
          <div style={{ flexShrink: 0 }}><Logo /></div>
        </div>

        {/* ── Subject row ── */}
        <div style={{ textAlign: "center", padding: "14px 18px 8px", borderTop: `1px solid ${NAVY}`, borderBottom: `1px solid ${NAVY}`, position: "relative" }}>
          <div style={{ fontSize: 11, color: "#333", position: "absolute", right: 18, transform: "translateY(-50%)" }}>
            <strong>Date: -</strong>&nbsp;
            {editMode
              ? <input value={editData.created||""} onChange={set("created")} style={{ ...eIn(), width: 100, display: "inline-block" }} />
              : <span>{quot.created}</span>}
          </div>
          <br />
          <span style={{ fontSize: 13, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3, color: "#111", letterSpacing: 1 }}>SUBJECT: QUOTATION FOR&nbsp;</span>
          {editMode
            ? <input value={editData.type||""} onChange={set("type")} style={{ ...eIn(), width: 160, display: "inline-block" }} />
            : <span style={{ fontSize: 13, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3, color: "#111", letterSpacing: 1, textTransform: "uppercase" }}>{quot.type}</span>}
        </div>

        {/* ── Vendor / Client table ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
          <tbody>
            <tr>
              <td style={{ ...cell({ background: NAVY, color: "white", fontWeight: 700, textAlign: "center", width: "50%", fontSize: 12 }) }}>Vendor Details:</td>
              <td style={{ ...cell({ background: NAVY, color: "white", fontWeight: 700, textAlign: "center", fontSize: 12 }) }}>Client Details:</td>
            </tr>
            <tr>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Company Name: </span>{VENDOR.company}</td>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Company Name: </span>{editMode ? <input value={editData.customer||""} onChange={set("customer")} style={eIn()} /> : quot.customer}</td>
            </tr>
            <tr>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Address: </span>{VENDOR.address}</td>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Address: </span>{editMode ? <input value={editData.address||""} onChange={set("address")} style={eIn()} /> : (quot.address||"—")}</td>
            </tr>
            <tr>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Contact Person: </span>{VENDOR.contact}</td>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Contact Person: </span>{editMode ? <input value={editData.contact||""} onChange={set("contact")} style={eIn()} /> : quot.contact}</td>
            </tr>
            <tr>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Phone No: </span>{VENDOR.phone}</td>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Phone No: </span>{editMode ? <input value={editData.phone||""} onChange={set("phone")} style={{ ...eIn(), fontFamily: fm }} /> : quot.phone}</td>
            </tr>
            <tr>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Email: </span>{VENDOR.email}</td>
              <td style={cell()}><span style={{ fontWeight: 700 }}>Email: </span>{editMode ? <input value={editData.email||""} onChange={set("email")} style={eIn()} /> : (quot.email||"—")}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Line items table ── */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: NAVY }}>
              {[{ label:"SR. NO",w:"9%",align:"center" },{ label:"DESCRIPTION",w:"42%",align:"center" },{ label:"QTY",w:"10%",align:"center" },{ label:"RATE",w:"17%",align:"center" },{ label:"TOTAL",w:"22%",align:"center" }].map(col => (
                <th key={col.label} style={{ border: `1px solid ${NAVY}`, padding:"6px 6px", fontSize:11, fontWeight:700, color:"white", textAlign:col.align, width:col.w, letterSpacing:.5 }}>{col.label}</th>
              ))}
              {editMode && <th style={{ border:"none", width:30, background:"transparent" }} />}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ ...cell({ textAlign:"center", fontFamily:fm }) }}>{i+1}</td>
                <td style={cell()}>{editMode ? <input value={item.desc} onChange={setItem(i,"desc")} style={eIn()} /> : item.desc}</td>
                <td style={{ ...cell({ textAlign:"center", fontFamily:fm }) }}>{editMode ? <input value={item.qty} onChange={setItem(i,"qty")} style={{ ...eIn({ textAlign:"center" }) }} /> : item.qty}</td>
                <td style={{ ...cell({ textAlign:"right", fontFamily:fm }) }}>{editMode ? <input value={item.rate} onChange={setItem(i,"rate")} style={{ ...eIn({ textAlign:"right" }) }} /> : (item.rate ? `₹${Number(item.rate).toLocaleString()}` : "")}</td>
                <td style={{ ...cell({ textAlign:"right", fontFamily:fm, fontWeight:700 }) }}>{item.qty && item.rate ? `₹${((parseFloat(item.qty)||0)*(parseFloat(item.rate)||0)).toLocaleString()}` : ""}</td>
                {editMode && <td style={{ padding:"4px", border:"none", textAlign:"center" }}><button onClick={() => removeItem(i)} style={{ padding:"2px 6px", borderRadius:4, background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", cursor:"pointer", fontSize:11 }}>✕</button></td>}
              </tr>
            ))}
            {Array.from({ length: fillerCount }).map((_, i) => (
              <tr key={`filler-${i}`}>
                <td style={{ ...cell({ textAlign:"center", color:"#aaa", fontFamily:fm }) }}>{items.length+i+1}</td>
                <td style={cell()}>&nbsp;</td><td style={cell()}/><td style={cell()}/><td style={cell()}/>
                {editMode && <td style={{ border:"none" }} />}
              </tr>
            ))}
            <tr>
              <td colSpan={3} style={{ border:`1px solid ${NAVY}`, padding:"5px 8px" }}/>
              <td style={{ ...cell({ textAlign:"right", fontWeight:700, fontSize:12 }) }}>SUBTOTAL</td>
              <td style={{ ...cell({ textAlign:"right", fontFamily:fm, fontWeight:600 }) }}>{subtotal ? `₹${subtotal.toLocaleString()}` : ""}</td>
              {editMode && <td style={{ border:"none" }}/>}
            </tr>
            <tr>
              <td colSpan={3} style={{ border:`1px solid ${NAVY}`, padding:"5px 8px" }}/>
              <td style={{ ...cell({ textAlign:"right", fontWeight:700, fontSize:12 }) }}>DISCOUNT</td>
              <td style={{ ...cell({ textAlign:"right", fontFamily:fm }) }}>—</td>
              {editMode && <td style={{ border:"none" }}/>}
            </tr>
            <tr>
              <td colSpan={3} style={{ border:`1px solid ${NAVY}`, padding:"5px 8px" }}/>
              <td style={{ ...cell({ textAlign:"right", fontWeight:700, fontSize:12 }) }}>TOTAL</td>
              <td style={{ ...cell({ textAlign:"right", fontFamily:fm, fontWeight:800, fontSize:13 }) }}>{total ? `₹${total.toLocaleString()}` : ""}</td>
              {editMode && <td style={{ border:"none" }}/>}
            </tr>
            <tr>
              <td colSpan={5} style={{ textAlign:"center", padding:"7px 20px", border:`1px solid ${NAVY}`, fontSize:11, color:"#333", fontStyle:"italic" }}>
                * If you have any questions about this quotation, feel free to contact us.
              </td>
            </tr>
          </tbody>
        </table>

        {editMode && (
          <div style={{ padding:"8px 14px", borderTop:`1px solid ${COLORS.border}` }}>
            <button onClick={addItem} style={{ fontSize:12, color:COLORS.brand, background:"none", border:`1.5px dashed ${COLORS.brand}`, borderRadius:6, padding:"5px 14px", cursor:"pointer", fontWeight:600 }}>+ Add Line Item</button>
          </div>
        )}
        {editMode && (
          <div style={{ padding:"10px 14px", borderTop:`1px solid ${COLORS.border}`, display:"flex", flexDirection:"column", gap:8 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, display:"block", marginBottom:3 }}>NOTES (optional)</label>
              <textarea value={editData.notes||""} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} placeholder="Add any notes for the customer…" rows={2} style={{ width:"100%", padding:"5px 8px", border:"1.5px solid #94a3b8", borderRadius:4, fontSize:12, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", outline:"none", background:"#FAFAFA" }}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, display:"block", marginBottom:3 }}>TERMS &amp; CONDITIONS (optional)</label>
              <textarea value={editData.terms||""} onChange={e => setEditData(p => ({ ...p, terms: e.target.value }))} placeholder="Enter terms &amp; conditions…" rows={3} style={{ width:"100%", padding:"5px 8px", border:"1.5px solid #94a3b8", borderRadius:4, fontSize:12, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", outline:"none", background:"#FAFAFA" }}/>
            </div>
          </div>
        )}
        {!editMode && (quot.notes || quot.terms) && (
          <div style={{ padding:"10px 14px 4px", borderTop:"1px solid #e2e8f0" }}>
            {quot.notes && <div style={{ marginBottom:8 }}><div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:3, letterSpacing:.3 }}>NOTES</div><div style={{ fontSize:12, color:"#374151", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{quot.notes}</div></div>}
            {quot.terms && <div style={{ marginBottom:8 }}><div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:3, letterSpacing:.3 }}>TERMS &amp; CONDITIONS</div><div style={{ fontSize:12, color:"#374151", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{quot.terms}</div></div>}
          </div>
        )}
        <div style={{ padding:"16px 20px 20px", borderTop:`1px solid ${NAVY}` }}>
          <div style={{ fontSize:12, color:"#222", lineHeight:2 }}>
            <div>Thanking You,</div>
            <div style={{ fontWeight:700 }}>Mr. VAKIL YADAV</div>
            <div>{VENDOR.phone}</div>
            <div>From: {VENDOR.company}</div>
          </div>
          <div style={{ marginTop:10 }}><Signature /></div>
          <div style={{ fontSize:11, fontWeight:700, color:"#555", borderTop:"1px solid #ccc", paddingTop:5, marginTop:4, width:180 }}>[Authorized Signatory]</div>
        </div>

      </div>
    </div>
  );
};

// ─── Breakpoint Hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {                          // ✅ use the imported useEffect
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    isMobile:  width < 640,
    isTablet:  width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

// ─── QuotationsPage ───────────────────────────────────────────────────────────
const QuotationsPage = ({ openModal }) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [open, setOpen]                   = useState(null);
  const [quotations, setQuotations] = useState([]);

  const normaliseQuot = (q) => ({
    ...q,
    id:        q.quotId   || q._id,
    customer:  typeof q.customer === 'object' ? q.customer?.name : (q.customerName || q.customer || ''),
    contact:   q.contact  || '',
    phone:     q.phone    || '',
    type:      q.type     || 'Service',
    items:     Array.isArray(q.items) ? q.items : [],
    subtotal:  q.subtotal ?? 0,
    gst:       q.gst      ?? 0,
    total:     q.total    ?? 0,
    validTill: q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : (q.validTill || '—'),
    created:   q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : (q.created || ''),
    valid:     q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : (q.valid || ''),
  });

  useEffect(() => {
    quotationsApi.list({limit:200})
      .then(r => setQuotations((r.data ?? []).map(normaliseQuot)))
      .catch(() => {});
  }, []);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [editMode, setEditMode]           = useState(false);
  const [editData, setEditData]           = useState({});
  const [editItems, setEditItems]         = useState([]);
  const [showPDF, setShowPDF]             = useState(false);
  const [showExportPDF, setShowExportPDF] = useState(false);

  const quot = open ? quotations.find(q => q.id === open || q._id === open) : null;

  const { q, setQ, activeFilters, setFilter, filtered: filteredQuots } = useTableSearch(
    quotations, ['id','customer','contact','phone','type','status'], { type:'', status:'' }
  );
  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } = usePagination(filteredQuots, 10);

  const { exportProps } = useExport({
    title: "Quotations", filename: "cooltech-quotations",
    template: "generic_list",
    subtitle: `AC Services Platform · Quotations · ${filteredQuots.length} records`,
    docId: "QT-EXPORT", columns: QUOT_COLUMNS, rows: filteredQuots,
    showTotals: true, totalColumns: ["subtotal","gst","total"],
  });

  const seedEdit = (data, items) => { setEditData(data); setEditItems(items); setEditMode(true); };

  const handleMagicFill = (data, items) => { seedEdit(data, items); };
  const openView = (id) => { setEditMode(false); setEditData({}); setEditItems([]); setOpen(id); };
  const openEdit = (id) => {
    const q = quotations.find(x => x.id === id || x._id === id);
    if (q) seedEdit({ customer:q.customer, contact:q.contact, phone:q.phone, email:q.email||'', address:q.address||'', type:q.type, status:q.status, created:q.created, valid:q.valid, notes:q.notes||'', terms:q.terms||'' }, q.items.map(i => ({ ...i })));
    setOpen(id);
  };
  const handleSave = async () => {
    try {
      const q = quotations.find(x => x.id === open || x._id === open);
      const mongoId = q?._id || open;
      const doc = await quotationsApi.update(mongoId, { ...editData, items: editItems });
      setQuotations(prev => prev.map(x => x._id === doc._id ? normaliseQuot(doc) : x));
      setEditMode(false);
    } catch(e) { alert(e.message); }
  };
  const handleBack   = () => { setOpen(null); setEditMode(false); setEditData({}); setEditItems([]); setShowPDF(false); };
  const handleDelete = async (id) => {
    try {
      const q = quotations.find(x => x.id === id || x._id === id);
      const mongoId = q?._id || id;
      await quotationsApi.remove(mongoId);
      setQuotations(prev => prev.filter(x => x.id !== id && x._id !== id));
    } catch(e) { alert(e.message); }
    setDeleteTarget(null);
  };

  const magicImport = useMagicImport({
    quotations: quotations, onFilled: handleMagicFill, onViewExisting: openView,
  });

  // ── Detail view ───────────────────────────────────────────────────────────
  if (quot) return (
    <>
      <div className="fi" style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Top bar — compact on mobile */}
        <div className="quot-top-bar">
          <BackBtn onClick={handleBack} />
          <span style={{ fontSize:13, color:COLORS.muted }}>Quotations /</span>
          <span style={{ fontSize:13, fontWeight:700, color:COLORS.brand, fontFamily:FONTS.mono }}>{quot.id}</span>
          <div className="quot-top-actions">
            {editMode ? (
              <>
                <button onClick={() => { setEditMode(false); setEditItems([]); }} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${COLORS.border}`, fontSize:12, fontWeight:600, cursor:"pointer", background:COLORS.white, color:COLORS.body }}>Cancel</button>
                <button onClick={handleSave} style={{ padding:"6px 16px", borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color:"white", boxShadow:`0 3px 10px ${COLORS.brand}40` }}>✓ Save</button>
              </>
            ) : (
              <>
                <button onClick={() => openEdit(quot.id)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${COLORS.brand}`, fontSize:12, fontWeight:600, cursor:"pointer", background:COLORS.brandL, color:COLORS.brand }}>✎ Edit</button>
                <button onClick={() => setDeleteTarget(quot.id)} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #FECACA", fontSize:12, fontWeight:600, cursor:"pointer", background:"#FEF2F2", color:"#DC2626" }}>🗑</button>
              </>
            )}
          </div>
        </div>

        {editMode && (
          <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"9px 14px", fontSize:12, color:"#92400E", display:"flex", alignItems:"center", gap:8 }}>
            ✏️ Editing <strong>{quot.id}</strong> — click <strong>Save</strong> to confirm changes.
          </div>
        )}

        {/* Main content: doc + sidebar — stacks on mobile/tablet */}
        <div className="quot-detail-grid">

          {/* Quotation document — scrollable on mobile */}
          <QuotationDocView
            quot={quot} editMode={editMode}
            editData={editData} setEditData={setEditData}
            editItems={editMode ? editItems : quot.items}
            setEditItems={setEditItems}
          />

          {/* Sidebar */}
          <div className="quot-detail-sidebar">
            {!editMode && (
              <div style={{ background:COLORS.white, borderRadius:12, border:`1px solid ${COLORS.border}`, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize:13, fontWeight:700, color:COLORS.h1, marginBottom:10 }}>Actions</div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <button className="btn" onClick={() => openModal("send_quotation",{id:quot.id})} style={{ width:"100%", padding:"9px", borderRadius:8, background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color:"white", fontSize:12, fontWeight:700, border:"none", boxShadow:`0 3px 10px ${COLORS.brand}40` }}>📧 Send to Customer</button>
                  <button className="btn" onClick={() => setShowPDF(true)} style={{ width:"100%", padding:"9px", borderRadius:8, background:"#F0F9FF", border:"1px solid #BAE6FD", color:"#0369A1", fontSize:12, fontWeight:700 }}>📥 Download PDF</button>
                  <button className="btn" onClick={() => openModal("convert_to_job",{id:quot.id})} style={{ width:"100%", padding:"9px", borderRadius:8, background:"#F0FDF4", border:"1px solid #BBF7D0", color:"#16A34A", fontSize:12, fontWeight:700 }}>✓ Convert to Job</button>
                </div>
              </div>
            )}
            {!editMode && (
              <div style={{ background:COLORS.white, borderRadius:12, border:`1px solid ${COLORS.border}`, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize:13, fontWeight:700, color:COLORS.h1, marginBottom:10 }}>Update Status</div>
                {["draft","sent","approved","rejected"].map(s => {
                  const m = QUOT_STATUS[s];
                  return <button key={s} className="btn" onClick={() => openModal("report",{title:`Update to ${m.label}`})} style={{ width:"100%", marginBottom:5, padding:"8px 12px", borderRadius:8, background:quot.status===s?m.bg:"#F9FAFB", color:quot.status===s?m.color:COLORS.muted, fontSize:12, fontWeight:quot.status===s?700:500, textAlign:"left", border:`1px solid ${quot.status===s?m.color+"30":COLORS.border}` }}>{quot.status===s?"● ":"→ "}{m.label}</button>;
                })}
              </div>
            )}
            <div style={{ background:COLORS.white, borderRadius:12, border:`1px solid ${editMode?COLORS.brand:COLORS.border}`, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,.05)", transition:"border-color .2s" }}>
              <div style={{ fontSize:13, fontWeight:700, color:COLORS.h1, marginBottom:10 }}>
                Quote Info{editMode && <span style={{ fontSize:11, fontWeight:400, color:COLORS.brand, marginLeft:8 }}>← edit in doc</span>}
              </div>
              {[["Quote ID",quot.id],["Created",editMode?(editData.created||quot.created):quot.created],["Valid Till",editMode?(editData.valid||quot.valid):quot.valid],["Status",quot.status],["Items",`${quot.items.length} line items`]].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${COLORS.border}`, fontSize:12, gap:8 }}>
                  <span style={{ color:COLORS.muted, flexShrink:0 }}>{k}</span>
                  <span style={{ fontWeight:600, color:COLORS.h2, fontFamily:k==="Quote ID"?FONTS.mono:FONTS.sans, textAlign:"right" }}>{v}</span>
                </div>
              ))}
            </div>
            {editMode && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button onClick={handleSave} style={{ width:"100%", padding:"10px", borderRadius:8, border:"none", fontSize:13, fontWeight:700, cursor:"pointer", background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color:"white", boxShadow:`0 4px 12px ${COLORS.brand}40` }}>✓ Save Changes</button>
                <button onClick={() => { setEditMode(false); setEditItems([]); }} style={{ width:"100%", padding:"10px", borderRadius:8, border:`1px solid ${COLORS.border}`, fontSize:13, fontWeight:600, cursor:"pointer", background:COLORS.white, color:COLORS.body }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <PDFPreview open={showPDF} onClose={() => setShowPDF(false)} title={quot.id} filename={`quotation-${quot.id}`} template="quotation" data={quot} />
      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => { handleDelete(deleteTarget); setOpen(null); }} onCancel={() => setDeleteTarget(null)} message="This quotation will be permanently removed and cannot be recovered!" />
    </>
  );

  // ── List view ─────────────────────────────────────────────────────────────
  const counts = {
    total:    quotations.length,
    sent:     quotations.filter(q => q.status === "sent").length,
    approved: quotations.filter(q => q.status === "approved").length,
    value:    quotations.filter(q => q.status === "approved").reduce((s, q) => s + q.total, 0),
  };

  return (
    <>
      <div className="fi" style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <SectionHdr title="Quotations" sub={`${total} of ${quotations.length} quotes`} />
          <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
            <button
              onClick={() => magicImport.setPanelOpen(v => !v)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 12px', borderRadius:8, fontSize:12, fontWeight:600, background: magicImport.panelOpen ? '#FFF3E0' : COLORS.white, border:`1.5px solid ${magicImport.panelOpen ? '#E65100' : COLORS.border}`, color: magicImport.panelOpen ? '#E65100' : COLORS.body, cursor:'pointer', transition:'all .2s' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M5 5L8 2l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12v2H2z" fill="currentColor" opacity=".25"/></svg>
              Magic Import
              <span style={{ fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:10, background:'#E65100', color:'white', letterSpacing:.5 }}>AI</span>
            </button>
            <button onClick={() => openModal("new_quotation")} style={{ padding:"7px 14px", borderRadius:8, border:"none", fontSize:13, fontWeight:700, background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color:"white", cursor:"pointer", boxShadow:`0 3px 10px ${COLORS.brand}40`, whiteSpace:"nowrap" }}>
              + New Quotation
            </button>
          </div>
        </div>

        {magicImport.panelOpen && <MagicImportPanel {...magicImport} />}

        {/* KPI cards — responsive grid */}
        <div className="quot-kpi-grid">
          <KCard label="Total Quotes"   value={counts.total}    sub="all time"             icon="📄" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
          <KCard label="Sent / Pending" value={counts.sent}     sub="awaiting reply"       icon="📤" iconBg="#EFF6FF" color="#3B82F6"      delay="1" />
          <KCard label="Approved"       value={counts.approved} sub="converted to jobs"    icon="✅" iconBg="#F0FDF4" color="#16A34A"      delay="2" />
          <KCard label="Total Value"    value={`₹${(counts.value/1000).toFixed(0)}K`}      sub="approved quotes only" icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="3" />
        </div>

        {/* Table */}
        <div style={{ background:COLORS.white, borderRadius:14, border:`1px solid ${COLORS.border}`, boxShadow:"0 1px 4px rgba(0,0,0,.05)", overflow:"clip" }}>
          <div style={{ padding:'12px 18px', borderBottom:`1px solid ${COLORS.border}`, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
             {/* Search bar — full width on mobile */}
          <div style={{ width: isMobile ? '60%' : 'auto' }}>
<TableSearchBar value={q} onChange={setQ} placeholder="Search by customer, contact, type…" />
          </div>
            
            <FilterSelect value={activeFilters.type}   onChange={val => setFilter("type",   val)} options={["Service","Repair","Installation","AMC"]} allLabel="All Types" />
            <FilterSelect value={activeFilters.status} onChange={val => setFilter("status", val)} options={["draft","sent","approved","rejected","Expired"]} allLabel="All Status" />
            <div style={{ marginLeft:'auto' }}><ExportDropdown {...exportProps} /></div>
          </div>
          <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
              <Thead cols={["Quote ID","Customer","Contact","Type","Items","Subtotal","GST","Total","Valid Till","Status",""]} />
              <tbody>
                {paginated.map((q, i) => (
                  <tr key={q.id} className="row" 
                    style={{ borderBottom:`1px solid ${COLORS.border}22`, background:i%2===0?COLORS.white:"#FAFAFA" }}>
                    <td style={{ padding:"13px 14px" }}><span style={{ fontFamily:FONTS.mono, fontSize:12, fontWeight:600, color:COLORS.brand }}>{q.id}</span></td>
                    <td style={{ padding:"13px 14px", fontSize:13, fontWeight:700, color:COLORS.h1 }}>{q.customer}</td>
                    <td style={{ padding:"13px 14px" }}>
                      <div style={{ fontSize:12, color:COLORS.body }}>{q.contact}</div>
                      <div style={{ fontSize:11, color:COLORS.faint, fontFamily:FONTS.mono }}>{q.phone}</div>
                    </td>
                    <td style={{ padding:"13px 14px" }}><TypeTag type={q.type} /></td>
                    <td style={{ padding:"13px 14px" }}><span style={{ fontFamily:FONTS.mono, fontSize:13, color:COLORS.muted }}>{q.items.length} items</span></td>
                    <td style={{ padding:"13px 14px" }}><span style={{ fontFamily:FONTS.mono, fontSize:13 }}>₹{q.subtotal.toLocaleString()}</span></td>
                    <td style={{ padding:"13px 14px" }}><span style={{ fontFamily:FONTS.mono, fontSize:13, color:COLORS.muted }}>₹{q.gst.toLocaleString()}</span></td>
                    <td style={{ padding:"13px 14px" }}><span style={{ fontFamily:FONTS.mono, fontSize:14, fontWeight:800, color:COLORS.brand }}>₹{q.total.toLocaleString()}</span></td>
                    <td style={{ padding:"13px 14px", fontSize:12, color:q.status==="expired"?"#DC2626":COLORS.muted }}>{q.valid}</td>
                    <td style={{ padding:"13px 14px" }}><SBadge s={q.status} map={QUOT_STATUS} /></td>
                    <td style={{ padding:"13px 14px" }} onClick={e => e.stopPropagation()}>
                      <ActionDropdown onView={() => openView(q.id)} onEdit={() => openEdit(q.id)} onDelete={() => setDeleteTarget(q.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        </div>
      </div>

      <PDFPreview open={showExportPDF} onClose={() => setShowExportPDF(false)} title="Quotations Export" filename="quotations-export" template="generic_list" data={{ title:"Quotations", columns:QUOT_COLUMNS, rows:filteredQuots }} />
      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} message="This quotation will be permanently removed and cannot be recovered!" />
    </>
  );
};

export default QuotationsPage;