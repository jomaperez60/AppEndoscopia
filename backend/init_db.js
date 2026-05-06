const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    console.log('Connecting to database...');
    await pool.query(schemaSql);
    console.log('✅ Tables created successfully.');

    // Create initial admin user if not exists.
    // We intentionally avoid any hardcoded default password.
    const adminCheck = await pool.query('SELECT username FROM users WHERE username = $1', ['admin']);
    
    if (adminCheck.rows.length === 0) {
      const initialPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      if (!initialPassword) {
        throw new Error(
          'DEFAULT_ADMIN_PASSWORD is required to initialize admin user. ' +
          'Set it in your environment before running init_db.js.'
        );
      }
      console.log('Creating initial admin user...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(initialPassword, salt);
      
      await pool.query(
        'INSERT INTO users (username, password_hash, role, avatar) VALUES ($1, $2, $3, $4)',
        ['admin', hash, 'admin', 'Dr']
      );
      const masked = `${initialPassword.slice(0, 2)}${'*'.repeat(Math.max(initialPassword.length - 2, 0))}`;
      console.log(`✅ Initial admin user created (admin / ${masked}).`);
      console.log('⚠️ Change this password immediately after first login.');
    } else {
      console.log('ℹ️ Admin user already exists. Skipping...');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await pool.end();
    console.log('Connection closed.');
  }
}

initDb();
