const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  let connection;
  try {
    const dbName = process.env.DB_NAME || 'nexus_monitor';
    console.log(`Connecting to MySQL to initialize database "${dbName}"...`);
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    });

    // 1. Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" checked/created.`);

    // 2. Switch to database
    await connection.query(`USE \`${dbName}\``);

    // 3. Create devices table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ip VARCHAR(45) NOT NULL,
        type VARCHAR(100) DEFAULT 'Ping',
        status VARCHAR(50) DEFAULT 'unknown',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createTableQuery);
    console.log('Table "devices" checked/created.');

    // Create monitoring_metrics table
    const createMetricsTableQuery = `
      CREATE TABLE IF NOT EXISTS monitoring_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id INT NOT NULL,
        latency INT DEFAULT NULL,
        status VARCHAR(50) NOT NULL,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createMetricsTableQuery);
    console.log('Table "monitoring_metrics" checked/created.');

    // 4. Insert mock devices if empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM devices');
    if (rows[0].count === 0) {
      console.log('Inserting initial mock devices...');
      const insertQuery = `
        INSERT INTO devices (name, ip, type, status) VALUES 
        ('Router Principal', '192.168.1.1', 'Router', 'online'),
        ('Google DNS', '8.8.8.8', 'Ping', 'online'),
        ('Servidor Inexistente', '192.168.1.99', 'Server', 'offline')
      `;
      await connection.query(insertQuery);
      console.log('Mock devices inserted.');
    } else {
      console.log('Devices table already has data. Skipping mock insert.');
    }

    console.log('Database initialization completed successfully! 🎉');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  } finally {
    if (connection) await connection.end();
  }
}

initDB();
