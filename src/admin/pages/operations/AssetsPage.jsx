import { assetsApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';

// ─── Column config for equipment export ──────────────────────────────────────
const EQUIPMENT_COLUMNS = [
  {
    label: "Name",         key: "name",        width: 22,
    tdStyle: { fontWeight: 600 },
  },
  {
    label: "Type",         key: "subType",     width: 14,
    tdStyle: { fontSize: 12 },
  },
  {
    label: "Assigned To",  key: "assignedTo",  width: 16,
    tdStyle: { fontSize: 12 },
  },
  {
    label: "Year",         key: "year",        width: 8,
    tdStyle: { fontFamily: "monospace", fontSize: 11 },
  },
  {
    label: "Value (₹)",    key: "value",       width: 12,
    format: (v) => v,
    tdStyle: { fontFamily: "monospace", fontWeight: 700 },
  },
  {
    label: "Last Service", key: "lastService", width: 14,
    tdStyle: { fontSize: 11 },
  },
  {
    label: "Next Service", key: "nextService", width: 14,
    tdStyle: { fontSize: 11 },
  },
  {
    label: "Status",       key: "status",      width: 10,
    tdStyle: { fontSize: 12 },
  },
];

// ─── AssetsPage ───────────────────────────────────────────────────────────────
const AssetsPage = ({ openModal }) => {
  const [assets, setAssets] = useState([]);
  useEffect(() => { assetsApi.list({limit:200}).then(r=>setAssets(r.data??[])).catch(()=>{}); }, []);
  const vehicles   = assets.filter(a => a.assetType === "Vehicle");
  const equipment  = assets.filter(a => a.assetType === "Equipment");
  const totalValue = assets.reduce((s, a) => s + a.value, 0);

  // ── Equipment search + filter + export ────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: filteredEquipment,
  } = useTableSearch(
    equipment,
    ['name', 'subType', 'assignedTo', 'status'],
    { subType: '', status: '' }
  );

  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filteredEquipment, 10);

  const { exportProps } = useExport({
    title:        "Equipment",
    filename:     "cooltech-equipment",
    template:     "generic_list",
    subtitle:     `Assets & Vehicles · Equipment · ${filteredEquipment.length} records`,
    docId:        "EQ-EXPORT",
    columns:      EQUIPMENT_COLUMNS,
    rows:         filteredEquipment,
    showTotals:   true,
    totalColumns: ["value"],
  });

  // Unique subTypes for dropdown
  const subTypes = [...new Set(equipment.map(e => e.subType).filter(Boolean))];

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <SectionHdr
        title="Assets & Vehicles"
        sub={`${assets.length} assets · ₹${(totalValue / 100000).toFixed(2)}L book value`}
        action="+ Add Asset"
        onAction={() => openModal("new_asset")}
      />

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KCard label="Vehicles"       value={vehicles.length}                                        sub="company fleet"   icon="🚗" iconBg="#EFF6FF" color="#0369A1" delay=""  />
        <KCard label="Equipment"      value={equipment.length}                                       sub="tools & machines" icon="🔧" iconBg="#FFF7ED" color="#EA580C" delay="1" />
        <KCard label="In Maintenance" value={assets.filter(a => a.status === "maintenance").length}  sub="being serviced"  icon="⚙"  iconBg="#FEF2F2" color="#DC2626" delay="2" />
        <KCard label="Total Value"    value={`₹${(totalValue / 100000).toFixed(2)}L`}               sub="book value"      icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="3" />
      </div>

      {/* ── Vehicles section ── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>Vehicles</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {vehicles.map(v => (
          <div key={v.id} className="card" style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 30 }}>{v.subType === "Bike" ? "🏍️" : "🚐"}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: v.status === "active" ? "#ECFDF5" : "#FEF2F2", color: v.status === "active" ? "#16A34A" : "#DC2626" }}>● {v.status}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1, marginBottom: 2 }}>{v.name}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 10, fontFamily: FONTS.mono }}>{v.regNo} · {v.year} · {v.fuel}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
              {[["Assigned", v.assignedTo], ["KM", v.km.toLocaleString() + " km"], ["Value", "₹" + (v.value / 1000).toFixed(0) + "K"], ["Insurance", v.insurance]].map(([k, val]) => (
                <div key={k} style={{ background: COLORS.bg, borderRadius: 6, padding: "6px 8px" }}>
                  <div style={{ fontSize: 9, color: COLORS.faint, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.h2 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 7, background: COLORS.bg, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>Next Service</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>{v.nextService}</div>
              <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2, marginTop: 5 }}>
                <div style={{ width: "60%", height: "100%", background: "linear-gradient(90deg,#6EE7B7,#10B981)", borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn" onClick={() => openModal("log_fuel", { name: v.name })} style={{ flex: 1, padding: "7px", borderRadius: 7, background: "#FFF7ED", border: `1px solid #EA580C30`, color: "#EA580C", fontSize: 11, fontWeight: 700 }}>Log Fuel</button>
              <button className="btn" onClick={() => openModal("report", { title: `Service Log – ${v.name}`, format: "Update" })} style={{ flex: 1, padding: "7px", borderRadius: 7, background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1", fontSize: 11, fontWeight: 700 }}>Service</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Equipment section ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>
          Equipment
          <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.muted, marginLeft: 8 }}>
            {total} of {equipment.length}
          </span>
        </div>
      </div>

      {/* Equipment table */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "clip" }}>

        {/* Search + filters + export */}
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <TableSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search by name, type, assigned to…"
          />
          <FilterSelect
            value={activeFilters.subType}
            onChange={val => setFilter("subType", val)}
            options={subTypes}
            allLabel="All Types"
          />
          <FilterSelect
            value={activeFilters.status}
            onChange={val => setFilter("status", val)}
            options={["active", "maintenance", "inactive"]}
            allLabel="All Statuses"
          />
          <div style={{ marginLeft: 'auto' }}>
              <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <Thead cols={["Equipment", "Type", "Assigned To", "Year", "Value", "Last Service", "Next Service", "Status", ""]} />
            <tbody>
              {paginated.map((e, i) => (
                <tr key={e.id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{e.name}</td>
                  <td style={{ padding: "12px 14px" }}><TypeTag type={e.subType} /></td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.body }}>{e.assignedTo}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, fontFamily: FONTS.mono, color: COLORS.muted }}>{e.year}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>₹{e.value.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted }}>{e.lastService}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted }}>{e.nextService}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: e.status === "active" ? "#ECFDF5" : "#FFFBEB", color: e.status === "active" ? "#16A34A" : "#B45309" }}>
                      ● {e.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <button
                      className="btn"
                      onClick={() => openModal("log_fuel", { name: e.name })}
                      style={{ padding: "5px 10px", borderRadius: 6, background: "#FFF7ED", border: `1px solid #EA580C30`, color: "#EA580C", fontSize: 11, fontWeight: 700 }}
                    >
                      Log
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "32px", textAlign: "center", fontSize: 13, color: COLORS.faint }}>
                    No equipment matches your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page} totalPages={totalPages} setPage={setPage}
          pageSize={pageSize} setPageSize={setPageSize}
          from={from} to={to} total={total}
        />
      </div>

    </div>
  );
};

export default AssetsPage;