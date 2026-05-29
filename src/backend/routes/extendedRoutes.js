/**
 * extendedRoutes.js  —  All missing CRUD backend routes
 * Place at: src/backend/routes/extendedRoutes.js
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import { createCRUD } from './crudHelper.js';
import Job from '../models/Job.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import Technician from '../models/Technician.js';
import { Expense, Lead, Complaint } from '../models/index.js';
import { Contract } from '../models/hrModels.js';
import {
  Notice, Notification, Recruitment, Performance, AdvanceIncentive,
  GasLog, Warranty, Project, CustomerType, LeadSource,
  Campaign, Review, PostSchedule, ACErrorCode, LookupTable,
  ContentLibrary, WhatsAppMessage,
} from '../models/extendedModels.js';

const router = express.Router();
router.use(protect);

// ── Notice Board ──────────────────────────────────────────────────────────────
const noticeRouter = createCRUD(Notice, {
  searchFields: ['title', 'content', 'postedBy'],
  filterFields: ['category', 'priority', 'isPinned'],
});

noticeRouter.post('/:id/read', async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: { userId: req.user._id, readAt: new Date() } } },
      { new: true }
    );
    res.json(notice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

noticeRouter.put('/:id/pin', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found.' });
    notice.isPinned = !notice.isPinned;
    await notice.save();
    res.json(notice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/notices', noticeRouter);

// ── Notifications ─────────────────────────────────────────────────────────────
// IMPORTANT: static routes (/read-all, /) MUST come before parameterised (/:id)
const notifRouter = express.Router();

notifRouter.get('/', async (req, res) => {
  try {
    const { unread, limit = 50 } = req.query;
    const query = { userId: req.user._id };
    if (unread === 'true') query.isRead = false;
    const data = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ data, total: data.length, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

notifRouter.post('/', async (req, res) => {
  try {
    const notif = await Notification.create({ ...req.body, userId: req.user._id });
    res.status(201).json(notif);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Static PATCH must be before /:id
notifRouter.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ message: 'All marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

notifRouter.patch('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

notifRouter.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

notifRouter.delete('/', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'All cleared.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/notifications', notifRouter);

// ── Recruitment ────────────────────────────────────────────────────────────────
const recruitRouter = createCRUD(Recruitment, {
  searchFields: ['name', 'phone', 'email', 'position'],
  filterFields: ['stage', 'department', 'source'],
});

// Static routes before /:id
recruitRouter.get('/stats/summary', async (req, res) => {
  try {
    const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
    const counts = await Promise.all(
      stages.map(s => Recruitment.countDocuments({ stage: s, isDeleted: { $ne: true } }))
    );
    const stats = {};
    stages.forEach((s, i) => { stats[s] = counts[i]; });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recruitRouter.put('/:id/advance', async (req, res) => {
  try {
    const stages = ['applied', 'screening', 'interview', 'offer', 'hired'];
    const app = await Recruitment.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found.' });
    const idx = stages.indexOf(app.stage);
    const nextStage = idx >= 0 && idx < stages.length - 1 ? stages[idx + 1] : 'hired';
    const doc = await Recruitment.findByIdAndUpdate(
      req.params.id,
      { stage: nextStage },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recruitRouter.put('/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const doc = await Recruitment.findByIdAndUpdate(
      req.params.id,
      { stage: 'rejected', rejectionReason },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/recruitment', recruitRouter);

// ── Performance ────────────────────────────────────────────────────────────────
const perfRouter = createCRUD(Performance, {
  searchFields: ['techName', 'period'],
  filterFields: ['grade', 'period'],
  populate: ['technician'],
});

perfRouter.post('/calculate', async (req, res) => {
  try {
    const { technicianId, period } = req.body;
    const tech = await Technician.findById(technicianId);
    if (!tech) return res.status(404).json({ message: 'Technician not found.' });
    const jobsCompleted = await Job.countDocuments({
      technician: technicianId,
      status: 'completed',
      isDeleted: { $ne: true },
    });
    const overall = Math.min(100, Math.round(jobsCompleted * 3));
    const grade = overall >= 90 ? 'A' : overall >= 75 ? 'B' : overall >= 60 ? 'C' : overall >= 40 ? 'D' : 'F';

    const doc = await Performance.findOneAndUpdate(
      { technician: technicianId, period, isDeleted: { $ne: true } },
      { techName: tech.name, jobsCompleted, overallScore: overall, grade },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/performance', perfRouter);

// ── Advance & Incentive ────────────────────────────────────────────────────────
const advRouter = createCRUD(AdvanceIncentive, {
  searchFields: ['techName', 'reason', 'month'],
  filterFields: ['type', 'status'],
  populate: ['technician'],
});

// Static routes before /:id
advRouter.get('/summary/:technicianId', async (req, res) => {
  try {
    const { month } = req.query;
    const query = { technician: req.params.technicianId, isDeleted: { $ne: true } };
    if (month) query.month = month;
    const records = await AdvanceIncentive.find(query);
    const totalAdvance   = records.filter(r => r.type === 'advance').reduce((s, r) => s + r.amount, 0);
    const totalIncentive = records.filter(r => r.type === 'incentive').reduce((s, r) => s + r.amount, 0);
    const totalBonus     = records.filter(r => r.type === 'bonus').reduce((s, r) => s + r.amount, 0);
    const totalDeduction = records.filter(r => r.type === 'deduction').reduce((s, r) => s + r.amount, 0);
    res.json({ totalAdvance, totalIncentive, totalBonus, totalDeduction, records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

advRouter.put('/:id/approve', async (req, res) => {
  try {
    const doc = await AdvanceIncentive.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

advRouter.put('/:id/reject', async (req, res) => {
  try {
    const doc = await AdvanceIncentive.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

advRouter.put('/:id/pay', async (req, res) => {
  try {
    const doc = await AdvanceIncentive.findByIdAndUpdate(
      req.params.id,
      { status: 'paid' },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/advance-incentive', advRouter);

// ── Gas Log ────────────────────────────────────────────────────────────────────
const gasRouter = createCRUD(GasLog, {
  searchFields: ['logId', 'techName', 'customerName', 'certNumber'],
  filterFields: ['gasType', 'operation'],
  populate: ['technician', 'job', 'customer'],
});

// Static before /:id
gasRouter.get('/stats/usage', async (req, res) => {
  try {
    const stats = await GasLog.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$gasType', total: { $sum: '$quantity' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/gaslog',    gasRouter);
router.use('/gas-logs',   gasRouter); // alias for HRModals compatibility

// ── Warranty ───────────────────────────────────────────────────────────────────
const warrantyRouter = createCRUD(Warranty, {
  searchFields: ['warrantyId', 'customerName', 'product', 'serial', 'brand'],
  filterFields: ['status', 'type'],
  populate: ['customer', 'job'],
});

// Static before /:id
warrantyRouter.get('/alerts/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const data = await Warranty.find({
      isDeleted: { $ne: true },
      status: 'active',
      endDate: { $lte: limit, $gte: new Date() },
    }).sort({ endDate: 1 });
    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

warrantyRouter.put('/:id/claim', async (req, res) => {
  try {
    const doc = await Warranty.findByIdAndUpdate(
      req.params.id,
      { status: 'claimed', $inc: { claimsCount: 1 } },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/warranty',   warrantyRouter);
router.use('/warranties', warrantyRouter); // alias

// ── Projects ───────────────────────────────────────────────────────────────────
const projectRouter = createCRUD(Project, {
  searchFields: ['projectId', 'name', 'customerName', 'manager'],
  filterFields: ['status', 'priority'],
  populate: ['customer'],
});

// Static before /:id
projectRouter.get('/stats/summary', async (req, res) => {
  try {
    const statuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
    const counts = await Promise.all(
      statuses.map(s => Project.countDocuments({ status: s, isDeleted: { $ne: true } }))
    );
    const stats = {};
    statuses.forEach((s, i) => { stats[s] = counts[i]; });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

projectRouter.put('/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    const clampedProgress = Math.min(100, Math.max(0, Number(progress)));
    const status = clampedProgress >= 100 ? 'completed' : 'active';
    const doc = await Project.findByIdAndUpdate(
      req.params.id,
      { progress: clampedProgress, status },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/projects', projectRouter);

// ── Customer Types ─────────────────────────────────────────────────────────────
router.use('/customer-types', createCRUD(CustomerType, {
  searchFields: ['name', 'description'],
  filterFields: ['isActive'],
  softDelete: false,
}));

// ── Lead Sources ───────────────────────────────────────────────────────────────
const leadSourceRouter = createCRUD(LeadSource, {
  searchFields: ['name', 'description'],
  filterFields: ['channel', 'isActive'],
  softDelete: false,
});

// Static before /:id
leadSourceRouter.get('/stats/performance', async (req, res) => {
  try {
    const sources = await LeadSource.find({ isActive: true });
    const stats = await Promise.all(sources.map(async (src) => {
      const total = await Lead.countDocuments({ source: src.name, isDeleted: { $ne: true } });
      const won   = await Lead.countDocuments({ source: src.name, stage: 'won', isDeleted: { $ne: true } });
      return {
        ...src.toObject(),
        totalLeads: total,
        wonLeads: won,
        convRate: total ? Math.round((won / total) * 100) : 0,
      };
    }));
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/lead-sources', leadSourceRouter);

// ── Campaigns ──────────────────────────────────────────────────────────────────
const campaignRouter = createCRUD(Campaign, {
  searchFields: ['campaignId', 'name', 'audience'],
  filterFields: ['type', 'status'],
});

// Static before /:id
campaignRouter.get('/stats/overview', async (req, res) => {
  try {
    const all = await Campaign.find({ isDeleted: { $ne: true } });
    const stats = {
      total:      all.length,
      running:    all.filter(c => c.status === 'running').length,
      completed:  all.filter(c => c.status === 'completed').length,
      totalSent:  all.reduce((s, c) => s + c.sentCount, 0),
      totalOpens: all.reduce((s, c) => s + c.openCount, 0),
      totalClicks:all.reduce((s, c) => s + c.clickCount, 0),
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

campaignRouter.put('/:id/launch', async (req, res) => {
  try {
    const doc = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'running', sentAt: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

campaignRouter.put('/:id/pause', async (req, res) => {
  try {
    const doc = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'paused' },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/campaigns', campaignRouter);

// ── Reviews ────────────────────────────────────────────────────────────────────
const reviewRouter = createCRUD(Review, {
  searchFields: ['customerName', 'reviewText'],
  filterFields: ['platform', 'rating', 'isPublic'],
  populate: ['customer', 'job'],
});

// Static before /:id
reviewRouter.get('/stats/summary', async (req, res) => {
  try {
    const all = await Review.find({ isDeleted: { $ne: true } });
    const avg = all.length
      ? (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1)
      : 0;
    const byPlatform = {};
    all.forEach(r => {
      if (!byPlatform[r.platform]) byPlatform[r.platform] = { count: 0, total: 0 };
      byPlatform[r.platform].count++;
      byPlatform[r.platform].total += r.rating;
    });
    Object.keys(byPlatform).forEach(p => {
      byPlatform[p].avg = (byPlatform[p].total / byPlatform[p].count).toFixed(1);
    });
    const distribution = [5, 4, 3, 2, 1].map(r => ({
      rating: r,
      count: all.filter(x => x.rating === r).length,
    }));
    res.json({ total: all.length, average: Number(avg), byPlatform, distribution });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

reviewRouter.put('/:id/respond', async (req, res) => {
  try {
    const { response } = req.body;
    const doc = await Review.findByIdAndUpdate(
      req.params.id,
      { response, respondedAt: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/reviews', reviewRouter);

// ── Post Scheduler ─────────────────────────────────────────────────────────────
const postRouter = createCRUD(PostSchedule, {
  searchFields: ['title', 'content'],
  filterFields: ['status'],
});

// Static before /:id
postRouter.get('/stats/overview', async (req, res) => {
  try {
    const all = await PostSchedule.find({ isDeleted: { $ne: true } });
    res.json({
      total:       all.length,
      published:   all.filter(p => p.status === 'published').length,
      scheduled:   all.filter(p => p.status === 'scheduled').length,
      draft:       all.filter(p => p.status === 'draft').length,
      totalReach:  all.reduce((s, p) => s + p.reach, 0),
      totalLikes:  all.reduce((s, p) => s + p.likes, 0),
      totalShares: all.reduce((s, p) => s + p.shares, 0),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

postRouter.put('/:id/publish', async (req, res) => {
  try {
    const doc = await PostSchedule.findByIdAndUpdate(
      req.params.id,
      { status: 'published', publishedAt: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/posts', postRouter);

// ── AC Error Codes ─────────────────────────────────────────────────────────────
const errorCodeRouter = createCRUD(ACErrorCode, {
  searchFields: ['code', 'brand', 'description', 'cause', 'solution'],
  filterFields: ['brand', 'severity', 'category'],
});

// Static before /:id
errorCodeRouter.post('/bulk', async (req, res) => {
  try {
    const { codes } = req.body;
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'codes array is required.' });
    }
    const inserted = await ACErrorCode.insertMany(codes, { ordered: false });
    res.status(201).json({ count: inserted.length, inserted });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.use('/error-codes', errorCodeRouter);

// ── Lookup Tables ──────────────────────────────────────────────────────────────
const lookupRouter = express.Router();

// Static before /:id
lookupRouter.post('/seed', async (req, res) => {
  try {
    const defaults = [
      { category: 'department', value: 'Technical',    order: 1 },
      { category: 'department', value: 'Admin',        order: 2 },
      { category: 'department', value: 'Sales',        order: 3 },
      { category: 'department', value: 'Support',      order: 4 },
      { category: 'skill',      value: 'AC Repair',    order: 1 },
      { category: 'skill',      value: 'Installation', order: 2 },
      { category: 'skill',      value: 'Maintenance',  order: 3 },
      { category: 'skill',      value: 'Electrical',   order: 4 },
      { category: 'shift',      value: 'Morning',      order: 1 },
      { category: 'shift',      value: 'Evening',      order: 2 },
      { category: 'shift',      value: 'Night',        order: 3 },
      { category: 'area',       value: 'Zone A',       order: 1 },
      { category: 'area',       value: 'Zone B',       order: 2 },
      { category: 'area',       value: 'Zone C',       order: 3 },
    ];
    await LookupTable.insertMany(defaults, { ordered: false });
    res.json({ message: 'Seeded defaults.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

lookupRouter.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) query.category = category;
    const data = await LookupTable.find(query).sort({ category: 1, order: 1 });
    const grouped = {};
    data.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    res.json({ data, grouped, total: data.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

lookupRouter.post('/', async (req, res) => {
  try {
    const doc = await LookupTable.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

lookupRouter.put('/:id', async (req, res) => {
  try {
    const doc = await LookupTable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found.' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

lookupRouter.delete('/:id', async (req, res) => {
  try {
    await LookupTable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/lookups', lookupRouter);

// ── Content Library ────────────────────────────────────────────────────────────
const contentRouter = createCRUD(ContentLibrary, {
  searchFields: ['title', 'category'],
  filterFields: ['type', 'category'],
});

contentRouter.put('/:id/use', async (req, res) => {
  try {
    const doc = await ContentLibrary.findByIdAndUpdate(
      req.params.id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/content-library', contentRouter);

// ── WhatsApp Marketing ─────────────────────────────────────────────────────────
const waRouter = createCRUD(WhatsAppMessage, {
  searchFields: ['recipientName', 'phone', 'message'],
  filterFields: ['status'],
  softDelete: false,
});

// Static before /:id
waRouter.get('/stats/overview', async (req, res) => {
  try {
    const all = await WhatsAppMessage.find();
    res.json({
      total:     all.length,
      sent:      all.filter(m => m.status === 'sent').length,
      delivered: all.filter(m => m.status === 'delivered').length,
      read:      all.filter(m => m.status === 'read').length,
      failed:    all.filter(m => m.status === 'failed').length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

waRouter.post('/bulk-send', async (req, res) => {
  try {
    const { recipients, template, message } = req.body;
    if (!recipients || !recipients.length) {
      return res.status(400).json({ message: 'Recipients required.' });
    }
    const msgs = recipients.map(r => ({
      recipient:     r.name || r.customerName || '',
      recipientName: r.name || r.customerName || '',
      phone:         r.phone,
      template:      template || '',
      message:       (message || '').replace('{{name}}', r.name || r.customerName || ''),
      status:        'sent',
      sentAt:        new Date(),
    }));
    const inserted = await WhatsAppMessage.insertMany(msgs);
    res.status(201).json({ sent: inserted.length, messages: inserted });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.use('/whatsapp', waRouter);

// ── Reports / Analytics ────────────────────────────────────────────────────────
router.get('/reports/overview', async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);
    const hasRange = from || to;

    const jobQuery = { isDeleted: { $ne: true }, ...(hasRange ? { createdAt: dateFilter } : {}) };
    const invQuery = { isDeleted: { $ne: true }, ...(hasRange ? { createdAt: dateFilter } : {}) };
    const expQuery = { isDeleted: { $ne: true }, ...(hasRange ? { createdAt: dateFilter } : {}) };

    const [
      totalJobs, completedJobs, pendingJobs,
      totalCustomers,
      invoices, paidInvoices,
      expenses,
      topPerforming,
    ] = await Promise.all([
      Job.countDocuments(jobQuery),
      Job.countDocuments({ ...jobQuery, status: 'completed' }),
      Job.countDocuments({ ...jobQuery, status: { $in: ['new', 'assigned', 'in_progress'] } }),
      Customer.countDocuments({ isDeleted: { $ne: true } }),
      Invoice.aggregate([
        { $match: invQuery },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { ...invQuery, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: expQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Job.aggregate([
        { $match: { isDeleted: { $ne: true }, status: 'completed' } },
        { $group: { _id: '$technician', jobs: { $sum: 1 }, techName: { $first: '$techName' } } },
        { $sort: { jobs: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      jobs: { total: totalJobs, completed: completedJobs, pending: pendingJobs },
      customers: { total: totalCustomers },
      revenue: {
        total:       invoices[0]?.total       || 0,
        invoiceCount:invoices[0]?.count       || 0,
        collected:   paidInvoices[0]?.total   || 0,
        paidCount:   paidInvoices[0]?.count   || 0,
        outstanding: (invoices[0]?.total || 0) - (paidInvoices[0]?.total || 0),
      },
      expenses: { total: expenses[0]?.total || 0 },
      topPerforming,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/reports/monthly', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await Invoice.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          status: 'paid',
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31T23:59:59`),
          },
        },
      },
      {
        $group: {
          _id:     { $month: '$createdAt' },
          revenue: { $sum: '$total' },
          count:   { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const chart = months.map((m, i) => {
      const found = data.find(d => d._id === i + 1);
      return { month: m, revenue: found?.revenue || 0, invoices: found?.count || 0 };
    });
    res.json(chart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Deleted Items (cross-model) ────────────────────────────────────────────────
router.get('/deleted-items', async (req, res) => {
  try {
    const [
      jobs, customers, invoices, expenses, leads,
      complaints, contracts, notices, warranties, gaslogs, projects,
    ] = await Promise.all([
      Job.find({ isDeleted: true }).select('jobId status customerName deletedAt').sort({ deletedAt: -1 }).limit(20),
      Customer.find({ isDeleted: true }).select('name phone email deletedAt').sort({ deletedAt: -1 }).limit(20),
      Invoice.find({ isDeleted: true }).select('invoiceId customerName total deletedAt').sort({ deletedAt: -1 }).limit(20),
      Expense.find({ isDeleted: true }).select('expenseId description amount deletedAt').sort({ deletedAt: -1 }).limit(20),
      Lead.find({ isDeleted: true }).select('leadId name stage deletedAt').sort({ deletedAt: -1 }).limit(20),
      Complaint.find({ isDeleted: true }).select('complaintId customerName status deletedAt').sort({ deletedAt: -1 }).limit(20),
      Contract.find({ isDeleted: true }).select('contractId customerName status deletedAt').sort({ deletedAt: -1 }).limit(20),
      Notice.find({ isDeleted: true }).select('noticeId title deletedAt').sort({ deletedAt: -1 }).limit(20),
      Warranty.find({ isDeleted: true }).select('warrantyId customerName product deletedAt').sort({ deletedAt: -1 }).limit(20),
      GasLog.find({ isDeleted: true }).select('logId techName gasType deletedAt').sort({ deletedAt: -1 }).limit(20),
      Project.find({ isDeleted: true }).select('projectId name status deletedAt').sort({ deletedAt: -1 }).limit(20),
    ]);

    res.json({
      jobs:       jobs.map(d => ({ ...d.toObject(), type: 'Job' })),
      customers:  customers.map(d => ({ ...d.toObject(), type: 'Customer' })),
      invoices:   invoices.map(d => ({ ...d.toObject(), type: 'Invoice' })),
      expenses:   expenses.map(d => ({ ...d.toObject(), type: 'Expense' })),
      leads:      leads.map(d => ({ ...d.toObject(), type: 'Lead' })),
      complaints: complaints.map(d => ({ ...d.toObject(), type: 'Complaint' })),
      contracts:  contracts.map(d => ({ ...d.toObject(), type: 'Contract' })),
      notices:    notices.map(d => ({ ...d.toObject(), type: 'Notice' })),
      warranties: warranties.map(d => ({ ...d.toObject(), type: 'Warranty' })),
      gaslogs:    gaslogs.map(d => ({ ...d.toObject(), type: 'GasLog' })),
      projects:   projects.map(d => ({ ...d.toObject(), type: 'Project' })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;