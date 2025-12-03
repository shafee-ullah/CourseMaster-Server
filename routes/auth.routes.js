const express = require("express");
const router = express.Router();
const {
  syncFirebaseUser,
  getUserProfile,
  updateUserRole,
} = require("../controllers/auth.controller");

/**
 * Authentication Routes
 * Handles Firebase user synchronization and user management
 */

// POST /api/auth/sync - Sync Firebase user to MongoDB
router.post("/sync", syncFirebaseUser);

// GET /api/auth/profile/:firebaseUID - Get user profile by Firebase UID
router.get("/profile/:firebaseUID", getUserProfile);

// PATCH /api/auth/role/:userId - Update user role (Admin only - for future use)
router.patch("/role/:userId", updateUserRole);

module.exports = router;

