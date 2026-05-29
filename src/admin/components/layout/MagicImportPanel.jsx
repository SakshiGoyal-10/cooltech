// ─── components/layout/MagicImportPanel.jsx ──────────────────────────────────
// Full-featured panel with 6 phases:
//   idle → parsing → duplicates → template → parsed → error
//
// Props: spread the return value of useMagicImport()

import { PARSE_STEPS } from '../../hooks/useMagicImport';
import { COLORS, FONTS } from '../../constants/tokens';

// ── Design tokens (panel-local) ───────────────────────────────────────────────
const T = {
  accent:    '#E65100',
  accentL:   '#FFF3E0',
  accentM:   '#FFCC80',
  accentD:   '#BF360C',
  green:     '#2E7D32',
  greenL:    '#F1F8E9',
  greenB:    '#AED581',
  amber:     '#F57F17',
  amberL:    '#FFFDE7',
  amberB:    '#FFE082',
  blue:      '#0D47A1',
  blueL:     '#E3F2FD',
  blueB:     '#90CAF9',
  red:       '#C62828',
  redL:      '#FFEBEE',
  border:    COLORS.border,
  muted:     COLORS.muted,
  body:      COLORS.body,
  white:     COLORS.white,
  brand:     COLORS.brand,
};

// ── Tiny sub-components ───────────────────────────────────────────────────────

const PanelWrap = ({ children, glow }) => (
  <div style={{
    background: T.white,
    border: `1.5px solid ${glow ? T.accent : T.border}`,
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: glow ? `0 0 0 3px ${T.accent}18` : '0 2px 12px rgba(0,0,0,.06)',
    transition: 'border-color .25s, box-shadow .25s',
  }}>
    {children}
  </div>
);

const PanelHeader = ({ onClose }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px',
    borderBottom: `1px solid ${T.border}`,
    background: T.accentL,
  }}>
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L12 5H9V10H7V5H4L8 1Z" fill="white"/>
        <path d="M2 12H14V14H2V12Z" fill="white"/>
      </svg>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.accentD, lineHeight: 1.2 }}>Magic Import</div>
      <div style={{ fontSize: 11, color: T.accent, marginTop: 1 }}>
        AI-powered quotation parser
      </div>
    </div>
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, padding: '2px 7px',
      borderRadius: 20, background: T.accent, color: 'white',
      letterSpacing: .4,
    }}>AI</span>
    <button onClick={onClose} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: T.muted, fontSize: 20, lineHeight: 1, padding: '0 2px',
    }}>×</button>
  </div>
);

// Step progress pills
const StepBar = ({ stepIdx }) => (
  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '14px 0 4px' }}>
    {PARSE_STEPS.map((s, i) => {
      const done    = i < stepIdx;
      const active  = i === stepIdx;
      return (
        <div key={s.id} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: active ? 700 : 400,
          color: done ? T.green : active ? T.accent : T.muted,
          transition: 'color .3s',
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700,
            background: done ? T.greenL : active ? T.accentL : '#F1F5F9',
            border: `1.5px solid ${done ? T.green : active ? T.accent : '#CBD5E1'}`,
            color: done ? T.green : active ? T.accent : '#94A3B8',
            transition: 'all .3s',
          }}>
            {done ? '✓' : i + 1}
          </div>
          <span style={{ display: i < 3 ? 'inline' : 'inline' }}>{s.label}</span>
          {i < PARSE_STEPS.length - 1 && (
            <div style={{ width: 16, height: 1, background: done ? T.greenB : '#E2E8F0', margin: '0 2px', transition: 'background .3s' }} />
          )}
        </div>
      );
    })}
  </div>
);

// Spinning loader
const Spinner = () => (
  <div style={{
    width: 36, height: 36,
    border: `3px solid ${T.accentL}`,
    borderTopColor: T.accent,
    borderRadius: '50%',
    animation: 'mi-spin .7s linear infinite',
    margin: '0 auto 12px',
  }} />
);

// Field preview pill
const FieldPill = ({ label, value, highlight }) => (
  <div style={{ marginBottom: 6 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 3 }}>
      {label}
    </div>
    <div style={{
      fontSize: 13, padding: '6px 10px', borderRadius: 7,
      background: highlight ? T.accentL : '#F8FAFC',
      border: `1px solid ${highlight ? T.accentM : '#E2E8F0'}`,
      color: highlight ? T.accentD : T.body,
      fontWeight: highlight ? 600 : 400,
    }}>
      {value || <span style={{ color: T.muted, fontStyle: 'italic' }}>—</span>}
    </div>
  </div>
);

// ── Phase: idle ───────────────────────────────────────────────────────────────
const PhaseIdle = ({ dragOver, setDragOver, onDrop, onFileChange, fileInputRef }) => (
  <div style={{ padding: '14px 16px 16px' }}>
    {/* Drop zone */}
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? T.accent : '#CBD5E1'}`,
        borderRadius: 12,
        padding: '28px 20px',
        textAlign: 'center',
        background: dragOver ? T.accentL : '#FAFBFC',
        cursor: 'pointer',
        transition: 'all .2s',
      }}
    >
      <div style={{
        width: 44, height: 44, margin: '0 auto 12px',
        borderRadius: 12, background: T.accentL,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v13M7 9l5-6 5 6" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 18h18" stroke={T.accent} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.body }}>
        Drop your quotation here
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
        or <span style={{ color: T.accent, fontWeight: 600, textDecoration: 'underline' }}>browse files</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
        {['PDF','JPG','PNG','WEBP'].map(f => (
          <span key={f} style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            background: '#F1F5F9', color: '#64748B', letterSpacing: .5,
          }}>{f}</span>
        ))}
      </div>
    </div>

    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
      onChange={onFileChange} style={{ display: 'none' }} />

    {/* What gets extracted */}
    <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px' }}>
      {[
        'Client name & contact', 'Line items & quantities',
        'Rates & totals',        'Notes & terms',
        'Dates & validity',      'Job type & description',
      ].map(t => (
        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.accent, flexShrink: 0 }} />
          {t}
        </div>
      ))}
    </div>
  </div>
);

// ── Phase: parsing ────────────────────────────────────────────────────────────
const PhaseParsing = ({ stepIdx }) => (
  <div style={{ padding: '22px 16px 26px', textAlign: 'center' }}>
    <style>{`@keyframes mi-spin{to{transform:rotate(360deg)}}`}</style>
    <Spinner />
    <div style={{ fontSize: 14, fontWeight: 700, color: T.body }}>
      {PARSE_STEPS[stepIdx]?.label ?? 'Processing…'}
    </div>
    <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
      AI is reading your document
    </div>
    <StepBar stepIdx={stepIdx} />
  </div>
);

// ── Phase: duplicates ─────────────────────────────────────────────────────────
const PhaseDuplicates = ({ parsed, duplicates, onViewExisting, onDismiss }) => (
  <div style={{ padding: '14px 16px 16px' }}>
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 12px', borderRadius: 10,
      background: T.amberL, border: `1px solid ${T.amberB}`,
      marginBottom: 14,
    }}>
      <div style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>⚠️</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>Similar quote{duplicates.length > 1 ? 's' : ''} found</div>
        <div style={{ fontSize: 12, color: '#795548', marginTop: 2 }}>
          <strong>{parsed?.customer}</strong> already has {duplicates.length} quotation{duplicates.length > 1 ? 's' : ''} on record.
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
      {duplicates.map(q => (
        <div key={q.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 10,
          background: '#FAFAFA', border: `1px solid ${T.border}`,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.brand, fontFamily: FONTS.mono }}>
              {q.id}
            </div>
            <div style={{ fontSize: 12, color: T.body, marginTop: 2 }}>{q.customer}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
              {q.type} · {q.created} · ₹{q.total?.toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: q.status === 'approved' ? '#F0FDF4' : q.status === 'sent' ? '#EFF6FF' : '#F8FAFC',
              color: q.status === 'approved' ? '#16A34A' : q.status === 'sent' ? '#1D4ED8' : T.muted,
              border: `1px solid ${q.status === 'approved' ? '#BBF7D0' : q.status === 'sent' ? '#BFDBFE' : T.border}`,
            }}>{q.status}</span>
            <button
              onClick={() => onViewExisting(q.id)}
              style={{
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                background: T.blueL, border: `1px solid ${T.blueB}`,
                color: T.blue, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              View →
            </button>
          </div>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={onDismiss}
        style={{
          flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: `linear-gradient(135deg, ${T.accent}, ${T.accentD})`,
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: `0 3px 10px ${T.accent}40`,
        }}>
        Create new anyway
      </button>
      <button
        onClick={onDismiss}
        style={{
          padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: T.white, border: `1px solid ${T.border}`,
          color: T.body, cursor: 'pointer',
        }}>
        Cancel
      </button>
    </div>
  </div>
);

// ── Phase: template ───────────────────────────────────────────────────────────
const TEMPLATE_META = {
  invoice:  { icon: '🧾', label: 'Invoice layout',  desc: 'Standard invoice format detected — we\'ll map it to Alisha\'s quotation template.' },
  proforma: { icon: '📋', label: 'Proforma layout', desc: 'Proforma invoice detected — fields will be adapted to quotation format.' },
  foreign:  { icon: '🏢', label: 'External template', desc: 'This document is from a different company. We\'ll import the data into Alisha Engineering\'s layout.' },
};

const PhaseTemplate = ({ templateInfo, parsed, onAccept, onCancel }) => {
  const meta = TEMPLATE_META[templateInfo?.kind] ?? TEMPLATE_META.foreign;
  return (
    <div style={{ padding: '14px 16px 16px' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px', borderRadius: 10,
        background: T.blueL, border: `1px solid ${T.blueB}`,
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 22, lineHeight: 1 }}>{meta.icon}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>{meta.label} detected</div>
          <div style={{ fontSize: 12, color: '#1565C0', marginTop: 3, lineHeight: 1.5 }}>
            {meta.desc}
          </div>
          {templateInfo?.sourceTemplate && (
            <div style={{
              fontSize: 11, marginTop: 6, padding: '3px 8px',
              background: 'white', borderRadius: 5, border: `1px solid ${T.blueB}`,
              color: T.blue, display: 'inline-block',
            }}>
              Source: "{templateInfo.sourceTemplate}"
            </div>
          )}
        </div>
      </div>

      {/* Side-by-side layout comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: '#FFF8F6', border: `1px solid ${T.accentM}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: .5, marginBottom: 6 }}>SOURCE FORMAT</div>
          {[['Customer', parsed?.customer], ['Type', parsed?.type], ['Items', `${parsed?.items?.length ?? 0} rows`]].map(([k, v]) => (
            <div key={k} style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: T.body }}>{k}: </span>{v || '—'}
            </div>
          ))}
        </div>
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: T.greenL, border: `1px solid ${T.greenB}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: .5, marginBottom: 6 }}>ALISHA TEMPLATE</div>
          <div style={{ fontSize: 11, color: '#2E7D32', lineHeight: 1.7 }}>
            <div>✓ Company header</div>
            <div>✓ Vendor + client table</div>
            <div>✓ Itemised price list</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, padding: '8px 10px', borderRadius: 7, background: '#F8FAFC', border: `1px solid ${T.border}` }}>
        ℹ️ All extracted data will be placed into <strong>Alisha Engineering's standard quotation layout</strong>. You can review and edit every field before saving.
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onAccept}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentD})`,
            color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: `0 3px 10px ${T.accent}40`,
          }}>
          Use Alisha template ✓
        </button>
        <button onClick={onCancel} style={{
          padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: T.white, border: `1px solid ${T.border}`,
          color: T.body, cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Phase: parsed (preview & confirm) ────────────────────────────────────────
const PhaseParsed = ({ parsed, onFill, onReset }) => {
  const conf = parsed?.confidence ?? 90;
  const confColor = conf >= 85 ? T.green : conf >= 65 ? T.amber : T.red;
  const confBg    = conf >= 85 ? T.greenL : conf >= 65 ? T.amberL : T.redL;
  const confBd    = conf >= 85 ? T.greenB : conf >= 65 ? T.amberB : '#FFCDD2';

  return (
    <div style={{ padding: '14px 16px 16px' }}>
      {/* Confidence bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        padding: '8px 12px', borderRadius: 8,
        background: confBg, border: `1px solid ${confBd}`,
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" fill={confColor} opacity=".2"/>
          <path d="M5 8l2 2 4-4" stroke={confColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: confColor }}>
          {parsed?.items?.length ?? 0} line items extracted
        </span>
        <span style={{ fontSize: 11, color: confColor, marginLeft: 'auto' }}>
          {conf}% confidence
        </span>
        {/* confidence bar */}
        <div style={{ width: 60, height: 5, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden' }}>
          <div style={{ width: `${conf}%`, height: '100%', background: confColor, borderRadius: 3, transition: 'width .5s' }} />
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 10px' }}>
        <FieldPill label="Customer" value={parsed?.customer} highlight />
        <FieldPill label="Contact"  value={parsed?.contact} />
        <FieldPill label="Phone"    value={parsed?.phone} />
        <FieldPill label="Type"     value={parsed?.type} />
      </div>

      {/* Items */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 6 }}>
          Line items
        </div>
        <div style={{
          background: '#F8FAFC', borderRadius: 8,
          border: `1px solid ${T.border}`, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
            fontSize: 10, fontWeight: 700, color: T.muted,
            padding: '5px 10px', borderBottom: `1px solid ${T.border}`,
            textTransform: 'uppercase', letterSpacing: .3,
          }}>
            <span>Description</span><span style={{ textAlign: 'center' }}>Qty</span><span style={{ textAlign: 'right' }}>Rate</span>
          </div>
          {(parsed?.items ?? []).map((item, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
              fontSize: 12, padding: '6px 10px',
              borderBottom: i < (parsed.items.length - 1) ? `1px solid ${T.border}` : 'none',
              color: T.body,
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</span>
              <span style={{ textAlign: 'center', color: T.muted }}>{item.qty}</span>
              <span style={{ textAlign: 'right', fontFamily: FONTS.mono, color: T.body }}>
                {item.rate ? `₹${Number(item.rate).toLocaleString()}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: T.muted, marginBottom: 10, textAlign: 'center' }}>
        All fields are editable after import
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onFill}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentD})`,
            color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 14px ${T.accent}40`,
          }}>
          Fill quotation form ✓
        </button>
        <button onClick={onReset} style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: T.white, border: `1px solid ${T.border}`,
          color: T.body, cursor: 'pointer',
        }}>
          ↺
        </button>
      </div>
    </div>
  );
};

// ── Phase: error ──────────────────────────────────────────────────────────────
const PhaseError = ({ errorMsg, onReset }) => (
  <div style={{ padding: '22px 16px', textAlign: 'center' }}>
    <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
    <div style={{ fontSize: 14, fontWeight: 700, color: T.red }}>Import failed</div>
    <div style={{ fontSize: 12, color: T.muted, margin: '6px 0 16px', lineHeight: 1.5 }}>{errorMsg}</div>
    <button onClick={onReset} style={{
      padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
      background: T.accentL, border: `1px solid ${T.accentM}`,
      color: T.accent, cursor: 'pointer',
    }}>Try again</button>
  </div>
);

// ── MagicImportPanel (exported) ───────────────────────────────────────────────
const MagicImportPanel = (props) => {
  const {
    panelOpen, setPanelOpen,
    phase, stepIdx,
    parsed, duplicates, templateInfo,
    errorMsg, dragOver, setDragOver,
    fileInputRef,
    reset,
    onDrop, onFileChange,
    dismissDuplicates,
    viewExisting,
    acceptTemplate,
    fillForm,
  } = props;

  if (!panelOpen) return null;

  return (
    <PanelWrap glow={phase !== 'idle'}>
      <PanelHeader onClose={() => { setPanelOpen(false); reset(); }} />

      {phase === 'idle'       && <PhaseIdle       dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop} onFileChange={onFileChange} fileInputRef={fileInputRef} />}
      {phase === 'parsing'    && <PhaseParsing     stepIdx={stepIdx} />}
      {phase === 'duplicates' && <PhaseDuplicates  parsed={parsed} duplicates={duplicates} onViewExisting={viewExisting} onDismiss={dismissDuplicates} />}
      {phase === 'template'   && <PhaseTemplate    templateInfo={templateInfo} parsed={parsed} onAccept={acceptTemplate} onCancel={() => { setPanelOpen(false); reset(); }} />}
      {phase === 'parsed'     && <PhaseParsed      parsed={parsed} onFill={fillForm} onReset={reset} />}
      {phase === 'error'      && <PhaseError       errorMsg={errorMsg} onReset={reset} />}
    </PanelWrap>
  );
};

export default MagicImportPanel;