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
        isEmailVerified: true, // ✅ Seed users skip verification
        isActive: true,
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
        isEmailVerified: true, // ✅ Seed users skip verification
        isActive: true,
      });
      console.log('✅ Sample patient created:', patient.email);
    } else {
      console.log('ℹ️  Sample patient already exists');
    }

    // Create sample doctor users for AI demo (all 10 specializations)
    const doctorData = [
      {
        name: 'Dr. Sarah Smith',
        email: 'doctor.cardiology@test.com',
        phone: '9876543210',
        specialization: 'Cardiology',
        hospital: 'City Heart Institute',
        qualification: 'MD Cardiology, MBBS',
        experience: 15,
        fee: 1000,
      },
      {
        name: 'Dr. Emily Johnson',
        email: 'doctor.dermatology@test.com',
        phone: '9876543211',
        specialization: 'Dermatology',
        hospital: 'Skin Care Clinic',
        qualification: 'MD Dermatology, MBBS',
        experience: 10,
        fee: 800,
      },
      {
        name: 'Dr. Michael Chen',
        email: 'doctor.neurology@test.com',
        phone: '9876543212',
        specialization: 'Neurology',
        hospital: 'Brain & Nerve Center',
        qualification: 'MD Neurology, DM',
        experience: 18,
        fee: 1200,
      },
      {
        name: 'Dr. Robert Williams',
        email: 'doctor.orthopedics@test.com',
        phone: '9876543213',
        specialization: 'Orthopedics',
        hospital: 'Bone & Joint Hospital',
        qualification: 'MS Orthopedics, MBBS',
        experience: 12,
        fee: 900,
      },
      {
        name: 'Dr. Jennifer Martinez',
        email: 'doctor.pediatrics@test.com',
        phone: '9876543214',
        specialization: 'Pediatrics',
        hospital: 'Children\'s Hospital',
        qualification: 'MD Pediatrics, MBBS',
        experience: 14,
        fee: 700,
      },
      {
        name: 'Dr. David Anderson',
        email: 'doctor.gastro@test.com',
        phone: '9876543215',
        specialization: 'Gastroenterology',
        hospital: 'Digestive Health Center',
        qualification: 'MD Gastroenterology, DM',
        experience: 16,
        fee: 1100,
      },
      {
        name: 'Dr. Lisa Brown',
        email: 'doctor.ophthalmology@test.com',
        phone: '9876543216',
        specialization: 'Ophthalmology',
        hospital: 'Eye Care Institute',
        qualification: 'MS Ophthalmology, MBBS',
        experience: 11,
        fee: 850,
      },
      {
        name: 'Dr. James Wilson',
        email: 'doctor.ent@test.com',
        phone: '9876543217',
        specialization: 'ENT',
        hospital: 'ENT Specialty Clinic',
        qualification: 'MS ENT, MBBS',
        experience: 13,
        fee: 750,
      },
      {
        name: 'Dr. Maria Garcia',
        email: 'doctor.psychiatry@test.com',
        phone: '9876543218',
        specialization: 'Psychiatry',
        hospital: 'Mental Health Center',
        qualification: 'MD Psychiatry, MBBS',
        experience: 9,
        fee: 1000,
      },
      {
        name: 'Dr. Thomas Lee',
        email: 'doctor.general@test.com',
        phone: '9876543219',
        specialization: 'General Medicine',
        hospital: 'City General Hospital',
        qualification: 'MBBS, MD',
        experience: 20,
        fee: 500,
      },
    ];

    const doctorUsers = [];
    for (const doc of doctorData) {
      const exists = await User.findOne({ email: doc.email });
      if (!exists) {
        const user = await User.create({
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          password: 'doctor123',
          role: 'doctor',
          isEmailVerified: true, // ✅ Seed users skip verification
          isActive: true,
        });
        doctorUsers.push({ user, ...doc });
        console.log(`✅ Doctor user created: ${user.email}`);
      } else {
        doctorUsers.push({ user: exists, ...doc });
        console.log(`ℹ️  Doctor user already exists: ${doc.email}`);
      }
    }

    // Create doctor profiles
    for (const docData of doctorUsers) {
      const profileExists = await Doctor.findOne({ userId: docData.user._id });
      if (!profileExists) {
        await Doctor.create({
          userId: docData.user._id,
          specialization: docData.specialization,
          hospital: docData.hospital,
          qualification: docData.qualification,
          experience: docData.experience,
          consultationFee: docData.fee,
          availableSlots: [
            { day: 'Monday', times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
            { day: 'Tuesday', times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
            { day: 'Wednesday', times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
            { day: 'Thursday', times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
            { day: 'Friday', times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
          ],
          status: 'approved',
        });
        console.log(`✅ ${docData.specialization} doctor profile created`);
      } else {
        console.log(`ℹ️  ${docData.specialization} doctor profile already exists`);
      }
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Admin: admin@healthcare.com / admin123');
    console.log('   Patient: patient@test.com / patient123');
    console.log('   Doctors: doctor.[specialization]@test.com / doctor123');
    console.log('   Example: doctor.cardiology@test.com / doctor123');
    console.log('\n✨ AI Integration Ready:');
    console.log('   - 10 doctors across all specializations');
    console.log('   - All users have email verification bypassed');
    console.log('   - Ready for AI symptom analysis testing');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
