const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateSchema() {
  try {
    console.log('Connecting to database...');
    
    // Add columns if they don't exist
    await pool.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Honduras',
      ADD COLUMN IF NOT EXISTS localidad TEXT;
    `);
    
    console.log('✅ Schema updated successfully (pais and localidad columns added).');
  } catch (error) {
    console.error('❌ Error updating schema:', error);
  } finally {
    await pool.end();
    console.log('Connection closed.');
  }
}

updateSchema();
