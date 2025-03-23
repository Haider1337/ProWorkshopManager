import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Box, CssBaseline, Drawer, AppBar, Toolbar, List, ListItem, ListItemIcon, ListItemText, Typography, IconButton, Divider } from '@mui/material';
import { Dashboard as DashboardIcon, Build, People, Inventory as InventoryIcon, Schedule, Work, ExitToApp } from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import Assets from './components/Assets';
import WorkOrders from './components/WorkOrders';
import Inventory from './components/Inventory';
import Technicians from './components/Technicians';
import Schedules from './components/Schedules';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

const drawerWidth = 240;

// Layout component for protected routes (with sidebar and AppBar)
const MainLayout = ({ children, handleLogout }) => {
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Assets', icon: <Build />, path: '/assets' },
    { text: 'Work Orders', icon: <Work />, path: '/work-orders' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Technicians', icon: <People />, path: '/technicians' },
    { text: 'Schedules', icon: <Schedule />, path: '/schedules' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, bgcolor: '#1976d2' }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            ProWorkshopManager
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#1976d2', color: '#fff' },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            ProWorkshopManager
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                bgcolor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <MainLayout handleLogout={handleLogout}>
              <Dashboard />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/assets"
        element={
          <PrivateRoute>
            <MainLayout handleLogout={handleLogout}>
              <Assets />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/work-orders"
        element={
          <PrivateRoute>
            <MainLayout handleLogout={handleLogout}>
              <WorkOrders />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <PrivateRoute>
            <MainLayout handleLogout={handleLogout}>
              <Inventory />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/technicians"
        element={
          <PrivateRoute>
            <MainLayout handleLogout={handleLogout}>
              <Technicians />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/schedules"
        element={
          <PrivateRoute>
            <MainLayout handleLogout={handleLogout}>
              <Schedules />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="*"
        element={
          <PrivateRoute>
            <MainLayout handleLogout={handleLogout}>
              <Typography variant="h5" sx={{ p: 4 }}>
                Page Not Found. <Link to="/dashboard">Go to Dashboard</Link>
              </Typography>
            </MainLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default App;