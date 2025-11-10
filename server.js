const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');


const app = express();
const PORT = 3232;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('monsters.db');

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

// API Routes
app.get('/api/monsters', (req, res) => {
  db.all('SELECT * FROM monsters', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/monsters', (req, res) => {
  const { name, sprite, parts } = req.body;
  db.run('INSERT INTO monsters (name, sprite, parts) VALUES (?, ?, ?)', 
    [name, sprite, JSON.stringify(parts)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.get('/api/creations', (req, res) => {
  db.all('SELECT * FROM creations ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/creations', (req, res) => {
  const { name, sprite, parentMonsters } = req.body;
  db.run('INSERT INTO creations (name, sprite, parent_monsters) VALUES (?, ?, ?)', 
    [name, sprite, JSON.stringify(parentMonsters)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.delete('/api/wipe', (req, res) => {
  db.run('DELETE FROM monsters', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM creations', (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Database wiped' });
    });
  });
});

app.post('/api/seed', (req, res) => {
  const fs = require('fs');
  
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
  
  // Scan and create monsters
  function scanAndCreateMonsters() {
    const monsters = [];
    
    try {
      const monsterFiles = fs.readdirSync('assets/monsters')
        .filter(file => file.endsWith('.png'))
        .map(file => file.replace('.png', ''));
      
      monsterFiles.forEach(monsterName => {
        // Check if monster already exists
        db.get('SELECT id FROM monsters WHERE name = ?', [monsterName], (err, row) => {
          if (err) {
            console.error('Database error:', err);
            return;
          }
          
          if (row) {
            console.log(`Monster '${monsterName}' already exists, skipping`);
            return;
          }
          
          console.log(`Processing monster: ${monsterName}`);
          
          const sprite = pngToBase64(`assets/monsters/${monsterName}.png`);
          const partsPath = `assets/parts/${monsterName}`;
          let parts = {};
          
          if (fs.existsSync(partsPath)) {
            // Scan for all PNG files in the parts folder
            const partFiles = fs.readdirSync(partsPath)
              .filter(file => file.endsWith('.png'))
              .map(file => file.replace('.png', ''));
            
            partFiles.forEach(partName => {
              const partFile = `${partsPath}/${partName}.png`;
              parts[partName] = pngToBase64(partFile);
              console.log(`  - Loaded ${partName}`);
            });
          }
          
          // Insert monster
          db.run('INSERT INTO monsters (name, sprite, parts) VALUES (?, ?, ?)', 
            [monsterName, sprite, JSON.stringify(parts)], function(err) {
            if (err) {
              console.error('Insert error:', err);
            } else {
              console.log(`Added monster: ${monsterName}`);
            }
          });
        });
      });
      
    } catch (error) {
      console.error('Error scanning assets:', error);
    }
  }
  
  scanAndCreateMonsters();
  res.json({ message: 'Database seeding initiated' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Monster Maker server running on http://localhost:${PORT}`);
  console.log(`Also accessible on network at http://[YOUR_IP]:${PORT}`);
});