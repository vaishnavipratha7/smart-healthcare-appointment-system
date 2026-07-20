import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorService, reviewService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Star display (read-only) ──────────────────────────────────────────────────
const Stars = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={`text-lg ${s <= value ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
    ))}
    <span className="ml-1 text-sm text-gray-600">{value}/5</span>
  </div>
);

// ── Inline action panel shown below an appointment card ───────────────────────
// action: 'approve' | 'reject' | 'complete'
const AppointmentActionPanel = ({ action, onConfirm, onCancel }) => {
  const [text, setText] = useState('');

  const config = {
    approve: {
      label:       'Approve Appointment',
      placeholder: 'Add notes for the patient (optional)',
      btnLabel:    'Confirm Approval',
      btnClass:    'bg-green-500 hover:bg-green-600',
      required:    false,
    },
    reject: {
      label:       'Reject Appointment',
      placeholder: 'Reason for rejection (required)',
      btnLabel:    'Confirm Rejection',
      btnClass:    'bg-red-500 hover:bg-red-600',
      required:    true,
    },
    complete: {
      label:       'Complete Appointment',
      placeholder: 'Add consultation notes (optional)',
      btnLabel:    'Mark as Completed',
      btnClass:    'bg-blue-500 hover:bg-blue-600',
      required:    false,
    },
  }[action];

  const canSubmit = config.required ? text.trim().length > 0 : true;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{config.label}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder={config.placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {config.required && text.trim().length === 0 && (
        <p className="text-xs text-red-500 dark:text-red-400">A reason is required to reject.</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(text)}
          disabled={!canSubmit}
          className={`${config.btnClass} disabled:opacity-40 text-white px-4 py-2 rounded-md text-sm font-medium transition`}
        >
          {config.btnLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const { user } = useAuth();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [filter, setFilter]             = useState('all');
  const [activeTab, setActiveTab]       = useState('appointments');

  // Tracks which appointment card has an action panel open
  // { [appointmentId]: 'approve' | 'reject' | 'complete' | null }
  const [activeAction, setActiveAction] = useState({});

  // ── Profile edit state ──────────────────────────────────────────────────────
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm]         = useState({});
  const [slotDay, setSlotDay]                 = useState('Monday');
  const [startTime, setStartTime]             = useState('');
  const [endTime, setEndTime]                 = useState('');

  // ── Reviews state ───────────────────────────────────────────────────────────
  const [reviews, setReviews]               = useState([]);
  const [reviewStats, setReviewStats]       = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [respondingTo, setRespondingTo]     = useState(null);
  const [responseText, setResponseText]     = useState('');

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [appointmentsData, profileData] = await Promise.all([
        doctorService.getAppointments(),
        doctorService.getProfile(),
      ]);
      setAppointments(appointmentsData);
      setProfile(profileData);
      setProfileForm(profileData);
    } catch (err) {
      setError(err.response?.status === 404
        ? 'Doctor profile not found. Please contact admin.'
        : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ── Action panel helpers ─────────────────────────────────────────────────────
  const openAction = (appointmentId, action) => {
    setActiveAction({ [appointmentId]: action });
  };

  const closeAction = (appointmentId) => {
    setActiveAction((prev) => ({ ...prev, [appointmentId]: null }));
  };

  // ── Appointment actions ─────────────────────────────────────────────────────
  const handleApprove = async (id, notes) => {
    try {
      await doctorService.approveAppointment(id, notes);
      setSuccess('Appointment approved successfully');
      closeAction(id);
      fetchData();
    } catch (err) {
      setError('Failed to approve appointment');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await doctorService.rejectAppointment(id, reason);
      setSuccess('Appointment rejected');
      closeAction(id);
      fetchData();
    } catch (err) {
      setError('Failed to reject appointment');
    }
  };

  const handleComplete = async (id, notes) => {
    try {
      await doctorService.completeAppointment(id, notes);
      setSuccess('Appointment marked as completed');
      closeAction(id);
      fetchData();
    } catch (err) {
      setError('Failed to complete appointment');
    }
  };

  // ── Reviews ─────────────────────────────────────────────────────────────────
  const fetchReviews = async (doctorId) => {
    setReviewsLoading(true);
    try {
      const data = await reviewService.getDoctorReviews(doctorId);
      setReviews(data.reviews || []);
      if (data.statistics) {
        setReviewStats({
          averageRating: data.statistics.averageRating || 0,
          totalReviews:  data.statistics.totalReviews  || 0,
        });
      }
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'reviews' && reviews.length === 0 && profile) {
      fetchReviews(profile._id);
    }
  };

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) return;
    try {
      await reviewService.respond(reviewId, responseText.trim());
      setSuccess('Response submitted successfully');
      setRespondingTo(null);
      setResponseText('');
      if (profile) fetchReviews(profile._id);
    } catch (err) {
      setError('Failed to submit response');
    }
  };

  // ── Slot builder ─────────────────────────────────────────────────────────────
  const addSlot = () => {
    if (!startTime || !endTime) return;
    const times = [];
    let current = new Date(`1970-01-01T${startTime}:00`);
    const end   = new Date(`1970-01-01T${endTime}:00`);
    while (current.getTime() + 30 * 60000 <= end.getTime()) {
      times.push(current.toTimeString().slice(0, 5));
      current.setMinutes(current.getMinutes() + 30);
    }
    const updatedSlots = [...(profileForm.availableSlots || [])];
    const dayIndex = updatedSlots.findIndex((s) => s.day === slotDay);
    if (dayIndex >= 0) updatedSlots[dayIndex].times = times;
    else updatedSlots.push({ day: slotDay, times });
    setProfileForm({ ...profileForm, availableSlots: updatedSlots });
  };

  // ── Profile save ─────────────────────────────────────────────────────────────
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await doctorService.updateProfile(profileForm);
      setSuccess('Profile updated successfully');
      setShowProfileEdit(false);
      fetchData();
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getStatusColor = (status) => ({
    pending:   'bg-yellow-100 text-yellow-800',
    approved:  'bg-green-100 text-green-800',
    rejected:  'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }[status] || 'bg-gray-100 text-gray-800');

  const filteredAppointments = appointments.filter(
    (apt) => filter === 'all' || apt.status === filter
  );

  const stats = {
    total:     appointments.length,
    pending:   appointments.filter((a) => a.status === 'pending').length,
    approved:  appointments.filter((a) => a.status === 'approved').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200" data-testid="doctor-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Doctor Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome back, Dr. {user.name}!</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Appointments', value: stats.total,     color: 'text-gray-900 dark:text-white' },
            { label: 'Pending',            value: stats.pending,   color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Approved',           value: stats.approved,  color: 'text-green-600 dark:text-green-400' },
            { label: 'Completed',          value: stats.completed, color: 'text-blue-600 dark:text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</h3>
              <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Profile Section */}
        {profile && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">My Profile</h2>
              <button
                onClick={() => setShowProfileEdit(!showProfileEdit)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition"
              >
                {showProfileEdit ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {!showProfileEdit ? (
              <div className="grid md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                <div><strong>Specialization:</strong> {profile.specialization}</div>
                <div><strong>Hospital:</strong> {profile.hospital}</div>
                <div><strong>Qualification:</strong> {profile.qualification}</div>
                <div><strong>Experience:</strong> {profile.experience} years</div>
                <div><strong>Consultation Fee:</strong> ₹{profile.consultationFee}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    profile.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {profile.status}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'Specialization',     key: 'specialization',  type: 'text' },
                    { label: 'Hospital',            key: 'hospital',        type: 'text' },
                    { label: 'Qualification',       key: 'qualification',   type: 'text' },
                    { label: 'Experience (years)',  key: 'experience',      type: 'number' },
                    { label: 'Consultation Fee',    key: 'consultationFee', type: 'number' },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                      <input
                        type={type}
                        value={profileForm[key] || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          [key]: type === 'number' ? parseInt(e.target.value) : e.target.value,
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  ))}

                  {/* Availability slot builder */}
                  <div className="md:col-span-2 border-t dark:border-gray-600 pt-4 mt-2">
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Availability</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <select
                        value={slotDay}
                        onChange={(e) => setSlotDay(e.target.value)}
                        className="border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded"
                      >
                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded" />
                      <span className="self-center text-gray-500 dark:text-gray-400">to</span>
                      <input type="time" value={endTime}   onChange={(e) => setEndTime(e.target.value)}   className="border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded" />
                      <button type="button" onClick={addSlot} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition">
                        Add
                      </button>
                    </div>
                    {profileForm.availableSlots?.map((slot) => (
                      <p key={slot.day} className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>{slot.day}:</strong>{' '}
                        {slot.times.length > 0
                          ? `${slot.times[0]} – ${slot.times[slot.times.length - 1]} (${slot.times.length} slots)`
                          : 'No slots'}
                      </p>
                    ))}
                  </div>
                </div>

                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition">
                  Save Changes
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex space-x-1 mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-1 w-fit border dark:border-gray-700">
          {[
            { id: 'appointments', label: '🗓 Appointments' },
            { id: 'reviews',      label: `⭐ Reviews${reviewStats.totalReviews > 0 ? ` (${reviewStats.totalReviews})` : ''}` },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === id
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Appointments Tab ──────────────────────────────────────────────── */}
        {activeTab === 'appointments' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Appointments</h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                data-testid="filter-select"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {filteredAppointments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No appointments found.</p>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => {
                  const currentAction = activeAction[apt._id];
                  return (
                    <div key={apt._id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-md transition" data-testid="appointment-card">
                      <div className="flex justify-between items-start">
                        {/* Patient info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{apt.patientId?.name || 'N/A'}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                              {apt.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                            <p className="text-sm"><strong>Email:</strong> {apt.patientId?.email}</p>
                            <p className="text-sm"><strong>Phone:</strong> {apt.patientId?.phone}</p>
                            <p className="text-sm"><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                            <p className="text-sm"><strong>Time:</strong> {apt.timeSlot}</p>
                            <p className="text-sm"><strong>Reason:</strong> {apt.reason}</p>
                            {apt.notes && <p className="text-sm"><strong>Notes:</strong> {apt.notes}</p>}
                            {apt.rejectionReason && (
                              <p className="text-sm text-red-600 dark:text-red-400"><strong>Rejection Reason:</strong> {apt.rejectionReason}</p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons — shown only when no panel is open */}
                        {!currentAction && (
                          <div className="flex flex-col space-y-2 ml-4">
                            {apt.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => openAction(apt._id, 'approve')}
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm transition"
                                  data-testid="approve-btn"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => openAction(apt._id, 'reject')}
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition"
                                  data-testid="reject-btn"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {apt.status === 'approved' && (
                              <button
                                onClick={() => openAction(apt._id, 'complete')}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition"
                                data-testid="complete-btn"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inline action panel */}
                      {currentAction && (
                        <AppointmentActionPanel
                          action={currentAction}
                          onConfirm={(text) => {
                            if (currentAction === 'approve')  handleApprove(apt._id, text);
                            if (currentAction === 'reject')   handleReject(apt._id, text);
                            if (currentAction === 'complete') handleComplete(apt._id, text);
                          }}
                          onCancel={() => closeAction(apt._id)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Reviews Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Patient Reviews</h2>
              {profile && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-500">
                    ⭐ {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '—'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">⭐</p>
                <p className="text-gray-500 dark:text-gray-400">No reviews yet.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Reviews will appear here once patients complete appointments and leave feedback.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 rounded-lg p-5 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{review.patientId?.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <Stars value={review.rating} />
                    </div>

                    {review.comment && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
                    )}

                    {review.doctorResponse?.comment && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md px-4 py-3 mb-3">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Your response</p>
                        <p className="text-sm text-blue-800 dark:text-blue-300">{review.doctorResponse.comment}</p>
                        <p className="text-xs text-blue-400 mt-1">
                          {new Date(review.doctorResponse.respondedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {!review.doctorResponse?.comment && (
                      <>
                        {respondingTo !== review._id ? (
                          <button
                            onClick={() => { setRespondingTo(review._id); setResponseText(''); }}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
                          >
                            + Respond to this review
                          </button>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              maxLength={500}
                              placeholder="Write a professional response…"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespond(review._id)}
                                disabled={!responseText.trim()}
                                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                              >
                                Submit Response
                              </button>
                              <button
                                onClick={() => setRespondingTo(null)}
                                className="px-4 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default DoctorDashboard;
