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

// ── Named/specific paths FIRST — must be above /:id wildcard ─────────────────

// Patient routes
router.post('/', protect, checkRole('patient'), validateCreateReview, createReview);
router.get('/my-reviews', protect, checkRole('patient'), getMyReviews);
router.get('/can-review/:appointmentId', protect, checkRole('patient'), validateMongoId('appointmentId'), canReviewAppointment);

// Admin routes
router.get('/admin/reported', protect, checkRole('admin'), getReportedReviews);

// Public — doctor reviews list
router.get('/doctor/:doctorId', validateMongoId('doctorId'), getDoctorReviews);

// ── Wildcard /:id routes LAST ─────────────────────────────────────────────────

router.get('/:id', validateMongoId('id'), getReviewById);
router.put('/:id', protect, checkRole('patient'), validateMongoId('id'), validateUpdateReview, updateReview);
router.delete('/:id', protect, validateMongoId('id'), deleteReview);
router.post('/:id/helpful', validateMongoId('id'), markReviewHelpful);
router.post('/:id/report', protect, validateMongoId('id'), validateReportReview, reportReview);
router.post('/:id/respond', protect, checkRole('doctor'), validateMongoId('id'), validateReviewResponse, respondToReview);
router.put('/:id/toggle-visibility', protect, checkRole('admin'), validateMongoId('id'), toggleReviewVisibility);

module.exports = router;
