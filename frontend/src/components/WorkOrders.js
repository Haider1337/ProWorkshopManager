import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Button, IconButton, Typography, Box, Snackbar, Alert, MenuItem, Grid, Fade
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [newWorkOrder, setNewWorkOrder] = useState({
    asset_id: '',
    technician_id: '',
    description: '',
    status: 'Open',
    priority: 'Medium',
    created_date: '',
    completed_date: '',
    cost: 0 // Added cost field
  });
  const [editWorkOrder, setEditWorkOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWorkOrders();
    fetchAssets();
    fetchTechnicians();
  }, []);

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

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/technicians', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTechnicians(response.data);
    } catch (err) {
      setError('Failed to fetch technicians');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWorkOrder({ ...newWorkOrder, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditWorkOrder({ ...editWorkOrder, [name]: value });
  };

  const handleAddWorkOrder = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/work_orders', newWorkOrder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewWorkOrder({
        asset_id: '',
        technician_id: '',
        description: '',
        status: 'Open',
        priority: 'Medium',
        created_date: '',
        completed_date: '',
        cost: 0
      });
      fetchWorkOrders();
      setSuccess('Work order added successfully');
    } catch (err) {
      setError('Failed to add work order');
      console.error(err);
    }
  };

  const handleEditWorkOrder = (workOrder) => {
    setEditWorkOrder(workOrder);
  };

  const handleUpdateWorkOrder = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/work_orders/${editWorkOrder.id}`, editWorkOrder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditWorkOrder(null);
      fetchWorkOrders();
      setSuccess('Work order updated successfully');
    } catch (err) {
      setError('Failed to update work order');
      console.error(err);
    }
  };

  const handleDeleteWorkOrder = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/work_orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWorkOrders();
      setSuccess('Work order deleted successfully');
    } catch (err) {
      setError('Failed to delete work order');
      console.error(err);
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ p: 4 }}>
      <Fade in timeout={500}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Work Orders Management
          </Typography>

          {/* Snackbar for success/error messages */}
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

          {/* Form to add/edit a work order */}
          <Box
            component="form"
            onSubmit={editWorkOrder ? handleUpdateWorkOrder : handleAddWorkOrder}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {editWorkOrder ? 'Edit Work Order' : 'Add New Work Order'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Asset"
                  name="asset_id"
                  value={editWorkOrder ? editWorkOrder.asset_id : newWorkOrder.asset_id}
                  onChange={editWorkOrder ? handleEditInputChange : handleInputChange}
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
                  select
                  label="Technician"
                  name="technician_id"
                  value={editWorkOrder ? editWorkOrder.technician_id : newWorkOrder.technician_id}
                  onChange={editWorkOrder ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                >
                  {technicians.map((technician) => (
                    <MenuItem key={technician.id} value={technician.id}>
                      {technician.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={editWorkOrder ? editWorkOrder.description : newWorkOrder.description}
                  onChange={editWorkOrder ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Status"
                  name="status"
                  value={editWorkOrder ? editWorkOrder.status : newWorkOrder.status}
                  onChange={editWorkOrder ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                >
                  <MenuItem value="Open">Open</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Priority"
                  name="priority"
                  value={editWorkOrder ? editWorkOrder.priority : newWorkOrder.priority}
                  onChange={editWorkOrder ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Created Date"
                  name="created_date"
                  type="date"
                  value={editWorkOrder ? editWorkOrder.created_date : newWorkOrder.created_date}
                  onChange={editWorkOrder ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Completed Date"
                  name="completed_date"
                  type="date"
                  value={editWorkOrder ? editWorkOrder.completed_date : newWorkOrder.completed_date}
                  onChange={editWorkOrder ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cost ($)"
                  name="cost"
                  type="number"
                  value={editWorkOrder ? editWorkOrder.cost : newWorkOrder.cost}
                  onChange={editWorkOrder ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button type="submit" variant="contained" color="primary">
                    {editWorkOrder ? 'Update Work Order' : 'Add Work Order'}
                  </Button>
                  {editWorkOrder && (
                    <Button variant="outlined" color="secondary" onClick={() => setEditWorkOrder(null)}>
                      Cancel
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Fade>

      {/* Table to display work orders */}
      <Fade in timeout={700}>
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>ID</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell>Technician</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Completed Date</TableCell>
                <TableCell>Cost ($)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workOrders.map((workOrder) => (
                <TableRow key={workOrder.id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                  <TableCell>{workOrder.id}</TableCell>
                  <TableCell>{assets.find((asset) => asset.id === workOrder.asset_id)?.name || 'N/A'}</TableCell>
                  <TableCell>{technicians.find((tech) => tech.id === workOrder.technician_id)?.name || 'N/A'}</TableCell>
                  <TableCell>{workOrder.description}</TableCell>
                  <TableCell>{workOrder.status}</TableCell>
                  <TableCell>{workOrder.priority}</TableCell>
                  <TableCell>{workOrder.created_date}</TableCell>
                  <TableCell>{workOrder.completed_date || 'N/A'}</TableCell>
                  <TableCell>{workOrder.cost || 0}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEditWorkOrder(workOrder)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteWorkOrder(workOrder.id)}>
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

export default WorkOrders;