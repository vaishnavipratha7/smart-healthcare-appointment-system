require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const resetPassword = async (email, newPassword) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    console.log('✅ Password reset successfully for:', email);
    console.log('👤 Name:', user.name);
    console.log('🎭 Role:', user.role);
    console.log('🔑 New password:', newPassword);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const email = process.argv[2];
const password = process.argv[3] || 'patient123';

if (!email) {
  console.log('Usage: node resetPassword.js <email> [password]');
  console.log('Example: node resetPassword.js patient@test.com newpass123');
  process.exit(1);
}

resetPassword(email, password);
