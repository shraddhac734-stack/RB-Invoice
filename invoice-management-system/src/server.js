/**
 * Application Server Entry Point
 * 
 * Verifies database connection, runs pending migrations,
 * and starts listening for incoming HTTP connections.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { testConnection, sequelize } = require('./config/database');
const runMigrations = require('../database/migrate');

const PORT = parseInt(process.env.PORT || '3009', 10);

async function startServer() {
  try {
    console.log('--------------------------------------------------');
    console.log(' Starting Invoice Management System Backend');
    console.log('--------------------------------------------------');

    // 1. Verify MySQL connection
    await testConnection();

    // 2. Automatically run pending migrations so tables exist
    await runMigrations();

    // 3. Start listening on configured port
    const server = app.listen(PORT, () => {
      console.log('--------------------------------------------------');
      console.log(` Server is running on: http://localhost:${PORT}`);
      console.log(` Health Check:         http://localhost:${PORT}/health`);
      console.log(` Swagger Docs (UI):    http://localhost:${PORT}/api-docs`);
      console.log(` Invoices API:         http://localhost:${PORT}/api/invoices`);
      console.log('--------------------------------------------------');
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await sequelize.close();
          console.log('Database connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error closing database connection:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
