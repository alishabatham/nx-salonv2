const asyncHandler = require('express-async-handler');
const ServiceCategory = require('../models/ServiceCategory');
const Service = require('../models/Service');
const logAudit = require('../utils/auditLogger');

// --- CATEGORIES ---

// @desc    Get all categories for business
// @route   GET /api/services/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find({ businessId: req.user.businessId }).sort({ createdAt: 1 });
  res.json(categories);
});

// @desc    Create service category
// @route   POST /api/services/categories
// @access  Private (Owner/Admin/Receptionist)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, rebookingDaysInterval } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }

  const category = await ServiceCategory.create({
    businessId: req.user.businessId,
    name,
    description: description || '',
    rebookingDaysInterval: rebookingDaysInterval || 30
  });

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'CREATE_SERVICE_CATEGORY',
    entity: 'ServiceCategory',
    entityId: category._id,
    newValue: category.name
  });

  res.status(201).json(category);
});

// @desc    Update service category
// @route   PUT /api/services/categories/:id
// @access  Private (Owner/Admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const prev = category.name;
  category.name = req.body.name || category.name;
  category.description = req.body.description ?? category.description;
  category.rebookingDaysInterval = req.body.rebookingDaysInterval ?? category.rebookingDaysInterval;
  if (req.body.isActive !== undefined) category.isActive = req.body.isActive;

  const updated = await category.save();

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'UPDATE_SERVICE_CATEGORY',
    entity: 'ServiceCategory',
    entityId: category._id,
    previousValue: prev,
    newValue: updated.name
  });

  res.json(updated);
});

// --- SERVICES ---

// @desc    Get all services for business
// @route   GET /api/services
// @access  Private
const getServices = asyncHandler(async (req, res) => {
  const { categoryId, activeOnly } = req.query;
  const filter = { businessId: req.user.businessId };

  if (categoryId) filter.categoryId = categoryId;
  if (activeOnly === 'true') filter.isActive = true;

  const services = await Service.find(filter)
    .populate('categoryId', 'name rebookingDaysInterval')
    .populate('assignedStaffIds', 'name roleTitle profilePhoto')
    .sort({ name: 1 });

  res.json(services);
});

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Owner/Admin)
const createService = asyncHandler(async (req, res) => {
  const { categoryId, name, description, price, duration, taxPercentage, notes, assignedStaffIds } = req.body;

  if (!categoryId || !name || price === undefined || !duration) {
    res.status(400);
    throw new Error('Category, name, price, and duration are required');
  }

  const service = await Service.create({
    businessId: req.user.businessId,
    categoryId,
    name,
    description: description || '',
    price: Number(price),
    duration: Number(duration),
    taxPercentage: Number(taxPercentage || 0),
    notes: notes || '',
    assignedStaffIds: assignedStaffIds || []
  });

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'CREATE_SERVICE',
    entity: 'Service',
    entityId: service._id,
    newValue: `${service.name} (₹${service.price})`
  });

  res.status(201).json(service);
});

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Owner/Admin)
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  const prevVal = `${service.name} (₹${service.price})`;

  if (req.body.categoryId) service.categoryId = req.body.categoryId;
  if (req.body.name) service.name = req.body.name;
  if (req.body.description !== undefined) service.description = req.body.description;
  if (req.body.price !== undefined) service.price = Number(req.body.price);
  if (req.body.duration !== undefined) service.duration = Number(req.body.duration);
  if (req.body.taxPercentage !== undefined) service.taxPercentage = Number(req.body.taxPercentage);
  if (req.body.notes !== undefined) service.notes = req.body.notes;
  if (req.body.assignedStaffIds) service.assignedStaffIds = req.body.assignedStaffIds;
  if (req.body.isActive !== undefined) service.isActive = req.body.isActive;

  const updated = await service.save();

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'UPDATE_SERVICE',
    entity: 'Service',
    entityId: service._id,
    previousValue: prevVal,
    newValue: `${updated.name} (₹${updated.price})`
  });

  res.json(updated);
});

// @desc    Soft delete / Toggle active service
// @route   DELETE /api/services/:id
// @access  Private (Owner/Admin)
const toggleServiceActive = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  service.isActive = !service.isActive;
  await service.save();

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: service.isActive ? 'ACTIVATE_SERVICE' : 'DEACTIVATE_SERVICE',
    entity: 'Service',
    entityId: service._id,
    newValue: service.name
  });

  res.json({ message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`, service });
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  getServices,
  createService,
  updateService,
  toggleServiceActive
};
