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

// Get all inventory items
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM inventory', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a single inventory item by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM inventory WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(row);
  });
});

// Create a new inventory item
router.post('/', authenticateToken, (req, res) => {
  const { item_name, quantity, location, reorder_level, supplier } = req.body;
  db.run(
    `INSERT INTO inventory (item_name, quantity, location, reorder_level, supplier)
     VALUES (?, ?, ?, ?, ?)`,
    [item_name, quantity, location, reorder_level, supplier],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Update an inventory item
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { item_name, quantity, location, reorder_level, supplier } = req.body;
  db.run(
    `UPDATE inventory SET item_name = ?, quantity = ?, location = ?, reorder_level = ?, supplier = ?
     WHERE id = ?`,
    [item_name, quantity, location, reorder_level, supplier, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      res.json({ message: 'Inventory item updated' });
    }
  );
});

// Delete an inventory item
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM inventory WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted' });
  });
});

module.exports = router;