const express = require('express');
const router = express.Router();
const {
  getBusinessProfile,
  updateBusinessProfile,
  updateWorkingHours,
  updateBillingSettings,
  updateNotificationSettings,
  completeSetupWizard
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getBusinessProfile);
router.put('/profile', authorize('owner'), updateBusinessProfile);
router.put('/working-hours', authorize('owner'), updateWorkingHours);
router.put('/billing-settings', authorize('owner'), updateBillingSettings);
router.put('/notification-settings', authorize('owner'), updateNotificationSettings);
router.post('/complete-wizard', authorize('owner'), completeSetupWizard);

module.exports = router;
