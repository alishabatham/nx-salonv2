const asyncHandler = require('express-async-handler');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const logAudit = require('../utils/auditLogger');

// @desc    Get all staff members for business
// @route   GET /api/staff
// @access  Private
const getStaffList = asyncHandler(async (req, res) => {
  const { serviceId, activeOnly } = req.query;
  const filter = { businessId: req.user.businessId };

  if (activeOnly === 'true') filter.isActive = true;
  if (serviceId) filter.assignedServiceIds = serviceId;

  const staff = await Staff.find(filter)
    .populate('assignedServiceIds', 'name price duration')
    .sort({ name: 1 });

  res.json(staff);
});

// @desc    Get single staff details
// @route   GET /api/staff/:id
// @access  Private
const getStaffById = asyncHandler(async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id, businessId: req.user.businessId })
    .populate('assignedServiceIds', 'name price duration');

  if (!staff) {
    res.status(404);
    throw new Error('Staff member not found');
  }

  res.json(staff);
});

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private (Owner/Admin)
const createStaff = asyncHandler(async (req, res) => {
  const { name, mobile, email, profilePhoto, roleTitle, joiningDate, assignedServiceIds, workingDays, workingHours, offDays } = req.body;

  if (!name || !mobile) {
    res.status(400);
    throw new Error('Staff name and mobile number are required');
  }

  const staff = await Staff.create({
    businessId: req.user.businessId,
    name,
    mobile,
    email: email || '',
    profilePhoto: profilePhoto || '',
    roleTitle: roleTitle || 'Service Provider',
    joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
    assignedServiceIds: assignedServiceIds || [],
    workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: workingHours || { start: '10:00', end: '20:00' },
    offDays: offDays || []
  });

  // Sync back to services: update assignedStaffIds in services
  if (assignedServiceIds && assignedServiceIds.length > 0) {
    await Service.updateMany(
      { _id: { $in: assignedServiceIds }, businessId: req.user.businessId },
      { $addToSet: { assignedStaffIds: staff._id } }
    );
  }

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'CREATE_STAFF',
    entity: 'Staff',
    entityId: staff._id,
    newValue: `${staff.name} (${staff.roleTitle})`
  });

  res.status(201).json(staff);
});

// @desc    Update staff profile & mappings
// @route   PUT /api/staff/:id
// @access  Private (Owner/Admin)
const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!staff) {
    res.status(404);
    throw new Error('Staff member not found');
  }

  const prevName = staff.name;

  if (req.body.name) staff.name = req.body.name;
  if (req.body.mobile) staff.mobile = req.body.mobile;
  if (req.body.email !== undefined) staff.email = req.body.email;
  if (req.body.profilePhoto !== undefined) staff.profilePhoto = req.body.profilePhoto;
  if (req.body.roleTitle) staff.roleTitle = req.body.roleTitle;
  if (req.body.joiningDate) staff.joiningDate = new Date(req.body.joiningDate);
  if (req.body.workingDays) staff.workingDays = req.body.workingDays;
  if (req.body.workingHours) staff.workingHours = req.body.workingHours;
  if (req.body.offDays) staff.offDays = req.body.offDays;
  if (req.body.isActive !== undefined) staff.isActive = req.body.isActive;

  if (req.body.assignedServiceIds) {
    const oldServiceIds = staff.assignedServiceIds.map(id => String(id));
    const newServiceIds = req.body.assignedServiceIds;

    staff.assignedServiceIds = newServiceIds;

    // Remove staff from services no longer assigned
    const removedServices = oldServiceIds.filter(id => !newServiceIds.includes(id));
    if (removedServices.length > 0) {
      await Service.updateMany(
        { _id: { $in: removedServices }, businessId: req.user.businessId },
        { $pull: { assignedStaffIds: staff._id } }
      );
    }

    // Add staff to newly assigned services
    if (newServiceIds.length > 0) {
      await Service.updateMany(
        { _id: { $in: newServiceIds }, businessId: req.user.businessId },
        { $addToSet: { assignedStaffIds: staff._id } }
      );
    }
  }

  const updatedStaff = await staff.save();

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'UPDATE_STAFF',
    entity: 'Staff',
    entityId: staff._id,
    previousValue: prevName,
    newValue: updatedStaff.name
  });

  res.json(updatedStaff);
});

// @desc    Toggle staff active status
// @route   DELETE /api/staff/:id
// @access  Private (Owner/Admin)
const toggleStaffActive = asyncHandler(async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!staff) {
    res.status(404);
    throw new Error('Staff member not found');
  }

  staff.isActive = !staff.isActive;
  await staff.save();

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: staff.isActive ? 'ACTIVATE_STAFF' : 'DEACTIVATE_STAFF',
    entity: 'Staff',
    entityId: staff._id,
    newValue: staff.name
  });

  res.json({ message: `Staff member ${staff.isActive ? 'activated' : 'deactivated'}`, staff });
});

module.exports = {
  getStaffList,
  getStaffById,
  createStaff,
  updateStaff,
  toggleStaffActive
};
