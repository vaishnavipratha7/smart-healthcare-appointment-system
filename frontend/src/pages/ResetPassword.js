import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/apiService';
import useForm from '../hooks/useForm';

const ResetPassword = () => {
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  const validate = (values) => {
    const errors = {};
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
    return errors;
  };

  const handleResetSubmit = async (formValues) => {
    setSubmitError('');
    try {
      const res = await authService.resetPassword(token, formValues.password);
      setSuccessMessage(res.message || 'Password reset successfully.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Reset link is invalid or expired.');
    }
  };

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(
    { password: '', confirmPassword: '' },
    validate,
    handleResetSubmit
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-xl shadow-lg">
        <h2 className="text-center text-3xl font-bold text-gray-900" data-testid="reset-password-heading">
          Choose a new password
        </h2>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md animate-slide-in" data-testid="error-message">
            {submitError}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md animate-slide-in" data-testid="success-message">
            {successMessage} Redirecting to login...
          </div>
        )}

        {!successMessage && (
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={values.confirmPassword}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.confirmPassword ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                data-testid="confirm-password-input"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium animate-slide-in">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              data-testid="reset-password-submit-btn"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;