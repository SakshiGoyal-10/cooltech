import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true },
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  email:       { type: String, lowercase: true },
  address:     { type: String },
  city:        { type: String },
  state:       { type: String },
  pincode:     { type: String },
  type:        { type: String, enum: ['Residential', 'Commercial', 'Industrial'], default: 'Residential' },
  units:       { type: Number, default: 1 },
  amc:         { type: Boolean, default: false },
  totalJobs:   { type: Number, default: 0 },
  totalSpent:  { type: Number, default: 0 },
  lastService: { type: Date },
  notes:       { type: String },
  tags:        [String],
  isDeleted:   { type: Boolean, default: false },
  deletedAt:   { type: Date },
}, { timestamps: true });

customerSchema.pre('save', async function (next) {
  if (!this.customerId) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerId = `C${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('Customer', customerSchema);
