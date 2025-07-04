// src/api.js
const baseURL = '/api/'; // Все запросы будут проксироваться

export const getCsrfToken = async () => {
  try {
    const response = await fetch(`${baseURL}auth/csrf/`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('CSRF Error:', error.message);
    throw error;
  }
};

// Получение токена из куков
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

// Формирование заголовков
const getHeaders = (needsCsrf = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (needsCsrf) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }
  
  return headers;
};

// Регистрация пользователя
export const register = async (userData) => {
  try {
    await getCsrfToken();
    
    const response = await fetch(`${baseURL}auth/registration/`, {
      method: 'POST',
      headers: getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        password2: userData.password2
      }),
    });
    
    const responseData = await response.json();
    
    if (response.status === 201) {
      return {
        success: true,
        data: responseData.data,
        message: responseData.message || 'Registration successful'
      };
    }
    
    throw new Error(
      JSON.stringify({
        success: false,
        errors: responseData.errors || { detail: 'Registration failed' }
      })
    );
    
  } catch (error) {
    console.error('Registration failed:', error);
    throw new Error(
      JSON.stringify({
        success: false,
        errors: { detail: error.message || 'Registration failed' }
      })
    );
  }
};

// Аутентификация пользователя
export const login = async (username, password) => {
  try {
    await getCsrfToken();

    const response = await fetch(`${baseURL}auth/login/`, {
      method: 'POST',
      headers: getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', text);

    let responseData;
    try {
      responseData = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      throw new Error('Ответ сервера не является JSON');
    }

    if (response.ok && responseData.access) {
      localStorage.setItem('token', responseData.access);
      return {
        success: true,
        token: responseData.access,
        user: responseData.user || { username }
      };
    }

    throw new Error(
      JSON.stringify({
        success: false,
        errors: { detail: responseData.detail || 'Authentication failed' }
      })
    );

  } catch (error) {
    console.error('Login error:', error);
    throw new Error(
      JSON.stringify({
        success: false,
        errors: { detail: error.message || 'Login failed' }
      })
    );
  }
};


// Получение списка хостов
export const getHosts = async () => {
  try {
    const response = await fetch(`${baseURL}hosts/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch hosts');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hosts:', error);
    throw error;
  }
};

// Получение деталей хоста
export const getHostDetail = async (id) => {
  try {
    const response = await fetch(`${baseURL}hosts/${id}/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || `Failed to fetch host ${id}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching host ${id}:`, error);
    throw error;
  }
};

// Выполнение скрипта на хосте
export const runScript = async (hostId, scriptName) => {
  try {
    const response = await fetch(`${baseURL}hosts/${hostId}/run_script/`, {
      method: 'POST',
      headers: getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ script: scriptName }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || `Failed to run script on host ${hostId}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error running script on host ${hostId}:`, error);
    throw error;
  }
};

// Проверка авторизации
export const checkAuth = () => {
  return !!localStorage.getItem('token');
};

// Выход из системы
export const logout = () => {
  localStorage.removeItem('token');
};

// Бэклог методы
export const getBacklogItems = async () => {
  try {
    const response = await fetch(`${baseURL}backlog/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch backlog items');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching backlog items:', error);
    throw error;
  }
};

export const createBacklogItem = async (itemData) => {
  try {
    await getCsrfToken();
    
    const response = await fetch(`${baseURL}backlog/`, {
      method: 'POST',
      headers: getHeaders(true),
      credentials: 'include',
      body: JSON.stringify(itemData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to create backlog item');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating backlog item:', error);
    throw error;
  }
};

export const getBacklogItem = async (id) => {
  try {
    const response = await fetch(`${baseURL}backlog/${id}/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || `Failed to fetch backlog item ${id}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching backlog item ${id}:`, error);
    throw error;
  }
};

export const updateBacklogItem = async (id, itemData) => {
  try {
    await getCsrfToken();
    
    const response = await fetch(`${baseURL}backlog/${id}/`, {
      method: 'PUT',
      headers: getHeaders(true),
      credentials: 'include',
      body: JSON.stringify(itemData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || `Failed to update backlog item ${id}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error updating backlog item ${id}:`, error);
    throw error;
  }
};

export const deleteBacklogItem = async (id) => {
  try {
    await getCsrfToken();
    
    const response = await fetch(`${baseURL}backlog/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(true),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || `Failed to delete backlog item ${id}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting backlog item ${id}:`, error);
    throw error;
  }
};

// Методы для тегов
export const getTags = async () => {
  try {
    const response = await fetch(`${baseURL}tags/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch tags');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

// Методы для групп
export const getGroups = async () => {
  try {
    const response = await fetch(`${baseURL}groups/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch groups');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};