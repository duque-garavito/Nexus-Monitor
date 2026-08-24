const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  let connection;
  try {
    const dbName = process.env.DB_NAME || 'nexus_monitor';
    console.log(`Connecting to MySQL to migrate to Zabbix schema in database "${dbName}"...`);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    });

    // 1. Drop old tables/database if they exist or just drop tables to clear conflicts
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    
    console.log('Dropping old tables to prevent conflicts...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS alerts');
    await connection.query('DROP TABLE IF EXISTS triggers');
    await connection.query('DROP TABLE IF EXISTS item_history');
    await connection.query('DROP TABLE IF EXISTS items');
    await connection.query('DROP TABLE IF EXISTS hosts');
    await connection.query('DROP TABLE IF EXISTS monitoring_metrics');
    await connection.query('DROP TABLE IF EXISTS devices');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Create hosts table
    console.log('Creating "hosts" table...');
    await connection.query(`
      CREATE TABLE hosts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          hostname VARCHAR(255),
          ip VARCHAR(45) NOT NULL UNIQUE,
          type ENUM(
              'server',
              'computer',
              'router',
              'switch',
              'firewall',
              'printer',
              'access_point',
              'other'
          ) DEFAULT 'other',
          status ENUM(
              'unknown',
              'online',
              'offline',
              'warning'
          ) DEFAULT 'unknown',
          enabled BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create items table
    console.log('Creating "items" table...');
    await connection.query(`
      CREATE TABLE items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          host_id INT NOT NULL,
          name VARCHAR(150) NOT NULL,
          key_name VARCHAR(150) NOT NULL,
          type ENUM(
              'agent',
              'snmp',
              'icmp',
              'http',
              'custom'
          ) NOT NULL,
          data_type ENUM(
              'numeric',
              'text',
              'boolean'
          ) DEFAULT 'numeric',
          unit VARCHAR(20),
          interval_seconds INT DEFAULT 60,
          enabled BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (host_id)
              REFERENCES hosts(id)
              ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create item_history table
    console.log('Creating "item_history" table...');
    await connection.query(`
      CREATE TABLE item_history (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          item_id INT NOT NULL,
          value_numeric DOUBLE,
          value_text TEXT,
          collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id)
              REFERENCES items(id)
              ON DELETE CASCADE,
          INDEX idx_item_time (
              item_id,
              collected_at
          )
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create triggers table
    console.log('Creating "triggers" table...');
    await connection.query(`
      CREATE TABLE triggers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          item_id INT NOT NULL,
          operator ENUM(
              '>',
              '<',
              '>=',
              '<=',
              '=',
              '!='
          ) NOT NULL,
          threshold DOUBLE,
          severity ENUM(
              'information',
              'warning',
              'average',
              'high',
              'critical'
          ) DEFAULT 'warning',
          enabled BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id)
              REFERENCES items(id)
              ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Create alerts table
    console.log('Creating "alerts" table...');
    await connection.query(`
      CREATE TABLE alerts (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          trigger_id INT NOT NULL,
          item_id INT NOT NULL,
          status ENUM(
              'problem',
              'resolved'
          ) DEFAULT 'problem',
          severity ENUM(
              'information',
              'warning',
              'average',
              'high',
              'critical'
          ) NOT NULL,
          message TEXT,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP NULL,
          FOREIGN KEY (trigger_id) REFERENCES triggers(id) ON DELETE CASCADE,
          FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Seed initial Host, Item and Trigger
    console.log('Seeding initial host data (Servidor-01)...');
    const [hostResult] = await connection.query(`
      INSERT INTO hosts (name, hostname, ip, type)
      VALUES ('Servidor-01', 'SRV01', '192.168.1.10', 'server')
    `);
    const hostId = hostResult.insertId;

    console.log(`Seeding initial item (ICMP Ping) for Host ID: ${hostId}...`);
    const [itemResult] = await connection.query(`
      INSERT INTO items (host_id, name, key_name, type, data_type, unit, interval_seconds)
      VALUES (?, 'ICMP Ping', 'icmpping', 'icmp', 'boolean', '', 10)
    `, [hostId]);
    const itemId = itemResult.insertId;

    console.log(`Seeding initial trigger (Servidor-01 no responde) for Item ID: ${itemId}...`);
    await connection.query(`
      INSERT INTO triggers (name, item_id, operator, threshold, severity)
      VALUES ('Servidor-01 no responde', ?, '=', 0, 'high')
    `, [itemId]);

    console.log('Zabbix schema migration and seeding completed successfully! 🚀');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
