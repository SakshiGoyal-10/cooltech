import { useState, useEffect, useMemo, useCallback } from 'react';
import { attendanceApi } from '../../services/api';
import { technicians } from '../../data/mockData';
import { COLORS, FONTS } from '../../constants/tokens';
import { Avatar } from '../../components/ui/Badges';
import { SectionHdr } from '../../components/ui/Cards';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const YEARS        = [2025, 2026, 2027];
const STATUS_CYCLE = ['', 'P', 'A', 'HD', 'L', 'Late', 'H'];

const STATUS_MAP = {
  present:    'P',
  absent:     'A',
  halfday:    'HD',
  'half-day': 'HD',
  half_day:   'HD',
  leave:      'L',
  late:       'Late',
  holiday:    'H',
  P: 'P', A: 'A', HD: 'HD', L: 'L', Late: 'Late', H: 'H',
};

// Reverse map: display code → backend status string
const CODE_TO_BACKEND = {
  P:    'present',
  A:    'absent',
  HD:   'halfday',
  L:    'leave',
  Late: 'late',
  H:    'holiday',
  '':   null,
};

const STATUS_META = {
  P:    { label: 'Present',  color: '#16A34A', bg: '#F0FDF4', border: '#16A34A30' },
  A:    { label: 'Absent',   color: '#DC2626', bg: '#FEF2F2', border: '#DC262630' },
  HD:   { label: 'Half Day', color: '#B45309', bg: '#FFFBEB', border: '#B4530930' },
  H:    { label: 'Holiday',  color: '#7C3AED', bg: '#F5F3FF', border: '#7C3AED30' },
  L:    { label: 'Leave',    color: '#0369A1', bg: '#EFF6FF', border: '#0369A130' },
  Late: { label: 'Late',     color: '#D97706', bg: '#FEF3C7', border: '#D9770630' },
  '':   { label: '—',        color: '#CBD5E1', bg: '#F8FAFC', border: '#E5E7EB20' },
};

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDayOfWeek(day, month, year) {
  return new Date(year, month, day).getDay();
}
function isWeekend(day, month, year) {
  const d = getDayOfWeek(day, month, year);
  return d === 0 || d === 6;
}
function getWorkingDays(month, year) {
  const total = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= total; d++) if (!isWeekend(d, month, year)) count++;
  return count;
}

/** Build a YYYY-MM-DD string without any timezone conversion */
function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * FIX 1 — Timezone-safe date parsing.
 *
 * `new Date(isoString).getDate()` converts to *local* time, which in IST
 * (UTC+5:30) can push a midnight-UTC record to the previous calendar day.
 * We split the ISO string on 'T' and '-' to get the raw YYYY / MM / DD parts.
 */
function parseISODay(isoString, year, month) {
  if (!isoString) return null;
  const datePart = String(isoString).split('T')[0]; // "2026-05-14"
  const parts    = datePart.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1; // 0-indexed
  const d = parseInt(parts[2], 10);
  return y === year && m === month ? d : null;
}

/**
 * FIX 2 — Transform: flat per-day API records → per-technician grouped.
 * Only builds the `dates` map; counters are derived after.
 */
function transformRecords(rawRecords, month, year) {
  const map = {};

  rawRecords.forEach(rec => {
    let techId, name, role;

    if (rec.technician && typeof rec.technician === 'object') {
      techId = String(rec.technician._id || rec.technician.id || '');
      name   = rec.technician.name || rec.technician.fullName || rec.technician.username || 'Unknown';
      role   = rec.technician.role || rec.technician.department || 'Technician';
    } else {
      techId = String(rec.technician || rec.techId || rec._id || '');
      const local = (technicians ?? []).find(t => String(t.id || t._id) === techId);
      name   = local?.name || 'Unknown';
      role   = local?.role || local?.department || 'Technician';
    }

    if (!techId) return;

    // Timezone-safe day extraction
    const dayNum = rec.date
      ? parseISODay(rec.date, year, month)
      : rec.day != null ? Number(rec.day) : null;

    const rawStatus = String(rec.status || '').toLowerCase().trim();
    const code      = STATUS_MAP[rec.status] || STATUS_MAP[rawStatus] || '';

    if (!map[techId]) {
      const local = (technicians ?? []).find(t => String(t.id || t._id) === techId);
      map[techId] = {
        techId,
        name:  local?.name || name,
        role:  local?.role || local?.department || role,
        dates: {},
      };
    }

    if (dayNum !== null && code) {
      map[techId].dates[dayNum] = code;
    }
  });

  return Object.values(map).map(withCounters);
}

/** Derive presentDays / absentDays / leaves from dates map */
function withCounters(t) {
  const vals = Object.values(t.dates);
  return {
    ...t,
    presentDays: vals.filter(v => v === 'P').length,
    absentDays:  vals.filter(v => v === 'A').length,
    leaves:      vals.filter(v => v === 'L').length,
  };
}

/** Extract array from any API response wrapper shape */
function extractArray(r) {
  if (!r)                          return [];
  if (Array.isArray(r))            return r;
  if (Array.isArray(r.data))       return r.data;
  if (Array.isArray(r.attendance)) return r.attendance;
  if (Array.isArray(r.records))    return r.records;
  if (Array.isArray(r.items))      return r.items;
  if (Array.isArray(r.results))    return r.results;
  const first = Object.values(r).find(v => Array.isArray(v));
  return first ?? [];
}

// ─── Legend Pill ──────────────────────────────────────────────────────────────

const LegendPill = ({ code }) => {
  const m = STATUS_META[code];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
        color: m.color, background: m.bg, border: `1px solid ${m.border}`,
        letterSpacing: '0.04em',
      }}>
        {code || '—'}
      </div>
      <span style={{ fontSize: 11, color: COLORS.muted }}>{m.label}</span>
    </div>
  );
};

// ─── Attendance Cell ──────────────────────────────────────────────────────────

const AttCell = ({ status, onClick, isToday, isWeekend: weekend, saving }) => {
  const m       = STATUS_META[status] || STATUS_META[''];
  const isBlank = !status;
  return (
    <div
      onClick={saving ? undefined : onClick}
      title={m.label}
      style={{
        width: 26, height: 24, borderRadius: 4,
        background:  weekend && isBlank ? '#F1F5F9' : m.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700,
        color:   weekend && isBlank ? '#CBD5E1' : m.color,
        margin:  '0 auto',
        cursor:  saving ? 'wait' : 'pointer',
        border:  `1px solid ${isToday ? COLORS.brand : (weekend && isBlank ? '#E2E8F0' : m.border)}`,
        opacity: saving ? 0.6 : weekend && isBlank ? 0.5 : 1,
        transition: 'transform 0.1s, box-shadow 0.1s',
        boxShadow: isToday ? `0 0 0 2px ${COLORS.brand}33` : 'none',
      }}
      onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'scale(1.18)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = isToday ? `0 0 0 2px ${COLORS.brand}33` : 'none'; }}
    >
      {saving ? '…' : status === 'Late' ? '⚠' : status === 'H' ? '🎉' : (status || (weekend ? '—' : '·'))}
    </div>
  );
};

// ─── Attendance Bar ───────────────────────────────────────────────────────────

const AttBar = ({ pct }) => {
  const safe  = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  const color = safe >= 90 ? '#10B981' : safe >= 75 ? COLORS.brand : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
      <div style={{ width: 44, height: 5, background: '#EEF2FF', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: `${safe}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, fontFamily: FONTS.mono, color, minWidth: 34 }}>{safe}%</span>
    </div>
  );
};

// ─── View Toggle Button ───────────────────────────────────────────────────────

const ViewBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} title={label} style={{
    width: 34, height: 34, borderRadius: 7,
    border:     `1px solid ${active ? COLORS.brand : COLORS.border}`,
    background: active ? COLORS.brand : COLORS.white,
    color:      active ? 'white' : COLORS.muted,
    fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  }}>{icon}</button>
);

// ─── Per-Person Card View ─────────────────────────────────────────────────────

const PersonView = ({ data, workingDays }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
    {data.map(a => {
      const pct       = workingDays > 0 ? Math.round((a.presentDays / workingDays) * 100) : 0;
      const lateCount = Object.values(a.dates || {}).filter(v => v === 'Late').length;
      const hdCount   = Object.values(a.dates || {}).filter(v => v === 'HD').length;
      const lowAtt    = pct < 75;
      return (
        <div key={a.techId} style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${lowAtt ? '#FCA5A520' : COLORS.border}`,
          padding: '16px',
          boxShadow: lowAtt ? '0 1px 4px #EF444420' : '0 1px 4px rgba(0,0,0,.05)',
          position: 'relative', overflow: 'hidden',
        }}>
          {lowAtt && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#EF4444,#F97316)' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar name={a.name} size={36} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{a.name.split(' ')[0]}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{a.role}</div>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
              <span style={{ color: COLORS.muted }}>Attendance</span>
              <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: pct >= 90 ? '#16A34A' : pct >= 75 ? COLORS.brand : '#DC2626' }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? '#10B981' : pct >= 75 ? COLORS.brand : '#EF4444', borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {[
              { label: 'P',  val: a.presentDays, color: '#16A34A', bg: '#F0FDF4' },
              { label: 'A',  val: a.absentDays,  color: '#DC2626', bg: '#FEF2F2' },
              { label: 'HD', val: hdCount,        color: '#B45309', bg: '#FFFBEB' },
              { label: 'L',  val: a.leaves,       color: '#0369A1', bg: '#EFF6FF' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 6, padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: s.color, fontFamily: FONTS.mono }}>{s.val}</div>
                <div style={{ fontSize: 9, color: s.color, fontWeight: 600, marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {lateCount > 0 && <div style={{ marginTop: 8, fontSize: 11, color: '#D97706', fontWeight: 600 }}>⚠ {lateCount} late arrival{lateCount > 1 ? 's' : ''}</div>}
        </div>
      );
    })}
  </div>
);

// ─── Summary Table View ───────────────────────────────────────────────────────

const SummaryView = ({ data, workingDays }) => (
  <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#F9FAFB', borderBottom: `1px solid ${COLORS.border}` }}>
          {['Technician','Role','Present','Absent','Half Day','Leave','Late','Holidays','Att %'].map(h => (
            <th key={h} style={{
              padding: '10px 14px',
              textAlign: h === 'Technician' || h === 'Role' ? 'left' : 'center',
              fontSize: 11, fontWeight: 700, color: COLORS.muted, whiteSpace: 'nowrap',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((a, i) => {
          const pct      = workingDays > 0 ? Math.round((a.presentDays / workingDays) * 100) : 0;
          const hd       = Object.values(a.dates || {}).filter(v => v === 'HD').length;
          const late     = Object.values(a.dates || {}).filter(v => v === 'Late').length;
          const holidays = Object.values(a.dates || {}).filter(v => v === 'H').length;
          const lowAtt   = pct < 75;
          return (
            <tr key={a.techId} style={{
              borderBottom: `1px solid ${COLORS.border}22`,
              background: lowAtt ? '#FFF5F5' : i % 2 === 0 ? COLORS.white : '#FAFAFA',
            }}>
              <td style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={a.name} size={28} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.h2 }}>{a.name}</span>
                  {lowAtt && <span style={{ fontSize: 9, background: '#FEE2E2', color: '#DC2626', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>LOW</span>}
                </div>
              </td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: COLORS.muted }}>{a.role}</td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', fontFamily: FONTS.mono }}>{a.presentDays}</span></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', fontFamily: FONTS.mono }}>{a.absentDays}</span></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#B45309', fontFamily: FONTS.mono }}>{hd}</span></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#0369A1', fontFamily: FONTS.mono }}>{a.leaves}</span></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#D97706', fontFamily: FONTS.mono }}>{late}</span></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', fontFamily: FONTS.mono }}>{holidays}</span></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><AttBar pct={pct} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const AttendancePage = ({ openModal }) => {
  const today = new Date();

  const [rawRecords,   setRawRecords]   = useState([]);
  const [selTech,      setSelTech]      = useState('all');
  const [selMonth,     setSelMonth]     = useState(today.getMonth());
  const [selYear,      setSelYear]      = useState(today.getFullYear());
  const [selDept,      setSelDept]      = useState('all');
  const [viewMode,     setViewMode]     = useState('table');
  const [search,       setSearch]       = useState('');
  const [localData,    setLocalData]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  // Tracks which (techId, day) cells are mid-save so we show a spinner
  const [savingCells,  setSavingCells]  = useState(new Set());
  const [markingAll,   setMarkingAll]   = useState(false);
  const [saveError,    setSaveError]    = useState(null);

  // ── Fetch all records once ───────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    attendanceApi.list({ limit: 500 })
      .then(r => {
        const raw = extractArray(r);
        console.log(`[Attendance] ${raw.length} records. Sample:`, raw[0]);
        setRawRecords(raw);
      })
      .catch(err => {
        console.error('[Attendance] Fetch error:', err);
        setError(err.message || 'Failed to load attendance data');
      })
      .finally(() => setLoading(false));
  }, []);

  // ── FIX 2: Re-transform + merge with full technicians list ──────────────────
  //
  // Always seed from mockData so every technician appears even with zero records.
  // Then overlay whatever the API returned for the selected month/year.
  //
  useEffect(() => {
    const transformed = transformRecords(rawRecords, selMonth, selYear);
    const apiMap      = Object.fromEntries(transformed.map(t => [t.techId, t]));

    const merged = (technicians ?? []).map(t => {
      const id = String(t.id || t._id);
      return apiMap[id] ?? {
        techId:      id,
        name:        t.name,
        role:        t.role || t.department || 'Technician',
        dates:       {},
        presentDays: 0,
        absentDays:  0,
        leaves:      0,
      };
    });

    // Also include any API-returned techs not in mockData
    transformed.forEach(t => {
      if (!merged.find(m => m.techId === t.techId)) merged.push(t);
    });

    setLocalData(merged);
  }, [rawRecords, selMonth, selYear]);

  const days        = new Date(selYear, selMonth + 1, 0).getDate();
  const workingDays = getWorkingDays(selMonth, selYear);
  const dayLabels   = Array.from({ length: days }, (_, i) => i + 1);
  const todayDate   = today.getDate();

  const departments = ['all', ...new Set((technicians ?? []).map(t => t.department || 'Field Service'))];

  const shown = useMemo(() =>
    localData
      .filter(a => selTech === 'all' || a.techId === selTech)
      .filter(a => {
        if (selDept === 'all') return true;
        const tech = (technicians ?? []).find(t => String(t.id || t._id) === a.techId);
        return (tech?.department || 'Field Service') === selDept;
      })
      .filter(a => !search.trim() || a.name.toLowerCase().includes(search.trim().toLowerCase())),
  [localData, selTech, selDept, search]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalPresent  = shown.reduce((s, a) => s + (a.presentDays || 0), 0);
  const totalAbsent   = shown.reduce((s, a) => s + (a.absentDays  || 0), 0);
  const totalLeave    = shown.reduce((s, a) => s + (a.leaves      || 0), 0);
  const totalLate     = shown.reduce((s, a) => s + Object.values(a.dates || {}).filter(v => v === 'Late').length, 0);
  const totalHD       = shown.reduce((s, a) => s + Object.values(a.dates || {}).filter(v => v === 'HD').length, 0);
  const totalHolidays = shown.reduce((s, a) => s + Object.values(a.dates || {}).filter(v => v === 'H').length, 0);
  const avgAtt        = shown.length > 0 && workingDays > 0
    ? Math.round(shown.reduce((s, a) => s + ((a.presentDays || 0) / workingDays) * 100, 0) / shown.length)
    : 0;

  // ── FIX 3: cycleStatus — optimistic update + backend persist ────────────────
  const cycleStatus = useCallback((techId, day) => {
    const cellKey = `${techId}-${day}`;
    if (savingCells.has(cellKey)) return; // prevent double-clicks mid-save

    let nextCode = '';

    // 1) Optimistic local update
    setLocalData(prev => prev.map(a => {
      if (a.techId !== techId) return a;
      const cur  = (a.dates || {})[day] || '';
      const idx  = STATUS_CYCLE.indexOf(cur);
      nextCode   = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      return withCounters({ ...a, dates: { ...a.dates, [day]: nextCode } });
    }));

    // 2) Mark cell as saving
    setSavingCells(prev => new Set([...prev, cellKey]));
    setSaveError(null);

    const dateStr       = toDateStr(selYear, selMonth, day);
    const backendStatus = CODE_TO_BACKEND[nextCode];

    const done = () => setSavingCells(prev => { const s = new Set(prev); s.delete(cellKey); return s; });

    if (backendStatus) {
      // Upsert (create or update)
      attendanceApi.upsert({ technician: techId, date: dateStr, status: backendStatus })
        .then(done)
        .catch(err => {
          console.error('[Attendance] upsert failed:', err);
          setSaveError('Failed to save — please retry.');
          // Revert optimistic update
          setLocalData(prev => prev.map(a => {
            if (a.techId !== techId) return a;
            const cur  = (a.dates || {})[day] || '';
            const idx  = STATUS_CYCLE.indexOf(nextCode);
            const reverted = STATUS_CYCLE[(idx - 1 + STATUS_CYCLE.length) % STATUS_CYCLE.length];
            return withCounters({ ...a, dates: { ...a.dates, [day]: reverted } });
          }));
          done();
        });
    } else {
      // Blank status → delete the record
      attendanceApi.delete({ technician: techId, date: dateStr })
        .then(done)
        .catch(err => {
          console.error('[Attendance] delete failed:', err);
          setSaveError('Failed to delete — please retry.');
          done();
        });
    }
  }, [selYear, selMonth, savingCells]);

  // ── FIX 4: markAllPresent — optimistic update + backend persist ─────────────
  const markAllPresent = useCallback(() => {
    if (markingAll) return;
    setMarkingAll(true);
    setSaveError(null);

    const dateStr = toDateStr(selYear, selMonth, todayDate);

    setLocalData(prev => prev.map(a =>
      withCounters({ ...a, dates: { ...a.dates, [todayDate]: 'P' } })
    ));

    const saves = localData.map(a =>
      attendanceApi.upsert({ technician: a.techId, date: dateStr, status: 'present' })
        .catch(err => console.error('[Attendance] markAllPresent failed for', a.name, err))
    );

    Promise.allSettled(saves).then(() => setMarkingAll(false));
  }, [localData, selYear, selMonth, todayDate, markingAll]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: COLORS.muted, fontSize: 14 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
        Loading attendance data…
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '24px 32px' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>Failed to load attendance</div>
        <div style={{ fontSize: 12, color: '#EF4444' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop: 14, padding: '7px 18px', borderRadius: 8, background: '#DC2626', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  const filters = [
    { id: 'tech',  value: selTech,  onChange: v => setSelTech(v),    options: [{ value: 'all', label: 'All Technicians' }, ...(technicians ?? []).map(t => ({ value: String(t.id || t._id), label: t.name }))] },
    { id: 'dept',  value: selDept,  onChange: v => setSelDept(v),    options: departments.map(d => ({ value: d, label: d === 'all' ? 'All Depts' : d })) },
    { id: 'month', value: selMonth, onChange: v => setSelMonth(+v),  options: MONTHS.map((m, i) => ({ value: i, label: m })) },
    { id: 'year',  value: selYear,  onChange: v => setSelYear(+v),   options: YEARS.map(y => ({ value: y, label: String(y) })) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Save-error toast ─────────────────────────────────────────────────── */}
      {saveError && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, background: '#FEF2F2',
          border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>⚠️ {saveError}</span>
          <button onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 14, fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <SectionHdr
            title="Attendance"
            sub={`${MONTHS[selMonth]} ${selYear} · ${shown.length} Technician${shown.length !== 1 ? 's' : ''}`}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#EFF6FF', color: '#0369A1', fontWeight: 600, border: '1px solid #BFDBFE' }}>
              📅 {workingDays} working days
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F5F3FF', color: '#7C3AED', fontWeight: 600, border: '1px solid #DDD6FE' }}>
              🎉 {days - workingDays} weekends
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 3, background: COLORS.white }}>
            <ViewBtn active={viewMode === 'table'}   onClick={() => setViewMode('table')}   icon="☰" label="Calendar Grid" />
            <ViewBtn active={viewMode === 'person'}  onClick={() => setViewMode('person')}  icon="⊞" label="Per-Person Cards" />
            <ViewBtn active={viewMode === 'summary'} onClick={() => setViewMode('summary')} icon="⊟" label="Summary Table" />
          </div>

          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: COLORS.muted, pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search technician…"
              style={{ padding: '8px 12px 8px 30px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12, background: COLORS.white, color: COLORS.body, width: 170, outline: 'none' }}
            />
          </div>

          {filters.map(f => (
            <select
              key={f.id}
              value={f.value}
              onChange={e => f.onChange(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12, background: COLORS.white, color: COLORS.body, cursor: 'pointer' }}
            >
              {f.options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
            </select>
          ))}

          <button
            className="btn"
            onClick={() => openModal('report', { title: 'Attendance Report', format: 'CSV' })}
            style={{ padding: '8px 14px', borderRadius: 8, background: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Export
          </button>

          <button
            className="btn"
            onClick={markAllPresent}
            disabled={markingAll}
            style={{ padding: '8px 14px', borderRadius: 8, background: '#ECFDF5', border: '1px solid #16A34A40', color: '#16A34A', fontSize: 12, fontWeight: 700, cursor: markingAll ? 'wait' : 'pointer', opacity: markingAll ? 0.7 : 1 }}
          >
            {markingAll ? '⏳ Saving…' : '✓ Mark All Present'}
          </button>

          <button
            className="btn"
            onClick={() => openModal('mark_attendance')}
            style={{ padding: '8px 18px', borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 12, fontWeight: 700, boxShadow: `0 3px 10px ${COLORS.brand}40`, border: 'none', cursor: 'pointer' }}
          >
            + Mark Today
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Present',  value: totalPresent,  color: '#16A34A',    bg: '#ECFDF5',     icon: '✓' },
          { label: 'Total Absent',   value: totalAbsent,   color: '#DC2626',    bg: '#FEF2F2',     icon: '✗' },
          { label: 'Half Days',      value: totalHD,       color: '#B45309',    bg: '#FFFBEB',     icon: '½' },
          { label: 'On Leave',       value: totalLeave,    color: '#0369A1',    bg: '#EFF6FF',     icon: '📅' },
          { label: 'Late Arrivals',  value: totalLate,     color: '#D97706',    bg: '#FEF3C7',     icon: '⚠' },
          { label: 'Holidays',       value: totalHolidays, color: '#7C3AED',    bg: '#F5F3FF',     icon: '🎉' },
          { label: 'Avg Attendance', value: `${avgAtt}%`,  color: COLORS.brand, bg: COLORS.brandL, icon: '📊' },
        ].map(k => (
          <div key={k.label} style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.muted, lineHeight: 1.3 }}>{k.label}</div>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: FONTS.sans }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700 }}>Legend:</span>
        {Object.keys(STATUS_META).filter(k => k !== '').map(k => <LegendPill key={k} code={k} />)}
        <span style={{ fontSize: 11, color: COLORS.muted, marginLeft: 'auto' }}>💡 Click any cell to cycle status</span>
      </div>

      {/* ── Table View ────────────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: COLORS.muted, minWidth: 180, position: 'sticky', left: 0, background: '#F9FAFB', zIndex: 2, boxShadow: '2px 0 6px rgba(0,0,0,0.06)' }}>
                    Technician
                  </th>
                  {dayLabels.map(d => {
                    const isToday = d === todayDate && selMonth === today.getMonth() && selYear === today.getFullYear();
                    const weekend = isWeekend(d, selMonth, selYear);
                    return (
                      <th key={`hd-${d}`} style={{
                        padding: '7px 2px', textAlign: 'center', fontSize: 11, fontWeight: 700, width: 30,
                        color:      isToday ? 'white' : weekend ? '#A0AEC0' : COLORS.muted,
                        background: isToday ? COLORS.brand : weekend ? '#F8FAFC' : '#F9FAFB',
                        borderRadius: isToday ? 6 : 0,
                      }}>{d}</th>
                    );
                  })}
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#16A34A', minWidth: 28 }}>P</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#DC2626', minWidth: 28 }}>A</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#B45309', minWidth: 28 }}>HD</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#0369A1', minWidth: 28 }}>L</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: COLORS.muted, minWidth: 80 }}>Att %</th>
                </tr>
                <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: '5px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: COLORS.faint, position: 'sticky', left: 0, background: '#FAFAFA', zIndex: 2, boxShadow: '2px 0 6px rgba(0,0,0,0.06)' }}>
                    Dept: <span style={{ color: COLORS.body }}>{selDept === 'all' ? 'All' : selDept}</span>
                  </th>
                  {dayLabels.map(d => {
                    const dow = getDayOfWeek(d, selMonth, selYear);
                    return (
                      <th key={`dn-${d}`} style={{ padding: '4px 2px', textAlign: 'center', fontSize: 9, fontWeight: 600, color: (dow === 0 || dow === 6) ? '#CBD5E1' : COLORS.faint, background: '#FAFAFA' }}>
                        {DAY_NAMES[dow]}
                      </th>
                    );
                  })}
                  <th colSpan={5} />
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={days + 6} style={{ padding: '48px', textAlign: 'center', color: COLORS.faint, fontSize: 13 }}>
                      {search ? `No technician found matching "${search}"` : 'No records for this month.'}
                    </td>
                  </tr>
                )}
                {shown.map((tech, ri) => {
                  const hd      = Object.values(tech.dates || {}).filter(v => v === 'HD').length;
                  const safePct = workingDays > 0 ? Math.round(((tech.presentDays || 0) / workingDays) * 100) : 0;
                  const lowAtt  = safePct < 75;
                  const rowBg   = lowAtt ? '#FFFBFB' : ri % 2 === 0 ? COLORS.white : '#FAFAFA';
                  return (
                    <tr key={tech.techId} style={{ borderBottom: `1px solid ${COLORS.border}22`, background: rowBg }}>
                      <td style={{ padding: '9px 16px', position: 'sticky', left: 0, zIndex: 1, background: rowBg, boxShadow: '2px 0 6px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <Avatar name={tech.name} size={28} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                              {tech.name}
                              {lowAtt && <span style={{ fontSize: 9, background: '#FEE2E2', color: '#DC2626', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>LOW</span>}
                            </div>
                            <div style={{ fontSize: 10, color: COLORS.muted }}>{tech.role}</div>
                          </div>
                        </div>
                      </td>
                      {dayLabels.map(d => {
                        const s       = (tech.dates || {})[d] || '';
                        const weekend = isWeekend(d, selMonth, selYear);
                        const isToday = d === todayDate && selMonth === today.getMonth() && selYear === today.getFullYear();
                        const saving  = savingCells.has(`${tech.techId}-${d}`);
                        return (
                          <td key={`${tech.techId}-${d}`} style={{ padding: '5px 2px', textAlign: 'center' }}>
                            <AttCell
                              status={s}
                              onClick={() => cycleStatus(tech.techId, d)}
                              isToday={isToday}
                              isWeekend={weekend}
                              saving={saving}
                            />
                          </td>
                        );
                      })}
                      <td style={{ padding: '9px 8px', textAlign: 'center' }}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: '#16A34A' }}>{tech.presentDays || 0}</span></td>
                      <td style={{ padding: '9px 8px', textAlign: 'center' }}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: '#DC2626' }}>{tech.absentDays  || 0}</span></td>
                      <td style={{ padding: '9px 8px', textAlign: 'center' }}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: '#B45309' }}>{hd}</span></td>
                      <td style={{ padding: '9px 8px', textAlign: 'center' }}><span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: '#0369A1' }}>{tech.leaves || 0}</span></td>
                      <td style={{ padding: '9px 10px', textAlign: 'center', minWidth: 90 }}><AttBar pct={safePct} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'person'  && <PersonView  data={shown} workingDays={workingDays} />}
      {viewMode === 'summary' && <SummaryView data={shown} workingDays={workingDays} />}

    </div>
  );
};

export default AttendancePage;