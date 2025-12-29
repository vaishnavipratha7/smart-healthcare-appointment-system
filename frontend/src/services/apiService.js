import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },
};

export const appointmentService = {
  create: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  getMyAppointments: async () => {
    const response = await api.get('/appointments/my-appointments');
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.put(`/appointments/${id}/cancel`);
    return response.data;
  },

  checkAvailability: async (doctorId, appointmentDate, timeSlot) => {
    const response = await api.get('/appointments/check-availability', {
      params: { doctorId, appointmentDate, timeSlot },
    });
    return response.data;
  },
};

export const doctorService = {
  getAll: async () => {
    const response = await api.get('/doctor/list');
    return response.data;
  },

  getAppointments: async () => {
    const response = await api.get('/doctor/appointments');
    return response.data;
  },

  approveAppointment: async (id, notes) => {
    const response = await api.put(`/doctor/appointments/${id}/approve`, { notes });
    return response.data;
  },

  rejectAppointment: async (id, rejectionReason) => {
    const response = await api.put(`/doctor/appointments/${id}/reject`, { rejectionReason });
    return response.data;
  },

  completeAppointment: async (id, notes) => {
    const response = await api.put(`/doctor/appointments/${id}/complete`, { notes });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/doctor/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/doctor/profile', profileData);
    return response.data;
  },
};

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  toggleUserStatus: async (id) => {
    const response = await api.put(`/admin/users/${id}/toggle-status`);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getAllDoctors: async () => {
    const response = await api.get('/admin/doctors');
    return response.data;
  },

  approveDoctor: async (id) => {
    const response = await api.put(`/admin/doctors/${id}/approve`);
    return response.data;
  },

  rejectDoctor: async (id) => {
    const response = await api.put(`/admin/doctors/${id}/reject`);
    return response.data;
  },

  createDoctor: async (doctorData) => {
    const response = await api.post('/admin/doctors', doctorData);
    return response.data;
  },

  deleteDoctor: async (id) => {
    const response = await api.delete(`/admin/doctors/${id}`);
    return response.data;
  },

  getAllAppointments: async () => {
    const response = await api.get('/admin/appointments');
    return response.data;
  },
};