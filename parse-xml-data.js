const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('monsters.db');

// Add missing columns first
db.serialize(() => {
  db.run('ALTER TABLE parts ADD COLUMN defense_growth INTEGER DEFAULT 0', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding defense_growth column:', err);
    }
  });
  
  db.run('ALTER TABLE parts ADD COLUMN agility_growth INTEGER DEFAULT 0', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding agility_growth column:', err);
    }
  });
  
  db.run('ALTER TABLE parts ADD COLUMN wisdom_growth INTEGER DEFAULT 0', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding wisdom_growth column:', err);
    }
  });
});

function parseXMLMonsterData() {
  const xmlContent = fs.readFileSync('assets/data/monster-data.xml', 'utf8');
  
  // Simple regex parsing for monster data
  const monsterMatches = xmlContent.match(/<monster name="([^"]+)"[^>]*>[\s\S]*?<growth[^>]+\/>/g);
  
  if (!monsterMatches) {
    console.log('No monster data found in XML');
    return [];
  }
  
  const monsters = [];
  
  monsterMatches.forEach(monsterBlock => {
    const nameMatch = monsterBlock.match(/name="([^"]+)"/);
    const growthMatch = monsterBlock.match(/<growth[^>]+\/>/);
    
    if (nameMatch && growthMatch) {
      const name = nameMatch[1];
      const growth = growthMatch[0];
      
      const hp = growth.match(/hp="(\d+)"/)?.[1] || 0;
      const mp = growth.match(/mp="(\d+)"/)?.[1] || 0;
      const atk = growth.match(/atk="(\d+)"/)?.[1] || 0;
      const def = growth.match(/def="(\d+)"/)?.[1] || 0;
      const agl = growth.match(/agl="(\d+)"/)?.[1] || 0;
      const int = growth.match(/int="(\d+)"/)?.[1] || 0;
      
      monsters.push({
        name,
        hp_growth: parseInt(hp),
        mp_growth: parseInt(mp),
        strength_growth: parseInt(atk),
        defense_growth: parseInt(def),
        agility_growth: parseInt(agl),
        wisdom_growth: parseInt(int)
      });
    }
  });
  
  return monsters;
}

async function updateDatabase() {
  // Wait for columns to be added
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const monsters = parseXMLMonsterData();
  console.log(`Found ${monsters.length} monsters with growth data`);
  
  let updated = 0;
  let notFound = 0;
  
  for (const monster of monsters.slice(0, 5)) { // Test with first 5
    try {
      const row = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM monsters WHERE name = ?', [monster.name], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (row) {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR REPLACE INTO parts 
            (monster_id, name, type, family, sprite, hp_growth, mp_growth, strength_growth, defense_growth, agility_growth, wisdom_growth)
            VALUES (?, ?, 'body', 'Unknown', '', ?, ?, ?, ?, ?, ?)
          `, [
            row.id,
            monster.name + ' Body',
            monster.hp_growth,
            monster.mp_growth,
            monster.strength_growth,
            monster.defense_growth,
            monster.agility_growth,
            monster.wisdom_growth
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        console.log(`✓ Updated ${monster.name}: HP=${monster.hp_growth}, MP=${monster.mp_growth}, ATK=${monster.strength_growth}`);
        updated++;
      } else {
        console.log(`⚠ Monster not found in DB: ${monster.name}`);
        notFound++;
      }
    } catch (error) {
      console.error(`Error updating ${monster.name}:`, error.message);
    }
  }
  
  console.log(`\nSummary: ${updated} updated, ${notFound} not found in database`);
  db.close();
}

updateDatabase();