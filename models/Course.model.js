const mongoose = require("mongoose");

/**
 * Course Schema
 * Defines the structure for course documents
 */
const courseSchema = new mongoose.Schema(
  {
    // Course Title
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true, // Indexed for search
    },
    // Course Description
    description: {
      type: String,
      required: [true, "Course description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    // Course Price
    price: {
      type: Number,
      required: [true, "Course price is required"],
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    // Course Syllabus (Array of lesson objects)
    syllabus: [
      {
        lessonTitle: {
          type: String,
          required: true,
          trim: true,
        },
        lessonDescription: {
          type: String,
          trim: true,
        },
        videoUrl: {
          type: String,
          trim: true,
        },
        duration: {
          type: Number, // Duration in minutes
          default: 0,
        },
        order: {
          type: Number,
          required: true,
        },
      },
    ],
    // Course Thumbnail URL
    thumbnail: {
      type: String,
      required: [true, "Course thumbnail is required"],
      trim: true,
    },
    // Course Category
    category: {
      type: String,
      required: [true, "Course category is required"],
      trim: true,
      index: true, // Indexed for filtering
    },
    // Course Tags (Array of strings)
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // Instructor ID (Reference to User model)
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required"],
      index: true, // Indexed for search
    },
    // Course Status
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    // Total number of students enrolled
    enrolledCount: {
      type: Number,
      default: 0,
    },
    // Course rating (average)
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    // Number of ratings
    ratingCount: {
      type: Number,
      default: 0,
    },
    // Course Batches (Array of batch objects)
    batches: [
      {
        batchName: {
          type: String,
          required: true,
          trim: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Compound indexes for better query performance
courseSchema.index({ title: "text", description: "text" }); // Text search
courseSchema.index({ category: 1, status: 1 }); // Filter by category and status
courseSchema.index({ price: 1 }); // Sort by price
courseSchema.index({ instructor: 1, status: 1 }); // Instructor's courses

// Virtual for total course duration
courseSchema.virtual("totalDuration").get(function () {
  if (!Array.isArray(this.syllabus)) {
    return 0;
  }

  return this.syllabus.reduce(
    (total, lesson) => total + (lesson.duration || 0),
    0
  );
});

// Ensure virtuals are included in JSON output
courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

// Pre-save middleware to sort syllabus by order
courseSchema.pre("save", function () {
  if (this.isModified("syllabus") && Array.isArray(this.syllabus)) {
    this.syllabus.sort((a, b) => a.order - b.order);
  }
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
