const mongoose = require("mongoose");
const { USER_ROLES } = require("../utils/constants");

/**
 * User Schema
 * Handles both Student and Admin roles
 * Syncs with Firebase Authentication
 */
const userSchema = new mongoose.Schema({
  // Firebase UID - unique identifier from Firebase Auth
  firebaseUID: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // User email
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  // Display name
  displayName: {
    type: String,
    trim: true,
  },
  // Profile photo URL
  photoURL: {
    type: String,
    default: null,
  },
  // User role: 'student' or 'admin'
  role: {
    type: String,
    enum: [USER_ROLES.STUDENT, USER_ROLES.ADMIN],
    default: USER_ROLES.STUDENT,
    index: true,
  },
  // Email verification status from Firebase
  emailVerified: {
    type: Boolean,
    default: false,
  },
  // Account creation date
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Last login timestamp
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Static method to find user by Firebase UID
userSchema.statics.findByFirebaseUID = function (firebaseUID) {
  return this.findOne({ firebaseUID });
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function () {
  return this.role === USER_ROLES.ADMIN;
};

// Instance method to check if user is student
userSchema.methods.isStudent = function () {
  return this.role === USER_ROLES.STUDENT;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
