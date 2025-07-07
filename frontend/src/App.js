import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import HostListPage from './pages/HostListPage';
import BacklogPage from './pages/BacklogPage';
import BacklogItemPage from './pages/BacklogItemPage';
import BacklogCreatePage from './pages/BacklogCreatePage';
import Layout from './components/Layout';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HostListPage />} />
            <Route path="backlog" element={<BacklogPage />} />
            <Route path="backlog/:id" element={<BacklogItemPage />} />
            <Route path="/backlog/new" element={<BacklogCreatePage />} />
          </Route>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
