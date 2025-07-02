import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import HostListPage from './pages/HostListPage';
import HostDetailPage from './pages/HostDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import { ensureCsrfToken } from './api/index';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  useEffect(() => {
    ensureCsrfToken().catch(error => {
      console.error('Failed to get CSRF token:', error);
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HostListPage />} />
            <Route path="/hosts/:id" element={<HostDetailPage />} />
          </Route>
          <Route path="/auth/login/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;