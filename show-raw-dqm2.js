const https = require('https');

async function showRawDQM2Data() {
  try {
    const url = 'https://dragon-quest.org/w/api.php?action=query&prop=revisions&titles=Orgodemir&rvslots=*&rvprop=content&formatversion=2&format=json';
    
    const response = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
    
    const data = JSON.parse(response);
    const content = data.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content;
    
    if (content) {
      // Look for DQM2 section
      const dqm2Match = content.match(/==Dragon Quest Monsters 2==([\s\S]*?)(?===|$)/i);
      if (dqm2Match) {
        console.log('=== RAW DQM2 SECTION ===');
        console.log(dqm2Match[1]);
      } else {
        console.log('No "Dragon Quest Monsters 2" section found');
        
        // Try alternative formats
        const altMatch = content.match(/==.*DQM2.*([\s\S]*?)(?===|$)/i);
        if (altMatch) {
          console.log('=== ALTERNATIVE DQM2 SECTION ===');
          console.log(altMatch[1]);
        } else {
          console.log('Searching for any growth mentions...');
          const growthLines = content.match(/.*[Gg]rowth.*/g);
          if (growthLines) {
            console.log('Growth mentions found:');
            growthLines.forEach(line => console.log(line));
          } else {
            console.log('No growth mentions found at all');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

showRawDQM2Data();