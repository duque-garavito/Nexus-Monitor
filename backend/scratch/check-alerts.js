const pool = require('../src/config/database');

async function checkAlerts() {
  try {
    const [alerts] = await pool.query('SELECT * FROM alerts ORDER BY id DESC');
    console.log('All alerts in DB:', alerts);

    const [triggers] = await pool.query('SELECT id, name, current_state FROM triggers');
    console.log('All triggers in DB:', triggers);
  } catch (err) {
    console.error('Failed to query alerts:', err);
  } finally {
    await pool.end();
  }
}

checkAlerts();
