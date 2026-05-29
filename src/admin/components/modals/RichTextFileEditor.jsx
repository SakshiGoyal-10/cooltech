// RichTextEditor.jsx — drop-in replacement matching the screenshot UI exactly
// Usage: <RichTextEditor files={files} setFiles={setFiles} placeholder="..." />
// getValue={ref} optional — attach a ref to read innerHTML

import { useRef, useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';

// ─── Icon helpers (pure SVG, no deps) ────────────────────────────────────────
const Ic = ({ d, size = 15, viewBox = "0 0 16 16", stroke = true, fill = false, children, ...rest }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill ? "currentColor" : "none"}
    stroke={stroke ? "currentColor" : "none"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

// ─── Toolbar button ───────────────────────────────────────────────────────────
const Btn = ({ title, active, onClick, children, style = {} }) => (
  <button
    title={title}
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: 5, border: "none", cursor: "pointer",
      background: active ? `${COLORS.brand}18` : "transparent",
      color: active ? COLORS.brand : COLORS.body,
      flexShrink: 0, transition: "background .1s, color .1s",
      ...style,
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.bg; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
  >
    {children}
  </button>
);

// ─── Separator ────────────────────────────────────────────────────────────────
const Sep = () => (
  <div style={{ width: 1, height: 16, background: COLORS.border, margin: "0 2px", flexShrink: 0 }} />
);

// ─── Color picker popup ───────────────────────────────────────────────────────
const COLORS_GRID = [
  "#000000","#374151","#6B7280","#9CA3AF","#D1D5DB","#FFFFFF",
  "#DC2626","#EA580C","#CA8A04","#16A34A","#0369A1","#7C3AED",
  "#FCA5A5","#FCD34D","#6EE7B7","#93C5FD","#C4B5FD","#F9A8D4",
];

const ColorPicker = ({ onPick, onClose }) => (
  <div
    onMouseDown={e => e.preventDefault()}
    style={{
      position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 300,
      background: COLORS.white, border: `1px solid ${COLORS.border}`,
      borderRadius: 8, padding: 8, boxShadow: "0 4px 16px rgba(0,0,0,.12)",
      display: "grid", gridTemplateColumns: "repeat(6, 20px)", gap: 4,
    }}
  >
    {COLORS_GRID.map(c => (
      <button key={c} onMouseDown={e => { e.preventDefault(); onPick(c); onClose(); }}
        style={{
          width: 20, height: 20, borderRadius: 4, border: `1px solid ${COLORS.border}`,
          background: c, cursor: "pointer", padding: 0,
        }} />
    ))}
  </div>
);

// ─── Emoji picker (minimal) ───────────────────────────────────────────────────
const EMOJIS = ["😊","😂","👍","❤️","🔥","✅","⚠️","📌","📎","🎯","💡","🔧","📞","📧","🚗","🏠","💰","📅"];
const EmojiPicker = ({ onPick, onClose }) => (
  <div
    onMouseDown={e => e.preventDefault()}
    style={{
      position: "absolute", bottom: "calc(100% + 4px)", right: 0, zIndex: 300,
      background: COLORS.white, border: `1px solid ${COLORS.border}`,
      borderRadius: 8, padding: 8, boxShadow: "0 4px 16px rgba(0,0,0,.12)",
      display: "grid", gridTemplateColumns: "repeat(6, 28px)", gap: 2,
    }}
  >
    {EMOJIS.map(em => (
      <button key={em} onMouseDown={e => { e.preventDefault(); onPick(em); onClose(); }}
        style={{ width: 28, height: 28, fontSize: 16, border: "none", background: "transparent", cursor: "pointer", borderRadius: 4 }}
        onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >{em}</button>
    ))}
  </div>
);

// ─── RichTextEditor ───────────────────────────────────────────────────────────
const RichTextFileEditor = ({
  placeholder = "Describe the issue…",
  files = [],
  setFiles,
  minHeight = 100,
  getValueRef,   // optional: { current } → set to () => editorRef.current?.innerHTML
}) => {
  const editorRef  = useRef(null);
  const fileRef    = useRef(null);
  const [focused,  setFocused]  = useState(false);
  const [showTextColor,   setShowTextColor]   = useState(false);
  const [showHighlight,   setShowHighlight]   = useState(false);
  const [showEmoji,       setShowEmoji]       = useState(false);
  const [activeStates,    setActiveStates]    = useState({});

  // expose getValue
  useEffect(() => {
    if (getValueRef) getValueRef.current = () => editorRef.current?.innerHTML ?? "";
  }, [getValueRef]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    updateActive();
  };

  const updateActive = () => {
    setActiveStates({
      bold:        document.queryCommandState("bold"),
      italic:      document.queryCommandState("italic"),
      underline:   document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      orderedList: document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      justifyLeft:   document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight:  document.queryCommandState("justifyRight"),
      justifyFull:   document.queryCommandState("justifyFull"),
    });
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Image URL:");
    if (url) exec("insertImage", url);
  };

  const insertTable = () => {
    const html = `<table border="1" style="border-collapse:collapse;width:100%;font-size:13px;">
      <tr><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td></tr>
      <tr><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td></tr>
    </table><p></p>`;
    exec("insertHTML", html);
  };

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles?.(prev => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (i) => setFiles?.(prev => prev.filter((_, j) => j !== i));

  const formatSize = (bytes) =>
    bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + " MB" : Math.round(bytes / 1024) + " KB";

  const fileIcon = (f) =>
    f.type.startsWith("image") ? "🖼" : f.type === "application/pdf" ? "📄" : "📎";

  const closeAllPopups = () => {
    setShowTextColor(false);
    setShowHighlight(false);
    setShowEmoji(false);
  };

  // close popups on outside click
  useEffect(() => {
    const handler = () => closeAllPopups();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const tb = COLORS.body;

  return (
    <div style={{ fontFamily: FONTS.sans }}>
      <div style={{
        border: `1.5px solid ${focused ? COLORS.brand : COLORS.border}`,
        borderRadius: 9,
        overflow: "visible",
        background: COLORS.white,
        transition: "border-color .15s, box-shadow .15s",
        boxShadow: focused ? `0 0 0 3px ${COLORS.brand}18` : "none",
        position: "relative",
      }}>

        {/* ── Toolbar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 1,
          padding: "5px 8px", flexWrap: "wrap",
          borderBottom: `1px solid ${COLORS.border}`,
          background: "#F9FAFB",
          borderRadius: "8px 8px 0 0",
        }}>

          {/* Paragraph format */}
          <select
            onMouseDown={e => e.stopPropagation()}
            onChange={e => { exec("formatBlock", e.target.value); }}
            style={{
              fontSize: 12, border: `1px solid ${COLORS.border}`,
              background: COLORS.white, color: COLORS.body, cursor: "pointer",
              padding: "3px 4px", borderRadius: 5, fontFamily: FONTS.sans,
              height: 26, outline: "none", marginRight: 2,
            }}
          >
            <option value="p">Normal</option>
            <option value="h2">Heading 1</option>
            <option value="h3">Heading 2</option>
            <option value="h4">Heading 3</option>
          </select>

          <Sep />

          {/* Lists */}
          <Btn title="Ordered list" active={activeStates.orderedList} onClick={() => exec("insertOrderedList")}>
            <Ic viewBox="0 0 16 16">
              <line x1="6" y1="4" x2="14" y2="4"/><line x1="6" y1="8" x2="14" y2="8"/><line x1="6" y1="12" x2="14" y2="12"/>
              <text x="1" y="4.8" fontSize="4" fill={tb} stroke="none" fontFamily="sans-serif">1.</text>
              <text x="1" y="8.8" fontSize="4" fill={tb} stroke="none" fontFamily="sans-serif">2.</text>
              <text x="1" y="12.8" fontSize="4" fill={tb} stroke="none" fontFamily="sans-serif">3.</text>
            </Ic>
          </Btn>
          <Btn title="Bullet list" active={activeStates.unorderedList} onClick={() => exec("insertUnorderedList")}>
            <Ic viewBox="0 0 16 16">
              <circle cx="2.5" cy="4" r="1.2" fill={tb} stroke="none"/><line x1="5.5" y1="4" x2="14" y2="4"/>
              <circle cx="2.5" cy="8" r="1.2" fill={tb} stroke="none"/><line x1="5.5" y1="8" x2="14" y2="8"/>
              <circle cx="2.5" cy="12" r="1.2" fill={tb} stroke="none"/><line x1="5.5" y1="12" x2="14" y2="12"/>
            </Ic>
          </Btn>

          <Sep />

          {/* Alignment */}
          <Btn title="Align left"   active={activeStates.justifyLeft}   onClick={() => exec("justifyLeft")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3"/><line x1="1" y1="6.5" x2="10" y2="6.5"/><line x1="1" y1="10" x2="15" y2="10"/><line x1="1" y1="13.5" x2="10" y2="13.5"/></Ic>
          </Btn>
          <Btn title="Align center" active={activeStates.justifyCenter} onClick={() => exec("justifyCenter")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3"/><line x1="4" y1="6.5" x2="12" y2="6.5"/><line x1="1" y1="10" x2="15" y2="10"/><line x1="4" y1="13.5" x2="12" y2="13.5"/></Ic>
          </Btn>
          <Btn title="Align right"  active={activeStates.justifyRight}  onClick={() => exec("justifyRight")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3"/><line x1="6" y1="6.5" x2="15" y2="6.5"/><line x1="1" y1="10" x2="15" y2="10"/><line x1="6" y1="13.5" x2="15" y2="13.5"/></Ic>
          </Btn>
          <Btn title="Justify"      active={activeStates.justifyFull}   onClick={() => exec("justifyFull")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3"/><line x1="1" y1="6.5" x2="15" y2="6.5"/><line x1="1" y1="10" x2="15" y2="10"/><line x1="1" y1="13.5" x2="15" y2="13.5"/></Ic>
          </Btn>

          <Sep />

          {/* Text formatting */}
          <Btn title="Bold"          active={activeStates.bold}          onClick={() => exec("bold")}>
            <strong style={{ fontSize: 13, fontFamily: "serif" }}>B</strong>
          </Btn>
          <Btn title="Italic"        active={activeStates.italic}        onClick={() => exec("italic")}>
            <em style={{ fontSize: 13, fontFamily: "serif" }}>I</em>
          </Btn>
          <Btn title="Underline"     active={activeStates.underline}     onClick={() => exec("underline")}>
            <u style={{ fontSize: 13 }}>U</u>
          </Btn>
          <Btn title="Strikethrough" active={activeStates.strikeThrough} onClick={() => exec("strikeThrough")}>
            <s style={{ fontSize: 13 }}>S</s>
          </Btn>

          <Sep />

          {/* Image */}
          <Btn title="Insert image" onClick={insertImage}>
            <Ic viewBox="0 0 16 16">
              <rect x="1" y="2" width="14" height="12" rx="1.5"/>
              <circle cx="5.5" cy="6" r="1.5"/>
              <path d="M1 11l4-4 3 3 2-2 5 5"/>
            </Ic>
          </Btn>

          {/* Link */}
          <Btn title="Insert link" onClick={insertLink}>
            <Ic d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7.5 3.5M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
          </Btn>

          {/* Table */}
          <Btn title="Insert table" onClick={insertTable}>
            <Ic viewBox="0 0 16 16" stroke={tb}>
              <rect x="1" y="1" width="14" height="14" rx="1"/>
              <line x1="1" y1="5.5" x2="15" y2="5.5"/>
              <line x1="1" y1="10" x2="15" y2="10"/>
              <line x1="5.5" y1="5.5" x2="5.5" y2="15"/>
              <line x1="10" y1="5.5" x2="10" y2="15"/>
            </Ic>
          </Btn>

          <Sep />

          {/* Text color */}
          <div style={{ position: "relative" }} onMouseDown={e => e.stopPropagation()}>
            <Btn title="Text color" onClick={() => { setShowHighlight(false); setShowEmoji(false); setShowTextColor(v => !v); }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "serif", lineHeight: 1 }}>A</span>
                <div style={{ width: 14, height: 3, borderRadius: 1, background: "#DC2626" }} />
              </div>
            </Btn>
            {showTextColor && (
              <ColorPicker
                onPick={(c) => exec("foreColor", c)}
                onClose={() => setShowTextColor(false)}
              />
            )}
          </div>

          {/* Highlight */}
          <div style={{ position: "relative" }} onMouseDown={e => e.stopPropagation()}>
            <Btn title="Highlight color" onClick={() => { setShowTextColor(false); setShowEmoji(false); setShowHighlight(v => !v); }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Ic viewBox="0 0 16 16" size={12}>
                  <path d="M3 13l2-2 6-6-2-2-6 6z" fill="#FCD34D" stroke="#CA8A04" strokeWidth="1"/>
                  <line x1="2" y1="14" x2="14" y2="14"/>
                </Ic>
                <div style={{ width: 14, height: 3, borderRadius: 1, background: "#FCD34D" }} />
              </div>
            </Btn>
            {showHighlight && (
              <ColorPicker
                onPick={(c) => exec("hiliteColor", c)}
                onClose={() => setShowHighlight(false)}
              />
            )}
          </div>

          <Sep />

          {/* Indent */}
          <Btn title="Indent" onClick={() => exec("indent")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3"/><line x1="5" y1="6.5" x2="15" y2="6.5"/><line x1="5" y1="10" x2="15" y2="10"/><line x1="1" y1="13.5" x2="15" y2="13.5"/><polyline points="1,6.5 3.5,8 1,9.5"/></Ic>
          </Btn>

          {/* Clear formatting */}
          <Btn title="Clear formatting" onClick={() => exec("removeFormat")}>
            <Ic viewBox="0 0 16 16">
              <path d="M4 3h8L9 8.5V12l-2 1V8.5z"/><line x1="2" y1="14" x2="7" y2="14"/>
              <line x1="11" y1="3" x2="14" y2="6" strokeWidth="2"/>
            </Ic>
          </Btn>
        </div>

        {/* ── Content area ── */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyUp={updateActive}
          onMouseUp={updateActive}
          style={{
            minHeight,
            padding: "10px 20px",
            fontSize: 13,
            color: COLORS.h2,
            fontFamily: FONTS.sans,
            outline: "none",
            lineHeight: 1.65,
            borderRadius: "0 0 8px 8px",
          }}
        />

        {/* ── Emoji button — bottom right inside editor ── */}
        <div style={{ position: "absolute", bottom: 6, right: 8, zIndex: 10 }} onMouseDown={e => e.stopPropagation()}>
          <div style={{ position: "relative" }}>
            <Btn title="Insert emoji" onClick={() => { setShowTextColor(false); setShowHighlight(false); setShowEmoji(v => !v); }}
              style={{ width: 24, height: 24, fontSize: 14, borderRadius: 4, background: "none" }}>
              <span style={{ fontSize: 14 }}>🙂</span>
            </Btn>
            {showEmoji && (
              <EmojiPicker
                onPick={(em) => { editorRef.current?.focus(); exec("insertText", em); }}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Upload file row ── */}
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: COLORS.brand, cursor: "pointer", fontWeight: 500 }}>
          <Ic size={13} viewBox="0 0 14 14" strokeWidth="1.8">
            <path d="M2 10v2h10v-2"/><line x1="7" y1="2" x2="7" y2="9"/><polyline points="4.5,4.5 7,2 9.5,4.5"/>
          </Ic>
          Upload File
          <input type="file" multiple hidden accept="image/*,.pdf,.mp4,.doc,.docx" onChange={handleFiles} ref={fileRef} />
        </label>
        <span style={{ fontSize: 11, color: COLORS.faint }}>PDF, JPG, PNG, MP4 · max 10 MB</span>
      </div>

      {/* ── File chips ── */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              borderRadius: 7, padding: "4px 10px",
              fontSize: 12, color: COLORS.h2,
            }}>
              <span style={{ fontSize: 13 }}>{fileIcon(f)}</span>
              <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              <span style={{ color: COLORS.faint, fontSize: 11 }}>{formatSize(f.size)}</span>
              <button onClick={() => removeFile(i)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: COLORS.faint, padding: "0 0 0 2px", lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Placeholder CSS */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] table { border-collapse: collapse; width: 100%; }
        [contenteditable] td, [contenteditable] th { border: 1px solid #D1D5DB; padding: 5px 8px; min-width: 60px; }
        [contenteditable] a { color: #2563EB; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default RichTextFileEditor;