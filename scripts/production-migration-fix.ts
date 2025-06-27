import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// This script handles the migration from push-based to migration-based development
// for production databases that already have tables

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'local.db');
const db = new Database(dbPath);

console.log('🔍 Checking database state...');

// Check if tables already exist
const tablesExist = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name IN ('clients', 'users', 'tasks')
`).all();

if (tablesExist.length > 0) {
  console.log('📋 Existing tables found. Setting up migration tracking...');
  
  // Create the migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER
    )
  `);

  // Check if the initial migration is already marked as applied
  const existingMigration = db.prepare(`
    SELECT hash FROM __drizzle_migrations WHERE hash = ?
  `).get('0000_tiresome_nightcrawler');

  if (!existingMigration) {
    // Mark the initial migration as applied since tables already exist
    const now = Date.now();
    db.prepare(`
      INSERT INTO __drizzle_migrations (hash, created_at) 
      VALUES (?, ?)
    `).run('0000_tiresome_nightcrawler', now);
    
    console.log('✅ Marked initial migration as applied');
  } else {
    console.log('ℹ️  Initial migration already marked as applied');
  }
} else {
  console.log('🆕 No existing tables found. Regular migration will proceed.');
}

db.close();
console.log('🎉 Migration setup complete!');
