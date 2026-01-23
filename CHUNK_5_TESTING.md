# CHUNK 5 - Testing Instructions

## What Was Implemented
✅ Created LayerManager utility for depth control
✅ Implemented move layer up/down with proper depth ordering
✅ Updated bring to front/send to back functions
✅ Synced placedParts order with Phaser sprite depth
✅ Multi-part layer operations working
✅ Part removal destroys Phaser sprites properly

## How to Test

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open browser**:
   Navigate to http://localhost:3232

3. **Test Layer Order**:
   - [ ] Add 3+ parts to workspace
   - [ ] Parts should overlap based on order added
   - [ ] Later parts appear on top

4. **Test Move Up**:
   - [ ] Select a part that's behind others
   - [ ] Click the ↑ button in Layers panel
   - [ ] Part moves forward one layer
   - [ ] Visual order updates immediately

5. **Test Move Down**:
   - [ ] Select a part that's in front
   - [ ] Click the ↓ button
   - [ ] Part moves backward one layer

6. **Test Multi-Layer Move**:
   - [ ] Shift+click to select multiple parts
   - [ ] Click ↑ or ↓
   - [ ] All selected parts move together
   - [ ] Relative order maintained

7. **Test Layer Panel**:
   - [ ] Layer list shows parts in correct order
   - [ ] Top of list = front layer
   - [ ] Bottom of list = back layer
   - [ ] Clicking layer selects part

8. **Test Delete**:
   - [ ] Select a part
   - [ ] Click 🗑 button
   - [ ] Part disappears from canvas
   - [ ] Part removed from layer list

9. **Test Keyboard Shortcuts**:
   - [ ] PageUp or Shift+ArrowUp to move layer up
   - [ ] PageDown or Shift+ArrowDown to move layer down

## What's Ready for Chunk 6

- ✅ Layer ordering working with Phaser depth
- ✅ Move up/down functional
- ✅ Multi-part layer operations working
- ✅ Layer panel synced with Phaser
- ✅ Part deletion working
- ✅ Bring to front/send to back working

## Next Steps

Chunk 6 will:
- Implement color palette extraction
- Apply palette transformations
- Custom color mappings
- Part-specific color mappings
- Palette modes (original, monster1, monster2, custom)

## Technical Notes

- LayerManager uses Phaser's depth system
- Depth values: 0 (back) to n-1 (front)
- phaserSprites array order matches depth order
- placedParts syncs with phaserSprites order
- Multi-layer operations maintain relative order
- Sprite.destroy() removes sprite from scene
