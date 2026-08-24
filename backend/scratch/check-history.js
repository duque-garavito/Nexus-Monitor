const pool = require('../src/config/database');

async function checkHistory() {
  try {
    const [rows] = await pool.query('SELECT * FROM item_history ORDER BY id DESC LIMIT 5');
    console.log('Last 5 rows in item_history:', rows);

    const [hosts] = await pool.query('SELECT id, name, status FROM hosts');
    console.log('Hosts status:', hosts);
  } catch (err) {
    console.error('Failed to query tables:', err);
  } finally {
    await pool.end();
  }
}

checkHistory();
