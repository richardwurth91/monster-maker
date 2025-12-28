const sqlite3 = require('sqlite3').verbose();
const https = require('https');

const db = new sqlite3.Database('monsters.db');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseGrowthRates(content, monsterName) {
  try {
    const dqm2Match = content.match(/{{DQM2Enemy[\s\S]*?}}/);  
    const dqmMatch = content.match(/{{DQMEnemy[\s\S]*?}}/);  
    
    const template = dqm2Match || dqmMatch;
    if (!template) {
      console.log(`No DQM2Enemy or DQMEnemy template found for ${monsterName}`);
      return null;
    }
    
    const templateText = template[0];
    
    const hpMatch = templateText.match(/\|hp=(\d+)\/(\d+)/);
    const mpMatch = templateText.match(/\|mp=(\d+)\/(\d+)/);
    const attackMatch = templateText.match(/\|attack=(\d+)\/(\d+)/);
    const defenseMatch = templateText.match(/\|defense=(\d+)\/(\d+)/);
    const wisdomMatch = templateText.match(/\|wisdom=(\d+)\/(\d+)/);
    const agilityMatch = templateText.match(/\|agility=(\d+)\/(\d+)/);
    
    return {
      hp_growth: hpMatch ? parseInt(hpMatch[1]) : 0,
      mp_growth: mpMatch ? parseInt(mpMatch[1]) : 0,
      strength_growth: attackMatch ? parseInt(attackMatch[1]) : 0,
      defense_growth: defenseMatch ? parseInt(defenseMatch[1]) : 0,
      wisdom_growth: wisdomMatch ? parseInt(wisdomMatch[1]) : 0,
      agility_growth: agilityMatch ? parseInt(agilityMatch[1]) : 0
    };
  } catch (error) {
    console.error(`Error parsing ${monsterName}:`, error.message);
    return null;
  }
}

async function scrapeMonster(monsterName) {
  const nameVariants = [
    monsterName,
    monsterName.replace(' ', ''),
    monsterName.replace(' ', '_'),
    monsterName === 'King Leo' ? 'KingLeo' : null,
    monsterName === 'King Leo' ? 'Marquis de Léon' : null,
    monsterName === 'Boss Troll' ? 'BossTroll' : null,
    monsterName === 'Skeleton Soldier' ? 'SkeletonSoldier' : null
  ].filter(Boolean);
  
  for (const variant of nameVariants) {
    try {
      const url = `https://dragon-quest.org/w/api.php?action=query&prop=revisions&titles=${encodeURIComponent(variant)}&rvslots=*&rvprop=content&formatversion=2&format=json`;
      
      const response = await makeRequest(url);
      const data = JSON.parse(response);
      const content = data.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content;
      
      if (!content) continue;
      
      const result = parseGrowthRates(content, variant);
      if (result) {
        console.log(`Found data using variant: ${variant}`);
        return result;
      }
    } catch (error) {
      console.error(`Error fetching ${variant}:`, error.message);
    }
  }
  
  return null;
}

async function main() {
  const testMonsters = ['King Leo', 'Boss Troll', 'Skeleton Soldier', 'Slime', 'Dracky'];
  
  console.log(`Testing ${testMonsters.length} specific monsters...\n`);
  
  for (const monster of testMonsters) {
    console.log(`Processing: ${monster}`);
    const result = await scrapeMonster(monster);
    
    if (result) {
      console.log('Growth rates:', result);
    } else {
      console.log('No DQM2 data found');
    }
    
    console.log('---');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  db.close();
}

main();