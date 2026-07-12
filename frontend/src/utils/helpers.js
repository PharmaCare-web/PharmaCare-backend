import { STORAGE_KEYS } from './constants';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.message || error?.message || fallback;
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export function getStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    must_change_password:
      user.must_change_password === true || user.is_temporary_password === true,
  };
}

export function getDashboardPath(roleId) {
  switch (roleId) {
    case 1: return '/admin/dashboard';
    case 2: return '/manager/dashboard';
    case 3: return '/pharmacist/dashboard';
    case 4: return '/cashier/dashboard';
    default: return '/login';
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function unwrapData(response) {
  return response?.data?.data ?? response?.data ?? response;
}
