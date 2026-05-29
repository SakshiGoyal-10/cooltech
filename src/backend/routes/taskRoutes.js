import express from 'express';
import {
  getTasks, getTaskStats, getDeletedTasks, getTaskById,
  createTask, updateTask, updateTaskStatus,
  deleteTask, restoreTask, hardDeleteTask,
} from '../controllers/taskController.js';

const router = express.Router();

router.get('/stats',         getTaskStats);
router.get('/deleted',       getDeletedTasks);    // ← before /:id
router.get('/',              getTasks);
router.get('/:id',           getTaskById);
router.post('/',             createTask);
router.put('/:id',           updateTask);
router.patch('/:id/status',  updateTaskStatus);
router.delete('/:id',        deleteTask);
router.put('/:id/restore',   restoreTask);
router.delete('/:id/hard',   hardDeleteTask);

export default router;