const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');
const { shouldRequireEmailVerification } = require('../utils/authConfig');

const defaultAvailableSlots = [
  {
    day: 'Monday',
    times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
  },
  {
    day: 'Tuesday',
    times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
  },
  {
    day: 'Wednesday',
    times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
  },
  {
    day: 'Thursday',
    times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
  },
  {
    day: 'Friday',
    times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
  },
];

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (id) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh`;
  return jwt.sign({ id }, refreshSecret, {
    expiresIn: '7d',
  });
};

const sendRefreshTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    secure: isProd,                          // must be true when sameSite is 'none'
    sameSite: isProd ? 'none' : 'lax',        // 'lax' is fine for same-origin local dev
  };
  res.cookie('refreshToken', token, cookieOptions);
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, specialization, hospital, qualification, experience, consultationFee } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const allowedRoles = ['patient', 'doctor'];
    const userRole = allowedRoles.includes(role) ? role : 'patient';

    if (userRole === 'doctor') {
      if (!specialization || !hospital || !qualification || experience === undefined || consultationFee === undefined) {
        return res.status(400).json({ message: 'Please provide all required doctor profile details' });
      }
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: userRole,
      isEmailVerified: false,
      otp,
      otpExpires,
    });

    let doctorProfile = null;
    if (userRole === 'doctor') {
      doctorProfile = await Doctor.create({
        userId: user._id,
        specialization,
        hospital,
        qualification,
        experience,
        consultationFee,
        status: 'pending',
        isActive: true,
        availableSlots: defaultAvailableSlots,
      });
    }

    const requiresVerification = shouldRequireEmailVerification();
    const successMessage = requiresVerification
      ? 'Registration successful. Please check your email for a verification code.'
      : 'Registration successful. Your account is ready to use.';

    res.status(201).json({
      success: true,
      message: successMessage,
      email: user.email,
      doctorProfile,
      requiresVerification,
    });

    // Send OTP in the background so the browser does not wait on the SMTP handshake
    sendOTPEmail(user.email, { name: user.name, otp })
  .then((result) => {
    if (result.success) {
      console.log('✅ OTP email sent');
    } else {
      console.error('❌ OTP email failed:', result.error);
    }
  })
  .catch((emailError) => {
    console.error('❌ OTP email failed:', emailError.message);
  });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ userId: user._id });
    }

    // Send welcome email now that the account is verified
    try {
      await sendWelcomeEmail(user.email, {
        name: user.name,
        role: user.role,
      });
      console.log('✅ Welcome email sent');
    } catch (emailError) {
      console.error('⚠️  Welcome email failed:', emailError.message);
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    sendRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      message: 'Email verified successfully',
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      doctorProfile,
      token: accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    res.json({ success: true, message: 'A new verification code has been sent to your email' });

    sendOTPEmail(user.email, { name: user.name, otp })
  .then((result) => {
    if (result.success) {
      console.log('✅ OTP email sent');
    } else {
      console.error('❌ OTP email failed:', result.error);
    }
  })
  .catch((emailError) => {
    console.error('❌ OTP email failed:', emailError.message);
  });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Your account has been deactivated' });
    }

    // Check if email is verified
    if (!user.isEmailVerified && shouldRequireEmailVerification()) {
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // If user is a doctor, get doctor profile
    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ userId: user._id });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    sendRefreshTokenCookie(res, refreshToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      doctorProfile: doctorProfile,
      token: accessToken,
      requiresVerification: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return the same response, whether or not the user exists,
    // so this endpoint can't be used to enumerate registered emails
    const genericResponse = {
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${rawToken}`;

    res.json(genericResponse);

    sendPasswordResetEmail(user.email, { name: user.name, resetUrl })
      .then(() => console.log('✅ Password reset email sent'))
      .catch((emailError) => console.error('⚠️  Password reset email failed:', emailError.message));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one' });
    }

    user.password = password; // pre('save') hook re-hashes this
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please log in with your new password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ userId: user._id });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      doctorProfile: doctorProfile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = req.body.email;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found' });
  }

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh`;
    const decoded = jwt.verify(refreshToken, refreshSecret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'User account is deactivated' });
    }

    const accessToken = generateAccessToken(user._id);

    res.json({
      success: true,
      token: accessToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
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
};