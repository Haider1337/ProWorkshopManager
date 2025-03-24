const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./proworkshop.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
    return;
  }
  console.log('Connected to SQLite database (proworkshop.db)');
});

// Helper function to run SQL queries asynchronously
const runAsync = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

// Helper function to get a single row asynchronously
const getAsync = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to get table info (columns)
const getTableInfo = (tableName) => {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to check if a table exists
const tableExists = (tableName) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
};

// Initialize the database
const initializeDatabase = async () => {
  try {
    // Create users table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

    // Create assets table with all required columns
    await runAsync(`
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
        photos TEXT,
        vibration_threshold REAL,
        temperature_threshold REAL,
        parent_id INTEGER,
        criticality_score INTEGER,
        FOREIGN KEY (parent_id) REFERENCES assets(id)
      )
    `);

    // Check for missing columns in the assets table
    const assetsTableInfo = await getTableInfo('assets');
    const assetsExistingColumns = assetsTableInfo.map(column => column.name);

    const assetsRequiredColumns = [
      'vibration_threshold',
      'temperature_threshold',
      'criticality_score'
    ];

    const assetsMissingColumns = assetsRequiredColumns.filter(col => !assetsExistingColumns.includes(col));

    if (assetsMissingColumns.length > 0) {
      console.log(`Adding missing columns (${assetsMissingColumns.join(', ')}) to assets table...`);

      // Check if assets_new table exists and drop it if it does
      const assetsNewExists = await tableExists('assets_new');
      if (assetsNewExists) {
        console.log('Dropping existing assets_new table...');
        await runAsync(`DROP TABLE assets_new`);
      }

      // Define the new table schema
      await runAsync(`
        CREATE TABLE assets_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          location TEXT,
          last_maintenance TEXT,
          next_due TEXT,
          mileage INTEGER,
          fuel_logs TEXT,
          photos TEXT,
          vibration_threshold REAL,
          temperature_threshold REAL,
          parent_id INTEGER,
          criticality_score INTEGER,
          FOREIGN KEY (parent_id) REFERENCES assets(id)
        )
      `);

      // Build the SELECT statement dynamically based on existing columns
      const assetsCommonColumns = [
        'id', 'name', 'type', 'status', 'location', 'last_maintenance', 'next_due',
        'mileage', 'fuel_logs', 'photos', 'parent_id'
      ].filter(col => assetsExistingColumns.includes(col));

      // Add existing columns from requiredColumns if they exist
      const assetsSelectColumns = [
        ...assetsCommonColumns,
        ...assetsRequiredColumns.filter(col => assetsExistingColumns.includes(col))
      ];

      // Add NULL for missing columns
      const assetsInsertColumns = [
        ...assetsCommonColumns,
        ...assetsRequiredColumns
      ];

      const assetsSelectClause = assetsSelectColumns.map(col => col).join(', ');
      const assetsInsertClause = assetsInsertColumns.join(', ');
      const assetsNullsForMissing = assetsRequiredColumns
        .map(col => !assetsExistingColumns.includes(col) ? 'NULL' : col)
        .slice(-assetsMissingColumns.length)
        .join(', ');

      const assetsSelectValues = assetsSelectClause + (assetsMissingColumns.length > 0 ? `, ${assetsNullsForMissing}` : '');

      // Copy data from the old table to the new table
      await runAsync(`
        INSERT INTO assets_new (${assetsInsertClause})
        SELECT ${assetsSelectValues}
        FROM assets
      `);

      // Drop the old table and rename the new table
      await runAsync(`DROP TABLE assets`);
      await runAsync(`ALTER TABLE assets_new RENAME TO assets`);
      console.log(`Added missing columns (${assetsMissingColumns.join(', ')}) successfully.`);
    }

    // Create work_orders table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        technician_id INTEGER,
        created_date TEXT,
        completed_date TEXT,
        cost REAL,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (technician_id) REFERENCES technicians(id)
      )
    `);

    // Create technicians table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS technicians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        specialty TEXT
      )
    `);

    // Create inventory table with all required columns
    await runAsync(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        part_number TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        min_quantity INTEGER,
        unit_price REAL
      )
    `);

    // Check for missing part_number column in the inventory table
    const inventoryTableInfo = await getTableInfo('inventory');
    const inventoryExistingColumns = inventoryTableInfo.map(column => column.name);

    const inventoryRequiredColumns = ['part_number'];

    const inventoryMissingColumns = inventoryRequiredColumns.filter(col => !inventoryExistingColumns.includes(col));

    if (inventoryMissingColumns.length > 0) {
      console.log(`Adding missing columns (${inventoryMissingColumns.join(', ')}) to inventory table...`);

      // Check if inventory_new table exists and drop it if it does
      const inventoryNewExists = await tableExists('inventory_new');
      if (inventoryNewExists) {
        console.log('Dropping existing inventory_new table...');
        await runAsync(`DROP TABLE inventory_new`);
      }

      // Define a temporary table schema without NOT NULL constraint on part_number
      await runAsync(`
        CREATE TABLE inventory_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          part_number TEXT,
          name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          min_quantity INTEGER,
          unit_price REAL
        )
      `);

      // Build the SELECT statement dynamically based on existing columns
      const inventoryCommonColumns = [
        'id', 'name', 'quantity', 'min_quantity', 'unit_price'
      ].filter(col => inventoryExistingColumns.includes(col));

      // Add existing columns from requiredColumns if they exist
      const inventorySelectColumns = [
        ...inventoryCommonColumns,
        ...inventoryRequiredColumns.filter(col => inventoryExistingColumns.includes(col))
      ];

      // Add NULL for missing columns (part_number)
      const inventoryInsertColumns = [
        ...inventoryCommonColumns,
        ...inventoryRequiredColumns
      ];

      // Provide default values for missing columns
      const inventorySelectValues = inventorySelectColumns.map(col => {
        if (col === 'name' && !inventoryExistingColumns.includes('name')) {
          return "'Unknown Item'";
        } else if (col === 'quantity' && !inventoryExistingColumns.includes('quantity')) {
          return 0;
        } else if (col === 'min_quantity' && !inventoryExistingColumns.includes('min_quantity')) {
          return 'NULL';
        } else if (col === 'unit_price' && !inventoryExistingColumns.includes('unit_price')) {
          return 'NULL';
        } else {
          return col;
        }
      }).join(', ');

      const inventoryInsertClause = inventoryInsertColumns.join(', ');
      const inventoryNullsForMissing = inventoryRequiredColumns
        .map(col => !inventoryExistingColumns.includes(col) ? 'NULL' : col)
        .slice(-inventoryMissingColumns.length)
        .join(', ');

      const finalSelectValues = inventorySelectValues + (inventoryMissingColumns.length > 0 ? `, ${inventoryNullsForMissing}` : '');

      // Copy data from the old table to the new table
      await runAsync(`
        INSERT INTO inventory_new (${inventoryInsertClause})
        SELECT ${finalSelectValues}
        FROM inventory
      `);

      // Update part_number for existing records
      await runAsync(`
        UPDATE inventory_new
        SET part_number = 'PART' || id
        WHERE part_number IS NULL
      `);
      console.log('Updated existing inventory items with default part numbers.');

      // Drop the old inventory table
      await runAsync(`DROP TABLE inventory`);

      // Create the final inventory table with NOT NULL constraint
      await runAsync(`
        CREATE TABLE inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          part_number TEXT NOT NULL,
          name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          min_quantity INTEGER,
          unit_price REAL
        )
      `);

      // Copy data from inventory_new to the final inventory table
      await runAsync(`
        INSERT INTO inventory (id, part_number, name, quantity, min_quantity, unit_price)
        SELECT id, part_number, name, quantity, min_quantity, unit_price
        FROM inventory_new
      `);

      // Drop the temporary inventory_new table
      await runAsync(`DROP TABLE inventory_new`);

      console.log(`Added missing columns (${inventoryMissingColumns.join(', ')}) successfully.`);
    }

    // Create condition_data table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS condition_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        vibration REAL NOT NULL,
        temperature REAL NOT NULL,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY (asset_id) REFERENCES assets(id)
      )
    `);

    // Insert default users if they don't exist
    const adminUser = await getAsync('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!adminUser) {
      await runAsync(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', 'admin123', 'admin']
      );
      console.log('Inserted default admin user');
    } else {
      console.log('User admin already exists');
    }

    const techUser = await getAsync('SELECT * FROM users WHERE username = ?', ['tech1']);
    if (!techUser) {
      await runAsync(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['tech1', 'tech123', 'technician']
      );
      console.log('Inserted default technician user');
    } else {
      console.log('User tech1 already exists');
    }

    // Insert default assets
    const factoryA = await getAsync('SELECT * FROM assets WHERE name = ?', ['Factory A']);
    if (!factoryA) {
      await runAsync(
        'INSERT INTO assets (name, type, status, criticality_score) VALUES (?, ?, ?, ?)',
        ['Factory A', 'Facility', 'Active', 5]
      );
      console.log('Inserted default asset: Factory A');
    }

    const machine1 = await getAsync('SELECT * FROM assets WHERE name = ?', ['Machine 1']);
    if (!machine1) {
      const factoryAId = (await getAsync('SELECT id FROM assets WHERE name = ?', ['Factory A'])).id;
      await runAsync(
        'INSERT INTO assets (name, type, status, parent_id, criticality_score) VALUES (?, ?, ?, ?, ?)',
        ['Machine 1', 'Machine', 'Active', factoryAId, 3]
      );
      console.log('Inserted default asset: Machine 1');
    }

    // Insert default technicians
    const tech1 = await getAsync('SELECT * FROM technicians WHERE name = ?', ['John Doe']);
    if (!tech1) {
      await runAsync(
        'INSERT INTO technicians (name, email, phone, specialty) VALUES (?, ?, ?, ?)',
        ['John Doe', 'john.doe@example.com', '123-456-7890', 'Electrical']
      );
      console.log('Inserted default technician: John Doe');
    }

    // Insert default inventory items
    const item1 = await getAsync('SELECT * FROM inventory WHERE part_number = ?', ['PART001']);
    if (!item1) {
      await runAsync(
        'INSERT INTO inventory (part_number, name, quantity, min_quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
        ['PART001', 'Oil Filter', 50, 10, 15.99]
      );
      console.log('Inserted default inventory item: Oil Filter');
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
};

// Run the initialization
initializeDatabase();