const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterAndSeed() {
  let connection;
  try {
    const dbName = process.env.DB_NAME || 'nexus_monitor';
    console.log(`Connecting to MySQL database "${dbName}" to apply trigger updates...`);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      database: dbName
    });

    // 1. Alter triggers table: Add current_state column
    const [cols] = await connection.query('SHOW COLUMNS FROM triggers LIKE "current_state"');
    if (cols.length === 0) {
      await connection.query("ALTER TABLE triggers ADD COLUMN current_state ENUM('OK', 'PROBLEM') DEFAULT 'OK'");
      console.log('Column "current_state" added to table "triggers".');
    } else {
      console.log('Column "current_state" already exists in table "triggers".');
    }

    // 2. Create index on alerts table: idx_alert_status
    try {
      await connection.query("CREATE INDEX idx_alert_status ON alerts(status)");
      console.log('Index "idx_alert_status" created successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('Index "idx_alert_status" already exists on alerts table.');
      } else {
        throw err;
      }
    }

    // 3. Seed test host "Servidor-Prueba" (IP 192.168.1.250)
    const [existingHosts] = await connection.query("SELECT id FROM hosts WHERE ip = '192.168.1.250'");
    if (existingHosts.length === 0) {
      console.log('Seeding test host "Servidor-Prueba" (192.168.1.250)...');
      const [hostResult] = await connection.query(`
        INSERT INTO hosts (name, hostname, ip, type)
        VALUES ('Servidor-Prueba', 'TEST01', '192.168.1.250', 'server')
      `);
      const hostId = hostResult.insertId;

      console.log(`Seeding ICMP item for Host ID ${hostId}...`);
      const [itemResult] = await connection.query(`
        INSERT INTO items (host_id, name, key_name, type, data_type, interval_seconds)
        VALUES (?, 'ICMP Ping', 'icmpping', 'icmp', 'boolean', 10)
      `, [hostId]);
      const itemId = itemResult.insertId;

      console.log(`Seeding Trigger for Item ID ${itemId}...`);
      await connection.query(`
        INSERT INTO triggers (name, item_id, operator, threshold, severity)
        VALUES ('Servidor-Prueba no responde', ?, '=', 0, 'high')
      `, [itemId]);
      
      console.log('Seed completed successfully!');
    } else {
      console.log('Test host "Servidor-Prueba" already exists. Skipping seed.');
    }

    console.log('All database alterations and seeding finished successfully! 🎉');
  } catch (err) {
    console.error('Failed to alter/seed database:', err);
  } finally {
    if (connection) await connection.end();
  }
}

alterAndSeed();
