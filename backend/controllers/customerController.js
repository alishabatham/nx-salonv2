const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const logAudit = require('../utils/auditLogger');

// @desc    Check duplicate customer by mobile number
// @route   GET /api/customers/check-duplicate
// @access  Private
const checkDuplicateCustomer = asyncHandler(async (req, res) => {
  const { mobile } = req.query;
  if (!mobile) {
    return res.json({ exists: false });
  }

  const existingCustomer = await Customer.findOne({
    businessId: req.user.businessId,
    mobile: mobile.trim()
  });

  if (existingCustomer) {
    return res.json({
      exists: true,
      customer: existingCustomer,
      message: 'Existing customer found'
    });
  }

  res.json({ exists: false });
});

// @desc    Get all customers / Search with pagination
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  const query = { businessId: req.user.businessId };

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { mobile: searchRegex },
      { email: searchRegex }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({
    customers,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    total
  });
});

// @desc    Get customer profile + history
// @route   GET /api/customers/:id
// @access  Private
const getCustomerDetails = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const appointments = await Appointment.find({
    businessId: req.user.businessId,
    customerId: customer._id
  }).sort({ createdAt: -1 });

  const bills = await Bill.find({
    businessId: req.user.businessId,
    customerId: customer._id
  }).sort({ createdAt: -1 });

  res.json({
    customer,
    appointments,
    bills
  });
});

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  const { name, mobile, email, gender, birthday, address, notes } = req.body;

  if (!name || !mobile) {
    res.status(400);
    throw new Error('Customer name and mobile number are required');
  }

  const customer = await Customer.create({
    businessId: req.user.businessId,
    name: name.trim(),
    mobile: mobile.trim(),
    email: email ? email.trim() : '',
    gender: gender || '',
    birthday: birthday || '',
    address: address || '',
    notes: notes || ''
  });

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'CREATE_CUSTOMER',
    entity: 'Customer',
    entityId: customer._id,
    newValue: `${customer.name} (${customer.mobile})`
  });

  res.status(201).json(customer);
});

// @desc    Update customer profile
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const prevName = customer.name;

  if (req.body.name) customer.name = req.body.name.trim();
  if (req.body.mobile) customer.mobile = req.body.mobile.trim();
  if (req.body.email !== undefined) customer.email = req.body.email.trim();
  if (req.body.gender !== undefined) customer.gender = req.body.gender;
  if (req.body.birthday !== undefined) customer.birthday = req.body.birthday;
  if (req.body.address !== undefined) customer.address = req.body.address;
  if (req.body.notes !== undefined) customer.notes = req.body.notes;

  const updatedCustomer = await customer.save();

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'UPDATE_CUSTOMER',
    entity: 'Customer',
    entityId: customer._id,
    previousValue: prevName,
    newValue: updatedCustomer.name
  });

  res.json(updatedCustomer);
});

module.exports = {
  checkDuplicateCustomer,
  getCustomers,
  getCustomerDetails,
  createCustomer,
  updateCustomer
};
