const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['owner', 'receptionist', 'staff', 'customer'],
    default: 'owner'
  },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Match user password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
