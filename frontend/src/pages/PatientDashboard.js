import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService, doctorService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import useDebounce from '../hooks/useDebounce';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchDoctors(debouncedSearch);
  }, [debouncedSearch]);

  const fetchData = async () => {
    try {
      const appointmentsData = await appointmentService.getMyAppointments();
      // Handle potential pagination wrapper if backend returned paginated object
      const apps = appointmentsData.appointments || appointmentsData;
      setAppointments(apps);
      await fetchDoctors();
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (searchVal = '') => {
    try {
      setIsSearching(true);
      if (searchVal) {
        const searchResult = await doctorService.search({ search: searchVal });
        setDoctors(searchResult.doctors || []);
      } else {
        const doctorsData = await doctorService.getAll();
        setDoctors(doctorsData);
      }
    } catch (err) {
      setError('Failed to load doctors');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDoctorSelect = (doctorId) => {
    const doctor = doctors.find((d) => d._id === doctorId);
    setSelectedDoctor(doctor);
    setFormData({ ...formData, doctorId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Check availability
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
      setSearchTerm('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    // Optimistically update local appointments state to 'cancelled'
    const originalAppointments = [...appointments];
    setAppointments((prev) =>
      prev.map((apt) => (apt._id === id ? { ...apt, status: 'cancelled' } : apt))
    );
    setSuccess('');
    setError('');

    try {
      await appointmentService.cancel(id);
      setSuccess('Appointment cancelled successfully');
    } catch (err) {
      // Rollback on failure
      setAppointments(originalAppointments);
      setError(err.response?.data?.message || 'Failed to cancel appointment');
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

  const getTodayDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="patient-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user.name}!</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md" data-testid="error-alert">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md" data-testid="success-alert">
            {success}
          </div>
        )}

        {/* Book Appointment Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowBooking(!showBooking)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md"
            data-testid="book-appointment-btn"
          >
            {showBooking ? 'Cancel Booking' : '+ Book New Appointment'}
          </button>
        </div>

        {/* Booking Form */}
        {showBooking && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8" data-testid="booking-form">
            <h2 className="text-2xl font-semibold mb-6">Book Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Doctor by Name/Hospital</label>
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="E.g. John Doe, City Hospital..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-2.5">
                      <svg className="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => handleDoctorSelect(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-semibold text-blue-900 mb-2">Doctor Details</h3>
                  <p className="text-sm text-blue-800"><strong>Qualification:</strong> {selectedDoctor.qualification}</p>
                  <p className="text-sm text-blue-800"><strong>Experience:</strong> {selectedDoctor.experience} years</p>
                  <p className="text-sm text-blue-800"><strong>Fee:</strong> ₹{selectedDoctor.consultationFee}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Date</label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  min={getTodayDate()}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  data-testid="date-input"
                />
              </div>
{selectedDoctor && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Time Slot
    </label>

    <select
      value={formData.timeSlot}
      onChange={(e) =>
        setFormData({ ...formData, timeSlot: e.target.value })
      }
      required
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <option value="">Choose a time slot</option>

      {Array.isArray(selectedDoctor.availableSlots) &&
      selectedDoctor.availableSlots.length > 0 ? (
        selectedDoctor.availableSlots.map((slot) =>
          slot.times.map((time) => (
            <option key={`${slot.day}-${time}`} value={time}>
              {slot.day} — {time}
            </option>
          ))
        )
      ) : (
        <option value="">No slots found</option>
      )}
    </select>
  </div>
)}


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
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">My Appointments</h2>
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No appointments found. Book your first appointment!</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition" data-testid="appointment-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{apt.doctorId?.userId?.name || 'N/A'}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                          {apt.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{apt.doctorId?.specialization} - {apt.doctorId?.hospital}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm"><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                        <p className="text-sm"><strong>Time:</strong> {apt.timeSlot}</p>
                        <p className="text-sm"><strong>Reason:</strong> {apt.reason}</p>
                        {apt.notes && <p className="text-sm"><strong>Notes:</strong> {apt.notes}</p>}
                        {apt.rejectionReason && <p className="text-sm text-red-600"><strong>Rejection Reason:</strong> {apt.rejectionReason}</p>}
                      </div>
                    </div>
                    <div>
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(apt._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition"
                          data-testid="cancel-appointment-btn"
                        >
                          Cancel
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

export default PatientDashboard;