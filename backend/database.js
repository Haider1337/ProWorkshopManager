const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./proworkshop.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Manager'
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created or already exists');
    }
  });

  // Assets table (with mileage, fuel_logs, photos)
  db.run(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      location TEXT,
      last_maintenance TEXT,
      next_due TEXT,
      qr_code TEXT,
      mileage INTEGER,
      fuel_logs TEXT,
      photos TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating assets table:', err.message);
    } else {
      console.log('Assets table created or already exists');
    }
  });

  // Work Orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL,
      due_date TEXT,
      technician_id INTEGER,
      parts_needed TEXT,
      status TEXT NOT NULL DEFAULT 'Open',
      notes TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (technician_id) REFERENCES technicians(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating work_orders table:', err.message);
    } else {
      console.log('Work Orders table created or already exists');
    }
  });

  // Inventory table
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      location TEXT,
      reorder_level INTEGER,
      supplier TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating inventory table:', err.message);
    } else {
      console.log('Inventory table created or already exists');
    }
  });

  // Technicians table
  db.run(`
    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      skills TEXT,
      availability TEXT,
      certifications TEXT,
      tasks_completed INTEGER DEFAULT 0,
      avg_completion_time INTEGER,
      quality_rating INTEGER
    )
  `, (err) => {
    if (err) {
      console.error('Error creating technicians table:', err.message);
    } else {
      console.log('Technicians table created or already exists');
    }
  });

  // Schedules table
  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      date TEXT NOT NULL,
      recurring TEXT,
      FOREIGN KEY (task_id) REFERENCES work_orders(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating schedules table:', err.message);
    } else {
      console.log('Schedules table created or already exists');
    }
  });
});

module.exports = db;