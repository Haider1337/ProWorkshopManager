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

// Get all work orders
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM work_orders', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a single work order by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM work_orders WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    res.json(row);
  });
});

// Create a new work order
router.post('/', authenticateToken, (req, res) => {
  const { asset_id, description, priority, due_date, technician_id, parts_needed, status, notes } = req.body;
  db.run(
    `INSERT INTO work_orders (asset_id, description, priority, due_date, technician_id, parts_needed, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [asset_id, description, priority, due_date, technician_id, parts_needed, status, notes],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Update a work order
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { asset_id, description, priority, due_date, technician_id, parts_needed, status, notes } = req.body;
  db.run(
    `UPDATE work_orders SET asset_id = ?, description = ?, priority = ?, due_date = ?, technician_id = ?, parts_needed = ?, status = ?, notes = ?
     WHERE id = ?`,
    [asset_id, description, priority, due_date, technician_id, parts_needed, status, notes, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Work order not found' });
      }
      res.json({ message: 'Work order updated' });
    }
  );
});

// Delete a work order
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM work_orders WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    res.json({ message: 'Work order deleted' });
  });
});

module.exports = router;