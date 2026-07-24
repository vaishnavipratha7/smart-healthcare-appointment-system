import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    userId: '',
    specialization: '',
    hospital: '',
    qualification: '',
    experience: '',
    consultationFee: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, usersData, doctorsData, appointmentsData] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers(),
        adminService.getAllDoctors(),
        adminService.getAllAppointments(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (id) => {
    try {
      await adminService.toggleUserStatus(id);
      setSuccess('User status updated');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminService.deleteUser(id);
      setSuccess('User deleted successfully');
      fetchData();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleApproveDoctor = async (id) => {
    try {
      await adminService.approveDoctor(id);
      setSuccess('Doctor approved');
      fetchData();
    } catch (err) {
      setError('Failed to approve doctor');
    }
  };

  const handleRejectDoctor = async (id) => {
    try {
      await adminService.rejectDoctor(id);
      setSuccess('Doctor rejected');
      fetchData();
    } catch (err) {
      setError('Failed to reject doctor');
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor profile?')) return;
    try {
      await adminService.deleteDoctor(id);
      setSuccess('Doctor profile deleted');
      fetchData();
    } catch (err) {
      setError('Failed to delete doctor');
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDoctor(doctorForm);
      setSuccess('Doctor profile created successfully');
      setShowCreateDoctor(false);
      setDoctorForm({ userId: '', specialization: '', hospital: '', qualification: '', experience: '', consultationFee: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create doctor profile');
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

const doctorUsers = users.filter(
    (u) =>
      u.role !== 'admin' &&
      !doctors.some((doc) => doc.userId?._id?.toString() === u._id?.toString())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome back, {user.name}!</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md">
            {success}
            <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {['stats', 'users', 'doctors', 'appointments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                data-testid={`tab-${tab}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{stats.totalPatients} patients</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Doctors</h3>
                <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 mt-2">{stats.totalDoctors}</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">{stats.pendingDoctors} pending approval</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Appointments</h3>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.totalAppointments}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{stats.pendingAppointments} pending</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Overview</h3>
              <div className="space-y-2 text-gray-900 dark:text-gray-100">
                <p>✅ <strong>Approved Appointments:</strong> {stats.approvedAppointments}</p>
                <p>⏳ <strong>Pending Appointments:</strong> {stats.pendingAppointments}</p>
                <p>👨‍⚕️ <strong>Active Doctors:</strong> {stats.totalDoctors - stats.pendingDoctors}</p>
                <p>👥 <strong>Active Patients:</strong> {stats.totalPatients}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((u) => (
                    <tr key={u._id} data-testid="user-row">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{u.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">{u.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className={`px-2 py-1 rounded ${u.isActive ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(u._id)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                          data-testid="toggle-status-btn"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            data-testid="delete-user-btn"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setShowCreateDoctor(!showCreateDoctor)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition"
                data-testid="create-doctor-btn"
              >
              {showCreateDoctor ? 'Cancel' : '+ Promote User to Doctor'}
            </button>
          </div>

            {showCreateDoctor && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Promote a Registered User to Doctor</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-4">
                  The user must already have an account. Select them below and fill in their professional details to grant doctor access.
                </p>
                <form onSubmit={handleCreateDoctor} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Doctor User</label>
                    <select
                      value={doctorForm.userId}
                      onChange={(e) => setDoctorForm({ ...doctorForm, userId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Choose a doctor user</option>
                      {doctorUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Specialization"
                      value={doctorForm.specialization}
                      onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Hospital"
                      value={doctorForm.hospital}
                      onChange={(e) => setDoctorForm({ ...doctorForm, hospital: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Qualification"
                      value={doctorForm.qualification}
                      onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      placeholder="Experience (years)"
                      value={doctorForm.experience}
                      onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      placeholder="Consultation Fee"
                      value={doctorForm.consultationFee}
                      onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition"
                  >
                    Create Profile
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Doctor Management</h2>
              <div className="space-y-4">
                {doctors.map((doc) => (
                  <div key={doc._id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4" data-testid="doctor-card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{doc.userId?.name || 'N/A'}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                            {doc.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="mt-2 grid md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <p><strong>Email:</strong> {doc.userId?.email}</p>
                          <p><strong>Phone:</strong> {doc.userId?.phone}</p>
                          <p><strong>Specialization:</strong> {doc.specialization}</p>
                          <p><strong>Hospital:</strong> {doc.hospital}</p>
                          <p><strong>Qualification:</strong> {doc.qualification}</p>
                          <p><strong>Experience:</strong> {doc.experience} years</p>
                          <p><strong>Fee:</strong> ₹{doc.consultationFee}</p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveDoctor(doc._id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm transition"
                              data-testid="approve-doctor-btn"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectDoctor(doc._id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition"
                              data-testid="reject-doctor-btn"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteDoctor(doc._id)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition"
                          data-testid="delete-doctor-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">All Appointments</h2>
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt._id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4" data-testid="appointment-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                          {apt.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 grid md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <p><strong>Patient:</strong> {apt.patientId?.name}</p>
                        <p><strong>Doctor:</strong> {apt.doctorId?.userId?.name}</p>
                        <p><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {apt.timeSlot}</p>
                        <p><strong>Reason:</strong> {apt.reason}</p>
                        <p><strong>Specialization:</strong> {apt.doctorId?.specialization}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;