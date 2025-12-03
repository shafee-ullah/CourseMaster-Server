const User = require("../models/User.model");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Authentication Middleware
 * Verifies user by Firebase UID or Email
 * Attaches user to req.user for protected routes
 */
const authenticate = async (req, res, next) => {
  try {
    // Get Firebase UID or Email from request header or body
    const firebaseUID =
      req.headers["x-firebase-uid"] || req.body?.firebaseUID || null;
    const email = req.headers["x-user-email"] || req.body?.email || null;

    let user = null;

    // Try to find user by Firebase UID first (if provided)
    if (firebaseUID) {
      user = await User.findByFirebaseUID(firebaseUID);
    }

    // If not found by Firebase UID, try by email (fallback)
    if (!user && email) {
      user = await User.findByEmail(email);
    }

    // If still not found, return error
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "User not found. Please provide Firebase UID or Email.",
      });
    }

    if (!user.isActive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    next(error);
  }
};

/**
 * Admin Authorization Middleware
 * Must be used after authenticate middleware
 * Ensures user has admin role
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user.isAdmin()) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorizeAdmin,
};
