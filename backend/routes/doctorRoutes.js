const express = require('express');
const router = express.Router();
const {
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
  completeAppointment,
  getDoctorProfile,
  updateDoctorProfile,
  getAllDoctors,
  searchDoctors,
  getSpecializations,
  getHospitals,
  getDoctorById,
  checkDoctorAvailability,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { validateDoctorSearch, validateUpdateDoctorProfile, validateMongoId } = require('../middleware/validators');

// Public routes
router.get('/list', getAllDoctors);
router.get('/search', validateDoctorSearch, searchDoctors);
router.get('/specializations', getSpecializations);
router.get('/hospitals', getHospitals);
router.get('/:id', validateMongoId('id'), getDoctorById);
router.get('/:id/availability', validateMongoId('id'), checkDoctorAvailability);

// Protected doctor routes
router.get('/appointments', protect, checkRole('doctor'), getDoctorAppointments);
router.put('/appointments/:id/approve', protect, checkRole('doctor'), validateMongoId('id'), approveAppointment);
router.put('/appointments/:id/reject', protect, checkRole('doctor'), validateMongoId('id'), rejectAppointment);
router.put('/appointments/:id/complete', protect, checkRole('doctor'), validateMongoId('id'), completeAppointment);
router.get('/profile', protect, checkRole('doctor'), getDoctorProfile);
router.put('/profile', protect, checkRole('doctor'), validateUpdateDoctorProfile, updateDoctorProfile);

module.exports = router;