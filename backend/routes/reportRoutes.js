const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getSalesReport,
  getAppointmentReport,
  getStaffReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardSummary);
router.get('/sales', authorize('owner'), getSalesReport);
router.get('/appointments', getAppointmentReport);
router.get('/staff', authorize('owner'), getStaffReport);

module.exports = router;
