const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  if (import.meta.env.DEV) {
    return '/api';
  }
  return 'https://nx-salonv2.vercel.app/api';
};

const API_BASE = getApiBase();

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('nx_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred while processing your request.');
  }

  return data;
};
