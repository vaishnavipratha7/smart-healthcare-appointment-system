import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const DoctorSearchPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    hospital: '',
    minFee: '',
    maxFee: '',
    minExperience: '',
    day: '',
    timeSlot: '',
    sortBy: 'name',
  });

  const [specializations, setSpecializations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Load filter options
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Load doctors when filters change
  useEffect(() => {
    const debounce = setTimeout(() => {
      searchDoctors();
    }, 500);

    return () => clearTimeout(debounce);
  }, [filters, pagination.page]);

  const loadFilterOptions = async () => {
    try {
      const [specsRes, hospsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/doctors/specializations`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/doctors/hospitals`),
      ]);
      setSpecializations(specsRes.data.specializations || []);
      setHospitals(hospsRes.data.hospitals || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const searchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/doctors/search?${params.toString()}`
      );

      setDoctors(response.data.doctors || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        pages: response.data.pages || 0,
      }));
    } catch (error) {
      console.error('Error searching doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      specialization: '',
      hospital: '',
      minFee: '',
      maxFee: '',
      minExperience: '',
      day: '',
      timeSlot: '',
      sortBy: 'name',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="mt-2 text-gray-600">
            Search and filter doctors by specialty, location, and availability
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Doctor name or hospital"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Specialization */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <select
                  value={filters.specialization}
                  onChange={(e) => handleFilterChange('specialization', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Specializations</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hospital */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital
                </label>
                <select
                  value={filters.hospital}
                  onChange={(e) => handleFilterChange('hospital', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Hospitals</option>
                  {hospitals.map((hosp) => (
                    <option key={hosp} value={hosp}>
                      {hosp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Fee
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minFee}
                    onChange={(e) => handleFilterChange('minFee', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxFee}
                    onChange={(e) => handleFilterChange('maxFee', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Experience (years)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={filters.minExperience}
                  onChange={(e) => handleFilterChange('minExperience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Availability Day */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available On
                </label>
                <select
                  value={filters.day}
                  onChange={(e) => handleFilterChange('day', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              {/* Time Slot */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <select
                  value={filters.timeSlot}
                  onChange={(e) => handleFilterChange('timeSlot', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Time</option>
                  <option value="09:00">Morning (9 AM - 12 PM)</option>
                  <option value="14:00">Afternoon (2 PM - 5 PM)</option>
                  <option value="17:00">Evening (5 PM - 8 PM)</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="-name">Name (Z-A)</option>
                  <option value="consultationFee">Fee (Low to High)</option>
                  <option value="-consultationFee">Fee (High to Low)</option>
                  <option value="-experience">Experience (High to Low)</option>
                  <option value="experience">Experience (Low to High)</option>
                  <option value="-averageRating">Rating (High to Low)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex justify-between items-center">
                <p className="text-gray-700">
                  {loading ? (
                    'Searching...'
                  ) : (
                    <>
                      Found <span className="font-semibold">{pagination.total}</span>{' '}
                      {pagination.total === 1 ? 'doctor' : 'doctors'}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            )}

            {/* No Results */}
            {!loading && doctors.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No doctors found
                </h3>
                <p className="mt-1 text-gray-500">
                  Try adjusting your filters to find more results
                </p>
              </div>
            )}

            {/* Doctor Cards Grid */}
            {!loading && doctors.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor._id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                    >
                      {/* Doctor Image */}
                      <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-4xl font-bold text-blue-600">
                          {doctor.userId?.name?.charAt(0).toUpperCase() || 'D'}
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {doctor.userId?.name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-blue-600 font-medium">
                          {doctor.specialization}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {doctor.hospital}
                        </p>

                        {/* Rating */}
                        <div className="mt-2">
                          {doctor.averageRating > 0 ? (
                            renderStars(doctor.averageRating)
                          ) : (
                            <span className="text-sm text-gray-500">No ratings yet</span>
                          )}
                        </div>

                        {/* Experience & Fee */}
                        <div className="mt-3 flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {doctor.experience} years exp.
                          </span>
                          <span className="font-semibold text-green-600">
                            ₹{doctor.consultationFee}
                          </span>
                        </div>

                        {/* Availability Badge */}
                        {doctor.availability && doctor.availability.length > 0 && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Available
                            </span>
                          </div>
                        )}

                        {/* Action Button */}
                        <Link
                          to={`/patient/book-appointment/${doctor._id}`}
                          className="mt-4 w-full block text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition"
                        >
                          Book Appointment
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center items-center space-x-2">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {[...Array(pagination.pages)].map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            setPagination((prev) => ({ ...prev, page: idx + 1 }))
                          }
                          className={`px-4 py-2 rounded-md ${
                            pagination.page === idx + 1
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.pages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSearchPage;
