const express = require('express');
const router = express.Router();
const { registerUser, loginUser, bookAppointment, checkAvailability } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/book', bookAppointment);
router.get('/checkAvailability', checkAvailability);

module.exports = router;