import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'server/database/shopthebarber.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  
  console.log('Connected to database');
  
  // Check table structure
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
      console.error('Error getting table info:', err);
      return;
    }
    console.log('Users table structure:');
    rows.forEach(row => {
      console.log(`  ${row.name} (${row.type})`);
    });
    
    // Check users
    db.all("SELECT id, email, role FROM users LIMIT 5", (err, rows) => {
      if (err) {
        console.error('Error getting users:', err);
        return;
      }
      console.log('\nUsers:');
      rows.forEach(row => {
        console.log(`  ID: ${row.id}, Email: ${row.email}, Role: ${row.role || 'NULL'}`);
      });
      
      db.close();
    });
  });
}); 