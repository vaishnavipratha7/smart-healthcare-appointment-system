import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({});
const [slotDay, setSlotDay] = useState('Monday');
const [startTime, setStartTime] = useState('');
const [endTime, setEndTime] = useState('');


  useEffect(() => {
    fetchData();
  }, []);

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
      if (err.response?.status === 404) {
        setError('Doctor profile not found. Please contact admin.');
      } else {
        setError('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const notes = prompt('Add notes (optional):');
    try {
      await doctorService.approveAppointment(id, notes || '');
      setSuccess('Appointment approved successfully');
      fetchData();
    } catch (err) {
      setError('Failed to approve appointment');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    try {
      await doctorService.rejectAppointment(id, reason);
      setSuccess('Appointment rejected');
      fetchData();
    } catch (err) {
      setError('Failed to reject appointment');
    }
  };

 const addSlot = () => {
  if (!startTime || !endTime) return;

  const times = [];
  let current = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);

  while (current.getTime() + 30 * 60000 <= end.getTime()) {
    times.push(current.toTimeString().slice(0, 5));
    current.setMinutes(current.getMinutes() + 30);
  }

  const updatedSlots = [...(profileForm.availableSlots || [])];
  const dayIndex = updatedSlots.findIndex(s => s.day === slotDay);

  if (dayIndex >= 0) {
    updatedSlots[dayIndex].times = times;
  } else {
    updatedSlots.push({ day: slotDay, times });
  }

  setProfileForm({ ...profileForm, availableSlots: updatedSlots });
};



  const handleComplete = async (id) => {
    const notes = prompt('Add consultation notes (optional):');
    try {
      await doctorService.completeAppointment(id, notes || '');
      setSuccess('Appointment marked as completed');
      fetchData();
    } catch (err) {
      setError('Failed to complete appointment');
    }
  };

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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    approved: appointments.filter((a) => a.status === 'approved').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="doctor-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, Dr. {user.name}!</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">Total Appointments</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">Approved</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.completed}</p>
          </div>
        </div>

        {/* Profile Section */}
        {profile && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-semibold">My Profile</h2>
              <button
                onClick={() => setShowProfileEdit(!showProfileEdit)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition"
              >
                {showProfileEdit ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {!showProfileEdit ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div><strong>Specialization:</strong> {profile.specialization}</div>
                <div><strong>Hospital:</strong> {profile.hospital}</div>
                <div><strong>Qualification:</strong> {profile.qualification}</div>
                <div><strong>Experience:</strong> {profile.experience} years</div>
                <div><strong>Consultation Fee:</strong> ₹{profile.consultationFee}</div>
                <div><strong>Status:</strong> <span className={`px-2 py-1 rounded ${profile.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{profile.status}</span></div>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                    <input
                      type="text"
                      value={profileForm.specialization || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                    <input
                      type="text"
                      value={profileForm.hospital || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, hospital: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={profileForm.qualification || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                    <input
                      type="number"
                      value={profileForm.experience || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, experience: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label>
                    <input
                      type="number"
                      value={profileForm.consultationFee || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, consultationFee: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {/* Availability Section */}
<div className="border-t pt-4 mt-4">
  <h3 className="font-semibold mb-2">Availability</h3>

  <div className="flex gap-2 mb-2">
    <select
      value={slotDay}
      onChange={(e) => setSlotDay(e.target.value)}
      className="border px-2 py-1 rounded"
    >
      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        .map(d => <option key={d}>{d}</option>)}
    </select>

   <input
  type="time"
  value={startTime}
  onChange={(e) => setStartTime(e.target.value)}
  className="border px-2 py-1 rounded"
/>

<input
  type="time"
  value={endTime}
  onChange={(e) => setEndTime(e.target.value)}
  className="border px-2 py-1 rounded"
/>


    <button
      type="button"
      onClick={addSlot}
      className="bg-blue-500 text-white px-3 rounded"
    >
      Add
    </button>
  </div>

  {profileForm.availableSlots?.map(slot => (
    <p>
  <strong>{slot.day}:</strong>{' '}
  {slot.times.length > 0 &&
    `${slot.times[0]} – ${slot.times[slot.times.length - 1]}`}
</p>

  ))}
</div>

                </div>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition"
                >
                  Save Changes
                </button>
              </form>
            )}
          </div>
        )}

        {/* Appointments */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Appointments</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <p className="text-gray-500 text-center py-8">No appointments found.</p>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <div key={apt._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition" data-testid="appointment-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{apt.patientId?.name || 'N/A'}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                          {apt.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm"><strong>Email:</strong> {apt.patientId?.email}</p>
                        <p className="text-sm"><strong>Phone:</strong> {apt.patientId?.phone}</p>
                        <p className="text-sm"><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                        <p className="text-sm"><strong>Time:</strong> {apt.timeSlot}</p>
                        <p className="text-sm"><strong>Reason:</strong> {apt.reason}</p>
                        {apt.notes && <p className="text-sm"><strong>Notes:</strong> {apt.notes}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {apt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(apt._id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm transition"
                            data-testid="approve-btn"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(apt._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition"
                            data-testid="reject-btn"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {apt.status === 'approved' && (
                        <button
                          onClick={() => handleComplete(apt._id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition"
                          data-testid="complete-btn"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;