/**
 * Invoice Routes (Table: invoicefile)
 * 
 * Maps HTTP endpoints to controllers and validation middlewares.
 * All inline invoice routes have been removed.
 */

const express = require('express');
const router = express.Router();

const invoiceController = require('../controllers/invoiceController');
const validateRequest = require('../middleware/validateRequest');
const { uploadInvoicePdf } = require('../middleware/uploadMiddleware');

const {
  createInvoiceValidator,
  updateInvoiceValidator,
  idParamValidator,
  listQueryValidator
} = require('../validators/invoiceValidator');

// 1. Dashboard counts
router.get('/counts', invoiceController.getDashboardCounts);

// 2. Upload Invoice PDF
router.post('/upload', uploadInvoicePdf, invoiceController.uploadInvoicePdf);

// 3. Invoice listing and manual creation
router.get('/failed', listQueryValidator, validateRequest, invoiceController.getFailedInvoices);
router.get('/', listQueryValidator, validateRequest, invoiceController.getInvoices);
router.post('/', createInvoiceValidator, validateRequest, invoiceController.createInvoice);

// 4. Single invoice detail, update, delete
router.get('/:id', idParamValidator, validateRequest, invoiceController.getInvoiceById);
router.put('/:id', updateInvoiceValidator, validateRequest, invoiceController.updateInvoice);
router.delete('/:id', idParamValidator, validateRequest, invoiceController.deleteInvoice);

module.exports = router;
