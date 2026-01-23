const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./monsters.db');

db.all('SELECT name, rarity FROM monsters ORDER BY name', (err, rows) => {
    if (err) {
        console.error('Error querying database:', err);
        return;
    }
    
    const output = rows.map(row => `${row.name}: ${row.rarity || 1}★`).join('\n');
    
    fs.writeFileSync('monster-rarity.txt', output);
    console.log(`Generated monster-rarity.txt with ${rows.length} monsters`);
    
    db.close();
});