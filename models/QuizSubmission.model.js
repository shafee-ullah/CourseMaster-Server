const mongoose = require("mongoose");

/**
 * Quiz Submission Schema
 * Stores student's quiz attempts and scores
 */
const quizSubmissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    answers: [
      {
        questionIndex: {
          type: Number,
          required: true,
        },
        selectedIndex: {
          type: Number,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

quizSubmissionSchema.index({ student: 1, quiz: 1 }, { unique: true });

const QuizSubmission = mongoose.model("QuizSubmission", quizSubmissionSchema);

module.exports = QuizSubmission;


