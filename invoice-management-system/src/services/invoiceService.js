/**
 * Invoice Service (Table: invoicefile)
 * 
 * Handles business logic, database queries, calculations, and filtering
 * based on the 17-column `invoicefile` table structure with JSON stored in `invoiceJson`.
 */

const { Op } = require('sequelize');
const path = require('path');
const { InvoiceFile, FailedInvoice } = require('../models');

class InvoiceService {
  /**
   * Create a new invoicefile record with extracted invoiceJson payload.
   */
  async createInvoice(data) {
    const {
      source_file = '',
      pdf_path = null,
      fileName = null,
      normalizeFileName = null,
      fileUrl = null,
      folderPath = 'uploads/invoices',
      storeId = null,
      expenseId = null,
      overInvoice = 'false',
      totalInvoice = 1,
      skipInvoices = 'false',
      isVerified = '0',
      isQueue = 'false',

      // Invoice JSON fields
      document_type = 'invoice',
      invoice_number = null,
      invoice_date = null,
      due_date = null,
      raw_date_text = null,
      currency = 'USD',
      status = 'DRAFT',
      description = null,

      // Vendor details
      vendor_name = null,
      vendor_address = null,
      vendor_city = null,
      vendor_state = null,
      vendor_zip = null,
      vendor_phone = null,

      // Customer details
      customer_name = null,

      // Summary
      subtotal = 0.00,
      tax = 0.00,
      total = 0.00,
      total_amount = null,

      // Payment
      payment_method = null,
      payment_amount = 0.00,
      payment_status = null,

      // Credit memo
      credit_no = null,
      credit_date = null,
      credit_amount = 0.00,

      // Line items
      line_items = [],
      inline_details = null,

      // Metadata
      extraction_status = 'success',
      error_message = null,
      processing_seconds = null,
      ollama_seconds = null,
      input_tokens = null,
      output_tokens = null,
      page_count = 1,
      invoiceJson = null
    } = data;

    // Harmonize total / total_amount
    const finalTotal = parseFloat(total || total_amount || 0);

    // Harmonize line_items / inline_details
    let finalLineItems = line_items || inline_details || [];
    if (typeof finalLineItems === 'string') {
      try {
        finalLineItems = JSON.parse(finalLineItems);
      } catch {
        finalLineItems = [];
      }
    }
    if (!Array.isArray(finalLineItems)) {
      finalLineItems = [];
    }

    // Build the complete invoice JSON object (vendor, payment, header, line_items)
    let payloadObject = {};
    if (invoiceJson && typeof invoiceJson === 'object') {
      payloadObject = invoiceJson;
    } else if (typeof invoiceJson === 'string') {
      try {
        payloadObject = JSON.parse(invoiceJson);
      } catch {
        payloadObject = {};
      }
    } else {
      payloadObject = {
        document_type,
        invoice_number: invoice_number || null,
        invoice_date: invoice_date || null,
        due_date: due_date || null,
        raw_date_text: raw_date_text || null,
        currency: currency || 'USD',
        status: status || 'DRAFT',
        description: description || null,

        vendor_name: vendor_name || null,
        vendor_address: vendor_address || null,
        vendor_city: vendor_city || null,
        vendor_state: vendor_state || null,
        vendor_zip: vendor_zip || null,
        vendor_phone: vendor_phone || null,

        customer_name: customer_name || null,

        subtotal: parseFloat(subtotal || 0),
        tax: parseFloat(tax || 0),
        total: finalTotal,
        total_amount: finalTotal,

        payment_method: payment_method || null,
        payment_amount: parseFloat(payment_amount || 0),
        payment_status: payment_status || null,

        credit_no: credit_no || null,
        credit_date: credit_date || null,
        credit_amount: parseFloat(credit_amount || 0),

        line_items: finalLineItems,

        extraction_status,
        error_message: error_message || null,
        processing_seconds: processing_seconds ? parseFloat(processing_seconds) : null,
        ollama_seconds: ollama_seconds ? parseFloat(ollama_seconds) : null,
        input_tokens: input_tokens ? parseInt(input_tokens, 10) : null,
        output_tokens: output_tokens ? parseInt(output_tokens, 10) : null,
        page_count: page_count ? parseInt(page_count, 10) : 1
      };
    }

    const finalFileName = fileName || (source_file ? path.basename(source_file) : 'invoice.pdf');
    const finalNormalizeFileName = normalizeFileName || (pdf_path ? path.basename(pdf_path) : finalFileName);
    const finalFileUrl = fileUrl || pdf_path || `/uploads/invoices/${finalNormalizeFileName}`;
    const isAiIssue = extraction_status === 'failed' || Boolean(error_message);

    const record = await InvoiceFile.create({
      fileName: finalFileName,
      normalizeFileName: finalNormalizeFileName,
      fileUrl: finalFileUrl,
      invoiceJson: JSON.stringify(payloadObject),
      isVerified: isVerified || '0',
      storeId: storeId || null,
      expenseId: expenseId || null,
      overInvoice: overInvoice || 'false',
      totalInvoice: totalInvoice || 1,
      folderPath: folderPath || 'uploads/invoices',
      skipInvoices: skipInvoices || 'false',
      IsAiIssue: isAiIssue ? 'true' : 'false',
      AiIssueDes: error_message || null,
      isQueue: isQueue || 'false',
      createdAt: new Date(),
      lastModifiedDate: new Date()
    });

    return record.toFormattedResponse();
  }

  async getInvoices({
    page = 1,
    limit = 10,
    search,
    status,
    document_type,
    vendor_name,
    extraction_status,
    isVerified,
    isQueue
  }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    if (isVerified !== undefined && isVerified !== '') {
      where.isVerified = String(isVerified);
    }
    if (isQueue !== undefined && isQueue !== '') {
      where.isQueue = String(isQueue);
    }

    // Keyword search across filename, normalizeFileName, and invoiceJson
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { fileName: { [Op.like]: q } },
        { normalizeFileName: { [Op.like]: q } },
        { invoiceJson: { [Op.like]: q } }
      ];
    }

    if (vendor_name && vendor_name.trim() !== '') {
      where.invoiceJson = { [Op.like]: `%"vendor_name":%${vendor_name.trim()}%` };
    }

    if (status && status.trim() !== '') {
      where.invoiceJson = { [Op.like]: `%"status":"${status.trim()}"%` };
    }

    if (document_type && document_type.trim() !== '') {
      where.invoiceJson = { [Op.like]: `%"document_type":"${document_type.trim()}"%` };
    }

    if (extraction_status && extraction_status.trim() !== '') {
      where.IsAiIssue = extraction_status === 'failed' ? 'true' : 'false';
    }

    const totalRecords = await InvoiceFile.count({ where });

    const rows = await InvoiceFile.findAll({
      where,
      order: [['id', 'DESC']],
      limit: limitNum,
      offset
    });

    const formattedRows = rows.map(r => r.toFormattedResponse ? r.toFormattedResponse() : r);

    // Calculate financial summary and document type counts from formatted data
    let invoiceCount = 0;
    let creditMemoCount = 0;
    let totalAmountSum = 0;

    for (const item of formattedRows) {
      if (item.document_type === 'credit_memo') {
        creditMemoCount++;
      } else {
        invoiceCount++;
      }
      totalAmountSum += parseFloat(item.total || item.total_amount || 0);
    }

    return {
      summary: {
        total_records: totalRecords,
        invoice_count: invoiceCount,
        credit_memo_count: creditMemoCount,
        total_amount_sum: parseFloat(totalAmountSum.toFixed(2))
      },
      pagination: {
        current_page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(totalRecords / limitNum) || 1,
        total_records: totalRecords
      },
      data: formattedRows
    };
  }

  async getDashboardCounts() {
    const totalRecords = await InvoiceFile.count();
    const rows = await InvoiceFile.findAll({
      attributes: ['id', 'isVerified', 'IsAiIssue', 'isQueue', 'invoiceJson']
    });

    let invoiceCount = 0;
    let creditMemoCount = 0;
    let draftCount = 0;
    let pendingCount = 0;
    let paidCount = 0;
    let cancelledCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let totalAmountSum = 0;

    for (const r of rows) {
      const parsed = r.getParsedInvoice ? r.getParsedInvoice() : {};
      const docType = parsed.document_type || 'invoice';
      if (docType === 'credit_memo') {
        creditMemoCount++;
      } else {
        invoiceCount++;
      }

      const status = (parsed.status || 'DRAFT').toUpperCase();
      if (status === 'PAID') paidCount++;
      else if (status === 'PENDING') pendingCount++;
      else if (status === 'CANCELLED') cancelledCount++;
      else draftCount++;

      if (r.IsAiIssue === 'true' || parsed.extraction_status === 'failed') {
        failedCount++;
      } else {
        successCount++;
      }

      totalAmountSum += parseFloat(parsed.total || parsed.total_amount || 0);
    }

    return {
      total_records: totalRecords,
      document_types: {
        invoices: invoiceCount,
        credit_memos: creditMemoCount
      },
      status_breakdown: {
        draft: draftCount,
        pending: pendingCount,
        paid: paidCount,
        cancelled: cancelledCount
      },
      extraction_breakdown: {
        success: successCount,
        failed: failedCount
      },
      total_amount_sum: parseFloat(totalAmountSum.toFixed(2))
    };
  }

  async getInvoiceById(id) {
    const record = await InvoiceFile.findByPk(id);
    if (!record) {
      const error = new Error(`Invoice with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return record.toFormattedResponse ? record.toFormattedResponse() : record;
  }

  async updateInvoice(id, updateData) {
    const record = await InvoiceFile.findByPk(id);
    if (!record) {
      const error = new Error(`Invoice with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    const currentParsed = record.getParsedInvoice ? record.getParsedInvoice() : {};

    // Merge updated invoice fields into current parsed JSON
    const mergedInvoice = {
      ...currentParsed,
      ...updateData
    };

    if (updateData.total !== undefined && updateData.total_amount === undefined) {
      mergedInvoice.total_amount = updateData.total;
    } else if (updateData.total_amount !== undefined && updateData.total === undefined) {
      mergedInvoice.total = updateData.total_amount;
    }

    if (updateData.inline_details && !updateData.line_items) {
      mergedInvoice.line_items = updateData.inline_details;
    }

    // Direct table column updates
    const directUpdates = {
      lastModifiedDate: new Date()
    };
    if (updateData.fileName) directUpdates.fileName = updateData.fileName;
    if (updateData.normalizeFileName) directUpdates.normalizeFileName = updateData.normalizeFileName;
    if (updateData.fileUrl) directUpdates.fileUrl = updateData.fileUrl;
    if (updateData.folderPath) directUpdates.folderPath = updateData.folderPath;
    if (updateData.isVerified) directUpdates.isVerified = updateData.isVerified;
    if (updateData.storeId !== undefined) directUpdates.storeId = updateData.storeId;
    if (updateData.expenseId !== undefined) directUpdates.expenseId = updateData.expenseId;
    if (updateData.overInvoice) directUpdates.overInvoice = updateData.overInvoice;
    if (updateData.skipInvoices) directUpdates.skipInvoices = updateData.skipInvoices;
    if (updateData.IsAiIssue) directUpdates.IsAiIssue = updateData.IsAiIssue;
    if (updateData.AiIssueDes !== undefined) directUpdates.AiIssueDes = updateData.AiIssueDes;
    if (updateData.isQueue) directUpdates.isQueue = updateData.isQueue;

    directUpdates.invoiceJson = JSON.stringify(mergedInvoice);

    await record.update(directUpdates);
    return record.toFormattedResponse ? record.toFormattedResponse() : record;
  }

  async deleteInvoice(id) {
    const record = await InvoiceFile.findByPk(id);
    if (!record) {
      const error = new Error(`Invoice with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    await record.destroy();
    return { id: parseInt(id, 10) };
  }

  async recordFailedInvoice({ file, userPayload = {}, error = {}, rawFailedData = null }) {
    let serializedRaw = null;
    if (rawFailedData !== null && rawFailedData !== undefined) {
      if (typeof rawFailedData === 'string') {
        serializedRaw = rawFailedData;
      } else {
        try {
          serializedRaw = JSON.stringify(rawFailedData);
        } catch (e) {
          serializedRaw = String(rawFailedData);
        }
      }
    }

    const relativeUrl = file?.filename
      ? path.posix.join('/uploads', 'invoices', file.filename)
      : null;

    const statusCode = error.statusCode || 504;
    const errorCode = error.errorCode || error.code || (statusCode === 504 ? 'EXTRACTION_TIMEOUT_504' : 'EXTRACTION_FAILED_504');

    const failedRecord = await FailedInvoice.create({
      fileName: file?.originalname || userPayload.fileName || null,
      normalizeFileName: file?.filename || userPayload.normalizeFileName || null,
      fileUrl: relativeUrl || userPayload.fileUrl || null,
      filePath: file?.path || userPayload.filePath || null,
      fileSize: file?.size || null,
      folderPath: 'uploads/invoices',
      storeId: userPayload.storeId ? parseInt(userPayload.storeId, 10) : null,
      expenseId: userPayload.expenseId ? parseInt(userPayload.expenseId, 10) : null,
      userPayload: userPayload,
      rawFailedData: serializedRaw,
      errorMessage: error.message || 'Invoice extraction failed or returned invalid format',
      errorCode,
      httpStatusCode: statusCode,
      retryCount: 0
    });

    return failedRecord;
  }

  async getFailedInvoices({ page = 1, limit = 10, search = '' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (search && search.trim() !== '') {
      where[Op.or] = [
        { fileName: { [Op.like]: `%${search.trim()}%` } },
        { errorMessage: { [Op.like]: `%${search.trim()}%` } },
        { errorCode: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const { count, rows } = await FailedInvoice.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      },
      data: rows
    };
  }
}

module.exports = new InvoiceService();
