import { JOB_STATUS } from '../constants/statusMaps';
import { customersApi, jobsApi } from '../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, Avatar } from '../components/ui/Badges';
import { SectionHdr, Thead } from '../components/ui/Cards';
import ActionDropdown from '../components/ui/ActionDropdown';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import EditableDetailView from '../components/ui/EditableDetailView';
import { useTableSearch } from '../hooks/useTableSearch';
import TableSearchBar from '../components/ui/TableSearchBar';
import FilterSelect from '../components/ui/FilterSelect';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import ExportDropdown from '../components/layout/ExportDropdown';
import useExport from '../hooks/useExport';
import { addToDeleted } from '../store/deletedStore';

// ─── shared input style ───────────────────────────────────────────────────────
const iStyle = {
  padding: "6px 10px", borderRadius: 7,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 12, color: COLORS.h2,
  background: "#FAFAFA",
  fontFamily: FONTS.sans,
  width: "100%", outline: "none",
  boxSizing: "border-box",
};

// ─── Column config for export ─────────────────────────────────────────────────
const CUSTOMER_COLUMNS = [
  { label: "Customer ID",     key: "id",          width: 12, tdStyle: { fontFamily: "monospace", fontWeight: 700, color: COLORS.brand, fontSize: 11 } },
  { label: "Name",            key: "name",         width: 22, tdStyle: { fontWeight: 600 } },
  { label: "Type",            key: "type",         width: 14, tdStyle: { fontSize: 12 } },
  { label: "Phone",           key: "phone",        width: 14, tdStyle: { fontFamily: "monospace", fontSize: 11 } },
  { label: "Email",           key: "email",        width: 22, tdStyle: { fontSize: 11 } },
  { label: "AC Units",        key: "units",        width: 8,  tdStyle: { fontFamily: "monospace", textAlign: "center" } },
  { label: "AMC",             key: "amc",          width: 8,  format: (v) => (v ? "Active" : "None"), tdStyle: { fontSize: 12 } },
  { label: "Total Jobs",      key: "totalJobs",    width: 10, tdStyle: { fontFamily: "monospace", textAlign: "center" } },
  { label: "Total Spent (₹)", key: "totalSpent",   width: 14, tdStyle: { fontFamily: "monospace", fontWeight: 700, color: COLORS.brand } },
  { label: "Last Service",    key: "lastService",  width: 14, tdStyle: { fontSize: 11, color: COLORS.muted } },
];

// ─── CustomersPage ────────────────────────────────────────────────────────────
// FIX 3: accept `onDelete` prop (or `addToDeleted`) from parent for recently-deleted tracking
const CustomersPage = ({ openModal, addToDeleted }) => {
  const [open,            setOpen]            = useState(null);
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [customers,       setCustomers]       = useState([]);
  const [custJobs,        setCustJobs]        = useState([]);
  const [jobsLoading,     setJobsLoading]     = useState(false);

  const normaliseCustomer = (c) => ({
    ...c,
    id:          c.customerId || c._id,
    tags:        Array.isArray(c.tags) ? c.tags : [],
    totalJobs:   c.totalJobs  ?? 0,
    totalSpent:  c.totalSpent ?? 0,
    units:       c.units      ?? 1,
    lastService: c.lastService
      ? new Date(c.lastService).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
  });

  // Load all customers on mount
  useEffect(() => {
    customersApi.list({ limit: 200 })
      .then(r => setCustomers((r.data ?? []).map(normaliseCustomer)))
      .catch(() => {});
  }, []);

  // Load jobs for a specific customer when detail view opens
  useEffect(() => {
    if (!open) { setCustJobs([]); return; }
    setJobsLoading(true);
    jobsApi.list({ customer: open, limit: 50 })
      .then(r => setCustJobs(r.data ?? []))
      .catch(() => setCustJobs([]))
      .finally(() => setJobsLoading(false));
  }, [open]);

  const cust = open ? customers.find(c => c._id === open) : null;

  // ── ALL HOOKS BEFORE EARLY RETURN ─────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: filteredCustomers,
  } = useTableSearch(
    customers,
    ['id', 'name', 'phone', 'email', 'address', 'type'],
    { type: '', amc: '' }
  );

  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filteredCustomers, 10);

  const { exportProps } = useExport({
    title:        "Customers",
    filename:     "cooltech-customers",
    template:     "generic_list",
    subtitle:     `AC Services Platform · Customers · ${filteredCustomers.length} records`,
    docId:        "CUST-EXPORT",
    columns:      CUSTOMER_COLUMNS,
    rows:         filteredCustomers,
    showTotals:   true,
    totalColumns: ["totalSpent", "totalJobs"],
  });

  const handleBack = () => { setOpen(null); setInitialEditMode(false); };

  const handleSave = async (updated) => {
    try {
      const doc = await customersApi.update(updated._id, updated);
      setCustomers(prev => prev.map(c => c._id === doc._id ? normaliseCustomer(doc) : c));
    } catch (e) { alert(e.message); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 1: use customersApi.remove (not jobsApi.remove)
  // FIX 2: use setCustomers (not undefined setJobs)
  // FIX 3: call addToDeleted with the customer's data, not job data
  // ─────────────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    // Find the customer being deleted so we can log it
    const item = customers.find(c => (c._id ?? c.id) === id);

    // Push to recently-deleted if the parent provides the handler
    if (item && typeof addToDeleted === 'function') {
      addToDeleted({
        id:     item.id ?? item._id,
        name:   item.name,
        module: 'Customer',
        by:     'Admin',
        date:   new Date().toISOString().slice(0, 10),
      });
    }

    try {
      // FIX 1: was jobsApi.remove — must be customersApi.remove
      await customersApi.remove(id);

      // FIX 2: was setJobs (undefined) — must be setCustomers
      setCustomers(prev => prev.filter(c => (c._id ?? c.id) !== id));

      // If we were viewing this customer's detail, go back to list
      if (open === id) handleBack();

      // Close delete modal
      setDeleteTarget(null);
    } catch (e) {
      alert(e.message);
    }
  };

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (cust) return (
    <EditableDetailView
      id={cust._id}
      breadcrumb="Customers"
      onBack={handleBack}
      initialEditMode={initialEditMode}
      data={cust}
      fields={[
        { key: "name",    type: "text" },
        { key: "type",    type: "select", options: ["Residential", "Commercial"] },
        { key: "phone",   type: "text" },
        { key: "email",   type: "email" },
        { key: "address", type: "text" },
        { key: "units",   type: "number" },
        { key: "amc",     type: "text" },
      ]}
      onSave={handleSave}
      onDelete={() => handleDelete(cust._id)}
    >
      {({ editMode, editData, setEditData }) => {
        const set = (key) => (e) => setEditData(prev => ({ ...prev, [key]: e.target.value }));

        const contactRows = [
          { icon: "📞", key: "phone",   label: "Phone"   },
          { icon: "✉️", key: "email",   label: "Email"   },
          { icon: "📍", key: "address", label: "Address" },
        ];

        return (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>

            {/* ── Left column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Avatar / name / type card */}
              <div style={{
                background: COLORS.white, borderRadius: 14,
                border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
                padding: 20,
                boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : "0 1px 4px rgba(0,0,0,.05)",
                textAlign: "center", transition: "all .2s",
              }}>
                <Avatar name={editMode ? editData.name : cust.name} size={60} color={COLORS.brand} />

                {editMode ? (
                  <input value={editData.name ?? ""} onChange={set("name")}
                    style={{ ...iStyle, fontSize: 15, fontWeight: 800, textAlign: "center", marginTop: 12, marginBottom: 4 }} />
                ) : (
                  <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.h1, marginTop: 12 }}>{cust.name}</div>
                )}

                {editMode ? (
                  <select value={editData.type ?? ""} onChange={set("type")}
                    style={{ ...iStyle, marginTop: 6, cursor: "pointer" }}>
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Industrial</option>
                  </select>
                ) : (
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>{cust.type}</div>
                )}

                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
                  {editMode ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.body, cursor: "pointer" }}>
                      <input type="checkbox" checked={!!editData.amc}
                        onChange={e => setEditData(p => ({ ...p, amc: e.target.checked }))} />
                      AMC Active
                    </label>
                  ) : (
                    <>
                      {cust.amc && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                          ✓ AMC Active
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: COLORS.brandL, color: COLORS.brand }}>
                        {cust.units} AC Units
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Contact card */}
              <div style={{
                background: COLORS.white, borderRadius: 14,
                border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
                padding: "16px 18px",
                boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : "0 1px 4px rgba(0,0,0,.05)",
                transition: "all .2s",
              }}>
                {editMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {contactRows.map(({ icon, key, label }) => (
                      <div key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                        <input value={editData[key] ?? ""} onChange={set(key)} placeholder={label} style={iStyle} />
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>❄️</span>
                      <input value={editData.units ?? ""} onChange={set("units")} type="number" placeholder="AC Units"
                        style={{ ...iStyle, fontFamily: FONTS.mono }} />
                    </div>
                  </div>
                ) : (
                  contactRows.map(({ icon, key }) => (
                    <div key={key} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, color: COLORS.body, alignItems: "flex-start" }}>
                      <span>{icon}</span>
                      <span style={{ flex: 1 }}>{cust[key] || '—'}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Stats card */}
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                {[
                  ["Total Jobs",   cust.totalJobs],
                  ["Total Spent",  "₹" + cust.totalSpent.toLocaleString()],
                  ["Last Service", cust.lastService],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                    <span style={{ color: COLORS.muted }}>{k}</span>
                    <span style={{ fontWeight: 700, color: COLORS.h2 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Recent Jobs</div>

                {jobsLoading ? (
                  <div style={{ fontSize: 13, color: COLORS.faint }}>Loading jobs…</div>
                ) : custJobs.length === 0 ? (
                  <div style={{ fontSize: 13, color: COLORS.faint }}>No jobs found for this customer.</div>
                ) : (
                  custJobs.map(job => (
                    <div key={job._id ?? job.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <TypeTag type={job.type} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>
                          {(job.issue ?? job.description ?? 'No description').slice(0, 55)}
                          {(job.issue ?? job.description ?? '').length > 55 ? "…" : ""}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.faint, marginTop: 2 }}>
                          {job.scheduledDate
                            ? new Date(job.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : job.date ?? '—'
                          } · {job.techName ?? job.tech ?? 'Unassigned'}
                        </div>
                      </div>
                      <SBadge s={job.status} map={JOB_STATUS} />
                      <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>
                        ₹{(job.amount ?? job.total ?? 0).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        );
      }}
    </EditableDetailView>
  );

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionHdr
          title="Customers"
          sub={`${total} of ${customers.length} registered customers`}
        />
        <button
          onClick={() => openModal("new_customer")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
            color: "white", cursor: "pointer",
            boxShadow: `0 3px 10px ${COLORS.brand}40`, flexShrink: 0,
          }}>
          + New Customer
        </button>
      </div>

      {/* Table */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "clip" }}>

        {/* Search + filters + export */}
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, phone, email…" />
          <FilterSelect
            value={activeFilters.type}
            onChange={val => setFilter("type", val)}
            options={["Residential", "Commercial"]}
            allLabel="All Types"
          />
          <FilterSelect
            value={activeFilters.amc}
            onChange={val => setFilter("amc", val)}
            options={["true", "false"]}
            allLabel="All AMC"
            renderOption={(val) => val === "true" ? "AMC Active" : "No AMC"}
          />
          <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <Thead cols={["Customer", "Type", "Contact", "AC Units", "AMC", "Total Jobs", "Spent", "Last Service", ""]} />
            <tbody>
              {paginated.map((c, i) => (
                <tr
                  key={c._id}
                  className="row"
                  onClick={() => { setInitialEditMode(false); setOpen(c._id); }}
                  style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA", cursor: "pointer" }}
                >
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={c.name} size={32} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.faint, fontFamily: FONTS.mono }}>{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                      background: c.type === "Commercial" ? "#EFF6FF" : c.type === "Industrial" ? "#F5F3FF" : "#FFF7ED",
                      color:      c.type === "Commercial" ? "#1D4ED8" : c.type === "Industrial" ? "#6D28D9"  : "#C2410C",
                    }}>
                      {c.type}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ fontSize: 12, color: COLORS.body }}>{c.phone}</div>
                    <div style={{ fontSize: 11, color: COLORS.faint }}>{c.email}</div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 700, color: COLORS.h2 }}>{c.units}</span>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    {c.amc
                      ? <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "#F0FDF4", color: "#16A34A" }}>✓ Active</span>
                      : <span style={{ fontSize: 11, color: COLORS.faint }}>None</span>
                    }
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>{c.totalJobs}</span>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.brand }}>₹{c.totalSpent.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: COLORS.muted }}>{c.lastService}</td>
                  <td style={{ padding: "13px 14px" }} onClick={e => e.stopPropagation()}>
                    <ActionDropdown
                      onView={()   => { setInitialEditMode(false); setOpen(c._id); }}
                      onEdit={()   => { setInitialEditMode(true);  setOpen(c._id); }}
                      onDelete={() => setDeleteTarget(c._id)}
                    />
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 0", textAlign: "center", color: COLORS.faint, fontSize: 13 }}>
                    {q || activeFilters.type || activeFilters.amc
                      ? "No customers match your search / filter."
                      : "No customers yet. Click + New Customer to add one."}
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

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        message="This customer data will be deleted."
      />
    </div>
  );
};

export default CustomersPage;