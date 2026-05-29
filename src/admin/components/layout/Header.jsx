import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../../constants/tokens';

// ─── Notification Dropdown ────────────────────────────────────────────────────
const NotifDropdown = ({ notifs, onMarkRead, onMarkAllRead, onViewAll, onClose }) => {
  const unread = notifs.filter(n => !n.read);
  const preview = notifs.slice(0, 5);

  return (
    <>
      {/* backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 8999 }}
        onClick={onClose}
      />
      <div
        className="notif-dropdown"
      >
        {/* ── Header ── */}
        <div style={{
          padding: '12px 16px',
          background: '#F9FAFB',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.faint, fontWeight: 700, letterSpacing: '0.05em' }}>
              NOTIFICATIONS
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginTop: 2 }}>
              {unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {unread.length > 0 && (
              <button
                onClick={() => { onMarkAllRead(); }}
                style={{
                  fontSize: 11, fontWeight: 600, color: COLORS.brand,
                  background: `${COLORS.brand}12`, border: 'none', cursor: 'pointer',
                  padding: '4px 10px', borderRadius: 7,
                }}
              >
                ✓ Mark all read
              </button>
            )}
            {/* Close button — visible on mobile */}
            <button
              onClick={onClose}
              className="notif-close-btn"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Notification Items ── */}
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {preview.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: COLORS.faint, fontSize: 12 }}>
              No notifications
            </div>
          ) : (
            preview.map(n => (
              <NotifItem key={n.id} n={n} onMarkRead={onMarkRead} onViewAll={onViewAll} onClose={onClose} />
            ))
          )}
        </div>

        {/* ── Footer: View All ── */}
        <div style={{
          borderTop: `1px solid ${COLORS.border}`,
          background: '#F9FAFB',
        }}>
          <button
            onClick={() => { onViewAll(); onClose(); }}
            style={{
              width: '100%', padding: '11px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 13, fontWeight: 700, color: COLORS.brand,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              transition: 'background .1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${COLORS.brand}10`; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            View all notifications
            <span style={{ fontSize: 14 }}>→</span>
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Single Notification Item ─────────────────────────────────────────────────
const NOTIF_COLORS = {
  urgent:   { bg: '#FEF2F2', color: '#DC2626' },
  invoice:  { bg: '#FFFBEB', color: '#D97706' },
  ticket:   { bg: '#EFF6FF', color: '#2563EB' },
  salary:   { bg: '#F0FDF4', color: '#16A34A' },
  schedule: { bg: '#F5F3FF', color: '#7C3AED' },
  default:  { bg: '#F9FAFB', color: '#64748B' },
};

const NotifItem = ({ n, onMarkRead, onViewAll, onClose }) => {
  const cfg = NOTIF_COLORS[n.type] || NOTIF_COLORS.default;

  return (
    <div
      onClick={() => { onMarkRead(n.id); onViewAll(); onClose(); }}
      style={{
        padding: '11px 16px',
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex', gap: 11, alignItems: 'flex-start',
        cursor: 'pointer',
        background: n.read ? COLORS.white : '#FFFBF5',
        transition: 'background .12s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
      onMouseLeave={e => { e.currentTarget.style.background = n.read ? COLORS.white : '#FFFBF5'; }}
    >
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: cfg.bg, border: `1.5px solid ${cfg.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15,
      }}>
        {n.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: n.read ? 600 : 800, color: COLORS.h1, lineHeight: 1.35, marginBottom: 2 }}>
          {n.title}
        </div>
        <div style={{
          fontSize: 11, color: COLORS.muted, lineHeight: 1.4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {n.body}
        </div>
        <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 4 }}>{n.time}</div>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: COLORS.brand, flexShrink: 0, marginTop: 4,
        }} />
      )}
    </div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({
  page, openJob, TITLES, time,
  clockProps, urgentCount, overdueInv, openComps,
  setPage, setSidebarOpen,
  notifs = [], setNotifs,
}) => {

  const notifCount = notifs.filter(n => !n.read).length;

  const { clockStatus, clockInTime, setClockStatus, setClockInTime,
    setTotalBreakSecs, setClockSessions, setBreakStartTime } = clockProps || {};

  const [clockDropOpen, setClockDropOpen] = useState(false);
  const [notifDropOpen, setNotifDropOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (clockInTime) setElapsed(Math.floor((Date.now() - clockInTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [clockInTime]);

  const fmtTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map(x => String(x).padStart(2, '0')).join(':');
  };

  const doClockIn = () => {
    setClockInTime(new Date());
    setClockStatus('in');
    setTotalBreakSecs(0);
    setElapsed(0);
    setClockDropOpen(false);
  };

  const doBreak = () => {
    setBreakStartTime(new Date());
    setClockStatus('break');
    setClockDropOpen(false);
  };

  const doClockOut = () => {
    const t = new Date();
    const inStr = clockInTime
      ? clockInTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : '—';
    const outStr = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (setClockSessions) {
      setClockSessions(prev => [{
        id: `CS-${Date.now()}`, date: 'Mar 3, 2026', day: 'Today', user: 'Admin',
        inTime: inStr, outTime: outStr, breakMins: 0,
        workedMins: Math.floor(elapsed / 60), status: 'complete',
      }, ...prev]);
    }
    setClockStatus('out');
    setClockInTime(null);
    setTotalBreakSecs(0);
    setElapsed(0);
    setClockDropOpen(false);
  };

  const markAllRead = () => setNotifs?.(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifs?.(prev =>
    id !== undefined
      ? prev.map(n => n.id === id ? { ...n, read: true } : n)
      : prev.map(n => ({ ...n, read: true }))
  );

  // Clock button appearance
  const clockBg = {
    in:    { bg: '#ECFDF5', color: '#16A34A', label: 'Clocked In' },
    break: { bg: '#FFFBEB', color: '#D97706', label: 'On Break' },
    out:   { bg: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: '#fff', label: 'Clock In' },
  }[clockStatus || 'out'];

  return (
    <header className="header">

      {/* ── Left: breadcrumb ────────────────────────────────────── */}
      <div className="header-left">
        {/* Mobile-only hamburger to open sidebar */}
        <button
          className="header-hamburger-btn"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Open sidebar"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
        <div className="breadcrumb">
          <span className="breadcrumb-root">CoolTech</span>
          <span className="breadcrumb-sep breadcrumb-root">›</span>
          <span className="breadcrumb-page">{TITLES[page]}</span>
          {openJob && (
            <>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-job">{openJob}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Right: actions ──────────────────────────────────────── */}
      <div className="header-right">

        {/* Live clock */}
        <div className="clock-display">
          {time.toLocaleTimeString('en-IN', { hour12: true })}
        </div>

        {/* ── Clock In/Out button ── */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn"
            style={{
              padding: '5px 13px', borderRadius: 9,
              background: clockBg.bg, color: clockBg.color,
              fontSize: 12, fontWeight: 700, border: 'none', gap: 7,
              boxShadow: clockStatus === 'out' ? `0 3px 10px ${COLORS.brand}40` : 'none',
            }}
            onClick={() => { setClockDropOpen(o => !o); setNotifDropOpen(false); }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: clockStatus === 'out' ? '#fff' : clockBg.color,
              display: 'block', flexShrink: 0,
              animation: clockStatus === 'in' ? 'blink 1.6s ease-in-out infinite' : 'none',
            }} />
            {clockBg.label}
            {clockStatus === 'in' && (
              <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, background: '#DCFCE7', color: '#15803D', padding: '2px 7px', borderRadius: 6 }}>
                {fmtTime(elapsed)}
              </span>
            )}
          </button>

          {clockDropOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 8999 }} onClick={() => setClockDropOpen(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 9000,
                background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`,
                boxShadow: '0 8px 32px rgba(0,0,0,.15)', minWidth: 210, overflow: 'hidden',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                <div style={{ padding: '11px 15px', background: '#F9FAFB', borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 10, color: COLORS.faint, fontWeight: 700 }}>ADMIN — TODAY</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginTop: 2 }}>
                    {clockStatus === 'out' ? 'Not clocked in yet'
                      : `Since ${clockInTime?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`}
                  </div>
                </div>
                <div style={{ padding: 8 }}>
                  {clockStatus === 'out' && (
                    <ClockDropBtn icon="▶" label="Clock In"     color="#16A34A" bg="#ECFDF5" onClick={doClockIn} />
                  )}
                  {clockStatus === 'in' && (
                    <>
                      <ClockDropBtn icon="⏸" label="Start Break"  color="#D97706" bg="#FFFBEB" onClick={doBreak} />
                      <ClockDropBtn icon="⏹" label="Clock Out"    color="#DC2626" bg="#FEF2F2" onClick={doClockOut} />
                    </>
                  )}
                  {clockStatus === 'break' && (
                    <>
                      <ClockDropBtn icon="▶" label="Resume Work"  color="#16A34A" bg="#ECFDF5" onClick={() => { setClockStatus('in'); setClockDropOpen(false); }} />
                      <ClockDropBtn icon="⏹" label="Clock Out"    color="#DC2626" bg="#FEF2F2" onClick={doClockOut} />
                    </>
                  )}
                  <div style={{ height: 1, background: COLORS.border, margin: '4px 0' }} />
                  <ClockDropBtn icon="⏱" label="View Attendance" color={COLORS.brand} bg={COLORS.brandL} onClick={() => { setPage('clock'); setClockDropOpen(false); }} />
                </div>
                {clockStatus === 'in' && (
                  <div style={{ padding: '9px 15px', borderTop: `1px solid ${COLORS.border}`, background: '#F9FAFB', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: COLORS.muted }}>Work time</span>
                    <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fontWeight: 700, color: '#16A34A' }}>{fmtTime(elapsed)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Live badge */}
        <div className="live-badge">
          <span className="live-dot animate-blink" />
          <span className="live-text">Live</span>
        </div>

        {/* ── Notifications bell + dropdown ── */}
        <div style={{ position: 'relative' }} className="notif-wrapper">
          <button
            className="btn-icon"
            onClick={() => { setNotifDropOpen(o => !o); setClockDropOpen(false); }}
          >
            🔔
          </button>
          {notifCount > 0 && (
            <div className="notif-count">{notifCount}</div>
          )}

          {notifDropOpen && (
            <NotifDropdown
              notifs={notifs}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onViewAll={() => setPage('notifications')}
              onClose={() => setNotifDropOpen(false)}
            />
          )}
        </div>

        {/* Settings */}
        <button className="btn-icon" onClick={() => setPage('settings')}>⚙</button>

        {/* Logout */}
        <button className="btn-logout" onClick={() => setPage('logout')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span style={{ display: 'none' }}>Logout</span>
          <span className="breadcrumb-root" style={{ display: 'initial' }}>Logout</span>
        </button>
      </div>
    </header>
  );
};

// ─── Clock Dropdown Button ────────────────────────────────────────────────────
const ClockDropBtn = ({ icon, label, color, bg, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 11px', borderRadius: 8, border: 'none', cursor: 'pointer',
      background: 'transparent', textAlign: 'left', fontFamily: 'Plus Jakarta Sans, sans-serif',
      marginBottom: 2, transition: 'background .1s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = bg; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    <span style={{ fontSize: 12, color }}>{icon}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
  </button>
);

export default Header;