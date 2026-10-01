const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Staff = require('../models/Staff');
const Service = require('../models/Service');

// Helper to get date bounds for filters
const getDateRange = (rangeType, customStart, customEnd) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (rangeType === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (rangeType === 'yesterday') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (rangeType === 'last7') {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (rangeType === 'thisMonth') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (rangeType === 'custom' && customStart && customEnd) {
    start = new Date(customStart + 'T00:00:00');
    end = new Date(customEnd + 'T23:59:59');
  } else {
    // Default to last 30 days
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
};

// @desc    Dashboard Realtime Operational Summary
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;

  // Today bounds
  const todayStr = new Date().toISOString().split('T')[0];
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date();
  endToday.setHours(23, 59, 59, 999);

  // Today's Payments
  const todayPayments = await Payment.find({
    businessId,
    createdAt: { $gte: startToday, $lte: endToday }
  });
  const todaySales = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  // Today's Appointments
  const todayAppointments = await Appointment.find({
    businessId,
    date: todayStr
  }).populate('serviceId', 'name price duration')
    .populate('staffId', 'name profilePhoto roleTitle')
    .populate('customerId', 'name mobile')
    .sort({ startTime: 1 });

  const apptBreakdown = {
    total: todayAppointments.length,
    booked: todayAppointments.filter(a => a.status === 'booked').length,
    confirmed: todayAppointments.filter(a => a.status === 'confirmed').length,
    checked_in: todayAppointments.filter(a => a.status === 'checked_in').length,
    in_service: todayAppointments.filter(a => a.status === 'in_service').length,
    completed: todayAppointments.filter(a => a.status === 'completed').length,
    cancelled: todayAppointments.filter(a => a.status === 'cancelled').length,
    no_show: todayAppointments.filter(a => a.status === 'no_show').length
  };

  // Today's New Customers
  const todayCustomers = await Customer.countDocuments({
    businessId,
    createdAt: { $gte: startToday, $lte: endToday }
  });

  // Total Pending Payments across all active bills
  const pendingBills = await Bill.find({
    businessId,
    paymentStatus: { $in: ['pending', 'partially_paid'] },
    isCancelled: false
  });
  const totalPendingPayment = pendingBills.reduce((sum, b) => sum + b.pendingAmount, 0);

  // Low Stock Count
  const allProducts = await Product.find({ businessId, isActive: true });
  const lowStockCount = allProducts.filter(p => p.currentStock <= p.minStock).length;

  // Recent Payments
  const recentPayments = await Payment.find({ businessId })
    .populate({
      path: 'billId',
      select: 'invoiceNumber customerDetails grandTotal pendingAmount'
    })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    todaySales,
    todayAppointmentsCount: todayAppointments.length,
    todayNewCustomersCount: todayCustomers,
    totalPendingPayment,
    lowStockCount,
    apptBreakdown,
    todayAppointments,
    recentPayments
  });
});

// @desc    Sales Report
// @route   GET /api/reports/sales
// @access  Private (Owner/Admin)
const getSalesReport = asyncHandler(async (req, res) => {
  const { range = 'thisMonth', startDate, endDate } = req.query;
  const { start, end } = getDateRange(range, startDate, endDate);
  const businessId = req.user.businessId;

  const bills = await Bill.find({
    businessId,
    createdAt: { $gte: start, $lte: end },
    isCancelled: false
  });

  const payments = await Payment.find({
    businessId,
    createdAt: { $gte: start, $lte: end }
  });

  const grossSales = bills.reduce((sum, b) => sum + b.subtotal, 0);
  const totalDiscounts = bills.reduce((sum, b) => sum + b.discountAmount, 0);
  const totalTax = bills.reduce((sum, b) => sum + b.taxAmount, 0);
  const netPayable = bills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = bills.reduce((sum, b) => sum + b.pendingAmount, 0);

  const paymentMethods = {
    Cash: 0,
    UPI: 0,
    Card: 0,
    'Bank Transfer': 0,
    Other: 0
  };

  payments.forEach(p => {
    paymentMethods[p.method] = (paymentMethods[p.method] || 0) + p.amount;
  });

  res.json({
    dateRange: { start, end },
    summary: {
      grossSales,
      totalDiscounts,
      totalTax,
      netPayable,
      totalPaid,
      totalPending,
      billCount: bills.length
    },
    paymentMethods
  });
});

// @desc    Appointment Report
// @route   GET /api/reports/appointments
// @access  Private
const getAppointmentReport = asyncHandler(async (req, res) => {
  const { range = 'thisMonth', startDate, endDate } = req.query;
  const { start, end } = getDateRange(range, startDate, endDate);
  const businessId = req.user.businessId;

  const appointments = await Appointment.find({
    businessId,
    createdAt: { $gte: start, $lte: end }
  });

  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;
  const noShow = appointments.filter(a => a.status === 'no_show').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;

  res.json({
    dateRange: { start, end },
    total,
    completed,
    cancelled,
    noShow,
    confirmed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  });
});

// @desc    Staff Performance Report
// @route   GET /api/reports/staff
// @access  Private (Owner/Admin)
const getStaffReport = asyncHandler(async (req, res) => {
  const { range = 'thisMonth', startDate, endDate } = req.query;
  const { start, end } = getDateRange(range, startDate, endDate);
  const businessId = req.user.businessId;

  const staffList = await Staff.find({ businessId, isActive: true });
  const appointments = await Appointment.find({
    businessId,
    createdAt: { $gte: start, $lte: end }
  });

  const staffStats = staffList.map(staff => {
    const staffAppts = appointments.filter(a => String(a.staffId) === String(staff._id));
    const completedAppts = staffAppts.filter(a => a.status === 'completed');
    const revenue = completedAppts.reduce((sum, a) => sum + (a.serviceDetails?.price || 0), 0);

    return {
      staffId: staff._id,
      name: staff.name,
      roleTitle: staff.roleTitle,
      totalAppointments: staffAppts.length,
      completedServices: completedAppts.length,
      revenueGenerated: revenue
    };
  });

  res.json(staffStats);
});

module.exports = {
  getDashboardSummary,
  getSalesReport,
  getAppointmentReport,
  getStaffReport
};
