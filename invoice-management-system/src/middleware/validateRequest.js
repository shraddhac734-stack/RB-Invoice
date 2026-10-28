/**
 * Request Validation Middleware
 * 
 * Inspects express-validator results. If errors exist, returns a formatted
 * HTTP 400 Bad Request response with all validation issues.
 */

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return sendError(res, 'Validation failed', 400, formattedErrors);
  }
  next();
}

module.exports = validateRequest;
