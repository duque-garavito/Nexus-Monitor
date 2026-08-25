const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  let connection;
  try {
    const dbName = process.env.DB_NAME || 'nexus_monitor';
    console.log(`Connecting to MySQL database "${dbName}" to run Templates tables migration...`);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      database: dbName
    });

    // 1. Create templates table
    console.log('Creating "templates" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(150) NOT NULL UNIQUE,
          description TEXT,
          type VARCHAR(50) DEFAULT 'generic',
          enabled TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Create template_items table
    console.log('Creating "template_items" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS template_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          template_id INT NOT NULL,
          name VARCHAR(150) NOT NULL,
          key_name VARCHAR(150) NOT NULL,
          type ENUM('agent', 'snmp', 'icmp', 'http', 'custom') NOT NULL,
          data_type ENUM('numeric', 'text', 'boolean') DEFAULT 'numeric',
          unit VARCHAR(20),
          interval_seconds INT DEFAULT 60,
          enabled TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_template_items_template
              FOREIGN KEY (template_id) REFERENCES templates(id)
              ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create host_templates table
    console.log('Creating "host_templates" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS host_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          host_id INT NOT NULL,
          template_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_host_template (host_id, template_id),
          CONSTRAINT fk_host_templates_host
              FOREIGN KEY (host_id) REFERENCES hosts(id)
              ON DELETE CASCADE,
          CONSTRAINT fk_host_templates_template
              FOREIGN KEY (template_id) REFERENCES templates(id)
              ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create template_triggers table
    console.log('Creating "template_triggers" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS template_triggers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          template_id INT NOT NULL,
          template_item_id INT NOT NULL,
          name VARCHAR(200) NOT NULL,
          operator ENUM('>', '<', '>=', '<=', '=', '!=') NOT NULL,
          threshold DOUBLE,
          severity ENUM('information', 'warning', 'average', 'high', 'critical') DEFAULT 'warning',
          enabled TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_template_triggers_template
              FOREIGN KEY (template_id) REFERENCES templates(id)
              ON DELETE CASCADE,
          CONSTRAINT fk_template_triggers_item
              FOREIGN KEY (template_item_id) REFERENCES template_items(id)
              ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Alter items table to support template relation
    console.log('Altering "items" table...');
    const [cols] = await connection.query('SHOW COLUMNS FROM items LIKE "template_item_id"');
    if (cols.length === 0) {
      await connection.query('ALTER TABLE items ADD COLUMN template_item_id INT NULL');
      await connection.query('ALTER TABLE items ADD COLUMN inherited TINYINT(1) DEFAULT 0');
      await connection.query(`
        ALTER TABLE items
        ADD CONSTRAINT fk_items_template_item
            FOREIGN KEY (template_item_id) REFERENCES template_items(id)
            ON DELETE SET NULL
      `);
      console.log('Altered "items" table successfully!');
    } else {
      console.log('"items" table alterations already applied.');
    }

    console.log('Templates schema migration completed successfully! 🎉');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (connection) await connection.end();
  }
}

run();
