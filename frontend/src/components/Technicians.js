import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Button, IconButton, Typography, Box, Snackbar, Alert, Grid, Fade
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const Technicians = () => {
  const [technicians, setTechnicians] = useState([]);
  const [newTechnician, setNewTechnician] = useState({
    name: '',
    skills: '',
    availability: 'Available',
    certifications: '',
    tasks_completed: 0,
    avg_completion_time: 0,
    quality_rating: 0
  });
  const [editTechnician, setEditTechnician] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTechnicians();
  }, []);

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
    setNewTechnician({ ...newTechnician, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditTechnician({ ...editTechnician, [name]: value });
  };

  const handleAddTechnician = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/technicians', newTechnician, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTechnician({
        name: '',
        skills: '',
        availability: 'Available',
        certifications: '',
        tasks_completed: 0,
        avg_completion_time: 0,
        quality_rating: 0
      });
      fetchTechnicians();
      setSuccess('Technician added successfully');
    } catch (err) {
      setError('Failed to add technician');
      console.error(err);
    }
  };

  const handleEditTechnician = (technician) => {
    setEditTechnician(technician);
  };

  const handleUpdateTechnician = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/technicians/${editTechnician.id}`, editTechnician, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditTechnician(null);
      fetchTechnicians();
      setSuccess('Technician updated successfully');
    } catch (err) {
      setError('Failed to update technician');
      console.error(err);
    }
  };

  const handleDeleteTechnician = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/technicians/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTechnicians();
      setSuccess('Technician deleted successfully');
    } catch (err) {
      setError('Failed to delete technician');
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
            Technicians Management
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

          {/* Form to add/edit a technician */}
          <Box
            component="form"
            onSubmit={editTechnician ? handleUpdateTechnician : handleAddTechnician}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {editTechnician ? 'Edit Technician' : 'Add New Technician'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  name="name"
                  value={editTechnician ? editTechnician.name : newTechnician.name}
                  onChange={editTechnician ? handleEditInputChange : handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Skills"
                  name="skills"
                  value={editTechnician ? editTechnician.skills : newTechnician.skills}
                  onChange={editTechnician ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Availability"
                  name="availability"
                  value={editTechnician ? editTechnician.availability : newTechnician.availability}
                  onChange={editTechnician ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  SelectProps={{ native: true }}
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="On Leave">On Leave</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Certifications"
                  name="certifications"
                  value={editTechnician ? editTechnician.certifications : newTechnician.certifications}
                  onChange={editTechnician ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tasks Completed"
                  name="tasks_completed"
                  type="number"
                  value={editTechnician ? editTechnician.tasks_completed : newTechnician.tasks_completed}
                  onChange={editTechnician ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Average Completion Time (hours)"
                  name="avg_completion_time"
                  type="number"
                  value={editTechnician ? editTechnician.avg_completion_time : newTechnician.avg_completion_time}
                  onChange={editTechnician ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quality Rating (0-5)"
                  name="quality_rating"
                  type="number"
                  value={editTechnician ? editTechnician.quality_rating : newTechnician.quality_rating}
                  onChange={editTechnician ? handleEditInputChange : handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  inputProps={{ min: 0, max: 5, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button type="submit" variant="contained" color="primary">
                    {editTechnician ? 'Update Technician' : 'Add Technician'}
                  </Button>
                  {editTechnician && (
                    <Button variant="outlined" color="secondary" onClick={() => setEditTechnician(null)}>
                      Cancel
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Fade>

      {/* Table to display technicians */}
      <Fade in timeout={700}>
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Skills</TableCell>
                <TableCell>Availability</TableCell>
                <TableCell>Certifications</TableCell>
                <TableCell>Tasks Completed</TableCell>
                <TableCell>Avg Completion Time (hours)</TableCell>
                <TableCell>Quality Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {technicians.map((technician) => (
                <TableRow key={technician.id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                  <TableCell>{technician.id}</TableCell>
                  <TableCell>{technician.name}</TableCell>
                  <TableCell>{technician.skills}</TableCell>
                  <TableCell>{technician.availability}</TableCell>
                  <TableCell>{technician.certifications}</TableCell>
                  <TableCell>{technician.tasks_completed}</TableCell>
                  <TableCell>{technician.avg_completion_time}</TableCell>
                  <TableCell>{technician.quality_rating}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEditTechnician(technician)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteTechnician(technician.id)}>
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

export default Technicians;