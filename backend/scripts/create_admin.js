/**
 * Create Admin User Script
 * ------------------------
 * Run this ONCE after setting up the database to create the admin account.
 *
 * Usage:
 *   cd backend
 *   node scripts/create_admin.js
 *
 * Or with custom values:
 *   ADMIN_NAME="John" ADMIN_EMAIL="john@example.com" ADMIN_PASSWORD="secret123" node scripts/create_admin.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcrypt');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Admin';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@izwan.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  console.log('Connecting to database...');

  try {
    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log(`⚠  Admin already exists: ${ADMIN_EMAIL}`);
      console.log('   To reset password, delete the user and run this script again.');
      return;
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, name, email, role`,
      [ADMIN_NAME, ADMIN_EMAIL, hashed]
    );

    const user = result.rows[0];
    console.log('✓ Admin user created successfully!');
    console.log('  ID    :', user.id);
    console.log('  Name  :', user.name);
    console.log('  Email :', user.email);
    console.log('  Role  :', user.role);
    console.log('');
    console.log('  Login credentials:');
    console.log('  Email   :', ADMIN_EMAIL);
    console.log('  Password:', ADMIN_PASSWORD);
    console.log('');
    console.log('  ⚠  Change the password after first login!');

  } catch (err) {
    console.error('✗ Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
