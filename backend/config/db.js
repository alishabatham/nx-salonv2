const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS resolvers if running on local environment
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in environments where system restricts DNS overrides (e.g. Vercel Lambda)
}

let cachedConn = null;

const connectDB = async () => {
  // 1. If connection already established, reuse cached connection
  if (cachedConn && mongoose.connection.readyState >= 1) {
    return cachedConn;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb+srv://alishabatham2_db_user:62DajUdS6EvfMaib@cluster0.7bmz6yp.mongodb.net/nxsalonv3?retryWrites=true&w=majority';

  try {
    // 2. Disable Mongoose bufferCommands so queries fail fast with clear errors instead of timing out 10s
    mongoose.set('bufferCommands', false);

    cachedConn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000, // 8 second timeout
      connectTimeoutMS: 10000
    });

    console.log(`[MongoDB Connected] Host: ${cachedConn.connection.host}`);
    return cachedConn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    // Clear cachedConn on failure so next request retries fresh connection
    cachedConn = null;
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = connectDB;
