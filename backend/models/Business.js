const mongoose = require('mongoose');

const defaultWorkingHours = [
  { day: 'Monday', openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 'Tuesday', openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 'Wednesday', openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 'Thursday', openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 'Friday', openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 'Saturday', openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 'Sunday', openTime: '10:00', closeTime: '18:00', isClosed: false }
];

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    required: true, 
    enum: [
      'Salon', 'Beauty Parlour', 'Unisex Salon', 'Spa', 
      'Nail Studio', 'Makeup Studio', 'Hair Studio', 
      'Beauty Studio', 'Grooming Studio', 'Skin Clinic', 'Custom'
    ],
    default: 'Salon'
  },
  customTypeName: { type: String, default: '' },
  logo: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  country: { type: String, default: 'India' },
  taxId: { type: String, default: '' }, // GST or Tax Number
  currency: { type: String, default: 'INR ₹' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  website: { type: String, default: '' },
  description: { type: String, default: '' },
  
  // Dynamic Terminology Customizations (optional overrides)
  terminology: {
    customer: { type: String, default: 'Customer' }, // e.g. Guest, Client
    staff: { type: String, default: 'Staff' },       // e.g. Team Member, Specialist
    service: { type: String, default: 'Service' }    // e.g. Treatment, Experience
  },

  workingHours: [
    {
      day: { type: String, required: true },
      openTime: { type: String, default: '10:00' },
      closeTime: { type: String, default: '20:00' },
      isClosed: { type: Boolean, default: false }
    }
  ],

  billingSettings: {
    invoicePrefix: { type: String, default: 'INV-' },
    taxRate: { type: Number, default: 18 }, // default GST 18%
    taxName: { type: String, default: 'GST' },
    isTaxEnabled: { type: Boolean, default: true }
  },

  notificationSettings: {
    smsEnabled: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: false },
    reminderHoursBefore: { type: Number, default: 24 }
  },

  rebookingRules: [
    {
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' },
      daysInterval: { type: Number, default: 30 }
    }
  ],

  setupCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
