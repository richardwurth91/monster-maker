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
    // Look for DQM2 table with growth data (like in screenshot)
    const tableMatch = content.match(/\{\|[^}]*HP growth[^}]*\|\}/s);
    if (!tableMatch) {
      console.log(`No DQM2 growth table found for ${monsterName}`);
      return null;
    }
    
    const table = tableMatch[0];
    
    // Extract growth values (format: X/10)
    const hpMatch = table.match(/HP growth[^|]*\|[^|]*?(\d+)\/(\d+)/i);
    const mpMatch = table.match(/MP growth[^|]*\|[^|]*?(\d+)\/(\d+)/i);
    const strMatch = table.match(/Strength growth[^|]*\|[^|]*?(\d+)\/(\d+)/i);
    
    return {
      hp_growth: hpMatch ? parseInt(hpMatch[1]) : 0,
      mp_growth: mpMatch ? parseInt(mpMatch[1]) : 0,
      strength_growth: strMatch ? parseInt(strMatch[1]) : 0
    };
  } catch (error) {
    console.error(`Error parsing ${monsterName}:`, error.message);
    return null;
  }
}

async function scrapeMonsterGrowthRates(monsterName) {
  try {
    const encodedName = encodeURIComponent(monsterName);
    const url = `https://dragon-quest.org/w/api.php?action=query&prop=revisions&titles=${encodedName}&rvslots=*&rvprop=content&formatversion=2&format=json`;
    
    console.log(`Fetching data for: ${monsterName}`);
    const response = await makeRequest(url);
    const data = JSON.parse(response);
    
    if (!data.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content) {
      console.log(`No content found for ${monsterName}`);
      return null;
    }
    
    const content = data.query.pages[0].revisions[0].slots.main.content;
    return parseGrowthRates(content, monsterName);
  } catch (error) {
    console.error(`Error fetching ${monsterName}:`, error.message);
    return null;
  }
}

async function main() {
  const testMonsters = ['Orgodemir', 'Slime', 'Dracky'];
  
  for (const monster of testMonsters) {
    console.log(`\nProcessing: ${monster}`);
    const growthRates = await scrapeMonsterGrowthRates(monster);
    
    if (growthRates) {
      console.log(`Growth rates for ${monster}:`, growthRates);
    } else {
      console.log(`No growth rates found for ${monster}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  db.close();
}

main();