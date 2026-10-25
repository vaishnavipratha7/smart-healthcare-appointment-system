require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const listDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const doctors = await Doctor.find().populate('userId', 'name email');
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found in database');
      console.log('\nRun: node seed.js to populate sample data');
    } else {
      console.log(`\n📋 Found ${doctors.length} doctors:\n`);
      doctors.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.userId?.name || 'N/A'} (${doc.userId?.email || 'N/A'})`);
        console.log(`   Specialization: ${doc.specialization} | Hospital: ${doc.hospital}`);
        console.log(`   Status: ${doc.status} | Active: ${doc.isActive ? '✅' : '❌'}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listDoctors();
