// ✅ FIXED: `recruitment` was used but never imported/defined → crashes on load

import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { recruitmentApi } from '../../services/api';

// ─── Stage config (was in mockData) ───────────────────────────────────────────
const STAGE_CFG = {
  applied:   { label: 'Applied',   color: '#6B7280', bg: '#F3F4F6' },
  screening: { label: 'Screening', color: '#D97706', bg: '#FFFBEB' },
  interview: { label: 'Interview', color: '#2563EB', bg: '#EFF6FF' },
  offer:     { label: 'Offer',     color: '#7C3AED', bg: '#F5F3FF' },
  hired:     { label: 'Hired',     color: '#16A34A', bg: '#F0FDF4' },
  rejected:  { label: 'Rejected',  color: '#DC2626', bg: '#FEF2F2' },
};
const STAGE_STEPS = ['applied','screening','interview','offer','hired','rejected'];

// ─── RecruitmentPage ────────────────────────────────────────────────────────
const RecruitmentPage = ({ openModal }) => {
  
  const [recruitment, setRecruitment] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

 useEffect(() => {
  recruitmentApi.list({ limit: 500 }).then(res => {
    const applicants = res?.data || res || [];

    // Group flat applicants by position → build job objects
    const jobMap = {};
    applicants.forEach(a => {
      const role = a.position || 'Unknown Role';
      if (!jobMap[role]) {
        jobMap[role] = {
          id: role,
          role,
          department: a.department || '',
          status: 'active',
          type: 'Full-time',
          location: 'On-site',
          salary: 'N/A',
          openings: 1,
          posted: a.createdAt?.slice(0, 10) || '',
          deadline: 'N/A',
          applicants: [],
        };
      }
      jobMap[role].applicants.push({
        name: a.name,
        stage: a.stage || 'applied',
        exp: `${a.experience ?? 0} yrs`,
        applied: a.createdAt?.slice(0, 10) || '',
        skills: a.skills || [],
        notes: a.notes || '',
        email: a.email,
        phone: a.phone,
      });
    });

    setRecruitment(Object.values(jobMap));
  }).catch(err => console.error(err))
  .finally(() => setLoadingData(false));
}, []);

  const [openJob,        setOpenJob]        = useState(null);
  const [openApplicant,  setOpenApplicant]  = useState(null);

  const activeJobs    = recruitment.filter(r => r.status === 'active');
  const closedJobs    = recruitment.filter(r => r.status === 'closed');
  const allApplicants = recruitment.flatMap(r => r.applicants ?? []);
  const job           = openJob ? recruitment.find(r => r.id === openJob) : null;

  if (job) {
    const applicant = openApplicant ? (job.applicants ?? []).find(a => a.name === openApplicant) : null;
    return (
      <div className="fi">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <BackBtn onClick={() => { setOpenJob(null); setOpenApplicant(null); }} />
          <span style={{ fontSize: 14, color: COLORS.muted }}>Recruitment /</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.brand }}>{job.role}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
          <div>
            {/* Role header */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: job.status === 'active' ? '#F0FDF4' : '#F1F5F9', color: job.status === 'active' ? '#16A34A' : '#64748B', padding: '3px 9px', borderRadius: 99, marginBottom: 8, display: 'inline-block' }}>{job.status.toUpperCase()}</span>
                  <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.h1 }}>{job.role}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>{job.department} · {job.type} · {job.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: COLORS.faint }}>Salary Range</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.brand }}>{job.salary}</div>
                  <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 2 }}>Openings: {job.openings}</div>
                </div>
              </div>
            </div>
            {/* Applicants pipeline */}
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 14 }}>{job.applicants.length} Applicants</div>
              {/* Pipeline steps */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 6 }}>
                {STAGE_STEPS.map((s, i) => {
                  const cfg   = STAGE_CFG[s];
                  const count = job.applicants.filter(a => a.stage === s).length;
                  return (
                    <div key={s} style={{ flex: 1, minWidth: 80, textAlign: 'center', padding: '8px 6px', borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: cfg.color }}>{count}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: cfg.color }}>{cfg.label}</div>
                    </div>
                  );
                })}
              </div>
              {job.applicants.map(a => {
                const cfg = STAGE_CFG[a.stage] || STAGE_CFG.applied;
                return (
                  <div key={a.name} className="card" onClick={() => setOpenApplicant(a.name)} style={{ background: COLORS.bg, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '13px 15px', marginBottom: 9, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Avatar name={a.name} size={34} color={COLORS.brand} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{a.name}</div>
                          <div style={{ fontSize: 11, color: COLORS.muted }}>{a.exp} experience · Applied {a.applied}</div>
                        </div>
                      </div>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
                      {(a.skills || []).map(sk => <span key={sk} style={{ fontSize: 10, fontWeight: 600, background: COLORS.brandL, color: COLORS.brandD, padding: '2px 7px', borderRadius: 99 }}>{sk}</span>)}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic' }}>{a.notes}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      {STAGE_STEPS.filter(s => s !== a.stage && s !== 'rejected').slice(0, 2).map(s => (
                        <button key={s} className="btn" onClick={e => { e.stopPropagation(); openModal('report', { title: `Move to ${STAGE_CFG[s].label}`, format: 'Update' }); }} style={{ padding: '5px 12px', borderRadius: 6, background: STAGE_CFG[s].bg, color: STAGE_CFG[s].color, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer' }}>→ {STAGE_CFG[s].label}</button>
                      ))}
                      <button className="btn" onClick={e => { e.stopPropagation(); openModal('report', { title: `Reject ${a.name}`, format: 'Update' }); }} style={{ padding: '5px 12px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer' }}>✕ Reject</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Job Details</div>
              {[['Posted', job.posted], ['Deadline', job.deadline], ['Department', job.department], ['Openings', job.openings], ['Type', job.type], ['Location', job.location]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 11, color: COLORS.faint }}>{k}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.h2 }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn" onClick={() => openModal('report', { title: 'Post New Opening', format: 'Create' })} style={{ padding: '10px', borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 12, fontWeight: 700 }}>+ Post on Job Boards</button>
            <button className="btn" onClick={() => openModal('new_tech')} style={{ padding: '10px', borderRadius: 9, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 12, fontWeight: 700 }}>✓ Onboard as Technician</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fu">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Recruitment</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Hiring pipeline for technicians & office staff</div>
        </div>
        <button className="btn" onClick={() => openModal('report', { title: 'Create Job Opening', format: 'Create' })} style={{ padding: '9px 20px', borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40` }}>+ Job Opening</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Open Positions',  value: activeJobs.reduce((s, r) => s + r.openings, 0),                   icon: '📢', color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Total Applicants',value: allApplicants.length,                                               icon: '👤', color: COLORS.brand, bg: COLORS.brandL },
          { label: 'In Interview',    value: allApplicants.filter(a => a.stage === 'interview').length,          icon: '🎙', color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Hired This Cycle',value: allApplicants.filter(a => a.stage === 'hired').length,             icon: '✅', color: '#16A34A', bg: '#F0FDF4' },
        ].map(s => <KCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} iconBg={s.bg} />)}
      </div>

      {activeJobs.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Active Job Openings</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
            {activeJobs.map(r => (
              <div key={r.id} className="card" onClick={() => setOpenJob(r.id)} style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '16px 18px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1, lineHeight: 1.3 }}>{r.role}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>{r.department} · {r.location} · {r.type}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#F0FDF4', color: '#16A34A', padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.brand, marginBottom: 8 }}>{r.salary}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 11, color: COLORS.muted }}>{r.applicants.length} applicants</span>
                    <span style={{ fontSize: 11, color: '#16A34A' }}>{r.applicants.filter(a => a.stage === 'hired').length} hired</span>
                  </div>
                  <span style={{ fontSize: 10, color: COLORS.faint }}>Deadline: {r.deadline}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 8, overflowX: 'auto' }}>
                  {STAGE_STEPS.map(s => {
                    const c   = r.applicants.filter(a => a.stage === s).length;
                    const cfg = STAGE_CFG[s];
                    if (!c) return null;
                    return <span key={s} style={{ fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color, padding: '2px 7px', borderRadius: 99, flexShrink: 0 }}>{cfg.label}: {c}</span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {closedJobs.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.muted, marginBottom: 10 }}>Closed Positions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
            {closedJobs.map(r => (
              <div key={r.id} className="card" onClick={() => setOpenJob(r.id)} style={{ background: '#F9FAFB', borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '14px 16px', cursor: 'pointer', opacity: 0.8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{r.role}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3, marginBottom: 8 }}>{r.department} · {r.location}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                  <span style={{ color: COLORS.muted }}>{r.applicants.length} applied</span>
                  <span style={{ color: '#16A34A' }}>{r.applicants.filter(a => a.stage === 'hired').length} hired</span>
                  <span style={{ color: '#DC2626' }}>{r.applicants.filter(a => a.stage === 'rejected').length} rejected</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentPage;