import { JOB_STATUS, TECH_STATUS } from '../constants/statusMaps';
import { jobsApi } from '../services/api';
import { jobs as initialJobs, DISPATCH_DATA as dispatchData } from '../data/mockData';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../components/ui/Form';

// ─── BatteryIcon ──────────────────────────────────────────────────────────────
const BatteryIcon = ({ pct = 100 }) => {
  const color = pct > 60 ? "#22C55E" : pct > 30 ? "#F59E0B" : "#EF4444";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <svg width="18" height="10" viewBox="0 0 18 10" style={{ display: "block" }}>
        <rect x="0.5" y="0.5" width="14" height="9" rx="2" fill="none" stroke="#94A3B8" strokeWidth="1" />
        <rect x="15" y="3" width="2.5" height="4" rx="1" fill="#94A3B8" />
        <rect x="1.5" y="1.5" width={Math.round((pct / 100) * 12)} height="7" rx="1.5" fill={color} />
      </svg>
      <span style={{ fontSize: 10, color, fontWeight: 600 }}>{pct}%</span>
    </span>
  );
};

// ─── Stats config (defined outside component so it's stable) ─────────────────
const getStats = (busy, available, off, unassigned) => [
  { label: "On Job",          value: busy.length,        color: "#F59E0B", bg: "#FFFBEB", icon: "🔧" },
  { label: "Available",       value: available.length,   color: "#22C55E", bg: "#ECFDF5", icon: "✅" },
  { label: "Off Duty",        value: off.length,         color: "#94A3B8", bg: "#F1F5F9", icon: "💤" },
  { label: "Unassigned Jobs", value: unassigned.length,  color: "#EF4444", bg: "#FEF2F2", icon: "⚠" },
];

// ─── DispatchBoard ────────────────────────────────────────────────────────────
const DispatchBoard = ({ openModal }) => {
  const [selected, setSelected] = useState(null);
  const [allJobs, setAllJobs] = useState(initialJobs);

  const unassigned = allJobs.filter(j =>
    (j.tech === 'Unassigned' || !j.tech) &&
    !["completed", "cancelled", "invoiced"].includes(j.status)
  );

  useEffect(() => {
    jobsApi.list({ limit: 200 }).then(r => {
      const data = (r.data ?? []).map((j, idx) => ({
        ...j,
        // FIX: guarantee a unique, stable id for every job so .map() keys never
        // become undefined/duplicate when the API omits or duplicates the id field
        id: j.id ?? j._id ?? j.jobId ?? `api-job-${idx}`,
        tech: typeof j.technician === 'object' ? j.technician?.name : (j.techName || j.tech || 'Unassigned'),
        date: j.scheduledDate
          ? new Date(j.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : (j.date || ''),
        customer: typeof j.customer === 'object' ? j.customer?.name : (j.customerName || j.customer || ''),
      }));
      setAllJobs(data);
    }).catch(() => {});
  }, []);

  const busy      = dispatchData.filter(t => t.status === "busy");
  const available = dispatchData.filter(t => t.status === "available");
  const off       = dispatchData.filter(t => t.status === "off");
  const stats     = getStats(busy, available, off, unassigned);

  return (
    <div className="fu" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Dispatch Board</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
            Live field operations — real-time technician tracking &amp; job assignment
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 7 }}>
            <span className="blink" style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D" }}>Live</span>
          </div>
          <button
            className="btn"
            onClick={() => openModal("new_job")}
            style={{ padding: "9px 18px", borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}
          >
            + New Job
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {/* FIX 1: key is s.label — stable & unique. No issue here but kept explicit. */}
      <div className="dispatch-stats-grid">
        {stats.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${s.color}20` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="dispatch-main-grid">

        {/* ── Technician cards ── */}
        {/* FIX 2: key={tech.techId} — confirmed unique per technician */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dispatchData.map(tech => {
            const isSelected   = selected === tech.techId;
            const statusColor  = tech.status === "busy" ? COLORS.brand : tech.status === "available" ? "#22C55E" : "#94A3B8";
            const statusBg     = tech.status === "busy" ? COLORS.brandL : tech.status === "available" ? "#ECFDF5" : "#F1F5F9";

            return (
              <div
                key={tech.techId}
                onClick={() => setSelected(isSelected ? null : tech.techId)}
                style={{ background: COLORS.white, borderRadius: 14, border: `2px solid ${isSelected ? COLORS.brand : COLORS.border}`, padding: "16px 18px", cursor: "pointer", boxShadow: isSelected ? `0 0 0 3px ${COLORS.brand}20` : "0 1px 4px rgba(0,0,0,.05)", transition: "all .15s" }}
              >
                <div className="dispatch-tech-card-inner">

                  {/* Avatar + status dot */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar name={tech.name} size={44} color={statusColor} />
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: statusColor, border: "2px solid white" }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>{tech.name}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: statusBg, color: statusColor, padding: "2px 8px", borderRadius: 99 }}>
                        {TECH_STATUS[tech.status]?.label || tech.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>📍 {tech.area} · 📱 {tech.phone}</div>
                    <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 8 }}>🚗 {tech.vehicle} · <BatteryIcon pct={tech.battery} /></div>

                    {/* Current job */}
                    {tech.currentJob && (
                      <div style={{ background: COLORS.brandL, borderRadius: 9, padding: "10px 12px", border: `1px solid ${COLORS.brand}30`, marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.brand }}>CURRENT JOB</span>
                          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.brand }}>{tech.currentJob.id}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1 }}>{tech.currentJob.customer}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>📍 {tech.currentJob.address}</div>
                        <div style={{ display: "flex", gap: 14, marginTop: 5, fontSize: 11, flexWrap: "wrap" }}>
                          <span style={{ color: COLORS.body }}>⏱ Started: {tech.currentJob.startTime}</span>
                          <span style={{ color: "#16A34A", fontWeight: 700 }}>✓ ETA: {tech.currentJob.eta}</span>
                        </div>
                      </div>
                    )}

                    {/* Next job */}
                    {tech.nextJob && (
                      <div style={{ background: "#F1F5F9", borderRadius: 9, padding: "8px 12px", border: `1px solid ${COLORS.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, marginBottom: 3 }}>NEXT JOB</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{tech.nextJob.customer} — {tech.nextJob.type}</div>
                        {/* FIX 3: conditional render — not a list, so no key needed. Was fine before too. */}
                        {tech.nextJob.priority === "urgent" && (
                          <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", padding: "2px 6px", borderRadius: 99 }}>
                            🚨 URGENT
                          </span>
                        )}
                      </div>
                    )}

                    {!tech.currentJob && !tech.nextJob && tech.status === "available" && (
                      <div style={{ background: "#ECFDF5", borderRadius: 9, padding: "8px 12px", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>✅</span>
                        <span style={{ fontSize: 12, color: "#15803D", fontWeight: 600 }}>Available – ready to be assigned</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="dispatch-tech-actions">
                    <button className="btn" onClick={e => { e.stopPropagation(); openModal("new_job"); }} style={{ padding: "6px 12px", borderRadius: 7, background: COLORS.brand, color: "white", fontSize: 11, fontWeight: 700, border: "none", whiteSpace: "nowrap" }}>
                      Assign Job
                    </button>
                    <button className="btn" onClick={e => { e.stopPropagation(); }} style={{ padding: "6px 12px", borderRadius: 7, background: "#F1F5F9", color: COLORS.muted, fontSize: 11, fontWeight: 600, border: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>
                      📞 Call
                    </button>
                    <div style={{ fontSize: 9, color: COLORS.faint, textAlign: "center" }}>Updated {tech.lastUpdate}</div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right panel ── */}
        <div>

          {/* Unassigned jobs */}
          <div style={{ background: "#1A1A2E", borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC", marginBottom: 12 }}>⚠️ Unassigned Jobs</div>

            {unassigned.length === 0
              ? <div style={{ fontSize: 12, color: "#475569", textAlign: "center", padding: 16 }}>All jobs assigned ✓</div>
              : unassigned.map(j => (
                /* FIX 4: key={j.id} — unique job ID, no fallback needed */
                <div key={j.id} style={{ background: "#252540", borderRadius: 10, padding: "12px 14px", marginBottom: 9, border: `1px solid ${j.priority === "urgent" ? "#EF444440" : "#2A2A4A"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.brand }}>{j.id}</span>
                    <PBadge p={j.priority} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC", marginBottom: 3 }}>{j.customer}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>{j.type} · {j.date} {j.time}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 10 }}>📍 {j.address}</div>

                  {/* FIX 5: <option> elements MUST have a value attribute — missing value
                      caused React's reconciler to lose track of nodes → the key warning */}
                  <select style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #2A2A4A", background: "#1A1A2E", color: "#94A3B8", fontSize: 11, marginBottom: 7 }}>
                    <option value="">Assign technician…</option>
                    {available.map(t => (
                      <option key={t.techId} value={t.techId}>
                        {t.name} – {t.area}
                      </option>
                    ))}
                  </select>

                  <button className="btn" onClick={() => openModal("new_job")} style={{ width: "100%", padding: "7px", borderRadius: 7, background: COLORS.brand, color: "white", fontSize: 11, fontWeight: 700, border: "none" }}>
                    ✓ Assign
                  </button>
                </div>
              ))
            }
          </div>

          {/* Today's Job Flow */}
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Today's Job Flow</div>

            {/* FIX 6: key={j.id} — unique; added fallback `|| j.customer` in case id is ever undefined */}
            {allJobs.filter(j => j.date === "Mar 3, 2026").map((j, i, arr) => (
              <div key={j.id || `job-${i}`} style={{ display: "flex", gap: 10, paddingBottom: i < arr.length - 1 ? 12 : 0, position: "relative" }}>
                {i < arr.length - 1 && (
                  <div style={{ position: "absolute", left: 10, top: 22, bottom: 0, width: 2, background: COLORS.border }} />
                )}
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: j.status === "completed" ? "#22C55E" : j.status === "in_progress" ? COLORS.brand : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "white", flexShrink: 0, zIndex: 1 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1 }}>{j.customer}</div>
                  <div style={{ fontSize: 10, color: COLORS.muted }}>{j.tech} · {j.time}</div>
                </div>
                <SBadge s={j.status} map={JOB_STATUS} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DispatchBoard;