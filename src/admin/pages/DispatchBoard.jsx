// DispatchBoard.jsx — with TechDetail view matching JobsPage style

import { JOB_STATUS, TECH_STATUS } from '../constants/statusMaps';
import { jobsApi } from '../services/api';
import { jobs as initialJobs, DISPATCH_DATA as dispatchData } from '../data/mockData';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../components/ui/Form';

// ─── Breakpoint Hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile:  width < 640,
    isTablet:  width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

// ─── BatteryIcon ──────────────────────────────────────────────────────────────
const BatteryIcon = ({ pct = 100 }) => {
  const color = pct > 60 ? "#22C55E" : pct > 30 ? "#F59E0B" : "#EF4444";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <svg width="18" height="10" viewBox="0 0 18 10" style={{ display: "block" }}>
        <rect x="0.5" y="0.5" width="14" height="9" rx="2" fill="none" stroke="#94A3B8" strokeWidth="1" />
        <rect x="15" y="3" width="2.5" height="4" rx="1" fill="#94A3B8" />
        <rect x="1.5" y="1.5" width={Math.round((pct / 100) * 12)} height="7" rx="1.5" fill={color} />
      </svg>
      <span style={{ fontSize: 10, color, fontWeight: 600 }}>{pct}%</span>
    </span>
  );
};

// ─── FieldLabel ───────────────────────────────────────────────────────────────
const FieldLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, color: COLORS.faint,
    textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4,
  }}>
    {children}
  </div>
);

const inputStyle = {
  padding: '7px 10px', borderRadius: 8,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13, color: COLORS.h2,
  background: '#FAFAFA', fontFamily: FONTS.sans,
  width: '100%', outline: 'none',
  transition: 'border-color .15s',
  boxSizing: 'border-box',
};

// ─── Stats config ─────────────────────────────────────────────────────────────
const getStats = (busy, available, off, unassigned) => [
  { label: "On Job",          value: busy.length,        color: "#F59E0B", bg: "#FFFBEB", icon: "🔧" },
  { label: "Available",       value: available.length,   color: "#22C55E", bg: "#ECFDF5", icon: "✅" },
  { label: "Off Duty",        value: off.length,         color: "#94A3B8", bg: "#F1F5F9", icon: "💤" },
  { label: "Unassigned Jobs", value: unassigned.length,  color: "#EF4444", bg: "#FEF2F2", icon: "⚠" },
];

// ─── TechDetailView ───────────────────────────────────────────────────────────
const TechDetailView = ({ tech, allJobs, onBack, openModal, isMobile }) => {
  const [editMode, setEditMode]   = useState(false);
  const [editData, setEditData]   = useState({ ...tech });
  const [toast, setToast]         = useState('');

  const techJobs = allJobs.filter(j =>
    j.tech === tech.name && !['cancelled'].includes(j.status)
  );

  const statusColor = tech.status === 'busy' ? COLORS.brand
    : tech.status === 'available' ? '#22C55E' : '#94A3B8';
  const statusBg = tech.status === 'busy' ? COLORS.brandL
    : tech.status === 'available' ? '#ECFDF5' : '#F1F5F9';

  const set = (key) => (e) => setEditData(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    // In a real app: call techsApi.update(tech.techId, editData)
    setEditMode(false);
    setToast('Technician updated successfully');
    setTimeout(() => setToast(''), 2800);
  };

  const statusOptions = [
    { key: 'available', icon: '✅', label: 'Available', color: '#22C55E', bg: '#ECFDF5' },
    { key: 'busy',      icon: '🔧', label: 'On Job',    color: COLORS.brand, bg: COLORS.brandL },
    { key: 'off',       icon: '💤', label: 'Off Duty',  color: '#94A3B8', bg: '#F1F5F9' },
    { key: 'break',     icon: '☕', label: 'On Break',  color: '#F59E0B', bg: '#FFFBEB' },
  ];

  return (
    <>
      {/* ── Back bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 16, flexWrap: 'wrap',
      }}>
        <button onClick={onBack} className="back-btn">←</button>
        <span style={{ fontSize: 13, color: COLORS.muted }}>Dispatch Board</span>
        <span style={{ color: COLORS.border }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{tech.name}</span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.brand }}>
          #{tech.techId?.slice(-6).toUpperCase()}
        </span>

        {/* Edit / Save buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {editMode ? (
            <>
              <button onClick={() => { setEditMode(false); setEditData({ ...tech }); }}
                className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleSave}
                className="btn btn-primary btn-sm"
                style={{ background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})` }}>
                💾 Save
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)}
              className="btn btn-secondary btn-sm">
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* ── Detail grid ── */}
      <div className="job-detail-grid">

        {/* ── Main card ── */}
        <div style={{
          background: COLORS.white, borderRadius: 14,
          border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
          padding: isMobile ? '14px' : '20px',
          boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : '0 1px 4px rgba(0,0,0,.05)',
          transition: 'all .2s', minWidth: 0, overflow: 'hidden',
        }}>

          {/* ── Profile header ── */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar name={tech.name} size={56} color={statusColor} />
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 16, height: 16, borderRadius: '50%',
                background: statusColor, border: '2.5px solid white',
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, background: statusBg, color: statusColor, padding: '3px 10px', borderRadius: 99 }}>
                  {TECH_STATUS[tech.status]?.label || tech.status}
                </span>
                <span style={{ fontSize: 10, color: COLORS.faint, fontFamily: FONTS.mono }}>
                  Last update: {tech.lastUpdate}
                </span>
              </div>
              {editMode
                ? <input value={editData.name} onChange={set('name')}
                    style={{ ...inputStyle, fontSize: 18, fontWeight: 800, marginBottom: 4 }} />
                : <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: COLORS.h1 }}>{tech.name}</div>
              }
              <div style={{ display: 'flex', gap: 12, marginTop: 5, flexWrap: 'wrap' }}>
                {editMode
                  ? <input value={editData.area} onChange={set('area')} placeholder="Area"
                      style={{ ...inputStyle, fontSize: 12, width: 'auto', flex: '1 1 120px' }} />
                  : <span style={{ fontSize: 12, color: COLORS.muted }}>📍 {tech.area}</span>
                }
                {editMode
                  ? <input value={editData.phone} onChange={set('phone')} placeholder="Phone"
                      style={{ ...inputStyle, fontSize: 12, width: 'auto', flex: '1 1 120px' }} />
                  : <span style={{ fontSize: 12, color: COLORS.muted }}>📱 {tech.phone}</span>
                }
              </div>
            </div>
          </div>

          <Divider />

          {/* ── Vehicle & battery info ── */}
          <div className="job-field-grid" style={{ margin: '14px 0' }}>
            <div>
              <FieldLabel>Vehicle</FieldLabel>
              {editMode
                ? <input value={editData.vehicle || ''} onChange={set('vehicle')} style={inputStyle} />
                : <div style={{ fontSize: 13, color: COLORS.h2 }}>🚗 {tech.vehicle || '—'}</div>
              }
            </div>
            <div>
              <FieldLabel>Battery</FieldLabel>
              <BatteryIcon pct={tech.battery} />
            </div>
            <div>
              <FieldLabel>Today's Jobs</FieldLabel>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{techJobs.length}</div>
            </div>
            <div>
              <FieldLabel>Completed</FieldLabel>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>
                {techJobs.filter(j => j.status === 'completed').length}
              </div>
            </div>
          </div>

          <Divider />

          {/* ── Current Job ── */}
          {tech.currentJob && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>
                Current Job
              </div>
              <div style={{
                background: COLORS.brandL, borderRadius: 10,
                padding: '14px 16px', border: `1px solid ${COLORS.brand}30`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: COLORS.brand }}>
                    {tech.currentJob.id}
                  </span>
                  <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, background: '#ECFDF5', padding: '2px 8px', borderRadius: 99 }}>
                    ✓ ETA: {tech.currentJob.eta}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1, marginBottom: 4 }}>
                  {tech.currentJob.customer}
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>
                  📍 {tech.currentJob.address}
                </div>
                <div style={{ fontSize: 11, color: COLORS.body }}>
                  ⏱ Started: <strong>{tech.currentJob.startTime}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ── Next Job ── */}
          {tech.nextJob && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>
                Next Job
              </div>
              <div style={{
                background: '#F8FAFC', borderRadius: 10,
                padding: '14px 16px', border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>
                    {tech.nextJob.customer}
                  </span>
                  {tech.nextJob.priority === 'urgent' && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 99 }}>
                      🚨 URGENT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{tech.nextJob.type}</div>
              </div>
            </div>
          )}

          {/* ── Assigned Jobs list ── */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>
              Assigned Jobs ({techJobs.length})
            </div>
            {techJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: COLORS.faint, fontSize: 13 }}>
                No jobs assigned
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: `1px solid ${COLORS.border}` }}>
                      {['Job ID', 'Customer', 'Type', 'Date', 'Status'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: COLORS.faint, textAlign: 'left', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {techJobs.map((j, i) => (
                      <tr key={j._id || j.id} style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : '#FAFAFA' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: COLORS.brand }}>
                            {j.id}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: COLORS.h1 }}>
                          {j.customer}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <TypeTag type={j.type} />
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: COLORS.muted }}>
                          {j.date}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <SBadge s={j.status} map={JOB_STATUS} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          {!editMode && (
            <div className="job-action-btns" style={{ marginTop: 18 }}>
              <button className="btn" onClick={() => openModal('new_job')}
                style={{ flex: '1 1 140px', padding: '11px 12px', borderRadius: 10, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 12, fontWeight: 700, boxShadow: `0 4px 12px ${COLORS.brand}40`, border: 'none', cursor: 'pointer' }}>
                + Assign Job
              </button>
              <button className="btn"
                style={{ flex: '1 1 100px', padding: '11px 12px', borderRadius: 10, background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                📞 Call
              </button>
              <button className="btn"
                style={{ flex: '1 1 100px', padding: '11px 12px', borderRadius: 10, background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7C3AED', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                📍 Track
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="job-detail-sidebar">

          {/* ── Update Status ── */}
          {!editMode && (
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>
                Update Status
              </div>
              {statusOptions.map(({ key, icon, label, color, bg }) => {
                const isCurrent = tech.status === key;
                return (
                  <button key={key}
                    style={{
                      width: '100%', marginBottom: 6, padding: '10px 14px', borderRadius: 8,
                      background: isCurrent ? bg : '#FAFAF9',
                      color: isCurrent ? color : COLORS.h2,
                      fontSize: 12, fontWeight: isCurrent ? 700 : 500,
                      textAlign: 'left',
                      border: `1px solid ${isCurrent ? color + '55' : COLORS.border}`,
                      cursor: isCurrent ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'all .15s', fontFamily: FONTS.sans,
                    }}>
                    <span>{icon}</span>
                    <span style={{ flex: 1 }}>{isCurrent ? '● ' : '→ '}{label}</span>
                    {isCurrent && (
                      <span style={{ fontSize: 10, background: color + '22', color, padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Performance stats ── */}
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>
              Performance
            </div>
            {[
              ['Total Jobs Today', techJobs.length, COLORS.h2],
              ['Completed', techJobs.filter(j => j.status === 'completed').length, '#22C55E'],
              ['In Progress', techJobs.filter(j => j.status === 'in_progress').length, COLORS.brand],
              ['Pending', techJobs.filter(j => j.status === 'assigned').length, '#F59E0B'],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                <span style={{ color: COLORS.muted }}>{k}</span>
                <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
          </div>

          {/* ── Quick Info ── */}
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)', transition: 'border-color .2s' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>
              Technician Info
            </div>
            {[
              ['Area / Zone', tech.area],
              ['Phone', tech.phone],
              ['Vehicle', tech.vehicle || '—'],
              ['Last Update', tech.lastUpdate],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, gap: 8 }}>
                <span style={{ color: COLORS.muted, flexShrink: 0 }}>{k}</span>
                {editMode && ['Area / Zone', 'Phone', 'Vehicle'].includes(k)
                  ? <input
                      value={editData[{ 'Area / Zone': 'area', 'Phone': 'phone', 'Vehicle': 'vehicle' }[k]] || ''}
                      onChange={set({ 'Area / Zone': 'area', 'Phone': 'phone', 'Vehicle': 'vehicle' }[k])}
                      style={{ ...inputStyle, width: 150, textAlign: 'right', padding: '4px 8px', fontSize: 12 }}
                    />
                  : <span style={{ fontWeight: 600, color: COLORS.h2, textAlign: 'right' }}>{v}</span>
                }
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}
    </>
  );
};

// ─── DispatchBoard ────────────────────────────────────────────────────────────
const DispatchBoard = ({ openModal }) => {
  const { isMobile } = useBreakpoint();
  const [selected, setSelected]       = useState(null);
  const [openTech, setOpenTech]       = useState(null); // techId for detail view
  const [allJobs, setAllJobs]         = useState(initialJobs);

  const unassigned = allJobs.filter(j =>
    (j.tech === 'Unassigned' || !j.tech) &&
    !["completed", "cancelled", "invoiced"].includes(j.status)
  );

  useEffect(() => {
    jobsApi.list({ limit: 200 }).then(r => {
      const data = (r.data ?? []).map((j, idx) => ({
        ...j,
        id: j.id ?? j._id ?? j.jobId ?? `api-job-${idx}`,
        tech: typeof j.technician === 'object' ? j.technician?.name : (j.techName || j.tech || 'Unassigned'),
        date: j.scheduledDate
          ? new Date(j.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : (j.date || ''),
        customer: typeof j.customer === 'object' ? j.customer?.name : (j.customerName || j.customer || ''),
      }));
      setAllJobs(data);
    }).catch(() => {});
  }, []);

  const busy      = dispatchData.filter(t => t.status === 'busy');
  const available = dispatchData.filter(t => t.status === 'available');
  const off       = dispatchData.filter(t => t.status === 'off');
  const stats     = getStats(busy, available, off, unassigned);

  // ── Detail view ───────────────────────────────────────────────────────────
  if (openTech) {
    const tech = dispatchData.find(t => t.techId === openTech);
    if (!tech) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: COLORS.muted, fontSize: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
          <div>Loading technician details…</div>
          <button onClick={() => setOpenTech(null)}
            style={{ marginTop: 16, padding: '7px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer', fontSize: 13, color: COLORS.muted }}>
            ← Back to Dispatch
          </button>
        </div>
      </div>
    );
    return (
      <TechDetailView
        tech={tech}
        allJobs={allJobs}
        onBack={() => setOpenTech(null)}
        openModal={openModal}
        isMobile={isMobile}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="fu" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Dispatch Board</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
            Live field operations — real-time technician tracking &amp; job assignment
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 7 }}>
            <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>Live</span>
          </div>
          <button className="btn" onClick={() => openModal('new_job')}
            style={{ padding: '9px 18px', borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}>
            + New Job
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="dispatch-stats-grid">
        {stats.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', border: `1px solid ${s.color}20` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="dispatch-main-grid">

        {/* ── Technician cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dispatchData.map(tech => {
            const isSelected  = selected === tech.techId;
            const statusColor = tech.status === 'busy' ? COLORS.brand : tech.status === 'available' ? '#22C55E' : '#94A3B8';
            const statusBg    = tech.status === 'busy' ? COLORS.brandL : tech.status === 'available' ? '#ECFDF5' : '#F1F5F9';

            return (
              <div key={tech.techId}
                onClick={() => setSelected(isSelected ? null : tech.techId)}
                style={{ background: COLORS.white, borderRadius: 14, border: `2px solid ${isSelected ? COLORS.brand : COLORS.border}`, padding: '16px 18px', cursor: 'pointer', boxShadow: isSelected ? `0 0 0 3px ${COLORS.brand}20` : '0 1px 4px rgba(0,0,0,.05)', transition: 'all .15s' }}
              >
                <div className="dispatch-tech-card-inner">

                  {/* Avatar + status dot */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar name={tech.name} size={44} color={statusColor} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: statusColor, border: '2px solid white' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>{tech.name}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: statusBg, color: statusColor, padding: '2px 8px', borderRadius: 99 }}>
                        {TECH_STATUS[tech.status]?.label || tech.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>📍 {tech.area} · 📱 {tech.phone}</div>
                    <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 8 }}>🚗 {tech.vehicle} · <BatteryIcon pct={tech.battery} /></div>

                    {tech.currentJob && (
                      <div style={{ background: COLORS.brandL, borderRadius: 9, padding: '10px 12px', border: `1px solid ${COLORS.brand}30`, marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.brand }}>CURRENT JOB</span>
                          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.brand }}>{tech.currentJob.id}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1 }}>{tech.currentJob.customer}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>📍 {tech.currentJob.address}</div>
                        <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 11, flexWrap: 'wrap' }}>
                          <span style={{ color: COLORS.body }}>⏱ Started: {tech.currentJob.startTime}</span>
                          <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ ETA: {tech.currentJob.eta}</span>
                        </div>
                      </div>
                    )}

                    {tech.nextJob && (
                      <div style={{ background: '#F1F5F9', borderRadius: 9, padding: '8px 12px', border: `1px solid ${COLORS.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, marginBottom: 3 }}>NEXT JOB</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{tech.nextJob.customer} — {tech.nextJob.type}</div>
                        {tech.nextJob.priority === 'urgent' && (
                          <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', padding: '2px 6px', borderRadius: 99 }}>
                            🚨 URGENT
                          </span>
                        )}
                      </div>
                    )}

                    {!tech.currentJob && !tech.nextJob && tech.status === 'available' && (
                      <div style={{ background: '#ECFDF5', borderRadius: 9, padding: '8px 12px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>✅</span>
                        <span style={{ fontSize: 12, color: '#15803D', fontWeight: 600 }}>Available – ready to be assigned</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="dispatch-tech-actions">
                    <button className="btn"
                      onClick={e => { e.stopPropagation(); setOpenTech(tech.techId); }}
                      style={{ padding: '6px 12px', borderRadius: 7, background: '#F1F5F9', color: COLORS.muted, fontSize: 11, fontWeight: 600, border: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap' }}>
                      👁 View
                    </button>
                    <button className="btn"
                      onClick={e => { e.stopPropagation(); openModal('new_job'); }}
                      style={{ padding: '6px 12px', borderRadius: 7, background: COLORS.brand, color: 'white', fontSize: 11, fontWeight: 700, border: 'none', whiteSpace: 'nowrap' }}>
                      Assign Job
                    </button>
                    <button className="btn"
                      onClick={e => e.stopPropagation()}
                      style={{ padding: '6px 12px', borderRadius: 7, background: '#F1F5F9', color: COLORS.muted, fontSize: 11, fontWeight: 600, border: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap' }}>
                      📞 Call
                    </button>
                    <div style={{ fontSize: 9, color: COLORS.faint, textAlign: 'center' }}>Updated {tech.lastUpdate}</div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right panel ── */}
        <div>

          {/* Unassigned jobs */}
          <div style={{ background: '#1A1A2E', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginBottom: 12 }}>⚠️ Unassigned Jobs</div>

            {unassigned.length === 0
              ? <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: 16 }}>All jobs assigned ✓</div>
              : unassigned.map(j => (
                <div key={j.id} style={{ background: '#252540', borderRadius: 10, padding: '12px 14px', marginBottom: 9, border: `1px solid ${j.priority === 'urgent' ? '#EF444440' : '#2A2A4A'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.brand }}>{j.id}</span>
                    <PBadge p={j.priority} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginBottom: 3 }}>{j.customer}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>{j.type} · {j.date} {j.time}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 10 }}>📍 {j.address}</div>

                  <select style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #2A2A4A', background: '#1A1A2E', color: '#94A3B8', fontSize: 11, marginBottom: 7 }}>
                    <option value="">Assign technician…</option>
                    {available.map(t => (
                      <option key={t.techId} value={t.techId}>
                        {t.name} – {t.area}
                      </option>
                    ))}
                  </select>

                  <button className="btn" onClick={() => openModal('new_job')}
                    style={{ width: '100%', padding: '7px', borderRadius: 7, background: COLORS.brand, color: 'white', fontSize: 11, fontWeight: 700, border: 'none' }}>
                    ✓ Assign
                  </button>
                </div>
              ))
            }
          </div>

          {/* Today's Job Flow */}
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Today's Job Flow</div>

            {allJobs.filter(j => j.date === 'Mar 3, 2026').map((j, i, arr) => (
              <div key={j.id || `job-${i}`} style={{ display: 'flex', gap: 10, paddingBottom: i < arr.length - 1 ? 12 : 0, position: 'relative' }}>
                {i < arr.length - 1 && (
                  <div style={{ position: 'absolute', left: 10, top: 22, bottom: 0, width: 2, background: COLORS.border }} />
                )}
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: j.status === 'completed' ? '#22C55E' : j.status === 'in_progress' ? COLORS.brand : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white', flexShrink: 0, zIndex: 1 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1 }}>{j.customer}</div>
                  <div style={{ fontSize: 10, color: COLORS.muted }}>{j.tech} · {j.time}</div>
                </div>
                <SBadge s={j.status} map={JOB_STATUS} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DispatchBoard;