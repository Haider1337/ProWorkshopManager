import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Typography, Box, Paper, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Attempting login with:', { username, password });
    try {
      const response = await axios.post('http://localhost:5000/login', {
        username,
        password,
      });
      console.log('Login response:', response.data);
      localStorage.setItem('token', response.data.token);
      console.log('Token stored in localStorage:', localStorage.getItem('token'));
      onLogin();
      console.log('onLogin called');
      navigate('/dashboard', { replace: true });
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: '12px',
          }}
        >
          <Typography variant="h5" gutterBottom align="center">
            Login to ProWorkshopManager
          </Typography>
          {error && (
            <Typography color="error" align="center" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, py: 1.5 }}
            >
              Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};

export default Login;