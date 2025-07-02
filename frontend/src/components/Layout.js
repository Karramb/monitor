import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Container } from '@mui/material';

const Layout = () => {
  return (
    <>
      <Navbar />
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 3, 
          mt: 2,
          '&.MuiContainer-root': {
            paddingLeft: { xs: 2, sm: 3 },
            paddingRight: { xs: 2, sm: 3 }
          }
        }}
      >
        <Outlet />
      </Container>
    </>
  );
};

export default Layout;