/**
 * Standard API Response Utilities
 * 
 * Ensures all API endpoints return consistent, predictable JSON response structures.
 */

/**
 * Send a success response.
 */
function sendSuccess(res, message, data = null, statusCode = 200, meta = {}) {
  const response = {
    success: true,
    message,
    ...meta
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send an error response.
 */
function sendError(res, message, statusCode = 500, errors = null) {
  const response = {
    success: false,
    message
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  sendSuccess,
  sendError
};
