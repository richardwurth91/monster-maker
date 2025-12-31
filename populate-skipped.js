const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const xml2js = require('xml2js');

const db = new sqlite3.Database('./monsters.db');
const partsDir = './assets/parts';
const xmlFile = './assets/data/monster-data.xml';

// Name mappings: DB name -> [XML name, Directory name]
const nameMappings = {
    'EyeBall': ['EyeBall', 'Eyeball'], 
    'FairyDrak': ['FairyDrak', 'Fairydrak'],
    'GateGuard': ['GateGuard', 'Gateguard'],
    'PearlGel': ['PearlGel', 'Pearlgel'],
    'SpotSlime': ['SpotSlime', 'Spotslime'],
    'StubSuck': ['StubSuck', 'Stubsuck'],
    'WhipBird': ['WhipBird', 'Whipbird'],
    'WingSlime': ['WingSlime', 'Wingslime'],
    'ZapBird': ['ZapBird', 'Zapbird']
};

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
    
    // Get all monsters from database
    db.all("SELECT id, name, family FROM monsters", (err, monsterRows) => {
        if (err) throw err;
        
        const monsterIds = {};
        monsterRows.forEach(row => {
            monsterIds[row.name] = { id: row.id, family: row.family };
        });
        
        // Process parts directories for mapped names
        Object.entries(nameMappings).forEach(([dbName, [xmlName, dirName]]) => {
            const monsterInfo = monsterIds[dbName];
            const growth = monsters[xmlName];
            
            if (!monsterInfo || !growth) {
                console.log(`Skipping ${dbName} -> ${xmlName} - missing data`);
                return;
            }
            
            const monsterPartsDir = path.join(partsDir, dirName); // Use directory name
            
            if (!fs.existsSync(monsterPartsDir)) {
                console.log(`Parts directory not found: ${monsterPartsDir}`);
                return;
            }
            
            console.log(`Processing ${dbName} (ID: ${monsterInfo.id}) -> ${xmlName}`);
            
            const partFiles = fs.readdirSync(monsterPartsDir);
            
            partFiles.forEach(partFile => {
                if (!partFile.endsWith('.png')) return;
                
                const partName = path.basename(partFile, '.png');
                const partType = partName.split('_')[0] || 'unknown';
                const family = monsterInfo.family || 'Unknown';
                const sprite = `/assets/parts/${dirName}/${partFile}`;
                
                const stmt = db.prepare(`
                    INSERT INTO parts (monster_id, name, type, family, sprite, agl, int, maxlvl, atk, mp, exp, hp, def)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                stmt.run([
                    monsterInfo.id, partName, partType, family, sprite,
                    growth.agl, growth.int, growth.maxlvl, growth.atk,
                    growth.mp, growth.exp, growth.hp, growth.def
                ]);
                
                stmt.finalize();
                console.log(`  - Added part: ${partName}`);
            });
        });
        
        console.log('Skipped monsters parts populated successfully');
        db.close();
    });
});