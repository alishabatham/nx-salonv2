const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  receiptNumber: { type: String, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  method: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'],
    default: 'Cash'
  },
  referenceNumber: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
