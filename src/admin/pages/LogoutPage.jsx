// pages/LogoutPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ── Cancel — just go back to dashboard ───────────────────────────────────
  const handleCancel = () => navigate('/dashboard');

  // ── Confirm logout ────────────────────────────────────────────────────────
  const handleLogout = () => {
    setLoading(true);

    // Optional: tell backend to invalidate session
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // fire-and-forget, don't block logout
    }

    setTimeout(() => {
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      setLoading(false);
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="logout-page">
      <div className="logout-card">
        <div className="logout-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <div className="logout-title">Logout</div>
        <div className="logout-sub">
          Are you sure you want to logout from<br />CoolTech Admin Panel?
        </div>
        <div className="logout-btns">
          {/* Cancel — navigate back, do NOT call handleLogout */}
          <button
            className="logout-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>

          {/* Confirm — clears token and redirects to login */}
          <button
            className="logout-confirm"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? 'Logging out…' : 'Yes, Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;