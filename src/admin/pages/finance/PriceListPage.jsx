import { useState, useEffect } from 'react';
import { servicesApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { PRICE_ITEMS } from '../../data/mockData';

const PRICE_COLUMNS = [
  {
    label: 'ID', key: 'id', width: 10,
    tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: '#F97316', fontSize: 11 },
  },
  {
    label: 'Service Name', key: 'name', width: 28,
    tdStyle: { fontWeight: 600 },
  },
  {
    label: 'Category', key: 'category', width: 14,
    render: (val) => <TypeTag type={val} />,
    format: (val) => val,
  },
  {
    label: 'Price (ex-GST)', key: 'price', width: 16,
    excelKey: 'Price ex-GST (₹)',
    render: (val) => <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: COLORS.h2 }}>₹{val.toLocaleString('en-IN')}</span>,
    format: (val) => val,
    tdStyle: { fontFamily: 'monospace', fontWeight: 600 },
  },
  {
    label: 'GST %', key: 'gst', width: 8,
    render: (val) => <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>{val}%</span>,
    format: (val) => `${val}%`,
    tdStyle: { fontFamily: 'monospace', color: '#666' },
  },
  {
    label: 'Total (incl-GST)', key: 'total', width: 18,
    excelKey: 'Total incl-GST (₹)',
    render: (val) => <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: COLORS.brand }}>₹{val.toLocaleString('en-IN')}</span>,
    format: (val) => val,
    tdStyle: { fontFamily: 'monospace', fontWeight: 800, color: '#F97316' },
  },
  {
    label: 'Unit', key: 'unit', width: 12,
    tdStyle: { color: '#666', fontSize: 11 },
  },
  {
    label: 'Status', key: 'active', width: 10,
    render: (val) => (
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
        background: val ? '#F0FDF4' : '#F8FAFC',
        color: val ? '#16A34A' : '#64748B',
      }}>● {val ? 'Active' : 'Inactive'}</span>
    ),
    format: (val) => val ? 'Active' : 'Inactive',
  },
];

const cats = [...new Set(PRICE_ITEMS.map(p => p.category))];

const PriceListPage = ({ openModal }) => {
  const [services, setServices] = useState([]);
  useEffect(() => { servicesApi.list({limit:200}).then(r=>setServices(r.data??[])).catch(()=>{}); }, []);
  const [statusFilter, setStatusFilter] = useState(''); // 'Active' | 'Inactive' | ''

  // ── Search + filter hooks ────────────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: filteredBySearch,
  } = useTableSearch(
    PRICE_ITEMS,
    ['id', 'name', 'category', 'unit'],
    { category: '' }
  );

  // Boolean field needs manual handling — string matching won't work on true/false
  const filtered = statusFilter
    ? filteredBySearch.filter(p => (statusFilter === 'Active') === p.active)
    : filteredBySearch;

  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filtered, 10);

  const { exportProps } = useExport({
    title:        `Price List${activeFilters.category ? ` · ${activeFilters.category}` : ''}`,
    filename:     `cooltech-pricelist-${activeFilters.category || 'all'}`,
    template:     'generic_list',
    subtitle:     'AC Services Platform · Price List',
    docId:        'PRC-LIST-001',
    columns:      PRICE_COLUMNS,
    rows:         filtered,
    showTotals:   true,
    totalColumns: ['price', 'total'],
  });

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <SectionHdr
        title="Price List"
        sub="Manage your service rates and pricing"
        action="+ Add Price Item"
        onAction={() => openModal('new_price_item')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <KCard label="Total Items"  value={PRICE_ITEMS.length}                                                                                          sub="all services"     icon="🏷" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Active"       value={PRICE_ITEMS.filter(p => p.active).length}                                                                    sub="visible to staff" icon="✅" iconBg="#F0FDF4" color="#16A34A"    delay="1" />
        <KCard label="Categories"   value={new Set(PRICE_ITEMS.map(p => p.category)).size}                                                              sub="service types"    icon="📂" iconBg="#EFF6FF" color="#0369A1"    delay="2" />
        <KCard label="Avg Price"    value={`₹${Math.round(PRICE_ITEMS.reduce((s, p) => s + p.price, 0) / PRICE_ITEMS.length).toLocaleString('en-IN')}`} sub="ex-GST"           icon="💰" iconBg="#FEFCE8" color="#CA8A04"    delay="3" />
      </div>

      {/* Table */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>

        {/* Toolbar */}
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <TableSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search by name, category, unit…"
          />
          <FilterSelect
            value={activeFilters.category}
            onChange={val => setFilter('category', val)}
            options={cats}
            allLabel="All Categories"
          />
          <FilterSelect
            value={statusFilter}
            onChange={val => setStatusFilter(val)}
            options={['Active', 'Inactive']}
            allLabel="All Statuses"
          />
          <div style={{ marginLeft: 'auto' }}>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <Thead cols={['ID', 'Service Name', 'Category', 'Price (ex-GST)', 'GST %', 'Total (incl-GST)', 'Unit', 'Status', '']} />
            <tbody>
              {paginated.map((item, i) => (
                <tr key={item.id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : '#FAFAFA' }}>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.brand }}>{item.id}</span></td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{item.name}</td>
                  <td style={{ padding: '12px 14px' }}><TypeTag type={item.category} /></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>₹{item.price.toLocaleString('en-IN')}</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>{item.gst}%</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: COLORS.brand }}>₹{item.total.toLocaleString('en-IN')}</span></td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{item.unit}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: item.active ? '#F0FDF4' : '#F8FAFC', color: item.active ? '#16A34A' : '#64748B' }}>
                      ● {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn" onClick={() => openModal('new_price_item', { item })} style={{ padding: '4px 9px', borderRadius: 5, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 11, fontWeight: 700 }}>Edit</button>
                      <button className="btn" onClick={() => openModal('new_quotation', { preselect: item })} style={{ padding: '4px 9px', borderRadius: 5, background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: 11, fontWeight: 700 }}>Use in Quote</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '40px 14px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>No items match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: count summary + totals + pagination */}
        {filtered.length > 0 && (
          <div style={{ padding: '10px 18px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 20, alignItems: 'center', background: '#FAFAFA', fontSize: 12 }}>
            <span style={{ color: COLORS.muted }}>
              Showing <strong style={{ color: COLORS.h2 }}>{from}–{to}</strong> of <strong style={{ color: COLORS.h2 }}>{total}</strong> item{total !== 1 ? 's' : ''}
            </span>
            <span style={{ marginLeft: 'auto', color: COLORS.muted }}>
              Total (incl-GST):&nbsp;
              <strong style={{ fontFamily: FONTS.mono, color: COLORS.brand, fontSize: 13 }}>
                ₹{filtered.reduce((s, p) => s + p.total, 0).toLocaleString('en-IN')}
              </strong>
            </span>
          </div>
        )}

        <Pagination
          page={page} totalPages={totalPages} setPage={setPage}
          pageSize={pageSize} setPageSize={setPageSize}
          from={from} to={to} total={total}
        />
      </div>
    </div>
  );
};

export default PriceListPage;