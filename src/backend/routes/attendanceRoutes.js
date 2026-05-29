import express from 'express';
const router = express.Router();

import {
  clockIn, breakStart, breakEnd, clockOut,
  getSessions, getActiveSession, getSessionById,
  updateSession, deleteSession,
  getDeletedSessions, restoreSession, hardDeleteSession,
  getTeamStatus, getReports,
} from '../controllers/attendanceController.js';

import {
  getSettings, updateSettings, addIP, removeIP,
} from '../controllers/clockSettingsController.js';

// ─── Clock Actions ────────────────────────────────────────────────────────────
router.post('/clock-in',    clockIn);
router.post('/break-start', breakStart);
router.post('/break-end',   breakEnd);
router.post('/clock-out',   clockOut);

// ─── Static session routes FIRST (before any /:id wildcards) ─────────────────
router.get('/sessions/deleted',  getDeletedSessions);   // GET  /api/attendance/sessions/deleted
router.get('/sessions/active',   getActiveSession);     // GET  /api/attendance/sessions/active
router.get('/sessions',          getSessions);           // GET  /api/attendance/sessions

// ─── Session :id routes — restore & hard-delete BEFORE generic /:id ──────────
router.put('/sessions/:id/restore',    restoreSession);      // PUT    /api/attendance/sessions/:id/restore
router.delete('/sessions/:id/hard',    hardDeleteSession);   // DELETE /api/attendance/sessions/:id/hard

// ─── Generic session CRUD ─────────────────────────────────────────────────────
router.get('/sessions/:id',     getSessionById);    // GET    /api/attendance/sessions/:id
router.put('/sessions/:id',     updateSession);     // PUT    /api/attendance/sessions/:id
router.delete('/sessions/:id',  deleteSession);     // DELETE /api/attendance/sessions/:id  (soft delete)

// ─── Team & Reports ───────────────────────────────────────────────────────────
router.get('/team-status', getTeamStatus);
router.get('/reports',     getReports);

// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings',              getSettings);
router.put('/settings',              updateSettings);
router.post('/settings/add-ip',      addIP);
router.delete('/settings/remove-ip', removeIP);

export default router;