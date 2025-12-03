/**
 * Global Error Handler Middleware
 * Centralized error handling for all routes
 * Express error handlers must have 4 parameters: (err, req, res, next)
 * This is the FINAL error handler - it should NEVER call next() after handling
 */
const errorHandler = (err, req, res, next) => {
  // If err is not provided, this middleware was called incorrectly
  // Error handlers should only be called when there's an error
  if (!err) {
    // If called without error, treat as regular middleware and pass through
    if (typeof next === "function") {
      return next();
    }
    // If next is not a function, something is seriously wrong
    console.error(
      "CRITICAL: Error handler called without error and next is not a function"
    );
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Internal server error: middleware chain broken",
      });
    }
    return;
  }

  // Determine the status code (default to 500 if none is set)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log error for debugging
  console.error("========== ERROR OCCURRED ==========");
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);
  if (err.stack) {
    console.error("Error stack:", err.stack);
  }
  if (err.errors) {
    console.error("Mongoose errors:", err.errors);
  }
  console.error("Request URL:", req.originalUrl);
  console.error("Request method:", req.method);
  console.error("====================================");

  // Don't send response if headers already sent
  if (res.headersSent) {
    console.error("WARNING: Headers already sent, cannot send error response");
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation error: " + errors.map((e) => e.message).join(", "),
      errors,
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Handle Mongoose cast errors (invalid ID)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path || "ID"}: ${err.value}`,
    });
  }

  // Handle Joi validation errors
  if (err.isJoi || (err.details && Array.isArray(err.details))) {
    const errors = (err.details || []).map((detail) => ({
      field: detail.path ? detail.path.join(".") : "unknown",
      message: detail.message || err.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.length > 0 ? errors : [{ message: err.message }],
    });
  }

  // Default error response - DO NOT CALL next() here
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    // Include stack trace and full error in development environment for debugging
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: {
        name: err.name,
        message: err.message,
      },
    }),
  });
};

module.exports = errorHandler;
