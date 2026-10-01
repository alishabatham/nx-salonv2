const asyncHandler = require('express-async-handler');
const Business = require('../models/Business');
const ServiceCategory = require('../models/ServiceCategory');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Notification = require('../models/Notification');
const { calculateAvailableSlots, isOverlapping } = require('../utils/slotCalculator');
const logAudit = require('../utils/auditLogger');

// @desc    Get Public Business Profile & Catalog
// @route   GET /api/public/business/:id
// @access  Public
const getPublicBusinessInfo = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id).select(
    'name type customTypeName logo phone email address city country currency timezone website description terminology workingHours'
  );

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const categories = await ServiceCategory.find({ businessId: business._id, isActive: true });
  const services = await Service.find({ businessId: business._id, isActive: true })
    .populate('categoryId', 'name')
    .populate('assignedStaffIds', 'name roleTitle profilePhoto');
  const staff = await Staff.find({ businessId: business._id, isActive: true }).select('name roleTitle profilePhoto workingDays workingHours');

  res.json({
    business,
    categories,
    services,
    staff
  });
});

// Generate 6-char random alphanumeric passcode
const generatePasscode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Public Customer Self-Service Booking
// @route   POST /api/public/book
// @access  Public
const publicBookAppointment = asyncHandler(async (req, res) => {
  const { businessId, name, mobile, email, serviceId, staffId, date, startTime, notes } = req.body;

  if (!businessId || !name || !mobile || !serviceId || !date || !startTime) {
    res.status(400);
    throw new Error('Business, Name, Mobile, Service, Date, and Start Time are required');
  }

  const business = await Business.findById(businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  // 1. Find or create Customer
  let customer = await Customer.findOne({ businessId, mobile: mobile.trim() });
  if (!customer) {
    customer = await Customer.create({
      businessId,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim() : ''
    });
  }

  // 2. Fetch service
  const service = await Service.findOne({ _id: serviceId, businessId, isActive: true });
  if (!service) {
    res.status(404);
    throw new Error('Service not found or unavailable');
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
    const slotsResult = await calculateAvailableSlots({ businessId, serviceId, staffId: 'any', date });
    const slot = slotsResult.slots?.find(s => s.startTime === startTime);
    if (!slot || !slot.availableStaff || slot.availableStaff.length === 0) {
      res.status(400);
      throw new Error('No staff available for the selected time slot');
    }
    targetStaffId = slot.availableStaff[0].id;
  }

  const staff = await Staff.findOne({ _id: targetStaffId, businessId, isActive: true });
  if (!staff) {
    res.status(404);
    throw new Error('Selected staff member not found or unavailable');
  }

  // 4. Double booking conflict check
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
    throw new Error('This time slot is no longer available. Please select another slot.');
  }

  // 5. Create Appointment
  const count = await Appointment.countDocuments({ businessId });
  const appointmentNumber = `APP-${1000 + count + 1}`;
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
    bookingSource: 'Website',
    status: 'booked',
    passcode
  });

  // Log notification
  await Notification.create({
    businessId,
    recipientType: 'customer',
    recipientId: customer._id,
    recipientName: customer.name,
    recipientContact: customer.mobile,
    channel: 'sms',
    title: 'Self-Booking Confirmed',
    message: `Booking #${appointmentNumber} confirmed for ${service.name} on ${date} at ${startTime}. Passcode: ${passcode}`,
    status: 'not_configured'
  });

  await logAudit({
    businessId,
    userId: null,
    userName: `Customer: ${customer.name}`,
    action: 'PUBLIC_SELF_BOOKING',
    entity: 'Appointment',
    entityId: appointment._id,
    newValue: `${appointmentNumber} (${date} ${startTime})`
  });

  res.status(201).json({
    appointmentNumber: appointment.appointmentNumber,
    passcode: appointment.passcode,
    appointment
  });
});

// @desc    Customer Portal: Fetch all bookings & bills for a Customer Mobile Number
// @route   POST /api/public/customer-bookings
// @access  Public
const publicGetCustomerBookingsByMobile = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    res.status(400);
    throw new Error('Mobile number is required');
  }

  const cleanMobile = mobile.trim();
  const customers = await Customer.find({ mobile: cleanMobile });

  if (!customers || customers.length === 0) {
    return res.json({
      found: false,
      message: 'No customer profile or bookings found for this mobile number',
      appointments: [],
      bills: []
    });
  }

  const customerIds = customers.map(c => c._id);

  const appointments = await Appointment.find({ customerId: { $in: customerIds } })
    .populate('serviceId', 'name description price duration')
    .populate('staffId', 'name roleTitle profilePhoto')
    .populate('businessId', 'name phone address logo currency')
    .sort({ date: -1, startTime: -1 });

  const bills = await Bill.find({ customerId: { $in: customerIds } })
    .sort({ createdAt: -1 });

  res.json({
    found: true,
    customer: customers[0],
    appointments,
    bills
  });
});

// @desc    Secure Customer Self-Service Appointment Lookup by Passcode
// @route   POST /api/public/lookup
// @access  Public (Secure)
const publicGetAppointment = asyncHandler(async (req, res) => {
  const { appointmentNumber, passcode } = req.body;

  if (!appointmentNumber || !passcode) {
    res.status(400);
    throw new Error('Appointment number and passcode are required');
  }

  const appointment = await Appointment.findOne({
    appointmentNumber: appointmentNumber.trim().toUpperCase(),
    passcode: passcode.trim().toUpperCase()
  }).populate('serviceId', 'name description price duration')
    .populate('staffId', 'name roleTitle profilePhoto')
    .populate('businessId', 'name phone address logo currency');

  if (!appointment) {
    res.status(404);
    throw new Error('Invalid appointment number or passcode');
  }

  res.json(appointment);
});

// @desc    Reschedule Appointment
// @route   POST /api/public/reschedule
// @access  Public (Secure)
const publicRescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentNumber, passcode, newDate, newStartTime } = req.body;

  if (!appointmentNumber || !passcode || !newDate || !newStartTime) {
    res.status(400);
    throw new Error('Appointment number, passcode, new date, and start time are required');
  }

  const appointment = await Appointment.findOne({
    appointmentNumber: appointmentNumber.trim().toUpperCase(),
    passcode: passcode.trim().toUpperCase()
  });

  if (!appointment) {
    res.status(404);
    throw new Error('Invalid appointment number or passcode');
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    res.status(400);
    throw new Error(`Cannot reschedule an appointment that is already ${appointment.status}`);
  }

  const duration = appointment.serviceDetails.duration || 30;
  const [startH, startM] = newStartTime.split(':').map(Number);
  const startMin = startH * 60 + startM;
  const endMin = startMin + duration;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  // Check double booking conflict for staff on new date
  const existingAppts = await Appointment.find({
    businessId: appointment.businessId,
    staffId: appointment.staffId,
    date: newDate,
    _id: { $ne: appointment._id },
    status: { $nin: ['cancelled', 'no_show'] }
  });

  const conflict = existingAppts.find(a => 
    isOverlapping(newStartTime, newEndTime, a.startTime, a.endTime)
  );

  if (conflict) {
    res.status(400);
    throw new Error('Selected time slot is already booked for this staff member. Please select another slot.');
  }

  const prevDate = appointment.date;
  const prevTime = appointment.startTime;

  appointment.date = newDate;
  appointment.startTime = newStartTime;
  appointment.endTime = newEndTime;
  await appointment.save();

  await logAudit({
    businessId: appointment.businessId,
    userId: null,
    userName: `Customer: ${appointment.customerDetails.name}`,
    action: 'PUBLIC_RESCHEDULE_APPOINTMENT',
    entity: 'Appointment',
    entityId: appointment._id,
    previousValue: `${prevDate} ${prevTime}`,
    newValue: `${newDate} ${newStartTime}`
  });

  res.json({ message: 'Appointment rescheduled successfully', appointment });
});

// @desc    Secure Public Cancel Appointment
// @route   POST /api/public/cancel
// @access  Public (Secure)
const publicCancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentNumber, passcode, reason } = req.body;

  const appointment = await Appointment.findOne({
    appointmentNumber: appointmentNumber.trim().toUpperCase(),
    passcode: passcode.trim().toUpperCase()
  });

  if (!appointment) {
    res.status(404);
    throw new Error('Invalid appointment number or passcode');
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    res.status(400);
    throw new Error(`Appointment is already ${appointment.status}`);
  }

  appointment.status = 'cancelled';
  appointment.notes = appointment.notes ? `${appointment.notes} | Customer Cancelled: ${reason || 'No reason provided'}` : `Customer Cancelled: ${reason || 'No reason provided'}`;
  await appointment.save();

  await logAudit({
    businessId: appointment.businessId,
    userId: null,
    userName: `Customer: ${appointment.customerDetails.name}`,
    action: 'PUBLIC_CANCEL_APPOINTMENT',
    entity: 'Appointment',
    entityId: appointment._id,
    newValue: `Cancelled: ${appointmentNumber}`
  });

  res.json({ message: 'Appointment cancelled successfully', appointment });
});

module.exports = {
  getPublicBusinessInfo,
  publicBookAppointment,
  publicGetCustomerBookingsByMobile,
  publicGetAppointment,
  publicRescheduleAppointment,
  publicCancelAppointment
};
