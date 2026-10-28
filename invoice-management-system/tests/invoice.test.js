/**
 * Automated Test Suite for Invoice Management System
 * 
 * Tests the single-table schema with flattened vendor fields and JSON line_items
 * on an isolated test database (invoice_management_test_db).
 */

const request = require('supertest');
const app = require('../src/app');
const { sequelize, ensureDatabaseExists } = require('../src/config/database');
const { Invoice, FailedInvoice } = require('../src/models');
const invoiceFastApi = require('../src/helpers/invoiceFastApi');
const { mapFastApiResponseToInvoice } = invoiceFastApi;

jest.setTimeout(30000);

beforeAll(async () => {
  await ensureDatabaseExists();
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await sequelize.query('DROP TABLE IF EXISTS inline_invoices, invoicefile, invoices, failed_invoices');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Invoice Management API Integration Tests', () => {
  let createdInvoiceId;

  // 1. Create invoice with line_items and flattened vendor fields
  test('1. Should create an invoice with line_items array successfully', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .send({
        document_type: 'invoice',
        invoice_number: 'TEST-INV-1001',
        invoice_date: '2026-10-01',
        due_date: '2026-10-31',
        currency: 'USD',
        status: 'PAID',
        description: 'Office stationery and supplies',
        vendor_name: 'Alpha Supplies Ltd',
        vendor_address: '100 Market St',
        vendor_city: 'Mumbai',
        vendor_state: 'Maharashtra',
        vendor_zip: '400001',
        vendor_phone: '+91-22-12345678',
        customer_name: 'Retail Budget Solutions',
        subtotal: 4500.00,
        tax: 500.00,
        total: 5000.00,
        payment_method: 'Bank Transfer',
        payment_amount: 5000.00,
        payment_status: 'Completed',
        line_items: [
          {
            item_code: 'STAT-01',
            description: 'Printing Paper Reams',
            quantity: 5,
            unit: 'BOX',
            unit_price: 500.00,
            amount: 2500.00
          },
          {
            item_code: 'STAT-02',
            description: 'Ink Cartridges',
            quantity: 2,
            unit: 'PCS',
            unit_price: 1250.00,
            amount: 2500.00
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoice_number).toBe('TEST-INV-1001');
    expect(res.body.data.vendor_name).toBe('Alpha Supplies Ltd');
    expect(res.body.data.total).toBe(5000.00);
    expect(Array.isArray(res.body.data.line_items)).toBe(true);
    expect(res.body.data.line_items).toHaveLength(2);
    createdInvoiceId = res.body.data.id;
  });

  // 2. Fetch list of invoices
  test('2. Should fetch invoices list with summary counts and pagination', async () => {
    const res = await request(app).get('/api/invoices');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary.total_records).toBeGreaterThanOrEqual(1);
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 3. Get invoice by ID
  test('3. Should fetch an invoice record by ID', async () => {
    const res = await request(app).get(`/api/invoices/${createdInvoiceId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdInvoiceId);
    expect(res.body.data.invoice_number).toBe('TEST-INV-1001');
  });

  // 4. Return 404 for non-existent ID
  test('4. Should return 404 for non-existent invoice ID', async () => {
    const res = await request(app).get('/api/invoices/99999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  // 5. Update invoice
  test('5. Should update an invoice record', async () => {
    const res = await request(app)
      .put(`/api/invoices/${createdInvoiceId}`)
      .send({
        status: 'PAID',
        payment_status: 'Settled'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PAID');
    expect(res.body.data.payment_status).toBe('Settled');
  });

  // 6. Filter by document_type
  test('6. Should filter records by document_type', async () => {
    const res = await request(app).get('/api/invoices?document_type=invoice');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every(r => r.document_type === 'invoice')).toBe(true);
  });

  // 7. Search by vendor_name
  test('7. Should search records by vendor name keyword', async () => {
    const res = await request(app).get('/api/invoices?search=Alpha');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // 8. Dashboard counts
  test('8. Should return dashboard summary counts and financial metrics', async () => {
    const res = await request(app).get('/api/invoices/counts');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total_records');
    expect(res.body.data).toHaveProperty('document_types');
    expect(res.body.data).toHaveProperty('status_breakdown');
    expect(res.body.data).toHaveProperty('total_amount_sum');
  });

  // 9. PDF Upload
  test('9. Should upload a valid PDF and save invoice record', async () => {
    jest.spyOn(invoiceFastApi, 'uploadToFastApi').mockResolvedValueOnce({
      extracted: true,
      message: 'FastAPI extracted successfully',
      raw: { status: 'success' },
      mapped: {
        source_file: 'Hardware_Vendor_Invoice.pdf',
        pdf_path: '/uploads/invoices/Hardware_Vendor_Invoice.pdf',
        document_type: 'invoice',
        invoice_number: 'TEST-HW-001',
        total: 100
      }
    });

    const dummyPdf = Buffer.from('%PDF-1.4 test invoice content %%EOF');
    const res = await request(app)
      .post('/api/invoices/upload')
      .attach('file', dummyPdf, 'Hardware_Vendor_Invoice.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.record.source_file).toMatch(/\.pdf$/i);
    expect(res.body.data.record.pdf_path).toMatch(/\.pdf$/i);
  });

  // 10. Reject non-PDF upload
  test('10. Should reject non-PDF uploads with 400', async () => {
    const textFile = Buffer.from('plain text');
    const res = await request(app)
      .post('/api/invoices/upload')
      .attach('file', textFile, 'document.txt');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Only PDF files are allowed/i);
  });

  // 11. Delete invoice
  test('11. Should delete an invoice record', async () => {
    const res = await request(app).delete(`/api/invoices/${createdInvoiceId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Invoice.findByPk(createdInvoiceId);
    expect(check).toBeNull();
  });

  // 12. Test parsing of live FastAPI OCR response format
  test('12. Should correctly map FastAPI OCR extraction response matching mentor format', () => {
    const mentorApiResponse = {
      status: 'success',
      message: 'Retail invoices processed successfully',
      token_usage: {
        input_tokens: 10040,
        output_tokens: 10357,
        total_tokens: 20397
      },
      data: {
        invoices: [
          {
            source_file: 'RetailInvoice_12345_1792530748309KOTECHA_BL-SO97822_625.pdf',
            pdf_path: null,
            document_type: 'invoice',
            invoice_number: 'BL-SO97822',
            invoice_date: '2026-10-13',
            due_date: null,
            raw_date_text: '2026/10/13',
            currency: 'USD',
            status: 'DRAFT',
            description: null,
            vendor_name: 'KOTECHA BROTHERS LLC',
            vendor_address: '17425 SW 172ND STREET MIAMI FL 33187 United States',
            vendor_city: 'MIAMI',
            vendor_state: 'FL',
            vendor_zip: '33187',
            vendor_phone: '305-232-3299',
            customer_name: 'INDIA CO NAPERVILLE-ill (I-028)',
            subtotal: 0,
            tax: 0,
            total: 0,
            total_amount: 0,
            payment_method: 'Check',
            payment_amount: 625,
            payment_status: 'Paid',
            credit_no: null,
            credit_date: null,
            credit_amount: 0,
            line_items: [
              {
                item_code: null,
                description: 'GREEN COCONUT (USA)',
                quantity: 2,
                unit: 'lb(s)',
                unit_price: null,
                amount: 80
              }
            ],
            extraction_status: 'success',
            error_message: null,
            received_at: '2026-10-27 09:48:46',
            processing_seconds: 102.26,
            ollama_seconds: 101.88,
            input_tokens: 10040,
            output_tokens: 10357,
            page_count: 4
          }
        ]
      }
    };

    const mapped = mapFastApiResponseToInvoice(mentorApiResponse);
    expect(mapped).not.toBeNull();
    expect(mapped.vendor_name).toBe('KOTECHA BROTHERS LLC');
    expect(mapped.invoice_number).toBe('BL-SO97822');
    expect(mapped.currency).toBe('USD');
    expect(mapped.total).toBe(80);
    expect(mapped.payment_amount).toBe(625);
    expect(mapped.input_tokens).toBe(10040);
    expect(mapped.output_tokens).toBe(10357);
    expect(mapped.processing_seconds).toBe(102.26);
    expect(mapped.ollama_seconds).toBe(101.88);
    expect(mapped.page_count).toBe(4);
    expect(mapped.line_items).toHaveLength(1);
    expect(mapped.line_items[0].description).toBe('GREEN COCONUT (USA)');
    expect(mapped.line_items[0].item_code).toBeNull();
  });

  // 13. Failed upload should store in failed_invoices and return HTTP 504 without document
  test('13. Should record failed upload in failed_invoices and return 504 on extraction failure', async () => {
    jest.spyOn(invoiceFastApi, 'uploadToFastApi').mockRejectedValueOnce(
      Object.assign(new Error('External API request timed out after 180000ms'), { statusCode: 504 })
    );

    const dummyPdf = Buffer.from('%PDF-1.4 failed invoice content %%EOF');
    const res = await request(app)
      .post('/api/invoices/upload')
      .field('storeId', '5')
      .field('expenseId', '10')
      .attach('file', dummyPdf, 'Corrupted_Failed_Invoice.pdf');

    expect(res.status).toBe(504);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/timed out/i);
    expect(res.body.errors).toHaveProperty('failure_id');
    expect(res.body.errors.fileName).toBe('Corrupted_Failed_Invoice.pdf');
    expect(res.body.errors.errorCode).toBe('EXTRACTION_TIMEOUT_504');

    // Confirm that the failed invoice document was NOT returned in response
    expect(res.body).not.toHaveProperty('data');

    // Confirm record exists in failed_invoices table with collected user data
    const failureRecord = await FailedInvoice.findByPk(res.body.errors.failure_id);
    expect(failureRecord).not.toBeNull();
    expect(failureRecord.fileName).toBe('Corrupted_Failed_Invoice.pdf');
    expect(failureRecord.storeId).toBe(5);
    expect(failureRecord.expenseId).toBe(10);
    expect(failureRecord.httpStatusCode).toBe(504);

    // Confirm that invoicefile table was NOT polluted
    const invoiceFileRecord = await Invoice.findOne({ where: { fileName: 'Corrupted_Failed_Invoice.pdf' } });
    expect(invoiceFileRecord).toBeNull();
  });

  // 14. Should fetch paginated failed invoices list
  test('14. Should fetch paginated failed invoices list from /api/invoices/failed', async () => {
    const res = await request(app).get('/api/invoices/failed');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });
});

