import { useState, useEffect } from 'react';
import { inventoryApi, purchaseApi, suppliersApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, Avatar } from '../../components/ui/Badges';
import { KCard, Thead } from '../../components/ui/Cards';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import EditableDetailView from '../../components/ui/EditableDetailView';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { PO_STATUS, SUPPLIERS, PURCHASE_ORDERS, INVENTORY } from '../../data/mockData';

// ─── Column config for export ─────────────────────────────────────────────────
const SUPPLIER_COLUMNS = [
  { label: 'Supplier',       key: 'name',         width: 22, tdStyle: { fontWeight: 600 } },
  { label: 'Contact',        key: 'contact',      width: 18 },
  { label: 'Category',       key: 'category',     width: 14 },
  { label: 'Phone',          key: 'phone',        width: 14, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Payment Terms',  key: 'paymentTerms', width: 16 },
  { label: 'Orders',         key: 'totalOrders',  width: 8,  tdStyle: { fontFamily: 'monospace' } },
  { label: 'Total Spend',    key: 'totalValue',   width: 14, format: v => `₹${(v ?? 0).toLocaleString()}`, tdStyle: { fontFamily: 'monospace', fontWeight: 700 } },
  { label: 'Last Order',     key: 'lastOrder',    width: 12 },
  { label: 'Rating',         key: 'rating',       width: 8,  format: v => `${v ?? 0}★` },
  { label: 'Status',         key: 'status',       width: 10, format: v => v ? v.charAt(0).toUpperCase() + v.slice(1) : '' },
];

// ─── SupplierDetail ───────────────────────────────────────────────────────────
const SupplierDetail = ({ sup, onBack, onSave, onDelete, openModal, initialEditMode }) => {
  const fields = [
    { key: 'name' },    { key: 'contact' }, { key: 'phone' },
    { key: 'email' },   { key: 'address' }, { key: 'category' },
    { key: 'paymentTerms' }, { key: 'status' }, { key: 'rating' },
  ];

  const supplierPOs   = PURCHASE_ORDERS.filter(p => p.supplier === sup.name);
  const supplierItems = INVENTORY.filter(i => i.supplier === sup.name);

  return (
    <EditableDetailView
      id={sup.id}
      breadcrumb="Suppliers"
      onBack={onBack}
      fields={fields}
      data={sup}
      initialEditMode={initialEditMode}
      onSave={onSave}
      onDelete={() => onDelete(sup.id)}
    >
      {({ editMode, editData, setEditData }) => {
        const val  = (key) => editData[key] ?? sup[key] ?? '';
        const setK = (key) => (e) => setEditData(p => ({ ...p, [key]: e.target.value }));

        return (
          <div className="sup-detail-grid">

            {/* ── Left: sidebar ── */}
            <div className="sup-sidebar">
              <div className="sup-profile-card">
                <Avatar name={val('name')} size={54} color="#0369A1" />
                <div className="sup-profile-name">
                  {editMode
                    ? <input className="form-input sup-profile-input" value={val('name')} onChange={setK('name')} />
                    : sup.name}
                </div>
                <div className="sup-profile-cat">
                  {editMode
                    ? <input className="form-input sup-cat-input" value={val('category')} onChange={setK('category')} placeholder="Category" />
                    : `${sup.category ?? ''} Supplier`}
                </div>
                <div className="sup-profile-badges">
                  {editMode ? (
                    <select className="form-select sup-status-select" value={val('status')} onChange={setK('status')}>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  ) : (
                    <span className={`sup-status-badge${sup.status === 'active' ? ' sup-status-badge--active' : ''}`}>● {sup.status}</span>
                  )}
                  {editMode
                    ? <input className="form-input sup-rating-input" value={val('rating')} onChange={setK('rating')} placeholder="Rating" />
                    : <span className="sup-rating-badge">{sup.rating ?? 0}★</span>}
                </div>
              </div>

              <div className="sup-info-card">
                {[
                  ['Contact',  'contact',      sup.contact],
                  ['Phone',    'phone',         sup.phone],
                  ['Email',    'email',         sup.email],
                  ['Address',  'address',       sup.address],
                  ['Payment',  'paymentTerms',  sup.paymentTerms],
                ].map(([label, key, readVal]) => (
                  <div key={key} className="sup-info-row">
                    <span className="sup-info-key">{label}</span>
                    {editMode
                      ? <input className="form-input sup-info-input" value={val(key)} onChange={setK(key)} />
                      : <span className="sup-info-val">{readVal ?? '—'}</span>}
                  </div>
                ))}
                <div className="sup-info-row">
                  <span className="sup-info-key">Orders</span>
                  <span className="sup-info-val">{sup.totalOrders ?? 0}</span>
                </div>
                <div className="sup-info-row">
                  <span className="sup-info-key">Total Spend</span>
                  <span className="sup-info-val">₹{(sup.totalValue ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ── Right main ── */}
            <div className="sup-main-card">
              <div className="sup-section">
                <div className="sup-section-title">Purchase History</div>
                {supplierPOs.length === 0
                  ? <div className="sup-empty">No orders found</div>
                  : supplierPOs.map(po => (
                      <div key={po.id} className="sup-po-row">
                        <span className="td-brand">{po.id}</span>
                        <div className="sup-po-meta">{po.items?.length ?? 0} items · {po.orderDate}</div>
                        <SBadge s={po.status} map={PO_STATUS} />
                        <span className="td-amount">₹{(po.total ?? 0).toLocaleString()}</span>
                      </div>
                    ))
                }
              </div>

              <div className="sup-section">
                <div className="sup-section-title">Items Supplied</div>
                {supplierItems.length === 0
                  ? <div className="sup-empty">No items found</div>
                  : supplierItems.map(item => (
                      <div key={item.id} className="sup-item-row">
                        <TypeTag type={item.category} />
                        <div className="sup-item-name">{item.name}</div>
                        <span className="td-mono sup-item-cost">₹{item.cost ?? 0}</span>
                        <span className={`sup-item-stock${(item.qty ?? 0) <= (item.reorder ?? 0) ? ' sup-item-stock--low' : ''}`}>
                          {item.qty ?? 0} stock
                        </span>
                      </div>
                    ))
                }
              </div>
            </div>

          </div>
        );
      }}
    </EditableDetailView>
  );
};

// ─── SuppliersPage ────────────────────────────────────────────────────────────
const SuppliersPage = ({ openModal }) => {
  const [suppliers, setSuppliers] = useState(SUPPLIERS);

  useEffect(() => {
    if (suppliersApi?.list) {
      suppliersApi.list({ limit: 200 })
        .then(r => {
          const data = r.data ?? [];
          // Only use API data if it returns valid objects with required fields
          const valid = data.filter(s => s && typeof s.totalValue === 'number' && typeof s.totalOrders === 'number');
          setSuppliers(valid.length > 0 ? valid : SUPPLIERS);
        })
        .catch(() => setSuppliers(SUPPLIERS));
    }
  }, []);

  const [open,         setOpen]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [initialEdit,  setInitialEdit]  = useState(false);

  const totalSpend = suppliers.reduce((s, x) => s + (x.totalValue ?? 0), 0);

  // ── ALL hooks before any conditional return ───────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: searchFiltered,
  } = useTableSearch(suppliers, ['name', 'contact', 'category', 'phone'], { status: '', category: '' });

  const categories = [...new Set(suppliers.map(s => s.category).filter(Boolean))];

  const filtered = searchFiltered
    .filter(r => !activeFilters.status   || r.status   === activeFilters.status)
    .filter(r => !activeFilters.category || r.category === activeFilters.category);

  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filtered, 10);

  const { exportProps } = useExport({
    title:        "Suppliers",
    filename:     "cooltech-suppliers",
    template:     "generic_list",
    subtitle:     "AC Services Platform · Vendor Register",
    docId:        "suppliers-EXPORT",
    columns:      SUPPLIER_COLUMNS,
    rows:         filtered,
    showTotals:   true,
    totalColumns: ['totalOrders', 'totalValue'],
  });

  const handleSave   = (updated) => setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
  const handleDelete = (id)      => { setSuppliers(prev => prev.filter(s => s.id !== id)); setOpen(null); };
  const handleBack   = ()        => { setOpen(null); setInitialEdit(false); };

  // ── Conditional render AFTER all hooks ────────────────────────────────────
  const sup = open ? suppliers.find(s => s.id === open) : null;

  if (sup) {
    return (
      <SupplierDetail
        sup={sup}
        onBack={handleBack}
        onSave={handleSave}
        onDelete={handleDelete}
        openModal={openModal}
        initialEditMode={initialEdit}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="page-body">

      {/* Header */}
      <div className="sup-list-hdr">
        <div>
          <div className="section-title">Suppliers</div>
          <div className="section-sub">{suppliers.length} vendors</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-primary" onClick={() => openModal('new_supplier')}>+ Add Supplier</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid-4">
        <KCard
          label="Active"
          value={suppliers.filter(s => s.status === 'active').length}
          icon="🏭" iconBg="#EFF6FF" color="#0369A1" delay=""
        />
        <KCard
          label="Total Spend"
          value={`₹${(totalSpend / 100000).toFixed(1)}L`}
          icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="1"
        />
        <KCard
          label="Total Orders"
          value={suppliers.reduce((s, x) => s + (x.totalOrders ?? 0), 0)}
          icon="📦" iconBg="#F0FDF4" color="#16A34A" delay="2"
        />
        <KCard
          label="Avg Rating"
          value={
            suppliers.length
              ? `${(suppliers.reduce((s, x) => s + (x.rating ?? 0), 0) / suppliers.length).toFixed(1)}★`
              : '—'
          }
          icon="⭐" iconBg="#FEFCE8" color="#CA8A04" delay="3"
        />
      </div>

      {/* Table card */}
      <div className="card">

        {/* Toolbar */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, contact, category…" />

          <FilterSelect
            value={activeFilters.status}
            onChange={val => setFilter("status", val)}
            options={["active", "inactive"]}
            allLabel="All Statuses"
            labelMap={{ active: "Active", inactive: "Inactive" }}
          />

          <FilterSelect
            value={activeFilters.category}
            onChange={val => setFilter("category", val)}
            options={categories}
            allLabel="All Categories"
          />

          <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <Thead cols={['Supplier', 'Contact', 'Category', 'Phone', 'Payment Terms', 'Orders', 'Spend', 'Last Order', 'Rating', 'Status', '']} />
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: "40px 14px", textAlign: "center", color: COLORS.faint, fontSize: 13 }}>
                    No suppliers match your filters.
                  </td>
                </tr>
              )}
              {paginated.map((s, i) => (
                <tr
                  key={s.id}
                  className={i % 2 !== 0 ? 'row-alt' : ''}
                  onClick={() => { setInitialEdit(false); setOpen(s.id); }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="sup-name-cell">
                      <Avatar name={s.name} size={30} color="#0369A1" />
                      <span className="td-bold">{s.name}</span>
                    </div>
                  </td>
                  <td>{s.contact ?? '—'}</td>
                  <td><TypeTag type={s.category ?? ''} /></td>
                  <td><span className="td-mono">{s.phone ?? '—'}</span></td>
                  <td>{s.paymentTerms ?? '—'}</td>
                  <td><span className="td-mono sup-orders-val">{s.totalOrders ?? 0}</span></td>
                  <td><span className="td-amount">₹{(s.totalValue ?? 0).toLocaleString()}</span></td>
                  <td>{s.lastOrder ?? '—'}</td>
                  <td><span className="sup-rating-val">{s.rating ?? 0}★</span></td>
                  <td>
                    <span className={`sup-status-badge${s.status === 'active' ? ' sup-status-badge--active' : ''}`}>
                      ● {s.status ?? '—'}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <ActionDropdown
                      onView={()   => { setInitialEdit(false); setOpen(s.id); }}
                      onEdit={()   => { setInitialEdit(true);  setOpen(s.id); }}
                      onDelete={() => setDeleteTarget(s.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            from={from}
            to={to}
            total={total}
          />
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => { handleDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        message="This supplier will be permanently removed."
      />
    </div>
  );
};

export default SuppliersPage;