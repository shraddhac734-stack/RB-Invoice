/**
 * Multer File Upload Middleware
 * 
 * Configures file storage, file type filtering, and size limits for PDF invoice uploads.
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Target directory for storing uploaded invoice PDFs
const uploadDir = path.resolve(__dirname, '../../uploads/invoices');

// Ensure directory exists on startup
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique, sanitized filename: invoice-<timestamp>-<random>.pdf
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `invoice-${uniqueSuffix}${ext}`);
  }
});

// File filter: Only accept PDF documents
const fileFilter = function (req, file, cb) {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';

  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF files are allowed!'), false);
  }
};

// Multer upload instance with 10MB file size limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes
  }
});

// Flexible helper accepting single file from common field names ('pdf', 'file', 'files')
const uploadInvoicePdf = (req, res, next) => {
  const uploader = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'files', maxCount: 1 }
  ]);

  uploader(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Attach single file reference to req.file for easy controller access
    if (req.files) {
      const uploadedFile = (req.files['pdf'] && req.files['pdf'][0])
        || (req.files['file'] && req.files['file'][0])
        || (req.files['files'] && req.files['files'][0]);
      
      if (uploadedFile) {
        req.file = uploadedFile;
      }
    }

    next();
  });
};

module.exports = {
  uploadDir,
  upload,
  uploadInvoicePdf
};
