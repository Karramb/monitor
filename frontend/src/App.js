import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HostListPage from './pages/HostListPage';
import HostDetailPage from './pages/HostDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import { ensureCsrfToken } from './api/index'; // Изменили импорт

function App() {
  useEffect(() => {
    // Обновили вызов функции
    ensureCsrfToken().catch(error => {
      console.error('Failed to get CSRF token:', error);
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HostListPage />} />
          <Route path="/hosts/:id" element={<HostDetailPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}

export default App;