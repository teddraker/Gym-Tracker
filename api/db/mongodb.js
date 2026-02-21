const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

// Optimized connection pool settings for production
const client = new MongoClient(MONGODB_URI, {
  tls: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  // Connection pooling optimization
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  // Improve performance
  retryWrites: true,
  retryReads: true,
  // Compression for faster data transfer
  compressors: ['zlib'],
});

let db = null;
let connectionPromise = null;

async function connectDB() {
  try {
    // Return existing DB if already connected
    if (db) {
      return db;
    }

    // Prevent multiple simultaneous connection attempts
    if (connectionPromise) {
      await connectionPromise;
      return db;
    }

    // Create connection promise
    connectionPromise = client.connect();
    await connectionPromise;
    
    console.log('✓ Connected to MongoDB with connection pool');
    db = client.db('gym_tracker');
    
    // Reset connection promise
    connectionPromise = null;
    
    return db;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    connectionPromise = null;
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB:', err);
    process.exit(1);
  }
});

module.exports = { connectDB, client };
