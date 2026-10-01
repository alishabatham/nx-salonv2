const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const logAudit = require('../utils/auditLogger');

// @desc    Get all inventory products
// @route   GET /api/inventory/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { lowStockOnly, search, category } = req.query;
  const filter = { businessId: req.user.businessId };

  if (category) filter.category = category;
  if (search) {
    filter.name = new RegExp(search.trim(), 'i');
  }

  let products = await Product.find(filter).sort({ name: 1 });

  if (lowStockOnly === 'true') {
    products = products.filter(p => p.currentStock <= p.minStock);
  }

  res.json(products);
});

// @desc    Create new product
// @route   POST /api/inventory/products
// @access  Private (Owner/Admin)
const createProduct = asyncHandler(async (req, res) => {
  const { name, category, sellingPrice, costPrice, currentStock, minStock, unit } = req.body;

  if (!name || sellingPrice === undefined || currentStock === undefined) {
    res.status(400);
    throw new Error('Product name, selling price, and initial stock are required');
  }

  const product = await Product.create({
    businessId: req.user.businessId,
    name: name.trim(),
    category: category || 'General',
    sellingPrice: Number(sellingPrice),
    costPrice: Number(costPrice || 0),
    currentStock: Number(currentStock),
    minStock: Number(minStock || 5),
    unit: unit || 'pcs'
  });

  // Log initial stock in transaction
  if (Number(currentStock) > 0) {
    await InventoryTransaction.create({
      businessId: req.user.businessId,
      productId: product._id,
      quantity: Number(currentStock),
      previousStock: 0,
      newStock: Number(currentStock),
      type: 'stock_in',
      reason: 'Initial stock setup',
      userId: req.user._id
    });
  }

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'CREATE_PRODUCT',
    entity: 'Product',
    entityId: product._id,
    newValue: `${product.name} (Stock: ${product.currentStock})`
  });

  res.status(201).json(product);
});

// @desc    Update product details
// @route   PUT /api/inventory/products/:id
// @access  Private (Owner/Admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, businessId: req.user.businessId });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const prevName = product.name;

  if (req.body.name) product.name = req.body.name.trim();
  if (req.body.category) product.category = req.body.category;
  if (req.body.sellingPrice !== undefined) product.sellingPrice = Number(req.body.sellingPrice);
  if (req.body.costPrice !== undefined) product.costPrice = Number(req.body.costPrice);
  if (req.body.minStock !== undefined) product.minStock = Number(req.body.minStock);
  if (req.body.unit) product.unit = req.body.unit;
  if (req.body.isActive !== undefined) product.isActive = req.body.isActive;

  const updatedProduct = await product.save();

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'UPDATE_PRODUCT',
    entity: 'Product',
    entityId: product._id,
    previousValue: prevName,
    newValue: updatedProduct.name
  });

  res.json(updatedProduct);
});

// @desc    Stock Adjustment / Stock In
// @route   POST /api/inventory/products/:id/adjust
// @access  Private (Owner/Admin/Receptionist)
const adjustStock = asyncHandler(async (req, res) => {
  const { quantity, type, reason } = req.body;
  const product = await Product.findOne({ _id: req.params.id, businessId: req.user.businessId });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty === 0) {
    res.status(400);
    throw new Error('Valid non-zero quantity is required');
  }

  const prevStock = product.currentStock;
  const newStock = prevStock + qty;

  if (newStock < 0) {
    res.status(400);
    throw new Error('Stock cannot become negative');
  }

  product.currentStock = newStock;
  await product.save();

  const transaction = await InventoryTransaction.create({
    businessId: req.user.businessId,
    productId: product._id,
    quantity: qty,
    previousStock: prevStock,
    newStock,
    type: type || (qty > 0 ? 'stock_in' : 'adjustment'),
    reason: reason || 'Manual adjustment',
    userId: req.user._id
  });

  await logAudit({
    businessId: req.user.businessId,
    userId: req.user._id,
    userName: req.user.name,
    action: 'ADJUST_STOCK',
    entity: 'Product',
    entityId: product._id,
    previousValue: `Stock: ${prevStock}`,
    newValue: `Stock: ${newStock} (${qty > 0 ? '+' : ''}${qty})`
  });

  res.json({ product, transaction });
});

// @desc    Get Inventory Stock Movement Audit History
// @route   GET /api/inventory/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const { productId } = req.query;
  const filter = { businessId: req.user.businessId };

  if (productId) filter.productId = productId;

  const transactions = await InventoryTransaction.find(filter)
    .populate('productId', 'name unit')
    .populate('userId', 'name')
    .sort({ createdAt: -1 });

  res.json(transactions);
});

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  adjustStock,
  getTransactions
};
