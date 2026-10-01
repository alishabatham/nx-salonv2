const express = require('express');
const router = express.Router();
const {
  getPublicBusinessInfo,
  publicBookAppointment,
  publicGetCustomerBookingsByMobile,
  publicGetAppointment,
  publicRescheduleAppointment,
  publicCancelAppointment
} = require('../controllers/publicController');

router.get('/business/:id', getPublicBusinessInfo);
router.post('/book', publicBookAppointment);
router.post('/customer-bookings', publicGetCustomerBookingsByMobile);
router.post('/lookup', publicGetAppointment);
router.post('/reschedule', publicRescheduleAppointment);
router.post('/cancel', publicCancelAppointment);

module.exports = router;
