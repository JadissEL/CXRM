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
  
  // Update users without role
  db.run('UPDATE users SET role = "client" WHERE role IS NULL OR role = ""', (err) => {
    if (err) {
      console.error('Error updating users:', err);
      return;
    }
    console.log('Updated users with default role');
    
    // Check users again
    db.all("SELECT id, email, role FROM users", (err, rows) => {
      if (err) {
        console.error('Error getting users:', err);
        return;
      }
      console.log('\nUpdated users:');
      rows.forEach(row => {
        console.log(`  ID: ${row.id}, Email: ${row.email}, Role: ${row.role}`);
      });
      
      db.close();
    });
  });
}); 