import api from './axios';

export const referenceAPI = {
  getBranches: () => api.get('/reference/branches'),
  getCategories: () => api.get('/reference/categories'),
  getRoles: () => api.get('/reference/roles'),
};
