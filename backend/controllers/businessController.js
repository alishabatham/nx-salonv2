const asyncHandler = require('express-async-handler');
const Business = require('../models/Business');
const logAudit = require('../utils/auditLogger');

// @desc    Get Business profile & settings
// @route   GET /api/business
// @access  Private
const getBusinessProfile = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.user.businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }
  res.json(business);
});

// @desc    Update Business general profile
// @route   PUT /api/business/profile
// @access  Private (Owner/Admin)
const updateBusinessProfile = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.user.businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const prevName = business.name;

  business.name = req.body.name || business.name;
  business.type = req.body.type || business.type;
  business.customTypeName = req.body.customTypeName ?? business.customTypeName;
  business.logo = req.body.logo ?? business.logo;
  business.phone = req.body.phone ?? business.phone;
  business.email = req.body.email ?? business.email;
  business.address = req.body.address ?? business.address;
  business.city = req.body.city ?? business.city;
  business.country = req.body.country ?? business.country;
  business.taxId = req.body.taxId ?? business.taxId;
  business.currency = req.body.currency ?? business.currency;
  business.timezone = req.body.timezone ?? business.timezone;
  business.website = req.body.website ?? business.website;
  business.description = req.body.description ?? business.description;

  if (req.body.terminology) {
    business.terminology = {
      customer: req.body.terminology.customer || business.terminology.customer,
      staff: req.body.terminology.staff || business.terminology.staff,
      service: req.body.terminology.service || business.terminology.service
    };
  }

  const updatedBusiness = await business.save();

  await logAudit({
    businessId: business._id,
    userId: req.user._id,
    userName: req.user.name,
    action: 'UPDATE_BUSINESS_PROFILE',
    entity: 'Business',
    entityId: business._id,
    previousValue: prevName,
    newValue: updatedBusiness.name
  });

  res.json(updatedBusiness);
});

// @desc    Update Business Working Hours
// @route   PUT /api/business/working-hours
// @access  Private (Owner/Admin)
const updateWorkingHours = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.user.businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  business.workingHours = req.body.workingHours || business.workingHours;
  const updated = await business.save();

  await logAudit({
    businessId: business._id,
    userId: req.user._id,
    userName: req.user.name,
    action: 'UPDATE_WORKING_HOURS',
    entity: 'Business',
    entityId: business._id
  });

  res.json(updated);
});

// @desc    Update Business Billing & Tax Settings
// @route   PUT /api/business/billing-settings
// @access  Private (Owner/Admin)
const updateBillingSettings = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.user.businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  business.billingSettings = {
    invoicePrefix: req.body.invoicePrefix ?? business.billingSettings.invoicePrefix,
    taxRate: req.body.taxRate ?? business.billingSettings.taxRate,
    taxName: req.body.taxName ?? business.billingSettings.taxName,
    isTaxEnabled: req.body.isTaxEnabled ?? business.billingSettings.isTaxEnabled
  };

  const updated = await business.save();

  await logAudit({
    businessId: business._id,
    userId: req.user._id,
    userName: req.user.name,
    action: 'UPDATE_BILLING_SETTINGS',
    entity: 'Business',
    entityId: business._id
  });

  res.json(updated);
});

// @desc    Update Business Notification Settings
// @route   PUT /api/business/notification-settings
// @access  Private (Owner/Admin)
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.user.businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  business.notificationSettings = {
    smsEnabled: req.body.smsEnabled ?? business.notificationSettings.smsEnabled,
    whatsappEnabled: req.body.whatsappEnabled ?? business.notificationSettings.whatsappEnabled,
    emailEnabled: req.body.emailEnabled ?? business.notificationSettings.emailEnabled,
    reminderHoursBefore: req.body.reminderHoursBefore ?? business.notificationSettings.reminderHoursBefore
  };

  const updated = await business.save();

  res.json(updated);
});

// @desc    Complete Onboarding Setup Wizard
// @route   POST /api/business/complete-wizard
// @access  Private (Owner/Admin)
const completeSetupWizard = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.user.businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  business.setupCompleted = true;
  const updated = await business.save();

  await logAudit({
    businessId: business._id,
    userId: req.user._id,
    userName: req.user.name,
    action: 'COMPLETE_SETUP_WIZARD',
    entity: 'Business',
    entityId: business._id
  });

  res.json(updated);
});

module.exports = {
  getBusinessProfile,
  updateBusinessProfile,
  updateWorkingHours,
  updateBillingSettings,
  updateNotificationSettings,
  completeSetupWizard
};
