/**
 * Database Configuration and Sequelize Instance
 * 
 * This module initializes the Sequelize ORM connection to the MySQL database.
 * It includes an automatic database creation check and connection verification helper.
 */

const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Determine active database name based on environment
const isTestEnv = process.env.NODE_ENV === 'test';
const dbName = isTestEnv
  ? (process.env.DB_NAME_TEST || 'invoice_management_test_db')
  : (process.env.DB_NAME || 'invoice_management_db');

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';

/**
 * Ensures the target MySQL database exists.
 * If the database does not exist, it will be created automatically.
 */
async function ensureDatabaseExists() {
  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.end();
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Unable to reach MySQL at ${dbHost}:${dbPort}. Please ensure the MySQL server service is installed and currently running.`
      );
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      throw new Error(
        `MySQL access denied for user '${dbUser}'. Please check your DB_PASSWORD in your .env file.`
      );
    }
    throw error;
  }
}

// Create Sequelize instance
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false
  }
});

/**
 * Verifies the database connection.
 * Used by npm run db:check and during server startup.
 */
async function testConnection() {
  try {
    console.log(`Checking connection to MySQL database: ${dbName}...`);
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log(`[Database] Connection to '${dbName}' established successfully!`);
    return true;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    throw error;
  }
}

// If this file is run directly (npm run db:check)
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('Database check completed successfully.');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = {
  sequelize,
  ensureDatabaseExists,
  testConnection,
  dbName
};
