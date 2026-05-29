/**
 * EditableDetailView — universal edit-mode wrapper
 *
 * Usage (fields mode — standard):
 *   <EditableDetailView id="LD-088" fields={fields} data={lead} onSave={...} />
 *
 * Usage (children render-prop — custom layout):
 *   <EditableDetailView id="CU-001" data={cust} fields={fields} onSave={...}>
 *     {({ editMode, editData, setEditData }) => <YourCustomLayout ... />}
 *   </EditableDetailView>
 *
 * When children is a function, the main card / sidebar / extra / field grid are
 * NOT rendered — only the top bar, edit banner, delete modal, and children output.
 */

import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { BackBtn } from '../../components/ui/Cards';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

// ─── Internal helpers ─────────────────────────────────────────────────────────

const FieldLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, color: COLORS.faint,
    textTransform: "uppercase", letterSpacing: .5, marginBottom: 4,
  }}>
    {children}
  </div>
);

const inputBase = {
  padding: "7px 10px", borderRadius: 7,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13, color: COLORS.h2,
  background: "#FAFAFA",
  fontFamily: FONTS.sans,
  width: "100%", outline: "none",
  transition: "border-color .15s",
  boxSizing: "border-box",
};

const EditInput = ({ field, value, onChange }) => {
  const style = {
    ...inputBase,
    fontFamily: field.mono ? FONTS.mono : FONTS.sans,
    fontSize: field.hero ? 18 : field.large ? 15 : 13,
    fontWeight: field.hero ? 800 : field.large ? 700 : 400,
  };

  if (field.type === "select") {
    return (
      <select value={value} onChange={onChange} style={{ ...style, cursor: "pointer" }}>
        {(field.options || []).map(opt => (
          <option key={typeof opt === "object" ? opt.value : opt}
            value={typeof opt === "object" ? opt.value : opt}>
            {typeof opt === "object" ? opt.label : opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea value={value} onChange={onChange}
        rows={3}
        style={{ ...style, resize: "vertical", minHeight: 75, lineHeight: 1.5 }} />
    );
  }

  return (
    <input
      type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
      value={value}
      onChange={onChange}
      style={style}
    />
  );
};

const ReadValue = ({ field, value, data }) => {
  if (field.render) return field.render(value, data);

  if (field.type === "badge" && field.badgeMap) {
    return <SBadge s={value} map={field.badgeMap} />;
  }

  const style = {
    fontSize: field.hero ? 20 : field.large ? 16 : 13,
    fontWeight: field.hero ? 800 : field.large ? 700 : 500,
    color: field.valueRight ? COLORS.brand : COLORS.h2,
    fontFamily: field.mono ? FONTS.mono : FONTS.sans,
  };

  return <div style={style}>{value}</div>;
};

// ─── EditableDetailView ───────────────────────────────────────────────────────

const EditableDetailView = ({
  id,
  breadcrumb = "Records",
  onBack,
  fields = [],
  data,
  initialEditMode = false,
  onSave,
  onDelete,
  actions,
  sidebar,
  sidebarEdit,
  extra,
  extraEdit,
  extraEditHidden = true,
  children,               // render prop: ({ editMode, editData, setEditData }) => JSX
}) => {
  const seedData = () => {
    const s = {};
    fields.forEach(f => { if (f.key) s[f.key] = data[f.key] ?? ""; });
    return s;
  };

  const [editMode, setEditMode]     = useState(initialEditMode);
  const [editData, setEditData]     = useState(initialEditMode ? seedData() : {});
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (initialEditMode) {
      setEditData(seedData());
      setEditMode(true);
    } else {
      setEditMode(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, initialEditMode]);

  const enterEdit = () => {
    setEditData(seedData());
    setEditMode(true);
  };

  const handleSave = () => {
    onSave?.({ ...data, ...editData });
    setEditMode(false);
  };

  const handleCancel = () => setEditMode(false);

  const set = (key) => (e) =>
    setEditData(prev => ({ ...prev, [key]: e.target.value }));

  // ── Render-prop mode: children owns the entire body layout ────────────────
  const isRenderProp = typeof children === "function";

  const heroFields = fields.filter(f => f.hero);
  const gridFields = fields.filter(f => !f.hero);

  const currentSidebar = editMode ? (sidebarEdit ?? sidebar) : sidebar;

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <BackBtn onClick={onBack} />
        <span style={{ fontSize: 14, color: COLORS.muted }}>{breadcrumb} /</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.brand, fontFamily: FONTS.mono }}>{id}</span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {editMode ? (
            <>
              <button onClick={handleCancel}
                style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.white, color: COLORS.body }}>
                Cancel
              </button>
              <button onClick={handleSave}
                style={{ padding: "7px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", boxShadow: `0 3px 10px ${COLORS.brand}40` }}>
                ✓ Save Changes
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={enterEdit}
                style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${COLORS.brand}`, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.brandL, color: COLORS.brand }}>
                ✎ Edit
              </button>
              {onDelete && (
                <button onClick={() => setShowDelete(true)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #FECACA", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#FEF2F2", color: "#DC2626" }}>
                  🗑
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit mode banner ── */}
      {editMode && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#92400E", display: "flex", alignItems: "center", gap: 8 }}>
          ✏️ Editing <strong>{id}</strong> — changes won't be saved until you click <strong>Save Changes</strong>.
        </div>
      )}

      {/* ── Body ── */}
      {isRenderProp
        // ── Render-prop mode: hand full layout control to the caller ──────────
        ? children({ editMode, editData, setEditData })

        // ── Standard fields mode: original card + sidebar layout ──────────────
        : (
          <div style={{ display: "grid", gridTemplateColumns: currentSidebar ? "1fr 300px" : "1fr", gap: 16 }}>

            {/* Main card */}
            <div style={{
              background: COLORS.white, borderRadius: 14,
              border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
              padding: 24,
              boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : "0 1px 4px rgba(0,0,0,.05)",
              transition: "all .2s",
            }}>
              {heroFields.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  {heroFields.map(f => (
                    <div key={f.key} style={{ marginBottom: 10 }}>
                      {editMode
                        ? <EditInput field={f} value={editData[f.key] ?? ""} onChange={set(f.key)} />
                        : <ReadValue field={f} value={data[f.key]} data={data} />}
                    </div>
                  ))}
                </div>
              )}

              {gridFields.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                  {gridFields.map(f => (
                    <div key={f.key || f.label} style={{ gridColumn: f.span === 2 ? "1 / -1" : undefined }}>
                      <FieldLabel>{f.label}</FieldLabel>
                      {f.type === "readonly"
                        ? <ReadValue field={f} value={data[f.key]} data={data} />
                        : editMode
                          ? <EditInput field={f} value={editData[f.key] ?? ""} onChange={set(f.key)} />
                          : <ReadValue field={f} value={data[f.key]} data={data} />}
                    </div>
                  ))}
                </div>
              )}

              {editMode
                ? (extraEdit ? extraEdit : (!extraEditHidden && extra))
                : extra}

              {!editMode && actions && (
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>{actions}</div>
              )}

              {editMode && (
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, marginTop: 20 }}>
                  <button onClick={handleCancel}
                    style={{ padding: "10px 24px", borderRadius: 9, border: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.white, color: COLORS.body }}>
                    Cancel
                  </button>
                  <button onClick={handleSave}
                    style={{ padding: "10px 28px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: "white", boxShadow: `0 4px 12px ${COLORS.brand}40` }}>
                    ✓ Save Changes
                  </button>
                </div>
              )}
            </div>

            {currentSidebar && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {currentSidebar}
              </div>
            )}
          </div>
        )
      }

      {/* Delete confirm */}
      {onDelete && (
        <DeleteConfirmModal
          isOpen={showDelete}
          onConfirm={() => { onDelete(); setShowDelete(false); }}
          onCancel={() => setShowDelete(false)}
          message="This record will be permanently removed and cannot be recovered."
        />
      )}
    </div>
  );
};

export default EditableDetailView;