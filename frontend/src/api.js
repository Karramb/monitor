// src/api.js

const baseURL = 'http://localhost:8000/api/';

export const getToken = () => localStorage.getItem('token');

export const getCsrfToken = () => {
  return fetch(baseURL + 'auth/csrf/', {
    credentials: 'include', // чтобы получить и сохранить куки
  }).then(res => {
    if (!res.ok) throw new Error(res.statusText);
    return res.text(); // обычно пустой ответ, но важен куки csrftoken
  });
};

const getCsrfFromCookie = () => {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
};

const getHeaders = (isPost = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (isPost) {
    const csrfToken = getCsrfFromCookie();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }
  return headers;
};

export const getHosts = () => {
  console.log('Fetching hosts from:', baseURL + 'hosts/');  // Логируем URL
  return fetch(baseURL + 'hosts/', {
    headers: getHeaders(),
    credentials: 'include',
  })
  .then((res) => {
    console.log('Response status:', res.status);  // Логируем статус
    if (!res.ok) {
      console.error('Response error:', res.statusText);  // Логируем ошибку
      throw new Error(res.statusText);
    }
    return res.json();
  })
  .then(data => {
    console.log('Response data:', data);  // Логируем данные
    return data;
  });
};

export const getHostDetail = (id) => {
  return fetch(`${baseURL}hosts/${id}/`, {
    headers: getHeaders(),
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
};

export const runScript = (hostId, scriptName) => {
  return fetch(`${baseURL}hosts/${hostId}/run_script/`, {
    method: 'POST',
    headers: getHeaders(true),
    credentials: 'include',
    body: JSON.stringify({ script: scriptName }),
  }).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
};

export const login = async (username, password) => {
  const response = await fetch(`${baseURL}auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
};

export const register = (userData) => {
  return fetch(baseURL + 'auth/register/', {
    method: 'POST',
    headers: getHeaders(true),
    credentials: 'include',
    body: JSON.stringify(userData),
  }).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
};
