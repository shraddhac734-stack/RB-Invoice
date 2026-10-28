'use strict';

/**
 * Migration: Create failed_invoices table
 * 
 * Stores uploaded invoices that failed extraction, timed out, or returned
 * invalid format responses, keeping the primary `invoicefile` table clean.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('failed_invoices', {
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
      filePath: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      fileSize: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      folderPath: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: 'uploads/invoices'
      },
      storeId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      expenseId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      userPayload: {
        type: Sequelize.JSON,
        allowNull: true
      },
      rawFailedData: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      errorCode: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: 'EXTRACTION_FAILED_504'
      },
      httpStatusCode: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 504
      },
      retryCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      lastModifiedDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    console.log("[Migration] Successfully created 'failed_invoices' table.");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('failed_invoices');
    console.log("[Migration] Dropped 'failed_invoices' table.");
  }
};

