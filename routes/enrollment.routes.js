const express = require("express");
const router = express.Router();
const {
  enrollInCourse,
  getMyCourses,
  getEnrollmentById,
  markLessonComplete,
  updateLastAccessed,
  getEnrollmentAnalytics,
  getEnrollmentsByCourse,
} = require("../controllers/enrollment.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");

/**
 * Enrollment Routes
 * All routes require authentication
 */

// POST /api/enrollments - Enroll in a course
router.post("/", authenticate, enrollInCourse);

// GET /api/enrollments/my-courses - Get student's enrolled courses
router.get("/my-courses", authenticate, getMyCourses);

// GET /api/enrollments/:enrollmentId - Get single enrollment
router.get("/:enrollmentId", authenticate, getEnrollmentById);

// POST /api/enrollments/:enrollmentId/complete-lesson - Mark lesson as completed
router.post("/:enrollmentId/complete-lesson", authenticate, markLessonComplete);

// PATCH /api/enrollments/:enrollmentId/access - Update last accessed
router.patch("/:enrollmentId/access", authenticate, updateLastAccessed);

// GET /api/enrollments/admin/analytics - Admin enrollment analytics
router.get("/admin/analytics", authenticate, authorizeAdmin, getEnrollmentAnalytics);

// GET /api/enrollments/admin/course/:courseId - Admin get enrollments by course
router.get("/admin/course/:courseId", authenticate, authorizeAdmin, getEnrollmentsByCourse);

module.exports = router;
