/**
 * CORS Configuration
 * Handles cross-origin requests from the frontend
 */
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173", // Vite default port
  credentials: true, // Allow cookies to be sent
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-firebase-uid", // Custom header for Firebase authentication
    "x-user-email", // Custom header for email authentication (fallback)
  ],
  exposedHeaders: ["x-firebase-uid"], // Expose custom header in response
};

module.exports = corsOptions;
