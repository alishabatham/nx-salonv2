const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  recipientType: { type: String, enum: ['customer', 'staff', 'owner'], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, default: null },
  recipientName: { type: String, required: true },
  recipientContact: { type: String, default: '' },
  channel: { type: String, enum: ['in_app', 'sms', 'whatsapp', 'email'], default: 'in_app' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'pending', 'not_configured', 'failed'], default: 'sent' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
