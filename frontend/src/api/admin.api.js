import api from './axios';

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getBranchList: () => api.get('/admin/dashboard/branches-list'),
  getAllManagers: () => api.get('/admin/managers'),
  getPendingManagers: () => api.get('/admin/managers/pending'),
  getActivatedManagers: () => api.get('/admin/managers/activated'),
  activateManager: (user_id) => api.put(`/admin/managers/${user_id}/activate`),
  deactivateManager: (user_id) => api.put(`/admin/managers/${user_id}/deactivate`),
};
