import { useState, useRef, useEffect } from 'react';
import { COLORS } from '../../constants/tokens';
import PDFPreview from './PDFPreview';

const ExportDropdown = ({
  title         = "Document",
  filename      = "export",
  template      = "generic_list",
  pdfData,              // data object passed straight to PDFPreview → template
  printStyles   = "",
  pdfOpen       = false,
  onOpenPdf,
  onClosePdf,
  onExportExcel,
}) => {
  const [dropOpen, setDropOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <>
      <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
        <button
          onClick={() => setDropOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.white, color: COLORS.body, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}
        >
          ⬇ Export
          <span style={{ fontSize: 10, display: "inline-block", transition: "transform .15s", transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </button>

        {dropOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,.12)", overflow: "hidden", minWidth: 170, zIndex: 200, animation: "ddIn .15s ease" }}>
            <button
              onClick={() => { setDropOpen(false); onOpenPdf?.(); }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.brandL}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "none", fontSize: 13, fontWeight: 600, color: COLORS.h2, cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ fontSize: 16 }}>📄</span>
              <div>
                <div>Export as PDF</div>
                <div style={{ fontSize: 11, color: COLORS.faint, fontWeight: 400 }}>Preview then download</div>
              </div>
            </button>

            <div style={{ height: 1, background: COLORS.border, margin: "0 12px" }} />

            <button
              onClick={() => { setDropOpen(false); onExportExcel?.(); }}
              onMouseEnter={e => e.currentTarget.style.background = "#F0FDF4"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "none", fontSize: 13, fontWeight: 600, color: COLORS.h2, cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ fontSize: 16 }}>📊</span>
              <div>
                <div>Export as Excel</div>
                <div style={{ fontSize: 11, color: COLORS.faint, fontWeight: 400 }}>Download .csv file</div>
              </div>
            </button>
          </div>
        )}
      </div>

      <PDFPreview
        open={pdfOpen}
        onClose={onClosePdf}
        title={title}
        filename={filename}
        template={template}
        data={pdfData}
        printStyles={printStyles}
      />

      <style>{`@keyframes ddIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </>
  );
};

export default ExportDropdown;