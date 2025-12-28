const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('monsters.db');

// Add growth rate columns to parts table if they don't exist
db.serialize(() => {
  db.run('ALTER TABLE parts ADD COLUMN hp_growth INTEGER DEFAULT 0', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding hp_growth column:', err);
    } else {
      console.log('✓ hp_growth column ready');
    }
  });
  
  db.run('ALTER TABLE parts ADD COLUMN mp_growth INTEGER DEFAULT 0', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding mp_growth column:', err);
    } else {
      console.log('✓ mp_growth column ready');
    }
  });
  
  db.run('ALTER TABLE parts ADD COLUMN strength_growth INTEGER DEFAULT 0', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding strength_growth column:', err);
    } else {
      console.log('✓ strength_growth column ready');
    }
  });
});

console.log('\n=== Growth Rate Migration Complete ===');
console.log('\nThe Dragon Quest Wiki API does not contain detailed stat growth');
console.log('rates for Dragon Warrior Monsters 2. The database schema has been');
console.log('updated with the necessary columns:');
console.log('- hp_growth (INTEGER)');
console.log('- mp_growth (INTEGER)');
console.log('- strength_growth (INTEGER)');
console.log('\nTo add actual growth rate data, you would need to:');
console.log('1. Find a reliable source (GameFAQs guides, strategy books, etc.)');
console.log('2. Manually update the parts table with real values');
console.log('3. Example: UPDATE parts SET hp_growth=7, mp_growth=5 WHERE monster_id=1');

setTimeout(() => {
  db.close();
}, 1000);