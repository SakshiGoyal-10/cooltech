// src/components/ui/TableSearchBar.jsx
import { COLORS, FONTS } from '../../constants/tokens';

const TableSearchBar = ({ value, onChange, placeholder = "Search…", style = {} }) => (
  <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>

    {/* Search icon */}
    <svg
      viewBox="0 0 16 16"
      width="14" height="14"
      fill="none"
      stroke={value ? COLORS.brand : COLORS.faint}
      strokeWidth="1.8"
      strokeLinecap="round"
      style={{
        position: "absolute",
        left: 11,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        transition: "stroke .15s",
      }}
    >
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10" y1="10" x2="14" y2="14" />
    </svg>

    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 13px 8px 32px",  // ← left padding makes room for icon
        borderRadius: 8,
        border: `1px solid ${value ? COLORS.brand : COLORS.border}`,
        fontSize: 13,
        fontFamily: FONTS.sans,
        background: COLORS.white,
        color: COLORS.h2,
        outline: "none",
        transition: "border-color .15s",
        boxSizing: "border-box",
        ...style,
      }}
    />

  </div>
);

export default TableSearchBar;