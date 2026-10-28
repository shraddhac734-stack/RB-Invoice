'use strict';

/**
 * Migration: Create invoicefile table based on the specification
 * 
 * Defines strictly the 17 columns from the table structure:
 * id, fileName, normalizeFileName, fileUrl, invoiceJson, isVerified,
 * storeId, expenseId, overInvoice, createdAt, lastModifiedDate, totalInvoice,
 * folderPath, skipInvoices, IsAiIssue, AiIssueDes, isQueue.
 * 
 * Also safely migrates any existing records from `invoices` into `invoicefile`.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create table invoicefile
    await queryInterface.createTable('invoicefile', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      fileName: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      normalizeFileName: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      fileUrl: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      invoiceJson: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isVerified: {
        type: Sequelize.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '0'
      },
      storeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      expenseId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      overInvoice: {
        type: Sequelize.ENUM('false', 'true'),
        allowNull: false,
        defaultValue: 'false'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      lastModifiedDate: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      totalInvoice: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
      },
      folderPath: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: 'uploads/invoices'
      },
      skipInvoices: {
        type: Sequelize.ENUM('true', 'false'),
        allowNull: false,
        defaultValue: 'false'
      },
      IsAiIssue: {
        type: Sequelize.ENUM('true', 'false'),
        allowNull: false,
        defaultValue: 'false'
      },
      AiIssueDes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isQueue: {
        type: Sequelize.ENUM('false', 'true'),
        allowNull: false,
        defaultValue: 'false'
      }
    });

    // 2. If legacy `invoices` table exists, migrate data into `invoicefile`
    try {
      const [existingInvoices] = await queryInterface.sequelize.query(
        "SELECT * FROM invoices"
      );

      if (Array.isArray(existingInvoices) && existingInvoices.length > 0) {
        console.log(`[Migration] Migrating ${existingInvoices.length} records from 'invoices' to 'invoicefile'...`);
        
        for (const inv of existingInvoices) {
          const invoiceData = {
            document_type: inv.document_type || 'invoice',
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            due_date: inv.due_date,
            raw_date_text: inv.raw_date_text,
            currency: inv.currency || 'USD',
            status: inv.status || 'DRAFT',
            description: inv.description,
            vendor_name: inv.vendor_name,
            vendor_address: inv.vendor_address,
            vendor_city: inv.vendor_city,
            vendor_state: inv.vendor_state,
            vendor_zip: inv.vendor_zip,
            vendor_phone: inv.vendor_phone,
            customer_name: inv.customer_name,
            subtotal: inv.subtotal,
            tax: inv.tax,
            total: inv.total,
            total_amount: inv.total_amount,
            payment_method: inv.payment_method,
            payment_amount: inv.payment_amount,
            payment_status: inv.payment_status,
            credit_no: inv.credit_no,
            credit_date: inv.credit_date,
            credit_amount: inv.credit_amount,
            line_items: typeof inv.line_items === 'string' ? JSON.parse(inv.line_items) : (inv.line_items || []),
            extraction_status: inv.extraction_status,
            processing_seconds: inv.processing_seconds,
            ollama_seconds: inv.ollama_seconds,
            input_tokens: inv.input_tokens,
            output_tokens: inv.output_tokens,
            page_count: inv.page_count
          };

          const fileName = inv.source_file ? inv.source_file.split(/[\/\\]/).pop() : 'invoice.pdf';
          const normalizeFileName = inv.pdf_path ? inv.pdf_path.split(/[\/\\]/).pop() : fileName;

          await queryInterface.sequelize.query(
            `INSERT INTO invoicefile 
             (fileName, normalizeFileName, fileUrl, invoiceJson, isVerified, storeId, expenseId, overInvoice, createdAt, lastModifiedDate, totalInvoice, folderPath, skipInvoices, IsAiIssue, AiIssueDes, isQueue)
             VALUES 
             (:fileName, :normalizeFileName, :fileUrl, :invoiceJson, '0', NULL, NULL, 'false', :createdAt, :lastModifiedDate, 1, 'uploads/invoices', 'false', :IsAiIssue, :AiIssueDes, 'false')`,
            {
              replacements: {
                fileName,
                normalizeFileName,
                fileUrl: inv.pdf_path || `/uploads/invoices/${normalizeFileName}`,
                invoiceJson: JSON.stringify(invoiceData),
                createdAt: inv.created_at || new Date(),
                lastModifiedDate: inv.updated_at || new Date(),
                IsAiIssue: inv.extraction_status === 'failed' ? 'true' : 'false',
                AiIssueDes: inv.error_message || null
              }
            }
          );
        }
        console.log(`[Migration] Successfully migrated records into 'invoicefile'.`);
      }

      // Drop old invoices table
      await queryInterface.dropTable('invoices');
      console.log(`[Migration] Dropped legacy 'invoices' table.`);
    } catch (err) {
      console.log(`[Migration] Note during table migration: ${err.message}`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('invoicefile');
  }
};
