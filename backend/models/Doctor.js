const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Please provide specialization'],
      trim: true,
    },
    hospital: {
      type: String,
      required: [true, 'Please provide hospital name'],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, 'Please provide qualification'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Please provide years of experience'],
      min: 0,
    },
    consultationFee: {
      type: Number,
      required: [true, 'Please provide consultation fee'],
      min: 0,
    },
    availableSlots: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        times: [String],
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    certificates: [
      {
        filename: String,
        originalName: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
        fileType: String,
        fileSize: Number,
      },
    ],
    profilePicture: {
      type: String,
    },
    // Rating statistics (updated from reviews)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

doctorSchema.index({ specialization: 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ status: 1, isActive: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);