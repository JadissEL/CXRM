import { run, query } from './db.js';

async function migrate() {
  try {
    console.log('Starting database migration...');

    // Check if columns exist and add them if they don't
    const columns = [
      { name: 'is_active', type: 'BOOLEAN DEFAULT 1' },
      { name: 'is_verified', type: 'BOOLEAN DEFAULT 0' },
      { name: 'latitude', type: 'DECIMAL(10,8)' },
      { name: 'longitude', type: 'DECIMAL(11,8)' },
      { name: 'search_tags', type: 'TEXT' }
    ];

    for (const column of columns) {
      try {
        // Try to add the column
        await run(`ALTER TABLE barbers ADD COLUMN ${column.name} ${column.type}`);
        console.log(`Added column: ${column.name}`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`Column ${column.name} already exists`);
        } else {
          console.error(`Error adding column ${column.name}:`, error.message);
        }
      }
    }

    // Add some sample coordinates to existing barbers
    const sampleCoordinates = [
      { id: 1, lat: 33.5731, lng: -7.5898 }, // Casablanca
      { id: 2, lat: 31.6295, lng: -7.9811 }, // Marrakech
      { id: 3, lat: 34.0209, lng: -6.8416 }, // Rabat
      { id: 4, lat: 34.0181, lng: -5.0078 }, // Fès
      { id: 5, lat: 35.7595, lng: -5.8340 }, // Tanger
      { id: 6, lat: 30.4278, lng: -9.5981 }  // Agadir
    ];

    for (const coord of sampleCoordinates) {
      try {
        await run(`
          UPDATE barbers 
          SET latitude = ?, longitude = ?, is_active = 1, is_verified = 1
          WHERE id = ?
        `, [coord.lat, coord.lng, coord.id]);
        console.log(`Updated coordinates for barber ${coord.id}`);
      } catch (error) {
        console.error(`Error updating barber ${coord.id}:`, error.message);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate(); 