'use strict';

/**
 * Sequelize Model: InvoiceFile
 * 
 * Maps directly to the `invoicefile` table with the exact 17 columns
 * defined in the specification without any extra fields.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceFile = sequelize.define('InvoiceFile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  normalizeFileName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fileUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  invoiceJson: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
    defaultValue: '0'
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  expenseId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  overInvoice: {
    type: DataTypes.ENUM('false', 'true'),
    allowNull: false,
    defaultValue: 'false'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  lastModifiedDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  totalInvoice: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  folderPath: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'uploads/invoices'
  },
  skipInvoices: {
    type: SequelizeEnumSkip(),
    allowNull: false,
    defaultValue: 'false'
  },
  IsAiIssue: {
    type: DataTypes.ENUM('true', 'false'),
    allowNull: false,
    defaultValue: 'false'
  },
  AiIssueDes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isQueue: {
    type: DataTypes.ENUM('false', 'true'),
    allowNull: false,
    defaultValue: 'false'
  }
}, {
  tableName: 'invoicefile',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'lastModifiedDate',
  underscored: false
});

function SequelizeEnumSkip() {
  return DataTypes.ENUM('true', 'false');
}

/**
 * Instance helper: safely parse invoiceJson text into an object
 */
InvoiceFile.prototype.getParsedInvoice = function () {
  if (!this.invoiceJson) return {};
  try {
    return typeof this.invoiceJson === 'string'
      ? JSON.parse(this.invoiceJson)
      : this.invoiceJson;
  } catch (err) {
    return {};
  }
};

/**
 * Formats a record for consistent API output (backward-compatible with frontend)
 */
InvoiceFile.prototype.toFormattedResponse = function () {
  const json = this.toJSON ? this.toJSON() : this;
  const parsed = this.getParsedInvoice ? this.getParsedInvoice() : {};

  return {
    id: json.id,
    fileName: json.fileName,
    normalizeFileName: json.normalizeFileName,
    fileUrl: json.fileUrl,
    folderPath: json.folderPath,
    isVerified: json.isVerified,
    storeId: json.storeId,
    expenseId: json.expenseId,
    overInvoice: json.overInvoice,
    totalInvoice: json.totalInvoice,
    skipInvoices: json.skipInvoices,
    IsAiIssue: json.IsAiIssue,
    AiIssueDes: json.AiIssueDes,
    isQueue: json.isQueue,
    createdAt: json.createdAt,
    lastModifiedDate: json.lastModifiedDate,

    // Formatted / extracted invoice details from invoiceJson
    source_file: json.fileName || parsed.source_file || null,
    pdf_path: json.fileUrl || parsed.pdf_path || null,
    document_type: parsed.document_type || 'invoice',
    invoice_number: parsed.invoice_number || null,
    invoice_date: parsed.invoice_date || null,
    due_date: parsed.due_date || null,
    raw_date_text: parsed.raw_date_text || null,
    currency: parsed.currency || 'USD',
    status: parsed.status || 'DRAFT',
    description: parsed.description || null,
    vendor_name: parsed.vendor_name || null,
    vendor_address: parsed.vendor_address || null,
    vendor_city: parsed.vendor_city || null,
    vendor_state: parsed.vendor_state || null,
    vendor_zip: parsed.vendor_zip || null,
    vendor_phone: parsed.vendor_phone || null,
    customer_name: parsed.customer_name || null,
    subtotal: parsed.subtotal || 0,
    tax: parsed.tax || 0,
    total: parsed.total || parsed.total_amount || 0,
    total_amount: parsed.total_amount || parsed.total || 0,
    payment_method: parsed.payment_method || null,
    payment_amount: parsed.payment_amount || 0,
    payment_status: parsed.payment_status || null,
    credit_no: parsed.credit_no || null,
    credit_date: parsed.credit_date || null,
    credit_amount: parsed.credit_amount || 0,
    line_items: parsed.line_items || [],

    // Raw JSON data
    invoiceJson: parsed
  };
};

module.exports = InvoiceFile;
