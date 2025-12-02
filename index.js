const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');

const cors = require('cors');
const cookieParser = require('cookie-parser');

// --- Start Server ---
const PORT = process.env.PORT || 5000;


// Initialize the Express app
const app = express();

// --- Database Connection ---
const MONGODB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8puxff9.mongodb.net/?appName=Cluster0`;


mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB Atlas Connected Successfully!");
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        // Exit process with failure code if connection fails
        process.exit(1);
    });

// --- Global Middleware ---

// Enable CORS for client communication
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // Replace with your Next.js/React URL
    credentials: true, // Allow cookies to be sent
}));

// Body parser (for parsing application/json)
app.use(express.json());

// Cookie parser (for parsing cookies from requests, essential for JWT)
app.use(cookieParser());



// Basic Welcome Route
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to CourseMaster Backend API!",
        status: "Running",
        environment: process.env.NODE_ENV || 'development'
    });
});


// Catch-all for undefined routes (404 Not Found)
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the next middleware (our error handler)
});

// The actual Error Handling Middleware
app.use((err, req, res, next) => {
    // Determine the status code (default to 500 if none is set)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    res.json({
        message: err.message,
        // Include stack trace only in development environment for debugging
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});


app.listen(PORT, () => {
    console.log(`📡 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});