const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, min: 5 }, // in minutes
  taxPercentage: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  assignedStaffIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
