# Monster Maker

A web application for creating custom monsters by combining parts from existing monsters.

## Features

- Select two monsters from a database of 215+ monsters
- Drag and drop monster parts onto a 64x64 pixel workspace
- Pixel-perfect positioning with snap-to-grid functionality
- Save custom monster creations to the database
- Gallery view of all created monsters

## Setup

1. Install dependencies:
```bash
npm install
```

2. Seed the database with sample monsters:
```bash
node seed-data.js
```

3. Start the server:
```bash
npm start
```

4. Open http://localhost:3232 in your browser

## Database Structure

- **monsters**: Original monsters with sprites and parts
- **creations**: User-created monster combinations

## Usage

1. Select two monsters from the dropdowns
2. Drag parts from the parts panel to the workspace
3. Position parts precisely using the pixel grid
4. Name your creation and save it
5. View all creations in the gallery

## Technical Details

- Backend: Node.js + Express + SQLite
- Frontend: HTML5 Canvas for pixel art editing
- Image format: Base64 encoded PNG sprites
- Grid system: 10px snap for precise positioning