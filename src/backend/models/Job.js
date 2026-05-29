import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  jobId:      { type: String, unique: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String },
  address:    { type: String },
  type:       { type: String, enum: ['Service', 'Installation', 'Repair', 'AMC Visit', 'Inspection'], default: 'Service' },
  priority:   { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  status:     { type: String, enum: ['new', 'assigned', 'in_progress', 'completed', 'invoiced', 'cancelled'], default: 'new' },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  techName:   { type: String, default: 'Unassigned' },
  scheduledDate: { type: Date },
  scheduledTime: { type: String },
  completedAt:{ type: Date },
  ac:         { type: String },
  issue:      { type: String },
  remarks:    { type: String },
  amount:     { type: Number, default: 0 },
  parts:      [{ name: String, qty: Number, cost: Number }],
  photos:     [String],
  signature:  { type: String },
  amc:        { type: mongoose.Schema.Types.ObjectId, ref: 'AMC' },
  quotation:  { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  invoice:    { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
}, { timestamps: true });

jobSchema.pre('save', async function (next) {
  if (!this.jobId) {
    const count = await mongoose.model('Job').countDocuments();
    this.jobId = `JOB-${1000 + count + 1}`;
  }
  next();
});

export default mongoose.model('Job', jobSchema);
