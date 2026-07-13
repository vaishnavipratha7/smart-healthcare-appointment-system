const express = require('express');
const router = express.Router();
const {
  uploadDoctorCertificate,
  deleteDoctorCertificate,
  getDoctorCertificates,
  uploadProfilePicture,
  uploadMedicalRecord,
  uploadMultipleMedicalRecords,
  deleteMedicalRecord,
  getAppointmentMedicalRecords,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// Doctor certificate routes
router.post(
  '/doctor/certificate',
  checkRole('doctor'),
  uploadSingle('certificate'),
  uploadDoctorCertificate
);
router.get('/doctor/certificates', checkRole('doctor'), getDoctorCertificates);
router.delete('/doctor/certificate/:filename', checkRole('doctor'), deleteDoctorCertificate);

// Profile picture routes (all authenticated users)
router.post('/profile-picture', uploadSingle('profilePicture'), uploadProfilePicture);

// Medical record routes (patient and doctor)
router.post(
  '/appointment/:appointmentId/medical-record',
  uploadSingle('medicalRecord'),
  uploadMedicalRecord
);
router.post(
  '/appointment/:appointmentId/medical-records',
  uploadMultiple('medicalRecord', 5),
  uploadMultipleMedicalRecords
);
router.get('/appointment/:appointmentId/medical-records', getAppointmentMedicalRecords);
router.delete(
  '/appointment/:appointmentId/medical-record/:filename',
  deleteMedicalRecord
);

module.exports = router;
