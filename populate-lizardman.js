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
    
    // Get LizardMan monster ID from database
    db.get("SELECT id, name FROM monsters WHERE name = 'LizardMan'", (err, monsterRow) => {
        if (err) throw err;
        
        if (!monsterRow) {
            console.log('LizardMan not found in database');
            db.close();
            return;
        }
        
        const monsterId = monsterRow.id;
        const growth = monsters['LizardMan'];
        
        if (!growth) {
            console.log('LizardMan growth data not found in XML');
            db.close();
            return;
        }
        
        console.log(`Processing LizardMan (ID: ${monsterId})`);
        
        const monsterPartsDir = path.join(partsDir, 'Lizardman');
        
        if (!fs.existsSync(monsterPartsDir)) {
            console.log('LizardMan parts directory not found');
            db.close();
            return;
        }
        
        const partFiles = fs.readdirSync(monsterPartsDir);
        
        partFiles.forEach(partFile => {
            if (!partFile.endsWith('.png')) return;
            
            const partName = path.basename(partFile, '.png');
            const partType = partName.split('_')[0] || 'unknown';
            const family = 'Dragon'; // LizardMan is Dragon family
            const sprite = `/assets/parts/Lizardman/${partFile}`;
            
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
            console.log(`  - Added part: ${partName}`);
        });
        
        console.log('LizardMan parts populated successfully');
        db.close();
    });
});