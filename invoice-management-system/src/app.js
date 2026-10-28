/**
 * Express Application Setup
 * 
 * Configures Express middlewares, routes, Swagger documentation,
 * static file serving, and centralized error handling.
 * Exports app instance for both server.js and automated testing.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const invoiceRoutes = require('./routes/invoiceRoutes');
const errorHandler = require('./middleware/errorHandler');
const { setupSwagger } = require('./docs/swagger');
const { sendError } = require('./utils/apiResponse');

const app = express();

// 1. Core Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'Accept', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve static uploads (for inspecting uploaded invoice PDFs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 3. Swagger UI Documentation
setupSwagger(app);

// 4. Server Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime())
  });
});

// 5. API Routes
app.use('/api/invoices', invoiceRoutes);

// 6. 404 Route Not Found Handler
app.use((req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// 7. Centralized Error Handling Middleware (must be after all routes)
app.use(errorHandler);

module.exports = app;
