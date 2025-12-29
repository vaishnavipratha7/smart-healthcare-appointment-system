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

router.get('/check-availability', checkAvailability);
router.post('/', protect, checkRole('patient'), createAppointment);
router.get('/my-appointments', protect, checkRole('patient'), getMyAppointments);
router.put('/:id/cancel', protect, checkRole('patient'), cancelAppointment);

module.exports = router;