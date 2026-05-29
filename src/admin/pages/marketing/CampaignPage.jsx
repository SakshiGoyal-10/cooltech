import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import EditableDetailView from '../../components/ui/EditableDetailView';
import PDFPreview from '../../components/layout/PDFPreview';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { SM_CAMPAIGNS } from '../../data/mockData';

// ─── Shared channel meta ───────────────────────────────────────────────────────
const CHANNEL_META = {
  facebook:  { emoji: "📘", color: "#1877F2" },
  instagram: { emoji: "📸", color: "#E1306C" },
  twitter:   { emoji: "🐦", color: "#1DA1F2" },
  linkedin:  { emoji: "💼", color: "#0A66C2" },
  youtube:   { emoji: "▶️", color: "#FF0000" },
  google:    { emoji: "⭐", color: "#FBBC05" },
  whatsapp:  { emoji: "💬", color: "#25D366" },
};

// ─── Column config for export ─────────────────────────────────────────────────
const CAMPAIGN_COLUMNS = [
  {
    label: "Campaign ID", key: "id", width: 12,
    tdStyle: { fontFamily: "monospace", fontWeight: 700, color: COLORS.brand, fontSize: 11 },
  },
  {
    label: "Campaign Name", key: "name", width: 28,
    tdStyle: { fontWeight: 600 },
  },
  {
    label: "Goal",         key: "goal",        width: 12, tdStyle: { fontSize: 12 } },
  {
    label: "Status",       key: "status",      width: 10, tdStyle: { fontSize: 12 } },
  {
    label: "Budget (₹)",   key: "budget",      width: 12,
    format: (v) => v,
    tdStyle: { fontFamily: "monospace" },
  },
  {
    label: "Spent (₹)",    key: "spent",       width: 12,
    format: (v) => v,
    tdStyle: { fontFamily: "monospace", fontWeight: 700 },
  },
  {
    label: "Impressions",  key: "impressions", width: 12,
    format: (v) => v,
    tdStyle: { fontFamily: "monospace" },
  },
  {
    label: "Leads",        key: "leads",       width: 8,
    tdStyle: { fontFamily: "monospace", fontWeight: 700 },
  },
  {
    label: "Conversions",  key: "conversions", width: 10,
    tdStyle: { fontFamily: "monospace" },
  },
  {
    label: "Revenue (₹)",  key: "revenue",     width: 12,
    format: (v) => v,
    tdStyle: { fontFamily: "monospace", fontWeight: 800 },
  },
  {
    label: "Start Date",   key: "startDate",   width: 11, tdStyle: { fontSize: 11 } },
  {
    label: "End Date",     key: "endDate",     width: 11, tdStyle: { fontSize: 11 } },
];

// ─── ChannelIcon ───────────────────────────────────────────────────────────────
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

// ─── NewCampaignModal ──────────────────────────────────────────────────────────
const NewCampaignModal = ({ onClose }) => {
  const [selChannels, setSelChannels] = useState([]);
  const toggleChannel = (id) =>
    setSelChannels(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: COLORS.white, borderRadius: 16, padding: 28, width: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>Create New Campaign</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: COLORS.muted, padding: "4px 8px", borderRadius: 6, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Campaign Name</div>
          <input placeholder="e.g. Summer AC Service Drive 2026" style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Goal</div>
            <select style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, background: COLORS.white }}>
              {["Leads", "Bookings", "Calls", "AMC Sign-ups", "Brand Awareness"].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Budget (₹)</div>
            <input type="number" placeholder="e.g. 15000" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Start Date</div>
            <input type="date" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>End Date</div>
            <input type="date" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: .4 }}>Channels</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {smChannels.filter(c => c.connected).map(ch => {
              const selected = selChannels.includes(ch.id);
              const meta = CHANNEL_META[ch.id] || { emoji: "🌐", color: "#94A3B8" };
              return (
                <button key={ch.id} onClick={() => toggleChannel(ch.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${selected ? meta.color : "#E5E7EB"}`, background: selected ? meta.color + "18" : COLORS.bg, cursor: "pointer" }}>
                  <span style={{ fontSize: 14 }}>{meta.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: selected ? meta.color : COLORS.body }}>{ch.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 9, background: "linear-gradient(135deg,#EA580C,#C2410C)", color: "white", fontSize: 13, fontWeight: 700, boxShadow: "0 3px 10px #EA580C40" }}>
            🚀 Launch Campaign
          </button>
          <button className="btn" onClick={onClose} style={{ padding: "11px 16px", borderRadius: 9, background: "#F8FAFC", border: "1px solid #E5E7EB", color: COLORS.muted, fontSize: 13 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── CampaignDetail ────────────────────────────────────────────────────────────
const CampaignDetail = ({ camp, onBack, onSave, onDelete, initialEditMode }) => {
  const [showPDF, setShowPDF] = useState(false);

  const fields = [
    { key: 'name' }, { key: 'goal' }, { key: 'status' },
    { key: 'startDate' }, { key: 'endDate' },
    { key: 'budget' }, { key: 'spent' }, { key: 'revenue' },
    { key: 'leads' }, { key: 'conversions' },
    { key: 'impressions' }, { key: 'reach' }, { key: 'clicks' },
  ];

  const roas     = (camp.revenue / camp.spent).toFixed(1);
  const cpl      = camp.leads > 0 ? (camp.spent / camp.leads).toFixed(0) : 0;
  const convRate = camp.leads > 0 ? ((camp.conversions / camp.leads) * 100).toFixed(0) : 0;

  return (
    <>
      <EditableDetailView
        id={camp.id}
        breadcrumb="Campaigns"
        onBack={onBack}
        fields={fields}
        data={camp}
        initialEditMode={initialEditMode}
        onSave={onSave}
        onDelete={() => onDelete(camp.id)}
      >
        {({ editMode, editData, setEditData }) => {
          const val  = (key) => editData[key] ?? camp[key] ?? '';
          const setK = (key) => (e) => setEditData(p => ({ ...p, [key]: e.target.value }));

          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>

              {/* ── Main card ── */}
              <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>

                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      {editMode ? (
                        <select value={val('status')} onChange={setK('status')} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99 }}>
                          <option value="active">active</option>
                          <option value="paused">paused</option>
                          <option value="completed">completed</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: camp.status === "active" ? "#F0FDF4" : "#F8FAFC", color: camp.status === "active" ? "#16A34A" : "#64748B" }}>● {camp.status}</span>
                      )}
                      {editMode ? (
                        <input value={val('goal')} onChange={setK('goal')} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, width: 120 }} />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#EFF6FF", color: "#1D4ED8" }}>{camp.goal}</span>
                      )}
                    </div>
                    {editMode
                      ? <input value={val('name')} onChange={setK('name')} style={{ fontSize: 18, fontWeight: 800, width: "100%", marginBottom: 6 }} />
                      : <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>{camp.name}</div>
                    }
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                      {editMode ? (
                        <>
                          <input value={val('startDate')} onChange={setK('startDate')} style={{ fontSize: 12, width: 110 }} />
                          <span style={{ color: COLORS.muted }}>–</span>
                          <input value={val('endDate')} onChange={setK('endDate')} style={{ fontSize: 12, width: 110 }} />
                        </>
                      ) : (
                        <div style={{ fontSize: 13, color: COLORS.muted }}>{camp.startDate} – {camp.endDate}</div>
                      )}
                    </div>
                  </div>
                  <ChannelChips channels={camp.channels} />
                </div>

                {/* KPI tiles */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                  {[
                    ["ROAS",       roas + "x",    "Revenue per ₹1 spent", "#16A34A"],
                    ["CPL",        "₹" + cpl,     "Cost per lead",         "#0369A1"],
                    ["Conv. Rate", convRate + "%", "Leads → Customers",     "#7C3AED"],
                    ["Leads",      camp.leads,     "Generated",             "#EA580C"],
                  ].map(([k, v, sub, c]) => (
                    <div key={k} style={{ background: COLORS.bg, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: COLORS.faint, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>{k}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: "Fira Code,monospace" }}>{v}</div>
                      <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 3 }}>{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Editable stat rows */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {[["Impressions","impressions"],["Reach","reach"],["Clicks","clicks"],["Conversions","conversions"]].map(([label, key]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, background: COLORS.bg }}>
                      <span style={{ fontSize: 12, color: COLORS.muted }}>{label}</span>
                      {editMode
                        ? <input value={val(key)} onChange={setK(key)} style={{ width: 90, textAlign: "right", fontFamily: "Fira Code,monospace", fontSize: 13 }} />
                        : <span style={{ fontFamily: "Fira Code,monospace", fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>{Number(val(key)).toLocaleString()}</span>
                      }
                    </div>
                  ))}
                </div>

                {/* Budget bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.h1 }}>Budget Utilisation</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {editMode ? (
                        <>
                          <input value={val('spent')} onChange={setK('spent')} style={{ width: 80, fontFamily: "Fira Code,monospace", fontSize: 12 }} />
                          <span style={{ color: COLORS.muted }}>/</span>
                          <input value={val('budget')} onChange={setK('budget')} style={{ width: 80, fontFamily: "Fira Code,monospace", fontSize: 12 }} />
                        </>
                      ) : (
                        <span style={{ fontFamily: "Fira Code,monospace", fontSize: 13, fontWeight: 700, color: "#EA580C" }}>
                          ₹{camp.spent.toLocaleString()} / ₹{camp.budget.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 10, background: "#F1F5F9", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min((camp.spent / camp.budget) * 100, 100)}%`, height: "100%", background: "linear-gradient(90deg,#EA580C,#F97316)", borderRadius: 5 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11, color: COLORS.faint }}>
                    <span>{((camp.spent / camp.budget) * 100).toFixed(0)}% used</span>
                    <span>₹{(camp.budget - camp.spent).toLocaleString()} remaining</span>
                  </div>
                </div>

                {/* Revenue */}
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 4 }}>Revenue Generated</div>
                  {editMode
                    ? <input value={val('revenue')} onChange={setK('revenue')} style={{ fontSize: 22, fontWeight: 800, fontFamily: "Fira Code,monospace", color: "#16A34A", width: "100%" }} />
                    : <div style={{ fontSize: 28, fontWeight: 800, color: "#16A34A", fontFamily: "Fira Code,monospace" }}>₹{camp.revenue.toLocaleString()}</div>
                  }
                  <div style={{ fontSize: 11, color: "#16A34A", marginTop: 2 }}>ROAS: {roas}x return on ad spend</div>
                </div>
              </div>

              {/* ── Sidebar ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Campaign Actions</div>
                  {camp.status === "active" ? (
                    <>
                      <button className="btn" style={{ width: "100%", marginBottom: 8, padding: "10px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 12, fontWeight: 700 }}>⏸ Pause Campaign</button>
                      <button className="btn" style={{ width: "100%", marginBottom: 8, padding: "10px", borderRadius: 8, background: "#FFFBEB", border: "1px solid #FDE68A", color: "#B45309", fontSize: 12, fontWeight: 700 }}>✏ Edit Budget</button>
                      {/* ── Export Report → opens PDFPreview ── */}
                      <button
                        className="btn"
                        onClick={() => setShowPDF(true)}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1", fontSize: 12, fontWeight: 700 }}
                      >
                        📊 Export Report
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn" style={{ width: "100%", marginBottom: 8, padding: "10px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", fontSize: 12, fontWeight: 700 }}>🔄 Duplicate Campaign</button>
                      {/* Export report also available for non-active campaigns */}
                      <button
                        className="btn"
                        onClick={() => setShowPDF(true)}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1", fontSize: 12, fontWeight: 700 }}
                      >
                        📊 Export Report
                      </button>
                    </>
                  )}
                </div>

                <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Channels</div>
                  {camp.channels.map(ch => {
                    const c = smChannels.find(x => x.id === ch);
                    return c ? (
                      <div key={ch} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #E5E7EB" }}>
                        <ChannelIcon id={ch} size={24} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{c.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          );
        }}
      </EditableDetailView>

      {/* Single campaign PDF report */}
      <PDFPreview
  open={showPDF}
  onClose={() => setShowPDF(false)}
  title={`${camp.id} Report`}
  filename={`campaign-report-${camp.id}`}
  template="campaign_report"   
  data={camp}                
/>
    </>
  );
};

// ─── CampaignPage ──────────────────────────────────────────────────────────────
const CampaignPage = () => {
  const [open,         setOpen]         = useState(null);
  const [campaigns,    setCampaigns]    = useState(SM_CAMPAIGNS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [initialEdit,  setInitialEdit]  = useState(false);
  const [showCompose,  setShowCompose]  = useState(false);

  const camp = open ? campaigns.find(c => c.id === open) : null;

  // ── ALL HOOKS BEFORE EARLY RETURN ─────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: filteredCampaigns,
  } = useTableSearch(
    campaigns,
    ['id', 'name', 'goal', 'status'],
    { status: '', goal: '' }
  );

  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filteredCampaigns, 10);

  const { exportProps } = useExport({
    title:        "Campaign Manager",
    filename:     "cooltech-campaigns",
    template:     "generic_list",
    subtitle:     `AC Services Platform · Campaigns · ${filteredCampaigns.length} records`,
    docId:        "CAMP-EXPORT",
    columns:      CAMPAIGN_COLUMNS,
    rows:         filteredCampaigns,
    showTotals:   true,
    totalColumns: ["budget", "spent", "impressions", "leads", "conversions", "revenue"],
  });

  const handleSave   = (updated) => setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
  const handleDelete = (id)      => { setCampaigns(prev => prev.filter(c => c.id !== id)); setOpen(null); };
  const handleBack   = ()        => { setOpen(null); setInitialEdit(false); };

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (camp) {
    return (
      <CampaignDetail
        camp={camp}
        onBack={handleBack}
        onSave={handleSave}
        onDelete={handleDelete}
        initialEditMode={initialEdit}
      />
    );
  }

  // ── Summary KPIs ─────────────────────────────────────────────────────────────
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalSpend   = campaigns.reduce((s, c) => s + c.spent,   0);
  const totalLeads   = campaigns.reduce((s, c) => s + c.leads,   0);

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionHdr
          title="Campaign Manager"
          sub={`${total} of ${campaigns.length} campaigns · ₹${(totalRevenue / 100000).toFixed(1)}L revenue`}
        />
        <button
          onClick={() => setShowCompose(true)}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#EA580C,#C2410C)", color: "white", cursor: "pointer", boxShadow: "0 3px 10px #EA580C40", flexShrink: 0 }}>
          + New Campaign
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KCard label="Total Revenue" value={`₹${(totalRevenue / 100000).toFixed(1)}L`}    sub="from campaigns"  icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="" />
        <KCard label="Ad Spend"      value={`₹${(totalSpend / 1000).toFixed(0)}K`}        sub="total invested"  icon="💸" iconBg="#FEF2F2" color="#DC2626" delay="1" />
        <KCard label="Total Leads"   value={totalLeads}                                    sub="generated"       icon="🎯" iconBg="#FFF7ED" color="#EA580C" delay="2" />
        <KCard label="Overall ROAS"  value={`${(totalRevenue / totalSpend).toFixed(1)}x`} sub="return on spend" icon="📈" iconBg="#F0FDF4" color="#16A34A" delay="3" />
      </div>

      {/* Table */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "clip" }}>

        {/* Search + filters + export */}
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <TableSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search by name, goal, status…"
          />
          <FilterSelect
            value={activeFilters.status}
            onChange={val => setFilter("status", val)}
            options={["active", "paused", "completed"]}
            allLabel="All Statuses"
          />
          <FilterSelect
            value={activeFilters.goal}
            onChange={val => setFilter("goal", val)}
            options={["Leads", "Bookings", "Calls", "AMC Sign-ups", "Brand Awareness"]}
            allLabel="All Goals"
          />
          <div style={{ marginLeft: 'auto' }}>
              <ExportDropdown {...exportProps} />
            </div>
        </div>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <Thead cols={["Campaign", "Goal", "Channels", "Budget", "Spent", "Impressions", "Leads", "Conv.", "Revenue", "ROAS", "Status", ""]} />
            <tbody>
              {paginated.map((c, i) => (
                <tr key={c.id} className="row" onClick={() => { setInitialEdit(false); setOpen(c.id); }}
                  style={{ borderBottom: "1px solid #E5E7EB22", background: i % 2 === 0 ? COLORS.white : "#FAFAFA", cursor: "pointer" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: COLORS.faint }}>{c.startDate} – {c.endDate}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "#EFF6FF", color: "#0369A1" }}>{c.goal}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}><ChannelChips channels={c.channels} /></td>
                  <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: "Fira Code,monospace", fontSize: 12, color: COLORS.muted }}>₹{c.budget.toLocaleString()}</span></td>
                  <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: "Fira Code,monospace", fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>₹{c.spent.toLocaleString()}</span></td>
                  <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: "Fira Code,monospace", fontSize: 12, color: COLORS.muted }}>{c.impressions.toLocaleString()}</span></td>
                  <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: "Fira Code,monospace", fontSize: 14, fontWeight: 800, color: "#EA580C" }}>{c.leads}</span></td>
                  <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: "Fira Code,monospace", fontSize: 12, color: COLORS.h2 }}>{c.conversions}</span></td>
                  <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: "Fira Code,monospace", fontSize: 13, fontWeight: 800, color: "#16A34A" }}>₹{c.revenue.toLocaleString()}</span></td>
                  <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: "Fira Code,monospace", fontSize: 13, fontWeight: 700, color: "#7C3AED" }}>{(c.revenue / c.spent).toFixed(1)}x</span></td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: c.status === "active" ? "#F0FDF4" : "#F8FAFC", color: c.status === "active" ? "#16A34A" : "#64748B" }}>● {c.status}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                    <ActionDropdown
                      onView={()   => { setInitialEdit(false); setOpen(c.id); }}
                      onEdit={()   => { setInitialEdit(true);  setOpen(c.id); }}
                      onDelete={() => setDeleteTarget(c.id)}
                    />
                  </td>
                </tr>
              ))}
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
        message="This campaign and all its data will be permanently removed. You will not be able to recover the deleted record!"
      />

      {showCompose && <NewCampaignModal onClose={() => setShowCompose(false)} />}
    </div>
  );
};

export default CampaignPage;