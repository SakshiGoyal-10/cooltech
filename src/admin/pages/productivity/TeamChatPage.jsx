import { useState, useEffect, useRef } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { Avatar } from '../../components/ui/Badges';
import { chatApi, techsApi } from '../../services/api';
// import { TECHNICIANS } from '../../data/mockData';

const TeamChatPage = () => {
  const [channels, setChannels]           = useState([]);
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages]           = useState([]);
  const [draft, setDraft]                 = useState('');
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [sending, setSending]             = useState(false);
  const [error, setError]                 = useState('');
  const bottomRef = useRef(null);
  const [technicians, setTechnicians] = useState([]);
  const [deleteModal, setDeleteModal] = useState(null); 
const [deleting, setDeleting]       = useState(false);
const [msgDeleteModal, setMsgDeleteModal] = useState(null); // holds message to delete
const [deletingMsg, setDeletingMsg]       = useState(false);

  // ── fetch channels on mount ───────────────────────────────────────────────
  useEffect(() => {
    chatApi.getChannels()
      .then(res => { if (res.success) setChannels(res.data); })
      .catch(() => setError('Could not load channels.'));
  }, []);

  // ── fetch messages when active channel changes ────────────────────────────
  useEffect(() => {
    if (!activeChannel) return;
    setLoadingMsgs(true);
    setError('');

    chatApi.getMessages(activeChannel)
      .then(res => {
        //  console.log('channels response:', res);
        if (res.success) setMessages(res.data.messages || []);
      })
      .catch(() => setError('Could not load messages.'))
      .finally(() => setLoadingMsgs(false));

    // clear unread badge for this channel
    chatApi.clearUnread(activeChannel)
      .then(res => {
        if (res.success) {
          setChannels(prev =>
            prev.map(ch => ch.id === activeChannel ? { ...ch, unread: 0 } : ch)
          );
        }
      })
      .catch(() => {}); // non-critical, ignore
  }, [activeChannel]);

  // ── auto scroll to latest message ────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── fetch technicians on mount ────────────────────────────────────────────
useEffect(() => {
  techsApi.list()
    .then(res => {
      // your backend returns { data: [...] } or { success, data }
      // console.log('techs response:', res);
      const list = res.data || res;
      setTechnicians(Array.isArray(list) ? list : []);
    })
    .catch(() => setError('Could not load technicians.'));
}, []);

useEffect(() => {
  const fetchTechs = () => {
    techsApi.list()
      .then(res => {
        const list = res.data || res;
        setTechnicians(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  };

  fetchTechs(); // initial fetch

  const interval = setInterval(fetchTechs, 30000); // refresh every 30 seconds
  return () => clearInterval(interval); // cleanup on unmount
}, []);

  // ── send message ──────────────────────────────────────────────────────────
  const sendMsg = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError('');

    const tempId = `temp-${Date.now()}`;
    const text   = draft.trim();

    // optimistic update
    setMessages(prev => [...prev, {
      id: tempId, from: 'Admin', msg: text,
      self: true, time: new Date().toISOString(),
    }]);
    setDraft('');

    try {
      const res = await chatApi.sendMessage({
        channel: activeChannel,
        from:    'Admin',
        msg:     text,
        self:    true,
      });

      if (res.success) {
        // replace temp message with real DB message
        setMessages(prev =>
          prev.map(m => m.id === tempId ? { ...res.data, id: res.data.id } : m)
        );
      } else {
        // rollback
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setError('Failed to send. Try again.');
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setError('Network error. Message not sent.');
    } finally {
      setSending(false);
    }
  };

  const switchChannel = (id) => {
    if (id === activeChannel) return;
    setMessages([]);
    setError('');
    setActiveChannel(id);
  };

  const openDM = async (techName) => {
  try {
    const res = await chatApi.getOrCreateDM(techName);
    if (res.success) {
      const ch = res.data;
      // add to channels list if not already there
      setChannels(prev =>
        prev.find(c => c.id === ch.id) ? prev : [...prev, ch]
      );
      switchChannel(ch.id);
    }
  } catch {
    setError('Could not open DM.');
  }
};

  const formatTime = (time) => {
    if (!time) return '';
    const d = new Date(time);
    return isNaN(d) ? time : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeChannelData = channels.find(c => c.id === activeChannel);

  const handleDeleteChannel = (ch) => {
  setDeleteModal(ch); // open confirm modal
};

const confirmDeleteChannel = async () => {
  if (!deleteModal || deleting) return;
  setDeleting(true);
  try {
    const res = await chatApi.deleteChannel(deleteModal.id);
    if (res.success) {
      // remove from sidebar
      setChannels(prev => prev.filter(c => c.id !== deleteModal.id));
      // if currently viewing deleted channel, go to general
      if (activeChannel === deleteModal.id) {
        setMessages([]);
        setActiveChannel(channels.find(c => c.id !== deleteModal.id)?.id || '');
      }
      setDeleteModal(null);
    } else {
      setError('Failed to delete channel.');
    }
  } catch {
    setError('Network error.');
  } finally {
    setDeleting(false);
  }
};

const confirmDeleteMessage = async () => {
  if (!msgDeleteModal || deletingMsg) return;
  setDeletingMsg(true);
  try {
    const res = await chatApi.deleteMessage(msgDeleteModal.id);
    if (res.success) {
      // remove from local messages list instantly
      setMessages(prev => prev.filter(m => m.id !== msgDeleteModal.id));
      setMsgDeleteModal(null);
    } else {
      setError('Failed to delete message.');
    }
  } catch {
    setError('Network error. Could not delete message.');
  } finally {
    setDeletingMsg(false);
  }
};

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 106px)', gap: 0,
      background: COLORS.white, borderRadius: 16,
      border: `1px solid ${COLORS.border}`, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 220, background: '#1A1A2E', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid #2A2A4A' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC' }}>Team Chat</div>
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Internal Messaging</div>
        </div>

        <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto' }}>
          {/* Channels */}
          <div style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: 1.2, padding: '8px 8px 4px' }}>
            CHANNELS
          </div>
          {channels.length === 0
            ? <div style={{ fontSize: 11, color: '#475569', padding: '6px 10px' }}>Loading…</div>
            : channels.map(ch => (
  <div
    key={ch.id || ch._id}
    style={{ position: 'relative' }}
    onMouseEnter={e => e.currentTarget.querySelector('.del-btn').style.opacity = 1}
    onMouseLeave={e => e.currentTarget.querySelector('.del-btn').style.opacity = 0}
  >
    <button
      onClick={() => switchChannel(ch.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '8px 9px', borderRadius: 7, marginBottom: 2,
        background: activeChannel === ch.id ? `${COLORS.brand}18` : 'transparent',
        border: `1px solid ${activeChannel === ch.id ? COLORS.brand + '40' : 'transparent'}`,
        color: activeChannel === ch.id ? '#FDBA74' : '#64748B',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 12 }}>{ch.icon}</span>
      <span style={{ fontSize: 12, fontWeight: activeChannel === ch.id ? 700 : 400, flex: 1 }}>
        {ch.label}
      </span>
      {ch.unread > 0 && (
        <span style={{
          minWidth: 16, height: 16, borderRadius: 99,
          background: '#EF4444', color: 'white',
          fontSize: 9, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
        }}>
          {ch.unread}
        </span>
      )}
    </button>

    {/* ── delete button — appears on hover ── */}
    <button
      className="del-btn"
      onClick={(e) => { e.stopPropagation(); handleDeleteChannel(ch); }}
      style={{
        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
        background: '#EF444420', border: 'none', borderRadius: 4,
        color: '#EF4444', fontSize: 10, cursor: 'pointer',
        padding: '2px 5px', opacity: 0,
        transition: 'opacity 0.15s',
      }}
      title="Delete channel"
    >
      ✕
    </button>
  </div>
))
          }

          {/* Direct / Technicians */}
          {/* Direct / Technicians */}
<div style={{
  fontSize: 9, fontWeight: 700, color: '#334155',
  letterSpacing: 1.2, padding: '12px 8px 4px'
}}>
  DIRECT
</div>

{(technicians || []).map(t => { 
  const dmId = `dm_${t.name.toLowerCase().replace(/\s+/g, '_')}`;
  const isActive = activeChannel === dmId;

  return (
    <button
      key={t._id || t.id || t.name}
      onClick={() => openDM(t.name)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 9px', borderRadius: 7, marginBottom: 2,
        background: isActive ? `${COLORS.brand}18` : 'transparent',
        border: `1px solid ${isActive ? COLORS.brand + '40' : 'transparent'}`,
        color: isActive ? '#FDBA74' : '#64748B',
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: t.status === 'available' ? '#22C55E'
                  : t.status === 'busy'      ? '#F59E0B'
                  : '#64748B',
      }} />
      <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 400, flex: 1 }}>
        {t.name.split(' ')[0]}
      </span>
      {/* show unread if DM channel exists in state */}
      {channels.find(c => c.id === dmId)?.unread > 0 && (
        <span style={{
          minWidth: 16, height: 16, borderRadius: 99,
          background: '#EF4444', color: 'white',
          fontSize: 9, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
        }}>
          {channels.find(c => c.id === dmId).unread}
        </span>
      )}
    </button>
  );
})}
        </nav>
      </div>

      {/* ── Chat Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>

        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.white, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>{activeChannelData?.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>
              {activeChannelData?.label || '…'}
            </div>
            <div style={{ fontSize: 11, color: COLORS.faint }}>
              {loadingMsgs ? 'Loading…' : `${messages.length} messages`}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#FEF2F2', color: '#DC2626', fontSize: 12,
            padding: '8px 18px', borderBottom: `1px solid #FECACA`,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 18px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {loadingMsgs
            ? <div style={{ textAlign: 'center', color: COLORS.faint, fontSize: 13, marginTop: 40 }}>
                Loading messages…
              </div>
            : messages.length === 0
              ? <div style={{ textAlign: 'center', color: COLORS.faint, fontSize: 13, marginTop: 40 }}>
                  No messages yet. Say something! 👋
                </div>
              : messages.map(m => (
  <div
    key={m.id}
    style={{ display: 'flex', gap: 9, flexDirection: m.self ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative' }}
    onMouseEnter={e => {
      const btn = e.currentTarget.querySelector('.msg-del-btn');
      if (btn) btn.style.opacity = 1;
    }}
    onMouseLeave={e => {
      const btn = e.currentTarget.querySelector('.msg-del-btn');
      if (btn) btn.style.opacity = 0;
    }}
  >
    <Avatar name={m.from} size={30} color={m.self ? COLORS.brand : '#64748B'} />

    <div style={{ maxWidth: '65%', position: 'relative' }}>
      {!m.self && (
        <div style={{ fontSize: 10, color: COLORS.faint, marginBottom: 3, marginLeft: 4 }}>
          {m.from}
        </div>
      )}

      <div style={{
        background: m.self
          ? `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`
          : '#fff',
        color: m.self ? 'white' : COLORS.h2,
        padding: '9px 13px',
        borderRadius: m.self ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
        fontSize: 13, lineHeight: 1.5,
        border: m.self ? 'none' : `1px solid ${COLORS.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        opacity: m.id?.startsWith('temp-') ? 0.6 : 1,
      }}>
        {m.msg}
      </div>

      <div style={{
        fontSize: 10, color: COLORS.faint, marginTop: 3,
        textAlign: m.self ? 'right' : 'left',
      }}>
        {m.id?.startsWith('temp-') ? 'Sending…' : formatTime(m.time)}
      </div>
    </div>

    {/* ── delete button — shows on hover, only for non-temp messages ── */}
    {!m.id?.startsWith('temp-') && (
      <button
        className="msg-del-btn"
        onClick={() => setMsgDeleteModal(m)}
        title="Delete message"
        style={{
          opacity: 0,
          transition: 'opacity 0.15s',
          alignSelf: 'center',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 6,
          color: '#EF4444',
          fontSize: 11,
          cursor: 'pointer',
          padding: '4px 8px',
          flexShrink: 0,
        }}
      >
        🗑
      </button>
    )}
  </div>
))
          }
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px', borderTop: `1px solid ${COLORS.border}`,
          background: COLORS.white, display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
            placeholder="Type a message… (Enter to send)"
            disabled={sending}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10,
              border: `1px solid ${COLORS.border}`, fontSize: 13,
              fontFamily: FONTS.sans, color: COLORS.h2, background: COLORS.bg,
              opacity: sending ? 0.7 : 1,
            }}
          />
          <button
            onClick={sendMsg}
            disabled={sending || !draft.trim()}
            style={{
              padding: '10px 18px', borderRadius: 10,
              background: sending || !draft.trim()
                ? '#CBD5E1'
                : `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
              color: 'white', fontSize: 13, fontWeight: 700,
              border: 'none', cursor: sending || !draft.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
      
      {/* ── Delete Channel Confirm Modal ── */}
{deleteModal && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  }}>
    <div style={{
      background: 'white', borderRadius: 14, padding: '28px 32px',
      width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    }}>
      {/* icon */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: '#FEF2F2', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 22, margin: '0 auto 16px',
      }}>
        🗑️
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
          Delete Channel?
        </div>
        <div style={{ fontSize: 13, color: '#64748B' }}>
          Are you sure you want to delete{' '}
          <strong>{deleteModal.icon} {deleteModal.label}</strong>?
          All messages in this channel will be inaccessible.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => setDeleteModal(null)}
          disabled={deleting}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: '1px solid #E2E8F0', background: 'white',
            color: '#475569', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={confirmDeleteChannel}
          disabled={deleting}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: 'none', background: deleting ? '#FCA5A5' : '#EF4444',
            color: 'white', fontSize: 13, fontWeight: 700,
            cursor: deleting ? 'not-allowed' : 'pointer',
          }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
)}

{/* ── Delete Message Confirm Modal ── */}
{msgDeleteModal && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  }}>
    <div style={{
      background: 'white', borderRadius: 14, padding: '28px 32px',
      width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    }}>
      {/* icon */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: '#FEF2F2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, margin: '0 auto 16px',
      }}>
        🗑️
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
          Delete Message?
        </div>

        {/* preview of message being deleted */}
        <div style={{
          background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 13, color: '#475569', textAlign: 'left',
          marginBottom: 8, lineHeight: 1.5,
        }}>
          <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
            {msgDeleteModal.from}
          </span>
          {msgDeleteModal.msg.length > 100
            ? msgDeleteModal.msg.slice(0, 100) + '…'
            : msgDeleteModal.msg
          }
        </div>

        <div style={{ fontSize: 12, color: '#94A3B8' }}>
          This message will be moved to Recently Deleted.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => setMsgDeleteModal(null)}
          disabled={deletingMsg}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: '1px solid #E2E8F0', background: 'white',
            color: '#475569', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={confirmDeleteMessage}
          disabled={deletingMsg}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: 'none',
            background: deletingMsg ? '#FCA5A5' : '#EF4444',
            color: 'white', fontSize: 13, fontWeight: 700,
            cursor: deletingMsg ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {deletingMsg ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default TeamChatPage;