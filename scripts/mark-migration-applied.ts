import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'local.db'));

// Create the migrations table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL,
    created_at INTEGER
  )
`);

// Mark the current migration as applied
const migrationHash = '0000_tiresome_nightcrawler';
const now = Date.now();

db.prepare(`
  INSERT OR IGNORE INTO __drizzle_migrations (hash, created_at) 
  VALUES (?, ?)
`).run(migrationHash, now);

console.log(`Marked migration ${migrationHash} as applied`);

db.close();
