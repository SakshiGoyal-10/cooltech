import { useState } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { SM_CAMPAIGNS, SM_POSTS, SM_WEEKLY, SM_CHANNELS } from '../../data/mockData';

// ─── ChannelIcon ───────────────────────────────────────────────────────────────
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
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: meta.color + "22",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5,
    }}>
      {meta.emoji}
    </div>
  );
};

// ─── ChannelChips ──────────────────────────────────────────────────────────────
const ChannelChips = ({ channels = [] }) => (
  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
    {channels.map(ch => {
      const meta = CHANNEL_META[ch] || { emoji: "🌐", color: "#94A3B8" };
      return (
        <span key={ch} style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 99,
          background: meta.color + "18", color: meta.color, fontWeight: 700,
        }}>
          {meta.emoji} {ch}
        </span>
      );
    })}
  </div>
);

// ─── SmBarChart ────────────────────────────────────────────────────────────────
const SmBarChart = ({ data = [], field, color }) => {
  const max = Math.max(...data.map(d => d[field]), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{
            width: "100%", borderRadius: 4,
            height: Math.max(4, (d[field] / max) * 50),
            background: color,
          }} />
          <div style={{ fontSize: 9, color: "#94A3B8" }}>{d.day}</div>
        </div>
      ))}
    </div>
  );
};

// ─── SocialDashboard ───────────────────────────────────────────────────────────
const SocialDashboard = ({ setPage }) => {
  const totalFollowers  = SM_CHANNELS.filter(c => c.connected).reduce((s, c) => s + c.followers, 0);
  const totalReach      = SM_CHANNELS.filter(c => c.connected).reduce((s, c) => s + c.reach, 0);
  const totalLeads      = SM_CHANNELS.filter(c => c.connected).reduce((s, c) => s + c.leads, 0);
  const publishedPosts  = SM_POSTS.filter(p => p.status === "published").length;

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.h1 }}>Social Media Hub</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>Manage all your channels, posts & campaigns from one place</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setPage("sm_schedule")} style={{ padding: "9px 18px", borderRadius: 9, background: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.body, fontSize: 13, fontWeight: 600 }}>📅 Schedule Post</button>
          <button className="btn" onClick={() => setPage("sm_campaign")} style={{ padding: "9px 22px", borderRadius: 9, background: "linear-gradient(135deg,#1877F2,#0C4DA8)", color: "white", fontSize: 13, fontWeight: 700, boxShadow: "0 3px 10px #1877F240" }}>+ New Campaign</button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
        {[
          { label: "Total Followers",   value: totalFollowers.toLocaleString(), sub: "across all channels",    icon: "👥", color: "#1877F2", bg: "#EFF6FF" },
          { label: "Monthly Reach",     value: totalReach.toLocaleString(),     sub: "unique people reached",  icon: "📡", color: "#E1306C", bg: "#FDF2F8" },
          { label: "Social Leads",      value: totalLeads,                      sub: "this month",             icon: "🎯", color: "#EA580C", bg: "#FFF7ED" },
          { label: "Posts Published",   value: publishedPosts,                  sub: "this month",             icon: "📝", color: "#16A34A", bg: "#F0FDF4" },
          { label: "Active Campaigns",  value: SM_CAMPAIGNS.filter(c => c.status === "active").length, sub: "running now", icon: "🚀", color: "#7C3AED", bg: "#F5F3FF" },
        ].map((k, i) => (
          <div key={k.label} className={"stat-card card fu" + i} style={{ background: COLORS.white, borderRadius: 14, padding: "15px 16px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 9 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted }}>{k.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: COLORS.faint, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Connected channels ── */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>Connected Channels</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {SM_CHANNELS.map(ch => (
            <div key={ch.id} className="card" style={{ borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px 14px", background: ch.connected ? ch.bg : "#F8FAFC", position: "relative" }}>
              {!ch.connected && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS.faint }}>
                  Not Connected
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <ChannelIcon id={ch.id} size={34} />
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: ch.connected ? "white" : "#F1F5F9", color: ch.connected ? "#16A34A" : "#94A3B8", border: ch.connected ? "1px solid #BBF7D0" : "none" }}>
                  {ch.connected ? "● Live" : "○ Off"}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{ch.name}</div>
              <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 10, fontFamily: "Fira Code,monospace" }}>{ch.handle}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {ch.followers > 0 && <div style={{ background: "white", borderRadius: 6, padding: "5px 7px" }}><div style={{ fontSize: 13, fontWeight: 800, color: COLORS.h2 }}>{ch.followers.toLocaleString()}</div><div style={{ fontSize: 9, color: COLORS.faint }}>Followers</div></div>}
                <div style={{ background: "white", borderRadius: 6, padding: "5px 7px" }}><div style={{ fontSize: 13, fontWeight: 800, color: "#EA580C" }}>{ch.leads}</div><div style={{ fontSize: 9, color: COLORS.faint }}>Leads</div></div>
                {ch.rating > 0 && <div style={{ background: "white", borderRadius: 6, padding: "5px 7px" }}><div style={{ fontSize: 13, fontWeight: 800, color: "#F59E0B" }}>{ch.rating}★</div><div style={{ fontSize: 9, color: COLORS.faint }}>Rating</div></div>}
                {ch.reach > 0 && <div style={{ background: "white", borderRadius: 6, padding: "5px 7px" }}><div style={{ fontSize: 13, fontWeight: 800, color: COLORS.h2 }}>{(ch.reach / 1000).toFixed(1)}K</div><div style={{ fontSize: 9, color: COLORS.faint }}>Reach</div></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Middle row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

        {/* Recent posts performance */}
        <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>Recent Post Performance</div>
            <button onClick={() => setPage("sm_posts")} style={{ fontSize: 12, color: "#EA580C", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>View all →</button>
          </div>
          {SM_POSTS.filter(p => p.status === "published").slice(0, 4).map(post => (
            <div key={post.id} style={{ padding: "12px 18px", borderBottom: "1px solid #E5E7EB22", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{post.image}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{post.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ChannelChips channels={post.channels} />
                  <span style={{ fontSize: 10, color: COLORS.faint }}>{post.scheduledAt.split(" · ")[0]}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                {[["👁", post.reach.toLocaleString()], ["❤", post.likes], ["💬", post.comments], ["↗", post.shares], ["🎯", post.leads]].map(([icon, val]) => (
                  <div key={icon} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10 }}>{icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.h2, fontFamily: "Fira Code,monospace" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Weekly activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Weekly Reach</div>
            <SmBarChart data={SM_WEEKLY} field="reach" color="#1877F2" />
          </div>
          <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Leads from Social</div>
            <SmBarChart data={SM_WEEKLY} field="leads" color="#EA580C" />
            <div style={{ marginTop: 10, fontSize: 12, color: COLORS.muted, textAlign: "center" }}>
              <span style={{ fontWeight: 800, color: "#EA580C", fontSize: 16 }}>23</span> leads this week
            </div>
          </div>
        </div>
      </div>

      {/* ── Upcoming scheduled posts ── */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Upcoming Scheduled Posts</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {SM_POSTS.filter(p => p.status === "scheduled").map(post => (
            <div key={post.id} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#FAFAFA", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{post.image}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{post.title}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
                  <ChannelChips channels={post.channels} />
                </div>
                <div style={{ fontSize: 11, color: "#EA580C", fontWeight: 600 }}>📅 {post.scheduledAt}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SocialDashboard;