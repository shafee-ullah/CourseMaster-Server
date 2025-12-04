const Joi = require("joi");

/**
 * Validation Schemas using Joi
 * Centralized validation for all API inputs
 */

// Lesson schema for syllabus
const lessonSchema = Joi.object({
  lessonTitle: Joi.string().required().trim().max(200),
  lessonDescription: Joi.string().allow("").trim().max(1000),
  videoUrl: Joi.string().uri().allow("").trim(),
  duration: Joi.number().min(0).default(0),
  order: Joi.number().integer().min(0).required(),
});

// Batch schema for courses
const batchSchema = Joi.object({
  batchName: Joi.string().required().trim().max(100),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null),
  isActive: Joi.boolean().default(true),
});

// Course validation schema
const courseSchema = Joi.object({
  title: Joi.string().required().trim().max(200).messages({
    "string.empty": "Course title is required",
    "string.max": "Title cannot exceed 200 characters",
  }),
  description: Joi.string().required().trim().max(5000).messages({
    "string.empty": "Course description is required",
    "string.max": "Description cannot exceed 5000 characters",
  }),
  price: Joi.number().required().min(0).messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
    "any.required": "Course price is required",
  }),
  syllabus: Joi.array().items(lessonSchema).min(1).messages({
    "array.min": "Course must have at least one lesson",
  }),
  thumbnail: Joi.string().required().uri().trim().messages({
    "string.empty": "Course thumbnail is required",
    "string.uri": "Thumbnail must be a valid URL",
  }),
  category: Joi.string().required().trim().max(100).messages({
    "string.empty": "Course category is required",
  }),
  tags: Joi.array().items(Joi.string().trim()).default([]),
  status: Joi.string().valid("draft", "published", "archived").default("draft"),
  batches: Joi.array().items(batchSchema).default([]),
});

// Course update schema (all fields optional)
const courseUpdateSchema = Joi.object({
  title: Joi.string().trim().max(200),
  description: Joi.string().trim().max(5000),
  price: Joi.number().min(0),
  syllabus: Joi.array().items(lessonSchema),
  thumbnail: Joi.string().uri().trim(),
  category: Joi.string().trim().max(100),
  tags: Joi.array().items(Joi.string().trim()),
  status: Joi.string().valid("draft", "published", "archived"),
  batches: Joi.array().items(batchSchema),
}).min(1); // At least one field must be provided

// Assignment submission schema
const assignmentSubmitSchema = Joi.object({
  courseId: Joi.string().required().trim(),
  title: Joi.string().required().trim().max(200),
  description: Joi.string().allow("").trim().max(2000),
  submissionLink: Joi.string().uri().required().trim(),
});

// Quiz creation schema (basic)
const quizCreateSchema = Joi.object({
  courseId: Joi.string().required().trim(),
  title: Joi.string().required().trim().max(200),
  description: Joi.string().allow("").trim().max(1000),
  isPublished: Joi.boolean().default(false),
  questions: Joi.array()
    .items(
      Joi.object({
        questionText: Joi.string().required().trim(),
        options: Joi.array().items(Joi.string().trim()).min(2).required(),
        correctIndex: Joi.number().integer().min(0).required(),
      })
    )
    .min(1)
    .required(),
});

// Quiz update schema (all fields optional, at least one required)
const quizUpdateSchema = Joi.object({
  title: Joi.string().trim().max(200),
  description: Joi.string().allow("").trim().max(1000),
  isPublished: Joi.boolean(),
  questions: Joi.array().items(
    Joi.object({
      questionText: Joi.string().required().trim(),
      options: Joi.array().items(Joi.string().trim()).min(2).required(),
      correctIndex: Joi.number().integer().min(0).required(),
    })
  ),
}).min(1);

// Quiz submit schema
const quizSubmitSchema = Joi.object({
  answers: Joi.array().items(Joi.number().integer().min(0)).min(1).required(),
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false, // Return all errors, not just the first one
        stripUnknown: true, // Remove unknown fields
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }

      // Replace req.body with validated and sanitized value
      req.body = value;
      next();
    } catch (err) {
      console.error("Validation middleware error:", err);
      next(err);
    }
  };
};

module.exports = {
  courseSchema,
  courseUpdateSchema,
  assignmentSubmitSchema,
  quizCreateSchema,
  quizUpdateSchema,
  quizSubmitSchema,
  validate,
};
