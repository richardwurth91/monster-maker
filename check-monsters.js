const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('monsters.db');

db.all('SELECT name FROM monsters LIMIT 20', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Monsters in database:');
    rows.forEach(row => console.log(row.name));
  }
  db.close();
});