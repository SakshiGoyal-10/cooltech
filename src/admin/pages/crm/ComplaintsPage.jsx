import { COMP_STATUS } from '../../constants/statusMaps';
import { complaintsApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';

// ─── FIX: normalize raw API complaint row ─────────────────────────────────────
// Guarantees id, status, customer, tech, job are always defined strings
// so key={comp.id} and COMP_STATUS[comp.status] never receive undefined.
const normalizeComplaint = (c, idx) => ({
  ...c,
  id:       c.id       ?? c._id        ?? c.complaintId ?? `comp-${idx}`,
  status:   (c.status  ?? 'open').toLowerCase(),
  customer: typeof c.customer    === 'object' ? (c.customer?.name    ?? 'Unknown') : (c.customer    || 'Unknown'),
  tech:     typeof c.technician  === 'object' ? (c.technician?.name  ?? 'Unassigned') : (c.tech     || c.techName || 'Unassigned'),
  job:      typeof c.job         === 'object' ? (c.job?.id           ?? '—') : (c.job           || c.jobId || '—'),
  date:     c.date ?? (c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
});

// ─── ComplaintsPage ───────────────────────────────────────────────────────────
const ComplaintsPage = ({ openModal }) => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter]         = useState("all");

  useEffect(() => {
    complaintsApi.list({ limit: 200 })
      .then(r => setComplaints((r.data ?? []).map(normalizeComplaint)))
      .catch(() => {});
  }, []);

  const shown      = filter === "all" ? complaints : complaints.filter(c => c.status === filter);
  const openC      = complaints.filter(c => c.status === "open").length;
  const inProgC    = complaints.filter(c => c.status === "in_progress").length;
  const resolvedC  = complaints.filter(c => c.status === "resolved").length;
  const closedC    = complaints.filter(c => c.status === "closed").length;

  // FIX: safe accessor — COMP_STATUS may not have a key for every status string
  // the API returns, so fall back to a neutral colour instead of crashing.
  const statusDot = (status) => COMP_STATUS[status]?.dot ?? "#E5E7EB";

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ── */}
      <SectionHdr
        title="Complaints & Feedback"
        sub={`${complaints.length} total · ${openC} open`}
        action="+ Log Complaint"
        onAction={() => openModal("assign_complaint", { id: "New" })}
      />

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KCard label="Open"           value={openC}      sub="need resolution"  icon="🔴" iconBg="#FEF2F2" color="#DC2626" delay=""  />
        <KCard label="In Progress"    value={inProgC}    sub="being resolved"   icon="🟡" iconBg="#FFFBEB" color="#B45309" delay="1" />
        <KCard label="Resolved"       value={resolvedC}  sub="this month"       icon="🟢" iconBg="#F0FDF4" color="#16A34A" delay="2" />
        <KCard label="Avg Resolution" value="2.3 days"   sub="response time"    icon="⏱" iconBg="#EFF6FF" color="#0369A1" delay="3" />
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          ["all",         "All",         complaints.length],
          ["open",        "Open",        openC],
          ["in_progress", "In Progress", inProgC],
          ["resolved",    "Resolved",    resolvedC],
          ["closed",      "Closed",      closedC],
        ].map(([k, l, c]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: filter === k ? COLORS.brandL : COLORS.white, color: filter === k ? COLORS.brand : COLORS.muted, border: `1px solid ${filter === k ? COLORS.brand : COLORS.border}`, cursor: "pointer", display: "flex", gap: 5, alignItems: "center" }}
          >
            {l}
            <span style={{ fontSize: 10, background: filter === k ? `${COLORS.brand}20` : "#F3F4F6", color: filter === k ? COLORS.brand : COLORS.faint, padding: "1px 6px", borderRadius: 99 }}>
              {c}
            </span>
          </button>
        ))}
      </div>

      {/* ── Complaint cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: COLORS.faint, background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
            No complaints match this filter.
          </div>
        )}
        {shown.map(comp => (
          // FIX: key={comp.id} is now always a defined unique string from normalizeComplaint
          <div
            key={comp.id}
            style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)", borderLeft: `3px solid ${statusDot(comp.status)}` }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.brand }}>{comp.id}</span>
                  <SBadge s={comp.status} map={COMP_STATUS} />
                  <SevBadge s={comp.severity} />
                  <TypeTag type={comp.category} />
                  <span style={{ fontSize: 11, color: COLORS.faint }}>{comp.date}</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                  <div><span style={{ fontSize: 11, color: COLORS.faint }}>Customer: </span><span style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>{comp.customer}</span></div>
                  <div><span style={{ fontSize: 11, color: COLORS.faint }}>Technician: </span><span style={{ fontSize: 12, fontWeight: 600, color: COLORS.body }}>{comp.tech}</span></div>
                  <div><span style={{ fontSize: 11, color: COLORS.faint }}>Job: </span><span style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.brand }}>{comp.job}</span></div>
                </div>
                <div style={{ fontSize: 13, color: COLORS.body, lineHeight: 1.6, marginBottom: comp.resolution ? 10 : 0 }}>{comp.desc}</div>
                {comp.resolution && (
                  <div style={{ padding: "9px 12px", borderRadius: 7, background: "#F0FDF4", border: "1px solid #BBF7D0", fontSize: 12, color: "#166534" }}>
                    <strong>Resolution: </strong>{comp.resolution}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 16 }}>
                {comp.status === "open" && (
                  <button className="btn" onClick={() => openModal("assign_complaint", { id: comp.id })} style={{ padding: "6px 14px", borderRadius: 7, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 12, fontWeight: 700 }}>
                    Assign
                  </button>
                )}
                {["open", "in_progress"].includes(comp.status) && (
                  <button className="btn" onClick={() => openModal("resolve_complaint", { id: comp.id })} style={{ padding: "6px 14px", borderRadius: 7, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", fontSize: 12, fontWeight: 700 }}>
                    Resolve
                  </button>
                )}
                <button className="btn" onClick={() => openModal("assign_complaint", { id: comp.id })} style={{ padding: "6px 14px", borderRadius: 7, background: "#F8FAFC", border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 12 }}>
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ComplaintsPage;