const asyncHandler = require('express-async-handler');
const AuditLog = require('../models/AuditLog');

// @desc    Get Audit Logs for business
// @route   GET /api/audit-logs
// @access  Private (Owner/Admin)
const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, entity, limit = 100 } = req.query;
  const filter = { businessId: req.user.businessId };

  if (action) filter.action = action;
  if (entity) filter.entity = entity;

  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json(logs);
});

module.exports = { getAuditLogs };
