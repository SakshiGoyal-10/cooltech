import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema({
  techId:     { type: String, unique: true },
  name:       { type: String, required: true },
  phone:      { type: String, required: true },
  email:      { type: String, lowercase: true },
  role:       { type: String, default: 'Technician' },
  status:     { type: String, enum: ['available', 'busy', 'off', 'on_leave'], default: 'available' },
  rating:     { type: Number, default: 4.0, min: 0, max: 5 },
  jobs:       { type: Number, default: 0 },
  completed:  { type: Number, default: 0 },
  area:       { type: String },
  skills:     [String],
  joinDate:   { type: Date },
  salary:     { type: Number, default: 0 },
  advance:    { type: Number, default: 0 },
  address:    { type: String },
  idProof:    { type: String },
  bankAccount:{ type: String },
  ifsc:       { type: String },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive:   { type: Boolean, default: true },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
}, { timestamps: true });

technicianSchema.pre('save', async function (next) {
  if (!this.techId) {
    const count = await mongoose.model('Technician').countDocuments();
    this.techId = `T${String(count + 1).padStart(2, '0')}`;
  }
  next();
});

export default mongoose.model('Technician', technicianSchema);
