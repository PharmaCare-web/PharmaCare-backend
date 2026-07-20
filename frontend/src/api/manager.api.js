import api from './axios';

export const managerAPI = {
  getDashboard: () => api.get('/manager/dashboard'),
  getBranchOverview: () => api.get('/manager/dashboard/branch'),
  getInventorySummary: () => api.get('/manager/dashboard/inventory'),
  getSalesSummary: (year) => api.get('/manager/dashboard/sales', { params: { year } }),
  getNotifications: () => api.get('/manager/dashboard/notifications'),
  getAllStaff: () => api.get('/manager/staff'),
  createStaff: (data) => api.post('/manager/staff', data),
  verifyStaff: (data) => api.post('/manager/staff/verify', data),
  updateStaff: (user_id, data) => api.put(`/manager/staff/${user_id}`, data),
  removeStaff: (user_id) => api.delete(`/manager/staff/${user_id}`),
  resendStaffVerification: (user_id) => api.post(`/manager/staff/${user_id}/resend-verification`),
  resetStaffPassword: (user_id) => api.post(`/manager/staff/${user_id}/reset-password`),
  getAllMedicines: (params) => api.get('/manager/medicines', { params }),
  exportMedicines: () => api.get('/manager/medicines/export', { responseType: 'blob' }),
  addMedicine: (data) => api.post('/manager/medicines', data),
  updateMedicineStock: (medicine_id, data) =>
    api.put(`/manager/medicines/${medicine_id}/stock`, data),
  removeMedicine: (medicine_id) => api.delete(`/manager/medicines/${medicine_id}`),
};
