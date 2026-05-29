import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { SM_POSTS, SM_CHANNELS } from '../../data/mockData';

// ─── Shared channel meta ───────────────────────────────────────────────────────
const CHANNEL_META = {
  facebook:  { emoji: "📘", color: "#1877F2" },
  instagram: { emoji: "📸", color: "#E1306C" },
  twitter:   { emoji: "🐦", color: "#1DA1F2" },
  linkedin:  { emoji: "💼", color: "#0A66C2" },
  youtube:   { emoji: "▶️", color: "#FF0000" },
  google:    { emoji: "⭐", color: "#FBBC05" },
};

const ChannelIcon = ({ id, size = 28 }) => {
  const meta = CHANNEL_META[id] || { emoji: "🌐", color: "#94A3B8" };
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: meta.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5 }}>
      {meta.emoji}
    </div>
  );
};

const ChannelChips = ({ channels = [] }) => (
  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
    {channels.map(ch => {
      const meta = CHANNEL_META[ch] || { emoji: "🌐", color: "#94A3B8" };
      return (
        <span key={ch} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: meta.color + "18", color: meta.color, fontWeight: 700 }}>
          {meta.emoji} {ch}
        </span>
      );
    })}
  </div>
);

const POST_STATUS = {
  published: { label: "Published", color: "#16A34A", bg: "#DCFCE7" },
  scheduled:  { label: "Scheduled",  color: "#1D4ED8", bg: "#DBEAFE" },
  draft:      { label: "Draft",      color: "#94A3B8", bg: "#F1F5F9" },
  failed:     { label: "Failed",     color: "#DC2626", bg: "#FEE2E2" },
};

const POST_TYPES = {
  Promotion:   { color: "#EA580C", bg: "#FFF7ED" },
  Update:      { color: "#1D4ED8", bg: "#EFF6FF" },
  Testimonial: { color: "#7C3AED", bg: "#F5F3FF" },
  Tips:        { color: "#16A34A", bg: "#F0FDF4" },
  Offer:       { color: "#B45309", bg: "#FFFBEB" },
  Event:       { color: "#0891B2", bg: "#ECFEFF" },
};

// ─── Column config for export ─────────────────────────────────────────────────
const POST_COLUMNS = [
  { label: 'ID',          key: 'id',          width: 12, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: '#EA580C', fontSize: 11 } },
  { label: 'Title',       key: 'title',        width: 24, tdStyle: { fontWeight: 600 } },
  { label: 'Type',        key: 'type',         width: 14, tdStyle: { fontSize: 12 } },
  { label: 'Channels',    key: 'channels',     width: 20, format: v => Array.isArray(v) ? v.join(', ') : v },
  { label: 'Scheduled At',key: 'scheduledAt',  width: 18, tdStyle: { fontSize: 12 } },
  { label: 'Status',      key: 'status',       width: 12, format: v => POST_STATUS[v]?.label ?? v },
  { label: 'Reach',       key: 'reach',        width: 10, format: v => v > 0 ? v.toLocaleString() : '—', tdStyle: { fontFamily: 'monospace' } },
  { label: 'Likes',       key: 'likes',        width: 8,  format: v => v > 0 ? v : '—', tdStyle: { fontFamily: 'monospace' } },
  { label: 'Comments',    key: 'comments',     width: 10, format: v => v > 0 ? v : '—', tdStyle: { fontFamily: 'monospace' } },
  { label: 'Shares',      key: 'shares',       width: 8,  format: v => v > 0 ? v : '—', tdStyle: { fontFamily: 'monospace' } },
  { label: 'Leads',       key: 'leads',        width: 8,  format: v => v > 0 ? v : '—', tdStyle: { fontFamily: 'monospace', fontWeight: 700 } },
];

// ─── PostSchedulerPage ─────────────────────────────────────────────────────────
const PostSchedulerPage = () => {
  const [view,         setView]         = useState("list");
  const [showCompose,  setShowCompose]  = useState(false);
  const [selChannels,  setSelChannels]  = useState([]);

  // ── Search + filters ──────────────────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: searchFiltered,
  } = useTableSearch(
    SM_POSTS,
    ['id', 'title', 'type', 'caption'],
    { type: '', status: '' }
  );

  const filtered = searchFiltered
    .filter(p => !activeFilters.type   || p.type   === activeFilters.type)
    .filter(p => !activeFilters.status || p.status === activeFilters.status)
    .filter(p => selChannels.length === 0 || p.channels.some(ch => selChannels.includes(ch)));

  // ── Pagination ────────────────────────────────────────────────────────────
  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filtered, 10);

  // ── Export ────────────────────────────────────────────────────────────────
  const { exportProps } = useExport({
    title:    "Post Scheduler",
    filename: "cooltech-posts",
    template: "generic_list",
    subtitle: `AC Services Platform · Social Media Posts · ${filtered.length} records`,
    docId:    "POSTS-EXPORT",
    columns:  POST_COLUMNS,
    rows:     filtered,
  });

  // ── Calendar helpers (unchanged) ─────────────────────────────────────────
  const DAYS    = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const calDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const getPostsForDay = (d) => SM_POSTS.filter(p => {
    const pd = p.scheduledAt.split(", 2026")[0];
    const dayMap = { "Mar 1": 1, "Mar 2": 2, "Mar 3": 3, "Mar 5": 5, "Mar 8": 8, "Feb 28": 28, "Feb 25": 25 };
    return dayMap[pd] === d;
  });

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Post Scheduler</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Plan and publish content across all channels</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", gap: 1, background: COLORS.bg, borderRadius: 8, border: "1px solid #E5E7EB", padding: 3 }}>
            {[["list", "☰ List"], ["calendar", "📅 Calendar"]].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)} style={{ padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: view === k ? COLORS.white : "transparent", color: view === k ? COLORS.h1 : COLORS.muted, border: view === k ? "1px solid #E5E7EB" : "1px solid transparent", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          <button className="btn" onClick={() => setShowCompose(true)} style={{ padding: "9px 22px", borderRadius: 9, background: "linear-gradient(135deg,#EA580C,#C2410C)", color: "white", fontSize: 13, fontWeight: 700, boxShadow: "0 3px 10px #EA580C40", border: "none", cursor: "pointer" }}>
            + Create Post
          </button>
        </div>
      </div>

      {/* Channel filter pills — unchanged, also drives filtered */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {SM_CHANNELS.filter(c => c.connected).map(ch => (
          <button key={ch.id}
            onClick={() => setSelChannels(p => p.includes(ch.id) ? p.filter(x => x !== ch.id) : [...p, ch.id])}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${selChannels.includes(ch.id) ? ch.color : "#E5E7EB"}`, background: selChannels.includes(ch.id) ? ch.bg : COLORS.white, cursor: "pointer" }}>
            <ChannelIcon id={ch.id} size={18} />
            <span style={{ fontSize: 12, fontWeight: 600, color: selChannels.includes(ch.id) ? ch.color : COLORS.muted }}>{ch.name}</span>
          </button>
        ))}
        {selChannels.length > 0 && (
          <button onClick={() => setSelChannels([])} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: COLORS.white, cursor: "pointer", fontSize: 12, color: COLORS.muted }}>Clear</button>
        )}
      </div>

      {/* ── List view ── */}
      {view === "list" && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "clip" }}>

          {/* Toolbar */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by title, type, caption…" />

            <FilterSelect
              value={activeFilters.type}
              onChange={val => setFilter("type", val)}
              options={Object.keys(POST_TYPES)}
              allLabel="All Types"
            />

            <FilterSelect
              value={activeFilters.status}
              onChange={val => setFilter("status", val)}
              options={Object.keys(POST_STATUS)}
              allLabel="All Statuses"
            />

            <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <Thead cols={["", "Title", "Type", "Caption", "Channels", "Scheduled", "Reach", "Engagement", "Leads", "Status", ""]} />
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={11} style={{ padding: "40px 14px", textAlign: "center", color: COLORS.faint, fontSize: 13 }}>No posts match your filters.</td></tr>
                )}
                {paginated.map((p, i) => {
                  const ptc = POST_TYPES[p.type] || POST_TYPES.Update;
                  return (
                    <tr key={p.id} className="row" style={{ borderBottom: "1px solid #E5E7EB22", background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{p.image}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                        <span style={{ fontFamily: "Fira Code,monospace", fontSize: 10, color: "#EA580C" }}>{p.id}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: ptc.bg, color: ptc.color }}>{p.type}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: COLORS.muted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.caption}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}><ChannelChips channels={p.channels} /></td>
                      <td style={{ padding: "12px 14px", fontSize: 11, color: p.status === "scheduled" ? "#1D4ED8" : COLORS.muted, fontWeight: p.status === "scheduled" ? 600 : 400 }}>{p.scheduledAt}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontFamily: "Fira Code,monospace", fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>{p.reach > 0 ? p.reach.toLocaleString() : "—"}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {p.likes > 0
                          ? <div style={{ fontSize: 11, color: COLORS.muted }}>❤ {p.likes} · 💬 {p.comments} · ↗ {p.shares}</div>
                          : <span style={{ fontSize: 11, color: COLORS.faint }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontFamily: "Fira Code,monospace", fontSize: 13, fontWeight: 700, color: "#EA580C" }}>{p.leads > 0 ? p.leads : "—"}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}><SBadge s={p.status} map={POST_STATUS} /></td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn" onClick={() => setShowCompose(true)} style={{ padding: "4px 9px", borderRadius: 5, background: "#FFF7ED", border: "1px solid #EA580C30", color: "#EA580C", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                          {p.status === "draft" && (
                            <button className="btn" onClick={() => setShowCompose(true)} style={{ padding: "4px 9px", borderRadius: 5, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Schedule</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 0 && (
            <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
          )}
        </div>
      )}

      {/* ── Calendar view — completely unchanged ── */}
      {view === "calendar" && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>March 2026</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" style={{ padding: "5px 12px", borderRadius: 7, background: COLORS.bg, border: "1px solid #E5E7EB", color: COLORS.muted, fontSize: 12, cursor: "pointer" }}>← Feb</button>
              <button className="btn" style={{ padding: "5px 12px", borderRadius: 7, background: COLORS.bg, border: "1px solid #E5E7EB", color: COLORS.muted, fontSize: 12, cursor: "pointer" }}>Apr →</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid #E5E7EB" }}>
            {DAYS.map(d => <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: COLORS.faint }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
            {calDays.map(d => {
              const posts  = getPostsForDay(d);
              const isToday = d === 3;
              return (
                <div key={d} style={{ minHeight: 80, borderRight: "1px solid #E5E7EB22", borderBottom: "1px solid #E5E7EB22", padding: 6, background: isToday ? "#FFF7ED" : "transparent" }}>
                  <div style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? "#EA580C" : COLORS.muted, marginBottom: 4 }}>{d}{isToday && " •"}</div>
                  {posts.map(p => (
                    <div key={p.id} style={{ fontSize: 9, fontWeight: 600, padding: "2px 5px", borderRadius: 4, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", background: p.status === "published" ? "#ECFDF5" : p.status === "scheduled" ? "#EFF6FF" : "#F8FAFC", color: p.status === "published" ? "#16A34A" : p.status === "scheduled" ? "#1D4ED8" : "#94A3B8" }}>
                      {p.image} {p.title.slice(0, 20)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compose modal — completely unchanged */}
      {showCompose && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowCompose(false)}>
          <div style={{ background: COLORS.white, borderRadius: 16, padding: 28, width: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)", scrollbarWidth: "none" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>Create New Post</div>
              <button onClick={() => setShowCompose(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: COLORS.muted, lineHeight: 1, padding: "4px 8px", borderRadius: 6 }}
                onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Post Title</div>
              <input placeholder="e.g. Summer AC Offer – 20% Off" style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Caption / Message</div>
              <textarea placeholder="Write your post caption..." style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, resize: "vertical", minHeight: 100, fontFamily: "Plus Jakarta Sans,sans-serif", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {["#ACSummer", "#CoolTech", "#ACService", "#Bengaluru"].map(t => (
                  <span key={t} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#F0F9FF", color: "#0369A1", cursor: "pointer" }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: .4 }}>Publish To</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SM_CHANNELS.filter(c => c.connected).map(ch => (
                  <button key={ch.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: COLORS.bg, cursor: "pointer" }}>
                    <ChannelIcon id={ch.id} size={18} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.body }}>{ch.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Post Type</div>
                <select style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, background: COLORS.white }}>
                  {Object.keys(POST_TYPES).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Schedule Date & Time</div>
                <input type="datetime-local" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }} />
              </div>
            </div>
            <div style={{ border: "2px dashed #E5E7EB", borderRadius: 9, padding: "20px", textAlign: "center", marginBottom: 20, cursor: "pointer", background: "#FAFAFA" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>🖼</div>
              <div style={{ fontSize: 13, color: COLORS.muted }}>Upload image or video · PNG, JPG, MP4</div>
              <div style={{ fontSize: 11, color: COLORS.faint, marginTop: 2 }}>Or choose from Content Library</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={() => setShowCompose(false)} style={{ flex: 1, padding: "11px", borderRadius: 9, background: "linear-gradient(135deg,#EA580C,#C2410C)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>🚀 Schedule Post</button>
              <button className="btn" onClick={() => setShowCompose(false)} style={{ padding: "11px 16px", borderRadius: 9, background: "#F8FAFC", border: "1px solid #E5E7EB", color: COLORS.muted, fontSize: 13, cursor: "pointer" }}>Save Draft</button>
              <button className="btn" onClick={() => setShowCompose(false)} style={{ padding: "11px 16px", borderRadius: 9, background: "#F8FAFC", border: "1px solid #E5E7EB", color: COLORS.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostSchedulerPage;