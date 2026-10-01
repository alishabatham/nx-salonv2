const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true, lowercase: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''], default: '' },
  birthday: { type: String, default: '' }, // YYYY-MM-DD
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  totalVisits: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastVisitDate: { type: Date, default: null }
}, { timestamps: true });

// Compound index for fast lookup by business & mobile
customerSchema.index({ businessId: 1, mobile: 1 });

module.exports = mongoose.model('Customer', customerSchema);
