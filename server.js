const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');


const app = express();
const PORT = 3232;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/assets', express.static('assets'));
app.use('/testing', express.static('testing'));

// Database setup
const db = new sqlite3.Database('monsters.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS monsters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sprite TEXT NOT NULL,
    parts TEXT NOT NULL,
    family TEXT,
    rarity REAL DEFAULT 1
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS creations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sprite TEXT NOT NULL,
    parent_monsters TEXT NOT NULL,
    author TEXT DEFAULT 'Anonymous',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    creation_data TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monster_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    family TEXT NOT NULL,
    sprite TEXT NOT NULL,
    attack INTEGER DEFAULT 0,
    defense INTEGER DEFAULT 0,
    speed INTEGER DEFAULT 0,
    traits TEXT,
    skills TEXT,
    FOREIGN KEY (monster_id) REFERENCES monsters(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS joints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part_id TEXT NOT NULL,
    joints TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // // Add family column if it doesn't exist and update existing records
  // db.run(`ALTER TABLE monsters ADD COLUMN family TEXT`, (err) => {
  //   if (err && !err.message.includes('duplicate column')) {
  //     console.error('Error adding family column:', err);
  //   } else {
  //     // Update existing monsters with family values
  //     const familyUpdates = [
  //       { family: 'Bird', names: ['Azurile', 'Dracky', 'Zapbird', 'Whipbird', 'BullBird', 'CoilBird', 'DuckKite', 'FunkyBird', 'KiteHawk', 'MadCondor', 'MadGoose', 'MadPecker', 'MadRaven', 'RainHawk', 'AquaHawk', 'BigRoost', 'FloraJay', 'MistyWing', 'Picky', 'Pteranod'] },
  //       { family: 'Demon', names: ['BossTroll', 'EyeBall', 'AgDevil', 'ArcDemon', 'CragDevil', 'DeadNoble', 'Demonite', 'EvilArmor', 'EvilBeast', 'EvilPot', 'EvilSeed', 'EvilWand', 'EvilWell', 'GateGuard', 'Hargon', 'MadKnight', 'MadSpirit', 'Niterich', 'NiteWhip', 'Reaper', 'RogueNite', 'Shadow', 'DeadNite', 'Skeletor', 'Servant', 'Vampirus'] },
  //       { family: 'Beast', names: ['Catfly', 'KingLeo', 'WalrusMan', 'BeastNite', 'Beavern', 'CatMage', 'Centasaur', 'Grizzly', 'Hork', 'LandOwl', 'Lionex', 'MadCat', 'PillowRat', 'WildApe', 'Yeti', 'Watabou', 'Warubou'] },
  //       { family: 'Dragon', names: ['FairyDrak', 'Swordgon', 'Chamelgon', 'DracoLord (Dragon)', 'Dragon', 'DragonKid', 'Drygon', 'GigaDraco', 'LordDraco', 'MadDragon', 'MetalDrak', 'Orochi', 'Phoenix', 'SkyDragon', 'Tortragon', 'Wyvern'] },
  //       { family: 'Material', names: ['Golem', 'Stoneman', 'Roboster2', 'BombCrag', 'CurseLamp', 'EvilPot', 'GoldGolem', 'IceMan', 'LavaMan', 'MadCandle', 'MadMirror', 'Mimic', 'ProtoMech', 'Roboster'] },
  //       { family: 'Bug', names: ['Lipsy', 'ArmorPede', 'ArmyAnt', 'Butterfly', 'Catapila', 'HornBeet', 'MadHornet', 'StagBug', 'WeedBug', 'WarMantis'] },
  //       { family: 'Plant', names: ['Eggplaton', 'AmberWeed', 'DanceVegi', 'Devipine', 'Egdracil', 'FireWeed', 'GhosTree', 'HerbMan', 'MadPlant', 'ManEater', 'Rosevine', 'Toadstool', 'TreeBoy', 'TreeSlime', 'WingTree'] },
  //       { family: 'Slime', names: ['MetalKing', 'PearlGel', 'DrakSlime', 'WingSlime', 'BoxSlime', 'FangSlime', 'GoldSlime', 'GranSlime', 'HaloSlime', 'KingSlime', 'MimeSlime', 'RockSlime', 'Slime', 'SlimeBorg', 'SlimeNite', 'SpotSlime', 'TropicGel'] },
  //       { family: 'Aquatic', names: ['Aquadon', 'Aquarella', 'Clawster', 'FishRider', 'Merman', 'MerTiger', 'Moray', 'Octogon', 'Octokid', 'Octoraid', 'Octoreach', 'Poseidon', 'PutreFish', 'RogueWave', 'RushFish', 'Scallopa', 'SeaHorse', 'WhaleMage'] },
  //       { family: 'Undead', names: ['CaptDead', 'DeadNoble', 'Mummy', 'RotRaven', 'DeadNite', 'Skeletor', 'Skularach', 'Skulpent', 'SkulRider', 'Spooky'] },
  //       { family: 'Nature', names: ['Almiraj', 'Anemon', 'Babble', 'CloudKing', 'Coatol', 'Copycat', 'Darck', 'Digster', 'Droll', 'Dumbira', 'Emyu', 'Facer', 'Gasgon', 'Gismo', 'Goategon', 'GoatHorn', 'GoHopper', 'Goopi', 'Gophecada', 'Gorago', 'Gulpple', 'Healer', 'HoodSquid', 'Jamirus', 'JewelBag', 'KingCobra', 'KingSquid', 'LampGenie', 'Lazamanus', 'MadGopher', 'Mommonja', 'MudDoll', 'Mudou', 'Mudron', 'Oniono', 'Orc', 'Orligon', 'Petiteel', 'Pixy', 'Poisongon', 'PomPomBom', 'Pumpoise', 'Puppetor', 'Putrepup', 'Pyuro', 'Saccer', 'Serpentia', 'Shantak', 'Sickler', 'Slabbit', 'Slurperon', 'Snaily', 'SnakeBat', 'Snapper', 'SpikyBoy', 'SpotKing', 'StubSuck', 'SuperTen', 'TailEater', 'Tonguella', 'Trumpeter', 'Voodoll', 'WindBeast', 'WindMerge', 'WingSnake', 'WonderEgg'] },
  //       { family: '?', names: ['Zoma', '1EyeClown', 'Akubar', 'Andreal', 'Angleron', 'ArmyCrab', 'AsuraZoma', 'AxeShark', 'Balzak', 'Baramos', 'BattleRex', 'BeanMan', 'BigEye', 'Blizzardy', 'Brushead', 'Bubblemon', 'CactiBall', 'CancerMan', 'ChopClown', 'DarkCrab', 'DarkDrium', 'DarkEye', 'DarkHorn', 'DarkMate', 'DeathMore', 'DeathMore (Final Form)', 'DeathMore (Transformed)', 'Durran', 'Esterk', 'Exaucers', 'Eyeder', 'FoxFire', 'Gamanian', 'Genosidoh', 'GiantMoth', 'GiantSlug', 'GiantWorm', 'Gigantes', 'Grakos', 'Gremlin', 'Grendal', 'HammerMan', 'Inverzon', 'IronTurt', 'LizardMan', 'LizardFly', 'Metabble', 'Metaly', 'Mirudraas', 'Mirudraas (Transformed)', 'Ogre', 'Orgodemir', 'Orgodemir (Transformed)', 'Pizzaro', 'RayGigas', 'SabreMan', 'Sidoh', 'Skullgon', 'WhiteKing'] }
  //     ];
      
  //     familyUpdates.forEach(({ family, names }) => {
  //       names.forEach(name => {
  //         db.run('UPDATE monsters SET family = ? WHERE name = ? AND family IS NULL', [family, name]);
  //       });
  //     });
  //   }
  // });
  
  // Add author column if it doesn't exist
  db.run(`ALTER TABLE creations ADD COLUMN author TEXT DEFAULT 'Anonymous'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding author column:', err);
    } else {
      db.run('UPDATE creations SET author = "Anonymous" WHERE author IS NULL');
    }
  });
  
  // Add source column if it doesn't exist
  db.run(`ALTER TABLE creations ADD COLUMN source TEXT DEFAULT 'main'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding source column:', err);
    } else {
      db.run('UPDATE creations SET source = "main" WHERE source IS NULL');
    }
  });
  
  // Add rarity column if it doesn't exist
  // db.run(`ALTER TABLE monsters ADD COLUMN rarity REAL DEFAULT 1`, (err) => {
  //   if (err && !err.message.includes('duplicate column')) {
  //     console.error('Error adding rarity column:', err);
  //   } else {
  //     // Update monsters with rarity values
  //     const rarityData = [
  //       { "name": "DrakSlime", "stars": 2 },
  //       { "name": "SpotSlime", "stars": 0.5 },
  //       { "name": "WingSlime", "stars": 1.5 },
  //       { "name": "TreeSlime", "stars": 1 },
  //       { "name": "Snaily", "stars": 0.5 },
  //       { "name": "SlimeNite", "stars": 2 },
  //       { "name": "Babble", "stars": 1 },
  //       { "name": "BoxSlime", "stars": 1.5 },
  //       { "name": "PearlGel", "stars": 1.5 },
  //       { "name": "Slime", "stars": 1 },
  //       { "name": "Healer", "stars": 1.5 },
  //       { "name": "FangSlime", "stars": 2 },
  //       { "name": "RockSlime", "stars": 2 },
  //       { "name": "SlimeBorg", "stars": 2 },
  //       { "name": "Slabbit", "stars": 0.5 },
  //       { "name": "KingSlime", "stars": 3 },
  //       { "name": "Metaly", "stars": 2.5 },
  //       { "name": "Metabble", "stars": 3 },
  //       { "name": "SpotKing", "stars": 2.5 },
  //       { "name": "TropicGel", "stars": 1 },
  //       { "name": "MimeSlime", "stars": 2.5 },
  //       { "name": "HaloSlime", "stars": 2.5 },
  //       { "name": "MetalKing", "stars": 3 },
  //       { "name": "GoldSlime", "stars": 3.5 },
  //       { "name": "GranSlime", "stars": 4 },
  //       { "name": "Darck", "stars": 3.5 }
  //     ];
  //     
  //     let skippedMonsters = [];
  //     
  //     // rarityData.forEach(({ name, stars }) => {
  //     //   db.get('SELECT id FROM monsters WHERE name = ?', [name], (err, row) => {
  //     //     if (err) {
  //     //       console.error('Database error:', err);
  //     //       return;
  //     //     }
  //     //     
  //     //     if (row) {
  //     //       db.run('UPDATE monsters SET rarity = ? WHERE name = ?', [stars, name]);
  //     //     } else {
  //     //       skippedMonsters.push(name);
  //     //     }
  //     //   });
  //     // });
  //     
  //     setTimeout(() => {
  //       if (skippedMonsters.length > 0) {
  //         console.log('Skipped monsters (not found in database):', skippedMonsters);
  //       }
  //     }, 1000);
  //   }
  // });
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
  const { source } = req.query;
  let query = 'SELECT * FROM creations';
  let params = [];
  
  if (source) {
    query += ' WHERE source = ?';
    params.push(source);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/creations', (req, res) => {
  const { name, sprite, parentMonsters, author, creationData, source } = req.body;
  db.run('INSERT INTO creations (name, sprite, parent_monsters, author, creation_data, source) VALUES (?, ?, ?, ?, ?, ?)', 
    [name, sprite, JSON.stringify(parentMonsters), author || 'Anonymous', JSON.stringify(creationData), source || 'main'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put('/api/creations/:id', (req, res) => {
  const { id } = req.params;
  const { author } = req.body;
  db.run('UPDATE creations SET author = ? WHERE id = ?', [author, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
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

app.get('/family_assigner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'family_assigner.html'));
});

app.get('/api/unassigned-monsters', (req, res) => {
  db.all('SELECT * FROM monsters ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/assign-family', (req, res) => {
  const { monsterId, family } = req.body;
  db.run('UPDATE monsters SET family = ? WHERE id = ?', [family, monsterId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/remove-family', (req, res) => {
  const { monsterId } = req.body;
  db.run('UPDATE monsters SET family = NULL WHERE id = ?', [monsterId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/clear-families', (req, res) => {
  db.run('UPDATE monsters SET family = NULL', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All families cleared' });
  });
});

app.post('/api/rename-monster', (req, res) => {
  const { monsterId, newName } = req.body;
  db.run('UPDATE monsters SET name = ? WHERE id = ?', [newName, monsterId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/delete-monster', (req, res) => {
  const { monsterId } = req.body;
  db.run('DELETE FROM monsters WHERE id = ?', [monsterId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get parts with joints
app.get('/api/parts-with-joints', (req, res) => {
  const query = `
    SELECT DISTINCT part_id, joints 
    FROM joints 
    WHERE joints IS NOT NULL AND joints != '[]'
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const partsWithJoints = {};
    rows.forEach(row => {
      partsWithJoints[row.part_id] = JSON.parse(row.joints);
    });
    
    res.json(partsWithJoints);
  });
});

// Joint API endpoints
app.get('/api/joints/:partId', (req, res) => {
  const { partId } = req.params;
  db.get('SELECT joints FROM joints WHERE part_id = ? ORDER BY created_at DESC LIMIT 1', [partId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No joints found' });
    res.json(JSON.parse(row.joints));
  });
});

app.post('/api/joints', (req, res) => {
  const { partId, joints } = req.body;
  db.run('INSERT OR REPLACE INTO joints (part_id, joints) VALUES (?, ?)', 
    [partId, JSON.stringify(joints)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/joints/:partId', (req, res) => {
  const { partId } = req.params;
  db.run('DELETE FROM joints WHERE part_id = ?', [partId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.put('/api/monsters/:id/family', (req, res) => {
  const { id } = req.params;
  const { family } = req.body;
  db.run('UPDATE monsters SET family = ? WHERE id = ?', [family, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.put('/api/monsters/:id/rarity', (req, res) => {
  const { id } = req.params;
  const { rarity } = req.body;
  db.run('UPDATE monsters SET rarity = ? WHERE id = ?', [rarity, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Streamliner API endpoints
app.get('/api/monster-parts/:monsterName', (req, res) => {
  const { monsterName } = req.params;
  const fs = require('fs');
  const partsPath = path.join(__dirname, 'assets', 'simple_parts', monsterName);
  
  try {
    if (!fs.existsSync(partsPath)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(partsPath)
      .filter(file => file.endsWith('.png'))
      .map(file => ({
        name: file.replace('.png', ''),
        filename: file
      }));
    
    res.json(files);
  } catch (error) {
    console.error('Error reading parts:', error);
    res.status(500).json({ error: 'Failed to read parts' });
  }
});

app.post('/api/save-combined-part', (req, res) => {
  const { monsterName, partName, imageData, usedFiles } = req.body;
  const fs = require('fs');
  const partsPath = path.join(__dirname, 'assets', 'simple_parts', monsterName);
  
  try {
    // Save the combined image
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    const filename = `${partName}.png`;
    const filepath = path.join(partsPath, filename);
    
    fs.writeFileSync(filepath, base64Data, 'base64');
    
    // Delete the used files, but exclude the newly created file
    usedFiles.forEach(file => {
      if (file !== filename) {
        const filePath = path.join(partsPath, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving combined part:', error);
    res.status(500).json({ error: 'Failed to save combined part' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Monster Maker server running on http://localhost:${PORT}`);
  console.log(`Also accessible on network at http://[YOUR_IP]:${PORT}`);
});