require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Import configurations and middleware
const connectDB = require("./config/database");
const corsOptions = require("./config/cors");
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/errorHandler.middleware");

// Initialize the Express app
const app = express();

// --- Database Connection ---
connectDB();

// --- Global Middleware ---

// Enable CORS for client communication
app.use(cors(corsOptions));

// Body parser (for parsing application/json)
app.use(express.json());

// Cookie parser (for parsing cookies from requests, essential for JWT)
app.use(cookieParser());

// --- Routes ---

// Basic Welcome Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to CourseMaster Backend API!",
    status: "Running",
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/courses", require("./routes/course.routes"));
app.use("/api/enrollments", require("./routes/enrollment.routes"));
app.use("/api/assignments", require("./routes/assignment.routes"));
app.use("/api/quizzes", require("./routes/quiz.routes"));

// --- Error Handling Middleware ---

// Catch-all for undefined routes (404 Not Found)
app.use(notFound);

// Global Error Handler (must be last)
// Express recognizes error handlers by having exactly 4 parameters
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `📡 Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
