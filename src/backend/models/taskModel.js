import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  taskId:     { type: String, unique: true },
  title:      { type: String, required: true },
  category:   { type: String, required: true },
  assignedTo: { type: String, required: true },
  due:        { type: Date,   required: true },
  priority:   { type: String, enum: ['urgent','high','normal','low'], default: 'normal' },
  status:     { type: String, enum: ['todo','in_progress','done'],    default: 'todo'   },
  notes:      { type: String, default: '' },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
  deletedBy:  { type: String },
}, { timestamps: true });

taskSchema.pre('save', async function (next) {
  if (!this.taskId) {
    const count  = await mongoose.model('Task').countDocuments();
    this.taskId  = `TSK-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('Task', taskSchema);