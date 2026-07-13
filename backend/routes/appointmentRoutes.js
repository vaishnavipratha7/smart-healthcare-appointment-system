const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  checkAvailability,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { validateCreateAppointment, validateAvailabilityCheck, validateMongoId } = require('../middleware/validators');

router.get('/check-availability', validateAvailabilityCheck, checkAvailability);
router.post('/', protect, checkRole('patient'), validateCreateAppointment, createAppointment);
router.get('/my-appointments', protect, checkRole('patient'), getMyAppointments);
router.put('/:id/cancel', protect, checkRole('patient'), validateMongoId('id'), cancelAppointment);

module.exports = router;