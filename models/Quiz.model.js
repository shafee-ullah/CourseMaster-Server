const mongoose = require("mongoose");

/**
 * Quiz Schema
 * Contains questions for a course
 */
const quizSchema = new mongoose.Schema(
  {
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
      maxlength: 1000,
    },
    questions: [
      {
        questionText: {
          type: String,
          required: true,
          trim: true,
        },
        options: [
          {
            type: String,
            required: true,
            trim: true,
          },
        ],
        correctIndex: {
          type: Number,
          required: true,
        },
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;


