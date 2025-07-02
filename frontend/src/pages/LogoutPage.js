// pages/LogoutPage.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
    navigate('/auth/login/');
  }, [navigate]);

  return null; // или сообщение "Выполняется выход..."
};

export default LogoutPage;