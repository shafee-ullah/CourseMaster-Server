const Assignment = require("../models/Assignment.model");
const Course = require("../models/Course.model");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Submit an assignment
 * POST /api/assignments
 */
const submitAssignment = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { courseId, title, description, submissionLink } = req.body;

    if (!courseId || !submissionLink || !title) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Course ID, title, and submission link are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    const assignment = new Assignment({
      student: studentId,
      course: courseId,
      title,
      description,
      submissionLink,
    });

    await assignment.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Assignment submitted successfully",
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's assignments
 * GET /api/assignments/my
 */
const getMyAssignments = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const assignments = await Assignment.find({ student: studentId })
      .populate("course", "title category")
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: assignments,
      count: assignments.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all submitted assignments
 * GET /api/assignments/admin/all
 */
const getAllAssignmentsAdmin = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({})
      .populate("course", "title category")
      .populate("student", "displayName email")
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: assignments,
      count: assignments.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitAssignment,
  getMyAssignments,
  getAllAssignmentsAdmin,
};


