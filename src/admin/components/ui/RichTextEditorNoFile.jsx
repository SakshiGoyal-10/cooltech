import { useRef, useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';

const Ic = ({ d, size = 15, viewBox = "0 0 16 16", stroke = true, fill = false, children, ...rest }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill ? "currentColor" : "none"}
    stroke={stroke ? "currentColor" : "none"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

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

const Sep = () => (
  <div style={{ width: 1, height: 16, background: COLORS.border, margin: "0 2px", flexShrink: 0 }} />
);

const COLORS_GRID = [
  "#000000","#374151","#6B7280","#9CA3AF","#D1D5DB","#FFFFFF",
  "#DC2626","#EA580C","#CA8A04","#16A34A","#0369A1","#7C3AED",
  "#FCA5A5","#FCD34D","#6EE7B7","#93C5FD","#C4B5FD","#F9A8D4",
];

const ColorPicker = ({ onPick, onClose }) => (
  <div
    onMouseDown={e => e.preventDefault()}
    style={{
      position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 9999,
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

const EMOJIS = ["😊","😂","👍","❤️","🔥","✅","⚠️","📌","📎","🎯","💡","🔧","📞","📧","🚗","🏠","💰","📅"];
const EmojiPicker = ({ onPick, onClose }) => (
  <div
    onMouseDown={e => e.preventDefault()}
    style={{
      position: "absolute", bottom: "calc(100% + 4px)", right: 0, zIndex: 9999,
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

// ─── Main component ───────────────────────────────────────────────────────────
const RichTextEditorNoFile = ({
  placeholder = "Type here…",
  minHeight = 90,
  getValueRef,
}) => {
  const editorRef = useRef(null);
  const [focused,        setFocused]        = useState(false);
  const [showTextColor,  setShowTextColor]  = useState(false);
  const [showHighlight,  setShowHighlight]  = useState(false);
  const [showEmoji,      setShowEmoji]      = useState(false);
  const [activeStates,   setActiveStates]   = useState({});

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
      bold:          document.queryCommandState("bold"),
      italic:        document.queryCommandState("italic"),
      underline:     document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      orderedList:   document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      justifyLeft:   document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight:  document.queryCommandState("justifyRight"),
    });
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  useEffect(() => {
    const handler = () => {
      setShowTextColor(false);
      setShowHighlight(false);
      setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const tb = COLORS.body;

  return (
    <div style={{ fontFamily: FONTS.sans }}>
      <div style={{
        border: `1.5px solid ${focused ? COLORS.brand : COLORS.border}`,
        borderRadius: 9,
        background: COLORS.white,
        transition: "border-color .15s, box-shadow .15s",
        boxShadow: focused ? `0 0 0 3px ${COLORS.brand}18` : "none",
        position: "relative",
        overflow: "visible",
      }}>

        {/* ── Toolbar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 1,
          padding: "5px 8px", flexWrap: "wrap",
          borderBottom: `1px solid ${COLORS.border}`,
          background: "#F9FAFB",
          borderRadius: "8px 8px 0 0",
        }}>

          {/* Format select */}
          <select
            onMouseDown={e => e.stopPropagation()}
            onChange={e => exec("formatBlock", e.target.value)}
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

          {/* Bold / Italic / Underline / Strike */}
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

          {/* Lists */}
          <Btn title="Ordered list"  active={activeStates.orderedList}   onClick={() => exec("insertOrderedList")}>
            <Ic viewBox="0 0 16 16">
              <line x1="6" y1="4" x2="14" y2="4"/><line x1="6" y1="8" x2="14" y2="8"/><line x1="6" y1="12" x2="14" y2="12"/>
              <text x="1" y="4.8" fontSize="4" fill={tb} stroke="none" fontFamily="sans-serif">1.</text>
              <text x="1" y="8.8" fontSize="4" fill={tb} stroke="none" fontFamily="sans-serif">2.</text>
              <text x="1" y="12.8" fontSize="4" fill={tb} stroke="none" fontFamily="sans-serif">3.</text>
            </Ic>
          </Btn>
          <Btn title="Bullet list"   active={activeStates.unorderedList} onClick={() => exec("insertUnorderedList")}>
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

          <Sep />

          {/* Link */}
          <Btn title="Insert link" onClick={insertLink}>
            <Ic d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7.5 3.5M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
          </Btn>

          {/* Text color */}
          <div style={{ position: "relative" }} onMouseDown={e => e.stopPropagation()}>
            <Btn title="Text color" onClick={() => { setShowHighlight(false); setShowEmoji(false); setShowTextColor(v => !v); }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "serif", lineHeight: 1 }}>A</span>
                <div style={{ width: 14, height: 3, borderRadius: 1, background: "#DC2626" }} />
              </div>
            </Btn>
            {showTextColor && (
              <ColorPicker onPick={c => exec("foreColor", c)} onClose={() => setShowTextColor(false)} />
            )}
          </div>

          {/* Highlight */}
          <div style={{ position: "relative" }} onMouseDown={e => e.stopPropagation()}>
            <Btn title="Highlight" onClick={() => { setShowTextColor(false); setShowEmoji(false); setShowHighlight(v => !v); }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Ic viewBox="0 0 16 16" size={12}>
                  <path d="M3 13l2-2 6-6-2-2-6 6z" fill="#FCD34D" stroke="#CA8A04" strokeWidth="1"/>
                  <line x1="2" y1="14" x2="14" y2="14"/>
                </Ic>
                <div style={{ width: 14, height: 3, borderRadius: 1, background: "#FCD34D" }} />
              </div>
            </Btn>
            {showHighlight && (
              <ColorPicker onPick={c => exec("hiliteColor", c)} onClose={() => setShowHighlight(false)} />
            )}
          </div>

          <Sep />

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

        {/* ── Emoji button ── */}
        <div style={{ position: "absolute", bottom: 6, right: 8, zIndex: 10 }} onMouseDown={e => e.stopPropagation()}>
          <div style={{ position: "relative" }}>
            <Btn title="Insert emoji"
              onClick={() => { setShowTextColor(false); setShowHighlight(false); setShowEmoji(v => !v); }}
              style={{ width: 24, height: 24, fontSize: 14, borderRadius: 4, background: "none" }}>
              <span style={{ fontSize: 14 }}>🙂</span>
            </Btn>
            {showEmoji && (
              <EmojiPicker
                onPick={em => { editorRef.current?.focus(); exec("insertText", em); }}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] a { color: #2563EB; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default RichTextEditorNoFile;