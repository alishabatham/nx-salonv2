const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, default: 'System' },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String, default: '' },
  previousValue: { type: String, default: '' },
  newValue: { type: String, default: '' },
  reason: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
