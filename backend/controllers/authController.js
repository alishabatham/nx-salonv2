const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Business = require('../models/Business');
const generateToken = require('../utils/generateToken');
const logAudit = require('../utils/auditLogger');

// @desc    Register new business & owner user
// @route   POST /api/auth/register
// @access  Public
const registerOwner = asyncHandler(async (req, res) => {
  const { businessName, businessType, customTypeName, name, email, phone, password } = req.body;

  if (!businessName || !name || !email || !password) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  // 1. Create Business
  const business = await Business.create({
    name: businessName,
    type: businessType || 'Salon',
    customTypeName: customTypeName || '',
    phone: phone || '',
    email,
    setupCompleted: false
  });

  // 2. Create Owner User
  const user = await User.create({
    businessId: business._id,
    name,
    email,
    phone: phone || '',
    password,
    role: 'owner'
  });

  await logAudit({
    businessId: business._id,
    userId: user._id,
    userName: user.name,
    action: 'REGISTER_BUSINESS',
    entity: 'Business',
    entityId: business._id,
    newValue: business.name
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
    business
  });
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const business = await Business.findById(user.businessId);
    
    await logAudit({
      businessId: user.businessId,
      userId: user._id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      business
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get current user profile & business
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  const business = await Business.findById(req.user.businessId);

  res.json({
    user,
    business
  });
});

module.exports = {
  registerOwner,
  loginUser,
  getMe
};
