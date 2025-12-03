const mongoose = require("mongoose");

/**
 * Database Connection Configuration
 * Handles MongoDB Atlas connection with proper error handling
 */
const connectDB = async () => {
  try {
    const DB_NAME = process.env.DB_NAME || "course_master";
    const MONGODB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8puxff9.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`✅ MongoDB Atlas Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    // Exit process with failure code if connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
