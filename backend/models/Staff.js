const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true, lowercase: true },
  profilePhoto: { type: String, default: '' },
  roleTitle: { type: String, default: 'Service Provider' }, // e.g. Manager, Receptionist, Specialist, Stylist, Therapist
  joiningDate: { type: Date, default: Date.now },
  assignedServiceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  workingDays: [{ type: String }], // e.g., ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  workingHours: {
    start: { type: String, default: '10:00' },
    end: { type: String, default: '20:00' }
  },
  offDays: [{ type: String }], // YYYY-MM-DD strings for leaves/off days
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
