import { useState, useEffect, useCallback } from 'react';
import { noticesApi } from '../services/api';
import { COLORS } from '../constants/tokens';
import { KCard, SectionHdr } from '../components/ui/Cards';

const NOTICE_META = {
  Operational:  { icon: '⚙️',  color: '#64748B', bg: '#F8FAFC' },
  Policy:       { icon: '📋',  color: '#0369A1', bg: '#EFF6FF' },
  Holiday:      { icon: '🎉',  color: '#7C3AED', bg: '#F5F3FF' },
  Training:     { icon: '📚',  color: '#D97706', bg: '#FFFBEB' },
  Achievement:  { icon: '🏆',  color: '#16A34A', bg: '#F0FDF4' },
  General:      { icon: '📢',  color: '#0369A1', bg: '#EFF6FF' },
  HR:           { icon: '👥',  color: '#7C3AED', bg: '#F5F3FF' },
  Finance:      { icon: '💰',  color: '#D97706', bg: '#FFFBEB' },
  Safety:       { icon: '🦺',  color: '#16A34A', bg: '#F0FDF4' },
  Urgent:       { icon: '🚨',  color: '#DC2626', bg: '#FEF2F2' },
};

const PRIORITY_COLOR = {
  low: '#64748B', medium: '#D97706', high: '#EA580C', urgent: '#DC2626', Normal: '#64748B', High: '#DC2626',
};

// ─── NoticeBoardPage ──────────────────────────────────────────────────────────
const NoticeBoardPage = ({ openModal }) => {
  const [notices, setNotices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast,   setToast]     = useState('');

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await noticesApi.list({ limit: 100 });
      setNotices(res?.data || res || []);
    } catch { flash('Failed to load notices.'); }
    finally { setLoading(false); }
  }, []);

  // Reload whenever openModal triggers a save (focus event dispatched by App.jsx)
  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const handlePin = async (notice) => {
    try {
      const updated = await noticesApi.pin(notice._id);
      setNotices(p => p.map(n => n._id === notice._id ? updated : n));
    } catch { flash('Failed to pin.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await noticesApi.remove(id);
      setNotices(p => p.filter(n => n._id !== id));
      flash('Deleted.');
    } catch { flash('Delete failed.'); }
  };

  const pinned  = notices.filter(n => n.isPinned || n.pinned);
  const regular = notices.filter(n => !(n.isPinned || n.pinned));

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1E293B', color: '#fff', padding: '10px 20px', borderRadius: 10, zIndex: 9999, fontSize: 13, fontWeight: 600 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionHdr title="Notice Board" sub={`${notices.length} notices · ${pinned.length} pinned`} />
        <button
          className="btn"
          onClick={() => openModal('new_notice')}
          style={{ padding: '9px 22px', borderRadius: 9, background: 'linear-gradient(135deg,#EA580C,#C2410C)', color: 'white', fontSize: 13, fontWeight: 700, boxShadow: '0 3px 10px #EA580C40', border: 'none', cursor: 'pointer' }}
        >
          + Post Notice
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: COLORS.muted }}>Loading…</div>}

      {/* Pinned */}
      {!loading && pinned.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>📌 Pinned Notices</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {pinned.map(n => {
              const meta = NOTICE_META[n.type || n.category] || NOTICE_META.General;
              return (
                <div key={n._id} style={{ background: meta.bg, borderRadius: 12, border: `1.5px solid ${meta.color}30`, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 12 }}>📌</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: '0 1px 4px rgba(0,0,0,.08)', flexShrink: 0 }}>{meta.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>{n.title}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'white', color: meta.color, border: `1px solid ${meta.color}30` }}>{n.type || n.category}</span>
                        {(n.priority === 'high' || n.priority === 'urgent' || n.priority === 'High') && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#FEF2F2', color: '#DC2626' }}>High Priority</span>
                        )}
                        <span style={{ fontSize: 10, color: COLORS.faint }}>{n.date || new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.7 }}>{n.content}</p>
                  {n.author && <div style={{ marginTop: 8, fontSize: 11, color: COLORS.faint }}>👤 {n.author} · For: {n.target === 'all' ? 'All Staff' : (n.target || 'All')}</div>}
                  <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                    <button className="btn" onClick={() => openModal('new_notice', { id: n._id })} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#F8FAFC', border: `1px solid ${COLORS.border}`, color: COLORS.muted, cursor: 'pointer' }}>Edit</button>
                    <button className="btn" onClick={() => handlePin(n)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#FFF7ED', border: '1px solid #EA580C30', color: '#EA580C', fontWeight: 700, cursor: 'pointer' }}>Unpin</button>
                    <button className="btn" onClick={() => handleDelete(n._id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#FEF2F2', border: '1px solid #DC262630', color: '#DC2626', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Notices */}
      {!loading && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>All Notices</div>
          {regular.length === 0 && !loading && (
            <div style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', padding: 30, background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
              No notices yet. Click <strong>+ Post Notice</strong> to add one.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {regular.map(n => {
              const meta = NOTICE_META[n.type || n.category] || NOTICE_META.General;
              return (
                <div key={n._id} style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.04)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{n.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: meta.bg, color: meta.color }}>{n.type || n.category}</span>
                      {n.priority && n.priority !== 'low' && n.priority !== 'Normal' && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: '#F8FAFC', color: PRIORITY_COLOR[n.priority] || COLORS.muted, fontWeight: 600 }}>{n.priority}</span>
                      )}
                      <span style={{ fontSize: 10, color: COLORS.faint }}>{n.date || new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>{(n.content || '').slice(0, 140)}{(n.content || '').length > 140 ? '…' : ''}</p>
                    {n.author && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 11, color: COLORS.faint }}>👤 {n.author} · For: {n.target === 'all' ? 'All' : 'Technicians'}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button className="btn" onClick={() => openModal('new_notice', { id: n._id })} style={{ padding: '5px 10px', borderRadius: 7, background: '#F8FAFC', border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 11, cursor: 'pointer' }}>Edit</button>
                    <button className="btn" onClick={() => handlePin(n)} style={{ padding: '5px 10px', borderRadius: 7, background: '#FFF7ED', border: '1px solid #EA580C30', color: '#EA580C', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Pin</button>
                    <button className="btn" onClick={() => handleDelete(n._id)} style={{ padding: '5px 10px', borderRadius: 7, background: '#FEF2F2', border: '1px solid #DC262630', color: '#DC2626', fontSize: 11, cursor: 'pointer' }}>Del</button>
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

export default NoticeBoardPage;