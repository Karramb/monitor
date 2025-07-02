import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      // Можно добавить запрос на сервер для logout если нужно
      localStorage.removeItem('token');
      setTimeout(() => navigate('/auth/login/'), 1000);
    };

    performLogout();
  }, [navigate]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      mt: 4 
    }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6">Выполняется выход...</Typography>
    </Box>
  );
};

export default LogoutPage;