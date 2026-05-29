import { JOB_STATUS, TECH_STATUS } from '../constants/statusMaps';
import { amcApi, complaintsApi, contractsApi, invoicesApi, jobsApi, leadsApi, quotationsApi, techsApi, ticketsApi } from '../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, PBadge, Avatar } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../components/ui/Form';
import { RevenueChart, Donut } from '../components/charts/Charts';
import {
  jobs, invoices, quotations, complaints, tickets,
  leads, technicians, amcContracts, contracts,
  REVENUE_MONTHLY as revenueData,
} from '../data/mockData';

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
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtClockDur(totalSecs) {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(x => String(x).padStart(2, '0')).join(':');
}

const JOB_TYPES = [
  { type: 'Service',      count: 52, pct: 47, color: '#F97316' },
  { type: 'Repair',       count: 28, pct: 25, color: '#3B82F6' },
  { type: 'Installation', count: 18, pct: 16, color: '#10B981' },
  { type: 'AMC Visit',    count: 12, pct: 11, color: '#8B5CF6' },
];

// ─── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard = ({ setPage, openModal, clockProps }) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { clockStatus, clockInTime, totalBreakSecs, breakStartTime } = clockProps || {};
  const [clkElap, setClkElap] = useState(0);
  const [brkElap, setBrkElap] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (clockInTime) setClkElap(Math.floor((Date.now() - clockInTime.getTime()) / 1000));
      if (clockStatus === 'break' && breakStartTime)
        setBrkElap(Math.floor((Date.now() - breakStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [clockInTime, clockStatus, breakStartTime]);

  const netSecs = Math.max(0, clkElap - (totalBreakSecs || 0) - (clockStatus === 'break' ? brkElap : 0));
  const todayJobs     = jobs.filter(j => j.date === 'Mar 3, 2026');
  const openJobs      = jobs.filter(j => !['completed', 'cancelled', 'invoiced'].includes(j.status)).length;
  const overdueInv    = invoices.filter(i => i.status === 'overdue').length;
  const pendingQuots  = quotations.filter(q => q.status === 'sent').length;
  const openComps     = complaints.filter(c => c.status === 'open').length;
  const openTkts      = tickets.filter(t => t.status === 'open').length;
  const hotLeads      = leads.filter(l => l.temp === 'hot' && !['won', 'lost'].includes(l.stage));
  const expiringAMC   = amcContracts.filter(a => a.status === 'expiring');
  const pendingSig    = contracts.filter(c => c.status === 'pending_signature');

  const clkColor  = { in: '#16A34A', break: '#D97706', out: COLORS.faint }[clockStatus || 'out'];
  const clkBg     = { in: '#ECFDF5', break: '#FFFBEB', out: COLORS.bg }[clockStatus || 'out'];
  const clkLabel  = { in: 'Clocked In', break: 'On Break', out: 'Not Clocked In' }[clockStatus || 'out'];

  // ── Responsive grid columns ──────────────────────────────────────────────
  const kpiCols   = isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(6,1fr)';
  const row2Cols  = isMobile || isTablet ? '1fr' : '1fr 300px';
  const row3Cols  = isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 280px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 10 : 0,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: COLORS.h1 }}>
            Good Morning, Admin 👋
          </div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>
            Monday, 3 March 2026 · CoolTech AC Services
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <button
            className="btn"
            onClick={() => setPage('dispatch')}
            style={{
              flex: isMobile ? 1 : 'none',
              padding: isMobile ? '8px 12px' : '9px 18px',
              borderRadius: 9,
              background: '#1A1A2E',
              color: '#FDBA74',
              fontSize: isMobile ? 12 : 13,
              fontWeight: 700,
            }}
          >
            🚐 Dispatch Board
          </button>
          <button
            className="btn"
            onClick={() => openModal('new_job')}
            style={{
              flex: isMobile ? 1 : 'none',
              padding: isMobile ? '8px 12px' : '10px 22px',
              borderRadius: 10,
              background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
              color: 'white',
              fontSize: isMobile ? 12 : 13,
              fontWeight: 700,
              boxShadow: `0 4px 14px ${COLORS.brand}50`,
            }}
          >
            + New Job
          </button>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: kpiCols, gap: isMobile ? 8 : 12 }}>
        <KCard label="Today's Jobs"     value={todayJobs.length} sub="scheduled"        icon="📋" iconBg="#FFF7ED" color={COLORS.brand}  delay="" />
        <KCard label="Open Jobs"        value={openJobs}         sub="need action"       icon="🔧" iconBg="#EFF6FF" color="#3B82F6"        delay="1" />
        <KCard label="Pending Quotes"   value={pendingQuots}     sub="awaiting approval" icon="📄" iconBg="#F0FDF4" color="#16A34A"        delay="2" />
        <KCard label="Overdue Invoices" value={overdueInv}       sub="payment pending"   icon="⚠️" iconBg="#FEF2F2" color="#DC2626"        delay="3" />
        <KCard label="Open Tickets"     value={openTkts}         sub="customer support"  icon="🎫" iconBg="#F5F3FF" color="#7C3AED"        delay="3" />
        <KCard label="Revenue (Feb)"    value="₹2.03L"           sub="+14% vs Jan"       icon="💰" iconBg="#FEFCE8" color="#CA8A04"        delay="4" />
      </div>

      {/* ── Clock In/Out Banner ─────────────────────────────────────────────── */}
      <div
        onClick={() => setPage('clock')}
        style={{
          background: clockStatus === 'in'
            ? 'linear-gradient(135deg,#ECFDF5,#D1FAE5)'
            : clockStatus === 'break'
            ? 'linear-gradient(135deg,#FFFBEB,#FEF3C7)'
            : `linear-gradient(135deg,${COLORS.brandL},#FFE4C4)`,
          border: `1.5px solid ${clockStatus === 'in' ? '#A7F3D0' : clockStatus === 'break' ? '#FDE68A' : `${COLORS.brand}30`}`,
          borderRadius: 14,
          padding: isMobile ? '12px 14px' : '14px 20px',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 10 : 0,
          cursor: 'pointer',
          transition: 'all .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: clkBg, border: `2px solid ${clkColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>⏱</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>My Attendance Today</div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: COLORS.muted, marginTop: 2, lineHeight: 1.4 }}>
              {clockStatus === 'in' && clockInTime
                ? `Clocked in at ${clockInTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} — working`
                : clockStatus === 'break'
                ? 'Currently on break — resume when ready'
                : 'Not yet clocked in — click here or use the button in the header'}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, alignSelf: isMobile ? 'flex-end' : 'center' }}>
          {clockStatus !== 'out' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: isMobile ? 20 : 26, fontWeight: 700, color: clkColor, lineHeight: 1 }}>
                {fmtClockDur(netSecs)}
              </div>
              <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 2 }}>work time</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: clkBg }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: clkColor, display: 'block', animation: clockStatus === 'in' ? 'blink 1.6s ease-in-out infinite' : 'none' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: clkColor }}>{clkLabel}</span>
          </div>
          <span style={{ fontSize: 12, color: COLORS.muted }}>View →</span>
        </div>
      </div>

      {/* ── Row 2: Schedule + Technicians + Revenue ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: row2Cols, gap: 16 }}>

        {/* Today's Schedule */}
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.h1 }}>Today's Schedule</div>
            <button onClick={() => setPage('jobs')} style={{ fontSize: 12, color: COLORS.brand, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View all →</button>
          </div>
          {todayJobs.map(job => (
            <div key={job.id} style={{
              padding: '12px 14px',
              borderBottom: `1px solid ${COLORS.border}22`,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 10 : 14,
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.brandL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {job.type === 'Repair' ? '🔧' : job.type === 'Installation' ? '📦' : job.type === 'AMC Visit' ? '📋' : '❄️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{job.customer}</span>
                  <TypeTag type={job.type} />
                  {job.priority === 'urgent' && <PBadge p="urgent" />}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📍 {job.address} · {job.issue.slice(0, isMobile ? 30 : 50)}…
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-end', gap: isMobile ? 8 : 3, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>{job.time}</div>
                <SBadge s={job.status} map={JOB_STATUS} />
              </div>
              {!isMobile && (
                <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 12, color: job.tech === 'Unassigned' ? '#DC2626' : COLORS.muted, fontWeight: job.tech === 'Unassigned' ? 700 : 400 }}>
                  {job.tech === 'Unassigned' ? '⚠ Unassigned' : job.tech}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right panel: Technicians + Revenue */}
        <div style={{ display: 'flex', flexDirection: isTablet ? 'row' : 'column', gap: 14 }}>

          {/* Field Technicians */}
          <div style={{ flex: 1, background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>Field Technicians</div>
              <button onClick={() => setPage('dispatch')} style={{ fontSize: 11, color: COLORS.brand, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Dispatch →</button>
            </div>
            {technicians.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar name={t.name} size={32} color={t.status === 'available' ? '#10B981' : t.status === 'busy' ? COLORS.brand : '#94A3B8'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.h2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.faint }}>{t.area}</div>
                </div>
                <SBadge s={t.status} map={TECH_STATUS} />
              </div>
            ))}
          </div>

          {/* Revenue */}
          <div style={{ flex: 1, background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>Revenue</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.brand }}>₹2.03L</div>
                <div style={{ fontSize: 10, color: '#16A34A' }}>↑ 14% vs Jan</div>
              </div>
            </div>
            <RevenueChart data={revenueData} />
          </div>
        </div>
      </div>

      {/* ── Row 3: Needs Attention + Jobs Breakdown + Alerts ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: row3Cols, gap: 14 }}>

        {/* Needs Attention */}
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>⚡ Needs Attention</div>
          {[
            { label: 'JOB-1039 – TechPark urgent & unassigned',            action: 'Assign',    color: '#DC2626', bg: '#FEF2F2', modal: 'new_job' },
            { label: 'QT-0084 – Anand Bakery quote awaiting approval',      action: 'Follow Up', color: '#C2410C', bg: '#FFF7ED', modal: 'send_quotation', data: { id: 'QT-0084' } },
            { label: 'INV-2039 – City Mall invoice overdue (₹17,700)',       action: 'Collect',   color: '#B45309', bg: '#FFFBEB', modal: 'report', data: { title: 'Collect INV-2039', format: 'Update' } },
            { label: 'CMP-041 – TechPark complaint unresolved (3 days)',     action: 'Resolve',   color: '#7C3AED', bg: '#F5F3FF', modal: 'resolve_complaint', data: { id: 'CMP-041' } },
            { label: 'AMC-186 – Galaxy Towers contract expiring soon',       action: 'Renew',     color: '#0369A1', bg: '#EFF6FF', modal: 'new_amc' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: a.bg, marginBottom: 7 }}>
              <div style={{ fontSize: 12, color: a.color, flex: 1, lineHeight: 1.5 }}>{a.label}</div>
              <button
                className="btn"
                onClick={() => openModal(a.modal, a.data || {})}
                style={{ padding: '4px 10px', borderRadius: 6, background: a.color, color: 'white', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {a.action}
              </button>
            </div>
          ))}
        </div>

        {/* Jobs Breakdown */}
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>Jobs Breakdown (March)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20 }}>
            <Donut data={JOB_TYPES} />
            <div style={{ flex: 1 }}>
              {JOB_TYPES.map(d => (
                <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: isMobile ? 12 : 13, color: COLORS.h2 }}>{d.type}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>{d.count}</div>
                  <div style={{ fontSize: 11, color: COLORS.faint, width: 30, textAlign: 'right' }}>{d.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right alerts column — on tablet spans full width as a row of 3 cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isTablet ? 'repeat(3,1fr)' : '1fr',
          gap: 10,
          gridColumn: isTablet ? '1 / -1' : 'auto',
        }}>

          {/* Hot Leads */}
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>🔥 Hot Leads</div>
              <button onClick={() => setPage('leads')} style={{ fontSize: 11, color: COLORS.brand, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View →</button>
            </div>
            {hotLeads.map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono, flexShrink: 0, marginLeft: 8 }}>₹{(l.value / 1000).toFixed(0)}K</span>
              </div>
            ))}
            {hotLeads.length === 0 && <div style={{ fontSize: 12, color: COLORS.faint, textAlign: 'center', padding: 8 }}>No hot leads right now</div>}
          </div>

          {/* Open Tickets */}
          <div style={{ background: '#FEF2F2', borderRadius: 14, border: '1px solid #FECACA', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>🎫 Open Tickets</div>
              <button onClick={() => setPage('tickets')} style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View →</button>
            </div>
            {tickets.filter(t => t.status === 'open').map(t => (
              <div key={t.id} style={{ fontSize: 11, color: '#991B1B', padding: '5px 0', borderBottom: '1px solid #FECACA22', lineHeight: 1.4 }}>
                {t.id} – {t.subject.slice(0, 40)}…
              </div>
            ))}
          </div>

          {/* Pending Signatures */}
          {pendingSig.length > 0 && (
            <div style={{ background: '#FFFBEB', borderRadius: 14, border: '1px solid #FDE68A', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>✍ Pending Signatures</div>
                <button onClick={() => setPage('contracts')} style={{ fontSize: 11, color: '#B45309', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View →</button>
              </div>
              {pendingSig.map(c => (
                <div key={c.id} style={{ fontSize: 11, color: '#92400E', padding: '4px 0', lineHeight: 1.4 }}>
                  {c.id} – {c.customer}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;