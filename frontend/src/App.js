import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { registerApiErrorCallback } from './services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';

import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorSearchPage from './pages/DoctorSearchPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

// Inner component to register error callback inside ToastProvider context
function ApiErrorInterceptor() {
  const { showToast } = useToast();

  useEffect(() => {
    registerApiErrorCallback((message, type) => {
      showToast(message, type);
    });
  }, [showToast]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ApiErrorInterceptor />
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/doctors/search" element={<DoctorSearchPage />} />

                {/* Analytics Route - accessible by admin and doctor */}
                <Route
                  path="/analytics"
                  element={
                    <PrivateRoute allowedRoles={['admin', 'doctor']}>
                      <AnalyticsDashboard />
                    </PrivateRoute>
                  }
                />

                {/* Patient Routes */}
                <Route
                  path="/patient/dashboard"
                  element={
                    <PrivateRoute allowedRoles={['patient']}>
                      <PatientDashboard />
                    </PrivateRoute>
                  }
                />

                {/* Doctor Routes */}
                <Route
                  path="/doctor/dashboard"
                  element={
                    <PrivateRoute allowedRoles={['doctor']}>
                      <DoctorDashboard />
                    </PrivateRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <PrivateRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </AuthProvider>
        </Router>

        {/* React Toastify Container */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
