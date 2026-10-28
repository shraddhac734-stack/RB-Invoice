/**
 * Centralized Error Handling Middleware
 * 
 * Intercepts errors across the application and formats them into
 * uniform, user-friendly JSON responses without exposing internal DB or system internals.
 */

const { MulterError } = require('multer');

function errorHandler(err, req, res, next) {
  // If headers have already been sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Handle Multer file upload errors
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the allowed limit (maximum 10MB)'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  // 2. Handle Custom Multer / file validation errors
  if (err.message && err.message.includes('Only PDF files are allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // 3. Handle Sequelize Unique Constraint Errors (e.g. duplicate invoice_number)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'Record';
    return res.status(409).json({
      success: false,
      message: `Duplicate entry detected: ${field} already exists`
    });
  }

  // 4. Handle Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    const errorDetails = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Database validation failed',
      errors: errorDetails
    });
  }

  // 5. Handle Sequelize Foreign Key Constraint Errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(404).json({
      success: false,
      message: 'Referenced parent record does not exist'
    });
  }

  // 6. Handle Known Application Errors with custom status code
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  // In production, mask raw 500 errors
  const isProduction = process.env.NODE_ENV === 'production';
  const responseMessage = (statusCode === 500 && isProduction)
    ? 'An unexpected error occurred. Please try again later.'
    : message;

  return res.status(statusCode).json({
    success: false,
    message: responseMessage
  });
}

module.exports = errorHandler;
