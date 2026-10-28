/**
 * Models Index
 * 
 * Exports Sequelize instance, InvoiceFile model, and alias Invoice.
 * Stores invoice data in `invoicefile` table strictly matching the 17-column specification.
 */

const { sequelize } = require('../config/database');
const InvoiceFile = require('./InvoiceFile');
const FailedInvoice = require('./FailedInvoice');

module.exports = {
  sequelize,
  InvoiceFile,
  Invoice: InvoiceFile,
  FailedInvoice
};
