// models/Invoice.model.js
// Place at: src/backend/models/Invoice.model.js
// Your project uses ESM — so this uses import/export

import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    qty:  { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    gst:  { type: Number, default: 18 },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, trim: true , unique: true},
    invoiceNumber: { type: String, default: null },  // ← accept but don't index
    invoiceId:     { type: String, default: null, default: undefined, },  // ← accept but don't index
    customer:  { type: String, default: "", required: true, trim: true },
    subject:   { type: String, default: "",    trim: true },
    date:      { type: String, default: "" },   // "YYYY-MM-DD"
    dueDate:   { type: String, default: "" },
    status:    { type: String, enum: ["draft", "saved", "paid", "pending"], default: "pending" },
    paid:      { type: Boolean, default: false },
    notes:     { type: String, default: "" },
    terms:     { type: String, default: "" },
    items:     { type: [ItemSchema], default: [] },

    // Computed totals — stored for fast list queries
    subtotal:  { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total:     { type: Number, default: 0 },
  },
  {
    timestamps: true,  // adds createdAt + updatedAt automatically
    versionKey: false,
  }
);

// Auto-compute totals before every save
InvoiceSchema.pre("save", function (next) {
  const sub = this.items.reduce((s, it) => s + it.qty * it.rate, 0);
  const gst = this.items.reduce((s, it) => s + it.qty * it.rate * (it.gst / 100), 0);
  this.subtotal  = parseFloat(sub.toFixed(2));
  this.gstAmount = parseFloat(gst.toFixed(2));
  this.total     = parseFloat((sub + gst).toFixed(2));
  next();
});

// Also recompute on findOneAndUpdate
InvoiceSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const items  = update?.items || update?.$set?.items;
  if (items) {
    const sub = items.reduce((s, it) => s + it.qty * it.rate, 0);
    const gst = items.reduce((s, it) => s + it.qty * it.rate * (it.gst / 100), 0);
    this.set({
      subtotal:  parseFloat(sub.toFixed(2)),
      gstAmount: parseFloat(gst.toFixed(2)),
      total:     parseFloat((sub + gst).toFixed(2)),
    });
  }
  next();
});

const Invoice = mongoose.model("Invoice", InvoiceSchema);
export default Invoice;