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

async function checkOrgodemir() {
  try {
    const url = 'https://dragon-quest.org/w/api.php?action=query&prop=revisions&titles=Orgodemir&rvslots=*&rvprop=content&formatversion=2&format=json';
    
    const response = await makeRequest(url);
    const data = JSON.parse(response);
    
    if (data.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content) {
      const content = data.query.pages[0].revisions[0].slots.main.content;
      
      // Look for DQM2 table with growth data
      const tableMatch = content.match(/\{\|[^}]*HP growth[^}]*\|\}/s);
      if (tableMatch) {
        console.log('=== Found DQM2 Growth Table ===');
        const table = tableMatch[0];
        
        // Extract growth values
        const hpMatch = table.match(/HP growth[^|]*\|[^|]*?(\d+)\/(\d+)/i);
        const mpMatch = table.match(/MP growth[^|]*\|[^|]*?(\d+)\/(\d+)/i);
        const strMatch = table.match(/Strength growth[^|]*\|[^|]*?(\d+)\/(\d+)/i);
        const wisMatch = table.match(/Wisdom growth[^|]*\|[^|]*?(\d+)\/(\d+)/i);
        const agiMatch = table.match(/Agility growth[^|]*\|[^|]*?(\d+)\/(\d+)/i);
        
        console.log('Growth rates found:');
        if (hpMatch) console.log(`HP: ${hpMatch[1]}/${hpMatch[2]}`);
        if (mpMatch) console.log(`MP: ${mpMatch[1]}/${mpMatch[2]}`);
        if (strMatch) console.log(`Strength: ${strMatch[1]}/${strMatch[2]}`);
        if (wisMatch) console.log(`Wisdom: ${wisMatch[1]}/${wisMatch[2]}`);
        if (agiMatch) console.log(`Agility: ${agiMatch[1]}/${agiMatch[2]}`);
        
      } else {
        console.log('No DQM2 growth table found');
        // Show any mentions of growth
        const growthLines = content.match(/.*growth.*/gi);
        if (growthLines) {
          console.log('Growth mentions:', growthLines.slice(0, 5));
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkOrgodemir();