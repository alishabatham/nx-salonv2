const express = require('express');
const router = express.Router();
const {
  checkDuplicateCustomer,
  getCustomers,
  getCustomerDetails,
  createCustomer,
  updateCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/check-duplicate', checkDuplicateCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerDetails);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

module.exports = router;
