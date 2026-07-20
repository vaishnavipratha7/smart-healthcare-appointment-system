import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [dateRange, setDateRange] = useState('30');

  const [stats, setStats] = useState({
    totalAppointments:    0,
    confirmedAppointments: 0,
    pendingAppointments:  0,
    cancelledAppointments: 0,
    completedAppointments: 0,
    totalRevenue:         0,
    averageRating:        0,
    totalPatients:        0,
  });
  const [appointmentTrends, setAppointmentTrends] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [revenueData, setRevenueData]   = useState([]);
  const [topDoctors, setTopDoctors]     = useState([]);
  const [peakHours, setPeakHours]       = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const endDate   = new Date();
      const startDate = subDays(endDate, parseInt(dateRange, 10));

      const response = await api.get('/analytics', {
        params: {
          startDate: startDate.toISOString(),
          endDate:   endDate.toISOString(),
        },
      });

      const data = response.data;

      setStats({
        totalAppointments:    data.stats.totalAppointments    || 0,
        confirmedAppointments: data.stats.approvedAppointments || 0,
        pendingAppointments:  data.stats.pendingAppointments  || 0,
        cancelledAppointments: data.stats.cancelledAppointments || 0,
        completedAppointments: data.stats.completedAppointments || 0,
        totalRevenue:         data.stats.totalRevenue         || 0,
        averageRating:        data.stats.averageRating        || 0,
        totalPatients:        data.stats.totalPatients        || 0,
      });

      // Format date labels for readability in charts
      setAppointmentTrends(
        (data.trends || []).map((d) => ({
          ...d,
          date: format(new Date(d.date), 'MMM dd'),
        }))
      );
      setStatusDistribution(data.statusDistribution || []);
      setRevenueData(
        (data.revenueData || []).map((d) => ({
          ...d,
          date: format(new Date(d.date), 'MMM dd'),
        }))
      );
      setPeakHours(data.peakHours || []);
      setTopDoctors(data.topDoctors || []);
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Comprehensive insights and performance metrics</p>
          </div>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Appointments"
            value={stats.totalAppointments}
            color="text-blue-600"
            icon={
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Confirmed"
            value={stats.confirmedAppointments}
            color="text-green-600"
            icon={
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            color="text-purple-600"
            icon={
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Average Rating"
            value={stats.averageRating.toFixed(1)}
            subtitle="⭐ Out of 5.0"
            color="text-yellow-600"
            icon={
              <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            }
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Appointment Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appointment Trends</h3>
            {appointmentTrends.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-16">No data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={appointmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="confirmed"    stroke="#10b981" strokeWidth={2} name="Confirmed" />
                  <Line type="monotone" dataKey="cancelled"    stroke="#ef4444" strokeWidth={2} name="Cancelled" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appointment Status Distribution</h3>
            {statusDistribution.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-16">No data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trends</h3>
            {revenueData.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-16">No revenue data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Peak Hours */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Peak Booking Hours</h3>
            {peakHours.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-16">No data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#f59e0b" name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Doctors Table — admin only */}
        {userRole === 'admin' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Doctors</h3>
            {topDoctors.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No data for this period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {['Rank', 'Doctor', 'Specialization', 'Appointments', 'Rating'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {topDoctors.map((doctor, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800'
                            : index === 1 ? 'bg-gray-200 text-gray-700'
                            : index === 2 ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {doctor.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {doctor.specialization}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {doctor.appointments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{doctor.rating.toFixed(1)}</span>
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Summary stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <h4 className="text-lg font-semibold mb-2">Pending Review</h4>
            <p className="text-4xl font-bold">{stats.pendingAppointments}</p>
            <p className="text-blue-100 mt-2">Awaiting confirmation</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <h4 className="text-lg font-semibold mb-2">Completed</h4>
            <p className="text-4xl font-bold">{stats.completedAppointments}</p>
            <p className="text-green-100 mt-2">Successfully finished</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
            <h4 className="text-lg font-semibold mb-2">Cancellation Rate</h4>
            <p className="text-4xl font-bold">
              {stats.totalAppointments > 0
                ? ((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(1)
                : '0.0'}%
            </p>
            <p className="text-red-100 mt-2">{stats.cancelledAppointments} cancelled</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
