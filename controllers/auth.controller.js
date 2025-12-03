const User = require("../models/User.model");
const { USER_ROLES, HTTP_STATUS } = require("../utils/constants");

/**
 * Sync Firebase User to MongoDB
 * Creates or updates user in MongoDB when they authenticate via Firebase
 */
const syncFirebaseUser = async (req, res, next) => {
  try {
    const { firebaseUID, email, displayName, photoURL, emailVerified } =
      req.body;

    // Validation
    if (!firebaseUID || !email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Firebase UID and email are required",
      });
    }

    // Check if user already exists by Firebase UID
    let user = await User.findByFirebaseUID(firebaseUID);

    if (user) {
      // Update existing user
      user.email = email.toLowerCase();
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      user.emailVerified =
        emailVerified !== undefined ? emailVerified : user.emailVerified;
      user.lastLogin = new Date();
      await user.save();

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "User updated successfully",
        user: {
          id: user._id,
          firebaseUID: user.firebaseUID,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      });
    }

    // Check if user exists by email (for migration from old schema)
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      // Update existing user with firebaseUID
      existingUserByEmail.firebaseUID = firebaseUID;
      existingUserByEmail.displayName =
        displayName ||
        existingUserByEmail.displayName ||
        existingUserByEmail.name;
      existingUserByEmail.photoURL = photoURL || existingUserByEmail.photoURL;
      existingUserByEmail.emailVerified =
        emailVerified !== undefined
          ? emailVerified
          : existingUserByEmail.emailVerified;
      existingUserByEmail.lastLogin = new Date();
      await existingUserByEmail.save();

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "User migrated and updated successfully",
        user: {
          id: existingUserByEmail._id,
          firebaseUID: existingUserByEmail.firebaseUID,
          email: existingUserByEmail.email,
          displayName: existingUserByEmail.displayName,
          photoURL: existingUserByEmail.photoURL,
          role: existingUserByEmail.role,
          emailVerified: existingUserByEmail.emailVerified,
        },
      });
    }

    // Create new user (default role: student)
    user = new User({
      firebaseUID,
      email: email.toLowerCase(),
      displayName: displayName || null,
      photoURL: photoURL || null,
      emailVerified: emailVerified || false,
      role: USER_ROLES.STUDENT, // Default role
      lastLogin: new Date(),
    });

    await user.save();

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        firebaseUID: user.firebaseUID,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email already exists",
      });
    }

    next(error);
  }
};

/**
 * Get User Profile
 * Returns user information by Firebase UID
 */
const getUserProfile = async (req, res, next) => {
  try {
    const { firebaseUID } = req.params;

    if (!firebaseUID) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Firebase UID is required",
      });
    }

    const user = await User.findByFirebaseUID(firebaseUID);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      user: {
        id: user._id,
        firebaseUID: user.firebaseUID,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update User Role (Admin only - for future use)
 * Allows admins to change user roles
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(USER_ROLES).includes(role)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Valid role is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;
    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "User role updated successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncFirebaseUser,
  getUserProfile,
  updateUserRole,
};
