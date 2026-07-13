const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Centralized validation rules for all API endpoints
 */

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  
  next();
};

/**
 * Authentication Validators
 */

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['patient', 'doctor']).withMessage('Role must be either patient or doctor'),
  
  // Doctor-specific fields
  body('specialization')
    .if(body('role').equals('doctor'))
    .notEmpty().withMessage('Specialization is required for doctors')
    .isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2 and 100 characters'),
  
  body('hospital')
    .if(body('role').equals('doctor'))
    .notEmpty().withMessage('Hospital is required for doctors')
    .isLength({ min: 2, max: 200 }).withMessage('Hospital name must be between 2 and 200 characters'),
  
  body('qualification')
    .if(body('role').equals('doctor'))
    .notEmpty().withMessage('Qualification is required for doctors')
    .isLength({ min: 2, max: 200 }).withMessage('Qualification must be between 2 and 200 characters'),
  
  body('experience')
    .if(body('role').equals('doctor'))
    .notEmpty().withMessage('Experience is required for doctors')
    .isInt({ min: 0, max: 70 }).withMessage('Experience must be between 0 and 70 years'),
  
  body('consultationFee')
    .if(body('role').equals('doctor'))
    .notEmpty().withMessage('Consultation fee is required for doctors')
    .isFloat({ min: 0, max: 100000 }).withMessage('Consultation fee must be between 0 and 100,000'),
  
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors,
];

/**
 * Appointment Validators
 */

const validateCreateAppointment = [
  body('doctorId')
    .notEmpty().withMessage('Doctor ID is required')
    .isMongoId().withMessage('Invalid doctor ID format'),
  
  body('appointmentDate')
    .notEmpty().withMessage('Appointment date is required')
    .isISO8601().withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      
      // Limit booking to 90 days in advance
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 90);
      
      if (appointmentDate > maxDate) {
        throw new Error('Appointments can only be booked up to 90 days in advance');
      }
      
      return true;
    }),
  
  body('timeSlot')
    .notEmpty().withMessage('Time slot is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format. Use HH:MM format (e.g., 09:30)'),
  
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason for visit is required')
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
  
  handleValidationErrors,
];

/**
 * Review Validators
 */

const validateCreateReview = [
  body('appointmentId')
    .notEmpty().withMessage('Appointment ID is required')
    .isMongoId().withMessage('Invalid appointment ID format'),
  
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  
  body('punctuality')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Punctuality rating must be between 1 and 5'),
  
  body('communication')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  
  body('professionalism')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Professionalism rating must be between 1 and 5'),
  
  body('facilityRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Facility rating must be between 1 and 5'),
  
  handleValidationErrors,
];

const validateUpdateReview = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  
  body('punctuality')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Punctuality rating must be between 1 and 5'),
  
  body('communication')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  
  body('professionalism')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Professionalism rating must be between 1 and 5'),
  
  body('facilityRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Facility rating must be between 1 and 5'),
  
  handleValidationErrors,
];

const validateReviewResponse = [
  body('comment')
    .trim()
    .notEmpty().withMessage('Response comment is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Response must be between 10 and 1000 characters'),
  
  handleValidationErrors,
];

/**
 * Doctor Profile Validators
 */

const validateUpdateDoctorProfile = [
  body('specialization')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2 and 100 characters'),
  
  body('hospital')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Hospital name must be between 2 and 200 characters'),
  
  body('qualification')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Qualification must be between 2 and 200 characters'),
  
  body('experience')
    .optional()
    .isInt({ min: 0, max: 70 }).withMessage('Experience must be between 0 and 70 years'),
  
  body('consultationFee')
    .optional()
    .isFloat({ min: 0, max: 100000 }).withMessage('Consultation fee must be between 0 and 100,000'),
  
  body('availableSlots')
    .optional()
    .isArray().withMessage('Available slots must be an array')
    .custom((slots) => {
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (const slot of slots) {
        if (!slot.day || !validDays.includes(slot.day)) {
          throw new Error('Invalid day in available slots. Must be: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday');
        }
        
        if (!slot.times || !Array.isArray(slot.times)) {
          throw new Error('Each slot must have a times array');
        }
        
        for (const time of slot.times) {
          if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
            throw new Error(`Invalid time format: ${time}. Use HH:MM format (e.g., 09:30)`);
          }
        }
      }
      
      return true;
    }),
  
  handleValidationErrors,
];

/**
 * Search Validators
 */

const validateDoctorSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query too long (max 100 characters)'),
  
  query('specialization')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Specialization filter too long'),
  
  query('hospital')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Hospital filter too long'),
  
  query('minFee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum fee must be a positive number'),
  
  query('maxFee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum fee must be a positive number')
    .custom((value, { req }) => {
      if (req.query.minFee && parseFloat(value) < parseFloat(req.query.minFee)) {
        throw new Error('Maximum fee must be greater than minimum fee');
      }
      return true;
    }),
  
  query('minExperience')
    .optional()
    .isInt({ min: 0, max: 70 }).withMessage('Minimum experience must be between 0 and 70'),
  
  query('availableDay')
    .optional()
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day. Must be: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'),
  
  query('availableTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format. Use HH:MM'),
  
  query('sortBy')
    .optional()
    .isIn(['fee', 'experience', 'name', 'createdAt']).withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors,
];

/**
 * MongoDB ID Validators
 */

const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .notEmpty().withMessage(`${paramName} is required`)
    .isMongoId().withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors,
];

/**
 * Date/Time Validators
 */

const validateAvailabilityCheck = [
  query('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format. Use YYYY-MM-DD')
    .custom((value) => {
      const checkDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkDate < today) {
        throw new Error('Date cannot be in the past');
      }
      
      return true;
    }),
  
  query('timeSlot')
    .notEmpty().withMessage('Time slot is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format. Use HH:MM'),
  
  handleValidationErrors,
];

/**
 * Admin Validators
 */

const validateCreateDoctor = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID format'),
  
  body('specialization')
    .trim()
    .notEmpty().withMessage('Specialization is required')
    .isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2 and 100 characters'),
  
  body('hospital')
    .trim()
    .notEmpty().withMessage('Hospital is required')
    .isLength({ min: 2, max: 200 }).withMessage('Hospital name must be between 2 and 200 characters'),
  
  body('qualification')
    .trim()
    .notEmpty().withMessage('Qualification is required')
    .isLength({ min: 2, max: 200 }).withMessage('Qualification must be between 2 and 200 characters'),
  
  body('experience')
    .notEmpty().withMessage('Experience is required')
    .isInt({ min: 0, max: 70 }).withMessage('Experience must be between 0 and 70 years'),
  
  body('consultationFee')
    .notEmpty().withMessage('Consultation fee is required')
    .isFloat({ min: 0, max: 100000 }).withMessage('Consultation fee must be between 0 and 100,000'),
  
  handleValidationErrors,
];

const validateTriggerJob = [
  body('jobName')
    .notEmpty().withMessage('Job name is required')
    .isIn(['sendDailyReminders', 'cleanupOldAppointments', 'autoCompletePastAppointments', 'sendWeeklySummary'])
    .withMessage('Invalid job name'),
  
  handleValidationErrors,
];

/**
 * Report Validators
 */

const validateReportReview = [
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason for reporting is required')
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
  
  handleValidationErrors,
];

module.exports = {
  // Auth validators
  validateRegister,
  validateLogin,
  
  // Appointment validators
  validateCreateAppointment,
  
  // Review validators
  validateCreateReview,
  validateUpdateReview,
  validateReviewResponse,
  validateReportReview,
  
  // Doctor validators
  validateUpdateDoctorProfile,
  validateDoctorSearch,
  validateAvailabilityCheck,
  
  // Admin validators
  validateCreateDoctor,
  validateTriggerJob,
  
  // Generic validators
  validateMongoId,
  handleValidationErrors,
};
