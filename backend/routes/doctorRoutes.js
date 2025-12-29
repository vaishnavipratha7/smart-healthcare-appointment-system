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
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/list', getAllDoctors);
router.get('/appointments', protect, checkRole('doctor'), getDoctorAppointments);
router.put('/appointments/:id/approve', protect, checkRole('doctor'), approveAppointment);
router.put('/appointments/:id/reject', protect, checkRole('doctor'), rejectAppointment);
router.put('/appointments/:id/complete', protect, checkRole('doctor'), completeAppointment);
router.get('/profile', protect, checkRole('doctor'), getDoctorProfile);
router.put('/profile', protect, checkRole('doctor'), updateDoctorProfile);

module.exports = router;