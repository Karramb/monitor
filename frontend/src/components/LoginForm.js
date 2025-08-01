import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { 
  TextField, 
  Button, 
  Paper, 
  Box, 
  Typography,
  CircularProgress,
  Alert 
} from '@mui/material';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        // Перенаправляем на главную после успешного входа
        navigate('/');
        // Обновляем страницу для сброса состояния приложения
        window.location.reload();
      } else {
        setError(result.message || 'Ошибка входа');
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
        Вход в систему
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Имя пользователя"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
        />
        
        <TextField
          label="Пароль"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {loading ? <CircularProgress size={24} /> : 'Войти'}
        </Button>
      </Box>
    </Paper>
  );
};

export default LoginForm;