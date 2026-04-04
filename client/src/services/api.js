import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export async function request(endpoint, options = {}) {
  const { token } = useAuthStore.getState();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = { ...options, headers };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Something went wrong');
    return data;
  } catch (error) {
    console.error(`API Request Failed on ${endpoint}:`, error.message);
    throw error;
  }
}

export const authAPI = {
  register: (email, password) => request('/auth/register', {
    method: 'POST', body: JSON.stringify({ email, password })
  }),
  login: (email, password) => request('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password })
  }),
  verifyOTP: (email, token) => request('/auth/verify-otp', {
    method: 'POST', body: JSON.stringify({ email, token })
  })
};

export const dashboardAPI = {
  getSummary: () => request('/dashboard/summary'),
};

export const geocodeAPI = {
  reverse: (lat, lng) => request(`/geocode/reverse?lat=${lat}&lng=${lng}`),
};

export const workerAPI = {
  getMe: () => request('/worker/me'),
  registerProfile: (profileData) => request('/worker/register', {
    method: 'POST', body: JSON.stringify(profileData)
  }),
  updateZone: (zone_code) => request('/worker/zone', {
    method: 'PATCH', body: JSON.stringify({ zone_code })
  }),
};

export const policyAPI = {
  getActive: () => request('/policy/active'),
  create: (zone_code) => request('/policy/create', {
    method: 'POST', body: JSON.stringify({ zone_code })
  }),
  renew: () => request('/policy/renew', { method: 'POST' }),
};

export const claimsAPI = {
  getAll: () => request('/claims'),
  getById: (id) => request(`/claims/${id}`),
  appeal: (id) => request(`/claims/${id}/appeal`, { method: 'POST' }),
};

export const premiumAPI = {
  calculate: (zone_code, weekly_hours) =>
    request(`/premium/calculate?zone_code=${zone_code}&weekly_hours=${weekly_hours}`),
};

export const triggersAPI = {
  getActive: (zone_code) => request(`/triggers/active?zone_code=${zone_code}`),
};
