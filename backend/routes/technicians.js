const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all technicians
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM technicians', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a single technician by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM technicians WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    res.json(row);
  });
});

// Create a new technician
router.post('/', authenticateToken, (req, res) => {
  const { name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating } = req.body;
  db.run(
    `INSERT INTO technicians (name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Update a technician
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating } = req.body;
  db.run(
    `UPDATE technicians SET name = ?, skills = ?, availability = ?, certifications = ?, tasks_completed = ?, avg_completion_time = ?, quality_rating = ?
     WHERE id = ?`,
    [name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Technician not found' });
      }
      res.json({ message: 'Technician updated' });
    }
  );
});

// Delete a technician
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM technicians WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    res.json({ message: 'Technician deleted' });
  });
});

module.exports = router;