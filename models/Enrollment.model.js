const mongoose = require("mongoose");

/**
 * Enrollment Schema
 * Links User, Course, and tracks progress
 */
const enrollmentSchema = new mongoose.Schema(
  {
    // Student reference
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
      index: true,
    },
    // Course reference
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
      index: true,
    },
    // Enrollment date
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    // Progress tracking - array of completed lessons
    completedLessons: [
      {
        lessonIndex: {
          type: Number,
          required: true,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Overall progress percentage (0-100)
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Enrollment status
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
      index: true,
    },
    // Last accessed date
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    // Completion date (if course is completed)
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Compound indexes for better query performance
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true }); // Prevent duplicate enrollments
enrollmentSchema.index({ student: 1, status: 1 }); // Get student's active courses
enrollmentSchema.index({ course: 1, status: 1 }); // Get course enrollments

// Pre-save middleware to calculate progress (placeholder)
enrollmentSchema.pre("save", function () {
  // Progress calculation can be added here if needed
});

// Instance method to mark lesson as completed
enrollmentSchema.methods.markLessonComplete = function (lessonIndex) {
  // Check if already completed
  const alreadyCompleted = this.completedLessons.some(
    (lesson) => lesson.lessonIndex === lessonIndex
  );

  if (!alreadyCompleted) {
    this.completedLessons.push({
      lessonIndex,
      completedAt: new Date(),
    });
  }

  return this.save();
};

// Instance method to check if lesson is completed
enrollmentSchema.methods.isLessonCompleted = function (lessonIndex) {
  return this.completedLessons.some(
    (lesson) => lesson.lessonIndex === lessonIndex
  );
};

// Static method to find enrollment by student and course
enrollmentSchema.statics.findByStudentAndCourse = function (
  studentId,
  courseId
) {
  return this.findOne({ student: studentId, course: courseId });
};

// Static method to get all enrollments for a student
enrollmentSchema.statics.findByStudent = function (studentId, status = null) {
  const query = { student: studentId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate("course").sort({ enrolledAt: -1 });
};

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;
