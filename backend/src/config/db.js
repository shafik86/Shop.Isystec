const { Pool } = require("pg");

const pool = new Pool({
  connectionString: `postgresql://postgres:postgres123@localhost:5432/izwan_ecommerce`
});

// Test connection
pool.on('connect', (client) => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
