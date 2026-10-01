const express = require('express');
const router = express.Router();
const {
  getStaffList,
  getStaffById,
  createStaff,
  updateStaff,
  toggleStaffActive
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getStaffList);
router.get('/:id', getStaffById);
router.post('/', authorize('owner'), createStaff);
router.put('/:id', authorize('owner'), updateStaff);
router.delete('/:id', authorize('owner'), toggleStaffActive);

module.exports = router;
