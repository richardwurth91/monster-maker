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

async function debugApiResponse(monsterName) {
  try {
    const encodedName = encodeURIComponent(monsterName);
    const url = `https://dragon-quest.org/w/api.php?action=query&prop=revisions&titles=${encodedName}&rvslots=*&rvprop=content&formatversion=2&format=json`;
    
    console.log(`URL: ${url}`);
    const response = await makeRequest(url);
    const data = JSON.parse(response);
    
    console.log('API Response structure:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.query?.pages?.[0]) {
      const page = data.query.pages[0];
      console.log(`\nPage title: ${page.title}`);
      console.log(`Page missing: ${page.missing}`);
      
      if (page.revisions?.[0]?.slots?.main?.content) {
        const content = page.revisions[0].slots.main.content;
        console.log(`\nContent length: ${content.length}`);
        console.log('First 500 characters:');
        console.log(content.substring(0, 500));
        
        // Look for any mention of growth
        const growthMatches = content.match(/growth/gi);
        if (growthMatches) {
          console.log(`\nFound ${growthMatches.length} mentions of "growth"`);
        }
        
        // Look for DQM2 sections
        const dqm2Matches = content.match(/dragon.*monsters.*2/gi);
        if (dqm2Matches) {
          console.log('Found DQM2 mentions:', dqm2Matches);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test with a few different monster names
async function main() {
  const testNames = ['Slime', 'Dragon', 'Dracky', 'King slime'];
  
  for (const name of testNames) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing: ${name}`);
    console.log('='.repeat(50));
    await debugApiResponse(name);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main();