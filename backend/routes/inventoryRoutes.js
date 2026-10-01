const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  adjustStock,
  getTransactions
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/products', getProducts);
router.post('/products', authorize('owner'), createProduct);
router.put('/products/:id', authorize('owner'), updateProduct);
router.post('/products/:id/adjust', authorize('owner', 'receptionist'), adjustStock);
router.get('/transactions', getTransactions);

module.exports = router;
