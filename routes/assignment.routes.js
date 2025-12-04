const express = require("express");
const router = express.Router();
const {
  submitAssignment,
  getMyAssignments,
  getAllAssignmentsAdmin,
} = require("../controllers/assignment.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");
const { validate, assignmentSubmitSchema } = require("../utils/validation");

/**
 * Assignment Routes
 * Student-facing for Phase 7
 */

// Submit assignment
router.post("/", authenticate, validate(assignmentSubmitSchema), submitAssignment);

// Get my assignments
router.get("/my", authenticate, getMyAssignments);

// Admin: get all submitted assignments
router.get("/admin/all", authenticate, authorizeAdmin, getAllAssignmentsAdmin);

module.exports = router;


