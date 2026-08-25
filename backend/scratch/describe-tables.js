const mysql = require("mysql2/promise");
require("dotenv").config();

async function run() {
  let connection;
  try {
    const dbName = process.env.DB_NAME || 'nexus_monitor';
    console.log(`Connecting to MySQL database "${dbName}" to describe tables...`);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      database: dbName
    });

    const tables = ['hosts', 'items', 'triggers'];
    for (const table of tables) {
      console.log(`\n========================================\nDESCRIBE ${table};\n========================================`);
      const [rows] = await connection.query(`DESCRIBE ${table}`);
      console.table(rows);
    }
  } catch (err) {
    console.error("Error executing DESCRIBE queries:", err);
  } finally {
    if (connection) await connection.end();
  }
}

run();
