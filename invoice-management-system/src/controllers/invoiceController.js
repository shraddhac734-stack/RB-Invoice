/**
 * Invoice Controller
 * 
 * Handles HTTP requests for invoice records based on mentor's schema.
 */

const path = require('path');
const invoiceService = require('../services/invoiceService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const invoiceFastApi = require('../helpers/invoiceFastApi');

class InvoiceController {
  /**
   * POST /api/invoices
   * Create an invoice record manually
   */
  async createInvoice(req, res, next) {
    try {
      const result = await invoiceService.createInvoice(req.body);
      return sendSuccess(res, 'Invoice record created successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/invoices
   * Get paginated invoice list with filters and search
   */
  async getInvoices(req, res, next) {
    try {
      const {
        page,
        limit,
        search,
        status,
        document_type,
        vendor_name,
        extraction_status
      } = req.query;

      const { summary, pagination, data } = await invoiceService.getInvoices({
        page,
        limit,
        search,
        status,
        document_type,
        vendor_name,
        extraction_status
      });

      return sendSuccess(res, 'Invoices fetched successfully', data, 200, {
        summary,
        pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/invoices/counts
   * Get aggregated dashboard counts and financial totals
   */
  async getDashboardCounts(req, res, next) {
    try {
      const counts = await invoiceService.getDashboardCounts();
      return sendSuccess(res, 'Dashboard counts retrieved successfully', counts, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/invoices/:id
   * Get single invoice record by ID
   */
  async getInvoiceById(req, res, next) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      return sendSuccess(res, 'Invoice fetched successfully', invoice, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/invoices/:id
   * Update invoice record
   */
  async updateInvoice(req, res, next) {
    try {
      const updatedInvoice = await invoiceService.updateInvoice(req.params.id, req.body);
      return sendSuccess(res, 'Invoice updated successfully', updatedInvoice, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/invoices/:id
   * Delete invoice record
   */
  async deleteInvoice(req, res, next) {
    try {
      const result = await invoiceService.deleteInvoice(req.params.id);
      return sendSuccess(res, 'Invoice record deleted successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/invoices/upload
   * Upload an invoice PDF file, optionally forward to FastAPI, and save to invoices table.
   * If extraction fails or times out, stores the record in `failed_invoices` and returns HTTP 504.
   */
  async uploadInvoicePdf(req, res, next) {
    try {
      if (!req.file) {
        return sendError(res, 'Please upload a PDF file using multipart form-data (field name: "file" or "pdf")', 400);
      }

      const relativeUrl = path.posix.join('/uploads', 'invoices', req.file.filename);
      const filePath = req.file.path;

      // Forward to FastAPI if configured
      let fastApiResult = null;
      let extractionFailure = null;

      try {
        fastApiResult = await invoiceFastApi.uploadToFastApi(filePath, req.file.originalname);

        if (fastApiResult && fastApiResult.extracted === false) {
          extractionFailure = {
            message: fastApiResult.message || 'Invoice extraction returned an invalid or incomplete format',
            statusCode: 504,
            errorCode: 'EXTRACTION_FAILED_504',
            raw: fastApiResult.raw || fastApiResult
          };
        } else if (fastApiResult && fastApiResult.raw && (fastApiResult.raw.status === 'failed' || fastApiResult.raw.success === false)) {
          extractionFailure = {
            message: fastApiResult.raw.message || 'FastAPI extraction returned failure status',
            statusCode: 504,
            errorCode: 'EXTRACTION_FAILED_504',
            raw: fastApiResult.raw
          };
        }
      } catch (ocrErr) {
        console.warn(`[OCR Warning] FastAPI extraction failed: ${ocrErr.message}`);
        extractionFailure = {
          message: ocrErr.message || 'Invoice extraction failed or timed out',
          statusCode: ocrErr.statusCode || 504,
          errorCode: ocrErr.statusCode === 504 ? 'EXTRACTION_TIMEOUT_504' : 'EXTRACTION_FAILED_504',
          raw: ocrErr.remoteData || ocrErr.message
        };
      }

      // If extraction failed or timed out, isolate and store in failed_invoices table
      if (extractionFailure) {
        const failedRecord = await invoiceService.recordFailedInvoice({
          file: req.file,
          userPayload: req.body,
          error: {
            message: extractionFailure.message,
            statusCode: 504,
            errorCode: extractionFailure.errorCode
          },
          rawFailedData: extractionFailure.raw
        });

        return sendError(res, extractionFailure.message, 504, {
          failure_id: failedRecord.id,
          fileName: req.file.originalname,
          errorCode: extractionFailure.errorCode,
          reason: extractionFailure.message,
          failedAt: failedRecord.createdAt
        });
      }

      const mapped = fastApiResult?.mapped || {};

      // Create record in primary invoicefile table
      const createdRecord = await invoiceService.createInvoice({
        fileName: req.file.originalname,
        normalizeFileName: req.file.filename,
        fileUrl: relativeUrl,
        folderPath: 'uploads/invoices',
        source_file: mapped.source_file || req.file.originalname || filePath,
        pdf_path: relativeUrl,
        document_type: mapped.document_type || req.body.document_type || 'invoice',
        invoice_number: mapped.invoice_number || req.body.invoice_number || null,
        invoice_date: mapped.invoice_date || req.body.invoice_date || null,
        due_date: mapped.due_date || req.body.due_date || null,
        raw_date_text: mapped.raw_date_text || null,
        currency: mapped.currency || req.body.currency || 'USD',
        status: mapped.status || req.body.status || 'DRAFT',
        description: mapped.description || req.body.description || null,

        vendor_name: mapped.vendor_name || req.body.vendor_name || null,
        vendor_address: mapped.vendor_address || req.body.vendor_address || null,
        vendor_city: mapped.vendor_city || req.body.vendor_city || null,
        vendor_state: mapped.vendor_state || req.body.vendor_state || null,
        vendor_zip: mapped.vendor_zip || req.body.vendor_zip || null,
        vendor_phone: mapped.vendor_phone || req.body.vendor_phone || null,

        customer_name: mapped.customer_name || req.body.customer_name || null,

        subtotal: mapped.subtotal !== undefined ? mapped.subtotal : (req.body.subtotal || 0.00),
        tax: mapped.tax !== undefined ? mapped.tax : (req.body.tax || 0.00),
        total: mapped.total !== undefined ? mapped.total : (req.body.total || req.body.total_amount || 0.00),

        payment_method: mapped.payment_method || req.body.payment_method || null,
        payment_amount: mapped.payment_amount !== undefined ? mapped.payment_amount : (req.body.payment_amount || 0.00),
        payment_status: mapped.payment_status || req.body.payment_status || null,

        credit_no: mapped.credit_no || req.body.credit_no || null,
        credit_date: mapped.credit_date || req.body.credit_date || null,
        credit_amount: mapped.credit_amount !== undefined ? mapped.credit_amount : (req.body.credit_amount || 0.00),

        line_items: mapped.line_items || mapped.inline_details || [],

        extraction_status: 'success',
        error_message: null,
        processing_seconds: mapped.processing_seconds || fastApiResult?.processing_seconds || null,
        ollama_seconds: mapped.ollama_seconds || fastApiResult?.ollama_seconds || null,
        input_tokens: mapped.input_tokens || fastApiResult?.input_tokens || null,
        output_tokens: mapped.output_tokens || fastApiResult?.output_tokens || null,
        page_count: mapped.page_count || fastApiResult?.page_count || 1
      });

      return sendSuccess(res, 'Invoice PDF uploaded and record saved successfully', {
        record: createdRecord,
        fastapi_extraction: fastApiResult
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/invoices/failed
   * Get paginated list of failed invoice upload attempts
   */
  async getFailedInvoices(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const result = await invoiceService.getFailedInvoices({ page, limit, search });
      return sendSuccess(res, 'Failed invoices fetched successfully', result.data, 200, {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InvoiceController();
