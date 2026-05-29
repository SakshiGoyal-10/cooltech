import { useState, useEffect } from 'react';
import { contractsApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { PROJECTS, PROJ_STATUS_MAP } from '../../data/mockData';

// ─── ProjectCard ──────────────────────────────────────────────────────────────

const ProjectCard = ({ proj, onSelect }) => {
  const st = PROJ_STATUS_MAP[proj.status] || { label: proj.status, color: "#6B7280", bg: "#F3F4F6" };
  const progress = proj.progress ?? 0;
  return (
    <div
      onClick={() => onSelect(proj)}
      style={{
        background: COLORS.white,
        borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        padding: "18px 20px",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
        cursor: "pointer",
        transition: "box-shadow .15s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: COLORS.brand }}>{proj.id}</span>
            <span style={{ padding: "2px 8px", borderRadius: 99, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700 }}>{st.label}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.h1, marginBottom: 3 }}>{proj.name || proj.title}</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>{proj.client || proj.customer}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 11, color: COLORS.faint }}>Value</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono }}>
            ₹{proj.value?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.faint, marginBottom: 4 }}>
          <span>Progress</span><span style={{ fontWeight: 700, color: COLORS.h2 }}>{progress}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "#E2E8F0", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${COLORS.brand},${COLORS.brandD})` }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.faint }}>
        <span>👤 {proj.manager || proj.assignedTo || "—"}</span>
        <span>📅 {proj.deadline || proj.endDate || "—"}</span>
      </div>
    </div>
  );
};

// ─── ProjectDetail ────────────────────────────────────────────────────────────

const ProjectDetail = ({ proj, onBack }) => {
  const st = PROJ_STATUS_MAP[proj.status] || { label: proj.status, color: "#6B7280", bg: "#F3F4F6" };
  const progress = proj.progress ?? 0;
  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <BackBtn onClick={onBack} />
        <span style={{ fontSize: 14, color: COLORS.muted }}>Projects /</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.brand, fontFamily: FONTS.mono }}>{proj.id}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ padding: "3px 10px", borderRadius: 99, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700 }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1, marginBottom: 4 }}>{proj.name || proj.title}</div>
            <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16 }}>{proj.client || proj.customer} · Manager: {proj.manager || proj.assignedTo || "—"}</div>

            {/* Progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.faint, marginBottom: 6 }}>
                <span>Overall Progress</span><span style={{ fontWeight: 800, color: COLORS.h2 }}>{progress}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "#E2E8F0", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${COLORS.brand},${COLORS.brandD})` }} />
              </div>
            </div>

            {/* Description */}
            {proj.description && (
              <div style={{ fontSize: 13, color: COLORS.h2, lineHeight: 1.6, padding: "12px 14px", background: "#F8FAFC", borderRadius: 9, border: `1px solid ${COLORS.border}` }}>
                {proj.description}
              </div>
            )}
          </div>

          {/* Milestones */}
          {proj.milestones?.length > 0 && (
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Milestones</div>
              {proj.milestones.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 16 }}>{m.done ? "✅" : "⬜"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: m.done ? COLORS.muted : COLORS.h1, textDecoration: m.done ? "line-through" : "none" }}>{m.title}</div>
                    {m.date && <div style={{ fontSize: 11, color: COLORS.faint }}>{m.date}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Project Info</div>
            {[
              ["Client", proj.client || proj.customer || "—"],
              ["Manager", proj.manager || proj.assignedTo || "—"],
              ["Start Date", proj.startDate || proj.start || "—"],
              ["Deadline", proj.deadline || proj.endDate || "—"],
              ["Value", proj.value ? `₹${proj.value.toLocaleString()}` : "—"],
              ["Status", st.label],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 11, color: COLORS.faint }}>{k}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.h2, maxWidth: 130, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ProjectsPage ─────────────────────────────────────────────────────────────

const ProjectsPage = ({ openModal }) => {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  if (selected) return <ProjectDetail proj={selected} onBack={() => setSelected(null)} />;
  const filtered = filter === "all" ? PROJECTS : PROJECTS.filter(p => p.status === filter);
  const totalVal = PROJECTS.reduce((a, p) => a + p.value, 0);
  const activeProjs = PROJECTS.filter(p => p.status === "active");
  return (
    <div className="fu">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Projects</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Large installation & contract project management</div>
        </div>
        <button className="btn" onClick={() => openModal("new_amc")} style={{ padding: "9px 20px", borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}>+ New Project</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Projects", value: PROJECTS.length, icon: "🏗", color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Active", value: activeProjs.length, icon: "⚡", color: COLORS.brand, bg: COLORS.brandL },
          { label: "Completed", value: PROJECTS.filter(p => p.status === "completed").length, icon: "✅", color: "#22C55E", bg: "#F0FDF4" },
          { label: "Total Value", value: `₹${(totalVal / 1000).toFixed(0)}K`, icon: "💰", color: "#8B5CF6", bg: "#F5F3FF" },
        ].map(s => <KCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} iconBg={s.bg} />)}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["all", "active", "completed", "paused"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 8, background: filter === f ? COLORS.brand : "#F1F5F9", color: filter === f ? "white" : COLORS.muted, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", transition: "all .15s" }}>
            {f === "all" ? "All" : PROJ_STATUS_MAP[f]?.label || f}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))", gap: 14 }}>
        {filtered.map(p => <ProjectCard key={p.id} proj={p} onSelect={setSelected} />)}
      </div>
    </div>
  );
};

export default ProjectsPage;