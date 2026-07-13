const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
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
    appointmentDate: {
      type: Date,
      required: [true, 'Please provide appointment date'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Please provide time slot'],
    },
    reason: {
      type: String,
      required: [true, 'Please provide reason for visit'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    medicalRecords: [
      {
        filename: String,
        originalName: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
        fileType: String,
        fileSize: Number,
        uploadedBy: {
          type: String,
          enum: ['patient', 'doctor'],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for checking availability
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, timeSlot: 1 });
appointmentSchema.index({ patientId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);