import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useForm from '../hooks/useForm';

const Login = () => {
  const [submitError, setSubmitError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const { login, resendOtp } = useAuth();
  const navigate = useNavigate();

  const validate = (values) => {
    const errors = {};
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!values.password) {
      errors.password = 'Password is required';
    }
    return errors;
  };

  const handleLoginSubmit = async (formValues) => {
    setSubmitError('');
    try {
      const userData = await login(formValues);
      
      // Redirect based on role
      switch (userData.role) {
        case 'patient':
          navigate('/patient/dashboard');
          break;
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        setUnverifiedEmail(err.response.data.email || formValues.email);
        setSubmitError(err.response.data.message || 'Please verify your email before logging in.');
      } else {
        setUnverifiedEmail('');
        setSubmitError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    }
  };

  const handleQuickResend = async () => {
    if (!unverifiedEmail) return;
    try {
      await resendOtp(unverifiedEmail);
      navigate('/verify-otp', { state: { email: unverifiedEmail } });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    }
  };

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useForm({ email: '', password: '' }, validate, handleLoginSubmit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900" data-testid="login-heading">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md animate-slide-in" data-testid="error-message">
            <p>{submitError}</p>
            {unverifiedEmail && (
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/verify-otp', { state: { email: unverifiedEmail } })}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  data-testid="go-verify-email-btn"
                >
                  Verify Email
                </button>
                <button
                  type="button"
                  onClick={handleQuickResend}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  data-testid="quick-resend-otp-btn"
                >
                  Resend OTP
                </button>
              </div>
            )}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={values.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.email ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
                data-testid="email-input"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium animate-slide-in">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={values.password}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.password ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                data-testid="password-input"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium animate-slide-in">{errors.password}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            data-testid="login-submit-btn"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;