// routes/invoice.routes.js
// Place at: src/backend/routes/invoice.routes.js
// Your project uses ESM — so this uses import/export
//
// Mount in your server.js:
//   import invoiceRoutes from "./routes/invoice.routes.js";
//   app.use("/api/invoices", invoiceRoutes);

import express from "express";
import Invoice  from "../models/Invoice.model.js";

const router = express.Router();

// ─── helper: wrap async route handlers ───────────────────────────────────────
const asyncWrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── GET /api/invoices ────────────────────────────────────────────────────────
// ?status=draft|saved|paid|overdue  &search=text  &page=1  &limit=50
router.get(
  "/",
  asyncWrap(async (req, res) => {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status === "overdue") {
      const today    = new Date().toISOString().slice(0, 10);
      filter.status  = { $ne: "draft" };
      filter.paid    = false;
      filter.dueDate = { $lt: today, $ne: "" };
    } else if (status === "paid") {
      filter.paid = true;
    } else if (status && ["draft", "saved"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      const rx   = new RegExp(search, "i");
      filter.$or = [{ customer: rx }, { invoiceNo: rx }, { subject: rx }];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Invoice.countDocuments(filter);
    const docs  = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), data: docs });
  })
);

// ─── GET /api/invoices/stats/summary ─────────────────────────────────────────
// IMPORTANT: must be BEFORE /:id or Express will treat "stats" as an id
router.get(
  "/stats/summary",
  asyncWrap(async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);

    const [result] = await Invoice.aggregate([
      {
        $facet: {
          totalInvoiced: [
            { $match: { status: { $ne: "draft" } } },
            { $group: { _id: null, amount: { $sum: "$total" } } },
          ],
          paid: [
            { $match: { paid: true } },
            { $group: { _id: null, amount: { $sum: "$total" } } },
          ],
          overdue: [
            {
              $match: {
                status: { $ne: "draft" },
                paid: false,
                dueDate: { $lt: today, $ne: "" },
              },
            },
            { $group: { _id: null, amount: { $sum: "$total" } } },
          ],
          drafts: [
            { $match: { status: "draft" } },
            { $count: "count" },
          ],
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalInvoiced: result.totalInvoiced[0]?.amount || 0,
        paid:          result.paid[0]?.amount          || 0,
        overdue:       result.overdue[0]?.amount       || 0,
        drafts:        result.drafts[0]?.count         || 0,
      },
    });
  })
);

// ─── GET /api/invoices/:id ────────────────────────────────────────────────────
router.get(
  "/:id",
  asyncWrap(async (req, res) => {
    const doc = await Invoice.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.json({ success: true, data: doc });
  })
);

// ─── POST /api/invoices ───────────────────────────────────────────────────────
router.post(
  "/",
  asyncWrap(async (req, res) => {
    const { invoiceNo, customer, subject, date, dueDate, status, paid, notes, terms, items } =
      req.body;

    if (status !== "draft" && !customer) {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }

    const doc = new Invoice({
      invoiceNo: invoiceNo || "001",
      customer:  customer  || "",
      subject:   subject   || "",
      date:      date      || "",
      dueDate:   dueDate   || "",
      status:    status    || "saved",
      paid:      paid      || false,
      notes:     notes     || "",
      terms:     terms     || "",
      items:     items     || [],
    });

    await doc.save();
    res.status(201).json({ success: true, data: doc });
  })
);

// ─── PUT /api/invoices/:id ────────────────────────────────────────────────────
router.put(
  "/:id",
  asyncWrap(async (req, res) => {
    const { invoiceNo, customer, subject, date, dueDate, status, paid, notes, terms, items } =
      req.body;

    if (status !== "draft" && customer === "") {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }

    const itms     = items || [];
    const sub      = itms.reduce((s, it) => s + it.qty * it.rate, 0);
    const gstAmt   = itms.reduce((s, it) => s + it.qty * it.rate * (it.gst / 100), 0);

    const doc = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          invoiceNo,
          customer,
          subject,
          date,
          dueDate,
          status,
          paid,
          notes,
          terms,
          items: itms,
          subtotal:  parseFloat(sub.toFixed(2)),
          gstAmount: parseFloat(gstAmt.toFixed(2)),
          total:     parseFloat((sub + gstAmt).toFixed(2)),
        },
      },
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.json({ success: true, data: doc });
  })
);

// ─── PATCH /api/invoices/:id/status ──────────────────────────────────────────
// Lightweight: mark paid, convert draft → saved
router.patch(
  "/:id/status",
  asyncWrap(async (req, res) => {
    const { status, paid } = req.body;
    const update = {};
    if (status !== undefined) update.status = status;
    if (paid    !== undefined) update.paid   = paid;

    const doc = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.json({ success: true, data: doc });
  })
);

// ─── DELETE /api/invoices/:id ─────────────────────────────────────────────────
router.delete(
  "/:id",
  asyncWrap(async (req, res) => {
    const doc = await Invoice.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.json({ success: true, message: "Invoice deleted" });
  })
);

// ─── Route-level error handler ────────────────────────────────────────────────
router.use((err, req, res, _next) => {
  console.error("[Invoice Route Error]", err);
  res.status(500).json({ success: false, message: err.message || "Server error" });
});

export default router;