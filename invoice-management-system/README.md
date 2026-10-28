# Invoice Management System Backend (`invoicefile`)

A modular, clean Node.js and Express backend built with **Sequelize ORM** and **MySQL**, designed to store and manage **`invoicefile`** records with PDF uploads, OCR integration, and Swagger documentation.

---

## 🗄️ Database Schema: `invoicefile`

The table `invoicefile` strictly contains the 17 columns defined in the specification without any extra fields:

| # | Column Name | Type | Nullable | Default | Description |
|:---:|:---|:---|:---:|:---:|:---|
| 1 | `id` | `int Auto Increment` | ❌ No | — | Primary key |
| 2 | `fileName` | `varchar(255)` | ✅ Yes | `NULL` | Original file name |
| 3 | `normalizeFileName` | `varchar(255)` | ✅ Yes | `NULL` | Normalized / sanitized file name |
| 4 | `fileUrl` | `varchar(255)` | ✅ Yes | `NULL` | URL / file path |
| 5 | `invoiceJson` | `text` | ✅ Yes | `NULL` | Extracted invoice data in JSON text format |
| 6 | `isVerified` | `enum('0','1')` | ❌ No | `'0'` | Verification status (`'0'` = unverified, `'1'` = verified) |
| 7 | `storeId` | `int` | ✅ Yes | `NULL` | Store identifier |
| 8 | `expenseId` | `int` | ✅ Yes | `NULL` | Expense category identifier |
| 9 | `overInvoice` | `enum('false','true')`| ❌ No | `'false'` | Flag for over-budget invoices |
| 10 | `createdAt` | `datetime` | ✅ Yes | `NULL` | Creation timestamp |
| 11 | `lastModifiedDate` | `datetime` | ✅ Yes | `NULL` | Last modification timestamp |
| 12 | `totalInvoice` | `int` | ✅ Yes | `NULL` | Total invoice count in document |
| 13 | `folderPath` | `varchar(255)` | ✅ Yes | `NULL` | Directory path |
| 14 | `skipInvoices` | `enum('true','false')`| ❌ No | `'false'` | Skip invoice processing flag |
| 15 | `IsAiIssue` | `enum('true','false')`| ❌ No | `'false'` | AI / OCR error flag |
| 16 | `AiIssueDes` | `text` | ✅ Yes | `NULL` | Description of AI / OCR issue |
| 17 | `isQueue` | `enum('false','true')`| ❌ No | `'false'` | Queue processing flag |

> **Note:** The `inline_invoices` table and all sub-invoice associations have been completely removed.

---

## 📜 NPM Scripts

```bash
# Verify database connection
npm run db:check

# Run migrations (creates invoicefile table)
npm run db:migrate

# Seed sample data into invoicefile
npm run db:seed

# Start development server with auto-reload (nodemon)
npm run dev

# Start server in production mode
npm start

# Run automated tests
npm test
```

---

## 🚀 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint |
| `GET` | `/api-docs` | Interactive Swagger UI |
| `GET` | `/api/invoices/counts` | Dashboard summary counts (`total_records`, `verified`, `unverified`, `ai_issue`, `in_queue`) |
| `GET` | `/api/invoices` | List invoices with pagination (`page`, `limit`), search, and filters (`isVerified`, `isQueue`, `IsAiIssue`, `skipInvoices`, `storeId`) |
| `POST` | `/api/invoices` | Create a new invoice record manually |
| `GET` | `/api/invoices/:id` | Fetch an invoice record by ID |
| `PUT` | `/api/invoices/:id` | Update an existing invoice record |
| `DELETE` | `/api/invoices/:id` | Delete an invoice record |
| `POST` | `/api/invoices/upload` | Upload PDF file (stores file, attempts OCR, and saves record to `invoicefile`) |

---

## 📖 Swagger Documentation

Open your browser to:
👉 **`http://localhost:3009/api-docs`**
