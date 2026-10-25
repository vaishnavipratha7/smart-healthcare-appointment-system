require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const verifyUserByEmail = async (email) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    if (user.isEmailVerified) {
      console.log('✅ User already verified:', email);
      process.exit(0);
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    console.log('✅ User verified successfully:', email);
    console.log('👤 Name:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🎭 Role:', user.role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const email = process.argv[2];
if (!email) {
  console.log('Usage: node verifyUser.js <email>');
  process.exit(1);
}

verifyUserByEmail(email);
