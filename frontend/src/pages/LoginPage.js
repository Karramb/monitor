// src/pages/LoginPage.js
import React from 'react';
import LoginForm from '../components/LoginForm';
import { Container, Typography } from '@mui/material';

const LoginPage = () => {
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Вход в систему
      </Typography>
      <LoginForm />
    </Container>
  );
};

export default LoginPage;