import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, Avatar } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { tasksApi, techsApi } from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const TASK_STATUS_MAP = {
  todo:        { label: 'To Do',       bg: '#F8FAFC', color: '#475569' },
  in_progress: { label: 'In Progress', bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  done:        { label: 'Done',        bg: '#F0FDF4', color: '#166534', dot: '#22C55E' },
};
const PRIO_COLOR = {
  urgent: { color: '#DC2626', bg: '#FEF2F2' },
  high:   { color: '#EA580C', bg: '#FFF7ED' },
  normal: { color: '#2563EB', bg: '#EFF6FF' },
  low:    { color: '#16A34A', bg: '#F0FDF4' },
};
const COLUMNS    = ['todo', 'in_progress', 'done'];
const CATEGORIES = ['Sales', 'HR', 'Operations', 'Service', 'Admin', 'Finance'];
const PRIORITIES = ['urgent', 'high', 'normal', 'low'];

const TASK_COLUMNS = [
  { label: 'ID',          key: 'id',        width: 12 },
  { label: 'Task',        key: 'title',      width: 32 },
  { label: 'Category',    key: 'category',   width: 14 },
  { label: 'Assigned To', key: 'assignedTo', width: 18 },
  { label: 'Due Date',    key: 'due',        width: 16 },
  { label: 'Priority',    key: 'priority',   width: 10 },
  { label: 'Status',      key: 'status',     width: 14, format: v => TASK_STATUS_MAP[v]?.label ?? v },
];

// ─── Task Modal ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '', category: 'Sales', assignedTo: 'Admin',
  due: '', priority: 'normal', status: 'todo', notes: '',
};

function TaskModal({ mode, task, onClose, onSave }) {
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [liveTechs,  setLiveTechs]  = useState([]);
  const [techsLoading, setTechsLoading] = useState(false);

  // fetch technicians when modal mounts
  useEffect(() => {
    setTechsLoading(true);
    techsApi.list({ limit: 100 })
      .then(r => {
        const list = Array.isArray(r?.data) ? r.data : [];
        setLiveTechs(list);
      })
      .catch(() => setLiveTechs([]))
      .finally(() => setTechsLoading(false));
  }, []);

  // populate form on edit
  useEffect(() => {
    if (mode === 'edit' && task) {
      setForm({
        title:      task.title      || '',
        category:   task.category   || 'Sales',
        assignedTo: task.assignedTo || 'Admin',
        due:        task.due        || '',
        priority:   task.priority   || 'normal',
        status:     task.status     || 'todo',
        notes:      task.notes      || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [mode, task]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim())      return setError('Title is required.');
    if (!form.assignedTo.trim()) return setError('Assigned To is required.');
    if (!form.due)               return setError('Due date is required.');
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${COLORS.border}`, fontSize: 13,
    color: COLORS.h2, background: COLORS.bg,
    boxSizing: 'border-box', outline: 'none',
    fontFamily: FONTS.sans,
  };
  const lbl = {
    fontSize: 12, fontWeight: 600, color: COLORS.h2,
    marginBottom: 4, display: 'block',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      {/* hide scrollbar */}
      <style>{`
        .tm-scroll::-webkit-scrollbar { display: none; }
        .tm-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <div style={{
        background: 'white', borderRadius: 16,
        width: 520, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        {/* ── fixed header ── */}
        <div style={{
          padding: '24px 28px 16px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.h1 }}>
            {mode === 'edit' ? '✏️ Edit Task' : '+ New Task'}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.faint }}
          >×</button>
        </div>

        {/* ── scrollable body ── */}
        <div
          className="tm-scroll"
          style={{ overflowY: 'auto', padding: '20px 28px', flex: 1 }}
        >
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#DC2626',
              padding: '8px 12px', borderRadius: 8,
              fontSize: 12, marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Title */}
            <div>
              <label style={lbl}>Task Title *</label>
              <input
                style={inp}
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Follow up with client…"
                autoFocus
              />
            </div>

            {/* Category + Assigned To */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Category *</label>
                <select style={inp} value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Assigned To *</label>
                <select
                  style={inp}
                  value={form.assignedTo}
                  onChange={e => set('assignedTo', e.target.value)}
                >
                  <option value="Admin">👤 Admin</option>
                  {techsLoading
                    ? <option disabled>Loading…</option>
                    : liveTechs.map(t => (
                        <option key={t._id || t.id} value={t.name}>
                          {t.name}{t.role ? ` — ${t.role}` : ''}
                        </option>
                      ))
                  }
                </select>
              </div>
            </div>

            {/* Due Date + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Due Date *</label>
                <input
                  style={inp}
                  type="date"
                  value={form.due}
                  onChange={e => set('due', e.target.value)}
                />
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <select style={inp} value={form.priority} onChange={e => set('priority', e.target.value)}>
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>
                      {p === 'urgent' ? '🔴' : p === 'high' ? '🟠' : p === 'normal' ? '🔵' : '🟢'}{' '}
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={lbl}>Status</label>
              <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(TASK_STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label style={lbl}>Notes</label>
              <textarea
                style={{ ...inp, minHeight: 80, resize: 'vertical' }}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Optional notes…"
              />
            </div>

          </div>
        </div>

        {/* ── fixed footer — never scrolls away ── */}
        <div style={{
          padding: '16px 28px',
          borderTop: `1px solid ${COLORS.border}`,
          display: 'flex', gap: 10,
          flexShrink: 0, background: 'white',
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 9,
              border: `1px solid ${COLORS.border}`, background: 'white',
              color: COLORS.h2, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, padding: '11px 0', borderRadius: 9,
              background: saving
                ? '#CBD5E1'
                : `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
              color: 'white', fontSize: 13, fontWeight: 700,
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Done Confirm Modal ───────────────────────────────────────────────────────
function DoneModal({ task, onConfirm, onCancel, saving }) {
  if (!task) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001,
    }}>
      <div style={{
        background: 'white', borderRadius: 14, padding: '28px 32px',
        width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: '#F0FDF4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, margin: '0 auto 16px',
        }}>✅</div>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
            Mark as Done?
          </div>
          <div style={{
            background: '#F8FAFC', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: '#475569', textAlign: 'left',
          }}>
            {task.title}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={saving} style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: `1px solid ${COLORS.border}`, background: 'white',
            color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={saving} style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: 'none', background: saving ? '#BBF7D0' : '#16A34A',
            color: 'white', fontSize: 13, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving…' : 'Mark Done'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ task, onConfirm, onCancel, saving }) {
  if (!task) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001,
    }}>
      <div style={{
        background: 'white', borderRadius: 14, padding: '28px 32px',
        width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, margin: '0 auto 16px',
        }}>🗑️</div>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
            Delete Task?
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>
            This task will be moved to Recently Deleted.
          </div>
          <div style={{
            background: '#F8FAFC', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: '#475569', textAlign: 'left',
          }}>
            {task.title}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={saving} style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: `1px solid ${COLORS.border}`, background: 'white',
            color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={saving} style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: 'none', background: saving ? '#FCA5A5' : '#EF4444',
            color: 'white', fontSize: 13, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Action Dropdown ──────────────────────────────────────────────────────
function ActionDropdown({ task, onEdit, onDelete, onMarkDone }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const item = (label, color, onClick) => (
    <button
      onClick={() => { onClick(); setOpen(false); }}
      style={{
        display: 'block', width: '100%', padding: '8px 14px',
        textAlign: 'left', background: 'none', border: 'none',
        fontSize: 13, color: color || COLORS.h2, cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '4px 8px', borderRadius: 6,
          background: COLORS.bg, border: `1px solid ${COLORS.border}`,
          cursor: 'pointer', fontSize: 14, color: COLORS.muted,
        }}
      >
        ⋯
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', zIndex: 100,
          background: 'white', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: `1px solid ${COLORS.border}`,
          minWidth: 140, overflow: 'hidden',
        }}>
          {task.status !== 'done' && item('✅ Mark Done', '#16A34A', onMarkDone)}
          {item('✏️ Edit',   COLORS.h2, onEdit)}
          {item('🗑 Delete', '#EF4444', onDelete)}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TaskManagerPage = () => {
  const [view,         setView]         = useState('list');
  const [tasks,        setTasks]        = useState([]);
  const [stats,        setStats]        = useState({ todo: 0, in_progress: 0, done: 0, urgent: 0 });
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [taskModal,    setTaskModal]    = useState(null);
  const [doneModal,    setDoneModal]    = useState(null);
  const [deleteModal,  setDeleteModal]  = useState(null);
  const [actionSaving, setActionSaving] = useState(false);

  // drag state
  const [draggingId,    setDraggingId]    = useState(null);
  const [dragOverCol,   setDragOverCol]   = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const ghostRef = useRef(null);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        tasksApi.list({ limit: 200 }),
        tasksApi.stats(),
      ]);
      if (tRes.success) setTasks(tRes.data);
      if (sRes.success) setStats(sRes.data);
    } catch {
      setError('Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── search / filter ───────────────────────────────────────────────────────
  const { q, setQ, activeFilters, setFilter, filtered: searchFiltered } =
    useTableSearch(tasks, ['id', 'title', 'category', 'assignedTo'], { status: '', priority: '' });

  const filtered = searchFiltered
    .filter(t => !activeFilters.status   || t.status   === activeFilters.status)
    .filter(t => !activeFilters.priority || t.priority === activeFilters.priority);

  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } =
    usePagination(filtered, 10);

  const { exportProps } = useExport({
    title:    'Task Manager',
    filename: 'cooltech-tasks',
    template: 'generic_list',
    subtitle: `AC Services Platform · Tasks · ${filtered.length} records`,
    docId:    'TASKS-EXPORT',
    columns:  TASK_COLUMNS,
    rows:     filtered,
  });

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    const res = await tasksApi.create(form);
    if (!res.success) throw new Error(res.message);
    setTasks(prev => [res.data, ...prev]);
    setStats(prev => ({ ...prev, [res.data.status]: (prev[res.data.status] || 0) + 1 }));
  };

  const handleEdit = async (form) => {
    const res = await tasksApi.update(taskModal.task._id, form);
    if (!res.success) throw new Error(res.message);
    setTasks(prev => prev.map(t => t._id === res.data._id ? res.data : t));
  };

  const handleMarkDone = async () => {
    setActionSaving(true);
    try {
      const res = await tasksApi.updateStatus(doneModal._id, 'done');
      if (res.success) {
        setTasks(prev => prev.map(t => t._id === doneModal._id ? { ...t, status: 'done' } : t));
        setStats(prev => ({
          ...prev,
          [doneModal.status]: Math.max(0, (prev[doneModal.status] || 0) - 1),
          done: (prev.done || 0) + 1,
        }));
        setDoneModal(null);
      }
    } catch {
      setError('Could not update status.');
    } finally {
      setActionSaving(false);
    }
  };

  const handleDelete = async () => {
    setActionSaving(true);
    try {
      const res = await tasksApi.delete(deleteModal._id);
      if (res.success) {
        setTasks(prev => prev.filter(t => t._id !== deleteModal._id));
        setStats(prev => ({
          ...prev,
          [deleteModal.status]: Math.max(0, (prev[deleteModal.status] || 0) - 1),
        }));
        setDeleteModal(null);
      }
    } catch {
      setError('Could not delete task.');
    } finally {
      setActionSaving(false);
    }
  };

  // ── drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (e, taskId) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    const el    = e.currentTarget;
    const rect  = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.style.cssText = `position:fixed;top:-1000px;left:-1000px;width:${rect.width}px;opacity:.88;transform:rotate(2deg) scale(1.03);box-shadow:0 12px 32px rgba(0,0,0,.22);border-radius:10px;pointer-events:none;z-index:9999;`;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    e.dataTransfer.setDragImage(ghost, rect.width / 2, 30);
  };

  const handleDragEnd = () => {
    setDraggingId(null); setDragOverCol(null); setDragOverIndex(null);
    if (ghostRef.current) { document.body.removeChild(ghostRef.current); ghostRef.current = null; }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const tempId = e.dataTransfer.getData('text/plain');
    if (!tempId) return;
    const task = tasks.find(t => t.id === tempId || t._id === tempId);
    if (!task || task.status === targetStatus) return;
    setTasks(prev => prev.map(t => (t.id === tempId || t._id === tempId) ? { ...t, status: targetStatus } : t));
    setDraggingId(null); setDragOverCol(null); setDragOverIndex(null);
    try {
      await tasksApi.updateStatus(task._id, targetStatus);
    } catch {
      setTasks(prev => prev.map(t => (t.id === tempId || t._id === tempId) ? { ...t, status: task.status } : t));
      setError('Could not update task status.');
    }
  };

  const handleDragOver = (e, status, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status); setDragOverIndex(idx);
  };

  // ── Kanban column ─────────────────────────────────────────────────────────
  const KanbanCol = ({ status }) => {
    const m        = TASK_STATUS_MAP[status];
    const colTasks = tasks.filter(t => t.status === status);
    const isOver   = dragOverCol === status;

    return (
      <div
        onDragOver={e => handleDragOver(e, status, colTasks.length)}
        onDrop={e => handleDrop(e, status)}
        style={{
          background: isOver ? (m.bg ?? '#F9FAFB') : '#F9FAFB',
          borderRadius: 12, padding: 12, minHeight: 200,
          border: `2px ${isOver ? 'dashed' : 'solid'} ${isOver ? m.color : COLORS.border}`,
          transition: 'background .15s, border-color .15s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: m.color, background: m.bg, padding: '3px 10px', borderRadius: 99 }}>
            {m.label}
          </span>
          <span style={{ fontSize: 11, color: COLORS.faint, fontWeight: 600 }}>{colTasks.length}</span>
        </div>

        {colTasks.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.faint, textAlign: 'center', padding: '20px 0' }}>
            {isOver ? '📥 Drop here' : 'No tasks'}
          </div>
        )}

        {colTasks.map((task, idx) => {
          const isDragging = draggingId === (task.id || task._id);
          const prio       = PRIO_COLOR[task.priority] || PRIO_COLOR.normal;
          return (
            <div key={task._id || task.id}>
              {isOver && dragOverIndex === idx && !isDragging && (
                <div style={{ height: 3, borderRadius: 99, background: m.color, marginBottom: 4, opacity: 0.7 }} />
              )}
              <div
                draggable
                onDragStart={e => handleDragStart(e, task.id || task._id)}
                onDragEnd={handleDragEnd}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(idx); }}
                className="card"
                style={{
                  background: COLORS.white, borderRadius: 9,
                  border: `1px solid ${COLORS.border}`, padding: '11px 12px', marginBottom: 8,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  boxShadow: isDragging ? 'none' : '0 1px 4px rgba(0,0,0,.06)',
                  opacity: isDragging ? 0.3 : 1,
                  transform: isDragging ? 'scale(0.97)' : 'scale(1)',
                  transition: 'opacity .15s, transform .15s',
                  userSelect: 'none', borderLeft: `3px solid ${prio.color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: prio.bg, color: prio.color, textTransform: 'capitalize' }}>
                    {task.priority}
                  </span>
                  <TypeTag type={task.category} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: task.status === 'done' ? COLORS.muted : COLORS.h1, lineHeight: 1.5, marginBottom: 8, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                  {task.title}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Avatar name={task.assignedTo} size={20} />
                    <span style={{ fontSize: 10, color: COLORS.faint }}>{(task.assignedTo || '').split(' ')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: COLORS.faint }}>{task.due}</span>
                    {task.status !== 'done' && (
                      <button
                        onClick={e => { e.stopPropagation(); setDoneModal(task); }}
                        title="Mark done"
                        style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >✓</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setTaskModal({ mode: 'new' })}
          style={{ width: '100%', padding: '8px', borderRadius: 7, background: 'transparent', border: `1px dashed ${COLORS.border}`, color: COLORS.faint, fontSize: 12, cursor: 'pointer', marginTop: 4 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.color = m.color; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.faint; }}
        >+ Add Task</button>
      </div>
    );
  };

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionHdr title="Task Manager" sub={`${tasks.length} tasks · ${stats.todo} to do`} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 1, background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: 3 }}>
            {[['list', '☰ List'], ['kanban', '⊞ Board']].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: view === k ? COLORS.white : 'transparent',
                color: view === k ? COLORS.h1 : COLORS.muted,
                border: `1px solid ${view === k ? COLORS.border : 'transparent'}`,
                cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
          <button
            onClick={() => setTaskModal({ mode: 'new' })}
            style={{
              padding: '9px 22px', borderRadius: 9,
              background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
              color: 'white', fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer',
            }}
          >+ New Task</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 16px', borderRadius: 10, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <KCard label="To Do"       value={loading ? '…' : stats.todo}        sub="pending"       icon="📝" iconBg="#F8FAFC" color="#475569" />
        <KCard label="In Progress" value={loading ? '…' : stats.in_progress} sub="ongoing"       icon="🔄" iconBg="#FFFBEB" color="#B45309" />
        <KCard label="Done"        value={loading ? '…' : stats.done}        sub="completed"     icon="✅" iconBg="#F0FDF4" color="#16A34A" />
        <KCard label="Urgent"      value={loading ? '…' : stats.urgent}      sub="high priority" icon="🔴" iconBg="#FEF2F2" color="#DC2626" />
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {COLUMNS.map(status => <KanbanCol key={status} status={status} />)}
        </div>
      )}

      {/* List */}
      {view === 'list' && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'clip' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by task, category, assignee…" />
            <FilterSelect value={activeFilters.status}   onChange={val => setFilter('status', val)}   options={['todo','in_progress','done']} allLabel="All Statuses" />
            <FilterSelect value={activeFilters.priority} onChange={val => setFilter('priority', val)} options={PRIORITIES} allLabel="All Priorities" />
            <div style={{ marginLeft: 'auto' }}><ExportDropdown {...exportProps} /></div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <Thead cols={['ID', 'Task', 'Category', 'Assigned To', 'Due Date', 'Priority', 'Status', '']} />
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: COLORS.faint }}>Loading tasks…</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', color: COLORS.faint, fontSize: 13 }}>No tasks match your filters.</td></tr>
                ) : paginated.map((task, i) => (
                  <tr key={task._id || task.id} className="row" style={{
                    borderBottom: `1px solid ${COLORS.border}22`,
                    background: task.status === 'done' ? '#F9FAFB' : i % 2 === 0 ? COLORS.white : '#FAFAFA',
                  }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.brand }}>{task.id}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: task.status === 'done' ? COLORS.faint : COLORS.h1, textDecoration: task.status === 'done' ? 'line-through' : 'none', maxWidth: 280 }}>
                        {task.title}
                      </div>
                      {task.notes && (
                        <div style={{ fontSize: 11, color: COLORS.faint, marginTop: 2 }}>
                          {task.notes.slice(0, 60)}{task.notes.length > 60 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}><TypeTag type={task.category} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Avatar name={task.assignedTo} size={24} />
                        <span style={{ fontSize: 12, color: COLORS.body }}>{task.assignedTo}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: COLORS.muted }}>{task.due}</td>
                    <td style={{ padding: '12px 14px' }}><PBadge p={task.priority} /></td>
                    <td style={{ padding: '12px 14px' }}><SBadge s={task.status} map={TASK_STATUS_MAP} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <ActionDropdown
                        task={task}
                        onEdit={()    => setTaskModal({ mode: 'edit', task })}
                        onDelete={()  => setDeleteModal(task)}
                        onMarkDone={() => setDoneModal(task)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 0 && (
            <Pagination
              page={page} totalPages={totalPages} setPage={setPage}
              pageSize={pageSize} setPageSize={setPageSize}
              from={from} to={to} total={total}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal
          mode={taskModal.mode}
          task={taskModal.task}
          onClose={() => setTaskModal(null)}
          onSave={taskModal.mode === 'new' ? handleCreate : handleEdit}
        />
      )}
      <DoneModal
        task={doneModal}
        onConfirm={handleMarkDone}
        onCancel={() => setDoneModal(null)}
        saving={actionSaving}
      />
      <DeleteModal
        task={deleteModal}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
        saving={actionSaving}
      />
    </div>
  );
};

export default TaskManagerPage;