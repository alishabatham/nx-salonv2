const asyncHandler = require('express-async-handler');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const Business = require('../models/Business');
const logAudit = require('../utils/auditLogger');

// Generate unique invoice number
const generateInvoiceNumber = async (businessId) => {
  const business = await Business.findById(businessId);
  const prefix = business?.billingSettings?.invoicePrefix || 'INV-';
  const count = await Bill.countDocuments({ businessId });
  return `${prefix}${1000 + count + 1}`;
};

// Generate unique receipt number
const generateReceiptNumber = async (businessId) => {
  const count = await Payment.countDocuments({ businessId });
  return `RCP-${1000 + count + 1}`;
};

// @desc    Create new Bill (Appointment or Direct Walk-in)
// @route   POST /api/billing
// @access  Private
const createBill = asyncHandler(async (req, res) => {
  const { customerId, appointmentId, items, discountType, discountValue } = req.body;
  const businessId = req.user.businessId;

  if (!customerId || !items || !items.length) {
    res.status(400);
    throw new Error('Customer and bill items are required');
  }

  const customer = await Customer.findOne({ _id: customerId, businessId });
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const business = await Business.findById(businessId);
  const isTaxEnabled = business?.billingSettings?.isTaxEnabled ?? true;
  const taxRate = isTaxEnabled ? (business?.billingSettings?.taxRate || 18) : 0;
  const taxName = business?.billingSettings?.taxName || 'GST';

  // Process items & subtotal calculation
  let subtotal = 0;
  const billItems = [];

  for (const item of items) {
    const qty = Number(item.qty || 1);
    const unitPrice = Number(item.unitPrice || 0);
    const itemSub = qty * unitPrice;
    const itemDiscount = Number(item.discount || 0);
    const itemTotal = Math.max(0, itemSub - itemDiscount);

    subtotal += itemTotal;

    billItems.push({
      itemType: item.itemType || 'service',
      itemId: item.itemId,
      name: item.name,
      qty,
      unitPrice,
      discount: itemDiscount,
      taxAmount: 0,
      total: itemTotal
    });

    // If item is a retail product sale, deduct stock
    if (item.itemType === 'product') {
      const product = await Product.findOne({ _id: item.itemId, businessId });
      if (product) {
        const prevStock = product.currentStock;
        product.currentStock = Math.max(0, product.currentStock - qty);
        await product.save();

        await InventoryTransaction.create({
          businessId,
          productId: product._id,
          quantity: -qty,
          previousStock: prevStock,
          newStock: product.currentStock,
          type: 'sale',
          reason: `Retail sale in Bill`,
          userId: req.user._id
        });
      }
    }
  }

  // Calculate global discount
  let discountAmount = 0;
  const dVal = Number(discountValue || 0);
  if (discountType === 'percentage') {
    discountAmount = (subtotal * dVal) / 100;
  } else {
    discountAmount = dVal;
  }
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const grandTotal = Math.round((afterDiscount + taxAmount) * 100) / 100;

  const invoiceNumber = await generateInvoiceNumber(businessId);

  const bill = await Bill.create({
    businessId,
    invoiceNumber,
    appointmentId: appointmentId || null,
    customerId: customer._id,
    customerDetails: {
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || ''
    },
    items: billItems,
    subtotal,
    discountType: discountType || 'fixed',
    discountValue: dVal,
    discountAmount,
    taxAmount,
    taxName,
    grandTotal,
    paidAmount: 0,
    pendingAmount: grandTotal,
    paymentStatus: 'pending'
  });

  // If linked to an appointment, update appointment status to completed if not already
  if (appointmentId) {
    await Appointment.updateOne(
      { _id: appointmentId, businessId },
      { $set: { status: 'completed' } }
    );
  }

  await logAudit({
    businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'CREATE_BILL',
    entity: 'Bill',
    entityId: bill._id,
    newValue: `${invoiceNumber} - ${customer.name} (₹${grandTotal})`
  });

  res.status(201).json(bill);
});

// @desc    Record Payment against a Bill
// @route   POST /api/billing/:id/payments
// @access  Private
const recordPayment = asyncHandler(async (req, res) => {
  const { amount, method, referenceNumber, notes } = req.body;
  const businessId = req.user.businessId;

  const bill = await Bill.findOne({ _id: req.params.id, businessId });
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  if (bill.isCancelled) {
    res.status(400);
    throw new Error('Cannot add payment to a cancelled bill');
  }

  const payAmount = Number(amount);
  if (!payAmount || payAmount <= 0) {
    res.status(400);
    throw new Error('Payment amount must be greater than 0');
  }

  if (payAmount > bill.pendingAmount + 0.01) {
    res.status(400);
    throw new Error(`Payment amount (₹${payAmount}) exceeds remaining pending amount (₹${bill.pendingAmount})`);
  }

  const receiptNumber = await generateReceiptNumber(businessId);

  const payment = await Payment.create({
    businessId,
    billId: bill._id,
    receiptNumber,
    amount: payAmount,
    method: method || 'Cash',
    referenceNumber: referenceNumber || '',
    notes: notes || ''
  });

  // Update Bill totals & status
  bill.paidAmount = Math.round((bill.paidAmount + payAmount) * 100) / 100;
  bill.pendingAmount = Math.max(0, Math.round((bill.grandTotal - bill.paidAmount) * 100) / 100);

  if (bill.pendingAmount === 0) {
    bill.paymentStatus = 'paid';
  } else {
    bill.paymentStatus = 'partially_paid';
  }

  await bill.save();

  // Update Customer total spent
  await Customer.updateOne(
    { _id: bill.customerId },
    { $inc: { totalSpent: payAmount } }
  );

  await logAudit({
    businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'RECORD_PAYMENT',
    entity: 'Payment',
    entityId: payment._id,
    newValue: `${receiptNumber} - ₹${payAmount} via ${payment.method} for Invoice ${bill.invoiceNumber}`
  });

  res.status(201).json({ payment, bill });
});

// @desc    Get all Bills
// @route   GET /api/billing
// @access  Private
const getBills = asyncHandler(async (req, res) => {
  const { paymentStatus, search } = req.query;
  const filter = { businessId: req.user.businessId };

  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { invoiceNumber: searchRegex },
      { 'customerDetails.name': searchRegex },
      { 'customerDetails.mobile': searchRegex }
    ];
  }

  const bills = await Bill.find(filter).sort({ createdAt: -1 });
  res.json(bills);
});

// @desc    Get Bill details with payment history for Invoice View / Receipt Print
// @route   GET /api/billing/:id
// @access  Private
const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  const payments = await Payment.find({ businessId: req.user.businessId, billId: bill._id }).sort({ createdAt: -1 });
  const business = await Business.findById(req.user.businessId);

  res.json({
    bill,
    payments,
    business
  });
});

module.exports = {
  createBill,
  recordPayment,
  getBills,
  getBillById
};
