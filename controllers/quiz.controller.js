const Quiz = require("../models/Quiz.model");
const QuizSubmission = require("../models/QuizSubmission.model");
const Course = require("../models/Course.model");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Create a quiz for a course (Admin only - can be expanded in Phase 8)
 * POST /api/quizzes
 */
const createQuiz = async (req, res, next) => {
  try {
    const { courseId, title, description, questions, isPublished } = req.body;

    if (
      !courseId ||
      !title ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Course ID, title, and at least one question are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    const quiz = new Quiz({
      course: courseId,
      title,
      description,
      questions,
      isPublished: !!isPublished,
    });

    await quiz.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Quiz created successfully",
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quizzes for a course
 * GET /api/quizzes/course/:courseId
 * - Students: only published quizzes
 * - Admins: all quizzes for the course
 */
const getQuizzesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const filter = {
      course: courseId,
    };

    // Only students/regular users should be restricted to published quizzes.
    // Admins can see all quizzes (draft + published).
    if (!req.user || req.user.role !== "admin") {
      filter.isPublished = true;
    }

    const quizzes = await Quiz.find(filter).sort({
      createdAt: -1,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: quizzes,
      count: quizzes.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit quiz answers (auto-graded)
 * POST /api/quizzes/:quizId/submit
 */
const submitQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // array of selected indices
    const studentId = req.user._id;

    if (!Array.isArray(answers)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Answers array is required",
      });
    }

    const quiz = await Quiz.findById(quizId).populate("course");
    if (!quiz) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const totalQuestions = quiz.questions.length;
    if (answers.length !== totalQuestions) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Answers length does not match number of questions",
      });
    }

    let correctAnswers = 0;
    const answersDetail = quiz.questions.map((q, index) => {
      const selectedIndex = answers[index];
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) correctAnswers += 1;
      return {
        questionIndex: index,
        selectedIndex,
        isCorrect,
      };
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    const submissionData = {
      student: studentId,
      quiz: quiz._id,
      course: quiz.course._id,
      score,
      totalQuestions,
      correctAnswers,
      answers: answersDetail,
    };

    const submission = await QuizSubmission.findOneAndUpdate(
      { student: studentId, quiz: quizId },
      submissionData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Quiz submitted successfully",
      result: {
        score,
        totalQuestions,
        correctAnswers,
        answers: answersDetail,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's quiz results
 * GET /api/quizzes/my-results
 */
const getMyQuizResults = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const submissions = await QuizSubmission.find({ student: studentId })
      .populate("quiz", "title description")
      .populate("course", "title category")
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: submissions,
      count: submissions.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single quiz by ID
 * GET /api/quizzes/:quizId
 * - Students: only published quizzes
 * - Admins: can fetch any quiz
 */
const getQuizById = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Only allow unpublished quizzes for admins
    if (!quiz.isPublished && (!req.user || req.user.role !== "admin")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Quiz not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a quiz (Admin only)
 * PUT /api/quizzes/:quizId
 */
const updateQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByIdAndUpdate(quizId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!quiz) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Quiz not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a quiz (Admin only)
 * DELETE /api/quizzes/:quizId
 */
const deleteQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByIdAndDelete(quizId);

    if (!quiz) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Quiz not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getQuizzesByCourse,
  submitQuiz,
  getMyQuizResults,
  getQuizById,
  updateQuiz,
  deleteQuiz,
};
