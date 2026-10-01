const AuditLog = require('../models/AuditLog');

const logAudit = async ({ businessId, userId, userName, action, entity, entityId = '', previousValue = '', newValue = '', reason = '' }) => {
  try {
    if (!businessId) return;
    await AuditLog.create({
      businessId,
      userId: userId || null,
      userName: userName || 'System',
      action,
      entity,
      entityId: String(entityId),
      previousValue: typeof previousValue === 'object' ? JSON.stringify(previousValue) : String(previousValue),
      newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue),
      reason
    });
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
};

module.exports = logAudit;
