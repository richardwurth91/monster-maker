const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('monsters.db');

console.log('Adding growth rate columns to parts table...');

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
  
  setTimeout(() => {
    console.log('\nDatabase schema updated successfully!');
    console.log('Growth rate columns added: hp_growth, mp_growth, strength_growth');
    console.log('\nNote: The Dragon Quest Wiki API does not contain the detailed');
    console.log('stat growth rates for Dragon Warrior Monsters 2.');
    console.log('\nTo add real data, you would need to:');
    console.log('1. Find a reliable source (GameFAQs, strategy guides, etc.)');
    console.log('2. Manually update the database with actual values');
    db.close();
  }, 1000);
});