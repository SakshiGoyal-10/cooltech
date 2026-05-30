// ─── QuotationModals.jsx ──────────────────────────────────────────────────────
// Drop this file into src/components/ui/ (or wherever your modals live)
// Then import and use in QuotationsPage.jsx as shown at the bottom.

import { useState } from 'react';
import { quotationsApi } from '../../services/api';   
import { QUOT_STATUS }   from '../../constants/statusMaps';

// ─── Shared overlay ───────────────────────────────────────────────────────────
const Overlay = ({ onClose, children }) => (
  <div
    onClick={onClose}
    style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(15,23,42,.55)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }}
  >
    <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:480 }}>
      {children}
    </div>
  </div>
);

const ModalCard = ({ children, style = {} }) => (
  <div style={{
    background:'#fff', borderRadius:16, overflow:'hidden',
    boxShadow:'0 24px 64px rgba(0,0,0,.22)', ...style,
  }}>
    {children}
  </div>
);

const ModalHeader = ({ icon, title, sub, onClose }) => (
  <div style={{ padding:'20px 22px 16px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'flex-start', gap:14 }}>
    <div style={{ fontSize:28, lineHeight:1 }}>{icon}</div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', lineHeight:1.3 }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{sub}</div>}
    </div>
    <button onClick={onClose} style={{ flexShrink:0, background:'none', border:'none', fontSize:18, color:'#94a3b8', cursor:'pointer', padding:'0 4px', lineHeight:1 }}>✕</button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. UPDATE STATUS MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const UpdateStatusModal = ({ quot, onClose, onUpdated }) => {
  const [selected, setSelected] = useState(quot?.status || 'draft');
  const [note, setNote]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const statuses = [
    { key:'draft',    icon:'📝', label:'Draft',    desc:'Still being prepared', color:'#64748b', bg:'#f8fafc' },
    { key:'sent',     icon:'📤', label:'Sent',     desc:'Delivered to customer', color:'#2563eb', bg:'#eff6ff' },
    { key:'approved', icon:'✅', label:'Approved', desc:'Customer accepted the quote', color:'#16a34a', bg:'#f0fdf4' },
    { key:'rejected', icon:'❌', label:'Rejected', desc:'Customer declined', color:'#dc2626', bg:'#fef2f2' },
    { key:'expired',  icon:'⏰', label:'Expired',  desc:'Validity date passed', color:'#d97706', bg:'#fffbeb' },
  ];

  const handleSave = async () => {
    if (selected === quot.status) { onClose(); return; }
    setLoading(true); setError('');
    try {
      const mongoId = quot._id || quot.id;
      // PATCH /quotations/:id/status
      const updated = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quotations/${mongoId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
          },
          body: JSON.stringify({ status: selected, note }),
        }
      );
      if (!updated.ok) {
        const d = await updated.json();
        throw new Error(d.message || 'Update failed');
      }
      const data = await updated.json();
      onUpdated(data);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard>
        <ModalHeader icon="🔄" title="Update Quotation Status" sub={`Currently: ${QUOT_STATUS[quot?.status]?.label || quot?.status}`} onClose={onClose} />

        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:8 }}>
          {statuses.map(s => (
            <button
              key={s.key}
              onClick={() => setSelected(s.key)}
              style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                border:`2px solid ${selected === s.key ? s.color : '#e2e8f0'}`,
                borderRadius:10, background: selected === s.key ? s.bg : '#fff',
                cursor:'pointer', transition:'all .15s', textAlign:'left',
              }}
            >
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color: selected === s.key ? s.color : '#1e293b' }}>{s.label}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{s.desc}</div>
              </div>
              {selected === s.key && (
                <div style={{ width:20, height:20, borderRadius:'50%', background:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'white', fontSize:11, fontWeight:900 }}>✓</span>
                </div>
              )}
              {quot?.status === s.key && selected !== s.key && (
                <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600, padding:'2px 7px', borderRadius:20, background:'#f1f5f9' }}>current</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding:'0 22px 8px' }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#64748b', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>Internal note (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Customer called to confirm approval…"
            rows={2}
            style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12, resize:'vertical', fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#fafafa' }}
          />
        </div>

        {error && <div style={{ margin:'0 22px', padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:12, color:'#dc2626' }}>{error}</div>}

        <div style={{ padding:'12px 22px 20px', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, fontWeight:600, cursor:'pointer', background:'#f8fafc', color:'#475569' }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading || selected === quot?.status}
            style={{
              padding:'8px 20px', borderRadius:8, border:'none', fontSize:13, fontWeight:700,
              cursor: loading || selected === quot?.status ? 'not-allowed' : 'pointer',
              background: selected === quot?.status ? '#e2e8f0' : 'linear-gradient(135deg,#1a2e5c,#2563eb)',
              color: selected === quot?.status ? '#94a3b8' : 'white',
              boxShadow: selected !== quot?.status ? '0 4px 12px rgba(37,99,235,.35)' : 'none',
              transition:'all .15s',
            }}
          >
            {loading ? '⏳ Saving…' : '✓ Update Status'}
          </button>
        </div>
      </ModalCard>
    </Overlay>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SEND EMAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const SendEmailModal = ({ quot, onClose, onSent }) => {
  const [form, setForm] = useState({
    toEmail: quot?.email || '',
    toName:  quot?.contact || quot?.customer || '',
    subject: `Quotation ${quot?.id} – Alisha Engineering`,
    message: `Thank you for your interest. Please find your quotation ${quot?.id} for ${quot?.type} services attached below. We look forward to serving you!`,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSend = async () => {
    if (!form.toEmail.trim()) { setError('Recipient email is required.'); return; }
    setLoading(true); setError('');
    try {
      const mongoId = quot._id || quot.id;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quotations/${mongoId}/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
          },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send email');
      setSent(true);
      if (onSent) onSent(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <Overlay onClose={onClose}>
      <ModalCard>
        <div style={{ padding:'40px 32px', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Email Sent!</div>
          <div style={{ fontSize:13, color:'#64748b', marginBottom:24, lineHeight:1.7 }}>
            Quotation <strong>{quot?.id}</strong> has been sent to <strong>{form.toEmail}</strong>.<br/>
            Status updated to <strong>Sent</strong>.
          </div>
          <button onClick={onClose} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1a2e5c,#2563eb)', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>Done</button>
        </div>
      </ModalCard>
    </Overlay>
  );

  const inputStyle = {
    width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8,
    fontSize:13, fontFamily:'inherit', outline:'none', background:'#fafafa', boxSizing:'border-box',
    transition:'border-color .15s',
  };
  const labelStyle = { fontSize:11, fontWeight:700, color:'#64748b', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 };

  return (
    <Overlay onClose={onClose}>
      <ModalCard style={{ maxWidth:520 }}>
        <ModalHeader icon="📧" title="Send Quotation to Customer" sub={`${quot?.id} · ₹${Number(quot?.total || 0).toLocaleString()}`} onClose={onClose} />

        {/* Preview strip */}
        <div style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0', padding:'10px 22px', display:'flex', gap:16, flexWrap:'wrap' }}>
          {[['Items', `${quot?.items?.length || 0} line items`], ['Subtotal', `₹${Number(quot?.subtotal||0).toLocaleString()}`], ['Total', `₹${Number(quot?.total||0).toLocaleString()}`]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{k}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', gap:12 }}>
            <div style={{ flex:2 }}>
              <label style={labelStyle}>Recipient Email *</label>
              <input value={form.toEmail} onChange={set('toEmail')} placeholder="customer@email.com" style={inputStyle} type="email" />
            </div>
            <div style={{ flex:1.5 }}>
              <label style={labelStyle}>Recipient Name</label>
              <input value={form.toName} onChange={set('toName')} placeholder="Contact name" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email Subject</label>
            <input value={form.subject} onChange={set('subject')} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Message / Body</label>
            <textarea value={form.message} onChange={set('message')} rows={4} style={{ ...inputStyle, resize:'vertical' }} />
          </div>
        </div>

        {error && <div style={{ margin:'0 22px 10px', padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:12, color:'#dc2626' }}>{error}</div>}

        <div style={{ padding:'12px 22px 20px', display:'flex', gap:8, justifyContent:'flex-end', borderTop:'1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, fontWeight:600, cursor:'pointer', background:'#f8fafc', color:'#475569' }}>Cancel</button>
          <button
            onClick={handleSend}
            disabled={loading}
            style={{ padding:'8px 22px', borderRadius:8, border:'none', fontSize:13, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', background:'linear-gradient(135deg,#1a2e5c,#2563eb)', color:'white', boxShadow:'0 4px 12px rgba(37,99,235,.35)', display:'flex', alignItems:'center', gap:7 }}
          >
            {loading ? '⏳ Sending…' : '📧 Send Email'}
          </button>
        </div>
      </ModalCard>
    </Overlay>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONVERT TO JOB MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const ConvertToJobModal = ({ quot, onClose, onConverted }) => {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(null); // holds created job

  const handleConvert = async () => {
    setLoading(true); setError('');
    try {
      const mongoId = quot._id || quot.id;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quotations/${mongoId}/convert`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Conversion failed');
      setDone(data.job);
      if (onConverted) onConverted(data.job);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (done) return (
    <Overlay onClose={onClose}>
      <ModalCard>
        <div style={{ padding:'40px 32px', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Job Created!</div>
          <div style={{ fontSize:13, color:'#64748b', marginBottom:6, lineHeight:1.7 }}>
            Quotation <strong>{quot?.id}</strong> converted to work order
          </div>
          <div style={{ display:'inline-block', padding:'6px 16px', borderRadius:8, background:'#f0fdf4', border:'1px solid #bbf7d0', fontFamily:'monospace', fontWeight:800, fontSize:15, color:'#15803d', marginBottom:24 }}>
            {done.jobId}
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>Close</button>
            <button
              onClick={() => { onClose(); window.location.href = '/work-orders'; }}
              style={{ padding:'9px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#15803d,#16a34a)', color:'white', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(22,163,74,.35)' }}
            >
              → View in Work Orders
            </button>
          </div>
        </div>
      </ModalCard>
    </Overlay>
  );

  // map type for display
  const jobTypeMap = { Service:'Service', Installation:'Installation', Repair:'Repair', AMC:'AMC Visit', Other:'Service' };

  return (
    <Overlay onClose={onClose}>
      <ModalCard>
        <ModalHeader icon="⚙️" title="Convert to Work Order" sub="This will create a new job from this quotation" onClose={onClose} />

        {/* Preview of what will be created */}
        <div style={{ padding:'16px 22px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Job will be created with:</div>

          {[
            ['Customer',    quot?.customer],
            ['Job Type',    jobTypeMap[quot?.type] || quot?.type],
            ['Amount',      `₹${Number(quot?.total||0).toLocaleString()}`],
            ['Line Items',  `${quot?.items?.length || 0} items → stored as parts`],
            ['Issue Note',  `From ${quot?.id}: ${quot?.type}`],
            ['Status',      'New (unassigned)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
              <span style={{ color:'#64748b', fontWeight:500 }}>{k}</span>
              <span style={{ color:'#0f172a', fontWeight:600, textAlign:'right', maxWidth:'60%' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Items breakdown */}
        {(quot?.items?.length > 0) && (
          <div style={{ margin:'0 22px 16px', border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
            <div style={{ background:'#f8fafc', padding:'7px 12px', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5 }}>Line Items → Parts</div>
            {quot.items.map((item, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 12px', borderTop:'1px solid #f1f5f9', fontSize:12 }}>
                <span style={{ color:'#374151' }}>{item.desc}</span>
                <span style={{ color:'#64748b', fontFamily:'monospace' }}>×{item.qty} · ₹{Number(item.rate||0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding:'4px 22px', background:'#fffbeb', borderTop:'1px solid #fde68a', borderBottom:'1px solid #fde68a', margin:'0 0 4px' }}>
          <div style={{ fontSize:12, color:'#92400e', padding:'8px 0', lineHeight:1.6 }}>
            ⚠️ Quotation status will be updated to <strong>Approved</strong>. This cannot be undone.
          </div>
        </div>

        {error && <div style={{ margin:'8px 22px', padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:12, color:'#dc2626' }}>{error}</div>}

        <div style={{ padding:'14px 22px 20px', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, fontWeight:600, cursor:'pointer', background:'#f8fafc', color:'#475569' }}>Cancel</button>
          <button
            onClick={handleConvert}
            disabled={loading || quot?.status === 'approved'}
            style={{
              padding:'9px 20px', borderRadius:8, border:'none', fontSize:13, fontWeight:700,
              cursor: loading || quot?.status === 'approved' ? 'not-allowed' : 'pointer',
              background: quot?.status === 'approved' ? '#e2e8f0' : 'linear-gradient(135deg,#15803d,#16a34a)',
              color: quot?.status === 'approved' ? '#94a3b8' : 'white',
              boxShadow: quot?.status !== 'approved' ? '0 4px 12px rgba(22,163,74,.35)' : 'none',
            }}
          >
            {loading ? '⏳ Converting…' : quot?.status === 'approved' ? 'Already Converted' : '✓ Convert to Work Order'}
          </button>
        </div>
      </ModalCard>
    </Overlay>
  );
};