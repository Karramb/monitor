import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  IconButton
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AccountCircle from '@mui/icons-material/AccountCircle';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth/login/');
    window.location.reload(); // Для гарантированного сброса состояния
  };

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            color: 'inherit', 
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          Server Monitor
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <IconButton
                color="inherit"
                component={Link}
                to="/profile"
                sx={{ mr: 1 }}
              >
                <AccountCircle />
              </IconButton>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{ ml: 1 }}
              >
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                component={Link} 
                to="/auth/login/"
                sx={{ mr: 1 }}
              >
                Войти
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/auth/registration/"
                variant="outlined"
                sx={{ 
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                Регистрация
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;