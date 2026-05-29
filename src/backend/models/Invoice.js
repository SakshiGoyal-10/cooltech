import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceId:  { type: String, unique: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  jobRef:     { type: String },
  items:      [{ desc: String, qty: Number, rate: Number, amount: Number }],
  amount:     { type: Number, default: 0 },
  discount:   { type: Number, default: 0 },
  tax:        { type: Number, default: 0 },
  total:      { type: Number, default: 0 },
  dueDate:    { type: Date },
  status:     { type: String, enum: ['paid', 'pending', 'overdue', 'cancelled'], default: 'pending' },
  paidAt:     { type: Date },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'] },
  notes:      { type: String },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
}, { timestamps: true });

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceId) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceId = `INV-${2000 + count + 1}`;
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
