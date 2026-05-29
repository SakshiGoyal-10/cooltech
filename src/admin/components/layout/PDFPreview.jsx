import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../../constants/tokens';
import { QuotationTemplate, InvoiceTemplate, GenericListTemplate, ContractTemplate, AMCContractPDFTemplate, ServiceJobSheetTemplate, CampaignReportTemplate, ScorecardTemplate } from './printTemplates';

const TEMPLATES = {
  quotation:    QuotationTemplate,
  invoice:      InvoiceTemplate,
  generic_list: GenericListTemplate,
  contract: ContractTemplate,
  amc_contract: AMCContractPDFTemplate,
  service_job_sheet: ServiceJobSheetTemplate,
  campaign_report: CampaignReportTemplate,
  scorecard: ScorecardTemplate  
};

const PDFPreview = ({ open, onClose, template, data, title = "Document", filename = "document", printStyles = "" }) => {

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const TemplateComponent = TEMPLATES[template];

  const handlePrint = () => {
    const content = document.getElementById("pdf-preview-content")?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${filename}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;background:white;padding:48px;max-width:794px;margin:0 auto}@media print{body{padding:32px;-webkit-print-color-adjust:exact;print-color-adjust:exact}}${printStyles}</style>
</head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(3px)", zIndex: 1000 }} />

      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(760px,94vw)", maxHeight: "90vh", background: "#F3F4F6", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,.28)", zIndex: 1001, display: "flex", flexDirection: "column", overflow: "hidden", animation: "pdfPop .2s ease" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>📄 PDF Preview</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.brand, fontFamily: FONTS.mono, background: COLORS.brandL, padding: "2px 10px", borderRadius: 99 }}>{title}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={handlePrint} style={{ padding: "7px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white" }}>⬇ Download PDF</button>
            <button onClick={onClose} style={{ padding: "7px 13px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, cursor: "pointer", background: COLORS.white, color: COLORS.body }}>✕</button>
          </div>
        </div>

        {/* Paper */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div id="pdf-preview-content" style={{ background: "white", borderRadius: 10, boxShadow: "0 2px 16px rgba(0,0,0,.08)", padding: "40px 48px", fontSize: 13, color: "#1a1a1a", fontFamily: "'Segoe UI',Arial,sans-serif" }}>
            {TemplateComponent
              ? <TemplateComponent data={data} />
              : <div style={{ color: "red", padding: 20, fontFamily: "monospace" }}>
                  Unknown template: "<b>{String(template)}</b>"<br/>
                  Valid keys: {Object.keys(TEMPLATES).join(", ")}
                </div>
            }
          </div>
        </div>
      </div>
      <style>{`@keyframes pdfPop{from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
    </>,
    document.body
  );
};

export default PDFPreview;