const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const {
  sendAppointmentConfirmation,
  sendDoctorAppointmentRequest,
  sendAppointmentStatusUpdate,
} = require('../services/emailService');
const {
  notifyNewAppointment,
} = require('../services/socketService');

// @desc    Create new appointment (Patient)
// @route   POST /api/appointments
// @access  Private (Patient)
const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, reason } = req.body;

    // Check if doctor exists and is approved
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.status !== 'approved') {
      return res.status(400).json({ message: 'Doctor is not available for appointments' });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      appointmentDate,
      timeSlot,
      reason,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      });

    // Send email notifications
    try {
      // Get patient and doctor info
      const patient = await User.findById(req.user._id);
      const doctorUser = await User.findById(doctor.userId);

      // Format date for email
      const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Send notification to doctor
      await sendDoctorAppointmentRequest(doctorUser.email, {
        doctorName: doctorUser.name,
        patientName: patient.name,
        date: formattedDate,
        time: timeSlot,
        reason,
      });

      // Send real-time notification to doctor
      notifyNewAppointment(doctorUser._id.toString(), {
        appointmentId: appointment._id,
        patientName: patient.name,
        date: formattedDate,
        timeSlot,
        reason,
      });

      console.log('✅ Email notifications sent successfully');
    } catch (emailError) {
      console.error('⚠️  Email notification failed:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient's appointments
// @route   GET /api/appointments/my-appointments
// @access  Private (Patient)
const getMyAppointments = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const query = { patientId: req.user._id };

    if (status) {
      query.status = status;
    }

    if (page || limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const appointments = await Appointment.find(query)
        .populate({
          path: 'doctorId',
          populate: {
            path: 'userId',
            select: 'name email phone',
          },
        })
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
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name email phone',
        },
      })
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel appointment (Patient)
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Patient)
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment belongs to the patient
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel this appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      });

    // Send cancellation email
    try {
      const patient = populatedAppointment.patientId;
      const doctorUser = await User.findById(populatedAppointment.doctorId.userId);

      const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await sendAppointmentStatusUpdate(patient.email, {
        patientName: patient.name,
        doctorName: doctorUser.name,
        status: 'cancelled',
        date: formattedDate,
        time: appointment.timeSlot,
      });
    } catch (emailError) {
      console.error('⚠️  Email notification failed:', emailError.message);
    }

    res.json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check slot availability
// @route   GET /api/appointments/check-availability
// @access  Public
const checkAvailability = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot } = req.query;

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ message: 'Please provide doctorId, appointmentDate, and timeSlot' });
    }

    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: { $in: ['pending', 'approved'] },
    });

    res.json({ available: !existingAppointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  checkAvailability,
};