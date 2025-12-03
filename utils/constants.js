/**
 * Application Constants
 * Centralized constants for the application
 */

// User Roles
const USER_ROLES = {
    STUDENT: 'student',
    ADMIN: 'admin',
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};

module.exports = {
    USER_ROLES,
    HTTP_STATUS,
};

