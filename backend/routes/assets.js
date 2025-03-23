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

// Get all assets
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM assets', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a single asset by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM assets WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(row);
  });
});

// Create a new asset
router.post('/', authenticateToken, (req, res) => {
  const { name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos } = req.body;
  db.run(
    `INSERT INTO assets (name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Update an asset
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos } = req.body;
  db.run(
    `UPDATE assets SET name = ?, type = ?, status = ?, location = ?, last_maintenance = ?, next_due = ?, mileage = ?, fuel_logs = ?, photos = ?
     WHERE id = ?`,
    [name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      res.json({ message: 'Asset updated' });
    }
  );
});

// Delete an asset
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM assets WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted' });
  });
});

module.exports = router;