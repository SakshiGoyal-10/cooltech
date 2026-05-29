import { COLORS, FONTS } from '../../constants/tokens';
import { INV_STATUS } from '../../data/mockData';

// ─── SBadge ───────────────────────────────────────────────────────────────────
// Renders a status badge driven by a statusMap entry.
// Usage: <SBadge s="paid" map={INV_STATUS} />
export const SBadge = ({ s, map }) => {
  const m = map[s] || { label: s, bg: '#F3F4F6', color: '#374151' };
  return (
    <span
      className="badge"
      style={{ background: m.bg, color: m.color, fontFamily: FONTS.sans }}
    >
      {m.dot && <span className="badge-dot" style={{ background: m.dot }} />}
      {m.label}
    </span>
  );
};

// ─── TypeTag ──────────────────────────────────────────────────────────────────
// Coloured pill for job type labels.
export const TypeTag = ({ type }) => {
  const palette = {
    Service: '#3B82F6', Repair: '#EF4444', Installation: '#10B981',
    'AMC Visit': '#8B5CF6', AMC: '#8B5CF6', Fuel: '#0EA5E9',
    Tools: '#10B981', Parts: '#F59E0B', Training: '#7C3AED',
    Office: '#64748B', Miscellaneous: '#94A3B8',
  };
  const c = palette[type] || '#64748B';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 5, background: `${c}15`, color: c }}>
      {type}
    </span>
  );
};

// ─── PBadge ───────────────────────────────────────────────────────────────────
export const PBadge = ({ p }) => {
  const m = {
    urgent: { label: 'Urgent', bg: '#FEF2F2', color: '#DC2626' },
    high:   { label: 'High',   bg: '#FFF7ED', color: '#C2410C' },
    normal: { label: 'Normal', bg: '#F0F9FF', color: '#0369A1' },
    low:    { label: 'Low',    bg: '#F8FAFC', color: '#64748B' },
  }[p] || { label: p, bg: '#F3F4F6', color: '#374151' };
  return <span className="badge" style={{ background: m.bg, color: m.color }}>{m.label}</span>;
};

// ─── SevBadge ─────────────────────────────────────────────────────────────────
export const SevBadge = ({ s }) => {
  const m = {
    high:   { label: 'High',   bg: '#FEF2F2', color: '#DC2626' },
    medium: { label: 'Medium', bg: '#FFFBEB', color: '#B45309' },
    low:    { label: 'Low',    bg: '#ECFDF5', color: '#059669' },
  }[s] || { label: s, bg: '#F3F4F6', color: '#374151' };
  return <span className="badge" style={{ background: m.bg, color: m.color }}>{m.label}</span>;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar = ({ name, size = 36, color = COLORS.brand }) => {
  const initials = (name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size,
        borderRadius: size / 3,
        background: `${color}18`,
        border: `1.5px solid ${color}30`,
        fontSize: size * 0.33,
        color,
        fontFamily: FONTS.sans,
      }}
    >
      {initials}
    </div>
  );
};

// ─── Divider ──────────────────────────────────────────────────────────────────
export const Divider = () => <div className="divider" />;