import api from './axios';

export const authAPI = {
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password });
  },

  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  verifyEmail: async (email, verification_code) => {
    return await api.post('/auth/verify-email', { email, verification_code });
  },

  resendVerification: async (email) => {
    return await api.post('/auth/resend-verification', { email });
  },

  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  changePassword: async (current_password, new_password) => {
    return await api.post('/auth/change-password', { current_password, new_password });
  },

  logout: async () => {
    return await api.post('/auth/logout');
  },
};
