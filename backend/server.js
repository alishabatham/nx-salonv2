const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root Welcome Route (Fixes Vercel 404 on '/')
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Beauty & Wellness Business OS Backend API',
    health: '/api/health',
    version: '1.0.0'
  });
});

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Beauty & Wellness Business OS API is running cleanly', time: new Date() });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/business', require('./routes/businessRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

// Error Handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[API Server] Express running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
