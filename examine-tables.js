const https = require('https');

async function examineOrgodemir() {
  try {
    const url = 'https://dragon-quest.org/w/api.php?action=query&prop=revisions&titles=Orgodemir&rvslots=*&rvprop=content&formatversion=2&format=json';
    
    const response = await https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content) {
          const content = parsed.query.pages[0].revisions[0].slots.main.content;
          
          // Look for any table structures
          const tables = content.match(/\{\|[\s\S]*?\|\}/g);
          if (tables) {
            console.log(`Found ${tables.length} tables`);
            tables.forEach((table, i) => {
              if (table.includes('growth') || table.includes('Growth')) {
                console.log(`\n=== Table ${i+1} (contains growth) ===`);
                console.log(table.substring(0, 500));
              }
            });
          } else {
            console.log('No tables found');
            // Look for any growth mentions
            const growthLines = content.match(/.*[Gg]rowth.*/g);
            if (growthLines) {
              console.log('Growth mentions:', growthLines.slice(0, 10));
            }
          }
        }
      });
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

examineOrgodemir();