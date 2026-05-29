import express from 'express';
import Customer from '../models/Customer.js';
import Technician from '../models/Technician.js';
import Job from '../models/Job.js';
import AMC from '../models/AMC.js';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import { Payment, Expense, Inventory, Lead, Complaint, Ticket } from '../models/index.js';
import {
  Attendance, Leave, Salary, PurchaseOrder, Supplier,
  Asset, Contract, Reminder, Service
} from '../models/hrModels.js';
import { createCRUD } from './crudHelper.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Customers ─────────────────────────────────────────────────────────────────
router.use('/customers', createCRUD(Customer, {
  searchFields: ['name', 'phone', 'email', 'address'],
  filterFields: ['type', 'amc'],
}));

// ── Technicians ───────────────────────────────────────────────────────────────
router.use('/technicians', createCRUD(Technician, {
  searchFields: ['name', 'phone', 'email', 'area'],
  filterFields: ['status', 'role'],
}));

// ── Jobs ──────────────────────────────────────────────────────────────────────
const jobRouter = createCRUD(Job, {
  searchFields: ['jobId', 'customerName', 'address', 'issue', 'techName'],
  filterFields: ['status', 'type', 'priority'],
  populate: ['customer', 'technician'],
});

// Extra: assign technician to job
jobRouter.put('/:id/assign', async (req, res) => {
  try {
    const { technicianId, techName } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { technician: technicianId, techName, status: 'assigned' },
      { new: true }
    ).populate('customer technician');
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    // Update technician status
    if (technicianId) {
      await Technician.findByIdAndUpdate(technicianId, { status: 'busy', $inc: { jobs: 1 } });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Extra: complete a job
jobRouter.put('/:id/complete', async (req, res) => {
  try {
    const { remarks, amount, parts } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedAt: new Date(), remarks, amount, parts },
      { new: true }
    ).populate('customer technician');
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    if (job.technician) {
      await Technician.findByIdAndUpdate(job.technician, {
        status: 'available',
        $inc: { jobs: -1, completed: 1 },
      });
    }
    if (job.customer) {
      await Customer.findByIdAndUpdate(job.customer, {
        lastService: new Date(),
        $inc: { totalJobs: 1, totalSpent: amount || 0 },
      });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/jobs', jobRouter);

// ── AMC Contracts ─────────────────────────────────────────────────────────────
router.use('/amc', createCRUD(AMC, {
  searchFields: ['amcId', 'customerName'],
  filterFields: ['status', 'plan'],
  populate: ['customer'],
}));

// ── Quotations ────────────────────────────────────────────────────────────────
const quotRouter = createCRUD(Quotation, {
  searchFields: ['quotId', 'customerName', 'contact'],
  filterFields: ['status', 'type'],
  populate: ['customer'],
});

// Convert quotation → job
quotRouter.post('/:id/convert', async (req, res) => {
  try {
    const quot = await Quotation.findById(req.params.id);
    if (!quot) return res.status(404).json({ message: 'Quotation not found.' });

    const job = await Job.create({
      customerName: quot.customerName,
      customer: quot.customer,
      type: quot.type,
      amount: quot.total,
      quotation: quot._id,
    });
    await Quotation.findByIdAndUpdate(quot._id, { status: 'approved' });
    res.status(201).json({ message: 'Converted to job.', job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/quotations', quotRouter);

// ── Invoices ──────────────────────────────────────────────────────────────────
const invRouter = createCRUD(Invoice, {
  searchFields: ['invoiceId', 'customerName', 'jobRef'],
  filterFields: ['status'],
  populate: ['customer', 'job'],
});

// Mark invoice paid
invRouter.put('/:id/pay', async (req, res) => {
  try {
    const { paymentMethod, reference } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidAt: new Date(), paymentMethod },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    // Auto-create payment record
    await Payment.create({
      invoice: invoice._id,
      invoiceRef: invoice.invoiceId,
      customer: invoice.customer,
      customerName: invoice.customerName,
      amount: invoice.total,
      method: paymentMethod || 'cash',
      reference,
    });

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/invoices', invRouter);

// ── Payments ──────────────────────────────────────────────────────────────────
router.use('/payments', createCRUD(Payment, {
  searchFields: ['paymentId', 'customerName', 'invoiceRef'],
  filterFields: ['method'],
  softDelete: false,
}));

// ── Expenses ──────────────────────────────────────────────────────────────────
const expRouter = createCRUD(Expense, {
  searchFields: ['expenseId', 'description', 'techName'],
  filterFields: ['status', 'category'],
  populate: ['technician'],
});

expRouter.put('/:id/approve', async (req, res) => {
  try {
    const doc = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

expRouter.put('/:id/reject', async (req, res) => {
  try {
    const doc = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/expenses', expRouter);

// ── Inventory ─────────────────────────────────────────────────────────────────
const invtRouter = createCRUD(Inventory, {
  searchFields: ['name', 'sku', 'category', 'supplier'],
  filterFields: ['category'],
});

// Adjust stock
invtRouter.put('/:id/stock', async (req, res) => {
  try {
    const { adjustment, notes } = req.body; // positive = add, negative = remove
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $inc: { qty: adjustment } },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Low stock alert
invtRouter.get('/alerts/low-stock', async (req, res) => {
  try {
    const items = await Inventory.find({
      isDeleted: { $ne: true },
      $expr: { $lte: ['$qty', '$reorderLevel'] },
    });
    res.json({ data: items, total: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/inventory', invtRouter);

// ── Leads ─────────────────────────────────────────────────────────────────────
const leadRouter = createCRUD(Lead, {
  searchFields: ['leadId', 'name', 'contact', 'phone', 'email'],
  filterFields: ['stage', 'source', 'temp', 'assignedTo'],
});

// Add activity to lead
leadRouter.post('/:id/activities', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        $push: { activities: { ...req.body, date: new Date() } },
        lastContact: new Date(),
      },
      { new: true }
    );
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Convert lead → customer
leadRouter.post('/:id/convert', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });

    const customer = await Customer.create({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      type: lead.type,
    });

    await Lead.findByIdAndUpdate(lead._id, { stage: 'won', convertedTo: customer._id });
    res.status(201).json({ message: 'Lead converted to customer.', customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/leads', leadRouter);

// ── Complaints ────────────────────────────────────────────────────────────────
const compRouter = createCRUD(Complaint, {
  searchFields: ['complaintId', 'customerName', 'techName', 'description'],
  filterFields: ['status', 'category', 'severity'],
});

compRouter.put('/:id/resolve', async (req, res) => {
  try {
    const { resolution } = req.body;
    const doc = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolution, resolvedAt: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/complaints', compRouter);

// ── Tickets ───────────────────────────────────────────────────────────────────
const ticketRouter = createCRUD(Ticket, {
  searchFields: ['ticketId', 'customerName', 'subject'],
  filterFields: ['status', 'category', 'priority'],
});

// Add message to ticket
ticketRouter.post('/:id/messages', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: { ...req.body, time: new Date() } }, updatedAt: new Date() },
      { new: true }
    );
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

ticketRouter.put('/:id/resolve', async (req, res) => {
  try {
    const doc = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedAt: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/tickets', ticketRouter);

// ── Attendance ────────────────────────────────────────────────────────────────
const attRouter = express.Router();

attRouter.get('/', async (req, res) => {
  try {
    const { month, year, technicianId } = req.query;
    const query = {};
    if (technicianId) query.technician = technicianId;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    const data = await Attendance.find(query).populate('technician', 'name techId').sort({ date: 1 });
    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

attRouter.post('/upsert', protect, async (req, res) => {
  try {
    const { technician, date, status, clockIn, clockOut, notes } = req.body;
 
    if (!technician || !date || !status) {
      return res.status(400).json({ message: 'technician, date, and status are required' });
    }
 
    const doc = await Attendance.findOneAndUpdate(
      { technician, date },                         // find by composite key
      { $set: { status, clockIn, clockOut, notes } }, // update fields
      { upsert: true, new: true }                   // create if not found
    ).populate('technician', 'name role department');
 
    res.json(doc);
  } catch (err) {
    console.error('[Attendance] upsert error:', err);
    res.status(500).json({ message: err.message });
  }
});

attRouter.put('/:id', async (req, res) => {
  try {
    const doc = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

attRouter.delete('/', protect, async (req, res) => {
  try {
    const { technician, date } = req.query;
    if (!technician || !date) {
      return res.status(400).json({ message: 'technician and date query params required' });
    }
    await Attendance.findOneAndDelete({ technician, date });
    res.json({ success: true });
  } catch (err) {
    console.error('[Attendance] delete error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.use('/attendance', attRouter);

// ── Leave Management ──────────────────────────────────────────────────────────
const leaveRouter = createCRUD(Leave, {
  searchFields: ['leaveId', 'techName'],
  filterFields: ['status', 'type'],
  softDelete: false,
  populate: ['technician'],
});

leaveRouter.put('/:id/approve', async (req, res) => {
  try {
    const doc = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

leaveRouter.put('/:id/reject', async (req, res) => {
  try {
    const doc = await Leave.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/leaves', leaveRouter);

// ── Salary ────────────────────────────────────────────────────────────────────
const salaryRouter = createCRUD(Salary, {
  searchFields: ['salaryId', 'techName', 'month'],
  filterFields: ['status', 'month'],
  softDelete: false,
  populate: ['technician'],
});

salaryRouter.put('/:id/pay', async (req, res) => {
  try {
    const doc = await Salary.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidAt: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/salary', salaryRouter);

// ── Purchase Orders ───────────────────────────────────────────────────────────
router.use('/purchase-orders', createCRUD(PurchaseOrder, {
  searchFields: ['poId', 'supplier'],
  filterFields: ['status'],
}));

// ── Suppliers ─────────────────────────────────────────────────────────────────
router.use('/suppliers', createCRUD(Supplier, {
  searchFields: ['name', 'contact', 'phone', 'email'],
  filterFields: ['category', 'isActive'],
  softDelete: false,
}));

// ── Assets ────────────────────────────────────────────────────────────────────
router.use('/assets', createCRUD(Asset, {
  searchFields: ['assetId', 'name', 'serial', 'techName'],
  filterFields: ['status', 'category'],
  populate: ['assignedTo'],
}));

// ── Contracts ─────────────────────────────────────────────────────────────────
const contractRouter = createCRUD(Contract, {
  searchFields: ['contractId', 'customerName', 'title'],
  filterFields: ['status', 'type', 'signed'],
  populate: ['customer', 'linkedLead', 'linkedAMC'],
});

contractRouter.put('/:id/sign', async (req, res) => {
  try {
    const doc = await Contract.findByIdAndUpdate(
      req.params.id,
      { signed: true, signedDate: new Date(), status: 'active' },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/contracts', contractRouter);

// ── Reminders ─────────────────────────────────────────────────────────────────
router.use('/reminders', createCRUD(Reminder, {
  searchFields: ['title', 'description', 'assignedTo'],
  filterFields: ['status', 'type', 'priority'],
  softDelete: false,
  populate: ['customer', 'lead'],
}));

// ── Services / Price List ─────────────────────────────────────────────────────
router.use('/services', createCRUD(Service, {
  searchFields: ['name', 'description', 'category'],
  filterFields: ['category', 'isActive'],
  softDelete: false,
}));

// ── Dashboard Stats ────────────────────────────────────────────────────────────
router.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalJobs, jobsThisMonth, openJobs, completedJobs,
      totalCustomers, activeAMC,
      pendingInvoices, totalRevenue,
      totalTechs, availableTechs,
      openTickets, openLeads,
    ] = await Promise.all([
      Job.countDocuments({ isDeleted: { $ne: true } }),
      Job.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: startOfMonth } }),
      Job.countDocuments({ isDeleted: { $ne: true }, status: { $in: ['new', 'assigned', 'in_progress'] } }),
      Job.countDocuments({ isDeleted: { $ne: true }, status: 'completed', createdAt: { $gte: startOfMonth } }),
      Customer.countDocuments({ isDeleted: { $ne: true } }),
      AMC.countDocuments({ isDeleted: { $ne: true }, status: 'active' }),
      Invoice.countDocuments({ isDeleted: { $ne: true }, status: { $in: ['pending', 'overdue'] } }),
      Invoice.aggregate([
        { $match: { isDeleted: { $ne: true }, status: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Technician.countDocuments({ isDeleted: { $ne: true }, isActive: true }),
      Technician.countDocuments({ isDeleted: { $ne: true }, status: 'available' }),
      Ticket.countDocuments({ isDeleted: { $ne: true }, status: 'open' }),
      Lead.countDocuments({ isDeleted: { $ne: true }, stage: { $nin: ['won', 'lost'] } }),
    ]);

    res.json({
      jobs: { total: totalJobs, thisMonth: jobsThisMonth, open: openJobs, completedThisMonth: completedJobs },
      customers: { total: totalCustomers, activeAMC },
      finance: { pendingInvoices, revenueThisMonth: totalRevenue[0]?.total || 0 },
      technicians: { total: totalTechs, available: availableTechs },
      support: { openTickets, openLeads },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Users (admin) ─────────────────────────────────────────────────────────────
import User from '../models/User.js';

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ data: users, total: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
