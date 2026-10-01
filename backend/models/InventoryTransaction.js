const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true }, // positive for add, negative for consume/sale
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['stock_in', 'sale', 'service_consumption', 'adjustment', 'correction'],
    required: true
  },
  reason: { type: String, default: '' },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', default: null },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
