const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzesByCourse,
  submitQuiz,
  getMyQuizResults,
  getQuizById,
  updateQuiz,
  deleteQuiz,
} = require("../controllers/quiz.controller");
const {
  authenticate,
  authorizeAdmin,
} = require("../middleware/auth.middleware");
const {
  validate,
  quizCreateSchema,
  quizUpdateSchema,
  quizSubmitSchema,
} = require("../utils/validation");

/**
 * Quiz Routes
 * Student + Admin for Phase 7
 */

// Admin: create quiz for a course
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  validate(quizCreateSchema),
  createQuiz
);

// Student: get quizzes for a course (published only)
router.get("/course/:courseId", authenticate, getQuizzesByCourse);

// Student: get single quiz by ID
router.get("/:quizId", authenticate, getQuizById);

// Admin: update quiz
router.put(
  "/:quizId",
  authenticate,
  authorizeAdmin,
  validate(quizUpdateSchema),
  updateQuiz
);

// Admin: delete quiz
router.delete("/:quizId", authenticate, authorizeAdmin, deleteQuiz);

// Student: submit quiz answers
router.post(
  "/:quizId/submit",
  authenticate,
  validate(quizSubmitSchema),
  submitQuiz
);

// Student: get my quiz results
router.get("/my/results", authenticate, getMyQuizResults);

module.exports = router;
