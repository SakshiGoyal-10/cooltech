import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { NOTIF_DATA, NOTIF_TYPE_CFG } from '../../data/mockData';

// ─── Column config for export ─────────────────────────────────────────────────
const NOTIF_COLUMNS = [
  {
    label: "ID",      key: "id",    width: 10,
    tdStyle: { fontFamily: "monospace", fontWeight: 700, fontSize: 11 },
  },
  {
    label: "Title",   key: "title", width: 32,
    tdStyle: { fontWeight: 600 },
  },
  {
    label: "Type",    key: "type",  width: 14,
    format: v => v.charAt(0).toUpperCase() + v.slice(1),
  },
  {
    label: "Body",    key: "body",  width: 34,
    tdStyle: { fontSize: 11, color: "#555" },
    format: v => v,
  },
  {
    label: "Time",    key: "time",  width: 12,
    tdStyle: { fontFamily: "monospace", fontSize: 11 },
    format: v => v,
  },
  {
    label: "Status",  key: "read",  width: 10,
    format: v => v ? "Read" : "Unread",
  },
];

// ─── NotificationsPage ────────────────────────────────────────────────────────
const NotificationsPage = ({ setPage }) => {
  const [notifs, setNotifs] = useState(NOTIF_DATA);
  const [readFilter, setReadFilter] = useState('');   // ← NEW: separate local state

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = id  => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const unreadCount = notifs.filter(n => !n.read).length;

  // ── Search + filters ──────────────────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered,
  } = useTableSearch(
    notifs,
    ['title', 'body', 'type', 'module'],
    { type: '' }          // ← CHANGED: removed 'read' from here
  );

  // ── Apply boolean read filter on top of useTableSearch results ────────────
  const displayRows = filtered.filter(n => {
    if (readFilter === "unread") return !n.read;
    if (readFilter === "read")   return  n.read;
    return true;
  });

  // ── Export ────────────────────────────────────────────────────────────────
  const { exportProps } = useExport({
    title:    "Notifications",
    filename: "notifications",
    template: "generic_list",
    subtitle: `Notifications Log · ${displayRows.length} records`,  // ← CHANGED: use displayRows
    docId:    "NOTIF-EXPORT",
    columns:  NOTIF_COLUMNS,
    rows:     displayRows,   // ← CHANGED: export respects read filter too
  });

  // Derive type options from data
  const typeOptions = [...new Set(NOTIF_DATA.map(n => n.type))].sort();

  return (
    <div className="fu">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Notifications</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
            {unreadCount} unread · {displayRows.length} of {notifs.length} total  {/* ← CHANGED */}
          </div>
        </div>
        <button
          className="btn"
          onClick={markAllRead}
          style={{ padding: "8px 16px", borderRadius: 8, background: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 12, fontWeight: 600 }}>
          ✓ Mark all read
        </button>
      </div>

      {/* ── Search + Filter + Export bar ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        <TableSearchBar
          value={q}
          onChange={setQ}
          placeholder="Search notifications…"
        />
        <FilterSelect
          value={activeFilters.type}
          onChange={val => setFilter("type", val)}
          options={typeOptions}
          allLabel="All Types"
        />
        <FilterSelect
          value={readFilter}                  // ← CHANGED: local state
          onChange={val => setReadFilter(val)} // ← CHANGED: local setter
          options={["unread", "read"]}
          allLabel="All Status"
        />
        <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
        </div>
      </div>

      {/* Notification list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {displayRows.map(n => {   
            const cfg = NOTIF_TYPE_CFG[n.type] || NOTIF_TYPE_CFG.salary;
            return (
              <div
                key={n.id}
                onClick={() => { markRead(n.id); setPage && setPage(n.module); }}
                style={{
                  background: n.read ? COLORS.white : "#FFFBF5",
                  borderRadius: 12,
                  border: `1px solid ${n.read ? COLORS.border : COLORS.brand + "40"}`,
                  padding: "14px 18px",
                  cursor: "pointer",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  boxShadow: n.read ? "0 1px 3px rgba(0,0,0,.05)" : `0 2px 8px ${COLORS.brand}15`,
                  transition: "all .15s",
                }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, border: `1.5px solid ${cfg.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 600 : 800, color: COLORS.h1, lineHeight: 1.3 }}>{n.title}</div>
                    <span style={{ fontSize: 10, color: COLORS.faint, flexShrink: 0, fontFamily: FONTS.mono }}>{n.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.5, marginBottom: n.read ? 0 : 8 }}>{n.body}</div>
                  {!n.read && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.brand }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.brand }}>Unread · tap to view</span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, padding: "3px 8px", borderRadius: 99, flexShrink: 0, alignSelf: "flex-start", textTransform: "capitalize" }}>
                  {n.type}
                </span>
              </div>
            );
          })}

        {displayRows.length === 0 && (   
          <div style={{ textAlign: "center", padding: 40, color: COLORS.faint, fontSize: 13 }}>
            No notifications match your search or filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;