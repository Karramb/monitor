import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HostListPage from './pages/HostListPage';
import Layout from './components/Layout';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar /> {/* Шапка теперь вне Routes */}
        <Routes>
          {/* Общие страницы с Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<HostListPage />} />
          </Route>
          
          {/* Страницы без дополнительного Layout */}
          <Route path="/auth/login/" element={<LoginPage />} />
          <Route path="/auth/registration/" element={<RegisterPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;