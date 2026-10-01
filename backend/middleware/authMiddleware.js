const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nx_wellness_os_jwt_secret_key_2026_super_secure');

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || !req.user.isActive) {
        res.status(401);
        throw new Error('Not authorized, user disabled or not found');
      }

      req.businessId = req.user.businessId;
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role '${req.user.role}' is not authorized to access this resource`);
    }
    next();
  };
};

module.exports = { protect, authorize };
