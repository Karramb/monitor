import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  console.log('Is authenticated:', isAuthenticated);
  console.log('Token:', localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth/login/');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ 
          flexGrow: 1, 
          color: 'inherit', 
          textDecoration: 'none' 
        }}>
          Server Monitor
        </Typography>
        <Button 
          color="inherit" 
          component={Link} 
          to="/ident-check"
          sx={{ mr: 1 }}
        >
          Проверка по ident
        </Button>
        
        {isAuthenticated ? (
          <>
            <Button 
              color="inherit" 
              component={Link} 
              to="/backlog"
              sx={{ mr: 1 }}
            >
              Бэклог
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Выйти
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/auth/login/">
              Войти
            </Button>
            <Button color="inherit" component={Link} to="/auth/registration/">
              Регистрация
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;