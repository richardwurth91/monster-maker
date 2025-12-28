const https = require('https');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function examineMonsterDQM2(monsterName) {
  try {
    const encodedName = encodeURIComponent(monsterName);
    const url = `https://dragon-quest.org/w/api.php?action=query&prop=revisions&titles=${encodedName}&rvslots=*&rvprop=content&formatversion=2&format=json`;
    
    const response = await makeRequest(url);
    const data = JSON.parse(response);
    
    if (data.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content) {
      const content = data.query.pages[0].revisions[0].slots.main.content;
      
      // Look for DQM2 section
      const dqm2Match = content.match(/==={{{DQM2}}}===([\s\S]*?)(?===={{{[^}]+}}}===|$)/i);
      if (dqm2Match) {
        console.log(`\n=== ${monsterName} DQM2 Section ===`);
        const section = dqm2Match[1];
        console.log(section.substring(0, 800));
        
        // Look for any growth mentions
        const growthMentions = section.match(/.*growth.*/gi);
        if (growthMentions) {
          console.log('Growth mentions:', growthMentions);
        } else {
          console.log('No growth mentions found');
        }
      } else {
        console.log(`${monsterName}: No DQM2 section found`);
      }
    } else {
      console.log(`${monsterName}: No content found`);
    }
    
  } catch (error) {
    console.error(`Error with ${monsterName}:`, error.message);
  }
}

async function main() {
  const testMonsters = ['Dracky', 'King Leo', 'Slime', 'Metal slime', 'Dragon'];
  
  for (const monster of testMonsters) {
    await examineMonsterDQM2(monster);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main();