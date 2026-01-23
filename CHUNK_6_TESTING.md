# CHUNK 6 - Testing Instructions

## What Was Implemented
✅ Created ColorPalette utility class
✅ Palette extraction from images
✅ Palette application with color mapping
✅ Custom color mappings support
✅ Part-specific color mappings
✅ Integrated with existing palette system

## How to Test

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open browser**:
   Navigate to http://localhost:3232

3. **Test Palette Extraction**:
   - [ ] Select two monsters
   - [ ] Check browser console for palette extraction
   - [ ] Monster 1 and Monster 2 palettes should be extracted
   - [ ] Color swatches appear in Color Palette panel

4. **Test Palette Modes**:
   - [ ] Add parts from both monsters
   - [ ] Click "Original" - parts keep original colors
   - [ ] Click "Monster 1" - all parts use Monster 1 palette
   - [ ] Click "Monster 2" - all parts use Monster 2 palette
   - [ ] Click "Custom" - enables manual color mapping

5. **Test Custom Color Mapping**:
   - [ ] Click "Custom" palette mode
   - [ ] Click a color from Monster 1 palette
   - [ ] Click a color from Monster 2 palette
   - [ ] Selected parts update with new color mapping
   - [ ] Mapping appears in "Color Mappings" section

6. **Test Part-Specific Mapping**:
   - [ ] Select a specific part
   - [ ] Create a color mapping (click two colors)
   - [ ] Mapping applies only to selected part
   - [ ] Other parts keep their colors

7. **Test Reset Mappings**:
   - [ ] Create some color mappings
   - [ ] Click "Reset Mappings" button
   - [ ] All custom mappings cleared
   - [ ] Parts return to automatic palette conversion

## What's Ready for Chunk 7

- ✅ Color palette extraction working
- ✅ Palette modes functional (original, monster1, monster2, custom)
- ✅ Custom color mappings working
- ✅ Part-specific mappings working
- ✅ ColorPalette utility integrated

## Next Steps

Chunk 7 will:
- Implement save to database
- Capture workspace as image
- Auto-crop transparent pixels
- Export as PNG file
- Store transform/palette state

## Technical Notes

- ColorPalette.extractFromImage() extracts unique colors
- ColorPalette.findClosest() finds nearest color match
- ColorPalette.applyPalette() applies palette with mappings
- Mappings stored as: `"r,g,b": [r, g, b]`
- Part-specific mappings override global mappings
- Palette changes require redrawWorkspace() call
