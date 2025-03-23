import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Grid, Card, CardContent, Fade, CircularProgress,
  List, ListItem, ListItemText, Chip
} from '@mui/material';
import { Warning, Build, People, Inventory as InventoryIcon, Event } from '@mui/icons-material';

const Dashboard = () => {
  const [assets, setAssets] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [assetsRes, workOrdersRes, techniciansRes, schedulesRes, inventoryRes] = await Promise.all([
          axios.get('http://localhost:5000/assets', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/work_orders', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/technicians', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/schedules', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/inventory', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setAssets(assetsRes.data.map(asset => ({
          ...asset,
          fuel_logs: asset.fuel_logs && typeof asset.fuel_logs === 'string' && asset.fuel_logs !== ''
            ? JSON.parse(asset.fuel_logs)
            : []
        })));
        setWorkOrders(workOrdersRes.data);
        setTechnicians(techniciansRes.data);
        setSchedules(schedulesRes.data);
        setInventory(inventoryRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Key Metrics
  const totalAssets = assets.length;
  const openWorkOrders = workOrders.filter(wo => wo.status !== 'Completed').length;
  const activeTechnicians = technicians.length;
  const overdueSchedules = schedules.filter(s => {
    const today = new Date();
    const scheduledDate = new Date(s.scheduled_date);
    return s.status === 'Pending' && scheduledDate < today;
  }).length;
  const lowInventoryItems = inventory.filter(item => item.quantity <= item.reorder_level).length;

  // Technician Workload and Stats
  const technicianWorkload = activeTechnicians > 0 ? (openWorkOrders / activeTechnicians).toFixed(2) : 0;
  const technicianStats = technicians.map(tech => {
    const techWorkOrders = workOrders.filter(wo => wo.technician_id === tech.id);
    const completedWorkOrders = techWorkOrders.filter(wo => wo.status === 'Completed');
    const totalCompletionTime = completedWorkOrders.reduce((sum, wo) => {
      if (wo.created_date && wo.completed_date) {
        const start = new Date(wo.created_date);
        const end = new Date(wo.completed_date);
        const diffHours = (end - start) / (1000 * 60 * 60); // Convert to hours
        return sum + diffHours;
      }
      return sum;
    }, 0);
    const avgCompletionTime = completedWorkOrders.length > 0 ? (totalCompletionTime / completedWorkOrders.length).toFixed(2) : 0;
    return {
      name: tech.name,
      openTasks: techWorkOrders.filter(wo => wo.status !== 'Completed').length,
      completedTasks: completedWorkOrders.length,
      avgCompletionTime
    };
  });

  // Predictive Maintenance Alerts
  const upcomingMaintenance = assets.filter(asset => {
    if (!asset.next_due) return false;
    const today = new Date();
    const dueDate = new Date(asset.next_due);
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0; // Assets due within the next 7 days
  });

  // Fuel Efficiency (Cost per Mile) - Assuming a fuel cost of $3.50 per gallon
  const calculateFuelEfficiency = (asset) => {
    if (!Array.isArray(asset.fuel_logs) || asset.fuel_logs.length < 2 || !asset.mileage) return null;
    const totalGallons = asset.fuel_logs.reduce((sum, log) => sum + parseFloat(log.gallons), 0);
    const fuelCost = totalGallons * 3.50; // $3.50 per gallon
    const costPerMile = asset.mileage > 0 ? (fuelCost / asset.mileage).toFixed(2) : 'N/A';
    return costPerMile;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Fade in timeout={500}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>

          {/* Key Metrics */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Fade in timeout={700}>
                <Card sx={{ backgroundColor: '#e3f2fd', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    <Build sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                    <Box>
                      <Typography variant="h6">Total Assets</Typography>
                      <Typography variant="h4">{totalAssets}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Fade in timeout={900}>
                <Card sx={{ backgroundColor: '#fff3e0', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    <Warning sx={{ fontSize: 40, color: '#f57c00', mr: 2 }} />
                    <Box>
                      <Typography variant="h6">Open Work Orders</Typography>
                      <Typography variant="h4">{openWorkOrders}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Fade in timeout={1100}>
                <Card sx={{ backgroundColor: '#ffebee', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    <Event sx={{ fontSize: 40, color: '#d32f2f', mr: 2 }} />
                    <Box>
                      <Typography variant="h6">Overdue Schedules</Typography>
                      <Typography variant="h4">{overdueSchedules}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Fade in timeout={1300}>
                <Card sx={{ backgroundColor: '#f3e5f5', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    <InventoryIcon sx={{ fontSize: 40, color: '#ab47bc', mr: 2 }} />
                    <Box>
                      <Typography variant="h6">Low Inventory Items</Typography>
                      <Typography variant="h4">{lowInventoryItems}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            {/* Technician Workload */}
            <Grid item xs={12} md={6}>
              <Fade in timeout={1500}>
                <Card sx={{ backgroundColor: '#e8f5e9', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <People sx={{ fontSize: 40, color: '#388e3c', mr: 2 }} />
                      <Typography variant="h6">Technician Workload</Typography>
                    </Box>
                    <Typography variant="h4">{technicianWorkload} tasks/tech</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>Technician Stats:</Typography>
                    <List dense>
                      {technicianStats.map(tech => (
                        <ListItem key={tech.name}>
                          <ListItemText
                            primary={`${tech.name}: ${tech.openTasks} open, ${tech.completedTasks} completed`}
                            secondary={`Avg Completion Time: ${tech.avgCompletionTime} hrs`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            {/* Predictive Maintenance Alerts */}
            <Grid item xs={12} md={6}>
              <Fade in timeout={1700}>
                <Card sx={{ backgroundColor: '#fffde7', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Warning sx={{ fontSize: 40, color: '#fbc02d', mr: 2 }} />
                      <Typography variant="h6">Upcoming Maintenance Alerts</Typography>
                    </Box>
                    {upcomingMaintenance.length > 0 ? (
                      <List dense>
                        {upcomingMaintenance.map(asset => (
                          <ListItem key={asset.id}>
                            <ListItemText
                              primary={`${asset.name} (${asset.type})`}
                              secondary={`Due on ${asset.next_due}`}
                            />
                            <Chip label="Due Soon" color="warning" size="small" />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2">No upcoming maintenance within the next 7 days.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            {/* Fuel Efficiency Stats */}
            <Grid item xs={12}>
              <Fade in timeout={1900}>
                <Card sx={{ backgroundColor: '#e0f7fa', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Build sx={{ fontSize: 40, color: '#0288d1', mr: 2 }} />
                      <Typography variant="h6">Fuel Efficiency Stats</Typography>
                    </Box>
                    <List dense>
                      {assets.map(asset => {
                        const costPerMile = calculateFuelEfficiency(asset);
                        return costPerMile ? (
                          <ListItem key={asset.id}>
                            <ListItemText
                              primary={`${asset.name} (${asset.type})`}
                              secondary={`Cost per Mile: $${costPerMile}`}
                            />
                          </ListItem>
                        ) : null;
                      })}
                    </List>
                    {assets.every(asset => !calculateFuelEfficiency(asset)) && (
                      <Typography variant="body2">No fuel efficiency data available.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Box>
  );
};

export default Dashboard;