# Phaser Migration Plan for Testing Tools

## Overview
This document outlines the migration strategy for active testing tools in `/testing/` directory from vanilla Canvas to Phaser 3. Focus is on the Part Monster Maker, Part Combiner, and Part Shop tools that support the game's creation, breeding, and marketplace mechanics.

**Note**: The following tools are experimental/deprecated and excluded from migration:
- Joint Mapper
- Auto Assembly Test
- Streamliner
- Monster Analyzer
- Rarity Manager
- Egg Shop

---

## Tool Inventory & Analysis

### **1. Part Monster Maker** (`part-monster-maker.html`)
**Purpose**: Create custom monsters by assembling parts from inventory  
**Current Tech**: Vanilla Canvas with drag-drop, transform tools  
**Complexity**: Very High  
**Canvas Usage**: 640x640px canvas for monster assembly  
**Key Features**:
- Part inventory system (localStorage)
- Drag-drop part placement on canvas
- Transform tools (scale, rotate, flip)
- Layer management (reorder, remove)
- Color palette system (locked feature)
- Monster value calculation with bonuses
- Save to database with creation_data
- Tutorial system with animated guide
- Gold currency integration
- Auto-crop image processing

### **2. Part Combiner** (`part-combiner.html`)
**Purpose**: Combine two monster parts using breeding rules to create new parts  
**Current Tech**: RPGUI interface with modal part selector  
**Complexity**: High  
**Canvas Usage**: Minimal (part preview rendering only)  
**Key Features**:
- Part inventory system (localStorage)
- Breeding rule matching from XML data
- Rarity system with visual indicators
- Tutorial system with animated guide
- Reverse lookup (shows all possible combinations)
- Part discovery system
- Toast notifications

### **3. Part Shop** (`part-shop.html`)
**Purpose**: Part marketplace with requests system  
**Current Tech**: RPGUI interface with Canvas rendering for previews  
**Complexity**: Very High  
**Canvas Usage**: Part preview rendering, monster composition rendering  
**Key Features**:
- Part inventory with rarity system
- Daily/weekly request system with timers
- Monster creation value calculation
- Sell monsters for gold
- Part discovery system
- Tutorial system
- Auto-crop image processing

---

## Migration Strategy

### **Active Tools**
All three tools support core game mechanics (monster creation, breeding, and marketplace) and require Phaser integration for consistent rendering with the main application.

| Tool | Priority | Migration Approach |
|------|----------|-------------------|
| Part Monster Maker | P0 | Full Phaser migration |
| Part Combiner | P1 | Hybrid (Phaser for rendering) |
| Part Shop | P1 | Hybrid (Phaser for rendering) |

---

## Migration Chunks

### **CHUNK 1: Part Monster Maker Full Migration**
**Goal**: Migrate monster creation tool to Phaser for consistency with main app

**Tasks**:
1. Create Phaser scene for 640x640 workspace
2. Implement part loading as Phaser sprites
3. Add drag-drop using Phaser input system
4. Implement transform tools (scale, rotate, flip) using Phaser
5. Layer management with Phaser depth system
6. Color palette system integration
7. Monster value calculation
8. Save with creation_data (Phaser sprite states)
9. Maintain tutorial system
10. Keep localStorage and gold integration

**Files to modify**:
- `testing/part-monster-maker.html` (add Phaser integration)
- Create `testing/utils/MonsterMakerScene.js`
- Reuse utilities from main app:
  - `public/utils/PartSprite.js`
  - `public/utils/TransformManager.js`
  - `public/utils/LayerManager.js`
  - `public/utils/ExportManager.js`

**Estimated effort**: 6-8 hours

---

### **CHUNK 2: Part Combiner Hybrid Migration**
**Goal**: Add Phaser rendering to part combiner for consistency

**Tasks**:
1. Add Phaser scene for part preview rendering
2. Use Phaser for part sprite display in inventory
3. Keep existing breeding logic and UI
4. Integrate Phaser RenderTexture for part creation
5. Maintain tutorial system
6. Keep localStorage integration

**Files to modify**:
- `testing/part-combiner.html` (add Phaser integration)
- Create `testing/utils/PartPreviewScene.js`

**Estimated effort**: 3-4 hours

---

### **CHUNK 3: Part Shop Hybrid Migration**
**Goal**: Add Phaser rendering for monster previews and composition

**Tasks**:
1. Add Phaser scene for monster rendering
2. Use Phaser for part inventory display
3. Integrate with existing request system
4. Use Phaser RenderTexture for monster value calculation
5. Keep existing timer and gold systems
6. Maintain localStorage integration

**Files to modify**:
- `testing/part-shop.html` (add Phaser integration)
- Create `testing/utils/ShopPreviewScene.js`

**Estimated effort**: 4-5 hours

---

### **CHUNK 4: Documentation & Cleanup**
**Goal**: Document migrated tools and clean up legacy code

**Tasks**:
1. Update README with new tool locations
2. Add migration notes for each tool
3. Create shared utilities documentation
4. Archive legacy versions
5. Update API endpoint documentation
6. Add troubleshooting guide

**Files to create/modify**:
- `testing/README.md` (new)
- `testing/MIGRATION_NOTES.md` (new)
- Update main `README.md`

**Estimated effort**: 2-3 hours

---

## Shared Utilities to Create

### **1. PartPreviewScene.js**
Shared Phaser scene for part rendering
- Load parts as Phaser textures
- Auto-crop functionality
- Rarity-based visual effects
- Export to base64/PNG

### **2. MonsterRenderer.js**
Render complete monsters from creation data
- Parse creation_data JSON
- Apply transforms (scale, rotate, flip)
- Render to RenderTexture
- Calculate bounds and auto-crop

### **3. Reuse Main App Utilities**
The Part Monster Maker can reuse most utilities from the main app:
- `PartSprite.js` - Drag-drop sprite class
- `TransformManager.js` - Scale, rotate, flip
- `LayerManager.js` - Depth management
- `ExportManager.js` - Save and export
- `ImageLoader.js` - Base64 to texture conversion

---

## Technical Decisions

### **Phaser Configuration for Testing Tools**

**Part Monster Maker** (Full workspace):
```javascript
{
  type: Phaser.AUTO,
  width: 640,
  height: 640,
  parent: 'workspace',
  backgroundColor: '#e6f3e6',
  pixelArt: true,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
}
```

**Part Combiner/Shop** (Preview only):
```javascript
{
  type: Phaser.AUTO,
  width: 200,
  height: 200,
  parent: 'phaser-preview',
  backgroundColor: 'transparent',
  pixelArt: true,
  scene: {
    preload: preload,
    create: create
  }
}
```

### **Hybrid Approach**
- Keep existing RPGUI interface and game logic
- Add small Phaser scenes for rendering only
- Use Phaser RenderTexture for image generation
- Maintain localStorage and API integration
- No changes to breeding/request logic

---

## Migration Timeline

### **Phase 1: Part Monster Maker (Weeks 1-2)**
- CHUNK 1: Part Monster Maker Full Migration (6-8 hours)

### **Phase 2: Part Combiner (Week 3)**
- CHUNK 2: Part Combiner Hybrid Migration (3-4 hours)

### **Phase 3: Part Shop (Week 4)**
- CHUNK 3: Part Shop Hybrid Migration (4-5 hours)

### **Phase 4: Documentation (Week 5)**
- CHUNK 4: Documentation & Cleanup (2-3 hours)

**Total Estimated Time**: 5 weeks (part-time development)

---

## Testing Strategy

### **For Each Migrated Tool**:
1. Verify part preview rendering matches vanilla
2. Test with real monster/part data
3. Verify localStorage persistence
4. Test breeding logic unchanged
5. Verify request system unchanged
6. Check tutorial system still works

### **Integration Testing**:
1. Test parts created in Part Combiner work in main app
2. Verify Part Shop inventory integrates with main app
3. Test monster rendering matches main app output

---

## Rollback Plan

### **Keep Legacy Versions**
- Keep original vanilla rendering as fallback
- Add feature flag to toggle Phaser rendering
- Document differences if any

### **Feature Parity Checklist**
Before removing vanilla rendering:
- [ ] Part preview rendering identical
- [ ] Monster composition rendering identical
- [ ] Performance acceptable
- [ ] No visual regressions
- [ ] All game logic unchanged

---

## Benefits of Migration

### **Consistency**
- Same rendering as main app
- Shared image processing utilities
- Unified visual output

### **Performance**
- Hardware-accelerated rendering
- Better sprite caching
- Efficient RenderTexture usage

### **Maintainability**
- Single rendering codebase
- Shared bug fixes
- Easier to keep in sync with main app

---

## Migration Status: 25% Complete (1/4 Chunks)

**Pending**: Chunks 2-4  
**In Progress**: None  
**Complete**: Chunk 1 ✅

---

## Notes

- Testing tools are game mechanic interfaces, not admin tools
- Part Monster Maker gets full migration (similar to main app)
- Part Combiner/Shop use hybrid approach (rendering only)
- Game logic (breeding, requests, inventory) remains unchanged
- Can reuse most utilities from main app for Part Monster Maker
- Hybrid approach for other tools minimizes risk and effort
- Can be completed incrementally without breaking existing functionalityne: {
    preload: preload,
    create: create,
    update: update
  }
}
```

### **Joint System Structure**
```javascript
{
  partId: 'MonsterName_PartName',
  joints: [
    { x: 10, y: 20, type: 'wing' },
    { x: 15, y: 25, type: 'leg' }
  ]
}
```

### **Migration Approach**
1. **Full Migration**: Tools with heavy canvas usage (Joint Mapper, Auto Assembly, Streamliner)
2. **Hybrid Migration**: Tools with minimal canvas (Part Combiner, Part Shop) - add Phaser for rendering only
3. **Keep Vanilla**: Tools with no canvas or simple CRUD (Rarity Manager, Monster Analyzer, Egg Shop)

---

## Migration Timeline

### **Phase 1: Critical Tools (Weeks 1-2)**
- CHUNK 1: Joint Mapper Migration
- CHUNK 2: Auto Assembly Test Migration

### **Phase 2: Development Tools (Weeks 3-4)**
- CHUNK 3: Streamliner Migration
- CHUNK 4: Part Combiner Hybrid Migration

### **Phase 3: Game Mechanics (Week 5)**
- CHUNK 5: Part Shop Hybrid Migration

### **Phase 4: Documentation (Week 6)**
- CHUNK 6: Documentation & Cleanup

**Total Estimated Time**: 6 weeks (part-time development)

---

## Testing Strategy

### **For Each Migrated Tool**:
1. Verify all existing functionality works
2. Test with real monster/part data
3. Verify database integration
4. Check performance with large datasets
5. Test on different screen sizes
6. Verify localStorage persistence

### **Integration Testing**:
1. Test joint data created in Joint Mapper works in Auto Assembly
2. Test parts created in Streamliner work in main app
3. Verify part combiner creates valid parts
4. Test part shop inventory integrates with main app

---

## Rollback Plan

### **Keep Legacy Versions**
- Rename original files to `*-legacy.html`
- Keep functional until Phaser version is fully tested
- Document differences between versions

### **Feature Parity Checklist**
Before deprecating legacy versions, ensure:
- [ ] All features migrated
- [ ] Database integration working
- [ ] Performance acceptable
- [ ] No data loss
- [ ] User workflows unchanged

---

## Benefits of Migration

### **Consistency**
- Same rendering engine as main app
- Shared utilities and patterns
- Unified codebase

### **Performance**
- Hardware acceleration
- Better sprite management
- Efficient rendering

### **Maintainability**
- Single technology stack
- Shared bug fixes
- Easier onboarding

### **Features**
- Better visual effects
- Smoother animations
- Advanced input handling

---

## Non-Migration Justifications

### **Rarity Manager**
- Simple CRUD interface
- No canvas usage
- Works perfectly as-is
- Migration adds no value

### **Monster Analyzer**
- One-time data import tool
- Image processing focus
- Rarely used
- Not worth migration effort

### **Egg Shop**
- Standalone game mechanic test
- No canvas usage
- May be deprecated
- Low priority

---

## Migration Status: 0% Complete (0/6 Chunks)

**Pending**: All chunks  
**In Progress**: None  
**Complete**: None

---

## Notes

- Testing tools are admin/development interfaces, not end-user facing
- Migration priority based on usage frequency and main app integration
- Some tools may be deprecated if features move to main app
- Keep legacy versions until Phaser versions are battle-tested
- Consider creating unified "Admin Panel" in future to consolidate tools
