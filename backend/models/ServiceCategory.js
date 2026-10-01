const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  rebookingDaysInterval: { type: Number, default: 30 }, // Default rebooking cycle for this category
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);
