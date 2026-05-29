import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { TypeTag, Avatar, Divider } from '../components/ui/Badges';
import { SectionHdr } from '../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea } from '../components/ui/Form';
import { feedbackApi, customersApi, jobsApi } from '../services/api';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type = 'success', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const s = type === 'error'
    ? { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', icon: '⚠' }
    : { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', icon: '✅' };
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,.1)',
      display: 'flex', gap: 10, alignItems: 'center', maxWidth: 460,
    }}>
      {s.icon} {msg}
      <button onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: s.color }}>
        ✕
      </button>
    </div>
  );
};

// ─── Request Feedback Modal (Email only) ──────────────────────────────────────
const DEFAULT_MSG =
  "Hi! We recently completed a service at your premises.\n\nWe'd love to hear your feedback — it helps us serve you better.\n\nPlease take 30 seconds to rate our service. Your opinion means a lot to our team!";

const TEMPLATES = [
  {
    label: 'Friendly',
    msg: DEFAULT_MSG,
  },
  {
    label: 'Post-job',
    msg: "Your recent job has been completed by our team.\n\nCould you spare a moment to share your experience? Your feedback helps us improve our services.",
  },
  {
    label: 'AMC',
    msg: "Thank you for being a valued AMC customer of CoolTech AC Services! 🙏\n\nYour recent AMC visit has been completed. We'd love to know how we did — please share your feedback!",
  },
];

const RequestModal = ({ customers, onClose, onSent }) => {
  const [form, setForm] = useState({
    customerId: '',
    jobId:      '',
    subject:    'How was our service? — CoolTech AC Services',
    message:    DEFAULT_MSG,
  });
  const [customerEmail, setCustomerEmail] = useState('');
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Load jobs when customer changes, show their email
  useEffect(() => {
    if (!form.customerId) { setJobs([]); setCustomerEmail(''); return; }
    const cust = customers.find(c => (c._id || c.id) === form.customerId);
    setCustomerEmail(cust?.email || '');
    jobsApi.list({ customer: form.customerId, limit: 50 })
      .then(d => setJobs(Array.isArray(d) ? d : d.data ?? []));
  }, [form.customerId, customers]);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const send = async () => {
    if (!form.customerId)     { setError('Please select a customer');            return; }
    if (!customerEmail)       { setError('This customer has no email on file');  return; }
    if (!form.message.trim()) { setError('Message cannot be empty');             return; }
    setLoading(true); setError('');
    try {
      const res = await feedbackApi.requestFeedback({
        customerId: form.customerId,
        jobId:      form.jobId || undefined,
        message:    form.message,
        subject:    form.subject,
      });
      if (res.success === false) {
        setError(res.message + (res.hint ? `\n\nHint: ${res.hint}` : ''));
      } else {
        onSent(`Feedback request emailed to ${customerEmail}`);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">⭐ Request Customer Feedback</span>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
              padding: '9px 13px', fontSize: 13, color: '#DC2626',
              marginBottom: 14, whiteSpace: 'pre-wrap',
            }}>⚠ {error}</div>
          )}

          {/* Customer */}
          <FRow label="Customer">
            <FSelect name="customerId" value={form.customerId} onChange={handle}>
              <option value="">— Select customer —</option>
              {customers.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
              ))}
            </FSelect>
          </FRow>

          {/* Email preview pill */}
          {form.customerId && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              borderRadius: 8, marginBottom: 14,
              background: customerEmail ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${customerEmail ? '#BBF7D0' : '#FECACA'}`,
              fontSize: 12,
            }}>
              <span style={{ fontSize: 15 }}>📧</span>
              {customerEmail
                ? <span style={{ color: '#166534' }}>Will be sent to <strong>{customerEmail}</strong></span>
                : <span style={{ color: '#DC2626' }}>No email address found for this customer</span>
              }
            </div>
          )}

          {/* Job reference */}
          <FRow label="Job Reference (optional)">
            <FSelect name="jobId" value={form.jobId} onChange={handle}
                     disabled={!form.customerId}>
              <option value="">— No specific job —</option>
              {jobs.map(j => (
                <option key={j._id || j.id} value={j._id || j.id}>
                  {j.jobId} — {j.type}
                </option>
              ))}
            </FSelect>
          </FRow>

          {/* Subject */}
          <FRow label="Email Subject">
            <FInput name="subject" value={form.subject} onChange={handle} />
          </FRow>

          {/* Message */}
          <FRow label="Message">
            <FTextarea name="message" value={form.message} onChange={handle} rows={5} />
          </FRow>

          {/* Quick templates */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {TEMPLATES.map(t => (
              <span key={t.label}
                onClick={() => setForm(f => ({ ...f, message: t.msg }))}
                style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
                  background: '#EFF6FF', color: '#0369A1', border: '1px solid #BFDBFE',
                }}>
                {t.label}
              </span>
            ))}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={send}
                    disabled={loading || !customerEmail}>
              {loading ? 'Sending…' : '📧 Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Single feedback card ─────────────────────────────────────────────────────
const FeedbackCard = ({ fb, onReply, onFollowUp }) => {
  const [replyText, setReplyText] = useState('');
  const [replying,  setReplying]  = useState(false);
  const isNegative = fb.rating <= 2;

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try   { await onReply(fb._id, replyText); setReplyText(''); }
    finally { setReplying(false); }
  };

  const dateStr = fb.createdAt
    ? new Date(fb.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : fb.date || '';

  return (
    <div style={{
      background: COLORS.white, borderRadius: 12,
      border: `1px solid ${isNegative && !fb.resolved ? '#FECACA' : COLORS.border}`,
      padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <Avatar name={fb.customerName || fb.customer || '?'} size={36} />
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:COLORS.h1 }}>
              {fb.customerName || fb.customer}
            </div>
            <div style={{ display:'flex', gap:6, marginTop:3, alignItems:'center' }}>
              <span style={{ fontSize:12, color:'#F59E0B' }}>
                {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
              </span>
              <span style={{ fontSize:11, fontFamily:FONTS.mono, color:'#EA580C', fontWeight:600 }}>
                {fb.rating}.0
              </span>
              {fb.category && <TypeTag type={fb.category} />}
            </div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:11, color:COLORS.faint }}>{dateStr}</div>
          <div style={{ display:'flex', gap:6, marginTop:4, justifyContent:'flex-end', alignItems:'center' }}>
            {(fb.jobRef || fb.techName) && (
              <span style={{ fontSize:11, fontFamily:FONTS.mono, color:COLORS.muted }}>
                {fb.jobRef}{fb.jobRef && fb.techName ? ' · ' : ''}{fb.techName}
              </span>
            )}
            {fb.recommend && (
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99,
                             background:'#F0FDF4', color:'#16A34A' }}>
                👍 Recommends
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Comment */}
      <p style={{
        fontSize:13, color:COLORS.body, lineHeight:1.7, fontStyle:'italic',
        borderLeft:'3px solid #EA580C', paddingLeft:12, margin:'0 0 10px',
      }}>
        "{fb.comment}"
      </p>

      {/* Negative follow-up banner */}
      {isNegative && !fb.resolved && (
        <div style={{
          padding:'8px 12px', borderRadius:7, background:'#FEF2F2',
          border:'1px solid #FECACA', display:'flex',
          justifyContent:'space-between', alignItems:'center', marginBottom:10,
        }}>
          <span style={{ fontSize:12, color:'#DC2626', fontWeight:600 }}>
            ⚠ Negative feedback – needs follow-up
          </span>
          <button className="btn" onClick={() => onFollowUp(fb._id)} style={{
            padding:'4px 12px', borderRadius:6, background:'#DC2626',
            color:'white', fontSize:11, fontWeight:700,
          }}>
            Follow Up
          </button>
        </div>
      )}
      {fb.resolved && fb.followUpNote && (
        <div style={{ fontSize:11, color:'#16A34A', marginBottom:8 }}>
          ✅ Follow-up done: {fb.followUpNote}
        </div>
      )}

      {/* Reply */}
      {fb.replied && fb.reply ? (
        <div style={{ padding:'10px 13px', borderRadius:8,
                      background:'#F0FDF4', border:'1px solid #BBF7D0' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#16A34A', marginBottom:4 }}>
            ✅ Your Reply (CoolTech AC Services)
          </div>
          <div style={{ fontSize:12, color:'#166534', lineHeight:1.6 }}>{fb.reply}</div>
        </div>
      ) : (
        <div>
          <span style={{
            fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:99,
            background:'#FFFBEB', color:'#B45309', border:'1px solid #FDE68A',
            display:'inline-block', marginBottom:8,
          }}>⏳ Reply Needed</span>

          <textarea
            value={replyText} onChange={e => setReplyText(e.target.value)}
            placeholder="Write a professional reply..."
            style={{
              display:'block', width:'100%', padding:'9px 12px', borderRadius:7,
              border:'1px solid #E5E7EB', fontSize:12, resize:'none', height:65,
              background:'#F9FAFB', boxSizing:'border-box', marginTop:4,
              fontFamily:'Plus Jakarta Sans, sans-serif',
            }}
          />

          {/* Quick reply templates */}
          <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
            {[
              'Thank you for the wonderful feedback! We look forward to serving you again.',
              'We apologize for the inconvenience. Our team will contact you to resolve this.',
              "We're glad you chose CoolTech! Your satisfaction means everything to us.",
            ].map(t => (
              <span key={t} onClick={() => setReplyText(t)} style={{
                fontSize:10, padding:'3px 8px', borderRadius:5, cursor:'pointer',
                background:'#EFF6FF', color:'#0369A1', border:'1px solid #BFDBFE',
              }}>
                {t.slice(0, 28)}…
              </span>
            ))}
          </div>

          <button onClick={submitReply}
            disabled={replying || !replyText.trim()}
            style={{
              marginTop:8, padding:'6px 16px', borderRadius:7, border:'none',
              background: replying || !replyText.trim() ? '#E5E7EB' : '#EA580C',
              color: replying || !replyText.trim() ? '#9CA3AF' : 'white',
              fontSize:12, fontWeight:700,
              cursor: replying || !replyText.trim() ? 'not-allowed' : 'pointer',
            }}>
            {replying ? 'Posting…' : 'Post Reply'}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── FeedbackPage ─────────────────────────────────────────────────────────────
const FeedbackPage = ({ openModal }) => {
  const [feedback,  setFeedback]  = useState([]);
  const [stats,     setStats]     = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [filter,    setFilter]    = useState('all');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fbData, statsData, custData] = await Promise.all([
        feedbackApi.list(),
        feedbackApi.stats(),
        customersApi.list(),
      ]);
      setFeedback(Array.isArray(fbData)   ? fbData   : fbData.data   ?? []);
      setStats(statsData);
      setCustomers(Array.isArray(custData) ? custData : custData.data ?? []);
    } catch (err) {
      setToast({ msg: 'Failed to load: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (id, reply) => {
    const updated = await feedbackApi.reply(id, reply);
    setFeedback(prev => prev.map(f => f._id === id ? updated : f));
    setToast({ msg: 'Reply posted!' });
  };

  const handleFollowUp = async (id) => {
    const note = window.prompt('Follow-up note (optional):') ?? '';
    const updated = await feedbackApi.followUp(id, note);
    setFeedback(prev => prev.map(f => f._id === id ? updated : f));
    setToast({ msg: 'Follow-up marked as done ✅' });
    if (openModal) openModal('set_reminder');
  };

  // ── Computed stats (fallback to local calc if API stats missing) ──
  const total     = stats?.total     ?? feedback.length;
  const avgRating = stats?.avgRating ?? (feedback.length
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : '0.0');
  const recommend = stats?.recommend ?? feedback.filter(f => f.recommend).length;
  const avgRes    = stats?.avgResolution ?? '2.3';
  const byRating  = stats?.byRating  ?? [5,4,3,2,1].map(s => ({
    stars: s, count: feedback.filter(f => f.rating === s).length,
  }));

  const unreplied = feedback.filter(f => !f.replied).length;
  const filtered  = feedback.filter(f => {
    if (filter === 'unreplied') return !f.replied;
    if (filter === 'negative')  return f.rating <= 2;
    return true;
  });

  return (
    <div className="fi" style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
        <SectionHdr
          title="Feedback & Ratings"
          sub="Post-service customer reviews"
          action={null}
        />
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          {unreplied > 0 && (
            <button className="btn" onClick={() => setFilter('unreplied')} style={{
              padding:'9px 16px', borderRadius:9, background:'#FFFBEB',
              border:'1px solid #FDE68A', color:'#B45309', fontSize:12, fontWeight:700,
            }}>
              ⚠ {unreplied} Unreplied
            </button>
          )}
          <button className="btn" onClick={() => setShowModal(true)} style={{
            padding:'9px 18px', borderRadius:9,
            background:'linear-gradient(135deg,#EA580C,#C2410C)',
            border:'none', color:'white', fontSize:12, fontWeight:700,
            boxShadow:'0 3px 10px rgba(234,88,12,.4)',
          }}>
            ✉ Request Review
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6 }}>
        {[
          { key:'all',       label:`All (${feedback.length})` },
          { key:'unreplied', label:`Unreplied (${unreplied})` },
          { key:'negative',  label:`Negative (${feedback.filter(f => f.rating <= 2).length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding:'5px 14px', borderRadius:7, fontSize:12, fontWeight:600,
            cursor:'pointer', border:'1px solid',
            background:  filter === f.key ? '#FFF7ED' : '#F9FAFB',
            color:       filter === f.key ? '#EA580C'  : COLORS.muted,
            borderColor: filter === f.key ? '#EA580C'  : COLORS.border,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16 }}>

        {/* Stats sidebar */}
        <div style={{
          background: COLORS.white, borderRadius:14, border:`1px solid ${COLORS.border}`,
          padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.05)',
          textAlign:'center', height:'fit-content',
        }}>
          <div style={{ fontSize:46, fontWeight:800, color:'#EA580C',
                        fontFamily:FONTS.mono, lineHeight:1 }}>
            {Number(avgRating).toFixed(1)}
          </div>
          <div style={{ fontSize:18, color:'#F59E0B', marginTop:4, letterSpacing:4 }}>
            {'★'.repeat(Math.round(avgRating))}
          </div>
          <div style={{ fontSize:12, color:COLORS.muted, marginTop:4 }}>{total} reviews</div>

          {/* Rating bars */}
          <div style={{ marginTop:16 }}>
            {byRating.map(({ stars, count }) => (
              <div key={stars} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                <span style={{ fontSize:11, fontFamily:FONTS.mono, color:COLORS.muted, width:8 }}>
                  {stars}
                </span>
                <span style={{ fontSize:10, color:'#F59E0B' }}>★</span>
                <div style={{ flex:1, height:5, background:'#F1F5F9', borderRadius:3, overflow:'hidden' }}>
                  <div style={{
                    width: `${total ? (count / total) * 100 : 0}%`,
                    height:'100%', background:'#F59E0B', borderRadius:3,
                  }} />
                </div>
                <span style={{ fontSize:11, fontFamily:FONTS.mono, color:COLORS.muted,
                               width:12, textAlign:'right' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>

          <Divider />

          <div style={{ fontSize:22, fontWeight:800, color:'#16A34A', fontFamily:FONTS.mono }}>
            {recommend}/{total}
          </div>
          <div style={{ fontSize:12, color:COLORS.muted, marginTop:2 }}>would recommend</div>

          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#EA580C', fontFamily:FONTS.mono }}>
              {avgRes}
            </div>
            <div style={{ fontSize:12, color:COLORS.muted, marginTop:2 }}>days avg resolution</div>
          </div>
        </div>

        {/* Feedback cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {loading && (
            <div style={{ textAlign:'center', padding:40, color:COLORS.muted, fontSize:13 }}>
              Loading feedback…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:40, color:COLORS.faint, fontSize:13 }}>
              No feedback found.
            </div>
          )}
          {!loading && filtered.map(fb => (
            <FeedbackCard
              key={fb._id}
              fb={fb}
              onReply={handleReply}
              onFollowUp={handleFollowUp}
            />
          ))}
        </div>
      </div>

      {/* Request Feedback Modal */}
      {showModal && (
        <RequestModal
          customers={customers}
          onClose={() => setShowModal(false)}
          onSent={msg => setToast({ msg })}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default FeedbackPage;