const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Review = require('../models/Review');

// @desc  Get analytics data
// @route GET /api/analytics
// @access Private (admin, doctor)
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const isAdmin = req.user.role === 'admin';

    // Date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate)   dateFilter.$lte = new Date(endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const appointmentMatch = {};
    if (hasDateFilter) appointmentMatch.createdAt = dateFilter;

    // Doctors scope their own data only
    let doctorProfile = null;
    if (!isAdmin) {
      doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (!doctorProfile) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      appointmentMatch.doctorId = doctorProfile._id;
    }

    // ── Core counts ────────────────────────────────────────────────────────
    const [
      totalAppointments,
      pendingAppointments,
      approvedAppointments,
      completedAppointments,
      cancelledAppointments,
      rejectedAppointments,
    ] = await Promise.all([
      Appointment.countDocuments(appointmentMatch),
      Appointment.countDocuments({ ...appointmentMatch, status: 'pending' }),
      Appointment.countDocuments({ ...appointmentMatch, status: 'approved' }),
      Appointment.countDocuments({ ...appointmentMatch, status: 'completed' }),
      Appointment.countDocuments({ ...appointmentMatch, status: 'cancelled' }),
      Appointment.countDocuments({ ...appointmentMatch, status: 'rejected' }),
    ]);

    // ── Revenue: fee × completed appointments ──────────────────────────────
    const revenueAgg = await Appointment.aggregate([
      { $match: { ...appointmentMatch, status: 'completed' } },
      { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $group: { _id: null, total: { $sum: '$doctor.consultationFee' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // ── Total patients ─────────────────────────────────────────────────────
    const totalPatients = isAdmin
      ? await User.countDocuments({ role: 'patient' })
      : (await Appointment.distinct('patientId', appointmentMatch)).length;

    // ── Average rating ─────────────────────────────────────────────────────
    const ratingMatch = {};
    if (doctorProfile) ratingMatch.doctorId = doctorProfile._id;
    const ratingAgg = await Review.aggregate([
      { $match: { ...ratingMatch, isHidden: false } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    const averageRating = ratingAgg[0]?.avg
      ? Math.round(ratingAgg[0].avg * 10) / 10
      : 0;

    // ── Appointment trends (daily) ─────────────────────────────────────────
    const trendStart = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trendEnd = endDate ? new Date(endDate) : new Date();

    const trendAgg = await Appointment.aggregate([
      { $match: { ...appointmentMatch, createdAt: { $gte: trendStart, $lte: trendEnd } } },
      {
        $group: {
          _id:       { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total:     { $sum: 1 },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'approved'] },   1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trends = trendAgg.map((d) => ({
      date:         d._id,
      appointments: d.total,
      confirmed:    d.confirmed,
      completed:    d.completed,
      cancelled:    d.cancelled,
    }));

    // ── Status distribution (pie chart) ───────────────────────────────────
    const statusDistribution = [
      { name: 'Approved',  value: approvedAppointments,  color: '#10b981' },
      { name: 'Pending',   value: pendingAppointments,   color: '#f59e0b' },
      { name: 'Completed', value: completedAppointments, color: '#3b82f6' },
      { name: 'Cancelled', value: cancelledAppointments, color: '#ef4444' },
      { name: 'Rejected',  value: rejectedAppointments,  color: '#6b7280' },
    ].filter((s) => s.value > 0);

    // ── Revenue by day ────────────────────────────────────────────────────
    const revenueByDay = await Appointment.aggregate([
      {
        $match: {
          ...appointmentMatch,
          status: 'completed',
          createdAt: { $gte: trendStart, $lte: trendEnd },
        },
      },
      { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$doctor.consultationFee' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueData = revenueByDay.map((d) => ({ date: d._id, revenue: d.revenue }));

    // ── Peak booking hours ────────────────────────────────────────────────
    const peakHoursAgg = await Appointment.aggregate([
      { $match: appointmentMatch },
      { $group: { _id: { $substr: ['$timeSlot', 0, 2] }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const peakHours = peakHoursAgg.map((h) => ({
      hour:  `${parseInt(h._id, 10)}:00`,
      count: h.count,
    }));

    // ── Top doctors (admin only) ──────────────────────────────────────────
    let topDoctors = [];
    if (isAdmin) {
      const topDoctorsAgg = await Appointment.aggregate([
        { $match: appointmentMatch },
        { $group: { _id: '$doctorId', appointments: { $sum: 1 } } },
        { $sort: { appointments: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
        { $unwind: '$doctor' },
        { $lookup: { from: 'users', localField: 'doctor.userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
      ]);

      topDoctors = topDoctorsAgg.map((d) => ({
        name:           d.user.name,
        specialization: d.doctor.specialization,
        appointments:   d.appointments,
        rating:         d.doctor.averageRating || 0,
      }));
    }

    res.json({
      stats: {
        totalAppointments,
        approvedAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        averageRating,
        totalPatients,
      },
      trends,
      statusDistribution,
      revenueData,
      peakHours,
      topDoctors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
