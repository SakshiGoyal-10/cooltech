import mongoose from 'mongoose';

const amcSchema = new mongoose.Schema({
  amcId:      { type: String, unique: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String },
  units:      { type: Number, default: 1 },
  plan:       { type: String, enum: ['Basic', 'Comprehensive', 'Premium'], default: 'Basic' },
  start:      { type: Date, required: true },
  end:        { type: Date, required: true },
  value:      { type: Number, default: 0 },
  visits:     { type: Number, default: 2 },
  done:       { type: Number, default: 0 },
  nextVisit:  { type: Date },
  status:     { type: String, enum: ['active', 'expiring', 'expired', 'cancelled'], default: 'active' },
  notes:      { type: String },
  acDetails:  [{ brand: String, model: String, type: String, serial: String }],
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
}, { timestamps: true });

amcSchema.pre('save', async function (next) {
  if (!this.amcId) {
    const count = await mongoose.model('AMC').countDocuments();
    this.amcId = `AMC-${200 + count + 1}`;
  }
  next();
});

export default mongoose.model('AMC', amcSchema);
