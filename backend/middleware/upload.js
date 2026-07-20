const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * File Upload Middleware using Multer
 * Handles uploads for doctor certificates and patient medical records
 */

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    './uploads',
    './uploads/certificates',
    './uploads/medical-records',
    './uploads/profile-pictures',
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = './uploads/';

    // Determine upload path based on field name
    if (file.fieldname === 'certificate') {
      uploadPath = './uploads/certificates/';
    } else if (file.fieldname === 'medicalRecord') {
      uploadPath = './uploads/medical-records/';
    } else if (file.fieldname === 'profilePicture') {
      uploadPath = './uploads/profile-pictures/';
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // SECURITY FIX: Use cryptographically secure random filename
    const crypto = require('crypto');
    const userId = req.user?._id || 'anonymous';
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Validate extension is safe
    const safeExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.dcm'];
    if (!safeExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension'), null);
    }
    
    const filename = `${userId}_${timestamp}_${randomBytes}${ext}`;
    
    // Store original filename in request for database storage
    req.originalFileName = file.originalname;
    
    cb(null, filename);
  },
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // SECURITY FIX: Validate both extension AND MIME type (defense in depth)
  const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedMedicalMimes = [...allowedImageMimes, ...allowedDocMimes, 'application/dicom'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  let isValid = false;
  let errorMessage = 'Invalid file type';

  // Validate both extension AND MIME type
  if (file.fieldname === 'certificate') {
    const allowedExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    isValid = allowedExts.includes(ext) && 
              (allowedDocMimes.includes(mimetype) || allowedImageMimes.includes(mimetype));
    errorMessage = 'Certificates must be PDF, DOC, DOCX, or image files';
  } else if (file.fieldname === 'medicalRecord') {
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.dcm'];
    isValid = allowedExts.includes(ext) && allowedMedicalMimes.includes(mimetype);
    errorMessage = 'Medical records must be PDF, image, or DICOM files';
  } else if (file.fieldname === 'profilePicture') {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    isValid = allowedExts.includes(ext) && allowedImageMimes.includes(mimetype);
    errorMessage = 'Profile pictures must be image files (JPEG, PNG, GIF, WebP)';
  } else {
    const allowedExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    isValid = allowedExts.includes(ext) && 
              (allowedDocMimes.includes(mimetype) || allowedImageMimes.includes(mimetype));
    errorMessage = 'Only PDF, DOC, DOCX, and image files are allowed';
  }

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error(errorMessage), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5, // Max 5 files per request
    fields: 10, // Max 10 non-file fields
  },
});

// Middleware for single file upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 10MB' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        // Custom errors (from fileFilter)
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 10MB per file' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: `Too many files. Maximum is ${maxCount} files` });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

// Middleware for multiple fields
const uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 10MB per file' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error deleting file: ${filePath}`, error);
    return false;
  }
};

// Helper function to get file URL
const getFileUrl = (filename, category = 'uploads') => {
  if (!filename) return null;
  
  // If filename is already a full path, extract just the filename
  const justFilename = path.basename(filename);
  
  return `/uploads/${category}/${justFilename}`;
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  getFileUrl,
};
