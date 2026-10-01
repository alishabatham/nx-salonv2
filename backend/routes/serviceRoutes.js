const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  getServices,
  createService,
  updateService,
  toggleServiceActive
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Category routes
router.get('/categories', getCategories);
router.post('/categories', authorize('owner', 'receptionist'), createCategory);
router.put('/categories/:id', authorize('owner'), updateCategory);

// Service routes
router.get('/', getServices);
router.post('/', authorize('owner'), createService);
router.put('/:id', authorize('owner'), updateService);
router.delete('/:id', authorize('owner'), toggleServiceActive);

module.exports = router;
