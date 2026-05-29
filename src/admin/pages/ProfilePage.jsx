import { useState, useEffect, useRef } from "react";
import { COLORS, FONTS } from "../constants/tokens";
import {
  User, Mail, Phone, MapPin, Shield, Clock, Briefcase,
  Camera, CheckCircle, Edit3, Save, X, Loader, Upload, Trash2,
} from "lucide-react";

const API   = import.meta.env.VITE_API_URL || "http://localhost:5000";
const token = () => localStorage.getItem("token");

// ─── Sync user fields to localStorage + notify Sidebar instantly ─────────────
const syncUserToStorage = (updates = {}) => {
  try {
    const existing = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...existing, ...updates }));
    window.dispatchEvent(new Event("user-updated")); // Sidebar listens for this
  } catch { /* silent */ }
};

// borderWidth/Style/Color separately to avoid React shorthand conflict warning
const iStyle = {
  padding: "9px 12px", borderRadius: 8,
  borderWidth: "1.5px", borderStyle: "solid", borderColor: COLORS.border,
  fontSize: 13, color: COLORS.h2,
  background: "#FAFAFA", fontFamily: FONTS.sans,
  width: "100%", outline: "none", boxSizing: "border-box",
  transition: "border-color .15s, box-shadow .15s",
};
const iStyleFocus = { borderColor: COLORS.brand, boxShadow: `0 0 0 3px ${COLORS.brand}20` };

const Field = ({ label, icon: Icon, value, editable, onChange, type = "text", readOnly }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</label>
      <div style={{ position: "relative" }}>
        {Icon && <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: COLORS.faint, pointerEvents: "none" }}><Icon size={14} /></span>}
        <input
          type={type} value={value || ""}
          readOnly={readOnly || !editable}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...iStyle, paddingLeft: Icon ? 34 : 12, background: readOnly || !editable ? "#F8FAFC" : "#FAFAFA", color: readOnly ? COLORS.muted : COLORS.h2, cursor: readOnly || !editable ? "default" : "text", ...(focused && editable ? iStyleFocus : {}) }}
        />
      </div>
    </div>
  );
};

const StatPill = ({ label, value, color, bg }) => (
  <div style={{ background: bg, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: FONTS.mono }}>{value ?? 0}</div>
    <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{label}</div>
  </div>
);

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now   = new Date();
  const time  = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString())       return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + `, ${time}`;
};

// ─── Generate initials from name ──────────────────────────────────────────────
const getInitials = (name) =>
  (name || "AD").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

// ─── Check if avatar is a real image (not empty/null) ─────────────────────────
const hasRealAvatar = (avatar) =>
  avatar && avatar !== "" && avatar !== "null" && avatar !== "undefined";

// ─── Avatar Editor ────────────────────────────────────────────────────────────
const AvatarEditor = ({ avatar, name, editMode, onAvatarChange }) => {
  const fileInputRef   = useRef();
  const cameraInputRef = useRef();
  const [showMenu,   setShowMenu]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [removing,   setRemoving]   = useState(false);

  const initials   = getInitials(name);
  const hasAvatar  = hasRealAvatar(avatar);
  const avatarSrc  = hasAvatar
    ? (avatar.startsWith("/") ? `${API}${avatar}` : avatar)
    : null;

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setShowMenu(false);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res  = await fetch(`${API}/api/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        onAvatarChange(data.avatar);
        syncUserToStorage({ avatar: data.avatar }); // ← sync to sidebar
      } else alert(data.message || "Upload failed.");
    } catch {
      alert("Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  // ── Remove avatar → back to initials ────────────────────────────────────────
  const handleRemove = async () => {
    setRemoving(true);
    setShowMenu(false);
    try {
      const res  = await fetch(`${API}/api/profile/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        onAvatarChange("");
        syncUserToStorage({ avatar: "" }); // ← sync to sidebar
      } else alert("Failed to remove avatar.");
    } catch {
      alert("Network error.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
      {/* Avatar circle */}
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: hasAvatar ? "transparent" : `linear-gradient(135deg, ${COLORS.brand}20, ${COLORS.brand}40)`,
        border: `3px solid ${COLORS.brand}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.sans,
        overflow: "hidden", position: "relative",
      }}>
        {hasAvatar ? (
          <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span>{initials}</span>
        )}
        {/* Spinner overlay while uploading or removing */}
        {(uploading || removing) && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.75)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 17 }}>
            <Loader size={18} color={COLORS.brand} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}
      </div>

      {/* Camera button — only in edit mode */}
      {editMode && (
        <button
          onClick={() => setShowMenu(m => !m)}
          style={{ position: "absolute", bottom: -4, right: -4, width: 26, height: 26, borderRadius: "50%", background: COLORS.brand, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}
        >
          <Camera size={12} color="white" />
        </button>
      )}

      {/* Upload / Remove menu */}
      {showMenu && editMode && (
        <>
          {/* Backdrop to close menu */}
          <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 9 }} />
          <div style={{ position: "absolute", top: 90, left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.15)", border: `1px solid ${COLORS.border}`, padding: 8, zIndex: 100, minWidth: 200 }}>

            {/* Upload from device */}
            <button
              onClick={() => { fileInputRef.current.click(); setShowMenu(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", fontSize: 13, color: COLORS.h2, fontWeight: 600, textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <Upload size={14} color={COLORS.brand} /> Upload from device
            </button>

            {/* Camera capture */}
            <button
              onClick={() => { cameraInputRef.current.click(); setShowMenu(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", fontSize: 13, color: COLORS.h2, fontWeight: 600, textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <Camera size={14} color={COLORS.brand} /> Take a photo
            </button>

            {/* Remove avatar — only if one exists */}
            {hasAvatar && (
              <>
                <div style={{ height: 1, background: COLORS.border, margin: "4px 0" }} />
                <button
                  onClick={handleRemove}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#DC2626", fontWeight: 600, textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <Trash2 size={14} color="#DC2626" /> Remove photo
                </button>
              </>
            )}

            {/* Cancel */}
            <div style={{ height: 1, background: COLORS.border, margin: "4px 0" }} />
            <button
              onClick={() => setShowMenu(false)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", fontSize: 13, color: COLORS.muted, textAlign: "left" }}
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </>
      )}

      {/* Hidden file inputs */}
      <input ref={fileInputRef}   type="file" accept="image/*"              style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
};

// ─── ProfilePage ──────────────────────────────────────────────────────────────
const ProfilePage = ({ clockProps }) => {
  const { clockStatus } = clockProps || {};

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [snapshot, setSnapshot]  = useState(null); // stores profile copy before editing
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  const [profile,  setProfile]  = useState(null);
  const [activity, setActivity] = useState([]);
  const [stats,    setStats]    = useState({ todayJobs: 0, completedJobs: 0, attendanceDays: 0 });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res  = await fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${token()}` } });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setProfile(data);
        setActivity(data.recentActivity || []);
        if (data.stats) setStats(s => ({ ...s, todayJobs: data.stats.todayJobs ?? 0, completedJobs: data.stats.completedJobs ?? 0 }));
      } catch {
        setError("Could not load profile. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    // Try attendance sessions for attendance days count
    // Tries /api/attendance/sessions first, falls back to /api/attendance
    const fetchAttendance = async () => {
      const URLS = [
        `${API}/api/attendance/sessions`,
        `${API}/api/attendance`,
        `${API}/api/timelogs`,
      ];
      for (const url of URLS) {
        try {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
          if (res.ok) {
            const data = await res.json();
            const count = Array.isArray(data) ? data.length : (data?.data?.length ?? 0);
            setStats(s => ({ ...s, attendanceDays: count }));
            return; // stop at first success
          }
        } catch { /* try next */ }
      }
      // All failed — keep 0, no console error
    };

    fetchProfile();
    fetchAttendance();
  }, []);

  const set = key => val => {
    setProfile(p => ({ ...p, [key]: val }));
    // Sync name to sidebar live while typing
    if (key === "name") syncUserToStorage({ name: val });
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: profile.name, email: profile.email, phone: profile.phone, location: profile.location, bio: profile.bio }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Save failed."); return; }
      setProfile(data.user);
      syncUserToStorage({ name: data.user.name, avatar: data.user.avatar }); // ← sync to sidebar
      setActivity(prev => [{ action: "Updated profile information", dot: "#8B5CF6", createdAt: new Date().toISOString() }, ...prev].slice(0, 20));
      setSaved(true); setEditMode(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const clkColor = { in: "#16A34A", break: "#D97706", out: COLORS.faint }[clockStatus || "out"];
  const clkLabel = { in: "Clocked In", break: "On Break", out: "Not Clocked In" }[clockStatus || "out"];
  const clkBg    = { in: "#ECFDF5", break: "#FFFBEB", out: "#F1F5F9" }[clockStatus || "out"];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 10, color: COLORS.muted }}>
      <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 14 }}>Loading profile…</span>
    </div>
  );

  if (!profile) return (
    <div style={{ padding: 32, color: "#DC2626", fontSize: 14 }}>⚠ {error || "Profile unavailable."}</div>
  );

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <div className="dash-page-header">
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.h1 }}>My Profile</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>View and manage your personal information</div>
        </div>
        <div className="dash-header-actions">
          {editMode ? (
            <>
              <button className="btn" onClick={() => {
                setProfile(snapshot);                              // restore original
                syncUserToStorage({ name: snapshot?.name, avatar: snapshot?.avatar }); // restore sidebar
                setEditMode(false);
                setError("");
              }}
                style={{ padding: "9px 18px", borderRadius: 9, background: "#F1F5F9", color: COLORS.muted, fontSize: 13, fontWeight: 700, border: `1px solid ${COLORS.border}` }}>
                <X size={14} /> Cancel
              </button>
              <button className="btn" onClick={handleSave} disabled={saving}
                style={{ padding: "9px 20px", borderRadius: 9, background: saving ? "#FDA97A" : `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700 }}>
                <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : (
            <button className="btn" onClick={() => { setSnapshot({ ...profile }); setEditMode(true); }}
              style={{ padding: "9px 20px", borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", fontSize: 13, fontWeight: 700 }}>
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
          <CheckCircle size={16} color="#16A34A" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>Profile updated successfully!</span>
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, fontWeight: 600, color: "#DC2626" }}>⚠ {error}</div>
      )}

      <div className="profile-layout">

        {/* ── Left ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`, padding: 24, boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : "0 1px 4px rgba(0,0,0,.05)", textAlign: "center", transition: "all .2s" }}>
            <AvatarEditor
              avatar={profile.avatar}
              name={profile.name}
              editMode={editMode}
              onAvatarChange={url => setProfile(p => ({ ...p, avatar: url }))}
            />
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.h1 }}>{profile.name}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>
              {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)} · {profile.department || "Management"}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "5px 14px", borderRadius: 99, background: clkBg }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: clkColor, display: "block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: clkColor }}>{clkLabel}</span>
            </div>
          </div>

          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>Quick Stats</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <StatPill label="Today's Jobs"    value={stats.todayJobs}      color={COLORS.brand} bg="#FFF7ED" />
              <StatPill label="Jobs Done"       value={stats.completedJobs}  color="#16A34A"      bg="#F0FDF4" />
              <StatPill label="Attendance Days" value={stats.attendanceDays} color="#3B82F6"      bg="#EFF6FF" />
              <StatPill label="Role Level"      value={profile.roleLevel || "L5"} color="#7C3AED" bg="#F5F3FF" />
            </div>
          </div>

          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>Employment</div>
            {[
              ["Employee ID", profile.empId      || "—", Briefcase],
              ["Joined",      profile.joined     || "—", Clock],
              ["Department",  profile.department || "—", Shield],
            ].map(([label, val, Icon]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                <Icon size={13} color={COLORS.faint} style={{ flexShrink: 0 }} />
                <span style={{ color: COLORS.muted, flex: 1 }}>{label}</span>
                <span style={{ fontWeight: 700, color: COLORS.h2, fontFamily: label === "Employee ID" ? FONTS.mono : FONTS.sans }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.h1, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <User size={16} color={COLORS.brand} /> Personal Information
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Full Name"   icon={User}      value={profile.name}     editable={editMode} onChange={set("name")} />
              <Field label="Employee ID" icon={Briefcase} value={profile.empId}    readOnly />
              <Field label="Email"       icon={Mail}      value={profile.email}    editable={editMode} onChange={set("email")} type="email" />
              <Field label="Phone"       icon={Phone}     value={profile.phone}    editable={editMode} onChange={set("phone")} type="tel" />
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Location"  icon={MapPin}    value={profile.location} editable={editMode} onChange={set("location")} />
              </div>
            </div>
          </div>

          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.h1, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Edit3 size={16} color={COLORS.brand} /> About Me
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>Bio</label>
              <textarea
                value={profile.bio || ""}
                readOnly={!editMode}
                onChange={e => set("bio")(e.target.value)}
                placeholder={editMode ? "Write something about yourself…" : "No bio added yet."}
                rows={4}
                style={{ ...iStyle, resize: "vertical", background: !editMode ? "#F8FAFC" : "#FAFAFA", cursor: !editMode ? "default" : "text" }}
              />
            </div>
          </div>

          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.h1, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={16} color={COLORS.brand} /> Role & Permissions
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(profile.permissions || []).map(p => (
                <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 99, background: `${COLORS.brand}12`, border: `1px solid ${COLORS.brand}25`, fontSize: 11, fontWeight: 700, color: COLORS.brand }}>
                  <CheckCircle size={10} /> {p}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 9, background: "#F0FDF4", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={14} color="#16A34A" />
              <span style={{ fontSize: 12, color: "#15803D", fontWeight: 600 }}>
                {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)} — Full platform access granted
              </span>
            </div>
          </div>

          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.h1, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} color={COLORS.brand} /> Recent Activity
            </div>
            {activity.length === 0 ? (
              <div style={{ fontSize: 13, color: COLORS.muted, padding: "8px 0" }}>
                No activity yet — login, profile edits, and job actions will appear here.
              </div>
            ) : (
              activity.slice(0, 5).map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < Math.min(activity.length, 5) - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.dot || COLORS.brand, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, color: COLORS.h2 }}>{a.action}</div>
                  <div style={{ fontSize: 11, color: COLORS.faint, flexShrink: 0 }}>{formatTime(a.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;