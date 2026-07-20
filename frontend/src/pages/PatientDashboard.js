import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService, doctorService, reviewService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Inline star-rating component ─────────────────────────────────────────────
const StarRating = ({ value, onChange, readOnly = false }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => !readOnly && onChange(star)}
        className={`text-2xl focus:outline-none transition-colors ${
          readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
        } ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
        aria-label={`${star} star`}
      >
        ★
      </button>
    ))}
  </div>
);

// ── Inline review form for a single completed appointment ─────────────────────
const ReviewForm = ({ appointment, onSubmitted }) => {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await reviewService.create({
        appointmentId: appointment._id,
        doctorId:      appointment.doctorId._id,
        rating,
        comment,
      });
      onSubmitted(appointment._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 pt-4 border-t border-gray-100 space-y-3"
    >
      <p className="text-sm font-medium text-gray-700">Leave a Review</p>

      <StarRating value={rating} onChange={setRating} />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Share your experience (optional)"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showBooking, setShowBooking]   = useState(false);
  const [formData, setFormData]         = useState({
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
  });
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Track which completed appointments have already been reviewed this session
  // (keyed by appointment._id → true once submitted)
  const [reviewed, setReviewed]         = useState({});

  // Track which appointments have the review form open
  const [reviewOpen, setReviewOpen]     = useState({});

  // Patient's own submitted reviews keyed by appointmentId
  const [myReviews, setMyReviews]       = useState({});

  // AI Symptom Analysis states
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [appointmentsData, reviewsData] = await Promise.all([
        appointmentService.getMyAppointments(),
        reviewService.getMyReviews(),
      ]);
      const apps = appointmentsData.appointments || appointmentsData;
      setAppointments(apps);

      // Build a map of appointmentId → review for quick lookup
      const reviewMap = {};
      (reviewsData || []).forEach((r) => {
        reviewMap[r.appointmentId?._id || r.appointmentId] = r;
      });
      setMyReviews(reviewMap);

      await fetchDoctors();
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const doctorsData = await doctorService.getAll();
      setDoctors(doctorsData);
    } catch (err) {
      setError('Failed to load doctors');
    }
  };

  const handleDoctorSelect = (doctorId) => {
    const doctor = doctors.find((d) => d._id === doctorId);
    setSelectedDoctor(doctor);
    setFormData({ ...formData, doctorId, timeSlot: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const availability = await appointmentService.checkAvailability(
        formData.doctorId,
        formData.appointmentDate,
        formData.timeSlot
      );
      if (!availability.available) {
        setError('This time slot is already booked. Please choose another.');
        return;
      }
      await appointmentService.create(formData);
      setSuccess('Appointment booked successfully!');
      setShowBooking(false);
      setFormData({ doctorId: '', appointmentDate: '', timeSlot: '', reason: '' });
      setSelectedDoctor(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    const original = [...appointments];
    setAppointments((prev) =>
      prev.map((apt) => (apt._id === id ? { ...apt, status: 'cancelled' } : apt))
    );
    setSuccess('');
    setError('');
    try {
      await appointmentService.cancel(id);
      setSuccess('Appointment cancelled successfully');
    } catch (err) {
      setAppointments(original);
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  // Called by ReviewForm once a review is successfully submitted
  const handleReviewSubmitted = (appointmentId, reviewData) => {
    setReviewed((prev) => ({ ...prev, [appointmentId]: true }));
    setReviewOpen((prev) => ({ ...prev, [appointmentId]: false }));
    setSuccess('Review submitted — thank you!');
    // Refresh reviews so the submitted review appears immediately
    reviewService.getMyReviews().then((data) => {
      const reviewMap = {};
      (data || []).forEach((r) => {
        reviewMap[r.appointmentId?._id || r.appointmentId] = r;
      });
      setMyReviews(reviewMap);
    }).catch(() => {});
  };

  const toggleReviewForm = (appointmentId) => {
    setReviewOpen((prev) => ({ ...prev, [appointmentId]: !prev[appointmentId] }));
  };

  // AI Symptom Analysis handler
  const handleAnalyzeSymptoms = async () => {
    if (!symptoms || symptoms.trim().length < 10) {
      setAiError('Please provide more detailed symptoms (at least 10 characters)');
      return;
    }

    setAiError('');
    setAiAnalyzing(true);
    setAiRecommendation(null);

    try {
      const response = await fetch('http://localhost:5000/api/ai/recommend-specialization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms: symptoms.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze symptoms');
      }

      if (data.success) {
        setAiRecommendation(data);
        // Pre-fill the reason field with symptoms if user wants to book
        setFormData({ ...formData, reason: symptoms.trim() });
      } else {
        setAiError(data.message || 'Failed to get recommendation');
      }
    } catch (err) {
      setAiError(err.message || 'AI service is currently unavailable. Please try again later.');
      console.error('AI Analysis Error:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSelectAIDoctorAndBook = (doctorId) => {
    setShowBooking(true);
    handleDoctorSelect(doctorId);
    // Scroll to booking form
    setTimeout(() => {
      document.querySelector('[data-testid="booking-form"]')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending:   'bg-yellow-100 text-yellow-800',
      approved:  'bg-green-100 text-green-800',
      rejected:  'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTodayDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm   = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd   = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200" data-testid="patient-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patient Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome back, {user.name}!</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md" data-testid="error-alert">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md" data-testid="success-alert">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => {
              setShowAIAssistant(!showAIAssistant);
              if (showAIAssistant) {
                setAiRecommendation(null);
                setSymptoms('');
                setAiError('');
              }
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md"
            data-testid="ai-assistant-btn"
          >
            {showAIAssistant ? 'Close AI Assistant' : '🤖 AI Symptom Analyzer'}
          </button>
          <button
            onClick={() => setShowBooking(!showBooking)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md"
            data-testid="book-appointment-btn"
          >
            {showBooking ? 'Cancel Booking' : '+ Book New Appointment'}
          </button>
        </div>

        {/* AI Symptom Assistant */}
        {showAIAssistant && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-6 mb-8 border-2 border-blue-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🤖</span>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">AI-Powered Symptom Analyzer</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Describe your symptoms to get specialist recommendations</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What symptoms are you experiencing?
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Example: I have severe chest pain and shortness of breath when I exercise..."
                  data-testid="symptoms-input"
                  disabled={aiAnalyzing}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Please be as detailed as possible (minimum 10 characters)
                </p>
              </div>

              {aiError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                  {aiError}
                </div>
              )}

              <button
                onClick={handleAnalyzeSymptoms}
                disabled={aiAnalyzing || !symptoms.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition shadow-md"
                data-testid="analyze-btn"
              >
                {aiAnalyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Analyzing Symptoms...
                  </span>
                ) : (
                  '🔍 Analyze Symptoms'
                )}
              </button>

              {/* AI Recommendation Results */}
              {aiRecommendation && (
                <div className="mt-6 space-y-4">
                  {/* Recommended Specialization Card */}
                  <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-600">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🏥</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          Recommended Specialization
                        </h3>
                        <p className="text-2xl font-bold text-blue-600 mb-2">
                          {aiRecommendation.specialization}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-gray-600">Confidence:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5 max-w-xs">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all"
                              style={{ width: `${(aiRecommendation.confidence * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-blue-600">
                            {(aiRecommendation.confidence * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Disclaimer */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3">
                          <p className="text-xs text-yellow-800 flex items-start gap-2">
                            <span className="text-lg">⚠️</span>
                            <span>{aiRecommendation.disclaimer}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Doctors */}
                  {aiRecommendation.doctors && aiRecommendation.doctors.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-5">
                      <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                        <span>👨‍⚕️</span>
                        Available {aiRecommendation.specialization} Specialists ({aiRecommendation.doctorCount})
                      </h3>
                      <div className="space-y-3">
                        {aiRecommendation.doctors.slice(0, 5).map((doctor) => (
                          <div
                            key={doctor._id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  Dr. {doctor.userId?.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {doctor.specialization} • {doctor.hospital}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-gray-600">
                                    <strong>Experience:</strong> {doctor.experience} years
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    <strong>Qualification:</strong> {doctor.qualification}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    <strong>Fee:</strong> ₹{doctor.consultationFee}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleSelectAIDoctorAndBook(doctor._id)}
                                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap"
                              >
                                Book Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {aiRecommendation.doctors.length > 5 && (
                        <p className="text-sm text-gray-500 text-center mt-3">
                          And {aiRecommendation.doctors.length - 5} more specialists available
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        {aiRecommendation.message || `No ${aiRecommendation.specialization} specialists currently available. Please try booking manually or contact support.`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Booking Form */}
        {showBooking && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border dark:border-gray-700" data-testid="booking-form">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Book Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Doctor</label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => handleDoctorSelect(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  data-testid="doctor-select"
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.userId.name} - {doctor.specialization} ({doctor.hospital})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDoctor && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Doctor Details</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300"><strong>Qualification:</strong> {selectedDoctor.qualification}</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300"><strong>Experience:</strong> {selectedDoctor.experience} years</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300"><strong>Fee:</strong> ₹{selectedDoctor.consultationFee}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appointment Date</label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, appointmentDate: e.target.value, timeSlot: '' })
                  }
                  min={getTodayDate()}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  data-testid="date-input"
                />
              </div>

              {selectedDoctor && formData.appointmentDate && (() => {
                const [yyyy, mm, dd] = formData.appointmentDate.split('-').map(Number);
                const pickedDay = new Date(yyyy, mm - 1, dd).toLocaleDateString('en-US', { weekday: 'long' });
                const daySlot = Array.isArray(selectedDoctor.availableSlots)
                  ? selectedDoctor.availableSlots.find((s) => s.day === pickedDay)
                  : null;
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Slot <span className="text-gray-400 font-normal">({pickedDay})</span>
                    </label>
                    {daySlot && daySlot.times.length > 0 ? (
                      <select
                        value={formData.timeSlot}
                        onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Choose a time slot</option>
                        {daySlot.times.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md">
                        Dr. {selectedDoctor.userId.name} is not available on {pickedDay}s. Please pick a different date.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe your symptoms or reason for consultation"
                  data-testid="reason-input"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-md font-semibold transition"
                data-testid="submit-booking-btn"
              >
                Book Appointment
              </button>
            </form>
          </div>
        )}

        {/* Appointments List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">My Appointments</h2>
          {appointments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No appointments found. Book your first appointment!
            </p>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt._id}
                  className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-md transition"
                  data-testid="appointment-card"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {apt.doctorId?.userId?.name || 'N/A'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                          {apt.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {apt.doctorId?.specialization} - {apt.doctorId?.hospital}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Time:</strong> {apt.timeSlot}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Reason:</strong> {apt.reason}</p>
                        {apt.notes && (
                          <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Notes:</strong> {apt.notes}</p>
                        )}
                        {apt.rejectionReason && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>Rejection Reason:</strong> {apt.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(apt._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition"
                          data-testid="cancel-appointment-btn"
                        >
                          Cancel
                        </button>
                      )}

                      {/* Review button — only for completed appointments not yet reviewed */}
                      {apt.status === 'completed' && !reviewed[apt._id] && !myReviews[apt._id] && (
                        <button
                          onClick={() => toggleReviewForm(apt._id)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition border ${
                            reviewOpen[apt._id]
                              ? 'bg-gray-100 border-gray-300 text-gray-700'
                              : 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100'
                          }`}
                        >
                          {reviewOpen[apt._id] ? 'Cancel Review' : '⭐ Leave a Review'}
                        </button>
                      )}

                      {/* Already reviewed badge */}
                      {apt.status === 'completed' && (reviewed[apt._id] || myReviews[apt._id]) && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          ✓ Reviewed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Show submitted review + doctor response */}
                  {apt.status === 'completed' && myReviews[apt._id] && (() => {
                    const review = myReviews[apt._id];
                    return (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        {/* Patient's review */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Your review:</span>
                          <span className="text-yellow-400">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                        )}

                        {/* Doctor's response */}
                        {review.doctorResponse?.comment ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-md px-4 py-3 mt-2">
                            <p className="text-xs font-semibold text-blue-700 mb-1">
                              Dr. {apt.doctorId?.userId?.name} replied:
                            </p>
                            <p className="text-sm text-blue-800">{review.doctorResponse.comment}</p>
                            <p className="text-xs text-blue-400 mt-1">
                              {new Date(review.doctorResponse.respondedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No reply from doctor yet.</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Inline review form — shown when open and not yet submitted */}
                  {apt.status === 'completed' && reviewOpen[apt._id] && !reviewed[apt._id] && (
                    <ReviewForm
                      appointment={apt}
                      onSubmitted={handleReviewSubmitted}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;
