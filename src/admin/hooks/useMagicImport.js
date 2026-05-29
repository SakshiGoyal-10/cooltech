// ─── hooks/useMagicImport.js ──────────────────────────────────────────────────
// Handles: file ingestion → Anthropic Vision parse → duplicate detection
//          → template sniff → seedEdit hand-off
//
// Usage:
//   const mi = useMagicImport({ quotations: QUOTATIONS, onFilled: seedEdit });
//   <MagicImportPanel {...mi} />

import { useState, useCallback, useRef } from 'react';
import { QUOTATIONS } from '../data/mockData';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a File to a base64 data-URL string (strips the prefix). */
const fileToBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('FileReader failed'));
    r.readAsDataURL(file);
  });

/** Levenshtein-based fuzzy match — returns 0..1 similarity */
const similarity = (a = '', b = '') => {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (!a || !b) return 0;
  if (a === b)  return 1;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return 1 - dp[m][n] / Math.max(m, n);
};

/** Detect if the parsed data looks like a "foreign" (non-Alisha) template */
const detectTemplate = (raw) => {
  const text = JSON.stringify(raw).toLowerCase();
  if (text.includes('cooltech') || text.includes('alisha')) return 'alisha';
  if (text.includes('invoice'))   return 'invoice';
  if (text.includes('proforma'))  return 'proforma';
  // generic foreign quotation
  return 'foreign';
};

// ── Anthropic call ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a document-parsing assistant. 
Extract all quotation data from the provided image/PDF and return ONLY a valid JSON object 
(no markdown, no backticks, no preamble) with these exact keys:

{
  "customer":  string,
  "contact":   string,
  "phone":     string,
  "email":     string,
  "address":   string,
  "type":      string,   // e.g. "Installation", "Repair", "AMC", "Service"
  "created":   string,   // date string as found in doc
  "valid":     string,   // validity / expiry date if present
  "notes":     string,
  "terms":     string,
  "items": [
    { "desc": string, "qty": string, "rate": string }
  ],
  "confidence": number,  // 0-100 overall extraction confidence
  "sourceTemplate": string  // brief description of the source doc layout/company
}

If a field is missing, use an empty string. For items, parse every line row you can find.`;

const callAnthropicVision = async (base64Data, mediaType) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          { type: 'text', text: 'Extract all quotation data from this document.' },
        ],
      }],
    }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text ?? '';
  // strip any accidental markdown fences
  const clean = text.replace(/```json|```/gi, '').trim();
  return JSON.parse(clean);
};

// ── Parse steps (for animated progress) ──────────────────────────────────────
export const PARSE_STEPS = [
  { id: 'scan',    label: 'Scanning layout'    },
  { id: 'extract', label: 'Extracting data'    },
  { id: 'map',     label: 'Mapping fields'     },
  { id: 'check',   label: 'Checking duplicates'},
];

// ── Main hook ─────────────────────────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {Array}  opts.quotations  — the full QUOTATIONS array for dup-check
 * @param {Function} opts.onFilled — called with (parsedData, parsedItems) to seed the edit form
 * @param {Function} [opts.onViewExisting] — called with quotation.id to navigate to existing quote
 */
const useMagicImport = ({ quotations = [], onFilled, onViewExisting }) => {
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [phase,       setPhase]       = useState('idle'); // idle | parsing | duplicates | template | parsed | error
  const [stepIdx,     setStepIdx]     = useState(-1);
  const [parsed,      setParsed]      = useState(null);
  const [duplicates,  setDuplicates]  = useState([]);
  const [templateInfo,setTemplateInfo]= useState(null); // { kind, sourceTemplate }
  const [errorMsg,    setErrorMsg]    = useState('');
  const [dragOver,    setDragOver]    = useState(false);
  const fileInputRef = useRef(null);

  // advance step animation
  const advanceStep = (idx) => {
    setStepIdx(idx);
    return new Promise(r => setTimeout(r, 520));
  };

  const reset = useCallback(() => {
    setPhase('idle');
    setStepIdx(-1);
    setParsed(null);
    setDuplicates([]);
    setTemplateInfo(null);
    setErrorMsg('');
  }, []);

  const processFile = useCallback(async (file) => {
    if (!file) return;

    // accept PDF as image/jpeg fallback — Anthropic vision supports pdf via image
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
    if (!allowed.includes(file.type)) {
      setErrorMsg(`Unsupported file type: ${file.type}. Use PDF, JPG, PNG, or WEBP.`);
      setPhase('error');
      return;
    }

    const mediaType = file.type === 'application/pdf' ? 'application/pdf' : file.type;

    setPhase('parsing');
    setStepIdx(0);

    try {
      await advanceStep(0);                       // scanning layout
      const base64 = await fileToBase64(file);

      await advanceStep(1);                       // extracting data
      const raw = await callAnthropicVision(base64, mediaType);

      await advanceStep(2);                       // mapping fields

      // ── Duplicate detection ───────────────────────────────────────────────
      await advanceStep(3);                       // checking duplicates
      const customer = raw.customer?.trim() ?? '';
      const dupes = quotations.filter(q =>
        similarity(q.customer, customer) >= 0.72
      ).slice(0, 3); // max 3 suggestions

      // ── Template detection ────────────────────────────────────────────────
      const tplKind = detectTemplate(raw);
      const isForeign = tplKind !== 'alisha';

      setParsed(raw);

      // show duplicate prompt first (higher priority)
      if (dupes.length > 0) {
        setDuplicates(dupes);
        setPhase('duplicates');
        if (isForeign) setTemplateInfo({ kind: tplKind, sourceTemplate: raw.sourceTemplate });
      } else if (isForeign) {
        setTemplateInfo({ kind: tplKind, sourceTemplate: raw.sourceTemplate });
        setPhase('template');
      } else {
        setPhase('parsed');
      }

    } catch (err) {
      console.error('Magic Import error:', err);
      setErrorMsg(err.message ?? 'Parsing failed. Please try again.');
      setPhase('error');
    }
  }, [quotations]);

  // ── Drop / click handlers ─────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const onFileChange = useCallback((e) => {
    processFile(e.target.files[0]);
    e.target.value = ''; // reset so same file can be re-selected
  }, [processFile]);

  // ── User actions ──────────────────────────────────────────────────────────

  /** Ignore duplicates, proceed to template check or fill */
  const dismissDuplicates = useCallback(() => {
    if (templateInfo) setPhase('template');
    else setPhase('parsed');
  }, [templateInfo]);

  /** Jump to an existing quote */
  const viewExisting = useCallback((id) => {
    setPanelOpen(false);
    reset();
    onViewExisting?.(id);
  }, [onViewExisting, reset]);

  /** Accept template switch prompt and fill */
  const acceptTemplate = useCallback(() => {
    setPhase('parsed');
  }, []);

  /** Fill the form with parsed data */
  const fillForm = useCallback(() => {
    if (!parsed) return;
    const items = (parsed.items ?? []).map(i => ({ ...i }));
    const data  = {
      customer: parsed.customer ?? '',
      contact:  parsed.contact  ?? '',
      phone:    parsed.phone    ?? '',
      email:    parsed.email    ?? '',
      address:  parsed.address  ?? '',
      type:     parsed.type     ?? '',
      created:  parsed.created  ?? '',
      valid:    parsed.valid    ?? '',
      notes:    parsed.notes    ?? '',
      terms:    parsed.terms    ?? '',
      status:   'draft',
    };
    onFilled(data, items);
    setPanelOpen(false);
    reset();
  }, [parsed, onFilled, reset]);

  return {
    // state
    panelOpen, setPanelOpen,
    phase, stepIdx,
    parsed, duplicates, templateInfo,
    errorMsg, dragOver, setDragOver,
    fileInputRef,
    // actions
    reset,
    onDrop,
    onFileChange,
    dismissDuplicates,
    viewExisting,
    acceptTemplate,
    fillForm,
  };
};

export default useMagicImport;