const mongoose = require('mongoose');
const dns = require('dns');

// Force reliable DNS resolution for MongoDB Atlas SRV lookups on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback if system restricts DNS overrides
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://alishabatham2_db_user:62DajUdS6EvfMaib@cluster0.7bmz6yp.mongodb.net/nxsalonv3?retryWrites=true&w=majority';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    // Do not crash server process if network is temporarily offline during dev
  }
};

module.exports = connectDB;
