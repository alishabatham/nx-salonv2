const Business = require('../models/Business');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');

// Helper: Convert "HH:mm" string to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper: Convert minutes from midnight to "HH:mm" string
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
};

// Check if two time ranges overlap
const isOverlapping = (startA, endA, startB, endB) => {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return sA < eB && sB < eA;
};

/**
 * Universal Slot Engine
 */
const calculateAvailableSlots = async ({ businessId, serviceId, staffId, date }) => {
  // 1. Fetch Business, Service
  const business = await Business.findById(businessId);
  const service = await Service.findById(serviceId);
  
  if (!business || !service) {
    throw new Error('Business or Service not found');
  }

  // Determine day of week for the date string (YYYY-MM-DD)
  const dateObj = new Date(date + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

  // Check business working hours for this day
  const bizDayConfig = business.workingHours.find(h => h.day === dayName);
  if (!bizDayConfig || bizDayConfig.isClosed) {
    return { isClosed: true, message: `Business is closed on ${dayName}s`, slots: [] };
  }

  const bizOpenMin = timeToMinutes(bizDayConfig.openTime || '10:00');
  const bizCloseMin = timeToMinutes(bizDayConfig.closeTime || '20:00');
  const serviceDuration = service.duration || 30; // minutes

  // Find candidate staff
  let staffList = [];
  if (staffId && staffId !== 'any') {
    const singleStaff = await Staff.findOne({
      _id: staffId,
      businessId,
      isActive: true
    });
    if (singleStaff) staffList = [singleStaff];
  } else {
    // Find all staff assigned to this service
    staffList = await Staff.find({
      businessId,
      isActive: true,
      _id: { $in: service.assignedStaffIds.length ? service.assignedStaffIds : [/* fallback to all if empty */] }
    });
    // If no staff explicitly assigned, fallback to all active staff
    if (staffList.length === 0) {
      staffList = await Staff.find({ businessId, isActive: true });
    }
  }

  // Filter staff by working day and off days
  const availableStaffList = staffList.filter(s => {
    // Must work on this day
    const worksOnDay = s.workingDays && s.workingDays.includes(dayName);
    // Must not be on offDays
    const isOff = s.offDays && s.offDays.includes(date);
    return worksOnDay && !isOff;
  });

  if (availableStaffList.length === 0) {
    return { isClosed: false, message: 'No staff available on this date', slots: [] };
  }

  // Fetch all existing non-cancelled appointments for this date across these staff members
  const staffIds = availableStaffList.map(s => s._id);
  const existingAppts = await Appointment.find({
    businessId,
    staffId: { $in: staffIds },
    date,
    status: { $nin: ['cancelled', 'no_show'] }
  });

  // Slot step size: 15 mins or 30 mins depending on duration
  const stepMinutes = serviceDuration <= 30 ? 15 : 30;
  const timeSlots = [];

  for (let currentMin = bizOpenMin; currentMin + serviceDuration <= bizCloseMin; currentMin += stepMinutes) {
    const slotStartStr = minutesToTime(currentMin);
    const slotEndStr = minutesToTime(currentMin + serviceDuration);

    // Check which staff members are free during [slotStartStr, slotEndStr]
    const eligibleStaffForSlot = availableStaffList.filter(staff => {
      // Staff working hours bounds
      const staffStartMin = timeToMinutes(staff.workingHours?.start || '10:00');
      const staffEndMin = timeToMinutes(staff.workingHours?.end || '20:00');

      if (currentMin < staffStartMin || currentMin + serviceDuration > staffEndMin) {
        return false;
      }

      // Check overlapping appointments for this specific staff
      const staffAppts = existingAppts.filter(a => String(a.staffId) === String(staff._id));
      const hasConflict = staffAppts.some(appt => 
        isOverlapping(slotStartStr, slotEndStr, appt.startTime, appt.endTime)
      );

      return !hasConflict;
    });

    if (eligibleStaffForSlot.length > 0) {
      timeSlots.push({
        startTime: slotStartStr,
        endTime: slotEndStr,
        availableStaff: eligibleStaffForSlot.map(s => ({
          id: s._id,
          name: s.name,
          roleTitle: s.roleTitle,
          profilePhoto: s.profilePhoto
        }))
      });
    }
  }

  return {
    isClosed: false,
    date,
    dayName,
    serviceDuration,
    slots: timeSlots
  };
};

module.exports = {
  calculateAvailableSlots,
  isOverlapping,
  timeToMinutes,
  minutesToTime
};
