const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true, // One review per appointment
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
    // Detailed ratings (optional)
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
    facilityRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    // Helpful votes
    helpfulCount: {
      type: Number,
      default: 0,
    },
    // Response from doctor (optional)
    doctorResponse: {
      comment: String,
      respondedAt: Date,
    },
    // Moderation
    isVerified: {
      type: Boolean,
      default: true, // Auto-verified if from completed appointment
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
    },
    isHidden: {
      type: Boolean,
      default: false, // Can be hidden by admin
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
reviewSchema.index({ doctorId: 1, createdAt: -1 });
reviewSchema.index({ patientId: 1 });
reviewSchema.index({ appointmentId: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });

// Virtual for checking if review is recent (within 30 days)
reviewSchema.virtual('isRecent').get(function () {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.createdAt >= thirtyDaysAgo;
});

// Static method to calculate average rating for a doctor
reviewSchema.statics.calculateAverageRating = async function (doctorId) {
  const result = await this.aggregate([
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        isHidden: false,
      },
    },
    {
      $group: {
        _id: '$doctorId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        averagePunctuality: { $avg: '$punctuality' },
        averageCommunication: { $avg: '$communication' },
        averageProfessionalism: { $avg: '$professionalism' },
        averageFacility: { $avg: '$facilityRating' },
      },
    },
  ]);

  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
      detailedRatings: {
        punctuality: result[0].averagePunctuality ? Math.round(result[0].averagePunctuality * 10) / 10 : null,
        communication: result[0].averageCommunication ? Math.round(result[0].averageCommunication * 10) / 10 : null,
        professionalism: result[0].averageProfessionalism ? Math.round(result[0].averageProfessionalism * 10) / 10 : null,
        facility: result[0].averageFacility ? Math.round(result[0].averageFacility * 10) / 10 : null,
      },
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
    detailedRatings: {},
  };
};

// Static method to get rating distribution
reviewSchema.statics.getRatingDistribution = async function (doctorId) {
  const distribution = await this.aggregate([
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        isHidden: false,
      },
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ]);

  // Convert to object with all ratings (1-5)
  const result = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distribution.forEach((item) => {
    result[item._id] = item.count;
  });

  return result;
};

module.exports = mongoose.model('Review', reviewSchema);
