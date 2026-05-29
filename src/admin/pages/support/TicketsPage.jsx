import { TKT_STATUS, TKT_PRIORITY, TKT_CATEGORIES } from '../../constants/statusMaps';
import { ticketsApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { KCard, BackBtn } from '../../components/ui/Cards';
import { NewTicketModal } from '../../components/modals/Modals'; // ← import

// ─── TicketsPage ───────────────────────────────────────────────────────────────

const TicketsPage = ({ openModal }) => {
  const [tickets, setTickets] = useState([]);
  useEffect(() => {
  ticketsApi.list({ limit: 200 })
    .then(r => setTickets(
      (r.data ?? []).map(t => ({ ...t, id: t.id || t._id })) // ← normalise _id → id
    ))
    .catch(() => {});
}, []);
  const [open,          setOpen]          = useState(null);
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [reply,         setReply]         = useState("");

  // ── NEW: local state for the New Ticket modal ──────────────────────────────
  const [showNewTicket, setShowNewTicket] = useState(false);

  const ticket = open ? tickets.find(t => (t.id ?? t._id) === open) : null;
  const filtered = filterStatus === "all" ? tickets : tickets.filter(t => t.status === filterStatus);

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (ticket) {
    const st  = TKT_STATUS[ticket.status]    || TKT_STATUS.open;
    const pr  = TKT_PRIORITY[ticket.priority] || TKT_PRIORITY.medium;
    const cat = TKT_CATEGORIES[ticket.category] || TKT_CATEGORIES.general;

    return (
      <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackBtn onClick={() => setOpen(null)} />
          <span style={{ fontSize: 14, color: COLORS.muted }}>Support Tickets /</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.brand, fontFamily: FONTS.mono }}>{ticket.id}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Header card */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <span className="badge" style={{ background: st.bg,  color: st.color  }}>{st.label}</span>
                <span className="badge" style={{ background: pr.bg,  color: pr.color  }}>{pr.label}</span>
                <span className="badge" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.h1, marginBottom: 4 }}>{ticket.subject}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                {ticket.customer} · SLA: {ticket.sla} · Assigned: {ticket.assignedTo}
              </div>
            </div>

            {/* Conversation card */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>Conversation</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {ticket.messages.map((m, i) => (
                  <div key={m.id ?? `msg-${i}`} style={{ display: "flex", gap: 10, flexDirection: m.isClient ? "row" : "row-reverse" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: m.isClient ? "#EFF6FF" : "#FFF7ED",
                      border: `1.5px solid ${m.isClient ? "#BFDBFE" : "#FED7AA"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, flexShrink: 0,
                    }}>
                      {m.isClient ? "👤" : "🛠"}
                    </div>
                    <div style={{ maxWidth: "70%" }}>
                      <div style={{ fontSize: 10, color: COLORS.faint, marginBottom: 3, textAlign: m.isClient ? "left" : "right" }}>
                        {m.from} · {m.time}
                      </div>
                      <div style={{
                        background: m.isClient ? COLORS.white : `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
                        color: m.isClient ? COLORS.h2 : "white",
                        padding: "10px 14px",
                        borderRadius: m.isClient ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                        fontSize: 13, lineHeight: 1.5,
                        border: m.isClient ? `1px solid ${COLORS.border}` : "none",
                        boxShadow: "0 1px 4px rgba(0,0,0,.07)",
                      }}>
                        {m.msg}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {ticket.status !== "closed" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    rows={2}
                    style={{
                      flex: 1, padding: "10px 12px", borderRadius: 9,
                      border: `1px solid ${COLORS.border}`,
                      fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h2, resize: "none",
                    }}
                  />
                  <button className="btn" onClick={() => setReply("")} style={{
                    padding: "10px 18px", borderRadius: 9,
                    background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
                    color: "white", fontSize: 13, fontWeight: 700, alignSelf: "flex-end",
                  }}>Send</button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Ticket info */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Ticket Info</div>
              {[
                ["Customer",  ticket.customer],
                ["Contact",   ticket.contact],
                ["Phone",     ticket.phone],
                ["Created",   ticket.created],
                ["Updated",   ticket.updated],
                ["Assigned",  ticket.assignedTo],
                ["Linked Job", ticket.job || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 11, color: COLORS.faint }}>{k}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.h2, maxWidth: 130, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Update Status */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, marginBottom: 8 }}>Update Status</div>
              {Object.entries(TKT_STATUS).map(([k, s]) => (
                <button key={k} className="btn"
                  onClick={() => openModal("report", { title: `Mark as ${s.label}`, format: "Update" })}
                  style={{
                    width: "100%", marginBottom: 5, padding: "8px 12px", borderRadius: 7,
                    background: ticket.status === k ? s.bg : "#F9FAFB",
                    color: ticket.status === k ? s.color : COLORS.muted,
                    fontSize: 12, fontWeight: ticket.status === k ? 700 : 500,
                    textAlign: "left", border: `1px solid ${ticket.status === k ? s.color + "30" : COLORS.border}`,
                  }}>
                  {ticket.status === k ? "● " : "○ "}{s.label}
                </button>
              ))}
            </div>

            <button className="btn" onClick={() => openModal("new_job")} style={{
              padding: "10px", borderRadius: 9,
              background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`,
              color: COLORS.brand, fontSize: 12, fontWeight: 700, width: "100%",
            }}>
              🔧 Create Work Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  const openCount     = tickets.filter(t => t.status === "open").length;
  const inProgCount   = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  return (
    <div className="fu">

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Support Tickets</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Customer support requests &amp; issue resolution</div>
        </div>

        {/* ── CHANGED: now opens NewTicketModal instead of ReportModal ── */}
        <button className="btn" onClick={() => setShowNewTicket(true)} style={{
          padding: "9px 20px", borderRadius: 9,
          background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
          color: "white", fontSize: 13, fontWeight: 700,
          boxShadow: `0 3px 10px ${COLORS.brand}40`,
        }}>
          + New Ticket
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Open",         value: openCount,     icon: "🔴", color: "#DC2626", bg: "#FEF2F2" },
          { label: "In Progress",  value: inProgCount,   icon: "🟡", color: "#B45309", bg: "#FFFBEB" },
          { label: "Resolved",     value: resolvedCount, icon: "🟢", color: "#166534", bg: "#F0FDF4" },
          { label: "Avg Response", value: "2.3h",        icon: "⚡", color: "#3B82F6", bg: "#EFF6FF" },
        ].map(s => <KCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} iconBg={s.bg} />)}
      </div>

      {/* ── Status filters ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["all", "open", "in_progress", "resolved", "closed"].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} style={{
            padding: "6px 14px", borderRadius: 8,
            background: filterStatus === f ? COLORS.brand : "#F1F5F9",
            color: filterStatus === f ? "white" : COLORS.muted,
            fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", transition: "all .15s",
          }}>
            {f === "all" ? "All" : TKT_STATUS[f]?.label || f}
          </button>
        ))}
      </div>

      {/* ── Ticket list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(t => {
          const st  = TKT_STATUS[t.status]      || TKT_STATUS.open;
          const pr  = TKT_PRIORITY[t.priority]   || TKT_PRIORITY.medium;
          const cat = TKT_CATEGORIES[t.category] || TKT_CATEGORIES.general;

          return (
            <div key={t.id} className="card" onClick={() => setOpen(t.id || t._id)} style={{
              background: COLORS.white, borderRadius: 12,
              border: `1px solid ${COLORS.border}`, padding: "14px 18px",
              boxShadow: "0 1px 4px rgba(0,0,0,.05)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: cat.bg, border: `1.5px solid ${cat.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>
                {t.category === "breakdown" ? "⚡"
                  : t.category === "quality"   ? "🔧"
                  : t.category === "billing"   ? "💰"
                  : "📅"}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: COLORS.brand }}>{t.id}</span>
                  <span key="status"   className="badge" style={{ background: st.bg,  color: st.color  }}>{st.label}</span>
                  <span key="priority" className="badge" style={{ background: pr.bg,  color: pr.color  }}>{pr.label}</span>
                  <span key="category" className="badge" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 2 }}>{t.subject}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>
                  {t.customer} · Assigned: {t.assignedTo} · SLA: {t.sla}
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 4 }}>{t.messages.length} msgs</div>
                <div style={{ fontSize: 11, color: COLORS.faint }}>{t.updated}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── NEW TICKET MODAL (renders locally — no longer uses generic ReportModal) ── */}
      <NewTicketModal
        open={showNewTicket}
        onClose={() => setShowNewTicket(false)}
        onSave={() => setShowNewTicket(false)}
      />
    </div>
  );
};

export default TicketsPage;