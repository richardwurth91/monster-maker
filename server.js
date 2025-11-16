const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');


const app = express();
const PORT = 4242;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// Database setup
const db = new sqlite3.Database('monsters.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS monsters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sprite TEXT NOT NULL,
    parts TEXT NOT NULL,
    family TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS creations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sprite TEXT NOT NULL,
    parent_monsters TEXT NOT NULL,
    author TEXT DEFAULT 'Anonymous',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add family column if it doesn't exist and update existing records
  db.run(`ALTER TABLE monsters ADD COLUMN family TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding family column:', err);
    } else {
      // Update existing monsters with family values
      const familyUpdates = [
        { family: 'Bird', names: ['Azurile', 'Dracky', 'Zapbird', 'Whipbird'] },
        { family: 'Demon', names: ['Boss Troll', 'Eyeball'] },
        { family: 'Beast', names: ['Catfly', 'King Leo', 'Walrusman'] },
        { family: 'Dragon', names: ['Fairydrak', 'Swordgon'] },
        { family: 'Material', names: ['Golem', 'Stoneman', 'Roboster2'] },
        { family: 'Bug', names: ['Lipsy'] },
        { family: 'Plant', names: ['Eggplaton'] },
        { family: 'Slime', names: ['Metal King Slime', 'Pearlgel', 'Drakeslime', 'Wingslime'] },
        { family: '?', names: ['Zoma'] }
      ];
      
      familyUpdates.forEach(({ family, names }) => {
        names.forEach(name => {
          db.run('UPDATE monsters SET family = ? WHERE name = ? AND family IS NULL', [family, name]);
        });
      });
    }
  });
  
  // Add author column if it doesn't exist
  db.run(`ALTER TABLE creations ADD COLUMN author TEXT DEFAULT 'Anonymous'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding author column:', err);
    } else {
      db.run('UPDATE creations SET author = "Anonymous" WHERE author IS NULL');
    }
  });
});

// API Routes
app.get('/api/monsters', (req, res) => {
  db.all('SELECT * FROM monsters', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/monsters', (req, res) => {
  const { name, sprite, parts, family } = req.body;
  db.run('INSERT INTO monsters (name, sprite, parts, family) VALUES (?, ?, ?, ?)', 
    [name, sprite, JSON.stringify(parts), family || null], function(err) {
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
  const { name, sprite, parentMonsters, author } = req.body;
  db.run('INSERT INTO creations (name, sprite, parent_monsters, author) VALUES (?, ?, ?, ?)', 
    [name, sprite, JSON.stringify(parentMonsters), author || 'Anonymous'], function(err) {
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

app.delete('/api/creations/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM creations WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Creation deleted' });
  });
});

app.post('/api/cleanup', (req, res) => {
  // Update creations that use old monster names
  db.run(`UPDATE creations SET parent_monsters = REPLACE(parent_monsters, '"KingLeo"', '"King Leo"') WHERE parent_monsters LIKE '%KingLeo%'`);
  db.run(`UPDATE creations SET parent_monsters = REPLACE(parent_monsters, '"skeleton_soldier"', '"Skeleton Soldier"') WHERE parent_monsters LIKE '%skeleton_soldier%'`);
  db.run(`UPDATE creations SET parent_monsters = REPLACE(parent_monsters, '"boss_troll"', '"Boss Troll"') WHERE parent_monsters LIKE '%boss_troll%'`);
  
  // Delete old monster entries
  db.run(`DELETE FROM monsters WHERE name IN ('KingLeo', 'skeleton_soldier', 'boss_troll')`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cleanup completed' });
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

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Monster Maker server running on http://localhost:${PORT}`);
  console.log(`Also accessible on network at http://[YOUR_IP]:${PORT}`);
});