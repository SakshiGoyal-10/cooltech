// ClockInOutPage.jsx  ── fully wired to backend CRUD
import { useState, useEffect, useCallback } from "react";
import { COLORS, FONTS } from "../../constants/tokens";
import { SectionHdr } from "../ui/Cards";
import { Thead } from "../ui/Cards";
import { Avatar } from "../ui/Badges";
import * as api from "../../services/attendanceService";

// ─── Clock Helpers ────────────────────────────────────────────────────────────
function fmtClockDur(totalSecs) {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(x => String(x).padStart(2, "0")).join(":");
}
function fmtClockMins(mins) {
  if (!mins && mins !== 0) return "—";
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function toLocStr(dateVal) {
  if (!dateVal) return "—";
  return new Date(dateVal).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Big action button ────────────────────────────────────────────────────────
const ClockBigBtn = ({ label, icon, grad, shadow, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "12px 24px", borderRadius: 11, border: "none", cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "#94A3B8" : grad,
      color: "white", fontSize: 14, fontWeight: 700, fontFamily: FONTS.sans,
      boxShadow: `0 4px 14px ${shadow}40`, opacity: disabled ? .6 : 1,
    }}
  >
    <span>{icon}</span>{label}
  </button>
);

// ─── Inline spinner ───────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      border: `3px solid ${COLORS.border}`,
      borderTopColor: COLORS.brand,
      animation: "spin 0.7s linear infinite",
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ─── Edit Session Modal ───────────────────────────────────────────────────────
const EditModal = ({ session, onClose, onSave }) => {
  const [form, setForm] = useState({
    clockInTime:  session.clockInTime  ? new Date(session.clockInTime).toISOString().slice(0,16)  : "",
    clockOutTime: session.clockOutTime ? new Date(session.clockOutTime).toISOString().slice(0,16) : "",
    notes:        session.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(session._id, {
        clockInTime:  form.clockInTime  ? new Date(form.clockInTime)  : undefined,
        clockOutTime: form.clockOutTime ? new Date(form.clockOutTime) : undefined,
        notes:        form.notes,
      });
      onClose();
    } catch (e) {
      alert("Save failed: " + (e.error || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = "datetime-local") => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 5 }}>{label}</div>
      <input
        type={type} value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, boxSizing: "border-box" }}
      />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: "26px 28px", width: 420, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.h1, marginBottom: 18 }}>✏️ Edit Session</div>
        {field("Clock In Time",  "clockInTime")}
        {field("Clock Out Time", "clockOutTime")}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 5 }}>Notes</div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, resize: "vertical", boxSizing: "border-box" }}/>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 9, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.muted, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ session, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(session._id);
      onClose();
    } catch (e) {
      alert("Delete failed: " + (e.error || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  const inTime  = session.clockInTime  ? new Date(session.clockInTime).toLocaleString("en-IN",  { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
  const outTime = session.clockOutTime ? new Date(session.clockOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: "26px 28px", width: 420, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🗑️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.h1 }}>Delete Session?</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>This will move the session to Recently Deleted.</div>
          </div>
        </div>

        {/* Session summary card */}
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["📅 Date",      session.date || "—"],
              ["🕘 Clock In",  inTime],
              ["🕔 Clock Out", outTime],
              ["⏱ Worked",    session.workedMins ? fmtClockMins(session.workedMins) : "—"],
              ["⚡ Overtime",  session.otMins > 0 ? fmtClockMins(session.otMins) : "None"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: COLORS.muted }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning note */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
          <span style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
            You can recover this session later from the <strong>Recently Deleted</strong> page.
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: 10, borderRadius: 9, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.muted, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: "linear-gradient(135deg,#EF4444,#DC2626)", color: "white", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", fontSize: 13, opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const ClockInOutPage = ({ currentUserId = "USER_ID_HERE" }) => {
  // ── Live clock state (derived from active session) ──
  const [activeSession, setActiveSession] = useState(null);
  const [elapsed,       setElapsed]       = useState(0);
  const [brkElapsed,    setBrkElapsed]    = useState(0);
  const [now,           setNow]           = useState(new Date());

  // ── Page state ──
  const [tab,         setTab]        = useState("today");
  const [sessions,    setSessions]   = useState([]);
  const [teamStatus,  setTeamStatus] = useState([]);
  const [reports,     setReports]    = useState(null);
  const [settings,    setSettings]   = useState(null);
  const [loading,     setLoading]    = useState(false);
  const [actionBusy,  setActionBusy] = useState(false);
  const [editTarget,  setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Alert state ──
  const [otDismissed,   setOtDismissed]   = useState(false);
  const [lateDismissed, setLateDismissed] = useState(false);

  // ── Settings local form ──
  const [localSettings, setLocalSettings] = useState(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [newIP,         setNewIP]         = useState("");

  // ── Derived ──
  const clockStatus = activeSession
    ? activeSession.status === "on_break" ? "break" : "in"
    : "out";

  const allBreakSecs = activeSession
    ? activeSession.totalBreakSecs + (clockStatus === "break" ? brkElapsed : 0)
    : 0;
  const netSecs = Math.max(0, elapsed - allBreakSecs);

  const otThresholdH   = settings?.otThresholdH   ?? 9;
  const weeklyTargetH  = settings?.weeklyTargetH  ?? 45;
  const breakLimitMins = settings?.breakLimitMins ?? 60;
  const shiftStart     = settings?.shiftStart     ?? "09:00";
  const [shH, shM]     = shiftStart.split(":").map(Number);
  const ipEnabled      = settings?.ipEnabled ?? false;
  const allowedIPs     = settings?.allowedIPs ?? [];
  const MOCK_IP        = "192.168.1.100";

  const isOvertime    = clockStatus === "in" && netSecs > otThresholdH * 3600 && !otDismissed;
  const isLate        = activeSession &&
    (new Date(activeSession.clockInTime).getHours() * 60 +
     new Date(activeSession.clockInTime).getMinutes()) > (shH * 60 + shM + 5) && !lateDismissed;
  const isBreachBreak = allBreakSecs > breakLimitMins * 60 && clockStatus !== "out";
  const ipBlocked     = ipEnabled && !allowedIPs.includes(MOCK_IP);

  const weekMins = sessions
    .filter(s => s.status === "complete")
    .reduce((a, s) => a + (s.workedMins || 0), 0) +
    (clockStatus !== "out" ? Math.floor(netSecs / 60) : 0);

  // ── Load active session on mount ──
  const loadActive = useCallback(async () => {
    try {
      const { session } = await api.getActiveSession(currentUserId);
      setActiveSession(session || null);
      if (!session) { setElapsed(0); setBrkElapsed(0); }
    } catch (_) {}
  }, [currentUserId]);

  const loadSettings = useCallback(async () => {
    try {
      const { settings: s } = await api.getSettings();
      setSettings(s);
      setLocalSettings(s);
    } catch (_) {}
  }, []);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { sessions: s } = await api.getSessions({ userId: currentUserId });
      setSessions(s);
    } catch (_) {} finally { setLoading(false); }
  }, [currentUserId]);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const { sessions: s } = await api.getTeamStatus();
      setTeamStatus(s);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getReports({ userId: currentUserId });
      setReports(data);
    } catch (_) {} finally { setLoading(false); }
  }, [currentUserId]);

  // Initial load
  useEffect(() => { loadActive(); loadSettings(); }, [loadActive, loadSettings]);

  // Tab-driven lazy loads
  useEffect(() => {
    if (tab === "today" || tab === "history") loadSessions();
    if (tab === "team")    loadTeam();
    if (tab === "reports") loadReports();
  }, [tab]); // eslint-disable-line

  // ── Live timer ──
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      if (activeSession) {
        const inTime = new Date(activeSession.clockInTime);
        setElapsed(Math.floor((Date.now() - inTime.getTime()) / 1000));
        if (clockStatus === "break") {
          const lastBrk = activeSession.breaks?.[activeSession.breaks.length - 1];
          if (lastBrk && !lastBrk.endTime) {
            setBrkElapsed(Math.floor((Date.now() - new Date(lastBrk.startTime).getTime()) / 1000));
          }
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [activeSession, clockStatus]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const doClockIn = async () => {
    if (ipBlocked) return alert(`⛔ Your IP (${MOCK_IP}) is not allowed.`);
    setActionBusy(true);
    try {
      const { session } = await api.clockIn(currentUserId, MOCK_IP);
      setActiveSession(session);
      setElapsed(0); setBrkElapsed(0);
      setOtDismissed(false); setLateDismissed(false);
      await loadSessions();
    } catch (e) { alert(e.error || "Clock in failed"); }
    finally { setActionBusy(false); }
  };

  const doBreakStart = async () => {
    setActionBusy(true);
    try {
      const { session } = await api.breakStart(currentUserId);
      setActiveSession(session); setBrkElapsed(0);
    } catch (e) { alert(e.error || "Break start failed"); }
    finally { setActionBusy(false); }
  };

  const doBreakEnd = async () => {
    setActionBusy(true);
    try {
      const { session } = await api.breakEnd(currentUserId);
      setActiveSession(session); setBrkElapsed(0);
    } catch (e) { alert(e.error || "Break end failed"); }
    finally { setActionBusy(false); }
  };

  const doClockOut = async () => {
    setActionBusy(true);
    try {
      await api.clockOut(currentUserId);
      setActiveSession(null); setElapsed(0); setBrkElapsed(0);
      await loadSessions();
    } catch (e) { alert(e.error || "Clock out failed"); }
    finally { setActionBusy(false); }
  };

  // ── Session CRUD ─────────────────────────────────────────────────────────────
  const handleUpdateSession = async (id, updates) => {
    const { session } = await api.updateSession(id, updates);
    setSessions(prev => prev.map(s => s._id === id ? session : s));
  };

  const handleDeleteSession = async (id) => {
    await api.deleteSession(id);
    setSessions(prev => prev.filter(s => s._id !== id));
  };

  // ── Settings save ─────────────────────────────────────────────────────────────
  const saveSettings = async () => {
    try {
      const { settings: s } = await api.updateSettings(localSettings);
      setSettings(s); setLocalSettings(s);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (e) { alert("Save failed: " + (e.error || "Unknown")); }
  };

  const doAddIP = async () => {
    if (!newIP.trim()) return;
    try {
      const { settings: s } = await api.addIP(newIP.trim());
      setSettings(s); setLocalSettings(s); setNewIP("");
    } catch (e) { alert(e.error || "Add IP failed"); }
  };

  const doRemoveIP = async (ip) => {
    try {
      const { settings: s } = await api.removeIP(ip);
      setSettings(s); setLocalSettings(s);
    } catch (e) { alert(e.error || "Remove IP failed"); }
  };

  // ── Style maps ────────────────────────────────────────────────────────────────
  const sColor   = { in: "#16A34A", break: "#D97706", out: COLORS.faint }[clockStatus];
  const sLabel   = { in: "🟢 CLOCKED IN — WORKING", break: "🟡 ON BREAK", out: "⚪ NOT CLOCKED IN" }[clockStatus];
  const cardBg   = { in: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", break: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", out: `linear-gradient(135deg,${COLORS.brandL},#FFE4C4)` }[clockStatus];
  const cardBdr  = { in: "#A7F3D0", break: "#FDE68A", out: `${COLORS.brand}30` }[clockStatus];

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", fontFamily: FONTS.sans }}>
      <SectionHdr title="⏱ Clock In / Out" sub="Track your work hours, breaks, overtime and attendance" />
      <div style={{ height: 16 }} />

      {/* ── Alerts ── */}
      {ipBlocked && (
        <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 12, padding: "12px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⛔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>Clock-In Blocked — IP Not Allowed</div>
            <div style={{ fontSize: 12, color: "#DC2626", marginTop: 2 }}>Your IP <strong>{MOCK_IP}</strong> is not in the allowed list.</div>
          </div>
          <button onClick={() => setTab("settings")} style={{ padding: "6px 14px", borderRadius: 8, background: "#DC2626", color: "white", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Manage IPs →</button>
        </div>
      )}
      {isOvertime && (
        <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 12, padding: "12px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#C2410C" }}>Overtime Alert — {fmtClockDur(netSecs - otThresholdH * 3600)} over daily limit</div>
            <div style={{ fontSize: 12, color: "#EA580C", marginTop: 2 }}>You've worked more than <strong>{otThresholdH}h</strong> today.</div>
          </div>
          <button onClick={() => setOtDismissed(true)} style={{ padding: "6px 14px", borderRadius: 8, background: "#FED7AA", color: "#92400E", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Dismiss</button>
        </div>
      )}
      {isLate && clockStatus === "in" && (
        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "12px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🕐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>Late Arrival Detected</div>
            <div style={{ fontSize: 12, color: "#B45309", marginTop: 2 }}>
              Clocked in at <strong>{toLocStr(activeSession?.clockInTime)}</strong> — shift starts at <strong>{shiftStart}</strong>.
            </div>
          </div>
          <button onClick={() => setLateDismissed(true)} style={{ padding: "6px 14px", borderRadius: 8, background: "#FEF3C7", color: "#92400E", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Dismiss</button>
        </div>
      )}
      {isBreachBreak && (
        <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 12, padding: "12px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>☕</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#C2410C" }}>Break Limit Exceeded</div>
            <div style={{ fontSize: 12, color: "#EA580C", marginTop: 2 }}>Total break <strong>{fmtClockMins(Math.floor(allBreakSecs / 60))}</strong> exceeds {breakLimitMins}m daily limit.</div>
          </div>
        </div>
      )}

      {/* ── Main Clock Card ── */}
      <div style={{ background: cardBg, border: `2px solid ${cardBdr}`, borderRadius: 20, padding: "28px 32px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: sColor, letterSpacing: .5, marginBottom: 8 }}>{sLabel}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 52, fontWeight: 700, letterSpacing: 2, color: clockStatus === "in" ? (netSecs > otThresholdH * 3600 ? "#C2410C" : "#15803D") : clockStatus === "break" ? "#92400E" : COLORS.faint, lineHeight: 1 }}>
            {clockStatus !== "out" ? fmtClockDur(netSecs) : "00:00:00"}
          </div>
          {clockStatus === "in" && netSecs > otThresholdH * 3600 && (
            <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "#FEF3C7", border: "1px solid #FDE68A" }}>
              <span style={{ fontSize: 10 }}>⚡</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E" }}>OT: +{fmtClockDur(netSecs - otThresholdH * 3600)}</span>
            </div>
          )}
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 8 }}>
            {clockStatus !== "out" && activeSession
              ? `Started at ${toLocStr(activeSession.clockInTime)}`
              : now.toLocaleTimeString("en-IN", { hour12: true })}
          </div>
          {clockStatus === "break" && <div style={{ marginTop: 4, fontSize: 12, color: "#B45309" }}>Break time: {fmtClockDur(brkElapsed)}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          {clockStatus === "out"   && <ClockBigBtn label="Clock In"     icon="▶" grad="linear-gradient(135deg,#16A34A,#15803D)" shadow="#16A34A" onClick={doClockIn}    disabled={actionBusy || ipBlocked} />}
          {clockStatus === "in"    && <><ClockBigBtn label="Start Break"  icon="⏸" grad="linear-gradient(135deg,#F59E0B,#D97706)" shadow="#D97706" onClick={doBreakStart} disabled={actionBusy} /><ClockBigBtn label="Clock Out" icon="⏹" grad="linear-gradient(135deg,#EF4444,#DC2626)" shadow="#DC2626" onClick={doClockOut} disabled={actionBusy} /></>}
          {clockStatus === "break" && <><ClockBigBtn label="Resume Work"  icon="▶" grad="linear-gradient(135deg,#16A34A,#15803D)" shadow="#16A34A" onClick={doBreakEnd}  disabled={actionBusy} /><ClockBigBtn label="Clock Out" icon="⏹" grad="linear-gradient(135deg,#EF4444,#DC2626)" shadow="#DC2626" onClick={doClockOut} disabled={actionBusy} /></>}
          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600 }}>Break</div><div style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: isBreachBreak ? "#DC2626" : COLORS.h2 }}>{fmtClockDur(allBreakSecs)}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600 }}>This Week</div><div style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: weekMins > weeklyTargetH * 60 ? "#C2410C" : COLORS.h2 }}>{fmtClockMins(weekMins)}</div></div>
          </div>
        </div>
      </div>

      {/* ── Stat Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Today Worked",  value: clockStatus !== "out" ? fmtClockDur(netSecs) : "—", icon: "⏱", color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Break Taken",   value: fmtClockMins(Math.floor(allBreakSecs / 60)), icon: "☕", color: isBreachBreak ? "#DC2626" : "#D97706", bg: isBreachBreak ? "#FEF2F2" : "#FFFBEB" },
          { label: "Overtime Today",value: netSecs > otThresholdH * 3600 ? fmtClockDur(netSecs - otThresholdH * 3600) : "—", icon: "⚡", color: netSecs > otThresholdH * 3600 ? "#C2410C" : COLORS.faint, bg: netSecs > otThresholdH * 3600 ? "#FFF7ED" : COLORS.bg },
          { label: "Clocked In At", value: activeSession ? toLocStr(activeSession.clockInTime) : "—", icon: "🕘", color: COLORS.brand, bg: COLORS.brandL },
          { label: "This Week",     value: fmtClockMins(weekMins), icon: "📅", color: weekMins > weeklyTargetH * 60 ? "#C2410C" : "#7C3AED", bg: weekMins > weeklyTargetH * 60 ? "#FFF7ED" : "#F5F3FF" },
        ].map(s => (
          <div key={s.label} className="card" style={{ background: COLORS.white, borderRadius: 14, padding: "15px 17px", border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted }}>{s.label}</div>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{s.icon}</div>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 3, marginBottom: 14, background: COLORS.bg, padding: 4, borderRadius: 9, border: `1px solid ${COLORS.border}`, width: "fit-content" }}>
        {[["today","📋 Today"],["team","👥 Team"],["history","📊 History"],["reports","📈 Reports"],["settings","⚙ Settings"]].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: FONTS.sans, fontSize: 12, fontWeight: 700, background: tab === id ? COLORS.white : "transparent", color: tab === id ? COLORS.h1 : COLORS.muted, boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}>{lbl}</button>
        ))}
      </div>

      {/* ══════════ TODAY TAB ══════════ */}
      {tab === "today" && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "clip" }}>
          <div style={{ padding: "13px 17px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>Today's Attendance Log</div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
          </div>
          {loading ? <Spinner /> : (
            <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
              <Thead cols={["Event", "Time", "Duration", "Status", "Notes"]} />
              <tbody>
                {!activeSession && sessions.filter(s => s.date === new Date().toISOString().slice(0,10)).length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: COLORS.faint, fontSize: 13 }}>No attendance recorded today yet. Click Clock In to start.</td></tr>
                )}
                {activeSession && (
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>Clock In</td>
                    <td style={{ padding: "10px 14px", fontFamily: FONTS.mono, fontSize: 12, color: "#16A34A", fontWeight: 600 }}>{toLocStr(activeSession.clockInTime)}</td>
                    <td style={{ padding: "10px 14px", fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>{fmtClockDur(netSecs)}</td>
                    <td style={{ padding: "10px 14px" }}><span className="badge" style={{ background: "#ECFDF5", color: "#16A34A" }}>● {clockStatus === "break" ? "On Break" : "Active"}</span></td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.faint }}>{isLate ? `Late arrival` : "On time"}</td>
                  </tr>
                )}
                {sessions.filter(s => s.date === new Date().toISOString().slice(0,10) && s.status === "complete").map(s => (
                  <tr key={s._id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>Clocked Out</td>
                    <td style={{ padding: "10px 14px", fontFamily: FONTS.mono, fontSize: 12, color: "#DC2626", fontWeight: 600 }}>{toLocStr(s.clockOutTime)}</td>
                    <td style={{ padding: "10px 14px", fontFamily: FONTS.mono, fontSize: 12, fontWeight: 700, color: COLORS.h1 }}>{fmtClockMins(s.workedMins)}</td>
                    <td style={{ padding: "10px 14px" }}><span className="badge" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>✓ Complete</span></td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: (s.otMins || 0) > 0 ? "#C2410C" : COLORS.faint }}>{(s.otMins || 0) > 0 ? `⚡ OT: +${fmtClockMins(s.otMins)}` : "No overtime"}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      )}

      {/* ══════════ TEAM TAB ══════════ */}
      {tab === "team" && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
          <div style={{ padding: "13px 17px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>Team Clock Status</div>
          </div>
          {loading ? <Spinner /> : (
            <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
              {teamStatus.length === 0 && <div style={{ padding: 24, color: COLORS.faint, fontSize: 13 }}>No team data yet.</div>}
              {teamStatus.map(s => {
                const name   = s.userId?.name || "Unknown";
                const role   = s.userId?.role || "";
                const sc     = s.status === "active" ? { c: "#16A34A", bg: "#ECFDF5", lbl: "Clocked In" }
                             : s.status === "on_break" ? { c: "#D97706", bg: "#FFFBEB", lbl: "On Break" }
                             : { c: "#64748B", bg: "#F8FAFC", lbl: "Not Clocked" };
                return (
                  <div key={s._id} style={{ background: "#F9FAFB", borderRadius: 12, padding: "13px 15px", display: "flex", alignItems: "center", gap: 11, border: `1px solid ${sc.c}25` }}>
                    <Avatar name={name} size={38} color={sc.c} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{name}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{role}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: sc.c }}>
                        {s.status === "active" ? `Since ${toLocStr(s.clockInTime)}` : sc.lbl}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sc.c, background: sc.bg, padding: "4px 10px", borderRadius: 99 }}>{sc.lbl}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ HISTORY TAB ══════════ */}
      {tab === "history" && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "clip" }}>
          <div style={{ padding: "13px 17px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>Attendance History</div>
          </div>
          {loading ? <Spinner /> : (
            <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}>
              <Thead cols={["Date", "Clock In", "Clock Out", "Break", "Net Work", "Overtime", "Status", "Actions"]} />
              <tbody>
                {sessions.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 28, textAlign: "center", color: COLORS.faint }}>No history yet.</td></tr>
                )}
                {sessions.map((s, i) => (
                  <tr key={s._id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>{s.date}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: "#16A34A", fontWeight: 600 }}>{toLocStr(s.clockInTime)}</div>
                      {(s.lateMins || 0) > 5 && <div style={{ fontSize: 10, color: "#B45309", marginTop: 2 }}>⏰ Late {s.lateMins}m</div>}
                    </td>
                    <td style={{ padding: "11px 14px", fontFamily: FONTS.mono, fontSize: 12, color: "#DC2626", fontWeight: 600 }}>{toLocStr(s.clockOutTime)}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: COLORS.muted }}>{s.totalBreakSecs ? `${Math.floor(s.totalBreakSecs / 60)}m` : "—"}</td>
                    <td style={{ padding: "11px 14px", fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{fmtClockMins(s.workedMins)}</td>
                    <td style={{ padding: "11px 14px" }}>
                      {(s.otMins || 0) > 0
                        ? <span className="badge" style={{ background: "#FFF7ED", color: "#C2410C" }}>⚡ +{fmtClockMins(s.otMins)}</span>
                        : <span style={{ fontSize: 12, color: COLORS.faint }}>—</span>}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span className="badge" style={{ background: s.status === "active" ? "#ECFDF5" : "#EFF6FF", color: s.status === "active" ? "#16A34A" : "#1D4ED8" }}>
                        {s.status === "active" ? "● Active" : s.status === "on_break" ? "⏸ Break" : "✓ Complete"}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setEditTarget(s)} style={{ padding: "4px 10px", borderRadius: 7, background: "#EFF6FF", color: "#1D4ED8", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Edit</button>
                        <button onClick={() => setDeleteTarget(s)} style={{ padding: "4px 10px", borderRadius: 7, background: "#FEF2F2", color: "#DC2626", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      )}

      {/* ══════════ REPORTS TAB ══════════ */}
      {tab === "reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {loading ? <Spinner /> : reports && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  { label: "Total Hours",     value: fmtClockMins(reports.totalWorkedMins), sub: `${reports.totalSessions} sessions`,           color: "#3B82F6", bg: "#EFF6FF", icon: "⏱" },
                  { label: "Overtime",        value: fmtClockMins(reports.totalOTMins),     sub: reports.totalOTMins > 0 ? "Needs review" : "None", color: reports.totalOTMins > 0 ? "#C2410C" : COLORS.faint, bg: reports.totalOTMins > 0 ? "#FFF7ED" : COLORS.bg, icon: "⚡" },
                  { label: "Late Arrivals",   value: `${reports.totalLateDays} day${reports.totalLateDays !== 1 ? "s" : ""}`, sub: "vs shift start",  color: reports.totalLateDays > 0 ? "#B45309" : COLORS.faint, bg: reports.totalLateDays > 0 ? "#FFFBEB" : COLORS.bg, icon: "🕐" },
                  { label: "Avg Daily Hours", value: fmtClockMins(reports.avgWorkedMins),   sub: `Max: ${fmtClockMins(reports.maxWorkedMins)}`,  color: "#7C3AED", bg: "#F5F3FF", icon: "📊" },
                ].map(s => (
                  <div key={s.label} className="card" style={{ background: COLORS.white, borderRadius: 14, padding: "16px 18px", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted }}>{s.label}</div>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{s.icon}</div>
                    </div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: COLORS.faint, marginTop: 3 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "clip" }}>
                <div style={{ padding: "13px 17px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>Session Breakdown</div>
                <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 800, borderCollapse: "collapse" }}>
                  <Thead cols={["Date", "In", "Out", "Work", "Break", "Overtime", "Late", "Efficiency"]} />
                  <tbody>
                    {reports.sessions.map((s, i) => {
                      const eff = s.workedMins && otThresholdH ? Math.min(100, Math.round((Math.min(s.workedMins, otThresholdH * 60) / (otThresholdH * 60)) * 100)) : 0;
                      return (
                        <tr key={s._id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : "#FAFAFA" }}>
                          <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>{s.date}</td>
                          <td style={{ padding: "10px 14px", fontFamily: FONTS.mono, fontSize: 12, color: "#16A34A" }}>{toLocStr(s.clockInTime)}</td>
                          <td style={{ padding: "10px 14px", fontFamily: FONTS.mono, fontSize: 12, color: "#DC2626" }}>{toLocStr(s.clockOutTime)}</td>
                          <td style={{ padding: "10px 14px", fontFamily: FONTS.mono, fontSize: 12, fontWeight: 700, color: COLORS.h1 }}>{fmtClockMins(s.workedMins)}</td>
                          <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.muted }}>{s.totalBreakSecs ? `${Math.floor(s.totalBreakSecs / 60)}m` : "—"}</td>
                          <td style={{ padding: "10px 14px" }}>{(s.otMins || 0) > 0 ? <span className="badge" style={{ background: "#FFF7ED", color: "#C2410C" }}>+{fmtClockMins(s.otMins)}</span> : <span style={{ fontSize: 12, color: COLORS.faint }}>—</span>}</td>
                          <td style={{ padding: "10px 14px" }}>{(s.lateMins || 0) > 5 ? <span className="badge" style={{ background: "#FFFBEB", color: "#B45309" }}>{s.lateMins}m late</span> : <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>On time</span>}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 99, background: COLORS.bg, overflow: "hidden" }}>
                                <div style={{ width: `${eff}%`, height: "100%", borderRadius: 99, background: eff >= 90 ? "#16A34A" : eff >= 70 ? COLORS.brand : "#DC2626" }} />
                              </div>
                              <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: eff >= 90 ? "#16A34A" : eff >= 70 ? COLORS.brand : "#DC2626", minWidth: 32 }}>{eff}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════ SETTINGS TAB ══════════ */}
      {tab === "settings" && localSettings && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Shift Settings */}
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1, marginBottom: 16 }}>🕘 Shift & Hour Settings</div>
            {[
              { label: "Shift Start Time", key: "shiftStart", type: "time" },
              { label: "Shift End Time",   key: "shiftEnd",   type: "time" },
            ].map(({ label, key, type }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>{label}</div>
                <input type={type} value={localSettings[key] || ""} onChange={e => setLocalSettings(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h2, background: COLORS.bg, boxSizing: "border-box" }} />
              </div>
            ))}
            {[
              { label: "Daily OT Threshold (hours)", key: "otThresholdH",  min: 6, max: 12, step: 1,  color: COLORS.brand,   fmt: v => `${v}h` },
              { label: "Weekly Target (hours)",       key: "weeklyTargetH", min: 30, max: 60, step: 1, color: "#7C3AED",      fmt: v => `${v}h` },
              { label: "Max Break Per Day (mins)",    key: "breakLimitMins",min: 15, max: 120,step: 5, color: "#D97706",      fmt: v => `${v}m` },
            ].map(({ label, key, min, max, step, color, fmt }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>{label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input type="range" min={min} max={max} step={step} value={localSettings[key] ?? min}
                    onChange={e => setLocalSettings(p => ({ ...p, [key]: Number(e.target.value) }))} style={{ flex: 1 }} />
                  <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 700, color, minWidth: 40 }}>{fmt(localSettings[key])}</span>
                </div>
              </div>
            ))}
            <button onClick={saveSettings} className="btn" style={{ width: "100%", padding: 10, borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
              {settingsSaved ? "✓ Saved!" : "Save Settings"}
            </button>
          </div>

          {/* IP Restriction */}
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>🌐 IP Restriction</div>
              <label style={{ cursor: "pointer" }} className="toggle">
                <input type="checkbox" checked={localSettings.ipEnabled || false}
                  onChange={e => {
                    const v = e.target.checked;
                    setLocalSettings(p => ({ ...p, ipEnabled: v }));
                    api.updateSettings({ ipEnabled: v }).then(({ settings: s }) => setSettings(s));
                  }}
                  style={{ opacity: 0, width: 0, height: 0 }} />
                <span className="tog-sl" />
              </label>
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, lineHeight: 1.5 }}>
              When enabled, employees can only clock in from approved IP addresses.
            </div>
            <div style={{ background: ipEnabled && allowedIPs.includes(MOCK_IP) ? "#ECFDF5" : ipEnabled ? "#FEF2F2" : COLORS.bg, border: `1px solid ${ipEnabled && allowedIPs.includes(MOCK_IP) ? "#A7F3D0" : ipEnabled ? "#FECACA" : COLORS.border}`, borderRadius: 9, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{ipEnabled && allowedIPs.includes(MOCK_IP) ? "✅" : ipEnabled ? "⛔" : "🌐"}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>Current IP: <span style={{ fontFamily: FONTS.mono }}>{MOCK_IP}</span></div>
                <div style={{ fontSize: 11, color: ipEnabled && allowedIPs.includes(MOCK_IP) ? "#16A34A" : ipEnabled ? "#DC2626" : COLORS.muted }}>
                  {ipEnabled ? allowedIPs.includes(MOCK_IP) ? "✓ Allowed" : "✗ Blocked" : "IP restriction is off"}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: .4 }}>Allowed IPs ({allowedIPs.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 160, overflowY: "auto" }}>
              {allowedIPs.map(ip => (
                <div key={ip} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "#F9FAFB", border: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.h2, flex: 1 }}>{ip}</span>
                  {ip === MOCK_IP && <span className="badge" style={{ background: "#ECFDF5", color: "#16A34A", fontSize: 10 }}>Current</span>}
                  <button onClick={() => doRemoveIP(ip)} style={{ width: 22, height: 22, borderRadius: 6, background: "#FEF2F2", border: "none", cursor: "pointer", fontSize: 12, color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              ))}
              {allowedIPs.length === 0 && <div style={{ fontSize: 12, color: COLORS.faint, textAlign: "center", padding: "14px 0" }}>No IPs added yet.</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newIP} onChange={e => setNewIP(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") doAddIP(); }}
                placeholder="e.g. 192.168.1.50"
                style={{ flex: 1, padding: "8px 11px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12, fontFamily: FONTS.mono, color: COLORS.h2, background: COLORS.bg }} />
              <button onClick={doAddIP} className="btn" style={{ padding: "8px 16px", borderRadius: 8, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>+ Add</button>
            </div>
            {!allowedIPs.includes(MOCK_IP) && (
              <button onClick={() => { setNewIP(MOCK_IP); doAddIP(); }} style={{ marginTop: 10, width: "100%", padding: 7, borderRadius: 8, background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#16A34A", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans }}>
                + Add Current IP ({MOCK_IP})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <EditModal
          session={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleUpdateSession}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <DeleteModal
          session={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteSession}
        />
      )}
    </div>
  );
};

export default ClockInOutPage;