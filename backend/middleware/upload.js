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
    // Create unique filename: userId_timestamp_originalname
    const userId = req.user?._id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    const filename = `${userId}_${timestamp}_${sanitizedName}${ext}`;
    cb(null, filename);
  },
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx/;
  const allowedMedicalTypes = /jpeg|jpg|png|pdf|dcm|dicom/;

  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype.toLowerCase();

  let isValid = false;
  let errorMessage = 'Invalid file type';

  // Validate based on field name
  if (file.fieldname === 'certificate') {
    // Certificates: PDF, DOC, DOCX, images
    isValid = allowedDocTypes.test(ext) || allowedImageTypes.test(ext);
    errorMessage = 'Certificates must be PDF, DOC, DOCX, or image files';
  } else if (file.fieldname === 'medicalRecord') {
    // Medical records: PDF, images, DICOM
    isValid = allowedMedicalTypes.test(ext);
    errorMessage = 'Medical records must be PDF, image, or DICOM files';
  } else if (file.fieldname === 'profilePicture') {
    // Profile pictures: Images only
    isValid = allowedImageTypes.test(ext);
    errorMessage = 'Profile pictures must be image files (JPEG, PNG, GIF, WebP)';
  } else {
    // Generic document upload
    isValid = allowedDocTypes.test(ext) || allowedImageTypes.test(ext);
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
