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
      
      // Look for DQM2 section
      const dqm2Match = content.match(/==={{{DQM2}}}===([\\s\\S]*?)(?===={{{[^}]+}}}===|$)/i);
      if (dqm2Match) {
        console.log('=== Orgodemir DQM2 Section ===');
        console.log(dqm2Match[1]);
        
        // Look for growth mentions
        const growthMentions = dqm2Match[1].match(/.*growth.*/gi);
        if (growthMentions) {
          console.log('\\nGrowth mentions found:');
          growthMentions.forEach(line => console.log(line));
        } else {
          console.log('\\nNo growth mentions found');
        }
      } else {
        console.log('No DQM2 section found for Orgodemir');
      }
    } else {
      console.log('No content found for Orgodemir');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkOrgodemir();