const mongoose = require("mongoose");

/**
 * Assignment Schema
 * Students submit assignment links for a course
 */
const assignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    submissionLink: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["submitted", "graded"],
      default: "submitted",
      index: true,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ student: 1, course: 1, status: 1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
