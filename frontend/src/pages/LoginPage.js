// src/pages/LoginPage.js
import React from 'react';
import LoginForm from '../components/LoginForm';
import { Container } from '@mui/material';

const LoginPage = () => {
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <LoginForm />
    </Container>
  );
};

export default LoginPage;