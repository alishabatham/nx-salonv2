const express = require('express');
const router = express.Router();
const {
  createBill,
  recordPayment,
  getBills,
  getBillById
} = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getBills);
router.get('/:id', getBillById);
router.post('/', createBill);
router.post('/:id/payments', recordPayment);

module.exports = router;
