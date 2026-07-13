import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { registerApiErrorCallback } from './services/api';
import socketService from './services/socketService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorSearchPage from './pages/DoctorSearchPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

// Socket.io Integration Component
function SocketIntegration() {
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user) {
      // Connect to Socket.io
      socketService.connect(token);

      // Listen for notifications
      const unsubscribe = socketService.on('notification', (notification) => {
        // Show toast notification
        toast.info(
          <div onClick={() => {
            if (notification.actionUrl) {
              window.location.href = notification.actionUrl;
            }
          }} className="cursor-pointer">
            <div className="font-semibold">{notification.title}</div>
            <div className="text-sm mt-1">{notification.message}</div>
          </div>,
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      });

      // Cleanup on unmount
      return () => {
        unsubscribe();
        socketService.disconnect();
      };
    }
  }, [showToast]);

  return null;
}

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
        <SocketIntegration />
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
