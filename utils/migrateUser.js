/**
 * Migration Script
 * Converts manually created user to match User model schema
 * 
 * Usage: node utils/migrateUser.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User.model");

const migrateUser = async () => {
  try {
    // Connect to database
    const DB_NAME = process.env.DB_NAME || "course_master";
    const MONGODB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8puxff9.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
    
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database");

    // Find the manually created user
    const oldUser = await mongoose.connection.db.collection("users").findOne({
      email: "shafeeullah.412@gmail.com"
    });

    if (!oldUser) {
      console.log("❌ User not found");
      process.exit(1);
    }

    console.log("Found user:", oldUser);

    // Check if user already has firebaseUID (already migrated)
    if (oldUser.firebaseUID) {
      console.log("✅ User already has firebaseUID, updating other fields...");
      
      // Update existing user to match schema
      await mongoose.connection.db.collection("users").updateOne(
        { _id: oldUser._id },
        {
          $set: {
            displayName: oldUser.name || oldUser.displayName,
            emailVerified: oldUser.emailVerified || false,
            isActive: oldUser.isActive !== undefined ? oldUser.isActive : true,
          },
          $unset: {
            name: "" // Remove old 'name' field if it exists
          }
        }
      );
      
      console.log("✅ User updated successfully");
    } else {
      console.log("⚠️  User missing firebaseUID. This user needs to be synced via Firebase Auth.");
      console.log("   Please log in through the frontend to sync the user automatically.");
      console.log("   Or manually add firebaseUID to the user document.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
};

migrateUser();

