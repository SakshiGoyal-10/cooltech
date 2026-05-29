import Task from '../models/taskModel.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg,  status = 500) => res.status(status).json({ success: false, message: msg });

// ─── Safe date formatter ───────────────────────────────────────────────────────
// Handles both Date objects and strings, returns YYYY-MM-DD or null
const fmtDate = (d) => {
  if (!d) return null;
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  } catch {
    return null;
  }
};

// ─── Shared task mapper ────────────────────────────────────────────────────────
const mapTask = (t) => ({
  id:         t.taskId,
  _id:        t._id.toString(),
  title:      t.title,
  category:   t.category,
  assignedTo: t.assignedTo,
  due:        fmtDate(t.due),   // ← safe for both Date & string
  priority:   t.priority,
  status:     t.status,
  notes:      t.notes || '',
  createdAt:  t.createdAt,
  deletedAt:  t.deletedAt,
  deletedBy:  t.deletedBy,
  isDeleted:  t.isDeleted,
});

// GET /api/tasks?search=&status=&priority=&category=&page=1&limit=20
export const getTasks = async (req, res) => {
  try {
    const { search = '', status, priority, category, page = 1, limit = 20 } = req.query;
    const q = { isDeleted: false };

    if (search) q.$or = [
      { title:      { $regex: search, $options: 'i' } },
      { assignedTo: { $regex: search, $options: 'i' } },
      { category:   { $regex: search, $options: 'i' } },
      { taskId:     { $regex: search, $options: 'i' } },
    ];
    if (status   && status   !== 'all') q.status   = status;
    if (priority && priority !== 'all') q.priority = priority;
    if (category && category !== 'all') q.category = category;

    const total = await Task.countDocuments(q);
    const tasks = await Task.find(q)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    res.json({
      success: true,
      data: tasks.map(mapTask),
      pagination: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) },
    });
  } catch (e) { err(res, e.message); }
};

// GET /api/tasks/stats
export const getTaskStats = async (req, res) => {
  try {
    const [todo, in_progress, done, urgent] = await Promise.all([
      Task.countDocuments({ status: 'todo',        isDeleted: false }),
      Task.countDocuments({ status: 'in_progress', isDeleted: false }),
      Task.countDocuments({ status: 'done',        isDeleted: false }),
      Task.countDocuments({ status: { $ne: 'done' }, priority: 'urgent', isDeleted: false }),
    ]);
    ok(res, { todo, in_progress, done, urgent });
  } catch (e) { err(res, e.message); }
};

// GET /api/tasks/deleted
export const getDeletedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isDeleted: true }).sort({ deletedAt: -1 });
    ok(res, tasks.map(mapTask));
  } catch (e) { err(res, e.message); }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.isDeleted) return err(res, 'Task not found', 404);
    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, category, assignedTo, due, priority, status, notes } = req.body;
    if (!title || !category || !assignedTo || !due)
      return err(res, 'title, category, assignedTo, due are required', 400);

    // parse due date safely
    const dueDate = new Date(due);
    if (isNaN(dueDate.getTime())) return err(res, 'Invalid due date', 400);

    const task = await Task.create({
      title, category, assignedTo,
      due: dueDate,
      priority: priority || 'normal',
      status:   status   || 'todo',
      notes:    notes    || '',
    });

    ok(res, mapTask(task), 201);
  } catch (e) { err(res, e.message); }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const { title, category, assignedTo, due, priority, status, notes } = req.body;

    const updateData = { title, category, assignedTo, priority, status, notes };

    // only update due if provided
    if (due) {
      const dueDate = new Date(due);
      if (isNaN(dueDate.getTime())) return err(res, 'Invalid due date', 400);
      updateData.due = dueDate;
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!task) return err(res, 'Task not found', 404);
    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};

// PATCH /api/tasks/:id/status
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in_progress', 'done'].includes(status))
      return err(res, 'Invalid status', 400);

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!task) return err(res, 'Task not found', 404);
    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};

// DELETE /api/tasks/:id  — soft delete
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date(), deletedBy: 'Admin' },
      { new: true }
    );
    if (!task) return err(res, 'Task not found', 404);
    ok(res, { message: 'Task deleted' });
  } catch (e) { err(res, e.message); }
};

// PUT /api/tasks/:id/restore
export const restoreTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null, deletedBy: null },
      { new: true }
    );
    if (!task) return err(res, 'Task not found', 404);
    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};

// DELETE /api/tasks/:id/hard
export const hardDeleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return err(res, 'Task not found', 404);
    ok(res, { message: 'Task permanently deleted' });
  } catch (e) { err(res, e.message); }
};