# Monster Maker

A comprehensive web application for creating custom monsters by combining parts from existing monsters, featuring advanced editing tools, family classification, and multiple specialized interfaces.

## Features

### Core Monster Creation
- Select from 300+ monsters across 11 different families
- Advanced drag-and-drop interface with 640x640 pixel workspace
- Precise positioning with snap-to-grid functionality
- Layer management system with reordering capabilities
- Transform tools: scale, rotate, flip parts
- Color palette system with original, monster-specific, and custom palettes
- Save custom monster creations with author attribution
- Export functionality for created monsters

### Gallery & Organization
- Comprehensive gallery with family-based filtering
- Author-based filtering and search
- Monster family icons and visual organization
- Remix functionality to edit existing creations
- Preview modal with detailed creation information

### Monster Management
- Family assignment system (Bird, Demon, Beast, Dragon, Material, Bug, Plant, Slime, Water, Zombie, ?)
- Rarity system with star ratings
- Monster renaming and deletion capabilities
- Bulk family management tools

### Advanced Tools & Testing
- **Joint Mapper**: Define connection points between monster parts
- **Part Combiner**: Merge multiple parts into single components
- **Streamliner**: Simplify and optimize monster part collections
- **Rarity Manager**: Assign and manage monster rarity ratings
- **Monster Analyzer**: Analyze monster data and statistics
- **Auto Assembly**: Automated monster part assembly tools
- **Egg Shop**: Specialized interface for egg-based monsters
- **Part Shop**: Marketplace-style interface for parts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Seed the database with monsters:
```bash
node seed-data.js
```

3. Start the server:
```bash
npm start
```

4. Access the application:
   - Main interface: http://localhost:3232
   - Family assigner: http://localhost:3232/family_assigner
   - Testing tools: http://localhost:3232/testing/[tool-name].html

## Database Structure

- **monsters**: Original monsters with sprites, parts, family, and rarity
- **creations**: User-created monster combinations with authorship and metadata
- **parts**: Individual monster parts with stats and properties
- **joints**: Connection point data for advanced part assembly

## Project Structure

```
├── assets/
│   ├── monsters/          # 300+ monster sprite files
│   ├── parts/             # Individual monster parts
│   ├── simple_parts/      # Simplified part collections
│   ├── backgrounds/       # UI backgrounds and frames
│   ├── icons/            # Family icons and UI elements
│   ├── fonts/            # Custom fonts (ARCADECLASSIC, ByteBounce)
│   └── data/             # XML data files
├── public/
│   ├── RPGUI/            # RPG-style UI framework
│   ├── index.html        # Main application
│   ├── script.js         # Core application logic
│   └── style.css         # Application styles
├── testing/              # Development and testing tools
│   ├── joint-mapper.html
│   ├── part-combiner.html
│   ├── streamliner.html
│   ├── rarity-manager.html
│   └── [other tools]
└── [various utility scripts]
```

## Usage

### Basic Monster Creation
1. Click "Select Monsters" to choose two base monsters
2. Drag parts from the parts panels to the workspace
3. Use transform tools to scale, rotate, and flip parts
4. Manage layers using the layers panel
5. Apply color palettes for different visual styles
6. Save your creation with a name and author

### Advanced Features
- **Family Filtering**: Use family icons to filter monsters by type
- **Joint System**: Define connection points for precise part alignment
- **Part Combination**: Merge multiple parts into optimized components
- **Rarity System**: Assign star ratings to indicate monster rarity

## Technical Details

- **Backend**: Node.js + Express + SQLite3
- **Frontend**: HTML5 Canvas with pixel-perfect rendering
- **UI Framework**: RPGUI for retro gaming aesthetics
- **Image Processing**: Base64 encoded PNG sprites with transparency
- **Database**: SQLite with comprehensive monster and creation tracking
- **Asset Management**: Automated scanning and processing of monster assets
- **Development Tools**: Extensive testing suite for specialized functionality

## API Endpoints

- `GET/POST /api/monsters` - Monster management
- `GET/POST /api/creations` - Creation management
- `GET/POST /api/joints` - Joint system
- `PUT /api/monsters/:id/family` - Family assignment
- `PUT /api/monsters/:id/rarity` - Rarity assignment
- `GET /api/monster-parts/:name` - Part retrieval
- Various admin and utility endpoints

## Development

For development with auto-reload:
```bash
npm run dev
```

The application includes extensive testing tools accessible via the `/testing/` directory for developing and debugging specific features.