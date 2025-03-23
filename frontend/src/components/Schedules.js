import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Button, IconButton, Typography, Box, Snackbar, Alert, MenuItem, Grid, Fade, Chip
} from '@mui/material';
import { Edit, Delete, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; // Add this import

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    asset_id: '',
    maintenance_type: '',
    scheduled_date: '',
    status: 'Pending'
  });
  const [editSchedule, setEditSchedule] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate(); // Add this hook

  useEffect(() => {
    fetchSchedules();
    fetchAssets();
  }, []);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules(response.data);
    } catch (err) {
      setError('Failed to fetch schedules');
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/assets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssets(response.data);
    } catch (err) {
      setError('Failed to fetch assets');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule({ ...newSchedule, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditSchedule({ ...editSchedule, [name]: value });
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/schedules', newSchedule, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewSchedule({
        asset_id: '',
        maintenance_type: '',
        scheduled_date: '',
        status: 'Pending'
      });
      fetchSchedules();
      setSuccess('Schedule added successfully');
      navigate('/dashboard'); // Redirect to Dashboard after adding
    } catch (err) {
      setError('Failed to add schedule');
      console.error(err);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditSchedule(schedule);
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/schedules/${editSchedule.id}`, editSchedule, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditSchedule(null);
      fetchSchedules();
      setSuccess('Schedule updated successfully');
      navigate('/dashboard'); // Redirect to Dashboard after updating
    } catch (err) {
      setError('Failed to update schedule');
      console.error(err);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchedules();
      setSuccess('Schedule deleted successfully');
    } catch (err) {
      setError('Failed to delete schedule');
      console.error(err);
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const isOverdue = (schedule) => {
    const today = new Date();
    const scheduledDate = new Date(schedule.scheduled_date);
    return schedule.status === 'Pending' && scheduledDate < today;
  };

  return (
    <Box sx={{ p: 4 }}>
      <Fade in timeout={500}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Schedules Management
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

          <Box
            component="form"
            onSubmit={editSchedule ? handleUpdateSchedule : handleAddSchedule}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {editSchedule ? 'Edit Schedule' : 'Add New Schedule'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Asset"
                  name="asset_id"
                  value={editSchedule ? editSchedule.asset_id : newSchedule.asset_id}
                  onChange={editSchedule ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                >
                  {assets.map((asset) => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Maintenance Type"
                  name="maintenance_type"
                  value={editSchedule ? editSchedule.maintenance_type : newSchedule.maintenance_type}
                  onChange={editSchedule ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Scheduled Date"
                  name="scheduled_date"
                  type="date"
                  value={editSchedule ? editSchedule.scheduled_date : newSchedule.scheduled_date}
                  onChange={editSchedule ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Status"
                  name="status"
                  value={editSchedule ? editSchedule.status : newSchedule.status}
                  onChange={editSchedule ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button type="submit" variant="contained" color="primary">
                    {editSchedule ? 'Update Schedule' : 'Add Schedule'}
                  </Button>
                  {editSchedule && (
                    <Button variant="outlined" color="secondary" onClick={() => setEditSchedule(null)}>
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
                <TableCell>Asset</TableCell>
                <TableCell>Maintenance Type</TableCell>
                <TableCell>Scheduled Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow
                  key={schedule.id}
                  sx={{
                    '&:hover': { backgroundColor: '#fafafa' },
                    backgroundColor: isOverdue(schedule) ? '#ffebee' : 'inherit'
                  }}
                >
                  <TableCell>{schedule.id}</TableCell>
                  <TableCell>{assets.find((asset) => asset.id === schedule.asset_id)?.name || 'N/A'}</TableCell>
                  <TableCell>{schedule.maintenance_type}</TableCell>
                  <TableCell>{schedule.scheduled_date}</TableCell>
                  <TableCell>
                    {schedule.status}
                    {isOverdue(schedule) && (
                      <Chip icon={<Warning />} label="Overdue" color="error" size="small" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEditSchedule(schedule)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteSchedule(schedule.id)}>
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

export default Schedules;