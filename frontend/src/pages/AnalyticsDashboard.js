import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';

const AnalyticsDashboard = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [stats, setStats] = useState({
    totalAppointments: 0,
    confirmedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalPatients: 0,
  });
  const [appointmentTrends, setAppointmentTrends] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [peakHours, setPeakHours] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      // Fetch analytics data
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/analytics`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Process the data (mock data for now - replace with actual API response)
      processAnalyticsData(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Load mock data for demonstration
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock statistics
    setStats({
      totalAppointments: 248,
      confirmedAppointments: 156,
      pendingAppointments: 42,
      cancelledAppointments: 18,
      completedAppointments: 190,
      totalRevenue: 124500,
      averageRating: 4.6,
      totalPatients: 187,
    });

    // Mock appointment trends (last 30 days)
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      trends.push({
        date: format(date, 'MMM dd'),
        appointments: Math.floor(Math.random() * 15) + 5,
        confirmed: Math.floor(Math.random() * 10) + 3,
        cancelled: Math.floor(Math.random() * 3),
      });
    }
    setAppointmentTrends(trends);

    // Mock status distribution
    setStatusDistribution([
      { name: 'Confirmed', value: 156, color: '#10b981' },
      { name: 'Pending', value: 42, color: '#f59e0b' },
      { name: 'Completed', value: 190, color: '#3b82f6' },
      { name: 'Cancelled', value: 18, color: '#ef4444' },
    ]);

    // Mock revenue data
    const revenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = subDays(new Date(), i * 5);
      revenue.push({
        date: format(date, 'MMM dd'),
        revenue: Math.floor(Math.random() * 25000) + 15000,
      });
    }
    setRevenueData(revenue);

    // Mock top doctors
    setTopDoctors([
      { name: 'Dr. Sarah Johnson', appointments: 45, rating: 4.9 },
      { name: 'Dr. Michael Chen', appointments: 38, rating: 4.8 },
      { name: 'Dr. Emily Brown', appointments: 35, rating: 4.7 },
      { name: 'Dr. James Wilson', appointments: 32, rating: 4.6 },
      { name: 'Dr. Lisa Anderson', appointments: 28, rating: 4.8 },
    ]);

    // Mock peak hours
    setPeakHours([
      { hour: '8 AM', count: 12 },
      { hour: '9 AM', count: 28 },
      { hour: '10 AM', count: 35 },
      { hour: '11 AM', count: 32 },
      { hour: '12 PM', count: 18 },
      { hour: '1 PM', count: 15 },
      { hour: '2 PM', count: 25 },
      { hour: '3 PM', count: 30 },
      { hour: '4 PM', count: 28 },
      { hour: '5 PM', count: 22 },
    ]);
  };

  const processAnalyticsData = (data) => {
    // Process real API data here
    if (data && data.stats) {
      setStats(data.stats);
      setAppointmentTrends(data.trends || []);
      setStatusDistribution(data.statusDistribution || []);
      setRevenueData(data.revenue || []);
      setTopDoctors(data.topDoctors || []);
      setPeakHours(data.peakHours || []);
    } else {
      loadMockData();
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Comprehensive insights and performance metrics
            </p>
          </div>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Statistics Cards */}
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Appointment Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={appointmentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="confirmed"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Confirmed"
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Cancelled"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Appointment Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Peak Booking Hours
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f59e0b" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Doctors Table */}
        {userRole === 'admin' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Performing Doctors
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topDoctors.map((doctor, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                              index === 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : index === 1
                                ? 'bg-gray-200 text-gray-700'
                                : index === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {doctor.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doctor.appointments}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-1">
                            {doctor.rating}
                          </span>
                          <svg
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
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
              {((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(1)}%
            </p>
            <p className="text-red-100 mt-2">
              {stats.cancelledAppointments} cancelled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
