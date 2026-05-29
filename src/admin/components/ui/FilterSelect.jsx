// A styled <select> that highlights orange when an active filter is set
import { COLORS, FONTS } from '../../constants/tokens';

/**
 * Props:
 *   value      {string}    controlled value from activeFilters[field]
 *   onChange   {fn}        (val) => setFilter(field, val)
 *   options    {string[]}  list of option values
 *   allLabel   {string}    label for the "all" option, e.g. "All Types"
 */
const FilterSelect = ({ value, onChange, options, allLabel }) => {
  const active = !!value;
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: "8px 13px",
        borderRadius: 8,
        border: `1px solid ${active ? COLORS.brand : COLORS.border}`,
        fontSize: 13,
        background: active ? COLORS.brandL : COLORS.white,
        color: active ? COLORS.brand : COLORS.body,
        fontFamily: FONTS.sans,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        outline: "none",
        transition: "all .15s",
      }}
    >
      <option value="">{allLabel}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
};

export default FilterSelect;