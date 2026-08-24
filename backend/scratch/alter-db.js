const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterDB() {
  let connection;
  try {
    const dbName = process.env.DB_NAME || 'nexus_monitor';
    console.log(`Connecting to MySQL database "${dbName}" to add latency_ms column...`);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      database: dbName
    });

    // Add latency_ms column if it doesn't exist
    const [columns] = await connection.query('SHOW COLUMNS FROM item_history LIKE "latency_ms"');
    if (columns.length === 0) {
      await connection.query('ALTER TABLE item_history ADD COLUMN latency_ms DOUBLE NULL');
      console.log('Column "latency_ms" added successfully to table "item_history"!');
    } else {
      console.log('Column "latency_ms" already exists in "item_history" table.');
    }
  } catch (err) {
    console.error('Failed to alter database:', err);
  } finally {
    if (connection) await connection.end();
  }
}

alterDB();
