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

// Get all schedules
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM schedules', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a single schedule by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM schedules WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(row);
  });
});

// Create a new schedule
router.post('/', authenticateToken, (req, res) => {
  const { asset_id, maintenance_type, scheduled_date, status } = req.body;
  db.run(
    `INSERT INTO schedules (asset_id, maintenance_type, scheduled_date, status)
     VALUES (?, ?, ?, ?)`,
    [asset_id, maintenance_type, scheduled_date, status],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Update a schedule
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { asset_id, maintenance_type, scheduled_date, status } = req.body;
  db.run(
    `UPDATE schedules SET asset_id = ?, maintenance_type = ?, scheduled_date = ?, status = ?
     WHERE id = ?`,
    [asset_id, maintenance_type, scheduled_date, status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      res.json({ message: 'Schedule updated' });
    }
  );
});

// Delete a schedule
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM schedules WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted' });
  });
});

module.exports = router;