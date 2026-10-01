const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' },
  sellingPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  currentStock: { type: Number, required: true, default: 0, min: 0 },
  minStock: { type: Number, default: 5, min: 0 },
  unit: { type: String, default: 'pcs' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
