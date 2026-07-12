import api from './axios';

export const pharmacistAPI = {
  getAllMedicines: (params) => api.get('/pharmacist/medicines', { params }),
  searchMedicines: (q) => api.get('/pharmacist/medicines/search', { params: { q } }),
  getMedicineById: (id) => api.get(`/pharmacist/medicines/${id}`),
  addMedicine: (data) => api.post('/pharmacist/medicines', data),
  updateMedicineStock: (id, data) => api.put(`/pharmacist/medicines/${id}/stock`, data),
  removeMedicine: (id) => api.delete(`/pharmacist/medicines/${id}`),
  requestRestock: (data) => api.post('/pharmacist/inventory/request-restock', data),
  createSale: (data) => api.post('/pharmacist/sales', data),
  getSaleById: (id) => api.get(`/pharmacist/sales/${id}`),
  getLowStockReport: (threshold = 10) =>
    api.get('/pharmacist/reports/low-stock', { params: { threshold } }),
  getExpiryReport: (days = 30) =>
    api.get('/pharmacist/reports/expiry', { params: { days } }),
  getInventorySummary: () => api.get('/pharmacist/reports/inventory-summary'),
};
