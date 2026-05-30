import express from 'express';
import nodemailer from 'nodemailer';
import Customer from '../models/Customer.js';
import Technician from '../models/Technician.js';
import Job from '../models/Job.js';
import AMC from '../models/AMC.js';
import Quotation from '../models/Quotation.js';
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
 
// ── UPDATE STATUS ──
quotRouter.patch('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowed = ['draft', 'sent', 'approved', 'rejected', 'expired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }
    const quot = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status, ...(note ? { statusNote: note } : {}) },
      { new: true }
    );
    if (!quot) return res.status(404).json({ message: 'Quotation not found.' });
    res.json(quot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// ── SEND EMAIL ──
quotRouter.post('/:id/send-email', async (req, res) => {
  try {
    const quot = await Quotation.findById(req.params.id).lean();
    if (!quot) return res.status(404).json({ message: 'Quotation not found.' });
 
    const { toEmail, toName, subject, message } = req.body;
    if (!toEmail) return res.status(400).json({ message: 'Recipient email is required.' });
 
    const transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST,
      port:   Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
 
    const itemRows = (quot.items || []).map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${item.desc || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${item.qty || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">₹${Number(item.rate || 0).toLocaleString('en-IN')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700">₹${Number((item.qty || 0) * (item.rate || 0)).toLocaleString('en-IN')}</td>
      </tr>`).join('');
 
    const htmlBody = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">
  <div style="background:linear-gradient(135deg,#1a2e5c,#2563eb);padding:28px 32px">
    <div style="color:#fff;font-size:22px;font-weight:800">ALISHA ENGINEERING</div>
    <div style="color:#93c5fd;font-size:12px;margin-top:4px">Installation · Maintenance · Repair · AC · Fabrication · Insulation</div>
  </div>
  <div style="padding:32px">
    <p style="margin:0 0 8px;font-size:15px;color:#1e293b">Dear <strong>${toName || quot.customerName || 'Valued Customer'}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7">${message || `Thank you for your interest. Please find your quotation <strong>${quot.quotId}</strong> for <strong>${quot.type}</strong> services below.`}</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <span style="margin-right:24px"><b style="font-size:11px;color:#64748b;text-transform:uppercase">Quote ID</b><br/><b style="font-size:14px;font-family:monospace;color:#1a2e5c">${quot.quotId}</b></span>
      <span style="margin-right:24px"><b style="font-size:11px;color:#64748b;text-transform:uppercase">Type</b><br/><b style="font-size:14px;color:#1e293b">${quot.type}</b></span>
      <span><b style="font-size:11px;color:#64748b;text-transform:uppercase">Valid Until</b><br/><b style="font-size:14px;color:#1e293b">${quot.validUntil ? new Date(quot.validUntil).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</b></span>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#1a2e5c">
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:center;width:8%">SR</th>
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:left">DESCRIPTION</th>
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:center;width:10%">QTY</th>
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:right;width:18%">RATE</th>
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:right;width:18%">TOTAL</th>
        </tr>
      </thead>
      <tbody>${itemRows || '<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8">No items</td></tr>'}</tbody>
      <tfoot>
        <tr><td colspan="4" style="padding:8px 12px;text-align:right;font-weight:600;border-top:1px solid #e2e8f0">Subtotal</td><td style="padding:8px 12px;text-align:right;font-family:monospace;border-top:1px solid #e2e8f0">₹${Number(quot.subtotal||0).toLocaleString('en-IN')}</td></tr>
        ${quot.gst ? `<tr><td colspan="4" style="padding:6px 12px;text-align:right;font-size:12px;color:#64748b">GST</td><td style="padding:6px 12px;text-align:right;font-family:monospace;color:#64748b">₹${Number(quot.gst).toLocaleString('en-IN')}</td></tr>` : ''}
        <tr style="background:#eff6ff"><td colspan="4" style="padding:10px 12px;text-align:right;font-weight:800;font-size:14px;color:#1a2e5c;border-top:2px solid #bfdbfe">TOTAL</td><td style="padding:10px 12px;text-align:right;font-family:monospace;font-weight:800;font-size:15px;color:#1a2e5c;border-top:2px solid #bfdbfe">₹${Number(quot.total||0).toLocaleString('en-IN')}</td></tr>
      </tfoot>
    </table>
    ${quot.notes ? `<div style="margin-top:20px;padding:14px;background:#fefce8;border:1px solid #fde68a;border-radius:8px"><b style="font-size:11px;color:#92400e">NOTES</b><p style="margin:6px 0 0;font-size:13px;color:#78350f;line-height:1.6">${quot.notes}</p></div>` : ''}
    ${quot.terms ? `<div style="margin-top:12px;padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px"><b style="font-size:11px;color:#14532d">TERMS & CONDITIONS</b><p style="margin:6px 0 0;font-size:13px;color:#166534;line-height:1.6">${quot.terms}</p></div>` : ''}
    <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.7">
      For any queries: <strong style="color:#1e293b">Vakil Yadav</strong> · 9724763909 · alishaengineering@gmail.com
    </p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;font-size:11px;color:#94a3b8;text-align:center">
    Alisha Engineering · L.I.G-II-164 G.I.D.C Housing Board · Odahav, Ahmedabad-382415
  </div>
</div></body></html>`;
 
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Alisha Engineering'}" <${process.env.MAIL_FROM}>`,
      to:   `"${toName || quot.customerName}" <${toEmail}>`,
      subject: subject || `Quotation ${quot.quotId} – Alisha Engineering`,
      html: htmlBody,
    });
 
    // Auto-update status to 'sent'
    await Quotation.findByIdAndUpdate(req.params.id, { status: 'sent' });
    res.json({ message: 'Email sent successfully.', status: 'sent' });
  } catch (err) {
    console.error('[Quotation Email]', err);
    res.status(500).json({ message: err.message || 'Failed to send email.' });
  }
});
 
// ── CONVERT TO JOB ──
quotRouter.post('/:id/convert', async (req, res) => {
  try {
    const quot = await Quotation.findById(req.params.id).lean();
    if (!quot) return res.status(404).json({ message: 'Quotation not found.' });
    if (quot.status === 'approved') {
      return res.status(400).json({ message: 'This quotation has already been converted to a job.' });
    }
 
    const typeMap = { Service:'Service', Installation:'Installation', Repair:'Repair', AMC:'AMC Visit', Other:'Service' };
 
    const job = await Job.create({
      customerName: quot.customerName,
      customer:     quot.customer,
      address:      quot.address || '',
      type:         typeMap[quot.type] || 'Service',
      amount:       quot.total,
      issue:        `From Quotation ${quot.quotId}: ${quot.type}${quot.notes ? '\n' + quot.notes : ''}`,
      remarks:      quot.terms || '',
      quotation:    quot._id,
      status:       'new',
      priority:     'normal',
      parts:        (quot.items || []).map(i => ({
        name: i.desc  || '',
        qty:  Number(i.qty)  || 1,
        cost: Number(i.rate) || 0,
      })),
    });
 
    await Quotation.findByIdAndUpdate(quot._id, { status: 'approved' });
    res.status(201).json({ message: 'Quotation converted to job.', job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
router.use('/quotations', quotRouter);

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

// Convert lead → Job (Won stage)
leadRouter.post('/:id/convert-to-job', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });
 
    const {
      customerName,
      address,
      type,
      priority,
      scheduledDate,
      scheduledTime,
      ac,
      amount,
      issue,
      note,
    } = req.body;
 
    // 1. Resolve customer — use existing if already linked, else find by phone,
    //    else create a new Customer document from lead data.
    let customerId = lead.customer || null;
 
    if (!customerId) {
      // Try to find an existing customer with same phone
      let existingCustomer = null;
      if (lead.phone) {
        existingCustomer = await Customer.findOne({
          phone:     lead.phone,
          isDeleted: { $ne: true },
        });
      }
 
      if (existingCustomer) {
        customerId = existingCustomer._id;
      } else {
        // Create a fresh customer from lead details
        const newCustomer = await Customer.create({
          name:    lead.name,
          phone:   lead.phone   || '',
          email:   lead.email   || '',
          address: lead.address || '',
          type:    lead.type    || 'Residential',
        });
        customerId = newCustomer._id;
      }
 
      // Link the resolved customer back to the lead for future reference
      await Lead.findByIdAndUpdate(lead._id, { customer: customerId });
    }
 
    // 2. Create the Job document
    const job = await Job.create({
      customer:      customerId,
      customerName:  customerName  || lead.name,
      address:       address       || lead.address || '',
      type:          type          || 'Installation',
      priority:      priority      || 'normal',
      status:        'new',
      ac:            ac            || '',
      issue:         issue
        ? issue
        : `Converted from Lead ${lead.leadId}${note ? '\n' + note : ''}`,
      amount:        Number(amount) || lead.value || 0,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      scheduledTime: scheduledTime || '',
    });
 
    // 3. Mark lead as Won, link the job ID, optionally push activity note
    const leadPatch = {
      stage:       'won',
      convertedTo: job._id,
    };
 
    if (note) {
      leadPatch.$push = {
        activities: {
          type: 'note',
          note: `[Won → Job ${job.jobId}] ${note}`,
          date: new Date(),
          by:   req.user?.name || 'Admin',
        },
      };
    }
 
    await Lead.findByIdAndUpdate(lead._id, leadPatch);
 
    res.status(201).json({ message: 'Lead converted to job.', job });
  } catch (err) {
    console.error('[Lead → Job]', err);
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
