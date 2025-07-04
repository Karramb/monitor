import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для чтения куки
const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(value);
  }
  return null;
};

// Интерцептор для авторизации и CSRF
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Добавляем CSRF для всех изменяющих методов
  if (['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    } else {
      console.warn('CSRF token not found!');
    }
  }
  
  return config;
});

// Обработчик ошибок
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data);
      // Можно добавить автоматический logout при 403
    }
    return Promise.reject(error);
  }
);

export const ensureCsrfToken = async () => {
  if (!getCookie('csrftoken')) {
    try {
      await api.get('auth/csrf/');
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
    }
  }
};

export const login = async (username, password) => {
  await ensureCsrfToken();
  
  try {
    const response = await api.post('auth/login/', { username, password });
    
    if (response.data?.access) {
      localStorage.setItem('token', response.data.access);
      console.log('Login successful, token saved');
    } else {
      console.warn('No access token in response:', response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Остальные методы
export const getHosts = () => api.get('hosts/');
export const getHostDetail = (id) => api.get(`hosts/${id}/`);
export const runScript = (hostId, scriptName) => 
  api.post(`hosts/${hostId}/run_script/`, { script: scriptName });
export const register = (userData) => api.post('auth/register/', userData);

// Вспомогательная функция для отладки
export const debugCookies = () => {
  console.log('Current cookies:', document.cookie);
  console.log('CSRF token:', getCookie('csrftoken'));
  console.log('JWT token:', localStorage.getItem('token'));
};