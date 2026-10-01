const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  recordServiceConsumption
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

// Public access slot check endpoint
router.get('/slots', getAvailableSlots);

router.use(protect);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.put('/:id/status', updateAppointmentStatus);
router.post('/:id/consume-products', recordServiceConsumption);

module.exports = router;
