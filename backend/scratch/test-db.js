const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    });
    console.log('Connected to MySQL server.');
    const [rows] = await connection.query('SHOW DATABASES');
    console.log('Databases on server:', rows.map(r => r.Database));
  } catch (err) {
    console.error('Failed to list databases:', err);
  } finally {
    if (connection) await connection.end();
  }
}

test();
