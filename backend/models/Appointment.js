const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  appointmentNumber: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  // Snapshots for immutability
  customerDetails: {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: '' }
  },

  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  serviceDetails: {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }
  },

  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  staffDetails: {
    name: { type: String, required: true }
  },

  date: { type: String, required: true }, // Format YYYY-MM-DD
  startTime: { type: String, required: true }, // Format HH:mm (24hr)
  endTime: { type: String, required: true }, // Format HH:mm (24hr)
  notes: { type: String, default: '' },
  bookingSource: { 
    type: String, 
    enum: ['Reception', 'Phone', 'WhatsApp', 'Website', 'Walk-in', 'Other'],
    default: 'Reception'
  },
  
  status: { 
    type: String, 
    enum: ['booked', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show'],
    default: 'booked'
  },

  consumedProducts: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String },
      qty: { type: Number, default: 1 }
    }
  ],

  rebookingEligibleDate: { type: Date, default: null },
  rebookingReminderSent: { type: Boolean, default: false },
  passcode: { type: String, default: '' } // Secure customer lookup token/passcode
}, { timestamps: true });

// Compound index for schedule conflict checking
appointmentSchema.index({ businessId: 1, staffId: 1, date: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
