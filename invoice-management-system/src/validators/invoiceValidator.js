/**
 * Request Validators (Table: invoices)
 * 
 * Defines validation rules matching mentor's schema with flattened vendor fields
 * and JSON line_items.
 */

const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating an invoice / credit memo
 */
const createInvoiceValidator = [
  body('invoice_number')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Invoice number cannot exceed 100 characters'),

  body('vendor_name')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Vendor name cannot exceed 255 characters'),

  body('document_type')
    .optional()
    .isIn(['invoice', 'credit_memo', 'unknown'])
    .withMessage("document_type must be one of: 'invoice', 'credit_memo', 'unknown'"),

  body('invoice_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Invoice date must be a valid date in YYYY-MM-DD format'),

  body('due_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Due date must be a valid date in YYYY-MM-DD format'),

  body('total')
    .optional()
    .isFloat({ min: 0 }).withMessage('Total must be a positive number'),

  body('total_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),

  body('subtotal')
    .optional()
    .isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),

  body('tax')
    .optional()
    .isFloat({ min: 0 }).withMessage('Tax must be a positive number'),

  body('currency')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 }).withMessage('Currency must be between 1 and 10 characters'),

  body('status')
    .optional()
    .isIn(['DRAFT', 'PENDING', 'PAID', 'CANCELLED'])
    .withMessage('Status must be one of: DRAFT, PENDING, PAID, CANCELLED'),

  body('line_items')
    .optional()
    .custom((val) => {
      if (typeof val === 'string') {
        try { JSON.parse(val); return true; } catch { throw new Error('line_items must be a valid JSON array'); }
      }
      if (Array.isArray(val)) return true;
      throw new Error('line_items must be an array of objects');
    }),

  body('inline_details')
    .optional()
    .custom((val) => {
      if (typeof val === 'string') {
        try { JSON.parse(val); return true; } catch { throw new Error('inline_details must be a valid JSON array'); }
      }
      if (Array.isArray(val)) return true;
      throw new Error('inline_details must be an array of objects');
    })
];

/**
 * Validation rules for updating an invoice
 */
const updateInvoiceValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a valid positive integer'),

  ...createInvoiceValidator
];

/**
 * Validation rule for ID parameter
 */
const idParamValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a valid positive integer')
];

/**
 * Validation rules for list query parameters
 */
const listQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),

  query('search')
    .optional()
    .isString().withMessage('search must be a string'),

  query('status')
    .optional()
    .isIn(['DRAFT', 'PENDING', 'PAID', 'CANCELLED'])
    .withMessage('status must be one of: DRAFT, PENDING, PAID, CANCELLED'),

  query('document_type')
    .optional()
    .isIn(['invoice', 'credit_memo', 'unknown'])
    .withMessage("document_type must be one of: 'invoice', 'credit_memo', 'unknown'"),

  query('extraction_status')
    .optional()
    .isIn(['success', 'failed'])
    .withMessage("extraction_status must be 'success' or 'failed'")
];

module.exports = {
  createInvoiceValidator,
  updateInvoiceValidator,
  idParamValidator,
  listQueryValidator
};
