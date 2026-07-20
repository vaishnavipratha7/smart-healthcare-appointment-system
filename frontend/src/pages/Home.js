import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/register';
    switch (user.role) {
      case 'patient':
        return '/patient/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/register';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 animate-slide-in" data-testid="hero-heading">
            Smart Healthcare,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
              Simplified
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Book appointments with qualified doctors instantly. Modern healthcare management made easy.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            {isAuthenticated ? (
              <Link
                to={getDashboardLink()}
                className="group bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                data-testid="go-to-dashboard-btn"
              >
                <span className="flex items-center justify-center gap-2">
                  Go to Dashboard
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  data-testid="get-started-btn"
                >
                  <span className="flex items-center justify-center gap-2">
                    Get Started
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                <Link
                  to="/login"
                  className="bg-white hover:bg-gray-50 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-primary-600 transform hover:-translate-y-0.5"
                  data-testid="login-btn"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700" data-testid="feature-card-1">
            <div className="bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <div className="text-primary-600 dark:text-primary-400 text-4xl">👨‍⚕️</div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Expert Doctors</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Connect with qualified and experienced doctors across various specializations, verified credentials.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700" data-testid="feature-card-2">
            <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <div className="text-green-600 dark:text-green-400 text-4xl">📅</div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Instant Booking</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Book appointments online in seconds with real-time availability. No more waiting in queues.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700" data-testid="feature-card-3">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <div className="text-purple-600 dark:text-purple-400 text-4xl">🔒</div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Your medical information is encrypted and protected with enterprise-grade security standards.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <div className="text-orange-600 dark:text-orange-400 text-4xl">🤖</div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">AI-Powered Matching</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Describe your symptoms and get intelligent doctor recommendations powered by machine learning.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <div className="text-blue-600 dark:text-blue-400 text-4xl">💬</div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Real-Time Updates</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Get instant notifications for appointment confirmations, reminders, and status updates.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-800/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <div className="text-pink-600 dark:text-pink-400 text-4xl">⭐</div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Reviews & Ratings</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Read verified patient reviews and ratings to make informed decisions about your healthcare.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">How It Works</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Getting started is simple. Follow these easy steps to book your appointment.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-300 to-gray-200 dark:from-primary-700 dark:to-gray-700"></div>
              </div>
              <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Register</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 px-4">Create your free account in under 30 seconds</p>
            </div>

            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-green-300 to-gray-200 dark:from-green-700 dark:to-gray-700"></div>
              </div>
              <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Find Doctor</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 px-4">Search by specialty, location, or use AI recommendations</p>
            </div>

            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-purple-300 to-gray-200 dark:from-purple-700 dark:to-gray-700"></div>
              </div>
              <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Book Slot</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 px-4">Select your preferred date and time from available slots</p>
            </div>

            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold text-white">4</span>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Get Confirmation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 px-4">Receive instant email and app notification</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-700 dark:to-purple-700 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Create your account and start booking appointments today.
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-block bg-white text-primary-600 px-10 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Create Account →
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300 dark:text-gray-400 py-8 mt-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <h3 className="text-white text-xl font-bold">SmartHealthcare</h3>
            <p className="text-sm mt-2">Modern healthcare appointment management</p>
          </div>
          <div className="border-t border-gray-800 dark:border-gray-700 pt-4 text-sm">
            <p>© {new Date().getFullYear()} SmartHealthcare. Built with MERN Stack.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;