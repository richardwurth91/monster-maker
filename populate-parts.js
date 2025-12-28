const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const xml2js = require('xml2js');

const db = new sqlite3.Database('./monsters.db');
const partsDir = './assets/parts';
const xmlFile = './assets/data/monster-data.xml';

// Read and parse XML
const xmlData = fs.readFileSync(xmlFile, 'utf8');
xml2js.parseString(xmlData, (err, result) => {
    if (err) throw err;
    
    const monsters = {};
    
    // Extract monster growth data
    result['monster-data'].families[0].family.forEach(family => {
        family.monsters[0].monster.forEach(monster => {
            const name = monster.$.name;
            const growth = monster.growth[0].$;
            monsters[name] = {
                agl: parseInt(growth.agl),
                int: parseInt(growth.int),
                maxlvl: parseInt(growth.maxlvl),
                atk: parseInt(growth.atk),
                mp: parseInt(growth.mp),
                exp: parseInt(growth.exp),
                hp: parseInt(growth.hp),
                def: parseInt(growth.def)
            };
        });
    });
    
    // Get monster IDs from database
    db.all("SELECT id, name FROM monsters", (err, monsterRows) => {
        if (err) throw err;
        
        const monsterIds = {};
        monsterRows.forEach(row => {
            monsterIds[row.name] = row.id;
        });
        
        // Process parts directories
        const partsDirs = fs.readdirSync(partsDir);
        
        partsDirs.forEach(monsterName => {
            const monsterPartsDir = path.join(partsDir, monsterName);
            if (!fs.statSync(monsterPartsDir).isDirectory()) return;
            
            const monsterId = monsterIds[monsterName];
            const growth = monsters[monsterName];
            
            if (!monsterId || !growth) {
                console.log(`Skipping ${monsterName} - no monster ID or growth data`);
                return;
            }
            
            const partFiles = fs.readdirSync(monsterPartsDir);
            
            partFiles.forEach(partFile => {
                if (!partFile.endsWith('.png')) return;
                
                const partName = path.basename(partFile, '.png');
                const partType = partName.split('_')[0] || 'unknown';
                const family = 'unknown'; // Would need to determine from monster data
                const sprite = `/assets/parts/${monsterName}/${partFile}`;
                
                const stmt = db.prepare(`
                    INSERT INTO parts (monster_id, name, type, family, sprite, agl, int, maxlvl, atk, mp, exp, hp, def)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                stmt.run([
                    monsterId, partName, partType, family, sprite,
                    growth.agl, growth.int, growth.maxlvl, growth.atk,
                    growth.mp, growth.exp, growth.hp, growth.def
                ]);
                
                stmt.finalize();
            });
        });
        
        console.log('Parts populated successfully');
        db.close();
    });
});