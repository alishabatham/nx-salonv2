const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const Business = require('./models/Business');
const User = require('./models/User');
const ServiceCategory = require('./models/ServiceCategory');
const Service = require('./models/Service');
const Staff = require('./models/Staff');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const Appointment = require('./models/Appointment');
const Bill = require('./models/Bill');
const Payment = require('./models/Payment');
const InventoryTransaction = require('./models/InventoryTransaction');
const AuditLog = require('./models/AuditLog');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://alishabatham2_db_user:62DajUdS6EvfMaib@cluster0.7bmz6yp.mongodb.net/nxsalonv3?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('[Seed Engine] Connected to MongoDB Atlas...');

    // Clear existing data
    await Business.deleteMany({});
    await User.deleteMany({});
    await ServiceCategory.deleteMany({});
    await Service.deleteMany({});
    await Staff.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Appointment.deleteMany({});
    await Bill.deleteMany({});
    await Payment.deleteMany({});
    await InventoryTransaction.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('[Seed Engine] Cleared existing data.');

    // 1. Create Business
    const business = await Business.create({
      name: 'Aura Wellness Studio & Spa',
      type: 'Unisex Salon',
      phone: '+91 98765 43210',
      email: 'owner@aura.com',
      address: '104, Horizon Heights, MG Road',
      city: 'Mumbai',
      country: 'India',
      taxId: '27AAAAA0000A1Z5',
      currency: 'INR ₹',
      timezone: 'Asia/Kolkata',
      website: 'https://aurawellness.demo',
      description: 'Premier appointment-based luxury beauty, hair and spa studio.',
      terminology: {
        customer: 'Customer',
        staff: 'Staff',
        service: 'Service'
      },
      workingHours: [
        { day: 'Monday', openTime: '10:00', closeTime: '20:00', isClosed: false },
        { day: 'Tuesday', openTime: '10:00', closeTime: '20:00', isClosed: false },
        { day: 'Wednesday', openTime: '10:00', closeTime: '20:00', isClosed: false },
        { day: 'Thursday', openTime: '10:00', closeTime: '20:00', isClosed: false },
        { day: 'Friday', openTime: '10:00', closeTime: '20:00', isClosed: false },
        { day: 'Saturday', openTime: '10:00', closeTime: '21:00', isClosed: false },
        { day: 'Sunday', openTime: '10:00', closeTime: '18:00', isClosed: false }
      ],
      billingSettings: {
        invoicePrefix: 'INV-',
        taxRate: 18,
        taxName: 'GST',
        isTaxEnabled: true
      },
      setupCompleted: true
    });

    // 2. Create Staff Members
    const staff1 = await Staff.create({
      businessId: business._id,
      name: 'Elena Vance',
      mobile: '+91 98111 22233',
      email: 'elena@aura.com',
      roleTitle: 'Senior Hair Specialist',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      workingHours: { start: '10:00', end: '20:00' }
    });

    const staff2 = await Staff.create({
      businessId: business._id,
      name: 'Marcus Sterling',
      mobile: '+91 98222 33344',
      email: 'marcus@aura.com',
      roleTitle: 'Lead Skin & Spa Therapist',
      workingDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      workingHours: { start: '11:00', end: '20:00' }
    });

    const staff3 = await Staff.create({
      businessId: business._id,
      name: 'Sophia Chen',
      mobile: '+91 98333 44455',
      email: 'sophia@aura.com',
      roleTitle: 'Nail & Beauty Artist',
      workingDays: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      workingHours: { start: '10:00', end: '19:00' }
    });

    // 3. Create Users
    const ownerUser = await User.create({
      businessId: business._id,
      name: 'Aarav Sharma (Owner)',
      email: 'owner@aura.com',
      phone: '+91 98765 43210',
      password: 'password123',
      role: 'owner'
    });

    const receptionistUser = await User.create({
      businessId: business._id,
      name: 'Priya Nair (Desk)',
      email: 'reception@aura.com',
      phone: '+91 98765 11111',
      password: 'password123',
      role: 'receptionist'
    });

    const staffUser = await User.create({
      businessId: business._id,
      name: 'Elena Vance (Staff)',
      email: 'staff@aura.com',
      phone: '+91 98111 22233',
      password: 'password123',
      role: 'staff',
      staffId: staff1._id
    });

    // 4. Create Service Categories
    const catHair = await ServiceCategory.create({
      businessId: business._id,
      name: 'Hair Styling & Treatments',
      description: 'Precision haircuts, color and nourishing hair spa treatments',
      rebookingDaysInterval: 30
    });

    const catSkin = await ServiceCategory.create({
      businessId: business._id,
      name: 'Skin Care & Facials',
      description: 'Rejuvenating organic facials, glows and dermal care',
      rebookingDaysInterval: 21
    });

    const catNails = await ServiceCategory.create({
      businessId: business._id,
      name: 'Nails & Pedicure',
      description: 'Gel manicures, spa pedicures and custom nail art',
      rebookingDaysInterval: 15
    });

    // 5. Create Services
    const service1 = await Service.create({
      businessId: business._id,
      categoryId: catHair._id,
      name: 'Signature Haircut & Blowdry',
      description: 'Custom styling consultation, shampoo, head massage and precision cut',
      price: 850,
      duration: 45,
      taxPercentage: 18,
      assignedStaffIds: [staff1._id]
    });

    const service2 = await Service.create({
      businessId: business._id,
      categoryId: catSkin._id,
      name: 'Hydra-Glow Deep Cleansing Facial',
      description: 'Deep pore cleansing, ultrasonic exfoliation and hydrating mask',
      price: 2200,
      duration: 60,
      taxPercentage: 18,
      assignedStaffIds: [staff2._id]
    });

    const service3 = await Service.create({
      businessId: business._id,
      categoryId: catNails._id,
      name: 'Deluxe Gel Manicure & Nail Care',
      description: 'Cuticle treatment, hand massage, shaping and long-lasting gel polish',
      price: 1200,
      duration: 45,
      taxPercentage: 18,
      assignedStaffIds: [staff3._id]
    });

    const service4 = await Service.create({
      businessId: business._id,
      categoryId: catSkin._id,
      name: 'Aroma De-Stress Therapy Massage',
      description: 'Full body essential oil relaxation massage with warm compress',
      price: 3500,
      duration: 90,
      taxPercentage: 18,
      assignedStaffIds: [staff2._id]
    });

    // Link services to staff
    staff1.assignedServiceIds = [service1._id];
    await staff1.save();
    staff2.assignedServiceIds = [service2._id, service4._id];
    await staff2.save();
    staff3.assignedServiceIds = [service3._id];
    await staff3.save();

    // 6. Create Products (Inventory)
    const prod1 = await Product.create({
      businessId: business._id,
      name: 'Argan Nourishing Hair Serum (100ml)',
      category: 'Hair Care',
      sellingPrice: 750,
      costPrice: 420,
      currentStock: 18,
      minStock: 5,
      unit: 'bottle'
    });

    const prod2 = await Product.create({
      businessId: business._id,
      name: 'Vitamin C Brightening Serum (50ml)',
      category: 'Skin Care',
      sellingPrice: 1400,
      costPrice: 800,
      currentStock: 4, // Low stock demo!
      minStock: 5,
      unit: 'bottle'
    });

    const prod3 = await Product.create({
      businessId: business._id,
      name: 'Hydrating Botanical Cuticle Oil (15ml)',
      category: 'Nail Care',
      sellingPrice: 450,
      costPrice: 200,
      currentStock: 25,
      minStock: 6,
      unit: 'pcs'
    });

    // 7. Create Customers
    const cust1 = await Customer.create({
      businessId: business._id,
      name: 'Rohan Verma',
      mobile: '9876543210',
      email: 'rohan.v@example.com',
      gender: 'Male',
      address: 'Bandra West, Mumbai',
      totalVisits: 3,
      totalSpent: 4550,
      lastVisitDate: new Date()
    });

    const cust2 = await Customer.create({
      businessId: business._id,
      name: 'Ananya Roy',
      mobile: '9899988877',
      email: 'ananya.roy@example.com',
      gender: 'Female',
      address: 'Juhu, Mumbai',
      totalVisits: 2,
      totalSpent: 3400,
      lastVisitDate: new Date()
    });

    const cust3 = await Customer.create({
      businessId: business._id,
      name: 'Kabir Mehta',
      mobile: '9711122233',
      email: 'kabir.m@example.com',
      gender: 'Male',
      address: 'Andheri East, Mumbai'
    });

    // 8. Create Today's Appointments
    const todayStr = new Date().toISOString().split('T')[0];

    const appt1 = await Appointment.create({
      businessId: business._id,
      appointmentNumber: 'APP-1001',
      customerId: cust1._id,
      customerDetails: { name: cust1.name, mobile: cust1.mobile, email: cust1.email },
      serviceId: service1._id,
      serviceDetails: { name: service1.name, price: service1.price, duration: service1.duration },
      staffId: staff1._id,
      staffDetails: { name: staff1.name },
      date: todayStr,
      startTime: '10:30',
      endTime: '11:15',
      notes: 'Prefers light hair wash',
      bookingSource: 'Website',
      status: 'completed',
      passcode: 'AURA01'
    });

    const appt2 = await Appointment.create({
      businessId: business._id,
      appointmentNumber: 'APP-1002',
      customerId: cust2._id,
      customerDetails: { name: cust2.name, mobile: cust2.mobile, email: cust2.email },
      serviceId: service2._id,
      serviceDetails: { name: service2.name, price: service2.price, duration: service2.duration },
      staffId: staff2._id,
      staffDetails: { name: staff2.name },
      date: todayStr,
      startTime: '11:30',
      endTime: '12:30',
      notes: 'First time facial',
      bookingSource: 'Reception',
      status: 'in_service',
      passcode: 'AURA02'
    });

    const appt3 = await Appointment.create({
      businessId: business._id,
      appointmentNumber: 'APP-1003',
      customerId: cust3._id,
      customerDetails: { name: cust3.name, mobile: cust3.mobile, email: cust3.email },
      serviceId: service3._id,
      serviceDetails: { name: service3.name, price: service3.price, duration: service3.duration },
      staffId: staff3._id,
      staffDetails: { name: staff3.name },
      date: todayStr,
      startTime: '14:00',
      endTime: '14:45',
      notes: 'Nail art requested',
      bookingSource: 'Phone',
      status: 'booked',
      passcode: 'AURA03'
    });

    // 9. Create Bill & Payment for Appt 1
    const bill1 = await Bill.create({
      businessId: business._id,
      invoiceNumber: 'INV-1001',
      appointmentId: appt1._id,
      customerId: cust1._id,
      customerDetails: { name: cust1.name, mobile: cust1.mobile, email: cust1.email },
      items: [
        {
          itemType: 'service',
          itemId: service1._id,
          name: service1.name,
          qty: 1,
          unitPrice: service1.price,
          discount: 0,
          total: service1.price
        }
      ],
      subtotal: 850,
      discountType: 'fixed',
      discountValue: 50,
      discountAmount: 50,
      taxAmount: 144, // 18% on 800
      taxName: 'GST',
      grandTotal: 944,
      paidAmount: 944,
      pendingAmount: 0,
      paymentStatus: 'paid'
    });

    const payment1 = await Payment.create({
      businessId: business._id,
      billId: bill1._id,
      receiptNumber: 'RCP-1001',
      amount: 944,
      method: 'UPI',
      referenceNumber: 'UPI/987654/TXN123',
      notes: 'GPay payment'
    });

    // Audit logs
    await AuditLog.create({
      businessId: business._id,
      userId: ownerUser._id,
      userName: ownerUser.name,
      action: 'SEED_INITIALIZATION',
      entity: 'System',
      newValue: 'Demo database seeded successfully'
    });

    console.log('----------------------------------------------------');
    console.log('✅ SEED SUCCESSFUL! DEMO ACCOUNTS CREATED:');
    console.log('Business: Aura Wellness Studio & Spa');
    console.log('1. Owner User: owner@aura.com | Pass: password123');
    console.log('2. Reception User: reception@aura.com | Pass: password123');
    console.log('3. Staff User: staff@aura.com | Pass: password123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedData();
