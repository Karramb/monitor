// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import HostListPage from './pages/HostListPage';
import BacklogPage from './pages/BacklogPage'; // Импортируем новую страницу
import Layout from './components/Layout';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Layout><HostListPage /></Layout>} />
          <Route path="/backlog" element={<Layout><BacklogPage /></Layout>} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;