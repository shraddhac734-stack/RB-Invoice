/**
 * Swagger API Documentation Specification
 * 
 * OpenAPI 3.0 configuration reflecting the single-table invoice schema
 * with flattened vendor fields and line_items JSON array.
 */

const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Invoice & Credit Memo Management API',
    version: '3.0.0',
    description: 'RESTful API for managing invoices and credit memos with OCR extraction and JSON line items.',
    contact: {
      name: 'Backend Engineering Team'
    }
  },
  servers: [
    {
      url: '/',
      description: 'Current Host (Auto-adapts to ngrok, public URL, or localhost)'
    }
  ],
  tags: [
    {
      name: 'Invoices',
      description: 'Invoice and credit memo operations, listing, and summary counts'
    },
    {
      name: 'Uploads',
      description: 'PDF upload and OCR extraction'
    },
    {
      name: 'System',
      description: 'Health and diagnostics'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Server health check',
        responses: {
          200: {
            description: 'Server is healthy'
          }
        }
      }
    },
    '/api/invoices/counts': {
      get: {
        tags: ['Invoices'],
        summary: 'Get dashboard summary counts',
        description: 'Returns totals by document type (invoices, credit memos), status, and financial volume.',
        responses: {
          200: {
            description: 'Dashboard counts summary'
          }
        }
      }
    },
    '/api/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'Get paginated invoices & credit memos',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'PENDING', 'PAID', 'CANCELLED'] } },
          { name: 'document_type', in: 'query', schema: { type: 'string', enum: ['invoice', 'credit_memo', 'unknown'] } },
          { name: 'extraction_status', in: 'query', schema: { type: 'string', enum: ['success', 'failed'] } }
        ],
        responses: {
          200: {
            description: 'Invoices list'
          }
        }
      },
      post: {
        tags: ['Invoices'],
        summary: 'Create invoice / credit memo manually',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateInvoiceInput'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Invoice created successfully'
          },
          400: {
            description: 'Validation failed'
          }
        }
      }
    },
    '/api/invoices/{id}': {
      get: {
        tags: ['Invoices'],
        summary: 'Get invoice by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Invoice details' },
          404: { description: 'Invoice not found' }
        }
      },
      put: {
        tags: ['Invoices'],
        summary: 'Update invoice record',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateInvoiceInput'
              }
            }
          }
        },
        responses: {
          200: { description: 'Invoice updated successfully' },
          404: { description: 'Invoice not found' }
        }
      },
      delete: {
        tags: ['Invoices'],
        summary: 'Delete invoice record',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Invoice deleted successfully' },
          404: { description: 'Invoice not found' }
        }
      }
    },
    '/api/invoices/upload': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload invoice PDF',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'PDF invoice file'
                  }
                },
                required: ['file']
              }
            }
          }
        },
        responses: {
          201: { description: 'PDF uploaded and saved to invoices table' },
          400: { description: 'Invalid file format or missing file' }
        }
      }
    }
  },
  components: {
    schemas: {
      LineItem: {
        type: 'object',
        properties: {
          item_code: { type: 'string', example: 'MON-24' },
          description: { type: 'string', example: 'Dell 24-inch IPS Monitor' },
          quantity: { type: 'number', example: 2 },
          unit: { type: 'string', example: 'PCS' },
          unit_price: { type: 'number', example: 5000.00 },
          amount: { type: 'number', example: 10000.00 }
        }
      },
      CreateInvoiceInput: {
        type: 'object',
        properties: {
          document_type: { type: 'string', enum: ['invoice', 'credit_memo', 'unknown'], default: 'invoice' },
          invoice_number: { type: 'string', example: 'INV-2026-001' },
          invoice_date: { type: 'string', format: 'date', example: '2026-10-01' },
          due_date: { type: 'string', format: 'date', example: '2026-10-31' },
          currency: { type: 'string', example: 'USD', default: 'USD' },
          status: { type: 'string', enum: ['DRAFT', 'PENDING', 'PAID', 'CANCELLED'], default: 'DRAFT' },
          description: { type: 'string', example: 'IT hardware purchase' },
          vendor_name: { type: 'string', example: 'Acme Corporation' },
          vendor_address: { type: 'string', example: '123 Tech Park' },
          vendor_city: { type: 'string', example: 'Bangalore' },
          vendor_state: { type: 'string', example: 'Karnataka' },
          vendor_zip: { type: 'string', example: '560100' },
          vendor_phone: { type: 'string', example: '+91-80-12345678' },
          customer_name: { type: 'string', example: 'Retail Budget Solutions' },
          subtotal: { type: 'number', example: 13500.00 },
          tax: { type: 'number', example: 1500.00 },
          total: { type: 'number', example: 15000.00 },
          payment_method: { type: 'string', example: 'Bank Transfer' },
          payment_amount: { type: 'number', example: 15000.00 },
          payment_status: { type: 'string', example: 'Completed' },
          credit_no: { type: 'string', example: null },
          credit_date: { type: 'string', format: 'date', example: null },
          credit_amount: { type: 'number', example: 0.00 },
          line_items: {
            type: 'array',
            items: { $ref: '#/components/schemas/LineItem' }
          }
        }
      }
    }
  }
};

function setupSwagger(app) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'Invoice Management API Docs'
    })
  );
}

module.exports = {
  setupSwagger,
  swaggerDocument
};
