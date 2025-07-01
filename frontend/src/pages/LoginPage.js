import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, ensureCsrfToken } from '../api/index'; // Изменили импорт
import { TextField, Button, Container, Typography, Box } from '@mui/material';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    ensureCsrfToken(); // Используем новую функцию вместо getCsrfToken
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Сбрасываем ошибку перед новым запросом
    
    try {
      const response = await login(username, password);
      if (response?.access) {
        localStorage.setItem('token', response.access);
        navigate('/');
      } else {
        setError('Не удалось получить токен авторизации');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Неверное имя пользователя или пароль');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Вход
        </Typography>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Имя пользователя"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Пароль"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Войти
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;