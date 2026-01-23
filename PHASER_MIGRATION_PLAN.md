# Phaser Migration Plan for Monster Maker

## Project Overview
Migrating a vanilla Canvas-based monster creation tool to Phaser 3. The app allows users to combine parts from 300+ monsters with drag-and-drop, transformations, color palettes, and layer management.

## Current Tech Stack
- **Frontend**: Vanilla JS with HTML5 Canvas
- **Backend**: Node.js + Express + SQLite3
- **UI**: RPGUI CSS framework
- **Canvas Size**: 640x640px workspace
- **Features**: Drag-drop, transforms (scale/rotate/flip), color palettes, layer management, save/export

---

## Migration Chunks

### **✅ CHUNK 1: Project Setup & Basic Phaser Scene - COMPLETE**
**Goal**: Set up Phaser 3 and create the basic game scene structure

**What was completed**:
- ✅ Installed Phaser 3.80.1 via npm
- ✅ Created basic Phaser game configuration in `phaser-config.js`
- ✅ Set up main scene with 640x640 workspace
- ✅ Implemented grid background using Phaser Graphics
- ✅ Integrated Phaser canvas into existing HTML

**Files created/modified**:
- `package.json` - Added Phaser dependency
- `public/phaser-config.js` - Phaser game configuration with grid
- `public/index.html` - Added Phaser CDN and workspace container
- `public/style.css` - Added Phaser workspace styles

**Status**: Phaser running with grid background, RPGUI UI intact

---

### **✅ CHUNK 2: Image Loading & Sprite Management - COMPLETE**
**Goal**: Load monster sprites and parts into Phaser's asset system

**What was completed**:
- ✅ Created ImageLoader utility for base64 to Phaser texture conversion
- ✅ Integrated ImageLoader into Phaser scene
- ✅ Updated loadMonsters() to load sprites as Phaser textures
- ✅ Updated updateAvailableParts() to load part textures
- ✅ Added texture key tracking to availableParts array

**Files created/modified**:
- `public/utils/ImageLoader.js` - Base64 to texture converter
- `public/phaser-config.js` - ImageLoader initialization
- `public/script.js` - Updated monster/part loading
- `public/index.html` - Added ImageLoader script

**Status**: All images loaded as Phaser textures with proper caching

---

### **✅ CHUNK 3: Part Placement & Drag-Drop System - COMPLETE**
**Goal**: Implement drag-and-drop functionality using Phaser's input system

**What was completed**:
- ✅ Created PartSprite class extending Phaser.GameObjects.Sprite
- ✅ Implemented drag-and-drop with Phaser input system
- ✅ Added sprite selection system (single & multi-select with Shift)
- ✅ Implemented snap-to-grid (5px increments)
- ✅ Visual feedback for selected sprites (red tint)
- ✅ Multi-sprite dragging support
- ✅ Click empty space to deselect

**Files created/modified**:
- `public/utils/PartSprite.js` - Custom sprite class with drag-drop
- `public/phaser-config.js` - Selection events and multi-drag
- `public/script.js` - Updated addPartToWorkspace and selectLayer
- `public/index.html` - Added PartSprite script

**Status**: Full drag-drop working with selection and grid snapping

---

### **✅ CHUNK 4: Transform Tools (Scale, Rotate, Flip) - COMPLETE**
**Goal**: Implement transformation controls for selected parts

**What was completed**:
- ✅ Created TransformManager utility class
- ✅ Implemented scale adjustment (0.25 increments, 0.25-2x range)
- ✅ Implemented rotation (90° increments)
- ✅ Implemented flip horizontal/vertical
- ✅ Transform state persists in partData
- ✅ All transforms work on multi-selected parts
- ✅ Keyboard shortcuts functional (R, F, Shift+F, Shift+/-) 

**Files created/modified**:
- `public/utils/TransformManager.js` - Transform operations
- `public/utils/PartSprite.js` - Updated updatePartData for transforms
- `public/script.js` - Updated transform functions
- `public/index.html` - Added TransformManager script

**Status**: All transforms working with immediate visual feedback

---

### **✅ CHUNK 5: Layer Management System - COMPLETE**
**Goal**: Implement z-index/depth management for parts

**What was completed**:
- ✅ Created LayerManager utility for depth control
- ✅ Implemented move layer up/down with proper depth ordering
- ✅ Updated bring to front/send to back functions
- ✅ Synced placedParts order with Phaser sprite depth
- ✅ Multi-part layer operations working
- ✅ Part removal destroys Phaser sprites properly
- ✅ Keyboard shortcuts (PageUp/PageDown, Shift+Arrow)

**Files created/modified**:
- `public/utils/LayerManager.js` - Depth management
- `public/phaser-config.js` - syncPhaserToPlacedParts function
- `public/script.js` - Updated layer functions
- `public/index.html` - Added LayerManager script

**Status**: Layer ordering working with Phaser depth system

---

### **✅ CHUNK 6: Color Palette System - COMPLETE**
**Goal**: Implement color palette extraction and application

**What was completed**:
- ✅ Created ColorPalette utility class
- ✅ Palette extraction from images
- ✅ Palette application with color mapping
- ✅ Custom color mappings support
- ✅ Part-specific color mappings
- ✅ Palette modes (original, monster1, monster2, custom)
- ✅ Real-time palette changes on Phaser sprites

**Files created/modified**:
- `public/utils/ColorPalette.js` - Palette extraction & application
- `public/script.js` - Updated palette functions to apply to sprites
- `public/index.html` - Added ColorPalette script

**Status**: Color palettes working with live sprite updates

---

### **✅ CHUNK 7: Save & Export System - COMPLETE**
**Goal**: Implement save to database and export to PNG

**What was completed**:
- ✅ Created ExportManager utility for Phaser rendering
- ✅ Updated saveCreation to capture from Phaser workspace
- ✅ Updated exportCanvas to use Phaser rendering
- ✅ Auto-crop transparent pixels working
- ✅ Save includes all transform and palette state
- ✅ Export produces clean PNG from Phaser using RenderTexture

**Files created/modified**:
- `public/utils/ExportManager.js` - Phaser rendering & export
- `public/script.js` - Updated save/export functions
- `public/index.html` - Added ExportManager script

**Status**: Save/export working with Phaser rendering

---

### **✅ CHUNK 8: Gallery & Preview System - COMPLETE**
**Goal**: Display saved creations and enable remixing

**What was completed**:
- ✅ Created CreationLoader utility for loading saved creations
- ✅ Updated remixCreation to load into Phaser workspace
- ✅ Gallery displays saved creations (already working)
- ✅ Preview modal shows creation (already working)
- ✅ Filter by family/author (already working)
- ✅ Delete creations in admin mode (already working)
- ✅ Remix restores all transforms, colors, and layers

**Files created/modified**:
- `public/utils/CreationLoader.js` - Load creations into Phaser
- `public/script.js` - Updated remixCreation function
- `public/index.html` - Added CreationLoader script

**Status**: Gallery and remix fully functional with Phaser

---

### **✅ CHUNK 9: Mobile & Touch Support - COMPLETE**
**Goal**: Ensure mobile/touch devices work properly

**What was completed**:
- ✅ Created InputManager for mobile optimizations
- ✅ Multi-touch support enabled in Phaser
- ✅ Responsive canvas scaling for mobile
- ✅ Touch input working (Phaser built-in)
- ✅ Mobile UI responsive (existing CSS)
- ✅ All features accessible on touch devices

**Files created/modified**:
- `public/utils/InputManager.js` - Mobile detection & optimizations
- `public/phaser-config.js` - Mobile setup in create()
- `public/index.html` - Added InputManager script

**Status**: Full mobile/touch support working

---

### **✅ CHUNK 10: Performance Optimization & Polish - COMPLETE**
**Goal**: Optimize rendering and add final polish

**What was completed**:
- ✅ Created PerformanceManager utility for texture cleanup
- ✅ Added throttling to drag events (16ms)
- ✅ Implemented texture cleanup on workspace clear
- ✅ Created ErrorHandler utility for graceful failures
- ✅ Added error handling to image loading
- ✅ Added error handling to save/export functions
- ✅ Added validation for part data
- ✅ Safe JSON parsing utility

**Files created/modified**:
- `public/utils/PerformanceManager.js` - Texture cleanup & throttle/debounce
- `public/utils/ErrorHandler.js` - Error handling & validation
- `public/phaser-config.js` - Throttled drag events
- `public/script.js` - Error handling integration, texture cleanup
- `public/index.html` - Added utility scripts

**Status**: All optimizations and error handling complete

---

## Migration Status: 100% Complete (10/10 Chunks)

**Completed**: Chunks 1-10 ✅  
**Remaining**: None - Migration Complete!

---

## Key Technical Decisions

### Phaser Configuration (Implemented)
```javascript
{
  type: Phaser.AUTO,
  width: 640,
  height: 640,
  parent: 'phaser-workspace',
  backgroundColor: '#e6f3e6',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
}
```

### Sprite Structure (Implemented)
Each part is a PartSprite extending Phaser.GameObjects.Sprite with:
- `partData`: Original part metadata (synced)
- `transformState`: Scale, rotation, flip state (via Phaser properties)
- Interactive input enabled (draggable: true)
- Depth for layer management (setDepth)
- Visual selection feedback (red tint)

### State Management (Implemented)
- `placedParts` array synchronized with `phaserSprites` array
- Each part has reference to its Phaser sprite
- Transform state stored in both partData and sprite properties
- Color mappings stored separately (global and part-specific)

### Utility Classes Created
1. **ImageLoader** - Base64 to Phaser texture conversion with caching
2. **PartSprite** - Custom sprite class with drag-drop and selection
3. **TransformManager** - Scale, rotate, flip operations
4. **LayerManager** - Depth management and z-ordering
5. **ColorPalette** - Palette extraction and application
6. **ExportManager** - Phaser rendering and PNG export
7. **CreationLoader** - Load saved creations into workspace
8. **InputManager** - Mobile/touch optimizations
9. **PerformanceManager** - Texture cleanup and throttling
10. **ErrorHandler** - Error handling and validation

---

## Migration Complete!

The Monster Maker application has been successfully migrated from vanilla Canvas to Phaser 3. All features are working:
- ✅ Drag-and-drop with grid snapping
- ✅ Multi-select and multi-drag
- ✅ Transform tools (scale, rotate, flip)
- ✅ Layer management
- ✅ Color palette system
- ✅ Save/export functionality
- ✅ Gallery and remix
- ✅ Mobile/touch support
- ✅ Performance optimizations
- ✅ Error handlings` array
- Phaser sprites store reference to partData
- partData updates on transform/position changes
- Database schema unchanged - full compatibility

### UI Integration (Implemented)
- RPGUI CSS framework retained for UI panels
- Phaser canvas replaced HTML5 canvas
- UI buttons trigger Phaser scene methods via global functions
- Two-way binding: UI ↔ Phaser state ↔ placedParts array

---

## Migration Strategy (Followed Successfully)

1. **Incremental**: ✅ Each chunk built on previous - no breaking changes
2. **Parallel UI**: ✅ RPGUI UI remained functional throughout migration
3. **Feature Parity**: ✅ All vanilla features matched before adding new ones
4. **Testing**: ✅ Each chunk tested thoroughly before proceeding
5. **Rollback**: ✅ Old canvas kept hidden as fallback (can be removed)

---

## Dependencies Added
```json
{
  "phaser": "^3.80.1"
}
```

## Build Process (Implemented)
- Using Phaser CDN for development (no build step)
- Served via existing Express server
- All utilities in `public/utils/` directory
- Modular architecture with separate utility classes

---

## Utility Classes Created

1. **ImageLoader** - Base64 to Phaser texture conversion
2. **PartSprite** - Custom sprite class with drag-drop and selection
3. **TransformManager** - Scale, rotate, flip operations
4. **LayerManager** - Depth/z-index management
5. **ColorPalette** - Palette extraction and application
6. **ExportManager** - Phaser rendering and PNG export
7. **CreationLoader** - Load saved creations into Phaser
8. **InputManager** - Mobile detection and optimizations

---

## Notes for Context Resets

If context is reset between chunks, refer to:
1. This migration plan for overall structure
2. Previous chunk's "Context for next chunk" section
3. `public/scenes/WorkspaceScene.js` for current Phaser state
4. Original `public/script.js` for vanilla implementation reference
5. Database schema in `server.js` remains unchanged

Each chunk should be self-contained and testable independently.
