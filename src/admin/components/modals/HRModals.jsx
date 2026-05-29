import { COLORS, FONTS } from '../../constants/tokens';
import Modal from '../ui/Modal';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../ui/Form';
import { useState, useEffect, useRef, useCallback } from 'react';
import RichTextFileEditor from './RichTextFileEditor';
import { Avatar } from '../../components/ui/Badges';
import PDFPreview from '../layout/PDFPreview';
import { invoices, technicians, jobs } from '../../data/mockData';
import {
  invoicesApi, paymentsApi, servicesApi, remindersApi,
  leavesApi, attendanceApi, complaintsApi, jobsApi,
  techsApi, timelogsApi,
} from '../../services/api';

// ─── sanitizePayload ──────────────────────────────────────────────────────────
// Strips MongoDB meta-fields that must never be sent on a POST/PUT body.
// Prevents E11000 duplicate key errors from leaked mock _id values.
const STRIP_KEYS = new Set(['_id', 'id', '__v', 'createdAt', 'updatedAt', 'deletedAt']);

const sanitizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(sanitizePayload);
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([k]) => !STRIP_KEYS.has(k))
      .map(([k, v]) => [
        k,
        v && typeof v === 'object' && !Array.isArray(v)
          ? sanitizePayload(v)
          : Array.isArray(v)
          ? v.map(sanitizePayload)
          : v,
      ]),
  );
};

// ─── useModalForm ─────────────────────────────────────────────────────────────
// Identical to the one in Modals.jsx — keeps this file self-contained.
// Sanitizes payload before every API call to strip leaked _id / id fields.
const useModalForm = (apiCall, onSave, onClose) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = useCallback(async (payload) => {
    setError('');
    setLoading(true);
    try {
      const clean  = sanitizePayload(payload);
      const result = await apiCall(clean);
      onSave?.(result);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [apiCall, onSave, onClose]);

  return { loading, error, submit };
};

// ─── ErrorBanner ──────────────────────────────────────────────────────────────
const ErrorBanner = ({ message }) =>
  message ? (
    <div style={{
      padding: '10px 14px', borderRadius: 8, background: '#FEF2F2',
      border: '1px solid #FECACA', color: '#DC2626', fontSize: 12,
      fontWeight: 600, marginBottom: 12,
    }}>
      ⚠️ {message}
    </div>
  ) : null;

// ─── Section heading inside modal ─────────────────────────────────────────────
const SectionHead = ({ title }) => (
  <div style={{
    fontSize: 13, fontWeight: 700, color: COLORS.h1,
    borderBottom: `2px solid ${COLORS.brand}22`,
    paddingBottom: 8, marginBottom: 14, marginTop: 6,
    letterSpacing: .2,
  }}>
    {title}
  </div>
);

// ─── SectionDivider ───────────────────────────────────────────────────────────
const SectionDivider = ({ label, open, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '10px 0 6px', marginTop: 4,
      borderTop: `1px solid ${COLORS.border}`,
      fontFamily: FONTS.sans,
    }}
  >
    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{label}</span>
    <span style={{ fontSize: 12, color: COLORS.muted, marginLeft: 'auto' }}>
      {open ? '▲' : '▼'}
    </span>
  </button>
);

// ─── CheckRow ─────────────────────────────────────────────────────────────────
const CheckRow = ({ checked, onChange, label, hint }) => (
  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
    <input
      type="checkbox" checked={checked} onChange={onChange}
      style={{ marginTop: 2, accentColor: COLORS.brand, width: 15, height: 15, flexShrink: 0 }}
    />
    <div>
      <div style={{ fontSize: 13, color: COLORS.h2, fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: COLORS.faint, marginTop: 1 }}>{hint}</div>}
    </div>
  </label>
);

// ─── SendRemindersModal ───────────────────────────────────────────────────────
// Sends payment reminders for all overdue/pending invoices.
// API: PATCH /invoices/:id with { reminderSent: true } for each overdue invoice.
export const SendRemindersModal = ({ open, onClose, onSave }) => {
  const overdueInvoices = invoices.filter(i => i.status !== 'paid');
  const [sendVia,   setSendVia]   = useState('WhatsApp + SMS');
  const [template,  setTemplate]  = useState(
    'Dear {customer}, your invoice {invoice} of ₹{amount} is due on {date}. Please arrange payment. Thank you. – CoolTech AC Services',
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSend = async () => {
    setError('');
    setLoading(true);
    try {
      // Use _id (MongoDB) falling back to id (mock data) — never send the id in the body
      await Promise.all(
        overdueInvoices.map(inv => {
          const invoiceId = inv._id ?? inv.id;
          return invoicesApi.update(invoiceId, {
            reminderSent:     true,
            reminderChannel:  sendVia,
            reminderTemplate: template,
          });
        }),
      );
      onSave?.({ sent: overdueInvoices.length });
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to send reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="📤 Send Payment Reminders" width={480}>
      <ErrorBanner message={error} />
      <div style={{ padding: '12px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>Overdue & Pending Invoices</div>
        {overdueInvoices.map(inv => (
          <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#DC2626', padding: '4px 0', borderTop: '1px solid #FECACA22' }}>
            <span>{inv.id} – {inv.customer}</span>
            <span style={{ fontWeight: 700 }}>₹{inv.total?.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <FRow label="Send Via">
        <FSelect value={sendVia} onChange={e => setSendVia(e.target.value)}>
          {['WhatsApp + SMS','WhatsApp Only','SMS Only','Email'].map(v => <option key={v}>{v}</option>)}
        </FSelect>
      </FRow>
      <FRow label="Message Template">
        <textarea
          value={template}
          onChange={e => setTemplate(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12, fontFamily: 'monospace', color: '#374151', background: '#F9FAFB', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
        />
      </FRow>
      <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: 14, fontSize: 12, color: '#166534' }}>
        📤 {overdueInvoices.length} reminder{overdueInvoices.length !== 1 ? 's' : ''} will be sent automatically
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSend} disabled={loading || overdueInvoices.length === 0}>
          {loading ? 'Sending…' : 'Send All Reminders'}
        </FBtn>
      </div>
    </Modal>
  );
};

// ─── RecordPaymentModal ───────────────────────────────────────────────────────
// Marks an invoice as paid via invoicesApi.pay(id, payload).
export const RecordPaymentModal = ({ open, onClose, onSave }) => {
  const [liveInvoices, setLiveInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [form, setForm] = useState({
    amount: '', paymentDate: new Date().toISOString().slice(0, 10),
    method: 'Bank Transfer / NEFT', reference: '', notes: '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Load unpaid invoices when modal opens
  useEffect(() => {
    if (!open) return;
    invoicesApi.list({ status: 'unpaid', limit: 100 })
      .then(r => {
        const data = r.data ?? [];
        setLiveInvoices(data);
        if (data.length > 0) setSelectedInvoice(data[0]._id ?? data[0].id);
      })
      .catch(() => {
        // Fall back to mock data
        const unpaid = invoices.filter(i => i.status !== 'paid');
        setLiveInvoices(unpaid);
        if (unpaid.length > 0) setSelectedInvoice(unpaid[0].id);
      });
  }, [open]);

  const { loading, error, submit } = useModalForm(
    payload => invoicesApi.pay(selectedInvoice, payload),
    onSave,
    onClose,
  );

  const handleSave = () => {
    if (!selectedInvoice)  { alert('Please select an invoice'); return; }
    if (!form.amount)      { alert('Amount is required'); return; }
    submit(form);
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="💳 Record Payment" width={460}>
      <ErrorBanner message={error} />
      <FRow label="Invoice *">
        <FSelect value={selectedInvoice} onChange={e => setSelectedInvoice(e.target.value)}>
          {liveInvoices.map(inv => (
            <option key={inv._id ?? inv.id} value={inv._id ?? inv.id}>
              {inv.id ?? inv._id} – {inv.customer} – ₹{inv.total?.toLocaleString()}
            </option>
          ))}
        </FSelect>
      </FRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FRow label="Amount (₹) *">
          <FInput type="number" placeholder="5310" value={form.amount} onChange={set('amount')} />
        </FRow>
        <FRow label="Payment Date">
          <FInput type="date" value={form.paymentDate} onChange={set('paymentDate')} />
        </FRow>
        <FRow label="Payment Method">
          <FSelect value={form.method} onChange={set('method')}>
            {['Bank Transfer / NEFT','UPI','Cash','Cheque','Credit Card'].map(m => <option key={m}>{m}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Reference No.">
          <FInput placeholder="UPI/NEFT/Cheque ref" value={form.reference} onChange={set('reference')} />
        </FRow>
      </div>
      <FRow label="Notes">
        <FInput placeholder="Optional payment notes" value={form.notes} onChange={set('notes')} />
      </FRow>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Recording…' : 'Record Payment'}</FBtn>
      </div>
    </Modal>
  );
};

// ─── NewPriceItemModal ────────────────────────────────────────────────────────
// Fix: map serviceName → name, priceExGst → price before submitting
export const NewPriceItemModal = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({
    serviceName: '', category: 'Service', unit: 'per visit',
    priceExGst: '', gstPercent: '18', status: 'Active',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { loading, error, submit } = useModalForm(
    payload => servicesApi.create(payload),
    onSave,
    onClose,
  );

  const handleSave = () => {
    if (!form.serviceName) { alert('Service Name is required'); return; }
    if (!form.priceExGst)  { alert('Price is required'); return; }
    const gst        = parseFloat(form.gstPercent) || 0;
    const priceExGst = parseFloat(form.priceExGst) || 0;

    // ✅ Remap keys to match backend schema
    submit({
      name:       form.serviceName,          // backend expects "name"
      price:      priceExGst,                // backend expects "price"
      category:   form.category,
      unit:       form.unit,
      gstPercent: gst,
      status:     form.status,
      totalInclGst: +(priceExGst * (1 + gst / 100)).toFixed(2),
    });
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="🏷 Add / Edit Price Item" width={480}>
      <ErrorBanner message={error} />
      <FRow label="Service Name *">
        <FInput placeholder="Split AC Service (1.5T)" value={form.serviceName} onChange={set('serviceName')} />
      </FRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FRow label="Category">
          <FSelect value={form.category} onChange={set('category')}>
            {['Service','Gas Refill','Installation','Repair','AMC'].map(c => <option key={c}>{c}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Unit">
          <FSelect value={form.unit} onChange={set('unit')}>
            {['per visit','per unit','per cylinder','per year','per month','per day','per job'].map(u => <option key={u}>{u}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Price ex-GST (₹) *">
          <FInput type="number" placeholder="599" value={form.priceExGst} onChange={set('priceExGst')} />
        </FRow>
        <FRow label="GST %">
          <FSelect value={form.gstPercent} onChange={set('gstPercent')}>
            {['0','5','12','18','28'].map(g => <option key={g}>{g}</option>)}
          </FSelect>
        </FRow>
      </div>
      {form.priceExGst && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: `${COLORS.brand}08`, border: `1px solid ${COLORS.brand}20`, fontSize: 12, color: COLORS.brand, marginBottom: 4 }}>
          Price incl. GST: <strong>₹{(parseFloat(form.priceExGst) * (1 + parseFloat(form.gstPercent) / 100)).toFixed(2)}</strong>
        </div>
      )}
      <FRow label="Status">
        <FSelect value={form.status} onChange={set('status')}>
          <option>Active</option><option>Inactive</option>
        </FSelect>
      </FRow>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Saving…' : 'Save Item'}</FBtn>
      </div>
    </Modal>
  );
};

// ─── NewReminderModal ─────────────────────────────────────────────────────────
// Creates a service reminder via remindersApi.create().
export const NewReminderModal = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({
    customer: '', acUnit: '', reminderType: 'Annual Service',
    dueDate: '', sendOption: 'Yes – auto send 7 days before',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { loading, error, submit } = useModalForm(
    payload => remindersApi.create(payload),
    onSave,
    onClose,
  );

  const handleSave = () => {
    if (!form.customer) { alert('Customer is required'); return; }
    if (!form.dueDate)  { alert('Due Date is required'); return; }
    submit(form);
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="🔔 Add Service Reminder" width={460}>
      <ErrorBanner message={error} />
      <FRow label="Customer *">
        <FSelect value={form.customer} onChange={set('customer')}>
          <option value="">Select customer…</option>
          {['Sharma Residency','Sunrise Hotel','Meera Iyer','TechPark Ltd.','City Mall'].map(c => (
            <option key={c}>{c}</option>
          ))}
        </FSelect>
      </FRow>
      <FRow label="AC Unit">
        <FInput placeholder="Samsung 1.5T Split – Bedroom" value={form.acUnit} onChange={set('acUnit')} />
      </FRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FRow label="Reminder Type">
          <FSelect value={form.reminderType} onChange={set('reminderType')}>
            {['Annual Service','AMC Service Due','Gas Refill Check','AMC Renewal','Filter Cleaning'].map(t => (
              <option key={t}>{t}</option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Due Date *">
          <FInput type="date" value={form.dueDate} onChange={set('dueDate')} />
        </FRow>
      </div>
      <FRow label="Send SMS/WhatsApp">
        <FSelect value={form.sendOption} onChange={set('sendOption')}>
          {['Yes – auto send 7 days before','Yes – send now','No – manual only'].map(o => (
            <option key={o}>{o}</option>
          ))}
        </FSelect>
      </FRow>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Adding…' : 'Add Reminder'}</FBtn>
      </div>
    </Modal>
  );
};

// ─── ApplyLeaveModal ──────────────────────────────────────────────────────────
// Submits a leave application via leavesApi.create().
export const ApplyLeaveModal = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({
    technician: technicians[0]?.id ?? '',
    leaveType: 'Casual Leave',
    fromDate: '', toDate: '', reason: '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { loading, error, submit } = useModalForm(
    payload => leavesApi.create(payload),
    onSave,
    onClose,
  );

  const handleSave = () => {
    if (!form.technician) { alert('Please select a technician'); return; }
    if (!form.fromDate || !form.toDate) { alert('From and To dates are required'); return; }
    if (form.fromDate > form.toDate) { alert('From date cannot be after To date'); return; }
    submit(form);
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="🌴 Apply for Leave" width={460}>
      <ErrorBanner message={error} />
      <FRow label="Technician *">
        <FSelect value={form.technician} onChange={set('technician')}>
          {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </FSelect>
      </FRow>
      <FRow label="Leave Type">
        <FSelect value={form.leaveType} onChange={set('leaveType')}>
          {['Casual Leave','Sick Leave','Earned Leave','Unpaid Leave'].map(l => <option key={l}>{l}</option>)}
        </FSelect>
      </FRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FRow label="From Date *"><FInput type="date" value={form.fromDate} onChange={set('fromDate')} /></FRow>
        <FRow label="To Date *"><FInput type="date" value={form.toDate} onChange={set('toDate')} /></FRow>
      </div>
      {/* Auto-calculate days when both dates are filled */}
      {form.fromDate && form.toDate && form.fromDate <= form.toDate && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: `${COLORS.brand}08`, border: `1px solid ${COLORS.brand}20`, fontSize: 12, color: COLORS.brand, marginBottom: 4 }}>
          Duration: <strong>
            {Math.round((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1} day(s)
          </strong>
        </div>
      )}
      <FRow label="Reason">
        <FTextarea placeholder="Reason for leave…" rows={2} value={form.reason} onChange={set('reason')} />
      </FRow>
      <FRow label="Supporting Document">
        <div style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: 12, textAlign: 'center', cursor: 'pointer', background: '#FAFAFA' }}
          onClick={() => document.getElementById('leave-doc-upload')?.click()}>
          <input id="leave-doc-upload" type="file" accept="image/*,application/pdf" style={{ display: 'none' }} />
          <div style={{ fontSize: 12, color: COLORS.muted }}>📎 Upload medical certificate / document (optional)</div>
        </div>
      </FRow>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Submitting…' : 'Submit Application'}</FBtn>
      </div>
    </Modal>
  );
};

// ─── LogGasModal ──────────────────────────────────────────────────────────────
// Logs refrigerant usage via gaslogApi.create().
export const LogGasModal = ({ open, onClose, onSave }) => {
  const [leakTestDone, setLeakTestDone] = useState(false);
  const [form, setForm] = useState({
    jobRef: 'JOB-1042', technician: '', customer: '', acUnit: '',
    date: new Date().toISOString().slice(0, 10),
    gasType: 'R-32', cylindersUsed: 1, kgUsed: '', kgRecovered: '',
    kgRemaining: '', gwp: '', pressureBefore: '', pressureAfter: '',
    reason: 'New installation',
    leakTestResult: 'Pass', fGasCert: '', regulation: 'EU F-Gas Reg 517/2014',
    disposal: 'N/A – No recovery', supervisorSignoff: '', notes: '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { loading, error, submit } = useModalForm(
    payload => gaslogApi.create({
      gasType:      payload.gasType     || 'R-32',
      quantity:     Number(payload.kgUsed) || 0,
      operation:    payload.reason?.toLowerCase().includes('new') ? 'install' :
                    payload.reason?.toLowerCase().includes('top') ? 'top-up' : 'charge',
      techName:     payload.technician  || payload.techName || '',
      customerName: payload.customer    || payload.customerName || '',
      jobRef:       payload.jobRef      || '',
      certNumber:   payload.fGasCert   || payload.certNumber || '',
      notes:        payload.notes       || payload.reason || '',
      date:         payload.date        || new Date(),
      pressure:     Number(payload.pressureBefore) || null,
      cylinders:    Number(payload.cylindersUsed)  || 0,
      kgRecovered:  Number(payload.kgRecovered)    || null,
      leakTest:     payload.leakTestDone,
      complianceCert: payload.fGasCert,
    }),
    onSave,
    onClose,
  );

  const handleSave = () => {
    if (!form.jobRef)    { alert('Job Reference is required'); return; }
    if (!form.technician){ alert('Technician is required'); return; }
    if (!form.kgUsed)    { alert('Kg Used is required'); return; }
    if (!form.fGasCert)  { alert('F-Gas Certification No. is required'); return; }
    submit({ ...form, leakTestDone });
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="🧪 Log Gas / Refrigerant Usage" width={660}>
      <ErrorBanner message={error} />

      <SectionHead title="Job & Technician" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FRow label="Job Reference *">
          <FSelect value={form.jobRef} onChange={set('jobRef')}>
            {['JOB-1042','JOB-1041','JOB-1040'].map(j => <option key={j}>{j}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Technician *">
          <FSelect value={form.technician} onChange={set('technician')}>
            <option value="">Select…</option>
            {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Customer">
          <FInput placeholder="Auto-fills from job" value={form.customer} onChange={set('customer')} />
        </FRow>
        <FRow label="AC Unit / Equipment">
          <FInput placeholder="e.g. Daikin 1.5T – Bedroom" value={form.acUnit} onChange={set('acUnit')} />
        </FRow>
        <FRow label="Date *">
          <FInput type="date" value={form.date} onChange={set('date')} />
        </FRow>
      </div>

      <SectionHead title="Gas Usage" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <FRow label="Gas Type *">
          <FSelect value={form.gasType} onChange={set('gasType')}>
            {['R-32','R-410A','R-22','R-134a','R-407C','R-404A'].map(g => <option key={g}>{g}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Cylinders Used">
          <FInput type="number" placeholder="1" value={form.cylindersUsed} onChange={set('cylindersUsed')} />
        </FRow>
        <FRow label="Kg Used (Approx) *">
          <FInput type="number" placeholder="0.8" step="0.1" value={form.kgUsed} onChange={set('kgUsed')} />
        </FRow>
        <FRow label="Kg Recovered">
          <FInput type="number" placeholder="0.0" step="0.1" value={form.kgRecovered} onChange={set('kgRecovered')} />
        </FRow>
        <FRow label="Kg Remaining in Cylinder">
          <FInput type="number" placeholder="5.2" step="0.1" value={form.kgRemaining} onChange={set('kgRemaining')} />
        </FRow>
        <FRow label="GWP Value">
          <FInput placeholder="e.g. 675 for R-32" value={form.gwp} onChange={set('gwp')} />
        </FRow>
        <FRow label="Pressure Before (PSI)">
          <FInput type="number" placeholder="e.g. 120" value={form.pressureBefore} onChange={set('pressureBefore')} />
        </FRow>
        <FRow label="Pressure After (PSI)">
          <FInput type="number" placeholder="e.g. 145" value={form.pressureAfter} onChange={set('pressureAfter')} />
        </FRow>
        <FRow label="Reason / Purpose *">
          <FSelect value={form.reason} onChange={set('reason')}>
            {['New installation','Gas leak – refill','Annual refill','Compressor replacement','Routine refill','Top-up service','Recovery only'].map(r => (
              <option key={r}>{r}</option>
            ))}
          </FSelect>
        </FRow>
      </div>

      <SectionHead title="Leak Test & Compliance" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FRow label="Leak Test Performed">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: leakTestDone ? `${COLORS.brand}08` : COLORS.bg, border: `1px solid ${leakTestDone ? COLORS.brand + '40' : COLORS.border}`, cursor: 'pointer' }}
            onClick={() => setLeakTestDone(v => !v)}>
            <input type="checkbox" checked={leakTestDone} onChange={() => setLeakTestDone(v => !v)}
              style={{ accentColor: COLORS.brand, width: 15, height: 15, cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: leakTestDone ? COLORS.brand : COLORS.body, fontWeight: leakTestDone ? 600 : 400, fontFamily: FONTS.sans }}>
              {leakTestDone ? 'Yes — leak test done' : 'No leak test'}
            </span>
          </div>
        </FRow>
        {leakTestDone && (
          <FRow label="Leak Test Result">
            <FSelect value={form.leakTestResult} onChange={set('leakTestResult')}>
              <option>Pass</option><option>Fail</option>
            </FSelect>
          </FRow>
        )}
        <FRow label="F-Gas Certification No. *">
          <FInput placeholder="F-Gas Cert #XX-YYYY" value={form.fGasCert} onChange={set('fGasCert')} />
        </FRow>
        <FRow label="Regulation Reference">
          <FSelect value={form.regulation} onChange={set('regulation')}>
            {['EU F-Gas Reg 517/2014','BEE India Guidelines','ASHRAE 15','Other / Local'].map(r => <option key={r}>{r}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Disposal Method">
          <FSelect value={form.disposal} onChange={set('disposal')}>
            {['N/A – No recovery','Reclaimed – reuse','Returned to supplier','Destroyed / certified disposal'].map(d => <option key={d}>{d}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Supervisor Sign-off">
          <FInput placeholder="Supervisor name" value={form.supervisorSignoff} onChange={set('supervisorSignoff')} />
        </FRow>
      </div>

      <FRow label="Notes (optional)">
        <textarea placeholder="Any additional observations or remarks…" rows={2} value={form.notes} onChange={set('notes')}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h2, background: COLORS.white, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
      </FRow>

      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#92400E' }}>
        <span>⚠️</span>
        <span>This log is a compliance record. Ensure the technician holds a valid F-Gas certificate before handling refrigerants.</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Saving…' : 'Save Gas Log'}</FBtn>
      </div>
    </Modal>
  );
};

// ─── NewTaskModal ─────────────────────────────────────────────────────────────
// Creates a task via crud('tasks').create().
export const NewTaskModal = ({ open, onClose, onSave }) => {
  const [showOtherDetails, setShowOtherDetails] = useState(true);
  const [makePrivate,      setMakePrivate]      = useState(false);
  const [billable,         setBillable]         = useState(false);
  const [timeEstimate,     setTimeEstimate]     = useState(false);
  const [dependent,        setDependent]        = useState(false);
  const [withoutDueDate,   setWithoutDueDate]   = useState(false);
  const [fileName,         setFileName]         = useState('');
  const [files,            setFiles]            = useState([]);

  const [form, setForm] = useState({
    title: '', category: '', linkedJob: '', startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10), status: 'todo', assignedTo: 'Admin',
    description: '', label: '', milestone: '', priority: 'normal',
    estHours: '', estMinutes: '', dependsOn: '',
    billableCustomer: '', billableAmount: '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { loading, error, submit } = useModalForm(
    payload => import('../../services/api').then(m => m.crud('tasks').create(payload)),
    onSave,
    onClose,
  );

  const handleSave = () => {
    if (!form.title.trim()) { alert('Title is required'); return; }
    submit({
      ...form,
      withoutDueDate, makePrivate, billable, timeEstimate, dependent,
    });
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="✅ New Task" width={700}>
      <ErrorBanner message={error} />

      <div className="ntm-section-label">Task Info</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FRow label={<>Title <span style={{ color: '#DC2626' }}>*</span></>}>
          <FInput placeholder="Enter a task title" value={form.title} onChange={set('title')} />
        </FRow>
        <FRow label="Task Category">
          <FSelect value={form.category} onChange={set('category')}>
            {['','Service','Installation','Repair','AMC','Sales','Finance','HR','Operations','Admin'].map(c => (
              <option key={c} value={c}>{c || '--'}</option>
            ))}
          </FSelect>
        </FRow>
      </div>

      <FRow label="Linked Job / Project">
        <FSelect value={form.linkedJob} onChange={set('linkedJob')}>
          <option value="">-- None --</option>
          {jobs.slice(0, 8).map(j => (
            <option key={j.id}>{j.id} – {j.customer}</option>
          ))}
        </FSelect>
      </FRow>

      {/* Start / Due Date row — reacts to withoutDueDate toggle */}
      {withoutDueDate ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end' }}>
          <FRow label={<>Start Date <span style={{ color: '#DC2626' }}>*</span></>}>
            <FInput type="date" value={form.startDate} onChange={set('startDate')} />
          </FRow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 8, position: 'relative', bottom: 20 }}>
            <input type="checkbox" id="ntm-nodate" checked={withoutDueDate} onChange={e => setWithoutDueDate(e.target.checked)}
              style={{ accentColor: COLORS.brand, width: 18, height: 18, cursor: 'pointer' }} />
            <label htmlFor="ntm-nodate" style={{ fontSize: 15, color: COLORS.body, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Without Due Date
            </label>
          </div>
          <FRow label="Status">
            <FSelect value={form.status} onChange={set('status')}>
              <option value="todo">🔵 To Do</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="done">🟢 Done</option>
            </FSelect>
          </FRow>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto 1fr', gap: 12, alignItems: 'end' }}>
          <FRow label={<>Start Date <span style={{ color: '#DC2626' }}>*</span></>}>
            <FInput type="date" value={form.startDate} onChange={set('startDate')} />
          </FRow>
          <FRow label={<>Due Date <span style={{ color: '#DC2626' }}>*</span></>}>
            <FInput type="date" value={form.dueDate} onChange={set('dueDate')} />
          </FRow>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5, paddingBottom: 7, position: 'relative', bottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <input type="checkbox" id="ntm-nodate" checked={withoutDueDate} onChange={e => setWithoutDueDate(e.target.checked)}
                style={{ accentColor: COLORS.brand, width: 18, height: 18, cursor: 'pointer' }} />
              <label htmlFor="ntm-nodate" style={{ fontSize: 13, color: COLORS.body, cursor: 'pointer', whiteSpace: 'nowrap' }}>Without Due Date</label>
            </div>
          </div>
          <FRow label="Status">
            <FSelect value={form.status} onChange={set('status')}>
              <option value="todo">🔵 To Do</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="done">🟢 Done</option>
            </FSelect>
          </FRow>
        </div>
      )}

      <FRow label="Assigned To">
        <FSelect value={form.assignedTo} onChange={set('assignedTo')}>
          <option>Admin</option>
          {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </FSelect>
      </FRow>

      <FRow label="Description">
        <RichTextFileEditor
          placeholder="Describe what needs to be done…"
          minHeight={110} files={files} setFiles={setFiles}
          onChange={val => setForm(f => ({ ...f, description: val }))}
        />
      </FRow>

      {/* ── OTHER DETAILS collapsible ── */}
      <SectionDivider label="Other Details" open={showOtherDetails} onToggle={() => setShowOtherDetails(o => !o)} />

      {showOtherDetails && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FRow label="Label">
              <FSelect value={form.label} onChange={set('label')}>
                {['','Urgent Follow-up','Customer Complaint','AMC Related','Internal','Revenue Critical'].map(l => (
                  <option key={l} value={l}>{l || '-- None --'}</option>
                ))}
              </FSelect>
            </FRow>
            <FRow label="Milestone">
              <FSelect value={form.milestone} onChange={set('milestone')}>
                {['','Q1 2026','Q2 2026','AMC Season','Summer Peak'].map(m => (
                  <option key={m} value={m}>{m || '--'}</option>
                ))}
              </FSelect>
            </FRow>
            <FRow label="Priority">
              <FSelect value={form.priority} onChange={set('priority')}>
                <option value="normal">🔵 Normal</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="low">🟢 Low</option>
              </FSelect>
            </FRow>
          </div>

          {timeEstimate && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FRow label="Estimated Hours"><FInput type="number" placeholder="2" value={form.estHours} onChange={set('estHours')} /></FRow>
              <FRow label="Estimated Minutes"><FInput type="number" placeholder="30" min="0" max="59" value={form.estMinutes} onChange={set('estMinutes')} /></FRow>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '10px 0' }}>
            <CheckRow checked={makePrivate}  onChange={e => setMakePrivate(e.target.checked)}  label="Make Private"              hint="Only visible to you and admins" />
            <CheckRow checked={billable}     onChange={e => setBillable(e.target.checked)}     label="Billable"                  hint="Link this task to a customer invoice" />
            <CheckRow checked={timeEstimate} onChange={e => setTimeEstimate(e.target.checked)} label="Time Estimate"             hint="Set expected hours for this task" />
            <CheckRow checked={dependent}    onChange={e => setDependent(e.target.checked)}    label="Dependent on another task" hint="This task cannot start until another is done" />
          </div>

          {dependent && (
            <FRow label="Depends On">
              <FSelect value={form.dependsOn} onChange={set('dependsOn')}>
                <option value="">-- Select task --</option>
                <option>TSK-041 – Follow up with Gas renewal</option>
                <option>TSK-040 – Process February salary</option>
                <option>TSK-039 – Order R-32 refrigerant</option>
              </FSelect>
            </FRow>
          )}

          {billable && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FRow label="Linked Invoice / Customer">
                <FSelect value={form.billableCustomer} onChange={set('billableCustomer')}>
                  <option value="">-- Select --</option>
                  {['Sharma Residency','Sunrise Hotel','TechPark Ltd.','City Mall'].map(c => <option key={c}>{c}</option>)}
                </FSelect>
              </FRow>
              <FRow label="Billable Amount (₹)">
                <FInput type="number" placeholder="500" value={form.billableAmount} onChange={set('billableAmount')} />
              </FRow>
            </div>
          )}

          <FRow label="Add File">
            <div
              onClick={() => document.getElementById('ntm-file-input').click()}
              style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 9, padding: '18px 14px', textAlign: 'center', cursor: 'pointer', background: '#FAFAFA' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.brand}
              onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>📎</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                {fileName || 'Click to choose a file — PDF, image, or document'}
              </div>
              <input id="ntm-file-input" type="file" style={{ display: 'none' }}
                onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
            </div>
          </FRow>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <button
          onClick={onClose}
          style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${COLORS.brand}`, background: COLORS.brandL, color: COLORS.brand, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.sans }}
        >
          💾 Save &amp; Add More
        </button>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Saving…' : '✓ Save'}</FBtn>
      </div>
    </Modal>
  );
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#EA580C' }) => {
  const w = 340, h = 60, pad = 6;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity=".18" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />)}
    </svg>
  );
};

// ─── Gauge ────────────────────────────────────────────────────────────────────
const Gauge = ({ pct, color = '#EA580C' }) => {
  const r = 42, cx = 55, cy = 55, circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={110} height={110} viewBox="0 0 110 110">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={11} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={11}
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize={16} fontWeight={700} fontFamily={FONTS.mono}>{pct}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={COLORS.faint} fontSize={9} fontFamily={FONTS.sans}>of target</text>
    </svg>
  );
};

// ─── BarRow ───────────────────────────────────────────────────────────────────
const BarRow = ({ label, value, max, displayVal, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
      <span>{label}</span><span style={{ fontWeight: 700, color }}>{displayVal}</span>
    </div>
    <div style={{ height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  </div>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, badge, badgeColor = '#16A34A', badgeBg = '#F0FDF4' }) => (
  <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px' }}>
    <div style={{ fontSize: 10, color: COLORS.faint, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>{value}</div>
    {badge && (
      <div style={{ display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: badgeBg, color: badgeColor }}>
        {badge}
      </div>
    )}
  </div>
);

// ─── ScorecardModal ───────────────────────────────────────────────────────────
// Read-only modal — no CRUD needed. Displays data passed in via `tech` prop.
// PDF export handled by PDFPreview (existing).
export const ScorecardModal = ({ tech, onClose, salaries = [] }) => {
  const [tab,     setTab]     = useState('overview');
  const [pdfOpen, setPdfOpen] = useState(false);

  const salaryRow  = salaries.find(s => s.techId === tech?.techId) || {};
  const pct        = tech?.target ? Math.round((tech.jobsDone / tech.target) * 100) : 0;
  const perfColor  = pct >= 100 ? '#16A34A' : pct >= 85 ? '#B45309' : '#DC2626';
  const TREND_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const trendData  = tech?.trend || [22, 25, 28, 26, tech?.jobsDone ?? 0];
  const pdfData    = { ...(tech ?? {}), ...salaryRow, trend: trendData };

  if (!tech) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,15,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: 640, height: '90vh', background: COLORS.white, borderRadius: 18, border: `1px solid ${COLORS.border}`, overflow: 'scroll', scrollbarWidth: 'none', boxShadow: '0 24px 80px rgba(0,0,0,0.22)', animation: 'scSlideIn 0.25s cubic-bezier(.4,0,.2,1)' }}
        >
          {/* Hero header */}
          <div style={{ background: '#18181B', padding: '22px 24px 0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(45deg,#EA580C,#EA580C 2px,transparent 2px,transparent 16px)', pointerEvents: 'none' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(234,88,12,0.18)', border: '1px solid rgba(234,88,12,0.35)', borderRadius: 6, padding: '3px 10px', marginBottom: 14, fontSize: 11, fontWeight: 700, color: '#FB923C' }}>
              ★ #{tech.rank} Top Performer · February 2026
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: 'linear-gradient(135deg,#EA580C,#C2410C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{tech.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Senior Technician · Zone A</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#EA580C', fontFamily: FONTS.mono }}>{pct}%</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>of target</div>
              </div>
            </div>

            <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 18 }}>
              {[['overview','Overview'],['trend','Trend'],['details','Details']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  style={{ padding: '10px 18px', fontSize: 12, fontWeight: 700, color: tab === k ? '#EA580C' : 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === k ? '#EA580C' : 'transparent'}`, cursor: 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px' }}>
            {tab === 'overview' && (
              <>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <Gauge pct={pct} color={perfColor} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <BarRow label="Jobs completed"        value={tech.jobsDone}            max={tech.target} displayVal={`${tech.jobsDone} / ${tech.target}`} color={perfColor} />
                    <BarRow label="On-time delivery"      value={tech.onTime}              max={100}         displayVal={`${tech.onTime}%`}                   color="#16A34A"  />
                    <BarRow label="Customer satisfaction" value={(tech.rating / 5) * 100}  max={100}         displayVal={`${tech.rating} / 5.0★`}             color="#F59E0B"  />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  <StatCard label="Rating"     value={`${tech.rating}★`}                       badge="Above avg"   badgeColor="#B45309" badgeBg="#FFFBEB" />
                  <StatCard label="On-time"    value={`${tech.onTime}%`}                        badge="+5% vs avg" />
                  <StatCard label="Complaints" value={tech.complaints}                          badge={tech.complaints === 0 ? 'Clean ✓' : `${tech.complaints} flagged`} badgeColor={tech.complaints === 0 ? '#16A34A' : '#DC2626'} badgeBg={tech.complaints === 0 ? '#F0FDF4' : '#FEF2F2'} />
                  <StatCard label="Revenue"    value={`₹${(tech.revenue / 1000).toFixed(0)}K`} badge="35% share"  badgeColor={COLORS.brand} badgeBg={COLORS.brandL} />
                </div>
              </>
            )}

            {tab === 'trend' && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 4 }}>Jobs completed — 5 month trend</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Oct 2025 – Feb 2026</div>
                </div>
                <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '16px 16px 10px' }}>
                  <Sparkline data={trendData} color="#EA580C" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    {TREND_MONTHS.map((m, i) => (
                      <div key={m} style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: 10, color: COLORS.faint }}>{m}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.h2 }}>{trendData[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: COLORS.faint, marginBottom: 4 }}>Peak month</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>{TREND_MONTHS[trendData.indexOf(Math.max(...trendData))]}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted }}>{Math.max(...trendData)} jobs completed</div>
                  </div>
                  <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: COLORS.faint, marginBottom: 4 }}>5-month average</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>{Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length)} jobs</div>
                    <div style={{ fontSize: 12, color: COLORS.muted }}>per month</div>
                  </div>
                </div>
              </>
            )}

            {tab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Technician ID',    tech.techId || 'TECH-001'],
                  ['Department',       'Field Operations'],
                  ['Zone',             'Zone A – North Ahmedabad'],
                  ['Period',           'February 2026'],
                  ['Total Revenue',    `₹${tech.revenue?.toLocaleString()}`],
                  ['Incentive Earned', `₹${(salaryRow.incentive || 0).toLocaleString()}`],
                  ['Complaint Record', tech.complaints === 0 ? '✓ Clean – No complaints' : `${tech.complaints} complaint(s)`],
                  ['Rank',             `#${tech.rank} of 5 technicians`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: COLORS.muted }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px', borderTop: `1px solid ${COLORS.border}`, background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'end' }}>
            <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.muted, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={() => setPdfOpen(true)}
              style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#EA580C,#C2410C)', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              ⬇ Download PDF
            </button>
          </div>
        </div>
      </div>

      <PDFPreview
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        template="scorecard"
        data={pdfData}
        title={`${tech.name} – Scorecard`}
        filename={`cooltech-scorecard-${tech.name.toLowerCase().replace(/\s+/g, '-')}-feb2026`}
      />

      <style>{`
        @keyframes scSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

// ─── LogTimeModal ─────────────────────────────────────────────────────────────
export const LogTimeModal = ({ open, onClose, onSave }) => {
  const [liveTechs, setLiveTechs] = useState([]);
  const [liveJobs,  setLiveJobs]  = useState([]);
  const [form, setForm] = useState({
    technician: '',
    job:        '',
    type:       'Service',
    customer:   '',
    date:       new Date().toISOString().slice(0, 10),
    start:      '09:00',
    end:        '10:00',
    billable:   false,
    notes:      '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!open) return;
    techsApi.list()
      .then(r => setLiveTechs(r?.data || []))
      .catch(() => setLiveTechs([]));
    jobsApi.list()
      .then(r => setLiveJobs(r?.data || []))
      .catch(() => setLiveJobs([]));
  }, [open]);

  // Auto-calculate hours from start/end
  const calcHrs = () => {
    const [sh, sm] = form.start.split(':').map(Number);
    const [eh, em] = form.end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? +(diff / 60).toFixed(2) : 0;
  };
  const hrs = calcHrs();

  const { loading, error, submit } = useModalForm(
    payload => timelogsApi.create(payload),
    onSave,
    onClose,
  );

  const handleSave = () => {
    if (!form.technician) { alert('Technician is required'); return; }
    if (!form.date)       { alert('Date is required'); return; }
    if (hrs <= 0)         { alert('End time must be after start time'); return; }
    submit({ ...form, hrs });
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="⏱ Log Time" width={520}>
      <ErrorBanner message={error} />

      <SectionHead title="Who & What" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FRow label="Technician *">
          <FSelect value={form.technician} onChange={set('technician')}>
            <option value="">Select…</option>
            {liveTechs.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Activity Type">
          <FSelect value={form.type} onChange={set('type')}>
            {['Service','Installation','Repair','AMC','Gas Refill','Training','Admin','Travel','Other'].map(v => (
              <option key={v}>{v}</option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Linked Job">
          <FSelect value={form.job} onChange={set('job')}>
            <option value="">— None —</option>
            {liveJobs.map(j => (
  <option key={j._id} value={j._id}>
    {j.jobId || j._id} – {typeof j.customer === 'object' ? j.customer?.name : j.customer}
  </option>
))}
          </FSelect>
        </FRow>
        <FRow label="Customer">
          <FInput placeholder="Auto-fill or enter manually" value={form.customer} onChange={set('customer')} />
        </FRow>
      </div>

      <SectionHead title="When" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <FRow label="Date *">
          <FInput type="date" value={form.date} onChange={set('date')} />
        </FRow>
        <FRow label="Start Time *">
          <FInput type="time" value={form.start} onChange={set('start')} />
        </FRow>
        <FRow label="End Time *">
          <FInput type="time" value={form.end} onChange={set('end')} />
        </FRow>
      </div>

      {/* Live hours preview */}
      {hrs > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: `${COLORS.brand}08`, border: `1px solid ${COLORS.brand}20`, fontSize: 12, color: COLORS.brand, marginBottom: 4 }}>
          Duration: <strong>{hrs.toFixed(1)} hour{hrs !== 1 ? 's' : ''}</strong>
        </div>
      )}
      {hrs <= 0 && form.start && form.end && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: '#DC2626', marginBottom: 4 }}>
          ⚠️ End time must be after start time
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 4 }}>
        <FRow label="Billable">
          <div
            onClick={() => setForm(f => ({ ...f, billable: !f.billable }))}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: form.billable ? `${COLORS.brand}08` : COLORS.bg, border: `1px solid ${form.billable ? COLORS.brand + '40' : COLORS.border}`, cursor: 'pointer' }}
          >
            <input type="checkbox" checked={form.billable} onChange={() => {}}
              style={{ accentColor: COLORS.brand, width: 15, height: 15, cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: form.billable ? COLORS.brand : COLORS.body, fontWeight: form.billable ? 600 : 400, fontFamily: FONTS.sans }}>
              {form.billable ? '✓ Billable entry' : 'Non-billable'}
            </span>
          </div>
        </FRow>
        <FRow label="Notes">
          <FInput placeholder="Optional notes…" value={form.notes} onChange={set('notes')} />
        </FRow>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading || hrs <= 0}>
          {loading ? 'Saving…' : '⏱ Log Time'}
        </FBtn>
      </div>
    </Modal>
  );
};