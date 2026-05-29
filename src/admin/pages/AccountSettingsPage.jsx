import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, FONTS } from "../constants/tokens";
import {
  Lock, Bell, Shield, Smartphone, Eye, EyeOff,
  Monitor, Moon, Sun, Globe, CheckCircle, AlertTriangle,
  Key, Trash2, LogOut, Save, ToggleLeft, ToggleRight, Loader,
} from "lucide-react";

const API   = import.meta.env.VITE_API_URL || "http://localhost:5000";
const token = () => localStorage.getItem("token");

const authFetch = (url, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...opts.headers },
  });

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, title, subtitle, children }) => (
  <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.brand}12`, border: `1px solid ${COLORS.brand}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={COLORS.brand} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.h1 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
    {children}
  </div>
);

const Toggle = ({ checked, onChange, label, sub, loading }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}88` }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{sub}</div>}
    </div>
    <button onClick={() => !loading && onChange(!checked)}
      style={{ background: "none", border: "none", cursor: loading ? "wait" : "pointer", padding: 0, flexShrink: 0, opacity: loading ? 0.5 : 1 }}>
      {checked ? <ToggleRight size={28} color={COLORS.brand} /> : <ToggleLeft size={28} color={COLORS.faint} />}
    </button>
  </div>
);

const iStyle = {
  padding: "9px 12px", borderRadius: 8,
  borderWidth: "1.5px", borderStyle: "solid", borderColor: COLORS.border,
  fontSize: 13, color: COLORS.h2,
  background: "#FAFAFA", fontFamily: FONTS.sans,
  width: "100%", outline: "none", boxSizing: "border-box",
  transition: "border-color .15s, box-shadow .15s",
};

const PasswordField = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <Lock size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: COLORS.faint }} />
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...iStyle, paddingLeft: 34, paddingRight: 38, ...(focused ? { borderColor: COLORS.brand, boxShadow: `0 0 0 3px ${COLORS.brand}20` } : {}) }} />
        <button onClick={() => setShow(s => !s)}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.faint, padding: 0 }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
};

const Toast = ({ type, message }) => {
  const isSuccess = type === "success";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 9,
      background: isSuccess ? "#ECFDF5" : "#FEF2F2",
      border: `1px solid ${isSuccess ? "#A7F3D0" : "#FECACA"}`, marginBottom: 16 }}>
      {isSuccess
        ? <CheckCircle size={14} color="#16A34A" />
        : <AlertTriangle size={14} color="#DC2626" />}
      <span style={{ fontSize: 12.5, fontWeight: isSuccess ? 700 : 600, color: isSuccess ? "#15803D" : "#DC2626" }}>{message}</span>
    </div>
  );
};

// ─── AccountSettingsPage ──────────────────────────────────────────────────────
const AccountSettingsPage = () => {
  const navigate  = useNavigate();
  const [tab, setTab] = useState("password");
  const [pageLoading, setPageLoading] = useState(true);

  // ── Password tab ──────────────────────────────────────────────────────────
  const [pwForm,    setPwForm]    = useState({ current: "", next: "", confirm: "" });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwToast,   setPwToast]   = useState(null); // { type, message }

  const handlePasswordSave = async () => {
    if (!pwForm.current)               return setPwToast({ type: "error", message: "Enter your current password." });
    if (pwForm.next.length < 8)        return setPwToast({ type: "error", message: "New password must be at least 8 characters." });
    if (pwForm.next !== pwForm.confirm) return setPwToast({ type: "error", message: "Passwords don't match." });
    setPwSaving(true); setPwToast(null);
    try {
      const res  = await authFetch("/api/settings/password", { method: "PUT", body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }) });
      const data = await res.json();
      if (!res.ok) return setPwToast({ type: "error", message: data.message || "Update failed." });
      setPwToast({ type: "success", message: "Password updated successfully!" });
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwToast(null), 3000);
    } catch {
      setPwToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Notifications tab ─────────────────────────────────────────────────────
  const [notifs,       setNotifs]       = useState({ jobAssigned: true, newQuotation: true, invoiceOverdue: true, technicianAlert: false, dailySummary: true, smsAlerts: false, emailDigest: true, browserPush: false });
  const [notifSaving,  setNotifSaving]  = useState(false);
  const [notifToast,   setNotifToast]   = useState(null);

  const handleToggle = async (key, val) => {
    const updated = { ...notifs, [key]: val };
    setNotifs(updated); // optimistic update
    setNotifSaving(true);
    try {
      const res = await authFetch("/api/settings/notifications", { method: "PUT", body: JSON.stringify({ [key]: val }) });
      if (!res.ok) {
        setNotifs(notifs); // rollback
        setNotifToast({ type: "error", message: "Failed to save. Please try again." });
        setTimeout(() => setNotifToast(null), 2500);
      }
    } catch {
      setNotifs(notifs);
    } finally {
      setNotifSaving(false);
    }
  };

  // ── Appearance tab ────────────────────────────────────────────────────────
  const [prefs,      setPrefs]      = useState({ theme: "light", language: "en-IN", timezone: "Asia/Kolkata", currency: "INR" });
  const [appSaving,  setAppSaving]  = useState(false);
  const [appToast,   setAppToast]   = useState(null);

  const handleAppSave = async () => {
    setAppSaving(true); setAppToast(null);
    try {
      const res  = await authFetch("/api/settings/preferences", { method: "PUT", body: JSON.stringify(prefs) });
      const data = await res.json();
      if (!res.ok) return setAppToast({ type: "error", message: data.message || "Failed to save." });
      setAppToast({ type: "success", message: "Preferences saved!" });
      setTimeout(() => setAppToast(null), 2500);
    } catch {
      setAppToast({ type: "error", message: "Network error." });
    } finally {
      setAppSaving(false);
    }
  };

  // ── Security tab ──────────────────────────────────────────────────────────
  const [twoFA,      setTwoFA]      = useState(false);
  const [twoFASaving, setTwoFASaving] = useState(false);
  const [sessions,   setSessions]   = useState([]);
  const [loginHist,  setLoginHist]  = useState([]);
  const [secToast,   setSecToast]   = useState(null);

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword,    setDeletePassword]    = useState("");
  const [deleteError,       setDeleteError]       = useState("");

  const handle2FA = async () => {
    setTwoFASaving(true);
    try {
      const res  = await authFetch("/api/settings/security/2fa", { method: "PUT", body: JSON.stringify({ enabled: !twoFA }) });
      const data = await res.json();
      if (res.ok) {
        setTwoFA(data.twoFactorEnabled);
        setSecToast({ type: "success", message: `2FA ${data.twoFactorEnabled ? "enabled" : "disabled"} successfully.` });
        setTimeout(() => setSecToast(null), 2500);
      }
    } catch { /* silent */ } finally { setTwoFASaving(false); }
  };

  const handleRevoke = async (sessionId) => {
    try {
      const res = await authFetch(`/api/settings/security/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) setSessions(prev => prev.filter(s => s._id !== sessionId));
    } catch { /* silent */ }
  };

  const handleRevokeAll = async () => {
    try {
      const res = await authFetch("/api/settings/security/sessions", { method: "DELETE" });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.isCurrent));
        setSecToast({ type: "success", message: "All other sessions revoked." });
        setTimeout(() => setSecToast(null), 2500);
      }
    } catch { /* silent */ }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return setDeleteError("Please enter your password to confirm.");
    try {
      const res  = await authFetch("/api/settings/account", { method: "DELETE", body: JSON.stringify({ password: deletePassword }) });
      const data = await res.json();
      if (!res.ok) return setDeleteError(data.message || "Incorrect password.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch {
      setDeleteError("Network error.");
    }
  };

  // ── Fetch all settings on mount ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      try {
        const [nRes, pRes, sRes] = await Promise.all([
          authFetch("/api/settings/notifications"),
          authFetch("/api/settings/preferences"),
          authFetch("/api/settings/security"),
        ]);
        if (nRes.ok) setNotifs(await nRes.json());
        if (pRes.ok) setPrefs(await pRes.json());
        if (sRes.ok) {
          const sec = await sRes.json();
          setTwoFA(sec.twoFactorEnabled ?? false);
          setSessions(sec.activeSessions ?? []);
          setLoginHist(sec.loginHistory  ?? []);
        }
      } catch { /* use defaults */ } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  const TABS = [
    { id: "password",      label: "Password",      icon: Lock    },
    { id: "notifications", label: "Notifications", icon: Bell    },
    { id: "appearance",    label: "Appearance",    icon: Monitor },
    { id: "security",      label: "Security",      icon: Shield  },
  ];

  if (pageLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 10, color: COLORS.muted }}>
      <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 14 }}>Loading settings…</span>
    </div>
  );

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.h1 }}>Account Settings</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>Manage your password, notifications, and security preferences</div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ display: "flex", gap: 4, background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 5, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: FONTS.sans,
              background: tab === t.id ? `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})` : "transparent",
              color: tab === t.id ? "white" : COLORS.muted, transition: "all .16s",
              boxShadow: tab === t.id ? `0 2px 8px ${COLORS.brand}40` : "none" }}>
            <t.icon size={13} />
            <span className="hide-sm">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══ PASSWORD TAB ══ */}
      {tab === "password" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionCard icon={Key} title="Change Password" subtitle="Use a strong password of at least 8 characters">
            {pwToast && <Toast type={pwToast.type} message={pwToast.message} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 440 }}>
              <PasswordField label="Current Password" value={pwForm.current} onChange={v => setPwForm(p => ({ ...p, current: v }))} placeholder="Enter current password" />
              <PasswordField label="New Password"     value={pwForm.next}    onChange={v => setPwForm(p => ({ ...p, next: v }))}    placeholder="Min. 8 characters" />
              <PasswordField label="Confirm Password" value={pwForm.confirm} onChange={v => setPwForm(p => ({ ...p, confirm: v }))} placeholder="Repeat new password" />
              {pwForm.next.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 5 }}>Password strength</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1,2,3,4].map(i => {
                      const score = Math.min(4, Math.floor(pwForm.next.length / 3));
                      return <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= score ? ["#EF4444","#F97316","#EAB308","#22C55E"][score-1] : "#E5E7EB", transition: "background .2s" }} />;
                    })}
                  </div>
                </div>
              )}
              <button className="btn" onClick={handlePasswordSave} disabled={pwSaving}
                style={{ alignSelf: "flex-start", padding: "9px 22px", borderRadius: 9, background: pwSaving ? "#FDA97A" : `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700 }}>
                <Save size={14} /> {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </SectionCard>
          <div style={{ background: "#FFFBEB", borderRadius: 14, border: "1px solid #FDE68A", padding: "16px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 10 }}>💡 Password Tips</div>
            {["Use at least 8 characters","Mix uppercase, lowercase, numbers and symbols","Don't reuse passwords from other accounts","Change your password every 90 days"].map(tip => (
              <div key={tip} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#78350F" }}><span>•</span><span>{tip}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* ══ NOTIFICATIONS TAB ══ */}
      {tab === "notifications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {notifToast && <Toast type={notifToast.type} message={notifToast.message} />}
          <SectionCard icon={Bell} title="In-App Notifications" subtitle="Control what alerts appear inside the platform">
            <Toggle checked={notifs.jobAssigned}     onChange={v => handleToggle("jobAssigned",     v)} label="Job Assigned"          sub="When a work order is assigned to you"              loading={notifSaving} />
            <Toggle checked={notifs.newQuotation}    onChange={v => handleToggle("newQuotation",    v)} label="New Quotation Request" sub="When a customer requests a quote"                  loading={notifSaving} />
            <Toggle checked={notifs.invoiceOverdue}  onChange={v => handleToggle("invoiceOverdue",  v)} label="Overdue Invoices"      sub="Daily reminder for unpaid invoices"                loading={notifSaving} />
            <Toggle checked={notifs.technicianAlert} onChange={v => handleToggle("technicianAlert", v)} label="Technician Alerts"     sub="When a technician goes off duty unexpectedly"      loading={notifSaving} />
            <Toggle checked={notifs.dailySummary}    onChange={v => handleToggle("dailySummary",    v)} label="Daily Summary"         sub="End-of-day operations summary at 7 PM"             loading={notifSaving} />
          </SectionCard>
          <SectionCard icon={Smartphone} title="External Channels" subtitle="Push, SMS and email notification settings">
            <Toggle checked={notifs.smsAlerts}   onChange={v => handleToggle("smsAlerts",   v)} label="SMS Alerts"   sub="Critical alerts sent to your registered number" loading={notifSaving} />
            <Toggle checked={notifs.emailDigest} onChange={v => handleToggle("emailDigest", v)} label="Email Digest" sub="Weekly report sent every Monday morning"        loading={notifSaving} />
            <Toggle checked={notifs.browserPush} onChange={v => handleToggle("browserPush", v)} label="Browser Push" sub="Desktop push notifications when browser is open" loading={notifSaving} />
          </SectionCard>
        </div>
      )}

      {/* ══ APPEARANCE TAB ══ */}
      {tab === "appearance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionCard icon={Monitor} title="Theme" subtitle="Choose how CoolTech looks for you">
            <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
              {[
                { id: "light", label: "Light",  icon: Sun,     bg: "#FFFFFF", border: "#E5E7EB" },
                { id: "dark",  label: "Dark",   icon: Moon,    bg: "#1A1A2E", border: "#2A2A4A" },
                { id: "auto",  label: "System", icon: Monitor, bg: "linear-gradient(135deg,#fff 50%,#1A1A2E 50%)", border: "#CBD5E1" },
              ].map(t => (
                <button key={t.id} onClick={() => setPrefs(p => ({ ...p, theme: t.id }))}
                  style={{ flex: 1, padding: "14px 10px", borderRadius: 12, cursor: "pointer",
                    border: prefs.theme === t.id ? `2px solid ${COLORS.brand}` : `1.5px solid ${t.border}`,
                    background: prefs.theme === t.id ? `${COLORS.brand}08` : t.bg,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    boxShadow: prefs.theme === t.id ? `0 0 0 3px ${COLORS.brand}18` : "none", transition: "all .15s" }}>
                  <t.icon size={20} color={prefs.theme === t.id ? COLORS.brand : COLORS.muted} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: prefs.theme === t.id ? COLORS.brand : COLORS.muted }}>{t.label}</span>
                </button>
              ))}
            </div>
          </SectionCard>
          <SectionCard icon={Globe} title="Regional Settings" subtitle="Language, timezone and currency">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Language", key: "language", options: [["en-IN","English (India)"],["en-US","English (US)"],["hi-IN","Hindi"]] },
                { label: "Timezone", key: "timezone", options: [["Asia/Kolkata","IST (UTC+5:30)"],["Asia/Dubai","GST (UTC+4)"],["Europe/London","GMT (UTC+0)"]] },
                { label: "Currency", key: "currency", options: [["INR","₹ Indian Rupee"],["USD","$ US Dollar"],["AED","د.إ Dirham"]] },
              ].map(({ label, key, options }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</label>
                  <select value={prefs[key]} onChange={e => setPrefs(p => ({ ...p, [key]: e.target.value }))} style={{ ...iStyle, cursor: "pointer" }}>
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <button className="btn" onClick={handleAppSave} disabled={appSaving}
                style={{ alignSelf: "flex-start", padding: "9px 22px", borderRadius: 9, background: appSaving ? "#FDA97A" : `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700 }}>
                <Save size={14} /> {appSaving ? "Saving…" : "Save Preferences"}
              </button>
              {appToast && <Toast type={appToast.type} message={appToast.message} />}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ══ SECURITY TAB ══ */}
      {tab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {secToast && <Toast type={secToast.type} message={secToast.message} />}

          {/* 2FA */}
          <SectionCard icon={Smartphone} title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: COLORS.body, lineHeight: 1.6, marginBottom: 12 }}>
                  When enabled, you'll be prompted for a verification code from your authenticator app each time you log in.
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: twoFA ? "#ECFDF5" : "#FEF2F2", border: twoFA ? "1px solid #A7F3D0" : "1px solid #FECACA" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: twoFA ? "#22C55E" : "#EF4444", display: "block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: twoFA ? "#15803D" : "#DC2626" }}>{twoFA ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
              <button className="btn" onClick={handle2FA} disabled={twoFASaving}
                style={{ padding: "9px 18px", borderRadius: 9, background: twoFA ? "#FEF2F2" : `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: twoFA ? "#DC2626" : "white", fontSize: 12, fontWeight: 700, border: twoFA ? "1px solid #FECACA" : "none", flexShrink: 0, opacity: twoFASaving ? 0.6 : 1 }}>
                {twoFASaving ? "…" : twoFA ? "Disable 2FA" : "Enable 2FA"}
              </button>
            </div>
          </SectionCard>

          {/* Active sessions */}
          <SectionCard icon={Monitor} title="Active Sessions" subtitle="Devices currently logged into your account">
            {sessions.length === 0 ? (
              <div style={{ fontSize: 13, color: COLORS.muted, padding: "8px 0" }}>No active sessions found.</div>
            ) : sessions.map(s => (
              <div key={s._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}88` }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: s.isCurrent ? `${COLORS.brand}12` : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Monitor size={16} color={s.isCurrent ? COLORS.brand : COLORS.faint} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>{s.device || "Unknown device"}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{s.location || "—"} · {s.lastSeen ? new Date(s.lastSeen).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}</div>
                </div>
                {s.isCurrent
                  ? <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#F0FDF4", color: "#16A34A" }}>Current</span>
                  : <button onClick={() => handleRevoke(s._id)} style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>Revoke</button>}
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <button className="btn" onClick={handleRevokeAll}
                style={{ padding: "8px 18px", borderRadius: 9, background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 700, border: "1px solid #FECACA" }}>
                <LogOut size={13} /> Revoke All Other Sessions
              </button>
            </div>
          </SectionCard>

          {/* Login history */}
          <SectionCard icon={Key} title="Recent Login History" subtitle="Last 5 login events">
            {loginHist.length === 0 ? (
              <div style={{ fontSize: 13, color: COLORS.muted, padding: "8px 0" }}>No login history yet.</div>
            ) : loginHist.map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < loginHist.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.status === "success" ? "#22C55E" : "#EF4444", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12.5, color: COLORS.h2 }}>{l.device || "Unknown device"}</div>
                <div style={{ fontSize: 11, color: COLORS.faint, fontFamily: FONTS.mono }}>{l.ip || "—"}</div>
                <div style={{ fontSize: 11, color: COLORS.faint, flexShrink: 0 }}>
                  {l.createdAt ? new Date(l.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                </div>
                {l.status === "failed" && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "#FEF2F2", color: "#DC2626" }}>Failed</span>
                )}
              </div>
            ))}
          </SectionCard>

          {/* Danger zone */}
          <div style={{ background: "#FFF5F5", borderRadius: 16, border: "1.5px solid #FECACA", padding: "20px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#991B1B", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} /> Danger Zone
            </div>
            <div style={{ fontSize: 12, color: "#B91C1C", marginBottom: 16, lineHeight: 1.6 }}>
              These actions are permanent and cannot be undone. Please proceed with caution.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" onClick={handleRevokeAll}
                style={{ padding: "9px 18px", borderRadius: 9, background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 700, border: "1px solid #FECACA" }}>
                <LogOut size={13} /> Log Out All Devices
              </button>
              <button className="btn" onClick={() => setShowDeleteConfirm(true)}
                style={{ padding: "9px 18px", borderRadius: 9, background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 700, border: "1px solid #FECACA" }}>
                <Trash2 size={13} /> Delete Account
              </button>
            </div>

            {/* Delete confirmation inline panel */}
            {showDeleteConfirm && (
              <div style={{ marginTop: 16, padding: "16px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 10 }}>⚠ Confirm Account Deletion</div>
                <div style={{ fontSize: 12, color: "#B91C1C", marginBottom: 12 }}>Enter your password to permanently delete your account. This cannot be undone.</div>
                <div style={{ position: "relative", maxWidth: 320, marginBottom: 10 }}>
                  <input type="password" value={deletePassword} onChange={e => { setDeletePassword(e.target.value); setDeleteError(""); }}
                    placeholder="Enter your password"
                    style={{ ...iStyle, borderColor: deleteError ? "#DC2626" : COLORS.border }} />
                </div>
                {deleteError && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 10 }}>⚠ {deleteError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={handleDeleteAccount}
                    style={{ padding: "8px 18px", borderRadius: 9, background: "#DC2626", color: "white", fontSize: 12, fontWeight: 700, border: "none" }}>
                    Yes, Delete My Account
                  </button>
                  <button className="btn" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
                    style={{ padding: "8px 18px", borderRadius: 9, background: "#F1F5F9", color: COLORS.muted, fontSize: 12, fontWeight: 700, border: `1px solid ${COLORS.border}` }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage;