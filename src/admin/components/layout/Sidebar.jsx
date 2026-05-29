import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { COLORS } from "../../constants/tokens";
import { PATH_FOR } from "../../constants/routes";
import { ChevronRight, ChevronUp, User, Settings, LogOut, Shield, Clock } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Avatar display: image if available, else initials ───────────────────────
const UserAvatar = ({ avatar, initials, size = 32, className = "" }) => {
  const hasImg = avatar && avatar !== "" && avatar !== "null";
  const src    = hasImg ? (avatar.startsWith("/") ? `${API}${avatar}` : avatar) : null;
  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: size * 0.25,
        background: hasImg ? "transparent" : `linear-gradient(135deg,#EA580C22,#EA580C44)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 800, color: "#EA580C",
        overflow: "hidden", flexShrink: 0,
      }}
    >
      {hasImg
        ? <img src={src} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  );
};

// ─── Read user from localStorage ─────────────────────────────────────────────
const readUser = () => {
  try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
};

const Sidebar = ({
  setOpenJob,
  badges = {},
  sidebarOpen,
  setSidebarOpen,
  clockStatus,
  NAV,
  setPage,
}) => {
  const location    = useLocation();
  const navigate    = useNavigate();
  const todayJobs   = 0;
  const isCollapsed = !sidebarOpen;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuPos,      setMenuPos]      = useState({});
  const [flyout,       setFlyout]       = useState(null);

  // ── Live user state — syncs when avatar changes in ProfilePage ──────────────
  const [currentUser, setCurrentUser] = useState(readUser);
  const userName    = currentUser.name   || "Admin";
  const userRole    = currentUser.role   || "admin";
  const userAvatar  = currentUser.avatar || "";
  const userInitials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "AD";

  // Listen for "user-updated" custom event dispatched by ProfilePage
  useEffect(() => {
    const handler = () => setCurrentUser(readUser());
    window.addEventListener("user-updated", handler);
    return () => window.removeEventListener("user-updated", handler);
  }, []);

  const userMenuRef   = useRef(null);
  const userBtnRef    = useRef(null);
  const flyoutRef     = useRef(null);
  const flyoutTimerRef = useRef(null);

  useEffect(() => {
    if (userMenuOpen && isCollapsed && userBtnRef.current) {
      const r = userBtnRef.current.getBoundingClientRect();
      setMenuPos({ bottom: window.innerHeight - r.top, left: r.right + 8 });
    }
  }, [userMenuOpen, isCollapsed]);

  // Build parent→children map
  const parentOf   = {};
  const childrenOf = {};
  let lastParentId = null;
  NAV.forEach((n) => {
    if (n.sub) {
      if (lastParentId) {
        parentOf[n.id] = lastParentId;
        if (!childrenOf[lastParentId]) childrenOf[lastParentId] = [];
        childrenOf[lastParentId].push(n.id);
      }
    } else {
      lastParentId = n.id;
    }
  });

  const activePage   = Object.entries(PATH_FOR).find(([, p]) => p === location.pathname)?.[0] ?? "dashboard";
  const activeParent = parentOf[activePage] || null;

  const [expanded, setExpanded] = useState(() => {
    const init = {};
    if (activeParent) init[activeParent] = true;
    return init;
  });

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const handler = (e) => {
      if (
        userMenuRef.current && !userMenuRef.current.contains(e.target) &&
        userBtnRef.current  && !userBtnRef.current.contains(e.target)
      ) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMobileClose = () => { if (window.innerWidth < 1024) setSidebarOpen(false); };

  const openFlyout = (id, el) => {
    clearTimeout(flyoutTimerRef.current);
    const r = el.getBoundingClientRect();
    setFlyout({ id, top: r.top, left: r.right + 6 });
  };
  const closeFlyout = () => { flyoutTimerRef.current = setTimeout(() => setFlyout(null), 120); };
  const keepFlyout  = () => clearTimeout(flyoutTimerRef.current);

  // ── Shared user menu content ────────────────────────────────────────────────
  const UserMenuContent = () => (
    <>
      <div className="sum-header">
        <UserAvatar avatar={userAvatar} initials={userInitials} size={36} />
        <div className="sum-info" style={{ marginLeft: 10 }}>
          <div className="sum-name">{userName}</div>
          <div className="sum-role">{userRole} · CoolTech</div>
        </div>
        <div className={`status-dot ${clockStatus}`} style={{ marginLeft: "auto" }} />
      </div>
      <div className="sum-divider" />
      <button className="sum-item" onClick={() => { navigate("/profile"); setUserMenuOpen(false); }}>
        <User size={14} /><span>My Profile</span>
      </button>
      <button className="sum-item" onClick={() => { navigate("/account-settings"); setUserMenuOpen(false); }}>
        <Settings size={14} /><span>Account Settings</span>
      </button>
      <button className="sum-item" onClick={() => { navigate(PATH_FOR["clock"] ?? "/clock"); setUserMenuOpen(false); }}>
        <Clock size={14} /><span>My Attendance</span>
      </button>
      <div className="sum-divider" />
      <div className="sum-status-row">
        <div className={`status-dot ${clockStatus}`} />
        <span className="sum-status-label">
          {clockStatus === "in" ? "Currently clocked in" : clockStatus === "break" ? "On break" : "Not clocked in"}
        </span>
      </div>
      <div className="sum-divider" />
      <button className="sum-item sum-item-danger" onClick={() => { navigate(PATH_FOR["logout"] ?? "/logout"); setUserMenuOpen(false); }}>
        <LogOut size={14} /><span>Logout</span>
      </button>
    </>
  );

  return (
    <>
      <div className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          {!isCollapsed && (
            <>
              <div className="sidebar-logo-icon">❄</div>
              <div className="sidebar-logo-text">
                <div className="sidebar-logo-title">CoolTech</div>
                <div className="sidebar-logo-sub">AC SERVICES PLATFORM</div>
              </div>
            </>
          )}
          <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"} style={{ marginLeft: "auto" }}>
            <span className="hamburger-line" /><span className="hamburger-line" /><span className="hamburger-line" />
          </button>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">✕</button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV.map((n) => {
            const badge    = badges[n.id] || 0;
            const isActive = activePage === n.id;
            const hasKids  = !!childrenOf[n.id];
            const isOpen   = !!expanded[n.id];
            const isSub    = !!n.sub;
            const to       = PATH_FOR[n.id] ?? "/";
            if (isSub) return null;
            return (
              <div key={n.id} className="nav-item"
                onMouseEnter={isCollapsed && hasKids ? (e) => openFlyout(n.id, e.currentTarget) : undefined}
                onMouseLeave={isCollapsed && hasKids ? closeFlyout : undefined}>
                {n.section && !isCollapsed && <div className="nav-section-header">{n.section}</div>}
                {isCollapsed && <div className="nav-tooltip">{n.label}{badge > 0 ? ` (${badge})` : ""}</div>}
                <Link to={to}
                  onClick={() => { if (hasKids && !isCollapsed) toggleExpand(n.id); setOpenJob(null); handleMobileClose(); }}
                  className={["sidebar-nav-btn", isActive ? "active" : "", !isActive && activeParent === n.id ? "parent-active" : ""].filter(Boolean).join(" ")}
                  style={{ textDecoration: "none" }}>
                  <span className="nav-icon">{n.icon}</span>
                  <span className="nav-label">{n.label}</span>
                  {badge > 0 && <span className="nav-badge">{badge}</span>}
                  {hasKids && !isCollapsed && (
                    <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.muted, transition: "transform .2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", flexShrink: 0 }}>
                      <ChevronRight height={18} />
                    </span>
                  )}
                </Link>
                {hasKids && isOpen && !isCollapsed && (
                  <div style={{ overflow: "hidden", animation: "subSlideIn .18s ease" }}>
                    {childrenOf[n.id].map((childId) => {
                      const child = NAV.find(x => x.id === childId);
                      const isChildActive = activePage === childId;
                      if (!child) return null;
                      return (
                        <Link key={childId} to={PATH_FOR[childId] ?? "/"} onClick={handleMobileClose}
                          className={`sidebar-nav-btn sidebar-sub-btn ${isChildActive ? "active" : ""}`}
                          style={{ textDecoration: "none", fontSize: 12, fontWeight: isChildActive ? 700 : 500, color: isChildActive ? COLORS.brand : COLORS.muted, display: "flex", alignItems: "center", gap: 8, width: "100%", background: isChildActive ? `${COLORS.brand}10` : "transparent", border: "none", borderRadius: 7, cursor: "pointer", padding: "7px 12px 7px 36px" }}>
                          <span style={{ fontSize: 13 }}>{child.icon}</span>
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="sidebar-footer-stats">
              {[["0 jobs", "Today", "#F97316"], ["₹91K", "Revenue", "#22C55E"]].map(([v, k, c]) => (
                <div key={k} className="sidebar-stat">
                  <div className="sidebar-stat-value" style={{ color: c }}>{v}</div>
                  <div className="sidebar-stat-label">{k}</div>
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-user-wrap" ref={userMenuRef}>
            {/* Inline dropdown (expanded sidebar) */}
            {userMenuOpen && !isCollapsed && (
              <div className="sidebar-user-menu"><UserMenuContent /></div>
            )}

            {/* Clickable user card */}
            <button ref={userBtnRef}
              className={`sidebar-user ${userMenuOpen ? "active" : ""}`}
              onClick={() => setUserMenuOpen(o => !o)} aria-label="User menu">
              {/* ── Avatar: image or initials ── */}
              <UserAvatar avatar={userAvatar} initials={userInitials} size={32} className="sidebar-user-avatar" />
              {!isCollapsed && (
                <>
                  <div className="sidebar-user-text">
                    <div className="sidebar-user-name">{userName}</div>
                    <div className="sidebar-user-role">{userRole}</div>
                  </div>
                  <div className="sum-chevron" style={{ transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <ChevronUp size={14} color="#475569" />
                  </div>
                </>
              )}
              {isCollapsed && <div className={`status-dot ${clockStatus}`} style={{ position: "absolute", bottom: 2, right: 2 }} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Portal dropdown (collapsed sidebar) */}
      {userMenuOpen && isCollapsed && (
        <div ref={userMenuRef} className="sidebar-user-menu sidebar-user-menu--portal"
          style={{ bottom: menuPos.bottom, left: menuPos.left }}>
          <UserMenuContent />
        </div>
      )}

      {/* Collapsed flyout */}
      {flyout && isCollapsed && (() => {
        const children = childrenOf[flyout.id] || [];
        return (
          <div ref={flyoutRef} className="nav-flyout" style={{ top: flyout.top, left: flyout.left }}
            onMouseEnter={keepFlyout} onMouseLeave={closeFlyout}>
            <div className="nav-flyout-title">{NAV.find(x => x.id === flyout.id)?.label}</div>
            {children.map((childId) => {
              const child = NAV.find(x => x.id === childId);
              const isChildActive = activePage === childId;
              if (!child) return null;
              return (
                <Link key={childId} to={PATH_FOR[childId] ?? "/"} onClick={() => { setFlyout(null); handleMobileClose(); }}
                  className={`nav-flyout-item ${isChildActive ? "active" : ""}`} style={{ textDecoration: "none" }}>
                  <span className="nav-flyout-icon">{child.icon}</span>
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })()}

      <style>{`
        @keyframes subSlideIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .sidebar-nav-btn.parent-active { background:${COLORS.brand}08; color:${COLORS.brand}; }
      `}</style>
    </>
  );
};

export default Sidebar;