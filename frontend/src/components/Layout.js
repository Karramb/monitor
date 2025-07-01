import React from 'react';
import Navbar from './Navbar';
import { Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" style={{ marginTop: '20px' }}>
        <Outlet />
      </Container>
    </>
  );
};

export default Layout;