import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from '@mui/material';

const Layout = () => {
  return (
    <Container maxWidth="{false}" sx={{ py: 3, mt: 2 }}>
      <Outlet />
    </Container>
  );
};

export default Layout;