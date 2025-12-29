require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Doctor.deleteMany({});
    // console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@healthcare.com' });
    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@healthcare.com',
        phone: '9999999999',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create sample patient
    const patientExists = await User.findOne({ email: 'patient@test.com' });
    if (!patientExists) {
      const patient = await User.create({
        name: 'John Patient',
        email: 'patient@test.com',
        phone: '1234567890',
        password: 'patient123',
        role: 'patient',
      });
      console.log('✅ Sample patient created:', patient.email);
    } else {
      console.log('ℹ️  Sample patient already exists');
    }

    // Create sample doctor user
    const doctorUserExists = await User.findOne({ email: 'doctor@test.com' });
    let doctorUser;
    if (!doctorUserExists) {
      doctorUser = await User.create({
        name: 'Dr. Sarah Smith',
        email: 'doctor@test.com',
        phone: '9876543210',
        password: 'doctor123',
        role: 'doctor',
      });
      console.log('✅ Sample doctor user created:', doctorUser.email);
    } else {
      doctorUser = doctorUserExists;
      console.log('ℹ️  Sample doctor user already exists');
    }

    // Create doctor profile
    const doctorProfileExists = await Doctor.findOne({ userId: doctorUser._id });
    if (!doctorProfileExists) {
      const doctorProfile = await Doctor.create({
        userId: doctorUser._id,
        specialization: 'Cardiology',
        hospital: 'City General Hospital',
        qualification: 'MD, MBBS',
        experience: 10,
        consultationFee: 500,
        availableSlots: [
          { day: 'Monday', times: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
          { day: 'Tuesday', times: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
          { day: 'Wednesday', times: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
          { day: 'Thursday', times: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
          { day: 'Friday', times: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
        ],
        status: 'approved',
      });
      console.log('✅ Doctor profile created');
    } else {
      console.log('ℹ️  Doctor profile already exists');
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Admin: admin@healthcare.com / admin123');
    console.log('   Patient: patient@test.com / patient123');
    console.log('   Doctor: doctor@test.com / doctor123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
