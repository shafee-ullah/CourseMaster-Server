/**
 * 404 Not Found Middleware
 * Handles undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);

  // Ensure next is a function before calling it
  if (typeof next === "function") {
    next(error); // Pass the error to the next middleware (error handler)
  } else {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = notFound;
