const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const ServiceCategory = require('../models/ServiceCategory');
const Notification = require('../models/Notification');
const { calculateAvailableSlots, isOverlapping } = require('../utils/slotCalculator');
const logAudit = require('../utils/auditLogger');

// Generate unique Appointment number (APP-1001)
const generateAppointmentNumber = async (businessId) => {
  const count = await Appointment.countDocuments({ businessId });
  return `APP-${1000 + count + 1}`;
};

// Generate 6-char random alphanumeric passcode for customer tracking
const generatePasscode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Get dynamic available time slots
// @route   GET /api/appointments/slots
// @access  Public / Private
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { businessId, serviceId, staffId, date } = req.query;
  const bizId = businessId || req.user?.businessId;

  if (!bizId || !serviceId || !date) {
    res.status(400);
    throw new Error('businessId, serviceId, and date are required');
  }

  const result = await calculateAvailableSlots({
    businessId: bizId,
    serviceId,
    staffId: staffId || 'any',
    date
  });

  res.json(result);
});

// @desc    Get appointments list
// @route   GET /api/appointments
// @access  Private
const getAppointments = asyncHandler(async (req, res) => {
  const { date, status, staffId, customerId } = req.query;
  const filter = { businessId: req.user.businessId };

  if (date) filter.date = date;
  if (status) filter.status = status;
  if (staffId) filter.staffId = staffId;
  if (customerId) filter.customerId = customerId;

  const appointments = await Appointment.find(filter)
    .populate('serviceId', 'name price duration')
    .populate('staffId', 'name roleTitle profilePhoto')
    .populate('customerId', 'name mobile email')
    .sort({ startTime: 1, date: -1 });

  res.json(appointments);
});

// @desc    Create new appointment with double-booking validation
// @route   POST /api/appointments
// @access  Private
const createAppointment = asyncHandler(async (req, res) => {
  const { customerId, serviceId, staffId, date, startTime, notes, bookingSource } = req.body;
  const businessId = req.user.businessId;

  if (!customerId || !serviceId || !date || !startTime) {
    res.status(400);
    throw new Error('Customer, Service, Date, and Start Time are required');
  }

  // 1. Fetch customer
  const customer = await Customer.findOne({ _id: customerId, businessId });
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // 2. Fetch service
  const service = await Service.findOne({ _id: serviceId, businessId, isActive: true });
  if (!service) {
    res.status(404);
    throw new Error('Service not found or inactive');
  }

  // Calculate end time
  const [startH, startM] = startTime.split(':').map(Number);
  const startMin = startH * 60 + startM;
  const endMin = startMin + service.duration;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  // 3. Resolve Staff
  let targetStaffId = staffId;
  if (!targetStaffId || targetStaffId === 'any') {
    // Pick first available staff for this slot
    const slotsResult = await calculateAvailableSlots({ businessId, serviceId, staffId: 'any', date });
    const slot = slotsResult.slots?.find(s => s.startTime === startTime);
    if (!slot || !slot.availableStaff || slot.availableStaff.length === 0) {
      res.status(400);
      throw new Error('No staff available for the selected service and time slot');
    }
    targetStaffId = slot.availableStaff[0].id;
  }

  const staff = await Staff.findOne({ _id: targetStaffId, businessId, isActive: true });
  if (!staff) {
    res.status(404);
    throw new Error('Selected staff member not found or inactive');
  }

  // 4. DOUBLE BOOKING PROTECTION ENGINE
  // Search for any existing non-cancelled appointment for this staff on this date that overlaps
  const existingAppts = await Appointment.find({
    businessId,
    staffId: targetStaffId,
    date,
    status: { $nin: ['cancelled', 'no_show'] }
  });

  const conflict = existingAppts.find(appt => 
    isOverlapping(startTime, endTime, appt.startTime, appt.endTime)
  );

  if (conflict) {
    res.status(400);
    throw new Error(`This staff member is already booked during the selected time (${conflict.startTime} - ${conflict.endTime}).`);
  }

  // 5. Create Appointment with Snapshots
  const appointmentNumber = await generateAppointmentNumber(businessId);
  const passcode = generatePasscode();

  const appointment = await Appointment.create({
    businessId,
    appointmentNumber,
    customerId: customer._id,
    customerDetails: {
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || ''
    },
    serviceId: service._id,
    serviceDetails: {
      name: service.name,
      price: service.price,
      duration: service.duration
    },
    staffId: staff._id,
    staffDetails: {
      name: staff.name
    },
    date,
    startTime,
    endTime,
    notes: notes || '',
    bookingSource: bookingSource || 'Reception',
    status: 'booked',
    passcode
  });

  // Log Notification trigger
  await Notification.create({
    businessId,
    recipientType: 'customer',
    recipientId: customer._id,
    recipientName: customer.name,
    recipientContact: customer.mobile,
    channel: 'sms',
    title: 'Booking Confirmed',
    message: `Hi ${customer.name}, your appointment ${appointmentNumber} for ${service.name} with ${staff.name} on ${date} at ${startTime} is booked! Passcode: ${passcode}`,
    status: 'not_configured'
  });

  await logAudit({
    businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'CREATE_APPOINTMENT',
    entity: 'Appointment',
    entityId: appointment._id,
    newValue: `${appointmentNumber} - ${customer.name} - ${service.name} (${date} ${startTime})`
  });

  res.status(201).json(appointment);
});

// @desc    Update appointment status (checked_in, in_service, completed, cancelled, no_show)
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason } = req.body;
  const validStatuses = ['booked', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status transition');
  }

  const appointment = await Appointment.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  const prevStatus = appointment.status;
  appointment.status = status;

  // Handle service completion logic
  if (status === 'completed') {
    // Update customer visit stats
    await Customer.updateOne(
      { _id: appointment.customerId },
      { 
        $inc: { totalVisits: 1 },
        $set: { lastVisitDate: new Date() }
      }
    );

    // Calculate rebooking eligibility date based on service category
    const service = await Service.findById(appointment.serviceId);
    let daysInterval = 30;
    if (service && service.categoryId) {
      const cat = await ServiceCategory.findById(service.categoryId);
      if (cat && cat.rebookingDaysInterval) {
        daysInterval = cat.rebookingDaysInterval;
      }
    }

    const rebookingDate = new Date();
    rebookingDate.setDate(rebookingDate.getDate() + daysInterval);
    appointment.rebookingEligibleDate = rebookingDate;
  }

  if (cancellationReason) {
    appointment.notes = appointment.notes ? `${appointment.notes} | Cancel Reason: ${cancellationReason}` : `Cancel Reason: ${cancellationReason}`;
  }

  const updatedAppt = await appointment.save();

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'UPDATE_APPOINTMENT_STATUS',
    entity: 'Appointment',
    entityId: appointment._id,
    previousValue: prevStatus,
    newValue: status
  });

  res.json(updatedAppt);
});

// @desc    Record product consumption during service
// @route   POST /api/appointments/:id/consume-products
// @access  Private (Staff/Owner/Receptionist)
const recordServiceConsumption = asyncHandler(async (req, res) => {
  const { items } = req.body; // Array of { productId, qty }
  const appointment = await Appointment.findOne({ _id: req.params.id, businessId: req.user.businessId });

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (!items || !items.length) {
    res.status(400);
    throw new Error('Please select products consumed');
  }

  const consumedList = [];

  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, businessId: req.user.businessId });
    if (!product) continue;

    const qty = Number(item.qty || 1);
    if (product.currentStock < qty) {
      res.status(400);
      throw new Error(`Insufficient stock for product '${product.name}'. Current stock: ${product.currentStock}`);
    }

    const prevStock = product.currentStock;
    product.currentStock -= qty;
    await product.save();

    // Log Inventory Transaction
    await InventoryTransaction.create({
      businessId: req.user.businessId,
      productId: product._id,
      quantity: -qty,
      previousStock: prevStock,
      newStock: product.currentStock,
      type: 'service_consumption',
      reason: `Consumed in Appointment ${appointment.appointmentNumber} (${appointment.serviceDetails.name})`,
      appointmentId: appointment._id,
      userId: req.user._id
    });

    consumedList.push({
      productId: product._id,
      name: product.name,
      qty
    });
  }

  appointment.consumedProducts = [...appointment.consumedProducts, ...consumedList];
  await appointment.save();

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'RECORD_SERVICE_CONSUMPTION',
    entity: 'Appointment',
    entityId: appointment._id,
    newValue: JSON.stringify(consumedList)
  });

  res.json(appointment);
});

module.exports = {
  getAvailableSlots,
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  recordServiceConsumption
};
