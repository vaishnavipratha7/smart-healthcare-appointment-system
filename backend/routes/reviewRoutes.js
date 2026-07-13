const express = require('express');
const router = express.Router();
const {
  createReview,
  updateReview,
  deleteReview,
  getDoctorReviews,
  getReviewById,
  getMyReviews,
  canReviewAppointment,
  respondToReview,
  markReviewHelpful,
  reportReview,
  getReportedReviews,
  toggleReviewVisibility,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const {
  validateCreateReview,
  validateUpdateReview,
  validateReviewResponse,
  validateReportReview,
  validateMongoId,
} = require('../middleware/validators');

// Public routes
router.get('/doctor/:doctorId', validateMongoId('doctorId'), getDoctorReviews);
router.get('/:id', validateMongoId('id'), getReviewById);
router.post('/:id/helpful', validateMongoId('id'), markReviewHelpful);

// Patient routes (protected)
router.post('/', protect, checkRole('patient'), validateCreateReview, createReview);
router.put('/:id', protect, checkRole('patient'), validateMongoId('id'), validateUpdateReview, updateReview);
router.delete('/:id', protect, validateMongoId('id'), deleteReview); // Patient or admin
router.get('/my-reviews', protect, checkRole('patient'), getMyReviews);
router.get('/can-review/:appointmentId', protect, checkRole('patient'), validateMongoId('appointmentId'), canReviewAppointment);
router.post('/:id/report', protect, validateMongoId('id'), validateReportReview, reportReview);

// Doctor routes (protected)
router.post('/:id/respond', protect, checkRole('doctor'), validateMongoId('id'), validateReviewResponse, respondToReview);

// Admin routes (protected)
router.get('/admin/reported', protect, checkRole('admin'), getReportedReviews);
router.put('/:id/toggle-visibility', protect, checkRole('admin'), validateMongoId('id'), toggleReviewVisibility);

module.exports = router;
