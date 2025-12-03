const express = require("express");
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByInstructor,
} = require("../controllers/course.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");
const { validate, courseSchema, courseUpdateSchema } = require("../utils/validation");

/**
 * Course Routes
 * Handles all course-related endpoints
 */

// Public routes
router.get("/", getAllCourses); // Get all courses (with filters)
router.get("/:id", getCourseById); // Get single course by ID
router.get("/instructor/:instructorId", getCoursesByInstructor); // Get courses by instructor

// Protected routes (require authentication)
router.post("/", authenticate, validate(courseSchema), createCourse); // Create course
router.put("/:id", authenticate, validate(courseUpdateSchema), updateCourse); // Update course
router.delete("/:id", authenticate, deleteCourse); // Delete course

module.exports = router;

