import { inventoryApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';

// ─── Column configs for export ────────────────────────────────────────────────
const items_COLUMNS = [
  { label: 'Item Name',    key: 'name',        width: 22, tdStyle: { fontWeight: 600 } },
  { label: 'Category',     key: 'category',    width: 14 },
  { label: 'SKU',          key: 'sku',         width: 14, tdStyle: { fontFamily: 'monospace' } },
  { label: 'In Stock',     key: 'qty',         width: 10, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Unit',         key: 'unit',        width: 10 },
  { label: 'Reorder At',   key: 'reorder',     width: 10, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Unit Cost',    key: 'cost',        width: 12, format: v => `₹${v.toLocaleString()}`, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Total Value',  key: 'stockVal',    width: 14, format: v => `₹${v.toLocaleString()}`, tdStyle: { fontFamily: 'monospace', fontWeight: 700 } },
  { label: 'Stock Status', key: 'stockStatus', width: 12, format: v => v },
  { label: 'Supplier',     key: 'supplier',    width: 18 },
];

const USAGE_COLUMNS = [
  { label: 'Log ID',     key: 'id',   width: 12, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Item',       key: 'item', width: 22, tdStyle: { fontWeight: 600 } },
  { label: 'Qty Used',   key: 'qty',  width: 10, format: v => `-${v}`, tdStyle: { fontFamily: 'monospace', color: '#DC2626' } },
  { label: 'Unit',       key: 'unit', width: 10 },
  { label: 'Job',        key: 'job',  width: 12, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Technician', key: 'tech', width: 18 },
  { label: 'Date',       key: 'date', width: 10 },
];

const USAGE_LOG = [
  { id: "USG-021", item: "R-32 Refrigerant",     qty: 0.8, unit: "Cylinder", job: "JOB-1042", tech: "Ramesh K.",  date: "Mar 3"  },
  { id: "USG-020", item: "Split AC Filter 1.5T", qty: 2,   unit: "Piece",    job: "JOB-1041", tech: "Vijay S.",   date: "Mar 3"  },
  { id: "USG-019", item: "R-32 Refrigerant",     qty: 1.0, unit: "Cylinder", job: "JOB-1040", tech: "Arjun D.",   date: "Mar 2"  },
  { id: "USG-018", item: "Capacitor 25µF",        qty: 1,   unit: "Piece",    job: "JOB-1039", tech: "Suresh Y.",  date: "Mar 2"  },
  { id: "USG-017", item: "R-410A Refrigerant",   qty: 0.6, unit: "Cylinder", job: "JOB-1038", tech: "Ramesh K.",  date: "Mar 1"  },
  { id: "USG-016", item: 'Copper Pipe 1/4"',     qty: 8,   unit: "Meter",    job: "JOB-1040", tech: "Arjun D.",   date: "Mar 1"  },
  { id: "USG-015", item: "Compressor Oil",        qty: 0.5, unit: "Litre",    job: "JOB-1037", tech: "Vijay S.",   date: "Feb 29" },
  { id: "USG-014", item: "R-32 Refrigerant",     qty: 1.8, unit: "Cylinder", job: "JOB-1037", tech: "Vijay S.",   date: "Feb 29" },
];

// ─── FIX: normalize raw API inventory row ────────────────────────────────────
const normalizeItem = (item, idx) => ({
  ...item,
  // Guarantee unique id regardless of backend field name
  id:       item.id ?? item._id ?? item.itemId ?? `inv-${idx}`,
  qty:      Number(item.qty)     || 0,
  cost:     Number(item.cost)    || 0,
  reorder:  Number(item.reorder) || 0,
  // Derive computed fields here so they're always present
  stockVal:    (Number(item.qty) || 0) * (Number(item.cost) || 0),
  stockStatus: (Number(item.qty) || 0) <= (Number(item.reorder) || 0) ? 'Low Stock' : 'OK',
});

// ─── InventoryPage ────────────────────────────────────────────────────────────
const InventoryPage = ({ openModal }) => {
  const [items, setItems] = useState([]);
  const [view, setView]   = useState("items");

  useEffect(() => {
    inventoryApi.list({ limit: 200 })
      .then(r => setItems((r.data ?? []).map(normalizeItem)))
      .catch(() => {});
  }, []);

  const low        = items.filter(i => i.qty <= i.reorder);
  const totalValue = items.reduce((s, i) => s + i.qty * i.cost, 0);
  const categories = [...new Set(items.map(i => i.category))];

  const catData = categories.map(cat => ({
    cat,
    items: items.filter(i => i.category === cat).length,
    value: items.filter(i => i.category === cat).reduce((s, i) => s + i.qty * i.cost, 0),
    qty:   items.filter(i => i.category === cat).reduce((s, i) => s + i.qty, 0),
  })).sort((a, b) => b.value - a.value);

  const CAT_COLORS = ["#EA580C", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

  // ── FIX: was `[].map(...)` — hardcoded empty array meant items never showed ──
  // Now correctly derives from `items` state, so table populates after API load
  const inventoryRows = items.map(item => ({
    ...item,
    stockVal:    item.qty * item.cost,
    stockStatus: item.qty <= item.reorder ? 'Low Stock' : 'OK',
  }));

  // ── Items: search + filter ────────────────────────────────────────────────
  const {
    q: itemsQ, setQ: setItemsQ,
    activeFilters: itemsFilters, setFilter: setItemsFilter,
    filtered: itemsSearchFiltered,
  } = useTableSearch(inventoryRows, ['name', 'sku', 'category', 'supplier'], { category: '', stockStatus: '' });

  const itemsFiltered = itemsSearchFiltered
    .filter(r => !itemsFilters.category    || r.category    === itemsFilters.category)
    .filter(r => !itemsFilters.stockStatus || r.stockStatus === itemsFilters.stockStatus);

  const {
    paginated: itemsPaginated, page: itemsPage, totalPages: itemsTotalPages, setPage: setItemsPage,
    pageSize: itemsPageSize, setPageSize: setItemsPageSize, from: itemsFrom, to: itemsTo, total: itemsTotal,
  } = usePagination(itemsFiltered, 10);

  const { exportProps: itemsExportProps } = useExport({
    title:        "Inventory & Parts",
    filename:     "cooltech-inventory",
    template:     "generic_list",
    subtitle:     "AC Services Platform · Stock Register",
    docId:        "items-EXPORT",
    columns:      items_COLUMNS,
    rows:         itemsFiltered,
    showTotals:   true,
    totalColumns: ['stockVal'],
  });

  // ── Usage Log: search + filter ────────────────────────────────────────────
  const {
    q: usageQ, setQ: setUsageQ,
    activeFilters: usageFilters, setFilter: setUsageFilter,
    filtered: usageSearchFiltered,
  } = useTableSearch(USAGE_LOG, ['item', 'tech', 'job', 'id'], { tech: '' });

  const usageFiltered = usageSearchFiltered
    .filter(r => !usageFilters.tech || r.tech === usageFilters.tech);

  const {
    paginated: usagePaginated, page: usagePage, totalPages: usageTotalPages, setPage: setUsagePage,
    pageSize: usagePageSize, setPageSize: setUsagePageSize, from: usageFrom, to: usageTo, total: usageTotal,
  } = usePagination(usageFiltered, 10);

  const { exportProps: usageExportProps } = useExport({
    title:    "Inventory Usage Log",
    filename: "cooltech-usage-log",
    template: "generic_list",
    subtitle: "AC Services Platform · Parts Movement",
    docId:    "USAGE-LOG-EXPORT",
    columns:  USAGE_COLUMNS,
    rows:     usageFiltered,
  });

  const uniqueTechs = [...new Set(USAGE_LOG.map(u => u.tech))];

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Inventory & Parts</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
            {items.length} items · ₹{(totalValue / 1000).toFixed(1)}K stock value · {low.length} low stock
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", gap: 1, background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: 3 }}>
            {[["items", "📦 Items"], ["usage", "📋 Usage Log"], ["analytics", "📊 Analytics"]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: view === k ? COLORS.white : "transparent", color: view === k ? COLORS.h1 : COLORS.muted, border: `1px solid ${view === k ? COLORS.border : "transparent"}`, cursor: "pointer" }}
              >
                {l}
              </button>
            ))}
          </div>
          {view === "items" && <ExportDropdown {...itemsExportProps} />}
          {view === "usage" && <ExportDropdown {...usageExportProps} />}
          <button
            className="btn"
            onClick={() => openModal("new_inventory")}
            style={{ padding: "8px 18px", borderRadius: 8, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 12, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
        <KCard label="Total Items"     value={items.length}                           icon="📦" iconBg="#FFF7ED" color={COLORS.brand} delay=""  />
        <KCard label="Stock Value"     value={`₹${(totalValue / 1000).toFixed(0)}K`} icon="💰" iconBg="#FEFCE8" color="#CA8A04"       delay="1" />
        <KCard label="Low Stock"       value={low.length}                             icon="⚠️" iconBg="#FEF2F2" color="#DC2626"        delay="2" />
        <KCard label="Categories"      value={categories.length}                      icon="📂" iconBg="#EFF6FF" color="#0369A1"        delay="3" />
        <KCard label="Usage This Week" value="8 logs"                                 icon="📋" iconBg="#F0FDF4" color="#16A34A"        delay="3" />
      </div>

      {/* ── Low stock alert ── */}
      {low.length > 0 && (
        <div style={{ padding: "14px 18px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 4 }}>
              Low Stock Alert — {low.length} item{low.length > 1 ? "s" : ""} need reordering
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {low.map(item => (
                <span key={item.id} style={{ fontSize: 11, fontWeight: 600, background: "#FECACA", color: "#991B1B", padding: "2px 8px", borderRadius: 99 }}>
                  {item.name}: {item.qty} {item.unit}s left (min {item.reorder})
                </span>
              ))}
            </div>
          </div>
          <button
            className="btn"
            onClick={() => openModal("new_po")}
            style={{ padding: "8px 16px", borderRadius: 8, background: "#DC2626", color: "white", fontSize: 12, fontWeight: 700, border: "none", whiteSpace: "nowrap" }}
          >
            🛒 Raise PO
          </button>
        </div>
      )}

      {/* ══ ITEMS TAB ══ */}
      {view === "items" && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "clip" }}>
          {/* Toolbar */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <TableSearchBar value={itemsQ} onChange={setItemsQ} placeholder="Search by name, SKU, supplier…" />
            <FilterSelect
              value={itemsFilters.category}
              onChange={val => setItemsFilter("category", val)}
              options={categories}
              allLabel="All Categories"
            />
            <FilterSelect
              value={itemsFilters.stockStatus}
              onChange={val => setItemsFilter("stockStatus", val)}
              options={["OK", "Low Stock"]}
              allLabel="All Stock Status"
            />
            <button
              className="btn"
              onClick={() => openModal("new_po")}
              style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 12, fontWeight: 700 }}
            >
              🛒 Raise PO
            </button>
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}>
              <Thead cols={["Item Name", "Category", "SKU", "In Stock", "Unit", "Reorder At", "Unit Cost", "Total Value", "Stock Level", "Supplier", ""]} />
              <tbody>
                {itemsPaginated.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ padding: "40px 14px", textAlign: "center", color: COLORS.faint, fontSize: 13 }}>
                      No items match your filters.
                    </td>
                  </tr>
                )}
                {itemsPaginated.map((item, i) => {
                  const pct      = Math.min((item.qty / Math.max(item.qty * 1.5, item.reorder * 3)) * 100, 100);
                  const isLow    = item.qty <= item.reorder;
                  const stockVal = item.qty * item.cost;
                  return (
                    // FIX: key={item.id} is now always defined because normalizeItem guarantees it
                    <tr key={item.id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: isLow ? "#FFFBF7" : i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{item.name}</td>
                      <td style={{ padding: "12px 14px" }}><TypeTag type={item.category} /></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.muted }}>{item.sku}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: 800, color: isLow ? "#DC2626" : "#16A34A" }}>{item.qty}</span></td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted }}>{item.unit}</td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>{item.reorder}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>₹{item.cost}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 700, color: COLORS.brand }}>₹{stockVal.toLocaleString()}</span></td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 60, height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: isLow ? "#EF4444" : "#10B981", borderRadius: 3 }} />
                          </div>
                          {isLow && <span style={{ fontSize: 9, color: "#DC2626", fontWeight: 800, background: "#FEF2F2", padding: "1px 5px", borderRadius: 99 }}>LOW</span>}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted }}>{item.supplier}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button className="btn" onClick={() => openModal("use_inventory", { name: item.name })} style={{ padding: "4px 9px", borderRadius: 5, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 11, fontWeight: 700 }}>Use</button>
                          {isLow && <button className="btn" onClick={() => openModal("new_po")} style={{ padding: "4px 9px", borderRadius: 5, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 11, fontWeight: 700 }}>Reorder</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {itemsTotalPages > 0 && (
            <Pagination page={itemsPage} totalPages={itemsTotalPages} setPage={setItemsPage} pageSize={itemsPageSize} setPageSize={setItemsPageSize} from={itemsFrom} to={itemsTo} total={itemsTotal} />
          )}

          <div style={{ padding: "12px 18px", borderTop: `1px solid ${COLORS.border}`, background: "#F9FAFB", display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.muted, alignItems: "center" }}>
            <span>Total stock value across all items</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.brand }}>₹{totalValue.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* ══ USAGE LOG TAB ══ */}
      {view === "usage" && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "clip", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          {/* Toolbar */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <TableSearchBar value={usageQ} onChange={setUsageQ} placeholder="Search item, technician, job ID…" />
            <FilterSelect
              value={usageFilters.tech}
              onChange={val => setUsageFilter("tech", val)}
              options={uniqueTechs}
              allLabel="All Technicians"
            />
            <button
              className="btn"
              onClick={() => openModal("use_inventory", { name: "" })}
              style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, background: COLORS.brand, color: "white", fontSize: 12, fontWeight: 700, border: "none" }}
            >
              + Log Usage
            </button>
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <Thead cols={["Log ID", "Item", "Qty Used", "Unit", "Job", "Technician", "Date", ""]} />
              <tbody>
                {usagePaginated.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px 14px", textAlign: "center", color: COLORS.faint, fontSize: 13 }}>
                      No usage logs match your filters.
                    </td>
                  </tr>
                )}
                {usagePaginated.map((u, i) => (
                  <tr key={u.id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                    <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.brand }}>{u.id}</span></td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>{u.item}</td>
                    <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: "#DC2626" }}>-{u.qty}</span></td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted }}>{u.unit}</td>
                    <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, color: "#0369A1" }}>{u.job}</span></td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Avatar name={u.tech} size={24} />
                        <span style={{ fontSize: 12, color: COLORS.body }}>{u.tech}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.muted }}>{u.date}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <button className="btn" onClick={() => openModal("report", { title: u.id, format: "View" })} style={{ padding: "4px 9px", borderRadius: 5, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 11 }}>Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {usageTotalPages > 0 && (
            <Pagination page={usagePage} totalPages={usageTotalPages} setPage={setUsagePage} pageSize={usagePageSize} setPageSize={setUsagePageSize} from={usageFrom} to={usageTo} total={usageTotal} />
          )}
        </div>
      )}

      {/* ══ ANALYTICS TAB ══ */}
      {view === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>Stock Value by Category</div>
            {catData.map((c, i) => (
              <div key={c.cat} style={{ marginBottom: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <span>{c.cat}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: COLORS.h2 }}>₹{c.value.toLocaleString()} · {c.items} items</span>
                </div>
                <div style={{ height: 8, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${(c.value / (catData[0]?.value || 1)) * 100}%`, height: "100%", background: CAT_COLORS[i % CAT_COLORS.length], borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>Stock Health</div>
            {items.map(item => {
              const pct   = Math.min((item.qty / Math.max(item.reorder * 3, item.qty)) * 100, 100);
              const isLow = item.qty <= item.reorder;
              return (
                <div key={item.id} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.muted, marginBottom: 3 }}>
                    <span style={{ fontWeight: isLow ? 700 : 400, color: isLow ? "#DC2626" : COLORS.muted }}>{item.name}</span>
                    <span style={{ fontWeight: 700, color: isLow ? "#DC2626" : "#16A34A" }}>{item.qty} / {item.reorder} min</span>
                  </div>
                  <div style={{ height: 5, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: isLow ? "#EF4444" : "#10B981", borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryPage;