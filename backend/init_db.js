const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    console.log('Connecting to database...');
    await pool.query(schemaSql);
    console.log('✅ Tables created successfully.');

    // Create default admin user if not exists
    const adminCheck = await pool.query('SELECT username FROM users WHERE username = $1', ['admin']);
    
    if (adminCheck.rows.length === 0) {
      console.log('Creating default admin user...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin', salt);
      
      await pool.query(
        'INSERT INTO users (username, password_hash, role, avatar) VALUES ($1, $2, $3, $4)',
        ['admin', hash, 'admin', 'Dr']
      );
      console.log('✅ Default admin user created (admin / admin).');
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
