import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';

/* ── Bank Details ─────────────────────────────────────────── */
const BANK_DETAILS = {
  accountName:   'CoolTech AC Services Pvt Ltd',
  accountNumber: '1234567890123456',
  ifsc:          'HDFC0001234',
  bank:          'HDFC Bank',
  branch:        'Koramangala, Bengaluru',
  accountType:   'Current',
  upiId:         'cooltech@hdfcbank',
};

const RAZORPAY_CONFIG = {
  businessName: 'CoolTech AC Services',
  description:  'AC Service / Repair Payment',
  currency:     'INR',
  theme:        '#EA580C',
};

const PAYMENT_DATA = [
  { id:'PAY-101', invoice:'INV-2042', customer:'City Mall',       amount:25960, method:'Bank Transfer', date:'Mar 3, 2026',  ref:'NEFT8821',       status:'received', gateway:null,       payLink:null },
  { id:'PAY-100', invoice:'INV-2040', customer:'Patel Villa',     amount:1062,  method:'UPI',           date:'Mar 1, 2026',  ref:'UPI4421',        status:'received', gateway:'Razorpay', payLink:null },
  { id:'PAY-099', invoice:'INV-2038', customer:'Dr. Nair Clinic', amount:1770,  method:'Cash',          date:'Mar 1, 2026',  ref:'CASH',           status:'received', gateway:null,       payLink:null },
  { id:'PAY-098', invoice:'INV-2041', customer:'Meera Iyer',      amount:5310,  method:'Cheque',        date:'—',            ref:'—',              status:'pending',  gateway:null,       payLink:null },
  { id:'PAY-097', invoice:'INV-2039', customer:'City Mall',       amount:17700, method:'—',             date:'—',            ref:'—',              status:'overdue',  gateway:null,       payLink:'https://rzp.io/l/cooltech-inv2039' },
  { id:'PAY-096', invoice:'INV-2037', customer:'TechPark Ltd.',   amount:56640, method:'Bank Transfer', date:'Feb 28, 2026', ref:'RTGS00124',      status:'received', gateway:null,       payLink:null },
  { id:'PAY-095', invoice:'INV-2036', customer:'Sunrise Hotel',   amount:14160, method:'Razorpay',      date:'Feb 27, 2026', ref:'pay_RZP9283kl',  status:'received', gateway:'Razorpay', payLink:null },
  { id:'PAY-094', invoice:'INV-2035', customer:'Galaxy Towers',   amount:8500,  method:'Credit Card',   date:'Feb 25, 2026', ref:'CC-HDFC-2244',   status:'received', gateway:'Razorpay', payLink:null },
];

const PAY_STATUS_MAP = {
  received: { label:'Received', bg:'#F0FDF4', color:'#166534' },
  pending:  { label:'Pending',  bg:'#FFFBEB', color:'#B45309' },
  overdue:  { label:'Overdue',  bg:'#FEF2F2', color:'#DC2626' },
};

const METHOD_ICON = {
  UPI:'📱', Cash:'💵', Cheque:'📋',
  'Bank Transfer':'🏦', 'Credit Card':'💳',
  Razorpay:'⚡', '—':'❓',
};

// ─── Column config for export ─────────────────────────────────────────────────
const PAYMENT_COLUMNS = [
  {
    label: "Pay ID", key: "id", width: 12,
    tdStyle: { fontFamily: "monospace", fontWeight: 700, color: COLORS.brand, fontSize: 11 },
  },
  {
    label: "Invoice", key: "invoice", width: 12,
    tdStyle: { fontFamily: "monospace", fontSize: 11 },
  },
  {
    label: "Customer", key: "customer", width: 16,
    tdStyle: { fontWeight: 700, fontSize: 13 },
  },
  {
    label: "Amount (₹)", key: "amount", width: 12,
    format: (v) => v,
    tdStyle: { fontFamily: "monospace", fontWeight: 800, color: COLORS.brand },
  },
  {
    label: "Method", key: "method", width: 14,
    tdStyle: { fontSize: 12 },
  },
  {
    label: "Gateway", key: "gateway", width: 12,
    format: (v) => v || "Manual",
    tdStyle: { fontSize: 12 },
  },
  {
    label: "Date", key: "date", width: 12,
    tdStyle: { fontSize: 12 },
  },
  {
    label: "Ref / UTR", key: "ref", width: 14,
    tdStyle: { fontFamily: "monospace", fontSize: 11 },
  },
  {
    label: "Status", key: "status", width: 10,
    format: (v) => v,
    tdStyle: { fontSize: 12 },
  },
];

const copy = (text) => navigator.clipboard?.writeText(text).catch(() => {});

/* ── PaymentsPage ─────────────────────────────────────────── */
const PaymentsPage = ({ openModal }) => {
  const [activeTab,  setActiveTab]  = useState('transactions');
  const [bankModal,  setBankModal]  = useState(false);
  const [rzpModal,   setRzpModal]   = useState(null);

  const received = PAYMENT_DATA.filter(p => p.status === 'received').reduce((s,p) => s + p.amount, 0);
  const pending  = PAYMENT_DATA.filter(p => p.status === 'pending' ).reduce((s,p) => s + p.amount, 0);
  const overdue  = PAYMENT_DATA.filter(p => p.status === 'overdue' ).reduce((s,p) => s + p.amount, 0);

  // ── Search + filter hooks ────────────────────────────────────────────────
  const {
    q, setQ,
    activeFilters, setFilter,
    filtered: filteredPayments,
  } = useTableSearch(
    PAYMENT_DATA,
    ['id', 'invoice', 'customer', 'method', 'ref', 'status'],
    { status: '', method: '' }
  );

  const {
    paginated, page, totalPages, setPage,
    pageSize, setPageSize, from, to, total,
  } = usePagination(filteredPayments, 10);

  const { exportProps } = useExport({
    title:        "Payments & Collections",
    filename:     "cooltech-payments",
    template:     "generic_list",
    subtitle:     `AC Services Platform · Payments · ${filteredPayments.length} records`,
    docId:        "PAY-EXPORT",
    columns:      PAYMENT_COLUMNS,
    rows:         filteredPayments,
    showTotals:   true,
    totalColumns: ["amount"],
  });

  return (
    <div className="page-body">

      {/* ── Page Header ── */}
      <div className="pay-page-hdr">
        <div>
          <div className="section-title">💳 Payments &amp; Collections</div>
          <div className="section-sub">Manage all incoming payments — online and offline</div>
        </div>
        <div className="section-actions">
          <button className="btn pay-btn-bank"    onClick={() => setBankModal(true)}>🏦 Bank Details</button>
          <button className="btn pay-btn-rzp"     onClick={() => setRzpModal({ invoice:'INV-NEW', customer:'Customer', amount:0 })}>⚡ Razorpay Link</button>
          <button className="btn btn-primary"     onClick={() => openModal('record_payment')}>+ Record Payment</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid-4">
        <KCard label="Received"     value={`₹${(received/1000).toFixed(1)}K`}                    sub="this month"    icon="✅" iconBg="#F0FDF4" color="#16A34A"      delay="" />
        <KCard label="Pending"      value={`₹${(pending/1000).toFixed(1)}K`}                     sub="awaiting"      icon="⏳" iconBg="#FFFBEB" color="#B45309"      delay="1" />
        <KCard label="Overdue"      value={`₹${(overdue/1000).toFixed(1)}K`}                     sub="action needed" icon="⚠️" iconBg="#FEF2F2" color="#DC2626"      delay="2" />
        <KCard label="Total Billed" value={`₹${((received+pending+overdue)/1000).toFixed(1)}K`}  sub="all invoices"  icon="💰" iconBg="#FFF7ED" color={COLORS.brand} delay="3" />
      </div>

      {/* ── Method Summary Cards ── */}
      <div className="pay-method-grid">
        {[
          { label:'Razorpay',      icon:'⚡', color:'#4F46E5', bg:'#EEF2FF', desc:'Cards · UPI · Netbanking' },
          { label:'UPI',           icon:'📱', color:'#7C3AED', bg:'#F5F3FF', desc:'GPay · PhonePe · Paytm' },
          { label:'Bank Transfer', icon:'🏦', color:'#1D4ED8', bg:'#EFF6FF', desc:'NEFT · RTGS · IMPS' },
          { label:'Credit Card',   icon:'💳', color:'#DC2626', bg:'#FEF2F2', desc:'Visa · Mastercard · Amex' },
          { label:'Cash',          icon:'💵', color:'#16A34A', bg:'#ECFDF5', desc:'On-site collection' },
          { label:'Cheque',        icon:'📋', color:'#0369A1', bg:'#E0F2FE', desc:'Demand draft / PDC' },
        ].map(m => (
          <div key={m.label} className="pay-method-card" style={{ '--mc': m.color, '--mb': m.bg }}>
            <div className="pay-method-icon">{m.icon}</div>
            <div className="pay-method-label" style={{ color: m.color }}>{m.label}</div>
            <div className="pay-method-desc">{m.desc}</div>
            <div className="pay-method-count" style={{ color: m.color, background: m.bg }}>
              {PAYMENT_DATA.filter(p => p.method === m.label && p.status === 'received').length} payments
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="page-tabs">
        {[
          ['transactions', '📋 All Transactions'],
          ['razorpay',     '⚡ Razorpay Gateway'],
          ['bank',         '🏦 Bank Transfer'],
          ['methods',      '💡 How to Accept Payment'],
        ].map(([id, lbl]) => (
          <button
            key={id}
            className={`page-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >{lbl}</button>
        ))}
      </div>

      {/* ══ TAB: ALL TRANSACTIONS ══ */}
      {activeTab === 'transactions' && (
        <div className="card">

          {/* ── Search + filters + export ── */}
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <TableSearchBar
              value={q}
              onChange={setQ}
              placeholder="Search by pay ID, invoice, customer, ref…"
            />
            <FilterSelect
              value={activeFilters.status}
              onChange={val => setFilter("status", val)}
              options={["received", "pending", "overdue"]}
              allLabel="All Statuses"
            />
            <FilterSelect
              value={activeFilters.method}
              onChange={val => setFilter("method", val)}
              options={["UPI", "Cash", "Cheque", "Bank Transfer", "Credit Card", "Razorpay"]}
              allLabel="All Methods"
            />
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <ExportDropdown {...exportProps} />
              <button className="btn pay-btn-remind" onClick={() => openModal('send_reminder_all')}>📤 Send Reminders</button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <Thead cols={['Pay ID','Invoice','Customer','Amount','Method','Gateway','Date','Ref / UTR','Status','Actions']} />
              <tbody>
                {paginated.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? '' : 'row-alt'}>
                    <td><span className="td-brand">{p.id}</span></td>
                    <td><span className="td-mono">{p.invoice}</span></td>
                    <td><span className="td-bold">{p.customer}</span></td>
                    <td><span className="td-amount">₹{p.amount.toLocaleString()}</span></td>
                    <td>
                      <div className="pay-method-cell">
                        <span>{METHOD_ICON[p.method] || '❓'}</span>
                        <span className="pay-method-name">{p.method}</span>
                      </div>
                    </td>
                    <td>
                      {p.gateway
                        ? <span className="pay-gateway-tag">⚡ {p.gateway}</span>
                        : <span className="pay-manual-tag">Manual</span>}
                    </td>
                    <td className="td-mono">{p.date}</td>
                    <td><span className="td-mono">{p.ref}</span></td>
                    <td><SBadge s={p.status} map={PAY_STATUS_MAP} /></td>
                    <td>
                      <div className="pay-actions">
                        {p.status !== 'received' && (
                          <button className="btn btn-sm btn-success" onClick={() => openModal('record_payment')}>Mark Paid</button>
                        )}
                        {p.status !== 'received' && (
                          <button className="btn btn-sm pay-btn-link" onClick={() => setRzpModal({ invoice:p.invoice, customer:p.customer, amount:p.amount })}>⚡ Pay Link</button>
                        )}
                        {p.status === 'overdue' && (
                          <button className="btn btn-sm btn-danger" onClick={() => openModal('send_quotation', { id:p.invoice })}>Remind</button>
                        )}
                        <button className="btn btn-sm btn-ghost" onClick={() => openModal('report', { title:p.id, format:'PDF' })}>Receipt</button>
                      </div>
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
      )}

      {/* ══ TAB: RAZORPAY GATEWAY ══ */}
      {activeTab === 'razorpay' && (
        <div className="page-body">

          {/* Banner */}
          <div className="pay-rzp-banner">
            <div className="pay-rzp-banner-icon">⚡</div>
            <div className="pay-rzp-banner-body">
              <div className="pay-rzp-banner-title">Razorpay Payment Gateway</div>
              <div className="pay-rzp-banner-desc">Accept UPI, Credit/Debit Cards, Net Banking, Wallets and EMI in one integration. Send instant payment links via SMS or WhatsApp.</div>
            </div>
            <div className="pay-rzp-banner-actions">
              <button className="btn pay-btn-rzp-test" onClick={() => setRzpModal({ invoice:'INV-2041', customer:'Meera Iyer', amount:5310 })}>🧪 Test Checkout</button>
              <button className="btn pay-btn-rzp-docs">📖 API Docs →</button>
            </div>
          </div>

          {/* Integration steps */}
          <div className="card card-body">
            <div className="card-hdr-title" style={{ marginBottom: 16 }}>How to Integrate Razorpay</div>
            <div className="pay-steps-grid">
              {[
                { step:'1', title:'Install Razorpay SDK',    desc:'npm install razorpay',                                                                              code:true,  color:'#4F46E5', bg:'#EEF2FF' },
                { step:'2', title:'Add Script Tag',           desc:'<script src="https://checkout.razorpay.com/v1/checkout.js"></script>',                             code:true,  color:'#0369A1', bg:'#E0F2FE' },
                { step:'3', title:'Create Order (Backend)',   desc:'POST /v1/orders with amount, currency, receipt via your server using Razorpay Node/PHP SDK',       code:false, color:'#7C3AED', bg:'#F5F3FF' },
                { step:'4', title:'Open Checkout',            desc:"Call new Razorpay(options).open() on Pay Now click — handles all payment modes automatically",     code:false, color:'#16A34A', bg:'#ECFDF5' },
                { step:'5', title:'Verify Signature',         desc:'After payment, verify razorpay_signature on backend using HMAC SHA256 to confirm authenticity',   code:false, color:'#D97706', bg:'#FFFBEB' },
                { step:'6', title:'Webhook Events',           desc:'Set up webhook for payment.captured, payment.failed events to update your database automatically', code:false, color:'#DC2626', bg:'#FEF2F2' },
              ].map(s => (
                <div key={s.step} className="pay-step-card" style={{ background: s.bg, borderColor: s.color + '30' }}>
                  <div className="pay-step-hdr">
                    <div className="pay-step-num" style={{ background: s.color }}>{s.step}</div>
                    <div className="pay-step-title" style={{ color: s.color }}>{s.title}</div>
                  </div>
                  <div className={`pay-step-desc${s.code ? ' pay-step-code' : ''}`}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment link generator */}
          <div className="card card-body">
            <div className="card-hdr-title">Generate Payment Link</div>
            <div className="section-sub" style={{ marginBottom: 16 }}>Create and share a Razorpay payment link — customer pays online, you get notified instantly.</div>
            <div className="pay-link-gen-row">
              <div className="form-row">
                <label className="form-label">Customer Name</label>
                <input className="form-input" placeholder="Meera Iyer" defaultValue="Meera Iyer" />
              </div>
              <div className="form-row">
                <label className="form-label">Invoice</label>
                <input className="form-input" placeholder="INV-2041" defaultValue="INV-2041" />
              </div>
              <div className="form-row">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input pay-mono-input" placeholder="5310" defaultValue="5310" />
              </div>
              <button className="btn pay-btn-rzp" onClick={() => setRzpModal({ invoice:'INV-2041', customer:'Meera Iyer', amount:5310 })}>⚡ Generate Link</button>
            </div>
            <div className="pay-link-row">
              <div className="pay-link-url">https://rzp.io/l/cooltech-inv2041</div>
              <button className="btn btn-sm pay-btn-copy" onClick={() => copy('https://rzp.io/l/cooltech-inv2041')}>📋 Copy</button>
              <button className="btn btn-sm btn-success">📲 WhatsApp</button>
            </div>
          </div>

          {/* Accepted modes */}
          <div className="card card-body">
            <div className="card-hdr-title" style={{ marginBottom: 14 }}>What Razorpay Accepts</div>
            <div className="pay-accept-grid">
              {[
                { icon:'📱', label:'UPI',                desc:'GPay, PhonePe, Paytm, BHIM',         color:'#7C3AED', bg:'#F5F3FF' },
                { icon:'💳', label:'Cards',              desc:'Visa, Mastercard, RuPay, Amex',       color:'#DC2626', bg:'#FEF2F2' },
                { icon:'🏦', label:'Net Banking',        desc:'All major banks — HDFC, SBI, ICICI',  color:'#1D4ED8', bg:'#EFF6FF' },
                { icon:'👜', label:'Wallets',            desc:'Paytm, Amazon Pay, Freecharge',       color:'#16A34A', bg:'#ECFDF5' },
                { icon:'📅', label:'EMI',                desc:'No-cost EMI on cards 3–24 months',    color:'#D97706', bg:'#FFFBEB' },
                { icon:'🤝', label:'Buy Now Pay Later',  desc:'Simpl, LazyPay, ePayLater',           color:'#0369A1', bg:'#E0F2FE' },
                { icon:'🌐', label:'International Cards',desc:'For global / NRI clients',            color:'#64748B', bg:'#F8FAFC' },
                { icon:'🔗', label:'Payment Links',      desc:'No website needed — share link',      color:'#4F46E5', bg:'#EEF2FF' },
              ].map(m => (
                <div key={m.label} className="pay-accept-card" style={{ background: m.bg, borderColor: m.color + '30' }}>
                  <div className="pay-accept-icon">{m.icon}</div>
                  <div className="pay-accept-label" style={{ color: m.color }}>{m.label}</div>
                  <div className="pay-accept-desc">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: BANK TRANSFER ══ */}
      {activeTab === 'bank' && (
        <div className="page-body">

          {/* Bank card */}
          <div className="pay-bank-card">
            <div className="pay-bank-circle pay-bank-circle-1" />
            <div className="pay-bank-circle pay-bank-circle-2" />
            <div className="pay-bank-eyebrow">COMPANY BANK ACCOUNT</div>
            <div className="pay-bank-name">{BANK_DETAILS.bank}</div>
            <div className="pay-bank-branch">{BANK_DETAILS.branch}</div>
            <div className="pay-bank-details-grid">
              <div>
                <div className="pay-bank-field-label">ACCOUNT NAME</div>
                <div className="pay-bank-field-value">{BANK_DETAILS.accountName}</div>
              </div>
              <div>
                <div className="pay-bank-field-label">ACCOUNT TYPE</div>
                <div className="pay-bank-field-value">{BANK_DETAILS.accountType} Account</div>
              </div>
              <div>
                <div className="pay-bank-field-label">ACCOUNT NUMBER</div>
                <div className="pay-bank-field-value pay-bank-mono">{BANK_DETAILS.accountNumber}</div>
              </div>
              <div>
                <div className="pay-bank-field-label">IFSC CODE</div>
                <div className="pay-bank-field-value pay-bank-mono">{BANK_DETAILS.ifsc}</div>
              </div>
            </div>
            <div className="pay-bank-upi-row">
              <span className="pay-bank-upi-label">UPI ID:</span>
              <span className="pay-bank-upi-value">{BANK_DETAILS.upiId}</span>
            </div>
          </div>

          {/* Copy buttons */}
          <div className="card card-body">
            <div className="card-hdr-title" style={{ marginBottom: 14 }}>Quick Copy for Customer Communication</div>
            <div className="pay-copy-list">
              {[
                { label:'Account Number', value: BANK_DETAILS.accountNumber },
                { label:'IFSC Code',      value: BANK_DETAILS.ifsc },
                { label:'UPI ID',         value: BANK_DETAILS.upiId },
                { label:'Full Details',   value: `Account: ${BANK_DETAILS.accountName}\nBank: ${BANK_DETAILS.bank}\nAccount No: ${BANK_DETAILS.accountNumber}\nIFSC: ${BANK_DETAILS.ifsc}\nUPI: ${BANK_DETAILS.upiId}` },
              ].map(f => (
                <div key={f.label} className="pay-copy-row">
                  <div className="pay-copy-label">{f.label}</div>
                  <div className="pay-copy-value">{f.value.split('\n')[0]}{f.value.includes('\n') && '…'}</div>
                  <button className="btn btn-sm pay-btn-copy" onClick={() => copy(f.value)}>📋 Copy</button>
                </div>
              ))}
            </div>
          </div>

          {/* Transfer types */}
          <div className="card card-body">
            <div className="card-hdr-title" style={{ marginBottom: 14 }}>Bank Transfer Types Accepted</div>
            <div className="grid-2">
              {[
                { type:'NEFT', full:'National Electronic Funds Transfer', limit:'No limit',       time:'30 min – 2 hrs', icon:'🏦', color:'#1D4ED8', bg:'#EFF6FF', best:'Regular payments' },
                { type:'RTGS', full:'Real Time Gross Settlement',         limit:'Min ₹2 Lakh',    time:'Real-time',      icon:'⚡', color:'#16A34A', bg:'#ECFDF5', best:'Large B2B amounts' },
                { type:'IMPS', full:'Immediate Payment Service',          limit:'Up to ₹5 Lakh',  time:'Instant 24×7',   icon:'🚀', color:'#7C3AED', bg:'#F5F3FF', best:'Quick transfers' },
                { type:'UPI',  full:'Unified Payments Interface',         limit:'Up to ₹1 Lakh',  time:'Instant',        icon:'📱', color:'#D97706', bg:'#FFFBEB', best:'Small & medium amounts' },
              ].map(t => (
                <div key={t.type} className="pay-transfer-card" style={{ background: t.bg, borderColor: t.color + '30' }}>
                  <div className="pay-transfer-hdr">
                    <span className="pay-transfer-icon">{t.icon}</span>
                    <div>
                      <div className="pay-transfer-type" style={{ color: t.color }}>{t.type}</div>
                      <div className="pay-transfer-full">{t.full}</div>
                    </div>
                  </div>
                  <div className="pay-transfer-meta">
                    {[['Limit', t.limit],['Settlement', t.time],['Best for', t.best]].map(([k, v]) => (
                      <div key={k}>
                        <div className="pay-transfer-meta-key">{k}</div>
                        <div className="pay-transfer-meta-val">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp template */}
          <div className="card card-body">
            <div className="card-hdr-title">WhatsApp Payment Message Template</div>
            <div className="section-sub" style={{ marginBottom: 12 }}>Send this to customers requesting bank transfer instructions.</div>
            <div className="pay-wa-template">{`Dear Customer,\n\nThank you for choosing CoolTech AC Services! 🙏❄️\n\nPlease transfer the invoice amount to:\n\n🏦 Bank: ${BANK_DETAILS.bank}\n📋 Account Name: ${BANK_DETAILS.accountName}\n🔢 Account No: ${BANK_DETAILS.accountNumber}\n🏷 IFSC: ${BANK_DETAILS.ifsc}\n📱 UPI ID: ${BANK_DETAILS.upiId}\n\nAfter transfer, please share the UTR/reference number so we can confirm receipt.\n\nThank you! 😊`}</div>
            <button className="btn btn-success pay-wa-copy-btn" onClick={() => copy(`Dear Customer,\n\nThank you for choosing CoolTech AC Services!\n\nBank: ${BANK_DETAILS.bank}\nAccount: ${BANK_DETAILS.accountNumber}\nIFSC: ${BANK_DETAILS.ifsc}\nUPI: ${BANK_DETAILS.upiId}`)}>📋 Copy Message</button>
          </div>
        </div>
      )}

      {/* ══ TAB: HOW TO ACCEPT PAYMENTS ══ */}
      {activeTab === 'methods' && (
        <div className="card card-body">
          <div className="section-title" style={{ marginBottom: 4 }}>💡 All Payment Methods — How Customers Pay You</div>
          <div className="section-sub" style={{ marginBottom: 20 }}>CoolTech supports 6 ways for customers to pay their invoices.</div>
          <div className="page-body">
            {[
              { n:'1', icon:'⚡', label:'Razorpay Online Gateway',        color:'#4F46E5', bg:'#EEF2FF',
                how:"Admin generates a payment link from the Razorpay tab → shares via WhatsApp/SMS → customer clicks, chooses UPI / card / netbanking → payment credited instantly.",
                steps:["Click 'Razorpay Link' → enter invoice + amount","System generates link (e.g. rzp.io/l/cooltech-xxx)","Share link via WhatsApp to customer","Customer pays online in under 30 seconds","Admin receives notification + payment auto-marked received"],
                fee:'1.75% + GST per transaction', suitable:'All invoice amounts, remote customers' },
              { n:'2', icon:'📱', label:'UPI (GPay / PhonePe / Paytm)',   color:'#7C3AED', bg:'#F5F3FF',
                how:'Customer scans your UPI QR or sends to your UPI ID directly from any UPI app. Admin records payment with UTR number.',
                steps:['Share UPI ID: '+BANK_DETAILS.upiId,'Customer sends amount from any UPI app','Customer shares UTR/transaction ID',"Admin clicks 'Record Payment' → selects UPI → enters UTR",'Invoice marked Paid'],
                fee:'Free (no MDR on UPI since 2022)', suitable:'₹1 – ₹1 Lakh, residential customers' },
              { n:'3', icon:'🏦', label:'Bank Transfer (NEFT / RTGS / IMPS)', color:'#1D4ED8', bg:'#EFF6FF',
                how:"Customer transfers directly to your bank account. Admin confirms via bank statement and records the UTR/NEFT reference.",
                steps:["Share bank details from 'Bank Transfer' tab","Customer does NEFT/IMPS from their bank","Customer shares transaction reference (UTR)","Admin verifies in bank statement","Admin records payment with UTR reference"],
                fee:'Free (bank charges may apply to sender)', suitable:'₹2 Lakh+ commercial clients (RTGS), all amounts (NEFT/IMPS)' },
              { n:'4', icon:'💳', label:'Credit / Debit Card',             color:'#DC2626', bg:'#FEF2F2',
                how:"Via Razorpay checkout only. Generate a payment link — customer completes card payment on Razorpay's secure checkout page.",
                steps:['Generate Razorpay link for the invoice','Customer opens link, selects Card','Enters card details on Razorpay secure page','OTP verification on bank page','Payment confirmed — admin notified instantly'],
                fee:'1.75–2% + GST (Razorpay charges)', suitable:'One-time payments, AMC renewals' },
              { n:'5', icon:'💵', label:'Cash',                            color:'#16A34A', bg:'#ECFDF5',
                how:'Technician or admin collects cash on-site. Admin records cash receipt manually.',
                steps:['Technician completes job, collects cash','Issue manual cash receipt to customer',"Admin opens Payments → 'Record Payment'",'Select method: Cash, enter amount + date','Invoice marked Paid, cash logged'],
                fee:'Free', suitable:'Small residential jobs, on-site collection' },
              { n:'6', icon:'📋', label:'Cheque / Demand Draft',           color:'#0369A1', bg:'#E0F2FE',
                how:'Customer issues a cheque. Admin deposits it, waits for clearance (2-3 days), then marks the invoice paid after realisation.',
                steps:['Customer gives cheque in favour of "'+BANK_DETAILS.accountName+'"','Admin records payment as Pending + Cheque method','Deposit cheque at '+BANK_DETAILS.bank,'Wait for clearance (2-3 business days)','After clearance: edit record → status = Received'],
                fee:'Free (possible bank charges for outstation)', suitable:'Commercial clients, large AMC amounts, PDC' },
            ].map(m => (
              <div key={m.n} className="pay-howto-card" style={{ background: m.bg, borderColor: m.color + '30' }}>
                <div className="pay-howto-hdr">
                  <div className="pay-howto-icon-wrap" style={{ background: m.color }}>{m.icon}</div>
                  <div>
                    <div className="pay-howto-label" style={{ color: m.color }}>{m.label}</div>
                    <div className="pay-howto-meta">Fee: {m.fee} · Best for: {m.suitable}</div>
                  </div>
                </div>
                <div className="pay-howto-how">{m.how}</div>
                <div className="pay-howto-steps">
                  {m.steps.map((s, i) => (
                    <div key={i} className="pay-howto-step">
                      <span className="pay-howto-step-num" style={{ background: m.color }}>{i + 1}</span>
                      <span className="pay-howto-step-text">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ RAZORPAY CHECKOUT MODAL ══ */}
      {rzpModal && (
        <div className="modal-overlay" onClick={() => setRzpModal(null)}>
          <div className="pay-rzp-modal" onClick={e => e.stopPropagation()}>
            <div className="pay-rzp-modal-hdr">
              <div className="pay-rzp-modal-logo">❄</div>
              <div>
                <div className="pay-rzp-modal-biz">{RAZORPAY_CONFIG.businessName}</div>
                <div className="pay-rzp-modal-sub">Secure Payment by Razorpay</div>
              </div>
              <button className="pay-rzp-modal-close" onClick={() => setRzpModal(null)}>✕</button>
            </div>
            <div className="pay-rzp-modal-amount-row">
              <div>
                <div className="pay-rzp-modal-inv">{rzpModal.invoice} — {rzpModal.customer}</div>
                <div className="pay-rzp-modal-amount">₹{rzpModal.amount ? rzpModal.amount.toLocaleString() : '—'}</div>
              </div>
              <div className="pay-rzp-modal-secure">🔒 Secured</div>
            </div>
            <div className="pay-rzp-modal-tabs">
              {[['📱 UPI','#7C3AED'],['💳 Card','#DC2626'],['🏦 Netbanking','#1D4ED8'],['👜 Wallet','#16A34A']].map(([l]) => (
                <button key={l} className={`pay-rzp-tab${l.includes('UPI') ? ' active' : ''}`}>{l}</button>
              ))}
            </div>
            <div className="pay-rzp-modal-body">
              <label className="form-label">Enter UPI ID</label>
              <input className="form-input pay-rzp-upi-input" defaultValue="customer@okhdfcbank" />
              <div className="pay-rzp-upi-hint">e.g. mobilenumber@upi · name@bank · VPA</div>
              <button
                className="btn pay-rzp-pay-btn"
                onClick={() => {
                  alert('✅ Payment of ₹' + rzpModal.amount?.toLocaleString() + ' processed successfully!\n\nThis is a simulation. In production, Razorpay SDK handles the real payment.');
                  setRzpModal(null);
                }}
              >Pay ₹{rzpModal.amount ? rzpModal.amount.toLocaleString() : '—'}</button>
              <div className="pay-rzp-ssl-note">🔒 Your payment is secured by Razorpay. 256-bit SSL encryption.</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ BANK DETAILS MODAL ══ */}
      {bankModal && (
        <div className="modal-overlay" onClick={() => setBankModal(false)}>
          <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="pay-bank-modal-hdr">
              <span className="pay-bank-modal-hdr-icon">🏦</span>
              <div>
                <div className="pay-bank-modal-title">Bank Account Details</div>
                <div className="pay-bank-modal-sub">Share with customers for bank transfer</div>
              </div>
              <button className="pay-rzp-modal-close" onClick={() => setBankModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="pay-copy-list">
                {[
                  ['Account Name',   BANK_DETAILS.accountName],
                  ['Bank',           BANK_DETAILS.bank],
                  ['Branch',         BANK_DETAILS.branch],
                  ['Account Number', BANK_DETAILS.accountNumber],
                  ['IFSC Code',      BANK_DETAILS.ifsc],
                  ['Account Type',   BANK_DETAILS.accountType],
                  ['UPI ID',         BANK_DETAILS.upiId],
                ].map(([k, v]) => (
                  <div key={k} className="pay-copy-row">
                    <div className="pay-copy-label">{k}</div>
                    <div className="pay-copy-value pay-copy-value--bold">{v}</div>
                    <button className="btn btn-sm pay-btn-copy" onClick={() => copy(v)}>Copy</button>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ width:'100%', marginTop: 12, justifyContent:'center' }} onClick={() => copy(Object.values(BANK_DETAILS).join(' | '))}>📋 Copy All Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;