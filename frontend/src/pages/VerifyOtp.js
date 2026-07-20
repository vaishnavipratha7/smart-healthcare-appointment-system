import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useForm from '../hooks/useForm';

const VerifyOtp = () => {
  const [submitError, setSubmitError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || '';

  const validate = (values) => {
    const errors = {};
    if (!values.otp.trim()) {
      errors.otp = 'Verification code is required';
    } else if (!/^\d{6}$/.test(values.otp.trim())) {
      errors.otp = 'Enter the 6-digit code';
    }
    return errors;
  };

  const handleVerifySubmit = async (formValues) => {
    setSubmitError('');
    try {
      const userData = await verifyOtp({ email: emailFromState, otp: formValues.otp.trim() });

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
      setSubmitError(err.response?.data?.message || 'Verification failed. Please try again.');
    }
  };

  // Hooks must always run, regardless of emailFromState — so useForm is called
  // unconditionally here, and the "no email" case is handled in the render below instead.
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(
    { otp: '' },
    validate,
    handleVerifySubmit
  );

  const handleResend = async () => {
    setSubmitError('');
    setResendMessage('');
    setIsResending(true);
    try {
      const res = await resendOtp(emailFromState);
      setResendMessage(res.message || 'A new code has been sent to your email.');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!emailFromState) {
    // No email to verify — send the user back to register instead of a dead page
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg text-center space-y-4 border dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">No email to verify</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Please register or log in again to receive a verification code.
          </p>
          <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-500 dark:hover:text-primary-300">
            Go to Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg border dark:border-gray-700">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white" data-testid="verify-otp-heading">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            We sent a 6-digit code to <span className="font-medium text-gray-900 dark:text-white">{emailFromState}</span>.
            Enter it below to activate your account. The code expires in 10 minutes.
          </p>
        </div>

        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md animate-slide-in" data-testid="error-message">
            {submitError}
          </div>
        )}

        {resendMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md animate-slide-in" data-testid="resend-message">
            {resendMessage}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Verification Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={values.otp}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.otp ? 'border-red-300 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="000000"
              data-testid="otp-input"
            />
            {errors.otp && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in">{errors.otp}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            data-testid="verify-otp-submit-btn"
          >
            {isSubmitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="resend-otp-btn"
          >
            {isResending ? 'Resending...' : "Didn't get a code? Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;