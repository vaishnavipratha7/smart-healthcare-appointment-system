require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const users = await User.find().select('name email role isEmailVerified createdAt').limit(20);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`\n📋 Found ${users.length} users:\n`);
      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role} | Verified: ${user.isEmailVerified ? '✅' : '❌'} | Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listUsers();
