const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { deleteFile, getFileUrl } = require('../middleware/upload');
const path = require('path');

/**
 * File Upload Controller
 * Handles all file upload operations for the application
 */

// @desc    Upload doctor certificate
// @route   POST /api/upload/doctor/certificate
// @access  Private (Doctor)
const uploadDoctorCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a certificate file' });
    }

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      // Delete uploaded file if doctor profile not found
      deleteFile(req.file.path);
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Add certificate to doctor's profile
    const certificate = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadDate: new Date(),
    };

    doctor.certificates.push(certificate);
    await doctor.save();

    res.status(201).json({
      message: 'Certificate uploaded successfully',
      certificate: {
        ...certificate,
        url: getFileUrl(req.file.filename, 'certificates'),
      },
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete doctor certificate
// @route   DELETE /api/upload/doctor/certificate/:filename
// @access  Private (Doctor)
const deleteDoctorCertificate = async (req, res) => {
  try {
    const { filename } = req.params;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Find certificate
    const certIndex = doctor.certificates.findIndex(
      (cert) => cert.filename === filename
    );

    if (certIndex === -1) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', 'uploads', 'certificates', filename);
    deleteFile(filePath);

    // Remove from database
    doctor.certificates.splice(certIndex, 1);
    await doctor.save();

    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor certificates
// @route   GET /api/upload/doctor/certificates
// @access  Private (Doctor)
const getDoctorCertificates = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const certificates = doctor.certificates.map((cert) => ({
      ...cert.toObject(),
      url: getFileUrl(cert.filename, 'certificates'),
    }));

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/upload/profile-picture
// @access  Private (All authenticated users)
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a profile picture' });
    }

    // Update based on user role
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        deleteFile(req.file.path);
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      // Delete old profile picture if exists
      if (doctor.profilePicture) {
        const oldFilePath = path.join(__dirname, '..', 'uploads', 'profile-pictures', doctor.profilePicture);
        deleteFile(oldFilePath);
      }

      doctor.profilePicture = req.file.filename;
      await doctor.save();
    }

    res.status(201).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: {
        filename: req.file.filename,
        url: getFileUrl(req.file.filename, 'profile-pictures'),
      },
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload medical record for appointment
// @route   POST /api/upload/appointment/:appointmentId/medical-record
// @access  Private (Patient or Doctor)
const uploadMedicalRecord = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a medical record file' });
    }

    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      deleteFile(req.file.path);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    let uploadedBy = 'patient';
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        deleteFile(req.file.path);
        return res.status(403).json({ message: 'Not authorized to upload files for this appointment' });
      }
      uploadedBy = 'doctor';
    } else if (appointment.patientId.toString() !== req.user._id.toString()) {
      deleteFile(req.file.path);
      return res.status(403).json({ message: 'Not authorized to upload files for this appointment' });
    }

    // Add medical record to appointment
    const medicalRecord = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadDate: new Date(),
      uploadedBy,
    };

    appointment.medicalRecords.push(medicalRecord);
    await appointment.save();

    res.status(201).json({
      message: 'Medical record uploaded successfully',
      medicalRecord: {
        ...medicalRecord,
        url: getFileUrl(req.file.filename, 'medical-records'),
      },
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload multiple medical records for appointment
// @route   POST /api/upload/appointment/:appointmentId/medical-records
// @access  Private (Patient or Doctor)
const uploadMultipleMedicalRecords = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one medical record file' });
    }

    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      // Delete all uploaded files
      req.files.forEach((file) => deleteFile(file.path));
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    let uploadedBy = 'patient';
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        req.files.forEach((file) => deleteFile(file.path));
        return res.status(403).json({ message: 'Not authorized to upload files for this appointment' });
      }
      uploadedBy = 'doctor';
    } else if (appointment.patientId.toString() !== req.user._id.toString()) {
      req.files.forEach((file) => deleteFile(file.path));
      return res.status(403).json({ message: 'Not authorized to upload files for this appointment' });
    }

    // Add all medical records
    const uploadedRecords = [];
    req.files.forEach((file) => {
      const medicalRecord = {
        filename: file.filename,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadDate: new Date(),
        uploadedBy,
      };
      appointment.medicalRecords.push(medicalRecord);
      uploadedRecords.push({
        ...medicalRecord,
        url: getFileUrl(file.filename, 'medical-records'),
      });
    });

    await appointment.save();

    res.status(201).json({
      message: `${uploadedRecords.length} medical record(s) uploaded successfully`,
      medicalRecords: uploadedRecords,
    });
  } catch (error) {
    if (req.files) {
      req.files.forEach((file) => deleteFile(file.path));
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete medical record
// @route   DELETE /api/upload/appointment/:appointmentId/medical-record/:filename
// @access  Private (Patient or Doctor)
const deleteMedicalRecord = async (req, res) => {
  try {
    const { appointmentId, filename } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find medical record
    const recordIndex = appointment.medicalRecords.findIndex(
      (record) => record.filename === filename
    );

    if (recordIndex === -1) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', 'uploads', 'medical-records', filename);
    deleteFile(filePath);

    // Remove from database
    appointment.medicalRecords.splice(recordIndex, 1);
    await appointment.save();

    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get medical records for appointment
// @route   GET /api/upload/appointment/:appointmentId/medical-records
// @access  Private (Patient or Doctor)
const getAppointmentMedicalRecords = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const medicalRecords = appointment.medicalRecords.map((record) => ({
      ...record.toObject(),
      url: getFileUrl(record.filename, 'medical-records'),
    }));

    res.json(medicalRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadDoctorCertificate,
  deleteDoctorCertificate,
  getDoctorCertificates,
  uploadProfilePicture,
  uploadMedicalRecord,
  uploadMultipleMedicalRecords,
  deleteMedicalRecord,
  getAppointmentMedicalRecords,
};
