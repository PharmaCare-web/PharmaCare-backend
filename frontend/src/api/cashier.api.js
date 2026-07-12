import api from './axios';

export const cashierAPI = {
  getPendingPayments: () => api.get('/cashier/payments/pending'),
  getPaymentDetails: (sale_id) => api.get(`/cashier/payments/${sale_id}`),
  acceptPayment: (sale_id, payment_type, reference_number) =>
    api.post(`/cashier/payments/${sale_id}/accept`, { payment_type, reference_number }),
  getReceipt: (sale_id) => api.get(`/cashier/receipts/${sale_id}`),
  getSalesForReturn: (sale_id) => api.get('/cashier/returns/sales', { params: { sale_id } }),
  getSaleItems: (sale_id) => api.get(`/cashier/returns/sales/${sale_id}/items`),
  processReturn: (data) => api.post('/cashier/returns', data),
  getPaymentReports: (params) => api.get('/cashier/reports/payments', { params }),
  getReturnReports: (params) => api.get('/cashier/reports/returns', { params }),
};
