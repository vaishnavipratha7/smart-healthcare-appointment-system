const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

/**
 * Review Controller
 * Handles appointment ratings and reviews
 */

// @desc    Create a review for a completed appointment
// @route   POST /api/reviews
// @access  Private (Patient)
const createReview = async (req, res) => {
  try {
    const {
      appointmentId,
      rating,
      comment,
      punctuality,
      communication,
      professionalism,
      facilityRating,
    } = req.body;

    // Validate appointment exists and is completed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment belongs to this patient
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this appointment' });
    }

    // Check if appointment is completed
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed appointments' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this appointment' });
    }

    // Create review
    const review = await Review.create({
      appointmentId,
      patientId: req.user._id,
      doctorId: appointment.doctorId,
      rating,
      comment,
      punctuality,
      communication,
      professionalism,
      facilityRating,
      isVerified: true, // Verified since it's from a completed appointment
    });

    // Update doctor's average rating
    const stats = await Review.calculateAverageRating(appointment.doctorId);
    await Doctor.findByIdAndUpdate(appointment.doctorId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('patientId', 'name')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name',
        },
      });

    res.status(201).json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Patient - own review)
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if review belongs to this patient
    if (review.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    // Update allowed fields
    const {
      rating,
      comment,
      punctuality,
      communication,
      professionalism,
      facilityRating,
    } = req.body;

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (punctuality !== undefined) review.punctuality = punctuality;
    if (communication !== undefined) review.communication = communication;
    if (professionalism !== undefined) review.professionalism = professionalism;
    if (facilityRating !== undefined) review.facilityRating = facilityRating;

    await review.save();

    // Recalculate doctor's average rating
    const stats = await Review.calculateAverageRating(review.doctorId);
    await Doctor.findByIdAndUpdate(review.doctorId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('patientId', 'name')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name',
        },
      });

    res.json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Patient - own review, or Admin)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check authorization (patient or admin)
    if (
      review.patientId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const doctorId = review.doctorId;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate doctor's average rating
    const stats = await Review.calculateAverageRating(doctorId);
    await Doctor.findByIdAndUpdate(doctorId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a doctor
// @route   GET /api/reviews/doctor/:doctorId
// @access  Public
const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Query reviews
    const reviews = await Review.find({
      doctorId,
      isHidden: false,
    })
      .populate('patientId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments({
      doctorId,
      isHidden: false,
    });

    // Get rating statistics
    const stats = await Review.calculateAverageRating(doctorId);
    const distribution = await Review.getRatingDistribution(doctorId);

    res.json({
      reviews,
      statistics: {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
        detailedRatings: stats.detailedRatings,
        ratingDistribution: distribution,
      },
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single review by ID
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('patientId', 'name')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name',
        },
      })
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate timeSlot',
      });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.isHidden) {
      return res.status(404).json({ message: 'Review not available' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private (Patient)
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ patientId: req.user._id })
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name',
        },
      })
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate timeSlot',
      })
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if patient can review an appointment
// @route   GET /api/reviews/can-review/:appointmentId
// @access  Private (Patient)
const canReviewAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      return res.json({ canReview: false, reason: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.json({ canReview: false, reason: 'Not your appointment' });
    }

    if (appointment.status !== 'completed') {
      return res.json({ canReview: false, reason: 'Appointment not completed yet' });
    }

    const existingReview = await Review.findOne({ appointmentId: req.params.appointmentId });
    if (existingReview) {
      return res.json({ canReview: false, reason: 'Already reviewed', reviewId: existingReview._id });
    }

    res.json({ canReview: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Doctor responds to a review
// @route   POST /api/reviews/:id/respond
// @access  Private (Doctor)
const respondToReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if doctor owns this review
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || review.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this review' });
    }

    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Please provide a response comment' });
    }

    review.doctorResponse = {
      comment,
      respondedAt: new Date(),
    };

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('patientId', 'name')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name',
        },
      });

    res.json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Public
const markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.helpfulCount += 1;
    await review.save();

    res.json({ helpfulCount: review.helpfulCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
const reportReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Please provide a reason for reporting' });
    }

    review.isReported = true;
    review.reportReason = reason;
    await review.save();

    res.json({ message: 'Review reported successfully. It will be reviewed by our team.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reported reviews (Admin)
// @route   GET /api/reviews/admin/reported
// @access  Private (Admin)
const getReportedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isReported: true })
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      })
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Hide/unhide a review (Admin)
// @route   PUT /api/reviews/:id/toggle-visibility
// @access  Private (Admin)
const toggleReviewVisibility = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.isHidden = !review.isHidden;
    await review.save();

    // Recalculate doctor's rating
    const stats = await Review.calculateAverageRating(review.doctorId);
    await Doctor.findByIdAndUpdate(review.doctorId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    res.json({
      message: `Review ${review.isHidden ? 'hidden' : 'visible'}`,
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
