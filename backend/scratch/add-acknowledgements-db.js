const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  let connection;
  try {
    const dbName = process.env.DB_NAME || 'nexus_monitor';
    console.log(`Connecting to MySQL database "${dbName}" to run Acknowledgements migration...`);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      database: dbName
    });

    // 1. Create users table
    console.log('Creating "users" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(150),
          role ENUM('admin', 'operator', 'viewer') DEFAULT 'viewer',
          enabled BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Seed admin user if not exists
    const [existingUsers] = await connection.query("SELECT id FROM users WHERE username = 'admin'");
    if (existingUsers.length === 0) {
      console.log('Seeding initial "admin" user...');
      await connection.query(`
        INSERT INTO users (username, password, full_name, role)
        VALUES ('admin', 'admin123', 'Administrador NEXUS', 'admin')
      `);
    } else {
      console.log('"admin" user already exists. Skipping seed.');
    }

    // 3. Create acknowledgements table
    console.log('Creating "acknowledgements" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS acknowledgements (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          alert_id BIGINT NOT NULL,
          user_id INT NOT NULL,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Alter alerts table to add acknowledged info
    console.log('Altering "alerts" table to support acknowledgements...');
    const [cols] = await connection.query('SHOW COLUMNS FROM alerts LIKE "acknowledged"');
    if (cols.length === 0) {
      await connection.query('ALTER TABLE alerts ADD COLUMN acknowledged BOOLEAN DEFAULT FALSE');
      await connection.query('ALTER TABLE alerts ADD COLUMN acknowledged_by INT NULL');
      await connection.query('ALTER TABLE alerts ADD COLUMN acknowledged_at TIMESTAMP NULL');
      console.log('Altered alerts table successfully!');
    } else {
      console.log('Alerts table alterations already present.');
    }

    console.log('Acknowledgements migration successfully completed! 🎉');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (connection) await connection.end();
  }
}

run();
