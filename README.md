# CourseMaster Backend API

## Project Structure

```
Server-CM/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection configuration
│   └── cors.js          # CORS configuration
├── controllers/         # Request/Response logic (MVC Controllers)
├── middleware/          # Custom middleware
│   ├── errorHandler.middleware.js
│   └── notFound.middleware.js
├── models/              # Mongoose Schemas
├── routes/              # API Endpoints
├── services/            # Business logic (optional but preferred for heavy lifting)
├── utils/               # Helper functions
│   └── constants.js     # Application constants
├── index.js             # Entry point
└── package.json
```

## Architecture

This backend follows a **strict MVC (Model-View-Controller) pattern**:

- **Models**: Mongoose schemas defining data structure
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic layer (optional but preferred for complex operations)
- **Routes**: Define API endpoints and link them to controllers
- **Middleware**: Authentication, error handling, validation
- **Utils**: Reusable helper functions and constants

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```
   PORT=5000
   NODE_ENV=development
   DB_USER=your_mongodb_username
   DB_PASS=your_mongodb_password
   CLIENT_URL=http://localhost:5173
   ```

3. Start the server:
   ```bash
   node index.js
   ```

   Or with nodemon (auto-restart on changes):
   ```bash
   npx nodemon index.js
   ```

## API Endpoints

- `GET /` - Welcome message and API status

## Next Steps

- Implement authentication routes
- Create User model
- Set up course management endpoints

