'use strict';

/**
 * Sequelize Model: FailedInvoice
 * 
 * Maps to the `failed_invoices` table. Stores records of invoice uploads
 * that timed out, threw errors, or returned malformed/invalid extraction formats.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FailedInvoice = sequelize.define('FailedInvoice', {
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
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  folderPath: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'uploads/invoices'
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  expenseId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userPayload: {
    type: DataTypes.JSON,
    allowNull: true
  },
  rawFailedData: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  errorCode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'EXTRACTION_FAILED_504'
  },
  httpStatusCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 504
  },
  retryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  lastModifiedDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'failed_invoices',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'lastModifiedDate',
  underscored: false
});

/**
 * Formats a failed invoice record for API output
 */
FailedInvoice.prototype.toFormattedResponse = function () {
  const json = this.toJSON ? this.toJSON() : this;
  return {
    id: json.id,
    fileName: json.fileName,
    normalizeFileName: json.normalizeFileName,
    fileUrl: json.fileUrl,
    fileSize: json.fileSize,
    storeId: json.storeId,
    expenseId: json.expenseId,
    errorCode: json.errorCode,
    errorMessage: json.errorMessage,
    httpStatusCode: json.httpStatusCode,
    createdAt: json.createdAt,
    lastModifiedDate: json.lastModifiedDate
  };
};

module.exports = FailedInvoice;

