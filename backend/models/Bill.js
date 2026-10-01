const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  itemType: { type: String, enum: ['service', 'product'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 }
});

const billSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  invoiceNumber: { type: String, required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerDetails: {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: '' }
  },
  items: [billItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  discountValue: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  taxName: { type: String, default: 'GST' },
  grandTotal: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  pendingAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'partially_paid', 'paid'],
    default: 'pending'
  },
  isCancelled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
