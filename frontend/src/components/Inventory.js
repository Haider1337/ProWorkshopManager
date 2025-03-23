import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Button, IconButton, Typography, Box, Snackbar, Alert, Grid, Fade, Chip
} from '@mui/material';
import { Edit, Delete, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; // Add this import

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 0,
    location: '',
    reorder_level: 0,
    supplier: ''
  });
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate(); // Add this hook

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data);
    } catch (err) {
      setError('Failed to fetch inventory');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditItem({ ...editItem, [name]: value });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/inventory', newItem, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewItem({
        item_name: '',
        quantity: 0,
        location: '',
        reorder_level: 0,
        supplier: ''
      });
      fetchInventory();
      setSuccess('Inventory item added successfully');
      navigate('/dashboard'); // Redirect to Dashboard after adding
    } catch (err) {
      setError('Failed to add inventory item');
      console.error(err);
    }
  };

  const handleEditItem = (item) => {
    setEditItem(item);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/inventory/${editItem.id}`, editItem, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditItem(null);
      fetchInventory();
      setSuccess('Inventory item updated successfully');
      navigate('/dashboard'); // Redirect to Dashboard after updating
    } catch (err) {
      setError('Failed to update inventory item');
      console.error(err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInventory();
      setSuccess('Inventory item deleted successfully');
    } catch (err) {
      setError('Failed to delete inventory item');
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
            Inventory Management
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
            onSubmit={editItem ? handleUpdateItem : handleAddItem}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {editItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Item Name"
                  name="item_name"
                  value={editItem ? editItem.item_name : newItem.item_name}
                  onChange={editItem ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={editItem ? editItem.quantity : newItem.quantity}
                  onChange={editItem ? handleEditInputChange : handleInputChange}
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
                  value={editItem ? editItem.location : newItem.location}
                  onChange={editItem ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Reorder Level"
                  name="reorder_level"
                  type="number"
                  value={editItem ? editItem.reorder_level : newItem.reorder_level}
                  onChange={editItem ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Supplier"
                  name="supplier"
                  value={editItem ? editItem.supplier : newItem.supplier}
                  onChange={editItem ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button type="submit" variant="contained" color="primary">
                    {editItem ? 'Update Item' : 'Add Item'}
                  </Button>
                  {editItem && (
                    <Button variant="outlined" color="secondary" onClick={() => setEditItem(null)}>
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
                <TableCell>Item Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Reorder Level</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:hover': { backgroundColor: '#fafafa' },
                    backgroundColor: item.quantity <= item.reorder_level ? '#ffebee' : 'inherit'
                  }}
                >
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.location || 'N/A'}</TableCell>
                  <TableCell>{item.reorder_level}</TableCell>
                  <TableCell>{item.supplier || 'N/A'}</TableCell>
                  <TableCell>
                    {item.quantity <= item.reorder_level ? (
                      <Chip icon={<Warning />} label="Low Stock" color="error" size="small" />
                    ) : (
                      <Chip label="In Stock" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEditItem(item)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteItem(item.id)}>
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

export default Inventory;