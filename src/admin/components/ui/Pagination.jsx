import { COLORS, FONTS } from '../../constants/tokens';

/**
 * Props — all come straight from usePagination():
 *   page, totalPages, setPage,
 *   pageSize, setPageSize,
 *   from, to, total
 *   pageSizeOptions  {number[]}  default [10, 25, 50]
 */
const Pagination = ({
  page, totalPages, setPage,
  pageSize, setPageSize,
  from, to, total,
  pageSizeOptions = [10, 25, 50],
}) => {
  if (total === 0) return null;

  // build page number array with "..." gaps
  const pages = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4)
      return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3)
      return [1, '…', totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [1, '…', page-1, page, page+1, '…', totalPages];
  };

  const btnStyle = (active) => ({
    minWidth: 32, height: 32,
    padding: "0 8px",
    borderRadius: 7,
    border: `1px solid ${active ? COLORS.brand : COLORS.border}`,
    background: active ? COLORS.brandL : COLORS.white,
    color: active ? COLORS.brand : COLORS.body,
    fontSize: 12,
    fontWeight: active ? 700 : 400,
    cursor: "pointer",
    fontFamily: FONTS.mono,
    transition: "all .12s",
  });

  const arrowStyle = (disabled) => ({
    ...btnStyle(false),
    color: disabled ? COLORS.faint : COLORS.body,
    cursor: disabled ? "default" : "pointer",
  });

  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", flexWrap: "wrap",
      gap: 10, padding: "12px 16px",
      borderTop: `1px solid ${COLORS.border}`,
      background: COLORS.white,
      borderRadius: "0 0 14px 14px",
    }}>

      {/* Left: "Showing X–Y of Z" + rows-per-page */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: COLORS.muted }}>
          Showing <strong style={{ color: COLORS.h2 }}>{from}–{to}</strong> of <strong style={{ color: COLORS.h2 }}>{total}</strong>
        </span>
        <select
          value={pageSize}
          onChange={e => setPageSize(e.target.value)}
          style={{
            padding: "4px 8px", borderRadius: 6,
            border: `1px solid ${COLORS.border}`,
            fontSize: 12, background: COLORS.white,
            color: COLORS.body, cursor: "pointer",
          }}>
          {pageSizeOptions.map(n =>
            <option key={n} value={n}>{n} / page</option>
          )}
        </select>
      </div>

      {/* Right: prev + page numbers + next */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          style={arrowStyle(page === 1)}>
          ‹
        </button>

        {pages().map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} style={{ fontSize: 12, color: COLORS.faint, padding: "0 4px" }}>…</span>
            : <button key={p} onClick={() => setPage(p)} style={btnStyle(p === page)}>{p}</button>
        )}

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          style={arrowStyle(page === totalPages)}>
          ›
        </button>
      </div>

    </div>
  );
};

export default Pagination;