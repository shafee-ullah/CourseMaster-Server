const Course = require("../models/Course.model");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Create a new course
 * POST /api/courses
 */
const createCourse = async (req, res, next) => {
  try {
    console.log("=== CREATE COURSE START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request user:", req.user ? "User exists" : "No user");
    console.log("Request headers:", {
      "x-firebase-uid": req.headers["x-firebase-uid"],
      "x-user-email": req.headers["x-user-email"],
    });

    // Check if user exists (for protected route)
    // For test endpoint, allow without user but find a user from DB
    let instructorId = null;
    if (req.user) {
      instructorId = req.user._id;
    } else if (req.body.instructor) {
      // Allow manual instructor ID for testing
      instructorId = req.body.instructor;
    } else {
      // Try to find a user by email if provided
      const User = require("../models/User.model");
      const email = req.headers["x-user-email"] || req.body.email;
      if (email) {
        const user = await User.findByEmail(email);
        if (user) {
          instructorId = user._id;
          console.log("Found user by email:", user.email);
        }
      }

      // If still no instructor, find any user from database (for testing)
      if (!instructorId) {
        const anyUser = await User.findOne();
        if (anyUser) {
          instructorId = anyUser._id;
          console.log(
            "Using first available user as instructor:",
            anyUser.email
          );
        } else {
          // If no users exist, return error
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message:
              "No users found in database. Please create a user first or provide an instructor ID.",
          });
        }
      }
    }

    // Instructor is set from authenticated user or provided
    const courseData = {
      ...req.body,
      instructor: instructorId,
    };

    console.log("Course data to save:", {
      title: courseData.title,
      price: courseData.price,
      category: courseData.category,
      syllabusLength: courseData.syllabus?.length,
      instructor: courseData.instructor,
    });

    const course = new Course(courseData);
    console.log("Course model created, attempting to save...");
    await course.save();
    console.log("Course saved successfully!");

    // Populate instructor details if instructor exists
    if (courseData.instructor) {
      await course.populate("instructor", "displayName email photoURL");
    }

    console.log("=== CREATE COURSE SUCCESS ===");
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("=== CREATE COURSE ERROR ===");
    console.error("Error creating course:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    if (error.errors) {
      console.error(
        "Mongoose validation errors:",
        JSON.stringify(error.errors, null, 2)
      );
    }
    console.error("===========================");

    next(error);
  }
};

/**
 * Get all courses with pagination, search, sorting, and filtering
 * GET /api/courses
 */
const getAllCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      minPrice = "",
      maxPrice = "",
      status = "published", // Default to published courses for public
    } = req.query;

    // Build query
    const query = {};

    // Search filter (title or description) - Using regex for flexible search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const courses = await Course.find(query)
      .populate("instructor", "displayName email photoURL")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(); // Use lean() for better performance

    // Get total count for pagination
    const total = await Course.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: courses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single course by ID
 * GET /api/courses/:id
 */
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate(
      "instructor",
      "displayName email photoURL"
    );

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      course,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid course ID",
      });
    }
    next(error);
  }
};

/**
 * Update a course
 * PUT /api/courses/:id
 */
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user is the instructor or admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      !req.user.isAdmin()
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "You don't have permission to update this course",
      });
    }

    // Update course
    Object.assign(course, req.body);
    await course.save();

    await course.populate("instructor", "displayName email photoURL");

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid course ID",
      });
    }
    next(error);
  }
};

/**
 * Delete a course
 * DELETE /api/courses/:id
 */
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user is the instructor or admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      !req.user.isAdmin()
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "You don't have permission to delete this course",
      });
    }

    await Course.findByIdAndDelete(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid course ID",
      });
    }
    next(error);
  }
};

/**
 * Get courses by instructor
 * GET /api/courses/instructor/:instructorId
 */
const getCoursesByInstructor = async (req, res, next) => {
  try {
    const { instructorId } = req.params;

    const courses = await Course.find({ instructor: instructorId })
      .populate("instructor", "displayName email photoURL")
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid instructor ID",
      });
    }
    next(error);
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByInstructor,
};
