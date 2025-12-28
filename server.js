const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');


const app = express();
const PORT = 3232;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/assets', express.static('assets'));
app.use('/testing', express.static('testing'));

// Database setup
const db = new sqlite3.Database('monsters.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS monsters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sprite TEXT NOT NULL,
    parts TEXT NOT NULL,
    family TEXT,
    rarity REAL DEFAULT 1
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS creations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sprite TEXT NOT NULL,
    parent_monsters TEXT NOT NULL,
    author TEXT DEFAULT 'Anonymous',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    creation_data TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monster_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    family TEXT NOT NULL,
    sprite TEXT NOT NULL,
    attack INTEGER DEFAULT 0,
    defense INTEGER DEFAULT 0,
    speed INTEGER DEFAULT 0,
    traits TEXT,
    skills TEXT,
    FOREIGN KEY (monster_id) REFERENCES monsters(id)
  )`);
  
  // Add family column if it doesn't exist and update existing records
  db.run(`ALTER TABLE monsters ADD COLUMN family TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding family column:', err);
    } else {
      // Update existing monsters with family values
      const familyUpdates = [
        { family: 'Bird', names: ['Azurile', 'Dracky', 'Zapbird', 'Whipbird', 'BullBird', 'CoilBird', 'DuckKite', 'FunkyBird', 'KiteHawk', 'MadCondor', 'MadGoose', 'MadPecker', 'MadRaven', 'RainHawk', 'AquaHawk', 'BigRoost', 'FloraJay', 'MistyWing', 'Picky', 'Pteranod'] },
        { family: 'Demon', names: ['Boss Troll', 'Eyeball', 'AgDevil', 'ArcDemon', 'CragDevil', 'DeadNoble', 'Demonite', 'EvilArmor', 'EvilBeast', 'EvilPot', 'EvilSeed', 'EvilWand', 'EvilWell', 'Gateguard', 'Hargon', 'MadKnight', 'MadSpirit', 'Niterich', 'NiteWhip', 'Reaper', 'RogueNite', 'Shadow', 'Skeleton Soldier', 'Skeletor', 'Servant', 'Vampirus'] },
        { family: 'Beast', names: ['Catfly', 'King Leo', 'Walrusman', 'BeastNite', 'Beavern', 'CatMage', 'Centasaur', 'Grizzly', 'Hork', 'LandOwl', 'Lionex', 'MadCat', 'PillowRat', 'WildApe', 'Yeti', 'Watabou', 'Warubou'] },
        { family: 'Dragon', names: ['Fairydrak', 'Swordgon', 'Chamelgon', 'DracoLord (Dragon)', 'Dragon', 'DragonKid', 'Drygon', 'GigaDraco', 'LordDraco', 'MadDragon', 'MetalDrak', 'Orochi', 'Phoenix', 'SkyDragon', 'Tortragon', 'Wyvern'] },
        { family: 'Material', names: ['Golem', 'Stoneman', 'Roboster2', 'BombCrag', 'CurseLamp', 'EvilPot', 'GoldGolem', 'IceMan', 'LavaMan', 'MadCandle', 'MadMirror', 'Mimic', 'ProtoMech', 'Roboster'] },
        { family: 'Bug', names: ['Lipsy', 'ArmorPede', 'ArmyAnt', 'Butterfly', 'Catapila', 'HornBeet', 'MadHornet', 'StagBug', 'WeedBug', 'WarMantis'] },
        { family: 'Plant', names: ['Eggplaton', 'AmberWeed', 'DanceVegi', 'DeviPine', 'Egdracil', 'FireWeed', 'GhosTree', 'HerbMan', 'MadPlant', 'ManEater', 'Rosevine', 'Toadstool', 'TreeFace', 'TreeSlime', 'WingTree'] },
        { family: 'Slime', names: ['Metal King Slime', 'Pearlgel', 'Drakeslime', 'Wingslime', 'BoxSlime', 'FangSlime', 'GoldSlime', 'GranSlime', 'HaloSlime', 'KingSlime', 'MimeSlime', 'RockSlime', 'Slime', 'SlimeBorg', 'SlimeNite', 'Spotslime', 'TropicGel'] },
        { family: 'Aquatic', names: ['Aquadon', 'Aquarella', 'Clawster', 'FishRider', 'Merman', 'MerTiger', 'Moray', 'Octogon', 'Octokid', 'Octoraid', 'Octoreach', 'Poseidon', 'PutreFish', 'RogueWave', 'RushFish', 'Scallopa', 'SeaHorse', 'WhaleMage'] },
        { family: 'Undead', names: ['CaptDead', 'DeadNoble', 'Mummy', 'RotRaven', 'Skeleton Soldier', 'Skeletor', 'Skularach', 'Skulpent', 'SkulRider', 'Spooky'] },
        { family: 'Nature', names: ['Almiraj', 'Anemon', 'Babble', 'CloudKing', 'Coatol', 'Copycat', 'Darck', 'Digster', 'Droll', 'Dumbira', 'Emyu', 'Facer', 'Gasgon', 'Gismo', 'Goategon', 'GoatHorn', 'GoHopper', 'Goopi', 'Gophecada', 'Gorago', 'Gulpple', 'Healer', 'HoodSquid', 'Jamirus', 'JewelBag', 'KingCobra', 'KingSquid', 'LampGenie', 'Lazamanus', 'MadGopher', 'Mommonja', 'MudDoll', 'Mudou', 'Mudron', 'Oniono', 'Orc', 'Orligon', 'Petiteel', 'Pixy', 'Poisongon', 'PomPomBom', 'Pumpoise', 'Puppetor', 'PutrePup', 'Pyuro', 'Saccer', 'Serpentia', 'Shantak', 'Sickler', 'Slabbit', 'Slurperon', 'Snaily', 'SnakeBat', 'Snapper', 'SpikyBoy', 'SpotKing', 'Stubsuck', 'SuperTen', 'TailEater', 'Tonguella', 'Trumpeter', 'Voodoll', 'WindBeast', 'WindMerge', 'WingSnake', 'WonderEgg'] },
        { family: '?', names: ['Zoma', '1EyeClown', 'Akubar', 'Andreal', 'Angleron', 'ArmyCrab', 'AsuraZoma', 'AxeShark', 'Balzak', 'Baramos', 'BattleRex', 'BeanMan', 'BigEye', 'Blizzardy', 'Brushead', 'Bubblemon', 'CactiBall', 'CancerMan', 'ChopClown', 'DarkCrab', 'Darkdrium', 'DarkEye', 'DarkHorn', 'DarkMate', 'DeathMore', 'DeathMore (Final Form)', 'DeathMore (Transformed)', 'Durran', 'Esterk', 'Exaucers', 'Eyeder', 'FoxFire', 'Gamanian', 'Genosidoh', 'GiantMoth', 'GiantSlug', 'GiantWorm', 'Gigantes', 'Grakos', 'Gremlin', 'Grendal', 'HammerMan', 'Inverzon', 'IronTurt', 'Lizardman', 'LizardFly', 'Metabble', 'Metaly', 'Mirudraas', 'Mirudraas (Transformed)', 'Ogre', 'Orgodemir', 'Orgodemir (Transformed)', 'Pizzaro', 'RayGigas', 'SabreMan', 'Sidoh', 'Skullgon', 'WhiteKing'] }
      ];
      
      familyUpdates.forEach(({ family, names }) => {
        names.forEach(name => {
          db.run('UPDATE monsters SET family = ? WHERE name = ? AND family IS NULL', [family, name]);
        });
      });
    }
  });
  
  // Add author column if it doesn't exist
  db.run(`ALTER TABLE creations ADD COLUMN author TEXT DEFAULT 'Anonymous'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding author column:', err);
    } else {
      db.run('UPDATE creations SET author = "Anonymous" WHERE author IS NULL');
    }
  });
  
  // Add creation_data column if it doesn't exist
  db.run(`ALTER TABLE creations ADD COLUMN creation_data TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding creation_data column:', err);
    }
  });
  
  // Add rarity column if it doesn't exist
  db.run(`ALTER TABLE monsters ADD COLUMN rarity REAL DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding rarity column:', err);
    } else {
      // Update monsters with rarity values
      const rarityData = [
        { "name": "DrakSlime", "stars": 2 },
        { "name": "SpotSlime", "stars": 1 },
        { "name": "WingSlime", "stars": 1 },
        { "name": "TreeSlime", "stars": 1 },
        { "name": "Snaily", "stars": 1 },
        { "name": "SlimeNite", "stars": 2 },
        { "name": "Babble", "stars": 1 },
        { "name": "BoxSlime", "stars": 1 },
        { "name": "PearlGel", "stars": 1 },
        { "name": "Slime", "stars": 1 },
        { "name": "Healer", "stars": 1 },
        { "name": "FangSlime", "stars": 2 },
        { "name": "RockSlime", "stars": 1 },
        { "name": "SlimeBorg", "stars": 2 },
        { "name": "Slabbit", "stars": 2 },
        { "name": "KingSlime", "stars": 3 },
        { "name": "Metaly", "stars": 3 },
        { "name": "Metabble", "stars": 3 },
        { "name": "SpotKing", "stars": 2.5 },
        { "name": "TropicGel", "stars": 1 },
        { "name": "MimeSlime", "stars": 3 },
        { "name": "HaloSlime", "stars": 3 },
        { "name": "MetalKing", "stars": 3 },
        { "name": "GoldSlime", "stars": 4 },
        { "name": "GranSlime", "stars": 4 },
        { "name": "WonderEgg", "stars": 1 },
        { "name": "DragonKid", "stars": 2 },
        { "name": "Tortragon", "stars": 2 },
        { "name": "Pteranod", "stars": 2 },
        { "name": "Gasgon", "stars": 2 },
        { "name": "FairyDrak", "stars": 1.5 },
        { "name": "LizardMan", "stars": 2.5 },
        { "name": "Poisongon", "stars": 1.5 },
        { "name": "Swordgon", "stars": 2 },
        { "name": "Drygon", "stars": 2 },
        { "name": "Dragon", "stars": 3 },
        { "name": "MiniDrak", "stars": 2 },
        { "name": "MadDragon", "stars": 2 },
        { "name": "Rayburn", "stars": 2 },
        { "name": "Chamelgon", "stars": 2 },
        { "name": "LizardFly", "stars": 1.5 },
        { "name": "Andreal", "stars": 2.5 },
        { "name": "KingCobra", "stars": 2 },
        { "name": "Vampirus", "stars": 3 },
        { "name": "SnakeBat", "stars": 2.5 },
        { "name": "Spikerous", "stars": 2 },
        { "name": "GreatDrak", "stars": 3 },
        { "name": "Crestpent", "stars": 1.5 },
        { "name": "WingSnake", "stars": 1.5 },
        { "name": "Coatol", "stars": 3 },
        { "name": "Orochi", "stars": 4 },
        { "name": "BattleRex", "stars": 3 },
        { "name": "SkyDragon", "stars": 3 },
        { "name": "Serpentia", "stars": 3 },
        { "name": "Divinegon", "stars": 4 },
        { "name": "Orligon", "stars": 4 },
        { "name": "GigaDraco", "stars": 4 },
        { "name": "Tonguella", "stars": 1.5 },
        { "name": "Almiraj", "stars": 1.5 },
        { "name": "CatFly", "stars": 1.5 },
        { "name": "PillowRat", "stars": 1 },
        { "name": "Saccer", "stars": 1 },
        { "name": "GulpBeast", "stars": 3 },
        { "name": "Skullroo", "stars": 1.5 },
        { "name": "WindBeast", "stars": 2 },
        { "name": "Beavern", "stars": 1.5 },
        { "name": "Antbear", "stars": 2 },
        { "name": "SuperTen", "stars": 2.5 },
        { "name": "IronTurt", "stars": 2 },
        { "name": "Mommonja", "stars": 1.5 },
        { "name": "HammerMan", "stars": 1.5 },
        { "name": "Grizzly", "stars": 2.5 },
        { "name": "Yeti", "stars": 2.5 },
        { "name": "ArrowDog", "stars": 1.5 },
        { "name": "NoctoKing", "stars": 2.5 },
        { "name": "BeastNite", "stars": 2.5 },
        { "name": "MadGopher", "stars": 2 },
        { "name": "FairyRat", "stars": 1.5 },
        { "name": "Unicorn", "stars": 3 },
        { "name": "Goategon", "stars": 2.5 },
        { "name": "WildApe", "stars": 2 },
        { "name": "Trumpeter", "stars": 3.5 },
        { "name": "KingLeo", "stars": 4 },
        { "name": "DarkHorn", "stars": 3 },
        { "name": "MadCat", "stars": 2.5 },
        { "name": "BigEye", "stars": 2 },
        { "name": "Gorago", "stars": 3 },
        { "name": "CatMage", "stars": 3 },
        { "name": "Dumbira", "stars": 3 },
        { "name": "Picky", "stars": 1.5 },
        { "name": "Wyvern", "stars": 2 },
        { "name": "BullBird", "stars": 2 },
        { "name": "Florajay", "stars": 2 },
        { "name": "DuckKite", "stars": 2 },
        { "name": "MadPecker", "stars": 2 },
        { "name": "MadRaven", "stars": 2 },
        { "name": "MistyWing", "stars": 3.5 },
        { "name": "AquaHawk", "stars": 2.5 },
        { "name": "Dracky", "stars": 1 },
        { "name": "KiteHawk", "stars": 2 },
        { "name": "BigRoost", "stars": 2 },
        { "name": "StubBird", "stars": 2 },
        { "name": "LandOwl", "stars": 2 },
        { "name": "MadGoose", "stars": 2 },
        { "name": "MadCondor", "stars": 2 },
        { "name": "Emyu", "stars": 2 },
        { "name": "Blizzardy", "stars": 3 },
        { "name": "Phoenix", "stars": 3 },
        { "name": "ZapBird", "stars": 3 },
        { "name": "Garudian", "stars": 3 },
        { "name": "WhipBird", "stars": 3 },
        { "name": "FunkyBird", "stars": 2.5 },
        { "name": "RainHawk", "stars": 4 },
        { "name": "Azurile", "stars": 4 },
        { "name": "Shantak", "stars": 4 },
        { "name": "CragDevil", "stars": 2.5 },
        { "name": "MadPlant", "stars": 1.5 },
        { "name": "FireWeed", "stars": 1.5 },
        { "name": "FloraMan", "stars": 1.5 },
        { "name": "WingTree", "stars": 1.5 },
        { "name": "CactiBall", "stars": 1.5 },
        { "name": "Gulpple", "stars": 1.5 },
        { "name": "Toadstool", "stars": 1.5 },
        { "name": "AmberWeed", "stars": 2 },
        { "name": "Slurperon", "stars": 1.5 },
        { "name": "Stubsuck", "stars": 2 },
        { "name": "Oniono", "stars": 2 },
        { "name": "DanceVegi", "stars": 2.5 },
        { "name": "TreeBoy", "stars": 2 },
        { "name": "Devipine", "stars": 2 },
        { "name": "FaceTree", "stars": 2.5 },
        { "name": "HerbMan", "stars": 2.5 },
        { "name": "BeanMan", "stars": 2 },
        { "name": "EvilSeed", "stars": 2 },
        { "name": "ManEater", "stars": 2 },
        { "name": "Snapper", "stars": 2.5 },
        { "name": "GhosTree", "stars": 3 },
        { "name": "Rosevine", "stars": 4 },
        { "name": "Egdrasil", "stars": 4 },
        { "name": "Warubou", "stars": 4 },
        { "name": "Watabou", "stars": 4 },
        { "name": "Eggplaton", "stars": 2.5 },
        { "name": "FooHero", "stars": 1.5 },
        { "name": "GiantSlug", "stars": 1 },
        { "name": "Catapila", "stars": 1 },
        { "name": "Gophecada", "stars": 1.5 },
        { "name": "Butterfly", "stars": 1.5 },
        { "name": "WeedBug", "stars": 2 },
        { "name": "GiantWorm", "stars": 1.5 },
        { "name": "Lipsy", "stars": 1.5 },
        { "name": "StagBug", "stars": 2 },
        { "name": "Pyuro", "stars": 2 },
        { "name": "ArmyAnt", "stars": 1 },
        { "name": "GoHopper", "stars": 1 },
        { "name": "TailEater", "stars": 1 },
        { "name": "ArmorPede", "stars": 2 },
        { "name": "Eyeder", "stars": 1 },
        { "name": "GiantMoth", "stars": 2 },
        { "name": "Droll", "stars": 1.5 },
        { "name": "ArmyCrab", "stars": 2.5 },
        { "name": "MadHornet", "stars": 2.5 },
        { "name": "Belzebub", "stars": 2 },
        { "name": "WarMantis", "stars": 2.5 },
        { "name": "HornBeet", "stars": 3 },
        { "name": "Sickler", "stars": 1.5 },
        { "name": "Armorpion", "stars": 4 },
        { "name": "Digster", "stars": 3 },
        { "name": "Skularach", "stars": 3.5 },
        { "name": "MultiEyes", "stars": 2 },
        { "name": "Pixy", "stars": 1.5 },
        { "name": "MedusaEye", "stars": 1.5 },
        { "name": "AgDevil", "stars": 1.5 },
        { "name": "Demonite", "stars": 1 },
        { "name": "DarkEye", "stars": 1.5 },
        { "name": "EyeBall", "stars": 1.5 },
        { "name": "SkulRider", "stars": 2.5 },
        { "name": "EvilBeast", "stars": 1.5 },
        { "name": "Bubblemon", "stars": 1.5 },
        { "name": "1EyeClown", "stars": 1.5 },
        { "name": "Gremlin", "stars": 1.5 },
        { "name": "ArcDemon", "stars": 3 },
        { "name": "Lionex", "stars": 3 },
        { "name": "GoatHorn", "stars": 2.5 },
        { "name": "Orc", "stars": 2 },
        { "name": "Ogre", "stars": 2.5 },
        { "name": "GateGuard", "stars": 3 },
        { "name": "ChopClown", "stars": 2.5 },
        { "name": "BossTroll", "stars": 3 },
        { "name": "Grendal", "stars": 3 },
        { "name": "Akubar", "stars": 4 },
        { "name": "MadKnight", "stars": 2.5 },
        { "name": "EvilWell", "stars": 2 },
        { "name": "Gigantes", "stars": 3 },
        { "name": "Centasaur", "stars": 2.5 },
        { "name": "EvilArmor", "stars": 2 },
        { "name": "Jamirus", "stars": 4 },
        { "name": "Durran", "stars": 4 },
        { "name": "Titanis", "stars": 4 },
        { "name": "LampGenie", "stars": 4 },
        { "name": "Spooky", "stars": 1 },
        { "name": "Skullgon", "stars": 3 },
        { "name": "PutrePup", "stars": 1.5 },
        { "name": "RotRaven", "stars": 1.5 },
        { "name": "Mummy", "stars": 1.5 },
        { "name": "DarkCrab", "stars": 2.5 },
        { "name": "DeadNite", "stars": 2 },
        { "name": "Shadow", "stars": 2 },
        { "name": "Skulpent", "stars": 2 },
        { "name": "Hork", "stars": 2 },
        { "name": "Mudron", "stars": 2 },
        { "name": "NiteWhip", "stars": 2.5 },
        { "name": "WindMerge", "stars": 2 },
        { "name": "Reaper", "stars": 2 },
        { "name": "Inverzon", "stars": 2 },
        { "name": "FoxFire", "stars": 1 },
        { "name": "CaptDead", "stars": 2.5 },
        { "name": "DeadNoble", "stars": 3 },
        { "name": "WhiteKing", "stars": 3 },
        { "name": "BoneSlave", "stars": 1.5 },
        { "name": "Skeletor", "stars": 3 },
        { "name": "Servant", "stars": 3 },
        { "name": "Lazamanus", "stars": 4 },
        { "name": "MadSpirit", "stars": 2.5 },
        { "name": "PomPomBom", "stars": 2.5 },
        { "name": "NiteRich", "stars": 4 },
        { "name": "JewelBag", "stars": 1.5 },
        { "name": "EvilWand", "stars": 1.5 },
        { "name": "MadCandle", "stars": 1.5 },
        { "name": "CoilBird", "stars": 1 },
        { "name": "Facer", "stars": 1.5 },
        { "name": "SpikyBoy", "stars": 1.5 },
        { "name": "MadMirror", "stars": 1.5 },
        { "name": "RogueNite", "stars": 2 },
        { "name": "Puppetor", "stars": 1.5 },
        { "name": "Goopi", "stars": 1.5 },
        { "name": "Voodoll", "stars": 2 },
        { "name": "MetalDrak", "stars": 3.5 },
        { "name": "Balzak", "stars": 3 },
        { "name": "SabreMan", "stars": 2 },
        { "name": "CurseLamp", "stars": 2 },
        { "name": "Brushead", "stars": 1 },
        { "name": "Roboster", "stars": 2.5 },
        { "name": "Roboster2", "stars": 3 },
        { "name": "EvilPot", "stars": 1.5 },
        { "name": "Gismo", "stars": 1.5 },
        { "name": "LavaMan", "stars": 3 },
        { "name": "IceMan", "stars": 3 },
        { "name": "Mimic", "stars": 2.5 },
        { "name": "Exaucers", "stars": 2 },
        { "name": "MudDoll", "stars": 1.5 },
        { "name": "Golem", "stars": 2.5 },
        { "name": "StoneMan", "stars": 3 },
        { "name": "BombCrag", "stars": 2 },
        { "name": "GoldGolem", "stars": 3.5 },
        { "name": "DarkMate", "stars": 4 },
        { "name": "ProtoMech", "stars": 3 },
        { "name": "CloudKing", "stars": 3.5 },
        { "name": "Petiteel", "stars": 1.5 },
        { "name": "Moray", "stars": 1.5 },
        { "name": "WalrusMan", "stars": 2 },
        { "name": "RayGigas", "stars": 2 },
        { "name": "Anemon", "stars": 1.5 },
        { "name": "Aquarella", "stars": 1.5 },
        { "name": "Merman", "stars": 2 },
        { "name": "Octokid", "stars": 1 },
        { "name": "PutreFish", "stars": 2.5 },
        { "name": "Octoreach", "stars": 2 },
        { "name": "Angleron", "stars": 2 },
        { "name": "FishRider", "stars": 2.5 },
        { "name": "RushFish", "stars": 2.5 },
        { "name": "Gamanian", "stars": 1.5 },
        { "name": "Clawster", "stars": 2.5 },
        { "name": "CancerMan", "stars": 3 },
        { "name": "RogueWave", "stars": 2.5 },
        { "name": "Scallopa", "stars": 1 },
        { "name": "SeaHorse", "stars": 3 },
        { "name": "HoodSquid", "stars": 2 },
        { "name": "MerTiger", "stars": 3 },
        { "name": "AxeShark", "stars": 3 },
        { "name": "Octogon", "stars": 3 },
        { "name": "KingSquid", "stars": 4 },
        { "name": "Digong", "stars": 3 },
        { "name": "WhaleMage", "stars": 3 },
        { "name": "Aquadon", "stars": 4 },
        { "name": "Octoraid", "stars": 3 },
        { "name": "Grakos", "stars": 3.5 },
        { "name": "Poseidon", "stars": 4 },
        { "name": "Pumpoise", "stars": 1.5 },
        { "name": "Starfish", "stars": 1 },
        { "name": "Copycat", "stars": 4 },
        { "name": "DracoLord", "stars": 4 },
        { "name": "LordDraco", "stars": 4 },
        { "name": "Hargon", "stars": 4 },
        { "name": "Sidoh", "stars": 4 },
        { "name": "Genosidoh", "stars": 4 },
        { "name": "Baramos", "stars": 4 },
        { "name": "Zoma", "stars": 4 },
        { "name": "AsuraZoma", "stars": 4 },
        { "name": "Pizzaro", "stars": 4 },
        { "name": "PsychoPiz", "stars": 4 },
        { "name": "Esterk", "stars": 4 },
        { "name": "Mirudraas", "stars": 4 },
        { "name": "Mudou", "stars": 4 },
        { "name": "DeathMore", "stars": 4 },
        { "name": "Darkdrium", "stars": 4 },
        { "name": "Orgodemir", "stars": 4 },
        { "name": "Darck", "stars": 4 }
      ];
      
      let skippedMonsters = [];
      
      rarityData.forEach(({ name, stars }) => {
        db.get('SELECT id FROM monsters WHERE name = ?', [name], (err, row) => {
          if (err) {
            console.error('Database error:', err);
            return;
          }
          
          if (row) {
            db.run('UPDATE monsters SET rarity = ? WHERE name = ?', [stars, name]);
          } else {
            skippedMonsters.push(name);
          }
        });
      });
      
      setTimeout(() => {
        if (skippedMonsters.length > 0) {
          console.log('Skipped monsters (not found in database):', skippedMonsters);
        }
      }, 1000);
    }
  });
});

// API Routes
app.get('/api/monsters', (req, res) => {
  db.all('SELECT * FROM monsters', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/monsters', (req, res) => {
  const { name, sprite, parts, family } = req.body;
  db.run('INSERT INTO monsters (name, sprite, parts, family) VALUES (?, ?, ?, ?)', 
    [name, sprite, JSON.stringify(parts), family || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.get('/api/creations', (req, res) => {
  db.all('SELECT * FROM creations ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/creations', (req, res) => {
  const { name, sprite, parentMonsters, author, creationData } = req.body;
  db.run('INSERT INTO creations (name, sprite, parent_monsters, author, creation_data) VALUES (?, ?, ?, ?, ?)', 
    [name, sprite, JSON.stringify(parentMonsters), author || 'Anonymous', JSON.stringify(creationData)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.delete('/api/wipe', (req, res) => {
  db.run('DELETE FROM monsters', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM creations', (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Database wiped' });
    });
  });
});

app.delete('/api/creations/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM creations WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Creation deleted' });
  });
});

app.post('/api/cleanup', (req, res) => {
  // Update creations that use old monster names
  db.run(`UPDATE creations SET parent_monsters = REPLACE(parent_monsters, '"KingLeo"', '"King Leo"') WHERE parent_monsters LIKE '%KingLeo%'`);
  db.run(`UPDATE creations SET parent_monsters = REPLACE(parent_monsters, '"skeleton_soldier"', '"Skeleton Soldier"') WHERE parent_monsters LIKE '%skeleton_soldier%'`);
  db.run(`UPDATE creations SET parent_monsters = REPLACE(parent_monsters, '"boss_troll"', '"Boss Troll"') WHERE parent_monsters LIKE '%boss_troll%'`);
  
  // Delete old monster entries
  db.run(`DELETE FROM monsters WHERE name IN ('KingLeo', 'skeleton_soldier', 'boss_troll')`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cleanup completed' });
  });
});

app.post('/api/seed', (req, res) => {
  const fs = require('fs');
  
  // Helper function to convert PNG to base64
  function pngToBase64(filePath) {
    try {
      const data = fs.readFileSync(filePath);
      return `data:image/png;base64,${data.toString('base64')}`;
    } catch (err) {
      console.warn(`Could not read ${filePath}, using placeholder`);
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }
  }
  
  // Scan and create monsters
  function scanAndCreateMonsters() {
    const monsters = [];
    
    try {
      const monsterFiles = fs.readdirSync('assets/monsters')
        .filter(file => file.endsWith('.png'))
        .map(file => file.replace('.png', ''));
      
      monsterFiles.forEach(monsterName => {
        // Check if monster already exists
        db.get('SELECT id FROM monsters WHERE name = ?', [monsterName], (err, row) => {
          if (err) {
            console.error('Database error:', err);
            return;
          }
          
          if (row) {
            console.log(`Monster '${monsterName}' already exists, skipping`);
            return;
          }
          
          console.log(`Processing monster: ${monsterName}`);
          
          const sprite = pngToBase64(`assets/monsters/${monsterName}.png`);
          const partsPath = `assets/parts/${monsterName}`;
          let parts = {};
          
          if (fs.existsSync(partsPath)) {
            // Scan for all PNG files in the parts folder
            const partFiles = fs.readdirSync(partsPath)
              .filter(file => file.endsWith('.png'))
              .map(file => file.replace('.png', ''));
            
            partFiles.forEach(partName => {
              const partFile = `${partsPath}/${partName}.png`;
              parts[partName] = pngToBase64(partFile);
              console.log(`  - Loaded ${partName}`);
            });
          }
          
          // Insert monster
          db.run('INSERT INTO monsters (name, sprite, parts) VALUES (?, ?, ?)', 
            [monsterName, sprite, JSON.stringify(parts)], function(err) {
            if (err) {
              console.error('Insert error:', err);
            } else {
              console.log(`Added monster: ${monsterName}`);
            }
          });
        });
      });
      
    } catch (error) {
      console.error('Error scanning assets:', error);
    }
  }
  
  scanAndCreateMonsters();
  res.json({ message: 'Database seeding initiated' });
});

app.get('/family_assigner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'family_assigner.html'));
});

app.get('/api/unassigned-monsters', (req, res) => {
  db.all('SELECT * FROM monsters ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/assign-family', (req, res) => {
  const { monsterId, family } = req.body;
  db.run('UPDATE monsters SET family = ? WHERE id = ?', [family, monsterId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/remove-family', (req, res) => {
  const { monsterId } = req.body;
  db.run('UPDATE monsters SET family = NULL WHERE id = ?', [monsterId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/clear-families', (req, res) => {
  db.run('UPDATE monsters SET family = NULL', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All families cleared' });
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Monster Maker server running on http://localhost:${PORT}`);
  console.log(`Also accessible on network at http://[YOUR_IP]:${PORT}`);
});