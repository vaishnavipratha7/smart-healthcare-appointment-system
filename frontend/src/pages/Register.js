import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useForm from '../hooks/useForm';

const Register = () => {
  const [submitError, setSubmitError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = (values) => {
    const errors = {};
    if (!values.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!values.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!values.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(values.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(values.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and a number';
    }
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (values.role === 'doctor') {
      if (!values.specialization.trim()) {
        errors.specialization = 'Specialization is required';
      }
      if (!values.hospital.trim()) {
        errors.hospital = 'Hospital name is required';
      }
      if (!values.qualification.trim()) {
        errors.qualification = 'Qualification is required';
      }
      if (values.experience === '' || isNaN(values.experience) || Number(values.experience) < 0) {
        errors.experience = 'Experience must be a positive number';
      }
      if (values.consultationFee === '' || isNaN(values.consultationFee) || Number(values.consultationFee) < 0) {
        errors.consultationFee = 'Consultation fee must be a positive number';
      }
    }
    return errors;
  };

  const handleRegisterSubmit = async (formValues) => {
    setSubmitError('');
    try {
      const { confirmPassword, ...registerData } = formValues;
      const response = await register(registerData);

      // Registration no longer logs the user in — an OTP was sent instead.
      // Send them to the verification screen with their email pre-filled.
      navigate('/verify-otp', { state: { email: response.email || registerData.email } });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useForm({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    specialization: '',
    hospital: '',
    qualification: '',
    experience: '',
    consultationFee: '',
  }, validate, handleRegisterSubmit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg border dark:border-gray-700">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white" data-testid="register-heading">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
              Sign in
            </Link>
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-md text-sm">
          After you sign up, we'll email you a 6-digit verification code. Please use a real,
          working email address — you won't be able to log in until it's verified.
        </div>

        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md animate-slide-in" data-testid="error-message">
            {submitError}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={values.name}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.name ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="John Doe"
              data-testid="name-input"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={values.email}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.email ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="you@example.com"
              data-testid="email-input"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={values.phone}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.phone ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="1234567890"
              data-testid="phone-input"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Register as
            </label>
            <select
              id="role"
              name="role"
              value={values.role}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              data-testid="role-select"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          {values.role === 'doctor' && (
            <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-150 dark:border-gray-600 animate-slide-in">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Doctor Professional Details</h3>
              
              <div>
                <label htmlFor="specialization" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Specialization
                </label>
                <input
                  id="specialization"
                  name="specialization"
                  type="text"
                  required
                  value={values.specialization}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors ${
                    errors.specialization ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-500'
                  }`}
                  placeholder="E.g. Cardiologist"
                  data-testid="specialization-input"
                />
                {errors.specialization && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.specialization}</p>
                )}
              </div>

              <div>
                <label htmlFor="hospital" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Hospital
                </label>
                <input
                  id="hospital"
                  name="hospital"
                  type="text"
                  required
                  value={values.hospital}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors ${
                    errors.hospital ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-500'
                  }`}
                  placeholder="E.g. City Hospital"
                  data-testid="hospital-input"
                />
                {errors.hospital && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.hospital}</p>
                )}
              </div>

              <div>
                <label htmlFor="qualification" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Qualification
                </label>
                <input
                  id="qualification"
                  name="qualification"
                  type="text"
                  required
                  value={values.qualification}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors ${
                    errors.qualification ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-500'
                  }`}
                  placeholder="E.g. MBBS, MD"
                  data-testid="qualification-input"
                />
                {errors.qualification && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.qualification}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="experience" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Experience (years)
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="number"
                    min="0"
                    required
                    value={values.experience}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors ${
                      errors.experience ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-500'
                    }`}
                    placeholder="5"
                    data-testid="experience-input"
                  />
                  {errors.experience && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.experience}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="consultationFee" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Consultation Fee (₹)
                  </label>
                  <input
                    id="consultationFee"
                    name="consultationFee"
                    type="number"
                    min="0"
                    required
                    value={values.consultationFee}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors ${
                      errors.consultationFee ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-500'
                    }`}
                    placeholder="500"
                    data-testid="consultation-fee-input"
                  />
                  {errors.consultationFee && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.consultationFee}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={values.password}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.password ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="••••••••"
              data-testid="password-input"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={values.confirmPassword}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.confirmPassword ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="••••••••"
              data-testid="confirm-password-input"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            data-testid="register-submit-btn"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
