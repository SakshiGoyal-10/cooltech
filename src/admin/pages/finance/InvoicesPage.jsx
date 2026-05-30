import { INV_STATUS } from '../../constants/statusMaps';
import { invoicesApi } from '../../services/api';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { KCard, Thead } from '../../components/ui/Cards';
import EditableDetailView from '../../components/ui/EditableDetailView';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import PDFPreview from '../../components/layout/PDFPreview';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { useNavigate } from 'react-router-dom';
import { addToDeleted } from '../../store/deletedStore';
import logoImg      from '../../assets/logo.png';
import qrImg        from '../../assets/qrcode.png';
import signatureImg from '../../assets/signature.png';

/* ─── Column config for export ───────────────────────────── */
const INVOICE_COLUMNS = [
  { label: 'Invoice #',      key: 'id',       width: 13, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: COLORS.brand, fontSize: 11 } },
  { label: 'Job / Contract', key: 'job',      width: 18, tdStyle: { fontFamily: 'monospace', fontSize: 11, color: COLORS.muted } },
  { label: 'Customer',       key: 'customer', width: 18, tdStyle: { fontSize: 13, fontWeight: 700 } },
  { label: 'Amount (₹)',     key: 'amount',   width: 12, format: v => v, tdStyle: { fontFamily: 'monospace', fontWeight: 600 } },
  { label: 'GST (₹)',        key: 'tax',      width: 10, format: v => v, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Total (₹)',      key: 'total',    width: 12, format: v => v, tdStyle: { fontFamily: 'monospace', fontWeight: 800, color: COLORS.brand } },
  { label: 'Date',           key: 'date',     width: 10, tdStyle: { fontSize: 12 } },
  { label: 'Due',            key: 'due',      width: 10, tdStyle: { fontSize: 12 } },
  { label: 'Status',         key: 'status',   width: 10, format: v => v, tdStyle: { fontSize: 12 } },
];

/* ─── Company constants ──────────────────────────────────── */
const CO = {
  name:      'Alisha Engineering',
  tag1:      'Installation Maintenance & Repair of Air Conditioning,',
  tag2:      'Electronics Appliance, Fabrication & Insulation Works.',
  address:   'L.I.G-II -164 G.I.D.C HOUSING BOARD NEAR CHHOTALAL CHAR RASTA BESIDE SWAMINARAYAN MANDIR ODAHAV AHMEDABAD-382415',
  contact:   'Vakil Yadav',
  phone:     '9724763909',
  email:     'alishaengrineering@gmail.com',
  bank:      'Bank of Baroda',
  account:   '06780200000745',
  ifsc:      'BARB0ODHAVE',
  branch:    'Odhav Branch',
  signatory: 'Mr. VAKIL YADAV',
};

/* ─── Number → Indian words ──────────────────────────────── */
const toWords = n => {
  if (!n) return '';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const conv = num => {
    if (num === 0)       return '';
    if (num < 20)        return ones[num] + ' ';
    if (num < 100)       return tens[Math.floor(num / 10)] + ' ' + ones[num % 10] + ' ';
    if (num < 1000)      return ones[Math.floor(num / 100)] + ' Hundred ' + conv(num % 100);
    if (num < 100000)    return conv(Math.floor(num / 1000))    + 'Thousand ' + conv(num % 1000);
    if (num < 10000000)  return conv(Math.floor(num / 100000))  + 'Lakh '     + conv(num % 100000);
    return                      conv(Math.floor(num / 10000000)) + 'Crore '    + conv(num % 10000000);
  };
  return conv(Math.round(n)).trim() + ' Rupees Only';
};

/* ─── Border constants ───────────────────────────────────── */
const B  = '1px solid #000';
const BL = '1px solid #bbb';

/* ─── Inline input helper ────────────────────────────────── */
const iS = (extra = {}) => ({
  padding: '4px 7px', borderRadius: 5,
  border: `1.5px solid ${COLORS.brand}70`,
  fontSize: 12, color: COLORS.h2, background: '#FAFFFE',
  fontFamily: FONTS.sans, outline: 'none',
  width: '100%', boxSizing: 'border-box', ...extra,
});

/* ─── normaliseInvoice ───────────────────────────────────── *
 * Accepts the raw API document (which may come from either
 * the legacy manual form OR the new CreateInvoicePage) and
 * produces a consistent shape that InvoiceTemplate can render.
 *
 * Key additions vs. original:
 *  - items / additionalCharges (line-item arrays)
 *  - subject, notes, terms
 *  - billTo* customer detail fields
 *  - globalDiscount
 */
const normaliseInvoice = inv => {
  /* ── totals ───────────────────────────────────────────── */
  const amount = inv.amount ?? inv.subtotal ?? 0;
  const tax    = inv.tax    ?? inv.gst      ?? Math.round(amount * 0.18);
  const total  = inv.total  ?? inv.grandTotal ?? (amount + tax);

  /* ── customer ─────────────────────────────────────────── */
  const customer =
    typeof inv.customer === 'object' && inv.customer !== null
      ? (inv.customer.name ?? inv.customer.companyName ?? String(inv.customer._id ?? ''))
      : (inv.customerName ?? inv.customer ?? '');

  /* ── job ──────────────────────────────────────────────── */
  const job =
    typeof inv.job === 'object' && inv.job !== null
      ? (inv.job.jobId ?? ('JOB-' + String(inv.job._id ?? '').slice(-6).toUpperCase()))
      : typeof inv.jobId === 'object' && inv.jobId !== null
        ? ('JOB-' + String(inv.jobId._id ?? inv.jobId).slice(-6).toUpperCase())
        : (inv.jobId ?? inv.job ?? inv.contractId ?? '');

  /* ── line items ───────────────────────────────────────── *
   * Prefer inv.items (set by CreateInvoicePage).
   * Fall back to two synthetic rows built from subtotal if
   * the document came from the old form.
   */
  let items = [];
  if (Array.isArray(inv.items) && inv.items.length > 0) {
    items = inv.items.map((it, i) => ({
      sr:    i + 1,
      desc:  it.name ?? it.desc ?? it.description ?? '',
      qty:   it.qty   ?? 1,
      rate:  it.rate  ?? 0,
      total: it.total ?? ((it.qty ?? 1) * (it.rate ?? 0)),
      gst:   it.gst   ?? 18,
      discount: it.discount ?? 0,
    }));
  } else {
    // legacy fallback: two synthetic rows
    items = [
      { sr: 1,  desc: 'AC Service / Repair Labour', qty: 1, rate: Math.round(amount * 0.6), total: Math.round(amount * 0.6), gst: 18, discount: 0 },
      { sr: 2,  desc: 'Parts & Consumables',        qty: 1, rate: Math.round(amount * 0.4), total: Math.round(amount * 0.4), gst: 18, discount: 0 },
    ];
  }

  /* ── additional charges ───────────────────────────────── */
  const additionalCharges = Array.isArray(inv.additionalCharges) ? inv.additionalCharges : [];

  /* ── date / due ───────────────────────────────────────── */
  const date = inv.date ?? (inv.createdAt
    ? new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '');
  const due = inv.due ?? inv.dueDate ?? '';

  return {
    ...inv,
    id: inv.invoiceId ?? inv.invoiceNumber ?? ('INV-' + String(inv._id).slice(-6).toUpperCase()),
    customer,
    job,
    amount,
    tax,
    total,
    date,
    due,
    status: inv.status ?? 'pending',

    // ── NEW fields from CreateInvoicePage ──────────────── //
    items,
    additionalCharges,
    subject:          inv.subject         ?? '',
    notes:            inv.notes           ?? '',
    terms:            inv.terms           ?? '',
    globalDiscount:   inv.globalDiscount  ?? 0,

    // billing contact
    billToAddress: inv.billToAddress ?? '',
    billToContact: inv.billToContact ?? '',
    billToPhone:   inv.billToPhone   ?? '',
    billToEmail:   inv.billToEmail   ?? '',
  };
};

/* ─── InvoiceTemplate ────────────────────────────────────── *
 * Renders the physical invoice document.
 * In view mode it shows saved data.
 * In edit mode every text cell becomes an <input>.
 *
 * Row data now comes directly from invoice.items (set by
 * CreateInvoicePage and preserved through normaliseInvoice).
 */
const InvoiceTemplate = ({ invoice, editMode, editData, setEditData }) => {
  const val  = key => editData?.[key] ?? invoice[key] ?? '';
  const setK = key => e => setEditData(p => ({ ...p, [key]: e.target.value }));

  /* ── Build editable rows from the invoice's items array ─ */
  const buildRows = src => {
    const base = (src ?? []).map(it => ({
      sr:   it.sr ?? '',
      desc: it.desc ?? it.name ?? it.description ?? '',
      qty:  it.qty  ?? '',
      rate: it.rate ?? '',
    }));
    // pad to at least 6 rows so the table always looks full
    while (base.length < 6) base.push({ sr: '', desc: '', qty: '', rate: '' });
    return base;
  };

  const [rows, setRows] = useState(() => buildRows(invoice.items));

  // if the invoice prop changes (e.g. user navigates to a different invoice),
  // refresh the rows
  useEffect(() => { setRows(buildRows(invoice.items)); }, [invoice._id]);

  const updateRow = (i, field, v) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: v } : r));

  /* ── Totals ─────────────────────────────────────────── */
  // Use saved totals when available; recalculate from rows only as fallback
  const subtotalFromRows  = rows.reduce((s, r) => s + ((parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0)), 0);
  const subtotal   = invoice.amount > 0 ? invoice.amount : subtotalFromRows;
  const gst        = invoice.tax    > 0 ? invoice.tax    : Math.round(subtotal * 0.18);
  const grandTotal = invoice.total  > 0 ? invoice.total  : (subtotal + gst);

  /* ── Additional charges ─────────────────────────────── */
  const charges = val('additionalCharges') || invoice.additionalCharges || [];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#000', background: '#fff', width: '100%' }}>

      {/* SECTION 1 — Header */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
        <tbody>
          <tr>
            <td style={{ padding: '10px 10px 4px 0', verticalAlign: 'top', width: '62%' }}>
              <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>{CO.tag1}</div>
              <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4, marginBottom: 5, borderBottom: '2px solid #1E3A5F' }}>{CO.tag2}</div>
              <div style={{ fontSize: 11, color: '#333', lineHeight: 1.5 }}>{CO.address}</div>
            </td>
            <td style={{ padding: '6px 0 4px 10px', verticalAlign: 'middle', textAlign: 'right', width: '38%' }}>
              <img src={logoImg} alt="Alisha Engineering"
                style={{ maxHeight: 85, maxWidth: 210, objectFit: 'contain' }}
                onError={e => { e.target.outerHTML = `<div style="font-size:22px;font-weight:900;color:#1E3A5F;font-family:Arial;text-align:right;line-height:1.2">ALISHA<br/>ENGINEERING</div>`; }}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ borderBottom: '2px solid #1E3A5F', margin: '4px 0 0' }} />

      {/* SECTION 2 — Invoice # and Date */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 0', fontWeight: 700, fontSize: 12, width: '50%' }}>
              {'Invoice #: '}
              {editMode
                ? <input value={val('id')} onChange={setK('id')} style={{ ...iS({ display: 'inline-block', width: 110, fontWeight: 700, fontSize: 13 }) }} />
                : <strong>{invoice.id}</strong>}
            </td>
            <td style={{ padding: '6px 0', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>
              {'Invoice Date: '}
              {editMode
                ? <input value={val('date')} onChange={setK('date')} style={{ ...iS({ display: 'inline-block', width: 130, fontSize: 12 }) }} />
                : <span>{invoice.date}</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 3 — Subject (from CreateInvoicePage) */}
      {(invoice.subject || editMode) && (
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, textDecoration: 'underline', fontSize: 12, marginRight: 6 }}>INVOICE SUBJECT:</span>
          {editMode
            ? <input value={val('subject')} onChange={setK('subject')} placeholder="e.g. AC Servicing at Sharma Residency"
                style={{ ...iS({ display: 'inline-block', width: '55%', fontSize: 12 }) }} />
            : <span style={{ fontSize: 12 }}>{invoice.subject}</span>}
        </div>
      )}

      {/* SECTION 4 — Bill From / To */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: B }}>
        <tbody>
          <tr>
            <td style={{ border: B, padding: '6px 12px', background: '#1E3A5F', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'center', width: '50%' }}>Bill From:</td>
            <td style={{ border: B, padding: '6px 12px', background: '#1E3A5F', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'center', width: '50%' }}>Bill To:</td>
          </tr>
          {[
            ['Company Name',   CO.name,    'customer',     invoice.customer    || '—', 'e.g. Sharma Residency'],
            ['Address',        CO.address, 'billToAddress',invoice.billToAddress|| '—', 'Full billing address' ],
            ['Contact Person', CO.contact, 'billToContact',invoice.billToContact|| '—', 'Mr. / Ms. Name'       ],
            ['Phone No',       CO.phone,   'billToPhone',  invoice.billToPhone  || '—', '+91 XXXXX XXXXX'      ],
            ['Email',          CO.email,   'billToEmail',  invoice.billToEmail  || '—', 'client@example.com'   ],
          ].map(([label, fromVal, toKey, toDefault, ph]) => (
            <tr key={label}>
              <td style={{ border: B, padding: '5px 12px', fontSize: 12, verticalAlign: 'top' }}>
                <span style={{ fontWeight: 700 }}>{label}: </span>{fromVal}
              </td>
              <td style={{ border: B, padding: '5px 12px', fontSize: 12, verticalAlign: 'top' }}>
                <span style={{ fontWeight: 700 }}>{label}: </span>
                {editMode
                  ? <input value={val(toKey)} onChange={setK(toKey)} placeholder={ph}
                      style={{ ...iS({ display: 'inline-block', width: '60%', fontSize: 11 }) }} />
                  : <span style={{ color: toDefault === '—' ? '#888' : 'inherit' }}>{toDefault}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SECTION 5 — Line Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: B, borderRight: B, borderBottom: 'none', marginTop: 20 }}>
        <thead>
          <tr>
            {[
              { h: 'SR. NO',      w: '7%',  align: 'center' },
              { h: 'DESCRIPTION', w: '51%', align: 'left'   },
              { h: 'QTY',         w: '10%', align: 'center' },
              { h: 'RATE',        w: '16%', align: 'right'  },
              { h: 'TOTAL',       w: '16%', align: 'right'  },
            ].map(col => (
              <th key={col.h} style={{ border: B, padding: '7px 10px', background: '#1E3A5F', color: '#fff', fontSize: 11, fontWeight: 600, textAlign: col.align, width: col.w, letterSpacing: '.04em' }}>
                {col.h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rowTotal = (parseFloat(row.qty) || 0) * (parseFloat(row.rate) || 0);
            return (
              <tr key={i}>
                <td style={{ border: BL, borderLeft: B, borderRight: BL, padding: '7px 8px', textAlign: 'center', fontSize: 12 }}>
                  {editMode
                    ? <input value={row.sr} onChange={e => updateRow(i, 'sr', e.target.value)} style={iS({ textAlign: 'center', padding: '3px 4px' })} />
                    : row.sr}
                </td>
                <td style={{ border: BL, padding: '7px 10px', fontSize: 12 }}>
                  {editMode
                    ? <input value={row.desc} onChange={e => updateRow(i, 'desc', e.target.value)} style={iS()} placeholder="Description…" />
                    : row.desc}
                </td>
                <td style={{ border: BL, padding: '7px 8px', textAlign: 'center', fontSize: 12 }}>
                  {editMode
                    ? <input type="number" value={row.qty} onChange={e => updateRow(i, 'qty', e.target.value)} style={iS({ textAlign: 'center', padding: '3px 4px' })} />
                    : row.qty}
                </td>
                <td style={{ border: BL, padding: '7px 10px', textAlign: 'right', fontSize: 12, fontFamily: FONTS.mono }}>
                  {editMode
                    ? <input type="number" value={row.rate} onChange={e => updateRow(i, 'rate', e.target.value)} style={iS({ textAlign: 'right', padding: '3px 6px', fontFamily: FONTS.mono })} />
                    : (row.rate ? `₹${Number(row.rate).toLocaleString()}` : '')}
                </td>
                <td style={{ border: BL, borderRight: B, padding: '7px 10px', textAlign: 'right', fontSize: 12, fontFamily: FONTS.mono, fontWeight: 600 }}>
                  {rowTotal ? `₹${rowTotal.toLocaleString()}` : ''}
                </td>
              </tr>
            );
          })}
          {editMode && (
            <tr>
              <td colSpan={5} style={{ borderLeft: B, borderRight: B, borderBottom: BL, padding: '5px 10px' }}>
                <button onClick={() => setRows(p => [...p, { sr: '', desc: '', qty: '', rate: '' }])}
                  style={{ background: 'none', border: `1px dashed ${COLORS.brand}`, color: COLORS.brand, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 5, cursor: 'pointer' }}>
                  + Add Row
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* SECTION 6 — Bank / QR / Totals */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: B }}>
        <tbody>
          <tr>
            <td style={{ padding: '10px 12px', verticalAlign: 'top', width: '36%' }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 7 }}>Bank Details:</div>
              {[
                ['Bank',       CO.bank,    false],
                ['Account No', CO.account, true ],
                ['IFSC',       CO.ifsc,    true ],
                ['Branch',     CO.branch,  false],
              ].map(([label, value, mono]) => (
                <div key={label} style={{ fontSize: 11, marginBottom: 4, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700 }}>{label}: </span>
                  <span style={{ fontFamily: mono ? FONTS.mono : 'inherit', fontSize: mono ? 11 : 12 }}>{value}</span>
                </div>
              ))}
            </td>
            <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', width: '14%' }}>
              <img src={qrImg} alt="Pay using UPI"
                style={{ width: 76, height: 76, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div style={{ fontSize: 9, color: '#555', fontWeight: 600 }}>Pay using UPI:</div>
            </td>
            <td style={{ border: B, padding: 0, verticalAlign: 'top', width: '50%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
                <tbody>
                  {/* Subtotal */}
                  <tr style={{ borderBottom: BL }}>
                    <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 11 }}>SUBTOTAL</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, textAlign: 'right', fontFamily: FONTS.mono, fontWeight: 600 }}>
                      ₹{subtotal.toLocaleString()}
                    </td>
                  </tr>

                  {/* Additional charges (from CreateInvoicePage) */}
                  {charges.map((c, ci) => (
                    <tr key={ci} style={{ borderBottom: BL }}>
                      <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 11 }}>{c.label || 'Charge'}</td>
                      <td style={{ padding: '8px 14px', fontSize: 12, textAlign: 'right', fontFamily: FONTS.mono, fontWeight: 600 }}>
                        ₹{Number(c.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {/* Delivery & Discount placeholders when no charges */}
                  {charges.length === 0 && (
                    <>
                      <tr style={{ borderBottom: BL }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 11 }}>DELIVERY CHARGE</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, textAlign: 'right', fontFamily: FONTS.mono, fontWeight: 600 }}></td>
                      </tr>
                      <tr style={{ borderBottom: BL }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 11 }}>DISCOUNT</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, textAlign: 'right', fontFamily: FONTS.mono, fontWeight: 600 }}>
                          {invoice.globalDiscount > 0 ? `-₹${Math.round(subtotal * invoice.globalDiscount / 100).toLocaleString()}` : ''}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* GST */}
                  <tr style={{ borderBottom: BL }}>
                    <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 11 }}>GST (18%)</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, textAlign: 'right', fontFamily: FONTS.mono, fontWeight: 600 }}>
                      ₹{gst.toLocaleString()}
                    </td>
                  </tr>

                  {/* Grand Total */}
                  <tr>
                    <td style={{ padding: '9px 14px', fontWeight: 800, fontSize: 13, color: '#000', letterSpacing: '.04em' }}>TOTAL</td>
                    <td style={{ padding: '9px 14px', fontWeight: 900, fontSize: 13, color: '#000', textAlign: 'right', fontFamily: FONTS.mono }}>
                      ₹{grandTotal.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 7 — Total in words */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: B, borderRight: B, borderBottom: B, borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 12px', fontSize: 12 }}>
              <span style={{ fontWeight: 700 }}>Total amount (in words): </span>
              <span>{toWords(grandTotal)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 8 — Notes */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: B, borderRight: B, borderBottom: B, borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 12px', fontSize: 12, minHeight: 30 }}>
              <span style={{ fontWeight: 700 }}>Notes: </span>
              {editMode
                ? <textarea value={val('notes')} onChange={setK('notes')} rows={2}
                    style={{ ...iS({ resize: 'vertical', display: 'block', marginTop: 4 }) }}
                    placeholder="Payment terms, delivery notes…" />
                : <span>{invoice.notes || ''}</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 9 — Terms */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: B, borderRight: B, borderBottom: B, borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ padding: '5px 12px', textAlign: 'center', fontWeight: 700, fontSize: 12, borderBottom: '1px solid #1E3A5F' }}>
              Terms &amp; Conditions
            </td>
          </tr>
          <tr>
            <td style={{ padding: '5px 12px', fontSize: 12 }}>
              {editMode
                ? <textarea value={val('terms')} onChange={setK('terms')} rows={2}
                    style={{ ...iS({ resize: 'vertical', display: 'block', marginTop: 4 }) }}
                    placeholder="Your terms and conditions..." />
                : <span>{invoice.terms || '* If you have any questions about this invoice, feel free to contact us.'}</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 10 — Signature */}
      <div style={{ marginTop: 20, paddingLeft: 2, lineHeight: 1.7, fontSize: 12 }}>
        <div>Thanking You,</div>
        <div style={{ fontWeight: 700 }}>{CO.signatory}</div>
        <div>{CO.phone}</div>
        <div>From: {CO.name}</div>
        <img src={signatureImg} alt="Signature"
          style={{ height: 46, objectFit: 'contain', display: 'block', margin: '6px 0 4px' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div style={{ display: 'inline-block', padding: '3px 20px', fontSize: 12, fontWeight: 700, marginTop: 2 }}>
          [Authorized Signatory]
        </div>
      </div>
    </div>
  );
};

/* ─── InvoiceDetail ──────────────────────────────────────── */
const InvoiceDetail = ({ invoice, onBack, onSave, openModal, initialEditMode }) => {
  const [showPDF, setShowPDF] = useState(false);

  const fields = [
    { key: 'customer' }, { key: 'job' },    { key: 'date' },
    { key: 'due' },      { key: 'amount' }, { key: 'tax' },
    { key: 'total' },    { key: 'status' },
  ];

  return (
    <>
      <EditableDetailView
        id={invoice.id}
        breadcrumb="Invoices"
        onBack={onBack}
        fields={fields}
        data={invoice}
        initialEditMode={initialEditMode}
        onSave={onSave}
      >
        {({ editMode, editData, setEditData }) => {
          const val  = key => editData[key] ?? invoice[key] ?? '';
          const setK = key => e => setEditData(p => ({ ...p, [key]: e.target.value }));

          const sidebar = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Actions</div>
                {!editMode ? (
                  <>
                    <button className="btn" onClick={() => setShowPDF(true)}
                      style={{ width: '100%', padding: '10px', borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, border: 'none', marginBottom: 8, cursor: 'pointer' }}>
                      ⬇ Download PDF
                    </button>
                    {invoice.status !== 'paid' && (
                      <button className="btn" onClick={() => openModal('record_payment')}
                        style={{ width: '100%', padding: '10px', borderRadius: 9, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: 12, fontWeight: 700, marginBottom: 8, cursor: 'pointer' }}>
                        ✓ Mark as Paid
                      </button>
                    )}
                    <button className="btn" onClick={() => openModal('send_quotation', { id: invoice.id })}
                      style={{ width: '100%', padding: '10px', borderRadius: 9, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 12, fontWeight: 700, marginBottom: 8, cursor: 'pointer' }}>
                      📤 Send to Customer
                    </button>
                    <button className="btn" onClick={() => openModal('report', { title: `Convert ${invoice.id} to Credit Note`, format: 'Convert' })}
                      style={{ width: '100%', padding: '10px', borderRadius: 9, background: '#F8FAFC', border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      🔄 Convert to Credit Note
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: COLORS.muted, textAlign: 'center', padding: '8px 0' }}>
                    Actions available in view mode
                  </div>
                )}
              </div>

              <div style={{
                background: val('status') === 'overdue' ? '#FEF2F2' : val('status') === 'paid' ? '#F0FDF4' : '#FFFBEB',
                borderRadius: 14,
                border: `1px solid ${val('status') === 'overdue' ? '#FECACA' : val('status') === 'paid' ? '#BBF7D0' : '#FDE68A'}`,
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: val('status') === 'overdue' ? '#991B1B' : val('status') === 'paid' ? '#166534' : '#92400E', marginBottom: 6 }}>
                  Payment Status
                </div>
                {editMode ? (
                  <select value={val('status')} onChange={setK('status')}
                    style={{ padding: '5px 9px', borderRadius: 6, border: `1.5px solid ${COLORS.border}`, fontSize: 12, width: '100%', fontFamily: FONTS.sans, outline: 'none', background: '#fff' }}>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="draft">Draft</option>
                  </select>
                ) : (
                  <SBadge s={invoice.status} map={INV_STATUS} />
                )}
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>
                  Due date:{' '}
                  {editMode
                    ? <input value={val('due')} onChange={setK('due')}
                        style={{ padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${COLORS.border}`, fontSize: 11, width: '100%', boxSizing: 'border-box', fontFamily: FONTS.sans, outline: 'none', marginTop: 4 }} />
                    : invoice.due}
                </div>
              </div>

              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, marginBottom: 8 }}>Summary</div>
                {[
                  ['Subtotal',   `₹${invoice.amount?.toLocaleString()}`],
                  ['GST @ 18%', `₹${invoice.tax?.toLocaleString()}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginBottom: 5 }}>
                    <span>{k}</span>
                    <span style={{ fontFamily: FONTS.mono, color: COLORS.h2 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: COLORS.brand, paddingTop: 7, borderTop: `2px solid ${COLORS.border}`, marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ fontFamily: FONTS.mono }}>₹{invoice.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 16 }}>
              <div style={{
                background: '#fff', borderRadius: 12,
                border: `1.5px solid ${editMode ? COLORS.brand : COLORS.border}`,
                boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : '0 2px 10px rgba(0,0,0,.08)',
                padding: '22px 26px 28px',
                transition: 'border-color .2s, box-shadow .2s',
              }}>
                <InvoiceTemplate
                  invoice={invoice}
                  editMode={editMode}
                  editData={editData}
                  setEditData={setEditData}
                />
              </div>
              {sidebar}
            </div>
          );
        }}
      </EditableDetailView>

      <PDFPreview
        open={showPDF}
        onClose={() => setShowPDF(false)}
        title={invoice.id}
        filename={`invoice-${invoice.id}`}
        template="invoice"
        data={{
          ...invoice,
          subtotal: invoice.amount,
          gst:      invoice.tax,
          // Pass real line items to PDFPreview so it too renders the correct data
          items: (invoice.items ?? []).filter(it => it.desc || it.name).map(it => ({
            desc: it.desc ?? it.name ?? '',
            qty:  it.qty  ?? 1,
            rate: it.rate ?? 0,
          })),
        }}
      />
    </>
  );
};

/* ─── InvoicesPage ───────────────────────────────────────── */
const InvoicesPage = ({ openModal }) => {
  const [open, setOpen]                       = useState(null);
  const [invoices, setInvoices]               = useState([]);
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const navigate = useNavigate();

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchInvoices = useCallback(() => {
    invoicesApi.list({ limit: 200 })
      .then(r => setInvoices((r.data ?? []).map(normaliseInvoice)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchInvoices();
    window.addEventListener('focus', fetchInvoices);
    return () => window.removeEventListener('focus', fetchInvoices);
  }, [fetchInvoices]);

  const invoice = open ? invoices.find(i => i._id === open) : null;

  /* ── KPI totals ────────────────────────────────────────── */
  const tot      = invoices.reduce((s, i) => s + (i.total  ?? 0), 0);
  const paid     = invoices.filter(i => i.status === 'paid'   ).reduce((s, i) => s + (i.total ?? 0), 0);
  const pend     = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total ?? 0), 0);
  const over     = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total ?? 0), 0);
  const totalGST = invoices.reduce((s, i) => s + (i.tax   ?? 0), 0);

  /* ── Search / filter / pagination ─────────────────────── */
  const { q, setQ, activeFilters, setFilter, filtered: filteredInvoices } = useTableSearch(
    invoices, ['id', 'job', 'customer', 'status'], { status: '' }
  );
  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } =
    usePagination(filteredInvoices, 10);

  const { exportProps } = useExport({
    title: 'Invoices', filename: 'cooltech-invoices', template: 'generic_list',
    subtitle: `AC Services Platform · Invoices & Billing · ${filteredInvoices.length} records`,
    docId: 'INV-EXPORT', columns: INVOICE_COLUMNS, rows: filteredInvoices,
    showTotals: true, totalColumns: ['amount', 'tax', 'total'],
  });

  /* ── Handlers ──────────────────────────────────────────── */
  const handleSave = async updated => {
    try {
      const res = await invoicesApi.update(updated._id, updated);
      const doc = normaliseInvoice(res.data ?? res);
      setInvoices(prev => prev.map(i => i._id === doc._id ? doc : i));
    } catch (e) { alert(e.message); }
  };

  const handleBack = () => { setOpen(null); setInitialEditMode(false); };

  const handleDelete = async id => {
    const item = invoices.find(x => (x._id ?? x.id) === id);
    if (item) addToDeleted({
      id:     item.id   ?? item._id,
      name:   item.customer ?? item.id,
      module: 'Invoice',
      by:     'Admin',
    });
    try {
      await invoicesApi.remove(id);
      setInvoices(prev => prev.filter(x => (x._id ?? x.id) !== id));
      setDeleteTarget(null);
      if (open === id) setOpen(null);
    } catch (e) { alert(e.message); }
  };

  /* ── Detail view ───────────────────────────────────────── */
  if (invoice) {
    return (
      <InvoiceDetail
        invoice={invoice}
        onBack={handleBack}
        onSave={handleSave}
        openModal={openModal}
        initialEditMode={initialEditMode}
      />
    );
  }

  /* ── List view ─────────────────────────────────────────── */
  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Invoices &amp; Billing</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
            {total} of {invoices.length} invoices · ₹{(totalGST / 1000).toFixed(1)}K GST collected
          </div>
        </div>
        <button className="btn" onClick={() => navigate('/invoices/create-invoice')}
          style={{ padding: '9px 20px', borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}>
          + Create Invoice
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        <KCard label="Total Invoiced" value={`₹${(tot      / 1000).toFixed(1)}K`} icon="📊" iconBg="#FFF7ED" color={COLORS.brand} delay=""  />
        <KCard label="Collected"      value={`₹${(paid     / 1000).toFixed(1)}K`} icon="✅" iconBg="#F0FDF4" color="#16A34A"       delay="1" />
        <KCard label="Pending"        value={`₹${(pend     / 1000).toFixed(1)}K`} icon="⏳" iconBg="#FFFBEB" color="#B45309"       delay="2" />
        <KCard label="Overdue"        value={`₹${(over     / 1000).toFixed(1)}K`} icon="⚠️" iconBg="#FEF2F2" color="#DC2626"       delay="3" />
        <KCard label="GST Collected"  value={`₹${(totalGST / 1000).toFixed(1)}K`} icon="🧾" iconBg="#F5F3FF" color="#7C3AED"       delay="4" />
      </div>

      {/* Aging summary */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Invoice Aging Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Current',        value: paid,       color: '#22C55E', bg: '#F0FDF4' },
            { label: 'Due < 10 days',  value: pend,       color: '#F59E0B', bg: '#FFFBEB' },
            { label: 'Overdue 10-30d', value: over * 0.6, color: '#EF4444', bg: '#FEF2F2' },
            { label: 'Overdue 30d+',   value: over * 0.4, color: '#991B1B', bg: '#FEF2F2' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${s.color}20` }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: FONTS.mono }}>
                ₹{Math.round(s.value / 1000).toFixed(0)}K
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by invoice #, customer, job…" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['paid', 'pending', 'overdue', 'draft']} allLabel="All Statuses" />
          <div style={{ marginLeft: 'auto' }}><ExportDropdown {...exportProps} /></div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <Thead cols={['Invoice #', 'Job / Contract', 'Customer', 'Amount', 'GST', 'Total', 'Date', 'Due', 'Status', '']} />
            <tbody>
              {paginated.map((inv, i) => (
                <tr key={inv._id}
                  className="row"
                  onClick={() => { setInitialEditMode(false); setOpen(inv._id); }}
                  style={{ borderBottom: `1px solid ${COLORS.border}22`, cursor: 'pointer', background: inv.status === 'overdue' ? '#FFFBF7' : i % 2 === 0 ? COLORS.white : '#FAFAFA' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.brand }}>{inv.id}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.muted }}>{inv.job}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{inv.customer}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 13, color: COLORS.h2 }}>₹{inv.amount.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>₹{inv.tax.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>₹{inv.total.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{inv.date}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: inv.status === 'overdue' ? '#DC2626' : COLORS.muted }}>{inv.due}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}><SBadge s={inv.status} map={INV_STATUS} /></td>
                  <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                    <ActionDropdown
                      onView={()  => { setInitialEditMode(false); setOpen(inv._id); }}
                      onEdit={()  => { setInitialEditMode(true);  setOpen(inv._id); }}
                      onDelete={() => setDeleteTarget(inv._id)}
                    />
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: COLORS.faint }}>
                    No invoices match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* GST footer */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${COLORS.border}`, background: '#F9FAFB', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: COLORS.muted }}>GST Summary:</span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>
            Taxable: <strong style={{ color: COLORS.h2 }}>₹{invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</strong>
          </span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>
            CGST 9%: <strong style={{ color: COLORS.h2 }}>₹{Math.round(totalGST / 2).toLocaleString()}</strong>
          </span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>
            SGST 9%: <strong style={{ color: COLORS.h2 }}>₹{Math.round(totalGST / 2).toLocaleString()}</strong>
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.brand, marginLeft: 'auto' }}>
            Total GST: ₹{totalGST.toLocaleString()}
          </span>
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
        message="This invoice will be permanently removed."
      />
    </div>
  );
};

export default InvoicesPage;