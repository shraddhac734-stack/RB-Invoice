/**
 * Invoice Model
 * 
 * Single table schema storing extracted invoices and credit memos.
 * Vendor details are flattened into columns, and line items (inline details)
 * are stored directly as a JSON array in the line_items column.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define(
  'Invoice',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    // Document details
    source_file: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: ''
    },
    pdf_path: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    document_type: {
      type: DataTypes.ENUM('invoice', 'credit_memo', 'unknown'),
      allowNull: false,
      defaultValue: 'invoice'
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    raw_date_text: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PENDING', 'PAID', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'DRAFT'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Vendor details (flattened)
    vendor_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    vendor_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    vendor_city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    vendor_state: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    vendor_zip: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    vendor_phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    // Customer details
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    // Financial Summary
    subtotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    tax: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.00
    },

    // Payment details
    payment_method: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    payment_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    payment_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    // Credit memo fields
    credit_no: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    credit_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    credit_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
      defaultValue: 0.00
    },

    // Line items (inline details) stored as JSON array
    // Each element: { item_code, description, quantity, unit, unit_price, amount }
    line_items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },

    // Extraction metadata
    extraction_status: {
      type: DataTypes.ENUM('success', 'failed'),
      allowNull: false,
      defaultValue: 'success'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    received_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    processing_seconds: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    ollama_seconds: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    input_tokens: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    output_tokens: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    page_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: 'invoices',
    timestamps: true,
    underscored: true
  }
);

module.exports = Invoice;
