const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const {
  sendAppointmentConfirmation,
  sendAppointmentStatusUpdate,
} = require('../services/emailService');
const {
  notifyAppointmentStatusChange,
} = require('../services/socketService');

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

// @desc    Get doctor's appointments
// @route   GET /api/doctor/appointments
// @access  Private (Doctor)
const getDoctorAppointments = async (req, res) => {
  try {
    // Find doctor profile
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { status, page, limit } = req.query;
    const query = { doctorId: doctor._id };

    if (status) {
      query.status = status;
    }

    if (page || limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const appointments = await Appointment.find(query)
        .populate('patientId', 'name email phone')
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Appointment.countDocuments(query);

      return res.json({
        success: true,
        appointments,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      });
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve appointment
// @route   PUT /api/doctor/appointments/:id/approve
// @access  Private (Doctor)
const approveAppointment = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment belongs to this doctor
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to approve this appointment' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending appointments can be approved' });
    }

    appointment.status = 'approved';
    appointment.notes = req.body.notes || '';
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone');

    // Send approval confirmation email
    try {
      const patient = populatedAppointment.patientId;
      const doctorUser = await User.findById(req.user._id);

      const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Send confirmation to patient
      await sendAppointmentConfirmation(patient.email, {
        patientName: patient.name,
        doctorName: doctorUser.name,
        date: formattedDate,
        time: appointment.timeSlot,
        hospital: doctor.hospital,
        specialization: doctor.specialization,
      });

      // Send real-time notification to patient
      notifyAppointmentStatusChange(patient._id.toString(), {
        appointmentId: appointment._id,
        doctorName: doctorUser.name,
        status: 'approved',
        date: formattedDate,
        timeSlot: appointment.timeSlot,
      });

      console.log('✅ Approval confirmation email sent');
    } catch (emailError) {
      console.error('⚠️  Email notification failed:', emailError.message);
    }

    res.json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject appointment
// @route   PUT /api/doctor/appointments/:id/reject
// @access  Private (Doctor)
const rejectAppointment = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment belongs to this doctor
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this appointment' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending appointments can be rejected' });
    }

    appointment.status = 'rejected';
    appointment.rejectionReason = req.body.rejectionReason || '';
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone');

    // Send rejection email
    try {
      const patient = populatedAppointment.patientId;
      const doctorUser = await User.findById(req.user._id);

      const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await sendAppointmentStatusUpdate(patient.email, {
        patientName: patient.name,
        doctorName: doctorUser.name,
        status: 'rejected',
        date: formattedDate,
        time: appointment.timeSlot,
        rejectionReason: appointment.rejectionReason,
      });

      console.log('✅ Rejection email sent');
    } catch (emailError) {
      console.error('⚠️  Email notification failed:', emailError.message);
    }

    res.json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete appointment
// @route   PUT /api/doctor/appointments/:id/complete
// @access  Private (Doctor)
const completeAppointment = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment belongs to this doctor
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this appointment' });
    }

    if (appointment.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved appointments can be marked as completed' });
    }

    appointment.status = 'completed';
    appointment.notes = req.body.notes || appointment.notes;
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone');

    // Send completion email
    try {
      const patient = populatedAppointment.patientId;
      const doctorUser = await User.findById(req.user._id);

      const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await sendAppointmentStatusUpdate(patient.email, {
        patientName: patient.name,
        doctorName: doctorUser.name,
        status: 'completed',
        date: formattedDate,
        time: appointment.timeSlot,
      });

      console.log('✅ Completion email sent');
    } catch (emailError) {
      console.error('⚠️  Email notification failed:', emailError.message);
    }

    res.json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor profile
// @route   GET /api/doctor/profile
// @access  Private (Doctor)
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'name email phone');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctor/profile
// @access  Private (Doctor)
const updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { specialization, hospital, qualification, experience, consultationFee, availableSlots } = req.body;

    if (specialization) doctor.specialization = specialization;
    if (hospital) doctor.hospital = hospital;
    if (qualification) doctor.qualification = qualification;
    if (experience !== undefined) doctor.experience = experience;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (availableSlots) doctor.availableSlots = availableSlots;

    const updatedDoctor = await doctor.save();
    const populatedDoctor = await Doctor.findById(updatedDoctor._id).populate('userId', 'name email phone');

    res.json(populatedDoctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all approved doctors (Public)
// @route   GET /api/doctor/list
// @access  Public
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: 'approved', isActive: true })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    const doctorsWithSlots = doctors.map((doctor) => ({
      ...doctor.toObject(),
      availableSlots: doctor.availableSlots && doctor.availableSlots.length > 0 ? doctor.availableSlots : defaultAvailableSlots,
    }));

    res.json(doctorsWithSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search and filter doctors with advanced options
// @route   GET /api/doctor/search
// @access  Public
const searchDoctors = async (req, res) => {
  try {
    const {
      search,          // Search by name or hospital
      specialization,  // Filter by specialization
      hospital,        // Filter by hospital
      minFee,          // Minimum consultation fee
      maxFee,          // Maximum consultation fee
      minExperience,   // Minimum years of experience
      availableDay,    // Filter by available day (Monday, Tuesday, etc.)
      availableTime,   // Filter by available time slot (09:00, 10:00, etc.)
      sortBy,          // Sort field (fee, experience, name)
      sortOrder,       // Sort order (asc, desc)
      page,            // Page number for pagination
      limit,           // Results per page
    } = req.query;

    // Build query
    const query = { status: 'approved', isActive: true };

    // Text search on doctor name or hospital
    if (search) {
      const doctors = await Doctor.find(query).populate('userId', 'name');
      const doctorIds = doctors
        .filter((doc) => {
          const nameMatch = doc.userId.name.toLowerCase().includes(search.toLowerCase());
          const hospitalMatch = doc.hospital.toLowerCase().includes(search.toLowerCase());
          return nameMatch || hospitalMatch;
        })
        .map((doc) => doc._id);
      
      query._id = { $in: doctorIds };
    }

    // Filter by specialization (case-insensitive, partial match)
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    // Filter by hospital (case-insensitive, partial match)
    if (hospital) {
      query.hospital = { $regex: hospital, $options: 'i' };
    }

    // Filter by consultation fee range
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = Number(minFee);
      if (maxFee) query.consultationFee.$lte = Number(maxFee);
    }

    // Filter by experience
    if (minExperience) {
      query.experience = { $gte: Number(minExperience) };
    }

    // Filter by available day
    if (availableDay) {
      query['availableSlots.day'] = availableDay;
    }

    // Filter by available time (within any day)
    if (availableTime) {
      query['availableSlots.times'] = availableTime;
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default sort
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      
      switch (sortBy) {
        case 'fee':
          sortOptions = { consultationFee: order };
          break;
        case 'experience':
          sortOptions = { experience: order };
          break;
        case 'name':
          sortOptions = {}; // Will sort by populated name later
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    }

    // Execute query
    let doctors = await Doctor.find(query)
      .populate('userId', 'name email phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Sort by name if requested (after population)
    if (sortBy === 'name') {
      doctors.sort((a, b) => {
        const nameA = a.userId.name.toLowerCase();
        const nameB = b.userId.name.toLowerCase();
        const order = sortOrder === 'desc' ? -1 : 1;
        return nameA < nameB ? -order : nameA > nameB ? order : 0;
      });
    }

    // Add default slots if missing
    const doctorsWithSlots = doctors.map((doctor) => ({
      ...doctor.toObject(),
      availableSlots: doctor.availableSlots && doctor.availableSlots.length > 0 
        ? doctor.availableSlots 
        : defaultAvailableSlots,
    }));

    // Get total count for pagination
    const total = await Doctor.countDocuments(query);

    res.json({
      doctors: doctorsWithSlots,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unique specializations
// @route   GET /api/doctor/specializations
// @access  Public
const getSpecializations = async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization', {
      status: 'approved',
      isActive: true,
    });

    res.json(specializations.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unique hospitals
// @route   GET /api/doctor/hospitals
// @access  Public
const getHospitals = async (req, res) => {
  try {
    const hospitals = await Doctor.distinct('hospital', {
      status: 'approved',
      isActive: true,
    });

    res.json(hospitals.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor by ID (Public view)
// @route   GET /api/doctor/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.status !== 'approved' || !doctor.isActive) {
      return res.status(404).json({ message: 'Doctor not available' });
    }

    const doctorWithSlots = {
      ...doctor.toObject(),
      availableSlots: doctor.availableSlots && doctor.availableSlots.length > 0 
        ? doctor.availableSlots 
        : defaultAvailableSlots,
    };

    res.json(doctorWithSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check doctor availability for specific date and time
// @route   GET /api/doctor/:id/availability
// @access  Public
const checkDoctorAvailability = async (req, res) => {
  try {
    const { date, timeSlot } = req.query;

    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'Please provide date and timeSlot' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if doctor has this day/time in their schedule
    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });

    const daySlot = doctor.availableSlots?.find((slot) => slot.day === dayName);
    
    if (!daySlot || !daySlot.times.includes(timeSlot)) {
      return res.json({ 
        available: false, 
        reason: 'Doctor is not available at this time' 
      });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctorId: doctor._id,
      appointmentDate: new Date(date),
      timeSlot,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingAppointment) {
      return res.json({ 
        available: false, 
        reason: 'This time slot is already booked' 
      });
    }

    res.json({ 
      available: true,
      doctor: {
        name: doctor.userId?.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
  completeAppointment,
  getDoctorProfile,
  updateDoctorProfile,
  getAllDoctors,
  searchDoctors,
  getSpecializations,
  getHospitals,
  getDoctorById,
  checkDoctorAvailability,
};