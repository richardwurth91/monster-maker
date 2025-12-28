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

async function examineSlimeContent() {
  try {
    const url = `https://dragon-quest.org/w/api.php?action=query&prop=revisions&titles=Slime&rvslots=*&rvprop=content&formatversion=2&format=json`;
    
    const response = await makeRequest(url);
    const data = JSON.parse(response);
    
    if (data.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content) {
      const content = data.query.pages[0].revisions[0].slots.main.content;
      
      // Look for DQM2 section
      const dqm2Match = content.match(/==={{{DQM2}}}===[\s\S]*?(?===={{{[^}]+}}}===|$)/i);
      if (dqm2Match) {
        console.log('Found DQM2 section:');
        console.log(dqm2Match[0].substring(0, 1000));
        console.log('...');
      } else {
        console.log('No DQM2 section found with {{{DQM2}}} format');
        
        // Look for any mention of DQM2
        const allDqm2 = content.match(/.*DQM2.*/gi);
        if (allDqm2) {
          console.log('Found DQM2 mentions:');
          allDqm2.forEach(line => console.log(line));
        }
        
        // Look for growth mentions
        const growthMentions = content.match(/.*growth.*/gi);
        if (growthMentions) {
          console.log('\nFound growth mentions:');
          growthMentions.slice(0, 10).forEach(line => console.log(line));
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

examineSlimeContent();