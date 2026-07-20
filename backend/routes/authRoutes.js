const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  refresh,
  logout,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateResendOtp,
  validateForgotPassword,
  validateResetPassword,
} = require('../middleware/validators');

router.post('/register', validateRegister, register);
router.post('/verify-otp', validateVerifyOtp, verifyOTP);
router.post('/resend-otp', validateResendOtp, resendOTP);
router.post('/login', validateLogin, login);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, resetPassword);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;