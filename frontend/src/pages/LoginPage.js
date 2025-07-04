import React from 'react';
import LoginForm from '../components/LoginForm';
import { Box } from '@mui/material';

const LoginPage = () => {
  return (
    <Box sx={{ mt: 8 }}>
      <LoginForm />
    </Box>
  );
};

export default LoginPage;