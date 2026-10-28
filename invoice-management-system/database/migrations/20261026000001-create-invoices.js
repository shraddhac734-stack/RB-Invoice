'use strict';

/**
 * Migration: Create invoices table with flattened vendor fields and JSON line_items
 * based on mentor's schema specification.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Drop old tables if they exist
    await queryInterface.dropTable('inline_invoices').catch(() => {});
    await queryInterface.dropTable('invoices').catch(() => {});
    await queryInterface.dropTable('invoicefile').catch(() => {});

    // 2. Create invoices table
    await queryInterface.createTable('invoices', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Document details
      source_file: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: ''
      },
      pdf_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      document_type: {
        type: Sequelize.ENUM('invoice', 'credit_memo', 'unknown'),
        allowNull: false,
        defaultValue: 'invoice'
      },
      invoice_number: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      raw_date_text: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'PENDING', 'PAID', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'DRAFT'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // Vendor details (flattened with generous sizing)
      vendor_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      vendor_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vendor_city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      vendor_state: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      vendor_zip: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      vendor_phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },

      // Customer details
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },

      // Financial summary
      subtotal: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      tax: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      total: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      total_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00
      },

      // Payment details
      payment_method: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      payment_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      payment_status: {
        type: Sequelize.STRING(50),
        allowNull: true
      },

      // Credit memo fields
      credit_no: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      credit_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      credit_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: 0.00
      },

      // Line items (inline details) stored as JSON array
      line_items: {
        type: Sequelize.JSON,
        allowNull: false
      },

      // Extraction metadata
      extraction_status: {
        type: Sequelize.ENUM('success', 'failed'),
        allowNull: false,
        defaultValue: 'success'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      received_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      processing_seconds: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      ollama_seconds: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      input_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      output_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      page_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for fast querying
    await queryInterface.addIndex('invoices', ['vendor_name'], { name: 'idx_invoices_vendor_name' });
    await queryInterface.addIndex('invoices', ['invoice_number'], { name: 'idx_invoices_invoice_number' });
    await queryInterface.addIndex('invoices', ['invoice_date'], { name: 'idx_invoices_invoice_date' });
    await queryInterface.addIndex('invoices', ['source_file'], { name: 'idx_invoices_source_file' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('invoices');
  }
};
