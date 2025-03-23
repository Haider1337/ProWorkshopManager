const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      location TEXT,
      last_maintenance TEXT,
      next_due TEXT,
      mileage INTEGER,
      fuel_logs TEXT,
      photos TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER,
      technician_id INTEGER,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      created_date TEXT,
      completed_date TEXT,
      cost REAL DEFAULT 0,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (technician_id) REFERENCES technicians(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      location TEXT,
      reorder_level INTEGER,
      supplier TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      skills TEXT,
      availability TEXT,
      certifications TEXT,
      tasks_completed INTEGER,
      avg_completion_time REAL,
      quality_rating REAL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER,
      maintenance_type TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    )
  `);

  // Insert default admin user if not exists
  const adminPassword = bcrypt.hashSync('password123', 10);
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
    if (err) {
      console.error('Error checking for admin user:', err.message);
    }
    if (!user) {
      db.run(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        ['admin', adminPassword, 'admin'],
        (err) => {
          if (err) {
            console.error('Error seeding admin user:', err.message);
          } else {
            console.log('Admin user created successfully');
          }
        }
      );
    } else {
      console.log('Admin user already exists');
    }
  });
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Verify Token Endpoint
app.get('/auth/verifyToken', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// User routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hashedPassword],
      function (err) {
        if (err) return res.status(400).json({ error: 'Username already exists' });
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'your_jwt_secret', {
      expiresIn: '1h',
    });
    res.json({ token });
  });
});

// Asset routes
app.get('/assets', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM assets`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/assets', authenticateToken, (req, res) => {
  const { name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos } = req.body;
  db.run(
    `INSERT INTO assets (name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/assets/:id', authenticateToken, (req, res) => {
  const { name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos } = req.body;
  db.run(
    `UPDATE assets SET name = ?, type = ?, status = ?, location = ?, last_maintenance = ?, next_due = ?, mileage = ?, fuel_logs = ?, photos = ? WHERE id = ?`,
    [name, type, status, location, last_maintenance, next_due, mileage, fuel_logs, photos, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Asset updated' });
    }
  );
});

app.delete('/assets/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM assets WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Asset deleted' });
  });
});

// Work Order routes
app.get('/work_orders', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM work_orders`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/work_orders', authenticateToken, (req, res) => {
  const { asset_id, technician_id, description, status, priority, created_date, completed_date, cost } = req.body;
  db.run(
    `INSERT INTO work_orders (asset_id, technician_id, description, status, priority, created_date, completed_date, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [asset_id, technician_id, description, status, priority, created_date, completed_date, cost || 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/work_orders/:id', authenticateToken, (req, res) => {
  const { asset_id, technician_id, description, status, priority, created_date, completed_date, cost } = req.body;
  db.run(
    `UPDATE work_orders SET asset_id = ?, technician_id = ?, description = ?, status = ?, priority = ?, created_date = ?, completed_date = ?, cost = ? WHERE id = ?`,
    [asset_id, technician_id, description, status, priority, created_date, completed_date, cost || 0, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Work order updated' });
    }
  );
});

app.delete('/work_orders/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM work_orders WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Work order deleted' });
  });
});

// Inventory routes
app.get('/inventory', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM inventory`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/inventory', authenticateToken, (req, res) => {
  const { item_name, quantity, location, reorder_level, supplier } = req.body;
  db.run(
    `INSERT INTO inventory (item_name, quantity, location, reorder_level, supplier) VALUES (?, ?, ?, ?, ?)`,
    [item_name, quantity, location, reorder_level, supplier],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/inventory/:id', authenticateToken, (req, res) => {
  const { item_name, quantity, location, reorder_level, supplier } = req.body;
  db.run(
    `UPDATE inventory SET item_name = ?, quantity = ?, location = ?, reorder_level = ?, supplier = ? WHERE id = ?`,
    [item_name, quantity, location, reorder_level, supplier, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Inventory item updated' });
    }
  );
});

app.delete('/inventory/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM inventory WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Inventory item deleted' });
  });
});

// Technician routes
app.get('/technicians', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM technicians`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/technicians', authenticateToken, (req, res) => {
  const { name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating } = req.body;
  db.run(
    `INSERT INTO technicians (name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/technicians/:id', authenticateToken, (req, res) => {
  const { name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating } = req.body;
  db.run(
    `UPDATE technicians SET name = ?, skills = ?, availability = ?, certifications = ?, tasks_completed = ?, avg_completion_time = ?, quality_rating = ? WHERE id = ?`,
    [name, skills, availability, certifications, tasks_completed, avg_completion_time, quality_rating, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Technician updated' });
    }
  );
});

app.delete('/technicians/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM technicians WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Technician deleted' });
  });
});

// Schedule routes
app.get('/schedules', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM schedules`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/schedules', authenticateToken, (req, res) => {
  const { asset_id, maintenance_type, scheduled_date, status } = req.body;
  db.run(
    `INSERT INTO schedules (asset_id, maintenance_type, scheduled_date, status) VALUES (?, ?, ?, ?)`,
    [asset_id, maintenance_type, scheduled_date, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/schedules/:id', authenticateToken, (req, res) => {
  const { asset_id, maintenance_type, scheduled_date, status } = req.body;
  db.run(
    `UPDATE schedules SET asset_id = ?, maintenance_type = ?, scheduled_date = ?, status = ? WHERE id = ?`,
    [asset_id, maintenance_type, scheduled_date, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Schedule updated' });
    }
  );
});

app.delete('/schedules/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM schedules WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Schedule deleted' });
  });
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});