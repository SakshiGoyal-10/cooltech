import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { useTableSearch } from '../../hooks/useTableSearch';           // ← NEW
import TableSearchBar from '../../components/ui/TableSearchBar';       // ← NEW
import FilterSelect from '../../components/ui/FilterSelect';           // ← NEW
import ExportDropdown from '../../components/layout/ExportDropdown';   // ← NEW
import useExport from '../../hooks/useExport';                         // ← NEW
import { CONTENT_LIBRARY } from '../../data/mockData';

// ─── Shared channel meta ───────────────────────────────────────────────────────
const CHANNEL_META = {
  facebook:  { emoji: "📘", color: "#1877F2" },
  instagram: { emoji: "📸", color: "#E1306C" },
  twitter:   { emoji: "🐦", color: "#1DA1F2" },
  linkedin:  { emoji: "💼", color: "#0A66C2" },
  youtube:   { emoji: "▶️", color: "#FF0000" },
  google:    { emoji: "⭐", color: "#FBBC05" },
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

// ─── Column config for export (same pattern as AMCPage / QuotationsPage) ──────
const CONTENT_COLUMNS = [
  {
    label: "ID",      key: "id",     width: 10,
    tdStyle: { fontFamily: "monospace", fontWeight: 700, color: "#EA580C", fontSize: 11 },
  },
  {
    label: "Name",    key: "name",   width: 28,
    tdStyle: { fontWeight: 600 },
  },
  {
    label: "Type",    key: "type",   width: 14,
    format: v => v,
  },
  {
    label: "Format",  key: "format", width: 10,
    format: v => v,
  },
  {
    label: "Size",    key: "size",   width: 10,
    tdStyle: { fontFamily: "monospace" },
    format: v => v,
  },
  {
    label: "Channels", key: "channels", width: 18,
    format: v => Array.isArray(v) ? v.join(", ") : v,
  },
  {
    label: "Tags",    key: "tags",   width: 18,
    format: v => Array.isArray(v) ? v.join(", ") : v,
  },
  {
    label: "Used",    key: "used",   width: 8,
    tdStyle: { fontFamily: "monospace", textAlign: "center" },
    format: v => `${v}x`,
  },
];

// ─── ContentLibraryPage ───────────────────────────────────────────────────────
const ContentLibraryPage = () => {
  // ── Search + filters (same pattern as AMCPage / QuotationsPage) ───────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: filteredAssets,
  } = useTableSearch(
    CONTENT_LIBRARY,
    ['id', 'name', 'type', 'format', 'tags'],   // searchable fields
    { type: '', format: '' }                      // filter keys
  );

  // ── Export ────────────────────────────────────────────────────────────────
  const { exportProps } = useExport({
    title:    "Content Library",
    filename: "content-library",
    template: "generic_list",
    subtitle: `Marketing Content Library · ${filteredAssets.length} assets`,
    docId:    "CL-EXPORT",
    columns:  CONTENT_COLUMNS,
    rows:     filteredAssets,
  });

  const totalSize = CONTENT_LIBRARY.reduce((s, c) => {
    const n = parseFloat(c.size);
    return s + (isNaN(n) ? 0 : n);
  }, 0);

  // Derive unique type + format options from data
  const typeOptions   = [...new Set(CONTENT_LIBRARY.map(c => c.type))].sort();
  const formatOptions = [...new Set(CONTENT_LIBRARY.map(c => c.format))].sort();

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Content Library</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
            {filteredAssets.length} of {CONTENT_LIBRARY.length} assets · {totalSize.toFixed(1)} MB total
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn"
            onClick={() => alert('Google Drive connection would open here')}
            style={{ padding: "9px 16px", borderRadius: 9, background: COLORS.white, border: "1px solid #E5E7EB", color: COLORS.body, fontSize: 13, fontWeight: 600 }}>
            🔗 Connect Drive
          </button>
          <button
            className="btn"
            onClick={() => document.createElement('input').click()}
            style={{ padding: "9px 22px", borderRadius: 9, background: "linear-gradient(135deg,#EA580C,#C2410C)", color: "white", fontSize: 13, fontWeight: 700, boxShadow: "0 3px 10px #EA580C40" }}>
            ⬆ Upload Asset
          </button>
        </div>
      </div>

      {/* ── Search + Filter + Export bar ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <TableSearchBar
          value={q}
          onChange={setQ}
          placeholder="Search by name, type, tags…"
        />
        <FilterSelect
          value={activeFilters.type}
          onChange={val => setFilter("type", val)}
          options={typeOptions}
          allLabel="All Types"
        />
        <FilterSelect
          value={activeFilters.format}
          onChange={val => setFilter("format", val)}
          options={formatOptions}
          allLabel="All Formats"
        />
        <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
      </div>

      {/* Grid */}
      {filteredAssets.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="card"
              style={{ background: COLORS.white, borderRadius: 13, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "hidden" }}>
              <div style={{ height: 110, background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, position: "relative" }}>
                {asset.preview}
                <div style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "white", color: COLORS.muted, border: "1px solid #E5E7EB" }}>
                  {asset.format}
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {asset.name}
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "#F0F9FF", color: "#0369A1" }}>
                    {asset.type}
                  </span>
                  <span style={{ fontSize: 10, color: COLORS.faint }}>{asset.size}</span>
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                  {asset.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#F8FAFC", color: COLORS.muted, border: "1px solid #E5E7EB" }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <ChannelChips channels={asset.channels.includes("all") ? ["fb", "ig", "wa"] : asset.channels} />
                  <span style={{ fontSize: 10, color: COLORS.muted }}>Used {asset.used}x</span>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button
                    className="btn"
                    onClick={() => alert(`Using: ${asset.name}`)}
                    style={{ flex: 1, padding: "6px", borderRadius: 7, background: "#FFF7ED", border: "1px solid #EA580C30", color: "#EA580C", fontSize: 11, fontWeight: 700 }}>
                    Use
                  </button>
                  <button
                    className="btn"
                    onClick={() => alert(`Downloading: ${asset.name}`)}
                    style={{ flex: 1, padding: "6px", borderRadius: 7, background: COLORS.bg, border: "1px solid #E5E7EB", color: COLORS.muted, fontSize: 11 }}>
                    ⬇
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: COLORS.white, borderRadius: 14, border: "1px solid #E5E7EB", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h2, marginBottom: 4 }}>No assets found</div>
          <div style={{ fontSize: 13, color: COLORS.muted }}>Try adjusting your search or filters.</div>
        </div>
      )}
    </div>
  );
};

export default ContentLibraryPage;