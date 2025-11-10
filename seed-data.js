const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('monsters.db');

// Helper function to convert PNG to base64
function pngToBase64(filePath) {
    try {
        const data = fs.readFileSync(filePath);
        return `data:image/png;base64,${data.toString('base64')}`;
    } catch (err) {
        console.warn(`Could not read ${filePath}, using placeholder`);
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }
}

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS monsters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sprite TEXT NOT NULL,
    parts TEXT NOT NULL
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS creations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sprite TEXT NOT NULL,
    parent_monsters TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Dynamically scan assets folders and create monster data
function scanAndCreateMonsters() {
    const monsters = [];
    
    try {
        // Get all PNG files in monsters folder
        const monsterFiles = fs.readdirSync('assets/monsters')
            .filter(file => file.endsWith('.png'))
            .map(file => file.replace('.png', ''));
        
        monsterFiles.forEach(monsterName => {
            // Check if monster already exists in database
            const existing = db.prepare('SELECT id FROM monsters WHERE name = ?').get(monsterName);
            if (existing) {
                console.log(`Monster '${monsterName}' already exists, skipping`);
                return;
            }
            
            console.log(`Processing monster: ${monsterName}`);
            
            // Load monster sprite
            const sprite = pngToBase64(`assets/monsters/${monsterName}.png`);
            
            // Check if parts folder exists
            const partsPath = `assets/parts/${monsterName}`;
            let parts = {};
            
            if (fs.existsSync(partsPath)) {
                console.log(`Found parts folder for ${monsterName}`);
                
                // Scan for all PNG files in the parts folder
                const partFiles = fs.readdirSync(partsPath)
                    .filter(file => file.endsWith('.png'))
                    .map(file => file.replace('.png', ''));
                
                partFiles.forEach(partName => {
                    const partFile = `${partsPath}/${partName}.png`;
                    parts[partName] = pngToBase64(partFile);
                    console.log(`  - Loaded ${partName}`);
                });
            } else {
                console.log(`No parts folder found for ${monsterName}`);
            }
            
            monsters.push({
                name: monsterName,
                sprite: sprite,
                parts: parts
            });
        });
        
    } catch (error) {
        console.error('Error scanning assets:', error);
    }
    
    return monsters;
}

db.serialize(() => {
    const monsters = scanAndCreateMonsters();
    
    if (monsters.length > 0) {
        const stmt = db.prepare('INSERT INTO monsters (name, sprite, parts) VALUES (?, ?, ?)');
        
        monsters.forEach(monster => {
            stmt.run(monster.name, monster.sprite, JSON.stringify(monster.parts));
            console.log(`Added monster: ${monster.name}`);
        });
        
        stmt.finalize();
        console.log(`${monsters.length} new monsters added to database`);
    } else {
        console.log('No new monsters to add');
    }
});

db.close();