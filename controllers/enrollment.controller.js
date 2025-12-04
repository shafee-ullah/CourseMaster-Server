const Enrollment = require("../models/Enrollment.model");
const Course = require("../models/Course.model");
const { HTTP_STATUS } = require("../utils/constants");
const mongoose = require("mongoose");

/**
 * Enroll in a course
 * POST /api/enrollments
 */
const enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user._id;

    if (!courseId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Course ID is required",
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findByStudentAndCourse(
      studentId,
      courseId
    );

    if (existingEnrollment) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // Create enrollment (simulate payment - in production, verify payment first)
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      status: "active",
    });

    await enrollment.save();

    // Increment enrolled count on course
    course.enrolledCount = (course.enrolledCount || 0) + 1;
    await course.save();

    // Populate course details
    await enrollment.populate({
      path: "course",
      populate: {
        path: "instructor",
        select: "displayName email photoURL",
      },
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Successfully enrolled in course",
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's enrolled courses (My Courses)
 * GET /api/enrollments/my-courses
 * Optimized to avoid performance bottlenecks
 */
const getMyCourses = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { status = "active" } = req.query;

    // Fetch enrollments with course and instructor populated
    const enrollments = await Enrollment.find({
      student: studentId,
      status: status,
    })
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "displayName email photoURL",
        },
      })
      .sort({ lastAccessed: -1 })
      .lean(); // Use lean() for better performance

    // Calculate progress for each enrollment
    // Guard against enrollments whose course was deleted (course may be null)
    const enrollmentsWithProgress = enrollments
      .filter((enrollment) => enrollment.course)
      .map((enrollment) => {
        const course = enrollment.course;
        const totalLessons = course.syllabus?.length || 0;
        const completedLessons = enrollment.completedLessons?.length || 0;
        const progress =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          ...enrollment,
          progress,
          totalLessons,
          completedLessonsCount: completedLessons,
        };
      });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: enrollmentsWithProgress,
      count: enrollmentsWithProgress.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single enrollment details
 * GET /api/enrollments/:enrollmentId
 */
const getEnrollmentById = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: studentId,
    })
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "displayName email photoURL",
        },
      })
      .lean();

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Calculate progress
    const course = enrollment.course;
    const totalLessons = course.syllabus?.length || 0;
    const completedLessons = enrollment.completedLessons?.length || 0;
    const progress =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      enrollment: {
        ...enrollment,
        progress,
        totalLessons,
        completedLessonsCount: completedLessons,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid enrollment ID",
      });
    }
    next(error);
  }
};

/**
 * Mark lesson as completed
 * POST /api/enrollments/:enrollmentId/complete-lesson
 */
const markLessonComplete = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { lessonIndex } = req.body;
    const studentId = req.user._id;

    if (lessonIndex === undefined || lessonIndex === null) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Lesson index is required",
      });
    }

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: studentId,
    }).populate("course");

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Check if lesson exists in course
    const course = enrollment.course;
    if (!course.syllabus || lessonIndex >= course.syllabus.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid lesson index",
      });
    }

    // Mark lesson as completed
    await enrollment.markLessonComplete(lessonIndex);

    // Calculate and update progress
    const totalLessons = course.syllabus.length;
    const completedLessons = enrollment.completedLessons.length;
    const progress = Math.round((completedLessons / totalLessons) * 100);

    enrollment.progress = progress;
    enrollment.lastAccessed = new Date();

    // Check if course is completed
    if (progress === 100 && enrollment.status === "active") {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Lesson marked as completed",
      enrollment: {
        progress,
        completedLessons: enrollment.completedLessons.length,
        totalLessons,
        status: enrollment.status,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid enrollment ID",
      });
    }
    next(error);
  }
};

/**
 * Update enrollment last accessed
 * PATCH /api/enrollments/:enrollmentId/access
 */
const updateLastAccessed = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: studentId,
    });

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    enrollment.lastAccessed = new Date();
    await enrollment.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Last accessed updated",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid enrollment ID",
      });
    }
    next(error);
  }
};

/**
 * Admin: Get enrollment analytics over time
 * GET /api/enrollments/admin/analytics
 * Optional query params: rangeDays (default 30)
 */
const getEnrollmentAnalytics = async (req, res, next) => {
  try {
    const rangeDays = parseInt(req.query.rangeDays, 10) || 30;
    const sinceDate = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: sinceDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ];

    const results = await Enrollment.aggregate(pipeline);

    const data = results.map((item) => {
      const { year, month, day } = item._id;
      // month is 1-based from Mongo, adjust for JS Date
      const dateObj = new Date(year, month - 1, day);
      const dateLabel = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
      return {
        date: dateLabel,
        count: item.count,
      };
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data,
      rangeDays,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all enrollments for a course
 * GET /api/enrollments/admin/course/:courseId
 */
const getEnrollmentsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const enrollments = await Enrollment.find({ course: courseId })
      .populate("student", "displayName email photoURL")
      .populate("course", "title category batches")
      .sort({ enrolledAt: -1 })
      .lean();

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = enrollments.map((enrollment) => {
      const course = enrollment.course;
      const totalLessons = course?.syllabus?.length || 0;
      const completedLessons = enrollment.completedLessons?.length || 0;
      const progress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      return {
        ...enrollment,
        progress,
        totalLessons,
        completedLessonsCount: completedLessons,
      };
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: enrollmentsWithProgress,
      count: enrollmentsWithProgress.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollInCourse,
  getMyCourses,
  getEnrollmentById,
  markLessonComplete,
  updateLastAccessed,
  getEnrollmentAnalytics,
  getEnrollmentsByCourse,
};
