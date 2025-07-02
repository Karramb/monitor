import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api';
import { 
  TextField, 
  Button, 
  Paper, 
  Box, 
  Typography,
  CircularProgress,
  Alert,
  Link
} from '@mui/material';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2  // Добавьте это поле
      });
      console.log('Registration success:', response);
      navigate('/auth/login/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.message || 
        err.response?.data?.errors || 
        'Ошибка регистрации. Проверьте введенные данные.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 4, 
      maxWidth: 400, 
      mx: 'auto', 
      mt: 4 
    }}>
      <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
        Регистрация
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Имя пользователя"
          name="username"
          fullWidth
          margin="normal"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={loading}
        />
        
        <TextField
          label="Email"
          name="email"
          type="email"
          fullWidth
          margin="normal"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
        
        <TextField
          label="Пароль"
          name="password"
          type="password"
          fullWidth
          margin="normal"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />
        
        <TextField
          label="Подтвердите пароль"
          name="password2"
          type="password"
          fullWidth
          margin="normal"
          value={formData.password2}
          onChange={handleChange}
          required
          disabled={loading}
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          fullWidth 
          sx={{ mt: 3 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
        </Button>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link href="/auth/login/" variant="body2">
            Уже есть аккаунт? Войти
          </Link>
        </Box>
      </Box>
    </Paper>
  );
};

export default RegisterPage;