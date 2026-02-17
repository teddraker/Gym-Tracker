const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('gym_tracker');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
}

module.exports = { connectDB, client };
