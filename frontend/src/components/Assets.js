import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Button, IconButton, Typography, Box, Snackbar, Alert, List, ListItem, ListItemText, Fade, Grid, MenuItem
} from '@mui/material';
import { Edit, Delete, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; // Add this import

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: '',
    status: '',
    location: '',
    last_maintenance: '',
    next_due: '',
    mileage: 0,
    fuel_logs: [],
    photos: ''
  });
  const [editAsset, setEditAsset] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newFuelLog, setNewFuelLog] = useState({ date: '', gallons: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate(); // Add this hook

  useEffect(() => {
    fetchAssets();
    fetchWorkOrders();
  }, []);

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/assets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const parsedAssets = response.data.map(asset => {
        let fuelLogs = [];
        try {
          fuelLogs = asset.fuel_logs && typeof asset.fuel_logs === 'string' && asset.fuel_logs !== ''
            ? JSON.parse(asset.fuel_logs)
            : [];
        } catch (err) {
          console.error(`Failed to parse fuel_logs for asset ${asset.id}:`, err);
          fuelLogs = [];
        }
        return {
          ...asset,
          fuel_logs: Array.isArray(fuelLogs) ? fuelLogs : []
        };
      });
      setAssets(parsedAssets);
    } catch (err) {
      setError('Failed to fetch assets');
      console.error(err);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/work_orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkOrders(response.data);
    } catch (err) {
      setError('Failed to fetch work orders');
      console.error(err);
    }
  };

  const calculateMaintenanceCost = (assetId) => {
    const relatedWorkOrders = workOrders.filter(wo => wo.asset_id === assetId);
    const totalCost = relatedWorkOrders.reduce((sum, wo) => sum + (parseFloat(wo.cost) || 0), 0);
    return totalCost.toFixed(2);
  };

  const calculateUtilization = (assetId) => {
    const relatedWorkOrders = workOrders.filter(wo => wo.asset_id === assetId && wo.created_date && wo.completed_date);
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    let downtimeDays = 0;
    relatedWorkOrders.forEach(wo => {
      const start = new Date(wo.created_date);
      const end = new Date(wo.completed_date);
      if (start >= thirtyDaysAgo && end <= now) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        downtimeDays += diffDays;
      }
    });

    const totalDays = 30;
    const uptimeDays = totalDays - downtimeDays;
    const utilization = (uptimeDays / totalDays) * 100;
    return utilization.toFixed(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAsset({ ...newAsset, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditAsset({ ...editAsset, [name]: value });
  };

  const handleFuelLogInputChange = (e) => {
    const { name, value } = e.target;
    setNewFuelLog({ ...newFuelLog, [name]: value });
  };

  const addFuelLog = () => {
    if (!newFuelLog.date || !newFuelLog.gallons) {
      setError('Please provide both date and gallons for the fuel log');
      return;
    }
    const fuelLogs = editAsset ? [...editAsset.fuel_logs] : [...newAsset.fuel_logs];
    fuelLogs.push({ date: newFuelLog.date, gallons: parseFloat(newFuelLog.gallons) });
    if (editAsset) {
      setEditAsset({ ...editAsset, fuel_logs: fuelLogs });
    } else {
      setNewAsset({ ...newAsset, fuel_logs: fuelLogs });
    }
    setNewFuelLog({ date: '', gallons: '' });
  };

  const removeFuelLog = (index) => {
    const fuelLogs = editAsset ? [...editAsset.fuel_logs] : [...newAsset.fuel_logs];
    fuelLogs.splice(index, 1);
    if (editAsset) {
      setEditAsset({ ...editAsset, fuel_logs: fuelLogs });
    } else {
      setNewAsset({ ...newAsset, fuel_logs: fuelLogs });
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const assetToSubmit = {
        ...newAsset,
        fuel_logs: JSON.stringify(newAsset.fuel_logs || [])
      };
      await axios.post('http://localhost:5000/assets', assetToSubmit, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewAsset({
        name: '',
        type: '',
        status: '',
        location: '',
        last_maintenance: '',
        next_due: '',
        mileage: 0,
        fuel_logs: [],
        photos: ''
      });
      setNewFuelLog({ date: '', gallons: '' });
      fetchAssets();
      setSuccess('Asset added successfully');
      navigate('/dashboard'); // Redirect to Dashboard after adding
    } catch (err) {
      setError('Failed to add asset');
      console.error(err);
    }
  };

  const handleEditAsset = (asset) => {
    setEditAsset(asset);
  };

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const assetToSubmit = {
        ...editAsset,
        fuel_logs: JSON.stringify(editAsset.fuel_logs || [])
      };
      await axios.put(`http://localhost:5000/assets/${editAsset.id}`, assetToSubmit, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditAsset(null);
      setNewFuelLog({ date: '', gallons: '' });
      fetchAssets();
      setSuccess('Asset updated successfully');
      navigate('/dashboard'); // Redirect to Dashboard after updating
    } catch (err) {
      setError('Failed to update asset');
      console.error(err);
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssets();
      setSuccess('Asset deleted successfully');
    } catch (err) {
      setError('Failed to delete asset');
      console.error(err);
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? asset.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: 4 }}>
      <Fade in timeout={500}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Assets Management
          </Typography>

          <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Snackbar>
          <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
              {success}
            </Alert>
          </Snackbar>

          <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
            <TextField
              label="Search by Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Filter by Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              variant="outlined"
              sx={{ width: 200 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
              <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
            </TextField>
          </Box>

          <Box
            component="form"
            onSubmit={editAsset ? handleUpdateAsset : handleAddAsset}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {editAsset ? 'Edit Asset' : 'Add New Asset'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  name="name"
                  value={editAsset ? editAsset.name : newAsset.name}
                  onChange={editAsset ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Type"
                  name="type"
                  value={editAsset ? editAsset.type : newAsset.type}
                  onChange={editAsset ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Status"
                  name="status"
                  value={editAsset ? editAsset.status : newAsset.status}
                  onChange={editAsset ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  name="location"
                  value={editAsset ? editAsset.location : newAsset.location}
                  onChange={editAsset ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Maintenance"
                  name="last_maintenance"
                  type="date"
                  value={editAsset ? editAsset.last_maintenance : newAsset.last_maintenance}
                  onChange={editAsset ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Next Due"
                  name="next_due"
                  type="date"
                  value={editAsset ? editAsset.next_due : newAsset.next_due}
                  onChange={editAsset ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mileage"
                  name="mileage"
                  type="number"
                  value={editAsset ? editAsset.mileage : newAsset.mileage}
                  onChange={editAsset ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Fuel Logs
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      label="Date"
                      name="date"
                      type="date"
                      value={newFuelLog.date}
                      onChange={handleFuelLogInputChange}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                      variant="outlined"
                    />
                    <TextField
                      label="Gallons"
                      name="gallons"
                      type="number"
                      value={newFuelLog.gallons}
                      onChange={handleFuelLogInputChange}
                      sx={{ flex: 1 }}
                      variant="outlined"
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addFuelLog}
                    >
                      Add
                    </Button>
                  </Box>
                  <List dense>
                    {(editAsset ? editAsset.fuel_logs : newAsset.fuel_logs).map((log, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton edge="end" onClick={() => removeFuelLog(index)}>
                            <RemoveIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText primary={`Date: ${log.date}, Gallons: ${log.gallons}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Photos (URL)"
                  name="photos"
                  value={editAsset ? editAsset.photos : newAsset.photos}
                  onChange={editAsset ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  helperText="Enter a URL to the photo (optional)"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button type="submit" variant="contained" color="primary">
                    {editAsset ? 'Update Asset' : 'Add Asset'}
                  </Button>
                  {editAsset && (
                    <Button variant="outlined" color="secondary" onClick={() => setEditAsset(null)}>
                      Cancel
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Fade>

      <Fade in timeout={700}>
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Last Maintenance</TableCell>
                <TableCell>Next Due</TableCell>
                <TableCell>Mileage</TableCell>
                <TableCell>Fuel Logs</TableCell>
                <TableCell>Total Maintenance Cost ($)</TableCell>
                <TableCell>Utilization (%)</TableCell>
                <TableCell>Photos</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                  <TableCell>{asset.id}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.type}</TableCell>
                  <TableCell>{asset.status}</TableCell>
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>{asset.last_maintenance}</TableCell>
                  <TableCell>{asset.next_due}</TableCell>
                  <TableCell>{asset.mileage}</TableCell>
                  <TableCell>
                    <List dense>
                      {Array.isArray(asset.fuel_logs) && asset.fuel_logs.length > 0 ? (
                        asset.fuel_logs.map((log, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={`Date: ${log.date}, Gallons: ${log.gallons}`} />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText primary="No fuel logs" />
                        </ListItem>
                      )}
                    </List>
                  </TableCell>
                  <TableCell>{calculateMaintenanceCost(asset.id)}</TableCell>
                  <TableCell>{calculateUtilization(asset.id)}</TableCell>
                  <TableCell>
                    {asset.photos ? (
                      <a href={asset.photos} target="_blank" rel="noopener noreferrer">
                        View Photo
                      </a>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEditAsset(asset)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteAsset(asset.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Fade>
    </Box>
  );
};

export default Assets;