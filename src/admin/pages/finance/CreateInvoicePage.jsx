import { useState } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { NewCustomerModal } from '../../components/modals/Modals';
import { invoicesApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const LOGO_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAn0AAACuCAYAAABDRrtlAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAIdUAACHVAQSctJ0AAP+lSURBVHhe7L0HmGPpVec9PU5ksHEaT+hQSTnnnLNUSTmXpFKVVCWpco6duydnh2VNMl5YWFiMYcEEr/lsMBhjMDaYaNYY44ixPQ4T+nzPed97pVt3emY6VM/02HOe5zxXpVLp3lKpu371P+f8zy23vBKvxCvxSlxxJF7Vb4m/adCYEQwZ8yahozAsdFYbQld1ReAorg7ZCouD1mzqhD0vGVRn3njLLbfcyn+GmyBuPXq09EP99twdA5a0fsieTQic2flBR+7skDUzdcyYPcr/gh+QOHLLLerX3GGI397nKPiH7IXWkC2zMWBO7A1YEvU+e7yf/wUvadjtr5YZ82+WustShXciqPCVswr3REPhmVhTuvInJY70Y3JH+udl9tSvSG2J98nM8fdLrGPvlVoSb5dYknfLrKk1mS1RkdjSo1J71qP0FIRqT/0nb9L37NWFWv0agTV3m8SdMYqc6ZjAmc4M2tN5gT0bEVtTd9Kf9UseeA1H+vsDr1OGKkfFwapZ4q8YxaGySeot2iT+glHsy8tvi0R+hP+FP4Bxqyy/+KOy6OxxFktN44fJqcbnJ1Xjcxuykfb56eDovyCYfcfWORMxz12G3o+fVGYvLWEfxpRQ29BQAAAAhJREFUWIVjYGBg+A8AAQQAAf/9AAAAAElFTkSuQmCC';
const SIG_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAi4AAAB3CAYAAAAkVMvJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAIdUAACHVAQSctJ0AAF6xSURBVHhe7d0HmGPpVec9PU5ksHEaT+hQSTnnnLNUSTmXpFKVVCWpco6duydnh2VNMl5YWFiMYcEEr/lsMBhjMDaYaNYY44ixPQ4T+nzPed97pVt3emY6VM/02HOe5zxXpVLp3lKpu371P+f8zy23vBKvxCvxSlxxJF7Vb4m/adCYEQwZ8yahozAsdFYbQld1ReAorg7ZCouD1mzqhD0vGVRn3njLLbfcyn+GmyBuPXq09EP99twdA5a0fsieTQic2flBR+7skDUzdcyYPcr/gh+QOHLLLerX3GGI377nKPiH7IXWkC2zMWBO7A1YEvU+e7yf/wUvadjtr5YZ82+WustShXciqPCVswr3REPhmVhTuvInJY70Y3JH+udl9tSvSG2J98nM8fdLrGPvlVoSb5dYknfLrKk1mS1RkdjSo1J71qP0FIRqT/0nb9L37NWFWv0agTV3m8SdMYqc6ZjAmc4M2tN5gT0bEVtTd9Kf9UseeA1H+vsDr1OGKkfFwapZ4q8YxaGySeot2iT+glHsy8tvi0R+hP+FP4Bxqyy/+KOy6OxxFktN44fJqcbnJ1Xjcxuykfb56eDovyCYfcfWORMxz12G3o+fVGYvLWEfxpRQ29BQAAAAhJREFUWIVjYGBg+A8AAQQAAf/9AAAAAElFTkSuQmCC';

const NAVY = '#1a2e5c';

const VENDOR = {
  company: 'Alisha Engineering',
  address: 'L.I.G-II -164 G.I.D.C Housing Board, Near Chhotalal Char Rasta, Beside Swaminarayan Mandir, Odhav, Ahmedabad - 382415',
  contact: 'Vakil Yadav',
  phone: '9724763909',
  email: 'alishaengrineering@gmail.com',
};

const SAMPLE_CUSTOMERS = [
  'Galaxy Towers', 'Meera Iyer', 'TechPark Ltd.', 'City Mall',
  'Dr. Nair Clinic', 'Patel Villa', 'Sunrise Hotel', 'Sharma Residency',
];

const SAMPLE_PRODUCTS = [
  { name: 'Split AC Service (1.5T)',     rate: 599,  gst: 18 },
  { name: 'R-32 Gas Refill',             rate: 2800, gst: 18 },
  { name: 'Split AC Installation',       rate: 3500, gst: 18 },
  { name: 'Compressor Replacement (1T)', rate: 8500, gst: 18 },
  { name: 'PCB Repair',                  rate: 1800, gst: 18 },
  { name: 'Comprehensive AMC (1 Unit)',  rate: 7200, gst: 18 },
];

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque', 'EMI', 'Bank Transfer'];

/* ─── tiny helpers ─────────────────────────────────────────── */
const fmtINR = v => v.toLocaleString('en-IN', { minimumFractionDigits: 2 });

const numToWords = n => {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens  = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (!n || n === 0) return 'Zero';
  const t = Math.round(n);
  if (t < 20) return ones[t];
  if (t < 100) return tens[Math.floor(t / 10)] + (t % 10 ? ' ' + ones[t % 10] : '');
  if (t < 1000) return ones[Math.floor(t / 100)] + ' Hundred' + (t % 100 ? ' ' + numToWords(t % 100) : '');
  if (t < 100000) return numToWords(Math.floor(t / 1000)) + ' Thousand' + (t % 1000 ? ' ' + numToWords(t % 1000) : '');
  if (t < 10000000) return numToWords(Math.floor(t / 100000)) + ' Lakh' + (t % 100000 ? ' ' + numToWords(t % 100000) : '');
  return numToWords(Math.floor(t / 10000000)) + ' Crore' + (t % 10000000 ? ' ' + numToWords(t % 10000000) : '');
};

/* ─── sub-components ───────────────────────────────────────── */
const Inp = ({ label, value, onChange, placeholder, type = 'text', required = false, mono = false }) => (
  <div style={{ marginBottom: 10 }}>
    {label && (
      <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}{required && <span style={{ color: '#EF4444' }}>*</span>}
      </div>
    )}
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', padding: '8px 11px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: mono ? FONTS.mono : FONTS.sans, outline: 'none', boxSizing: 'border-box' }}
      onFocus={e => { e.target.style.borderColor = '#3B82F6'; }}
      onBlur={e  => { e.target.style.borderColor = '#CBD5E1'; }}
    />
  </div>
);

const Toggle = ({ checked, onChange, label, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <label style={{ position: 'relative', display: 'inline-block', width: 38, height: 20, cursor: 'pointer', flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: 10, background: checked ? NAVY : '#CBD5E1', transition: '.25s' }}>
        <span style={{ position: 'absolute', width: 14, height: 14, left: checked ? 20 : 3, bottom: 3, borderRadius: '50%', background: '#fff', transition: '.25s' }} />
      </span>
    </label>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94A3B8' }}>{sub}</div>}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const CreateInvoicePage = ({ onBack }) => {
  const navigate = useNavigate();

  /* ── invoice meta ──────────────────────────────────────── */
  const [invoiceNo,   setInvoiceNo]   = useState('001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate,     setDueDate]     = useState('');
  const [subject,     setSubject]     = useState('');

  /* ── customer ──────────────────────────────────────────── */
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [activeTypes,        setActiveTypes]        = useState(['Residential', 'Commercial']);
  const [customerQuery,      setCustomerQuery]      = useState('');
  const [selectedCustomer,   setSelectedCustomer]   = useState(null);
  const [showCustDrop,       setShowCustDrop]       = useState(false);
  // customer billing details (auto-filled or typed after selection)
  const [billToAddress,  setBillToAddress]  = useState('');
  const [billToContact,  setBillToContact]  = useState('');
  const [billToPhone,    setBillToPhone]    = useState('');
  const [billToEmail,    setBillToEmail]    = useState('');

  const custSuggestions = customerQuery.length > 0
    ? SAMPLE_CUSTOMERS.filter(c => c.toLowerCase().includes(customerQuery.toLowerCase()))
    : [];

  /* ── products ──────────────────────────────────────────── */
  const [productSearch, setProductSearch] = useState('');
  const [productQty,    setProductQty]    = useState('');
  const [items,         setItems]         = useState([]);
  const [showProdDrop,  setShowProdDrop]  = useState(false);

  const prodSuggestions = productSearch.length > 0
    ? SAMPLE_PRODUCTS.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : [];

  const addItem = product => {
    const qty = parseInt(productQty) || 1;
    setItems(prev => [...prev, {
      id: Date.now(), name: product.name, description: '',
      qty, rate: product.rate, discount: 0, gst: product.gst,
      total: qty * product.rate,
    }]);
    setProductSearch(''); setProductQty(''); setShowProdDrop(false);
  };

  const addBlankItem = () => setItems(prev => [...prev, {
    id: Date.now(), name: '', description: '', qty: 1, rate: 0, discount: 0, gst: 18, total: 0,
  }]);

  const updateItem = (id, key, val) => setItems(prev => prev.map(it => {
    if (it.id !== id) return it;
    const up = { ...it, [key]: ['qty', 'rate', 'discount', 'gst'].includes(key) ? (parseFloat(val) || 0) : val };
    up.total = (up.qty * up.rate) * (1 - up.discount / 100);
    return up;
  }));

  const removeItem = id => setItems(prev => prev.filter(it => it.id !== id));

  /* ── additional charges ────────────────────────────────── */
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const addCharge    = () => setAdditionalCharges(prev => [...prev, { id: Date.now(), label: 'Delivery Charge', amount: 0 }]);
  const updateCharge = (id, key, val) => setAdditionalCharges(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c));
  const removeCharge = id => setAdditionalCharges(prev => prev.filter(c => c.id !== id));

  /* ── discount / notes / terms ──────────────────────────── */
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [notes,     setNotes]     = useState('');
  const [terms,     setTerms]     = useState('* If you have any questions about this invoice, feel free to contact us.');
  const [showNotes, setShowNotes] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

  /* ── bank ──────────────────────────────────────────────── */
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAdded,     setBankAdded]     = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: 'Alisha Engineering', accountNo: '', confirmAccountNo: '',
    ifsc: '', bankName: '', branch: '', upi: '', upiNumber: '', notes: '', isDefault: false,
  });
  const setBD = key => e => setBankDetails(p => ({ ...p, [key]: e.target.value }));

  /* ── payment ───────────────────────────────────────────── */
  const [paymentNotes,  setPaymentNotes]  = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode,   setPaymentMode]   = useState('Cash');
  const [payModeOpen,   setPayModeOpen]   = useState(false);
  const [splitPayments, setSplitPayments] = useState([]);
  const [showSplit,     setShowSplit]      = useState(false);
  const [markPaid,      setMarkPaid]      = useState(false);

  const addSplit    = () => setSplitPayments(p => [...p, { id: Date.now(), mode: 'Cash', amount: 0, notes: '' }]);
  const removeSplit = id => setSplitPayments(p => p.filter(s => s.id !== id));
  const updateSplit = (id, key, val) => setSplitPayments(p => p.map(s => s.id === id ? { ...s, [key]: val } : s));

  /* ── totals ────────────────────────────────────────────── */
  const subtotal     = items.reduce((s, it) => s + it.total, 0);
  const extraCharges = additionalCharges.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const gstAmount    = items.reduce((s, it) => s + (it.total * it.gst / 100), 0);
  const discountAmt  = subtotal * (globalDiscount / 100);
  const grandTotal   = subtotal + extraCharges + gstAmount - discountAmt;

  /* ── save ──────────────────────────────────────────────── */
  const [saving, setSaving] = useState(false);

  const handleSave = async (asDraft = false) => {
    if (!selectedCustomer && !customerQuery.trim()) {
      alert('customer name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        invoiceNo: `INV-${invoiceNo}`,
        subject,
        date:    invoiceDate,
        dueDate,
        status:  asDraft ? 'draft' : (markPaid ? 'paid' : 'pending'),

        // customer
        customer: selectedCustomer || customerQuery.trim(),
        billToAddress,
        billToContact,
        billToPhone,
        billToEmail,

        // line items (strip internal `id` field)
        items: items.map(({ id: _id, ...rest }) => rest),

        // charges
        additionalCharges: additionalCharges.map(({ id: _id, ...rest }) => rest),

        // totals
        subtotal:      Math.round(subtotal),
        tax:           Math.round(gstAmount),
        discount:      Math.round(discountAmt),
        extraCharges:  Math.round(extraCharges),
        total:         Math.round(grandTotal),
        amount:        Math.round(subtotal),

        // discount
        globalDiscount,

        // notes / terms
        notes,
        terms,

        // payment
        paymentNotes,
        paymentMode,
        paymentAmount: parseFloat(paymentAmount) || 0,
        splitPayments,

        // bank
        ...(bankAdded ? { bankDetails } : {}),
      };

      await invoicesApi.create(payload);
      navigate('/invoices');
    } catch (err) {
      alert(err?.message || 'Failed to save invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── style helpers ─────────────────────────────────────── */
  const card = { background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 16 };
  const hdr  = (extra = {}) => ({ padding: '13px 18px', borderBottom: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700, color: NAVY, background: '#F8FAFC', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...extra });
  const body = { padding: '18px' };
  const cell = (ex = {}) => ({ border: `1px solid ${NAVY}`, padding: '7px 10px', fontSize: 12, verticalAlign: 'top', ...ex });
  const btn  = (bg = NAVY, color = '#fff', ex = {}) => ({ padding: '8px 18px', borderRadius: 7, border: 'none', background: bg, color, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONTS.sans, opacity: saving ? 0.7 : 1, ...ex });

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: FONTS.sans, background: '#F1F5F9', minHeight: '100vh', paddingBottom: 40 }}>

      {/* TOP BAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => (onBack ? onBack() : navigate('/invoices'))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }}>←</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>Create Invoice</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{VENDOR.company}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>INV-</span>
          <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)}
            style={{ width: 80, padding: '7px 10px', border: '1.5px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: FONTS.mono, fontWeight: 700, outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn('#F1F5F9', '#374151', { border: '1px solid #CBD5E1' })} onClick={() => handleSave(true)} disabled={saving}>
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button style={btn('#E0F2FE', '#0369A1', { border: '1px solid #BAE6FD' })} onClick={() => handleSave(false)} disabled={saving}>
            Save and Print
          </button>
          <button style={btn(NAVY, '#fff', { boxShadow: '0 3px 10px rgba(26,46,92,.3)' })} onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Saving…' : 'Save →'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '24px auto', padding: '0 16px' }}>

        {/* ── INVOICE DETAILS ─────────────────────────────── */}
        <div style={card}>
          <div style={hdr()}>Invoice Details</div>
          <div style={body}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 14 }}>

              {/* Customer search */}
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Select Customer / Company <span style={{ color: '#EF4444' }}>*</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={selectedCustomer || customerQuery}
                    onChange={e => { setCustomerQuery(e.target.value); setSelectedCustomer(null); setShowCustDrop(true); }}
                    onFocus={() => setShowCustDrop(true)}
                    placeholder="Search by name, company, GSTIN…"
                    style={{ flex: 1, padding: '8px 11px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, outline: 'none' }}
                  />
                  <button style={btn('#EFF6FF', '#1D4ED8', { border: '1px solid #BFDBFE', fontSize: 11, padding: '6px 10px', whiteSpace: 'nowrap' })}
                    onClick={() => setShowCreateCustomer(true)}>
                    + Create
                  </button>
                </div>
                {showCustDrop && custSuggestions.length > 0 && (
                  <>
                    <div onClick={() => setShowCustDrop(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 10, overflow: 'hidden' }}>
                      {custSuggestions.map(c => (
                        <div key={c} onClick={() => { setSelectedCustomer(c); setCustomerQuery(c); setShowCustDrop(false); }}
                          style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F1F5F9' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          {c}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Inp label="Invoice Date" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} required />
              <Inp label="Due Date"     type="date" value={dueDate}     onChange={e => setDueDate(e.target.value)} />
            </div>
            <Inp label="Invoice Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. AC Service for Sharma Residency" />
          </div>
        </div>

        {/* ── BILL FROM / TO ───────────────────────────────── */}
        <div style={card}>
          <div style={hdr()}>Bill From / Bill To</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <td style={cell({ background: NAVY, color: '#fff', fontWeight: 800, textAlign: 'center', fontSize: 12 })}>Bill From:</td>
                  <td style={cell({ background: NAVY, color: '#fff', fontWeight: 800, textAlign: 'center', fontSize: 12 })}>Bill To:</td>
                </tr>
              </thead>
              <tbody>
                {/* Bill-To fields are editable so they flow into the invoice template */}
                {[
                  ['Company Name:',    VENDOR.company,  selectedCustomer || customerQuery || '—',  null,              null],
                  ['Address:',         VENDOR.address,  billToAddress,                              setBillToAddress,  'Billing address'],
                  ['Contact Person:',  VENDOR.contact,  billToContact,                              setBillToContact,  'Contact name'],
                  ['Phone No:',        VENDOR.phone,    billToPhone,                                setBillToPhone,    'Phone number'],
                  ['Email:',           VENDOR.email,    billToEmail,                                setBillToEmail,    'Email address'],
                ].map(([label, fromVal, toVal, toSetter, ph]) => (
                  <tr key={label}>
                    <td style={cell()}><span style={{ fontWeight: 700 }}>{label} </span>{fromVal}</td>
                    <td style={cell()}>
                      <span style={{ fontWeight: 700 }}>{label} </span>
                      {toSetter
                        ? <input value={toVal} onChange={e => toSetter(e.target.value)} placeholder={ph}
                            style={{ marginLeft: 4, padding: '3px 6px', border: '1px solid #CBD5E1', borderRadius: 5, fontSize: 12, outline: 'none', width: 'calc(100% - 110px)' }} />
                        : <span style={{ color: toVal === '—' ? '#94A3B8' : '#111' }}>{toVal}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PRODUCTS & SERVICES ─────────────────────────── */}
        <div style={card}>
          <div style={hdr()}>
            <span>Products &amp; Services</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B', cursor: 'pointer', fontWeight: 500 }}>
              <input type="checkbox" defaultChecked style={{ accentColor: NAVY }} />
              Show description
            </label>
          </div>
          <div style={body}>

            {/* Search bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                <input value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProdDrop(true); }}
                  onFocus={() => setShowProdDrop(true)}
                  placeholder="🔍 Search or scan barcode for existing products"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
                {showProdDrop && prodSuggestions.length > 0 && (
                  <>
                    <div onClick={() => setShowProdDrop(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 10, overflow: 'hidden' }}>
                      {prodSuggestions.map(p => (
                        <div key={p.name} onClick={() => addItem(p)}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>₹{p.rate.toLocaleString()} + {p.gst}% GST</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <input value={productQty} onChange={e => setProductQty(e.target.value)}
                placeholder="Qty" style={{ width: 80, padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              <button style={btn('#F0F9FF', '#0369A1', { border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', gap: 5 })}
                onClick={addBlankItem}>
                + Add New Product
              </button>
            </div>

            {/* Items table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', marginBottom: 10 }}>
                <thead>
                  <tr style={{ background: NAVY }}>
                    {['SR.NO', 'DESCRIPTION', 'QTY', 'RATE (₹)', 'DISC %', 'TOTAL', ''].map(h => (
                      <th key={h} style={cell({ background: NAVY, color: '#fff', fontWeight: 800, fontSize: 11, textAlign: 'center', letterSpacing: 0.5 })}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                      <td style={cell({ textAlign: 'center', width: 46, color: '#888', fontSize: 12 })}>{i + 1}</td>
                      <td style={cell()}>
                        <input value={it.name} onChange={e => updateItem(it.id, 'name', e.target.value)} placeholder="Product / Service name"
                          style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, fontFamily: FONTS.sans, background: 'transparent' }} />
                      </td>
                      <td style={cell({ width: 64, textAlign: 'center' })}>
                        <input value={it.qty} onChange={e => updateItem(it.id, 'qty', e.target.value)} type="number" min="0"
                          style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, textAlign: 'center', fontFamily: FONTS.mono, background: 'transparent' }} />
                      </td>
                      <td style={cell({ width: 110, textAlign: 'right' })}>
                        <input value={it.rate} onChange={e => updateItem(it.id, 'rate', e.target.value)} type="number" min="0"
                          style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, textAlign: 'right', fontFamily: FONTS.mono, background: 'transparent' }} />
                      </td>
                      <td style={cell({ width: 80, textAlign: 'center' })}>
                        <input value={it.discount} onChange={e => updateItem(it.id, 'discount', e.target.value)} type="number" min="0" max="100"
                          style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, textAlign: 'center', fontFamily: FONTS.mono, background: 'transparent' }} />
                      </td>
                      <td style={cell({ width: 110, textAlign: 'right', fontWeight: 700, fontFamily: FONTS.mono })}>
                        ₹{fmtINR(it.total)}
                      </td>
                      <td style={cell({ width: 34, textAlign: 'center' })}>
                        <button onClick={() => removeItem(it.id)}
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', fontSize: 11 }}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13, border: '1px solid #E2E8F0' }}>
                        Search existing products or click <strong>+ Add New Product</strong> to get started 🚀
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8', marginBottom: 10 }}>
              Items: {items.length}, Qty: {items.reduce((s, it) => s + it.qty, 0).toFixed(1)}
            </div>

            {/* Additional Charges */}
            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: 12 }}>
              <button onClick={addCharge} style={btn('#1A1A2E', '#fff', { fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 })}>
                ● Additional Charges
              </button>
              {additionalCharges.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <input value={c.label} onChange={e => updateCharge(c.id, 'label', e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, outline: 'none' }}
                    placeholder="Charge label (e.g. Delivery Charge)" />
                  <input value={c.amount} onChange={e => updateCharge(c.id, 'amount', e.target.value)} type="number" min="0"
                    style={{ width: 120, padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: FONTS.mono, outline: 'none' }}
                    placeholder="Amount" />
                  <button onClick={() => removeCharge(c.id)}
                    style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 5, padding: '5px 9px', cursor: 'pointer', fontSize: 11 }}>✕</button>
                </div>
              ))}
            </div>

            {/* Tax breakdown */}
            <div style={{ marginTop: 16, background: '#F8FAFC', borderRadius: 8, padding: '12px 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['Tax', 'Rate (%)', 'Taxable (₹)', 'With Tax (₹)'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'right', color: '#64748B', fontWeight: 600, letterSpacing: 0.3 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...new Set(items.map(it => it.gst))].sort().map(rate => {
                    const base = items.filter(it => it.gst === rate).reduce((s, it) => s + it.total, 0);
                    return (
                      <tr key={rate}>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>GST</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: FONTS.mono }}>{rate}%</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: FONTS.mono }}>₹{fmtINR(base)}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: FONTS.mono }}>₹{fmtINR(base * (1 + rate / 100))}</td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8', padding: '12px' }}>No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Global discount */}
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#374151' }}>Apply discount (%) to all items?</span>
              <input value={globalDiscount} onChange={e => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                type="number" min="0" max="100"
                style={{ width: 72, padding: '6px 10px', border: '1.5px solid #EA580C', borderRadius: 7, fontSize: 13, fontFamily: FONTS.mono, outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* ── BOTTOM SECTION ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* LEFT col */}
          <div>
            {/* Notes */}
            <div style={card}>
              <div style={{ ...hdr(), cursor: 'pointer' }} onClick={() => setShowNotes(p => !p)}>
                <span>{showNotes ? '▾' : '▸'} Notes</span>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>optional</span>
              </div>
              {showNotes && (
                <div style={body}>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Enter your notes, say thanks, or anything else" rows={3}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: FONTS.sans, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            {/* Terms */}
            <div style={card}>
              <div style={{ ...hdr(), cursor: 'pointer' }} onClick={() => setShowTerms(p => !p)}>
                <span>{showTerms ? '▾' : '▸'} Terms &amp; Conditions</span>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>optional</span>
              </div>
              {showTerms && (
                <div style={body}>
                  <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={4}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: FONTS.sans, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            {/* Bank */}
            <div style={card}>
              <div style={body}>
                <button onClick={() => setShowBankModal(true)}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: `2px dashed ${bankAdded ? '#16A34A' : '#BFDBFE'}`, background: bankAdded ? '#F0FDF4' : '#EFF6FF', color: bankAdded ? '#16A34A' : '#1D4ED8', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  🏛 {bankAdded ? '✓ Bank Added to Invoice' : 'Add Bank to Invoice (Optional)'}
                </button>
                {bankAdded && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#374151', background: '#F0FDF4', borderRadius: 7, padding: '10px 12px', border: '1px solid #BBF7D0' }}>
                    <div><strong>{bankDetails.bankName}</strong> · {bankDetails.branch}</div>
                    <div style={{ fontFamily: FONTS.mono, marginTop: 2 }}>A/C: {bankDetails.accountNo} &nbsp;|&nbsp; IFSC: {bankDetails.ifsc}</div>
                    {bankDetails.upi && <div>UPI: {bankDetails.upi}</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Signature */}
            <div style={card}>
              <div style={body}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ border: '1.5px dashed #CBD5E1', borderRadius: 8, padding: '14px', background: '#FAFAFA', marginBottom: 8, display: 'inline-block' }}>
                    <img src={SIG_IMG} alt="Signature" style={{ height: 42, objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.4) brightness(0.7)' }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>[Authorized Signatory] — {VENDOR.contact}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>From: {VENDOR.company}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT col */}
          <div>
            {/* Invoice Summary */}
            <div style={card}>
              <div style={hdr()}>Invoice Summary</div>
              <div style={body}>
                {[
                  ['Subtotal',   `₹${fmtINR(subtotal)}`],
                  ['GST',        `₹${fmtINR(gstAmount)}`],
                  ...additionalCharges.map(c => [c.label, `₹${fmtINR(parseFloat(c.amount) || 0)}`]),
                  ...(globalDiscount > 0 ? [['Discount', `-₹${fmtINR(discountAmt)}`]] : []),
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>{k}</span>
                    <span style={{ fontFamily: FONTS.mono, color: '#374151' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 6px', fontSize: 17, fontWeight: 800, borderTop: `2px solid ${NAVY}`, marginTop: 6 }}>
                  <span style={{ color: NAVY }}>Total Amount</span>
                  <span style={{ fontFamily: FONTS.mono, color: NAVY }}>₹{fmtINR(grandTotal)}</span>
                </div>
                {grandTotal > 0 && (
                  <div style={{ background: '#F0F9FF', borderRadius: 7, padding: '8px 12px', fontSize: 11, color: '#0369A1', marginTop: 6 }}>
                    <strong>Amount in words:</strong> {numToWords(Math.round(grandTotal))} Rupees Only
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div style={card}>
              <div style={hdr()}>
                <span>Add Payment</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={markPaid} onChange={e => setMarkPaid(e.target.checked)} style={{ accentColor: NAVY }} />
                  Mark as fully paid
                </label>
              </div>
              <div style={body}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>NOTES</div>
                    <textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
                      placeholder="Advance received, UTR number etc…" rows={2}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 12, fontFamily: FONTS.sans, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>AMOUNT</div>
                    <input value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" min="0"
                      style={{ width: 96, padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: FONTS.mono, outline: 'none' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>PAYMENT MODE</div>
                    <button onClick={() => setPayModeOpen(p => !p)}
                      style={btn('#fff', '#374151', { border: '1px solid #CBD5E1', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 132 })}>
                      {paymentMode} <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94A3B8' }}>▾</span>
                    </button>
                    {payModeOpen && (
                      <>
                        <div onClick={() => setPayModeOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 10, minWidth: 150, overflow: 'hidden' }}>
                          {PAYMENT_MODES.map(m => (
                            <div key={m} onClick={() => { setPaymentMode(m); setPayModeOpen(false); }}
                              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, background: paymentMode === m ? '#EFF6FF' : 'transparent', fontWeight: paymentMode === m ? 700 : 400, color: paymentMode === m ? '#1D4ED8' : '#374151', borderBottom: '1px solid #F1F5F9' }}
                              onMouseEnter={e => { if (paymentMode !== m) e.currentTarget.style.background = '#F8FAFC'; }}
                              onMouseLeave={e => { if (paymentMode !== m) e.currentTarget.style.background = 'transparent'; }}>
                              {m}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                  <button onClick={() => { setShowSplit(p => !p); if (!showSplit) addSplit(); }}
                    style={{ background: 'none', border: 'none', color: NAVY, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    ⊕ Split Payment
                  </button>
                  {splitPayments.map((sp, i) => (
                    <div key={sp.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 8, alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>#{i + 2}</span>
                      <select value={sp.mode} onChange={e => updateSplit(sp.id, 'mode', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 12, outline: 'none' }}>
                        {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                      </select>
                      <input value={sp.amount} onChange={e => updateSplit(sp.id, 'amount', e.target.value)} type="number" min="0"
                        style={{ width: 90, padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 12, fontFamily: FONTS.mono, outline: 'none' }} />
                      <button onClick={() => removeSplit(sp.id)}
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 5, padding: '4px 7px', cursor: 'pointer', fontSize: 11 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SAVE */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button style={btn('#F1F5F9', '#374151', { border: '1px solid #CBD5E1' })} onClick={() => handleSave(true)} disabled={saving}>
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button style={btn('#E0F2FE', '#0369A1', { border: '1px solid #BAE6FD' })} onClick={() => handleSave(false)} disabled={saving}>
            Save and Print
          </button>
          <button style={btn(NAVY, '#fff', { boxShadow: '0 3px 10px rgba(26,46,92,.3)' })} onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Saving…' : 'Save →'}
          </button>
        </div>
      </div>

      {/* ── BANK MODAL ───────────────────────────────────── */}
      {showBankModal && (
        <div onClick={() => setShowBankModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 480, height: '100%', background: '#fff', overflow: 'auto', paddingBottom: 40, boxShadow: '-4px 0 30px rgba(0,0,0,.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: NAVY }}>🏛 Bank Details</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setBankAdded(true); setShowBankModal(false); }} style={btn(NAVY, '#fff', { padding: '8px 18px' })}>Save &amp; Update</button>
                <button onClick={() => setShowBankModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94A3B8' }}>✕</button>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <Inp label="Account Holder Name" value={bankDetails.accountName} onChange={setBD('accountName')} />
              <Inp label="Account No" value={bankDetails.accountNo} onChange={setBD('accountNo')} required mono />
              <Inp label="Confirm Bank Account No" value={bankDetails.confirmAccountNo} onChange={setBD('confirmAccountNo')} required mono />
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>IFSC Code <span style={{ color: '#EF4444' }}>*</span></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={bankDetails.ifsc} onChange={setBD('ifsc')} placeholder="IFSC Code"
                    style={{ flex: 1, padding: '8px 11px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: FONTS.mono, outline: 'none' }} />
                  <button style={btn('#EFF6FF', '#1D4ED8', { border: '1px solid #BFDBFE', fontSize: 12 })}>Fetch Bank Details</button>
                </div>
              </div>
              <Inp label="Bank Name"   value={bankDetails.bankName} onChange={setBD('bankName')} required />
              <Inp label="Branch Name" value={bankDetails.branch}   onChange={setBD('branch')}   required />
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>UPI <span style={{ fontSize: 10, background: '#F1F5F9', color: '#94A3B8', padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>OPTIONAL</span></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={bankDetails.upi} onChange={setBD('upi')} placeholder="UPI ID eg. username@okicici"
                    style={{ flex: 1, padding: '8px 11px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: FONTS.mono, outline: 'none' }} />
                  <button style={btn('#EFF6FF', '#1D4ED8', { border: '1px solid #BFDBFE', fontSize: 12 })}>Verify UPI ID</button>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>This UPI ID will generate <strong>Dynamic QR codes</strong> on invoices and bills.</div>
              </div>
              <Inp label="UPI Number (Optional)" value={bankDetails.upiNumber} onChange={setBD('upiNumber')} mono placeholder="GPay/PhonePe Number" />
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>Notes</div>
                <textarea value={bankDetails.notes} onChange={setBD('notes')} placeholder="Beneficiary Name, SWIFT Code etc…" rows={3}
                  style={{ width: '100%', padding: '8px 11px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: FONTS.sans, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginBottom: 16 }}>
                <Toggle checked={bankDetails.isDefault} onChange={e => setBankDetails(p => ({ ...p, isDefault: e.target.checked }))}
                  label="Default" sub="This will override your previous default bank" />
              </div>
              <button onClick={() => { setBankAdded(true); setShowBankModal(false); }} style={btn(NAVY, '#fff', { width: '100%', padding: '12px' })}>Save &amp; Update</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW CUSTOMER MODAL ─────────────────────────── */}
      <NewCustomerModal
        open={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        onSave={data => {
          setSelectedCustomer(data.name || customerQuery);
          setCustomerQuery(data.name || customerQuery);
          setShowCreateCustomer(false);
        }}
        activeTypes={activeTypes}
        onAddType={newType => setActiveTypes(prev => [...prev, newType])}
      />
    </div>
  );
};

export default CreateInvoicePage;