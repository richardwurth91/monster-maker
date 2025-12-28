let monsters = [];
let selectedMonsters = { 1: null, 2: null };
let availableParts = [];
let workspace = null;
let ctx = null;
let placedParts = [];
let selectedPart = null;
let selectedParts = [];
let isDragging = false;
let selectedLayerIndex = -1;
let animationFrameId = null;
let imageCache = new Map();
let currentPalette = 'original';
let monster1Palette = [];
let monster2Palette = [];
let colorMappings = {};
let selectedColor1 = null;
let selectedColorMonster = null;
let partSpecificMappings = {};

// Auto-crop transparent pixels from image data
function autoCropImage(imageData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = data.data;
            
            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
            
            // Find bounds of non-transparent pixels
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const alpha = pixels[(y * canvas.width + x) * 4 + 3];
                    if (alpha > 0) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            if (minX < canvas.width) {
                const cropWidth = maxX - minX + 1;
                const cropHeight = maxY - minY + 1;
                
                const cropCanvas = document.createElement('canvas');
                const cropCtx = cropCanvas.getContext('2d');
                cropCanvas.width = cropWidth;
                cropCanvas.height = cropHeight;
                
                cropCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
                resolve(cropCanvas.toDataURL());
            } else {
                resolve(imageData);
            }
        };
        img.src = imageData;
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    workspace = document.getElementById('workspace');
    ctx = workspace.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Scale canvas for mobile devices
    setupMobileCanvas();
    
    // Initialize mobile features
    initializeMobileFeatures();
    
    await loadMonsters();
    setupWorkspace();
    loadGallery();
    
    if (monsters.length > 0) {
        openMonsterModal(); // Show modal on page load
    }
});

// Setup mobile-friendly canvas scaling
function setupMobileCanvas() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Scale down canvas for mobile while maintaining pixel art quality
        const scale = 0.5;
        workspace.style.width = (640 * scale) + 'px';
        workspace.style.height = (640 * scale) + 'px';
        workspace.style.imageRendering = 'pixelated';
        workspace.style.imageRendering = '-moz-crisp-edges';
        workspace.style.imageRendering = 'crisp-edges';
    }
}

// Handle window resize for responsive canvas
window.addEventListener('resize', () => {
    setupMobileCanvas();
});

// Load monsters from database
async function loadMonsters() {
    try {
        const hatched = JSON.parse(localStorage.getItem('hatched')) || [];
        monsters = hatched;
        
        console.log('Loaded hatched monsters:', monsters.length);
        
        if (monsters.length === 0) {
            alert('No hatched monsters found! Please hatch some monsters in the Egg Shop first.');
            window.location.href = 'egg-shop.html';
            return;
        }
    } catch (error) {
        console.error('Error loading hatched monsters:', error);
        monsters = [];
    }
}

let selectedModalFamilies = ['ALL'];
let currentSelectorSlot = 1;

// Open monster selector for specific slot
function openMonsterSelector(slot) {
    currentSelectorSlot = slot;
    document.getElementById('selector-title').textContent = `Select Hatched Monster ${slot}`;
    document.getElementById('monster-selector-modal').style.display = 'block';
    populateMonsterSelectorGrid();
}

// Populate monster selector grid
function populateMonsterSelectorGrid() {
    const grid = document.getElementById('monster-selector-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const filteredMonsters = getFilteredModalMonsters();
    
    if (filteredMonsters.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666;">No hatched monsters available. Please hatch some monsters first!</p>';
        return;
    }
    
    filteredMonsters.forEach((monster, index) => {
        const item = document.createElement('div');
        item.className = 'monster-grid-item';
        item.onclick = () => selectMonsterFromGrid(monsters.indexOf(monster));
        
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 48;
            canvas.height = 48;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, 48, 48);
            item.appendChild(canvas);
        };
        img.src = monster.sprite;
        
        const name = document.createElement('div');
        name.className = 'monster-name';
        name.textContent = monster.name;
        item.appendChild(name);
        
        grid.appendChild(item);
    });
}

// Select monster from grid and update preview
function selectMonsterFromGrid(monsterIndex) {
    const monster = monsters[monsterIndex];
    if (!monster) return;
    
    // Store selection
    if (currentSelectorSlot === 1) {
        window.selectedModalMonster1 = monsterIndex;
    } else {
        window.selectedModalMonster2 = monsterIndex;
    }
    
    // Update preview
    const preview = document.getElementById(`modal-preview${currentSelectorSlot}`);
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 128, 128);
        preview.innerHTML = '';
        preview.appendChild(canvas);
    };
    img.src = monster.sprite;
    
    // Close selector and validate
    document.getElementById('monster-selector-modal').style.display = 'none';
    validateModalSelection();
}

// Get filtered monsters for modal
function getFilteredModalMonsters() {
    const nameFilter = document.getElementById('monster-name-filter')?.value.toLowerCase() || '';
    
    return monsters.filter(monster => {
        const nameMatch = monster.name.toLowerCase().includes(nameFilter);
        const familyMatch = selectedModalFamilies.includes('ALL') || selectedModalFamilies.includes(monster.family);
        return nameMatch && familyMatch;
    });
}

// Filter modal monsters
function filterModalMonsters() {
    populateMonsterSelectorGrid();
}

// Toggle family filter for modal
function toggleModalFamilyFilter(family) {
    const btn = document.querySelector(`.modal-family-filter [data-family="${family}"]`);
    
    if (family === 'ALL') {
        selectedModalFamilies = ['ALL'];
        document.querySelectorAll('.modal-family-filter .family-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    } else {
        if (selectedModalFamilies.includes('ALL')) {
            selectedModalFamilies = [family];
            document.querySelector('.modal-family-filter [data-family="ALL"]').classList.remove('active');
        } else if (selectedModalFamilies.includes(family)) {
            selectedModalFamilies = selectedModalFamilies.filter(f => f !== family);
            if (selectedModalFamilies.length === 0) {
                selectedModalFamilies = ['ALL'];
                document.querySelector('.modal-family-filter [data-family="ALL"]').classList.add('active');
            }
        } else {
            selectedModalFamilies.push(family);
        }
        btn.classList.toggle('active');
    }
    
    populateMonsterSelectorGrid();
}

// Select monster from grid
function selectModalMonster(slot, monsterId) {
    // This function is no longer used in the two-step modal system
}

// Load selected monster
function loadMonster(slot) {
    const selectId = `monster${slot}`;
    const previewId = `monster${slot}-preview`;
    const monsterId = document.getElementById(selectId).value;
    
    if (!monsterId) {
        selectedMonsters[slot] = null;
        document.getElementById(previewId).innerHTML = '';
        if (slot === 1) monster1Palette = [];
        if (slot === 2) monster2Palette = [];
        updateAvailableParts();
        return;
    }
    
    const monster = monsters.find(m => m.id == monsterId);
    if (monster) {
        selectedMonsters[slot] = monster;
        
        // Reset palette for this slot
        if (slot === 1) monster1Palette = [];
        if (slot === 2) monster2Palette = [];
        
        const preview = document.getElementById(previewId);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const previewCtx = canvas.getContext('2d');
            previewCtx.imageSmoothingEnabled = false;
            previewCtx.drawImage(img, 0, 0, 64, 64);
            preview.innerHTML = '';
            preview.appendChild(canvas);
        };
        img.src = monster.sprite;
        
        updateAvailableParts();
        updateSelectedMonstersDisplay();
    }
}

// Check if part can be added based on limits
function canAddPart(partName, monsterName) {
    const counts = {};
    
    placedParts.forEach(part => {
        counts[part.name] = (counts[part.name] || 0) + 1;
    });
    
    // Allow up to 2 of any part type
    return (counts[partName] || 0) < 2;
}

// Extract color palette from image
function extractPalette(imageData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = data.data;
            const colors = new Set();
            
            for (let i = 0; i < pixels.length; i += 4) {
                const alpha = pixels[i + 3];
                if (alpha > 0) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    colors.add(`${r},${g},${b}`);
                }
            }
            
            resolve(Array.from(colors).map(c => c.split(',').map(Number)));
        };
        img.src = imageData;
    });
}

// Find closest color in palette
function findClosestColor(color, palette) {
    let minDistance = Infinity;
    let closestColor = color;
    
    for (const paletteColor of palette) {
        const distance = Math.sqrt(
            Math.pow(color[0] - paletteColor[0], 2) +
            Math.pow(color[1] - paletteColor[1], 2) +
            Math.pow(color[2] - paletteColor[2], 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = paletteColor;
        }
    }
    
    return closestColor;
}

// Apply palette to image with part ID for specific mappings
function applyPaletteWithPartId(imageData, targetPalette, sourcePalette, partId) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = data.data;
            
            for (let i = 0; i < pixels.length; i += 4) {
                const alpha = pixels[i + 3];
                if (alpha > 0) {
                    const originalColor = [pixels[i], pixels[i + 1], pixels[i + 2]];
                    const closestSource = findClosestColor(originalColor, sourcePalette);
                    const targetColor = findClosestColorWithMapping(closestSource, targetPalette, partId);
                    
                    pixels[i] = targetColor[0];
                    pixels[i + 1] = targetColor[1];
                    pixels[i + 2] = targetColor[2];
                }
            }
            
            ctx.putImageData(data, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.src = imageData;
    });
}

// Set color palette mode
function setPalette(mode) {
    console.log('setPalette called:', mode);
    currentPalette = mode;
    document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-palette="${mode}"]`).classList.add('active');
    redrawWorkspace();
}

// Display color palettes
function displayPalettes() {
    const display = document.getElementById('palette-display');
    if (!display || monster1Palette.length === 0 || monster2Palette.length === 0) {
        console.log('displayPalettes: Missing display or palettes', {
            display: !!display,
            m1Length: monster1Palette.length,
            m2Length: monster2Palette.length
        });
        return;
    }
    
    console.log('Displaying palettes:', {
        monster1Colors: monster1Palette.length,
        monster2Colors: monster2Palette.length
    });
    
    display.innerHTML = `
        <div class="palette-section">
            <h4>Monster 1 Colors</h4>
            <div class="color-grid" id="monster1-colors"></div>
        </div>
        <div class="palette-section">
            <h4>Monster 2 Colors</h4>
            <div class="color-grid" id="monster2-colors"></div>
        </div>
        <div class="mappings-display" id="mappings-display"></div>
        <button onclick="resetMappings()" class="reset-mappings-btn">Reset Mappings</button>
    `;
    
    const m1Grid = document.getElementById('monster1-colors');
    const m2Grid = document.getElementById('monster2-colors');
    
    monster1Palette.forEach((color, i) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-swatch';
        colorDiv.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        colorDiv.dataset.color = color.join(',');
        colorDiv.onclick = () => selectColor(1, i);
        m1Grid.appendChild(colorDiv);
    });
    
    monster2Palette.forEach((color, i) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-swatch';
        colorDiv.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        colorDiv.dataset.color = color.join(',');
        colorDiv.onclick = () => selectColor(2, i);
        m2Grid.appendChild(colorDiv);
    });
    
    updateMappingsDisplay();
}

function updateMappingsDisplay() {
    const mappingsDiv = document.getElementById('mappings-display');
    if (!mappingsDiv) return;
    
    if (Object.keys(colorMappings).length === 0) {
        mappingsDiv.innerHTML = '';
        return;
    }
    
    mappingsDiv.innerHTML = '<h4>Color Mappings</h4><div class="mappings-grid"></div>';
    const grid = mappingsDiv.querySelector('.mappings-grid');
    
    Object.entries(colorMappings).forEach(([fromColorStr, toColor]) => {
        const fromColor = fromColorStr.split(',').map(Number);
        const mapping = document.createElement('div');
        mapping.className = 'color-mapping';
        mapping.innerHTML = `
            <div class="color-swatch small" style="background-color: rgb(${fromColor[0]}, ${fromColor[1]}, ${fromColor[2]})"></div>
            <span>→</span>
            <div class="color-swatch small" style="background-color: rgb(${toColor[0]}, ${toColor[1]}, ${toColor[2]})"></div>
        `;
        grid.appendChild(mapping);
    });
}

function selectColor(monster, index) {
    console.log('selectColor called:', { monster, index });
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    
    if (selectedColor1 === null) {
        // First color selection
        selectedColor1 = index;
        selectedColorMonster = monster;
        const palette = monster === 1 ? monster1Palette : monster2Palette;
        console.log('Selected first color:', palette[index]);
        document.querySelector(`#monster${monster}-colors .color-swatch:nth-child(${index + 1})`).classList.add('selected');
    } else {
        // Second color selection - create mapping
        const firstPalette = selectedColorMonster === 1 ? monster1Palette : monster2Palette;
        const secondPalette = monster === 1 ? monster1Palette : monster2Palette;
        const firstColor = firstPalette[selectedColor1];
        const secondColor = secondPalette[index];
        
        if (selectedParts.length > 0) {
            // Apply to all selected parts
            selectedParts.forEach(part => {
                if (!partSpecificMappings[part.id]) {
                    partSpecificMappings[part.id] = {};
                }
                partSpecificMappings[part.id][secondColor.join(',')] = firstColor;
            });
        } else {
            // Apply globally
            colorMappings[secondColor.join(',')] = firstColor;
        }
        
        console.log('Created mapping:', {
            from: secondColor,
            to: firstColor,
            partSpecific: !!selectedPart,
            partId: selectedPart?.id
        });
        
        selectedColor1 = null;
        selectedColorMonster = null;
        setPalette('custom');
        updateMappingsDisplay();
    }
}

function resetMappings() {
    colorMappings = {};
    partSpecificMappings = {};
    selectedColor1 = null;
    selectedColorMonster = null;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    updateMappingsDisplay();
    redrawWorkspace();
}

function findClosestColorWithMapping(color, palette, partId = null) {
    const colorKey = color.join(',');
    
    console.log('findClosestColorWithMapping called:', {
        color,
        partId,
        partSpecificMappingsForPart: partId ? partSpecificMappings[partId] : null,
        globalMappings: colorMappings,
        hasPartMapping: partId && partSpecificMappings[partId] && partSpecificMappings[partId][colorKey],
        hasGlobalMapping: colorMappings[colorKey]
    });
    
    // Check part-specific mappings first
    if (partId && partSpecificMappings[partId] && partSpecificMappings[partId][colorKey]) {
        console.log('Using part-specific mapping:', {
            partId,
            original: color,
            mapped: partSpecificMappings[partId][colorKey]
        });
        return partSpecificMappings[partId][colorKey];
    }
    
    // Check global mappings
    if (colorMappings[colorKey]) {
        console.log('Using global mapping:', {
            original: color,
            mapped: colorMappings[colorKey]
        });
        return colorMappings[colorKey];
    }
    
    const closest = findClosestColor(color, palette);
    console.log('Using automatic mapping:', {
        original: color,
        closest: closest
    });
    return closest;
}

// Apply palette with saved mappings (for gallery preview)
function applyPaletteWithSavedMappings(imageData, targetPalette, sourcePalette, partId, savedColorMappings, savedPartSpecificMappings) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = data.data;
            
            for (let i = 0; i < pixels.length; i += 4) {
                const alpha = pixels[i + 3];
                if (alpha > 0) {
                    const originalColor = [pixels[i], pixels[i + 1], pixels[i + 2]];
                    const closestSource = findClosestColor(originalColor, sourcePalette);
                    const targetColor = findClosestColorWithSavedMappings(closestSource, targetPalette, partId, savedColorMappings, savedPartSpecificMappings);
                    
                    pixels[i] = targetColor[0];
                    pixels[i + 1] = targetColor[1];
                    pixels[i + 2] = targetColor[2];
                }
            }
            
            ctx.putImageData(data, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.src = imageData;
    });
}

// Helper function for saved mappings
function findClosestColorWithSavedMappings(color, palette, partId, savedColorMappings, savedPartSpecificMappings) {
    const colorKey = color.join(',');
    
    // Check part-specific mappings first
    if (partId && savedPartSpecificMappings[partId] && savedPartSpecificMappings[partId][colorKey]) {
        return savedPartSpecificMappings[partId][colorKey];
    }
    
    // Check global mappings
    if (savedColorMappings[colorKey]) {
        return savedColorMappings[colorKey];
    }
    
    // Fall back to closest color
    return findClosestColor(color, palette);
}

// Update available parts list
function updateAvailableParts() {
    const monster1Parts = document.getElementById('monster1-parts');
    const monster2Parts = document.getElementById('monster2-parts');
    const monster1Title = document.getElementById('monster1-parts-title');
    const monster2Title = document.getElementById('monster2-parts-title');
    
    monster1Parts.innerHTML = '';
    monster2Parts.innerHTML = '';
    availableParts = [];
    
    // Check if both monsters are selected
    const monstersSelected = Object.values(selectedMonsters).filter(m => m).length;
    if (monstersSelected < 2) {
        monster1Parts.innerHTML = '<p style="padding: 10px; color: #666; font-size: 12px;">Select 2 monsters to access parts</p>';
        monster2Parts.innerHTML = '<p style="padding: 10px; color: #666; font-size: 12px;">Select 2 monsters to access parts</p>';
        return;
    }
    
    // Update titles with monster names
    monster1Title.textContent = selectedMonsters[1] ? selectedMonsters[1].name : 'Monster 1';
    monster2Title.textContent = selectedMonsters[2] ? selectedMonsters[2].name : 'Monster 2';
    
    [1, 2].forEach(slot => {
        const monster = selectedMonsters[slot];
        const container = slot === 1 ? monster1Parts : monster2Parts;
        
        if (monster && monster.parts) {
            const parts = JSON.parse(monster.parts);
            const partsList = document.createElement('div');
            partsList.className = 'parts-list';
            
            // Extract palette for this monster
            if (slot === 1 && monster1Palette.length === 0) {
                extractPalette(monster.sprite).then(palette => {
                    monster1Palette = palette;
                    displayPalettes();
                });
            } else if (slot === 2 && monster2Palette.length === 0) {
                extractPalette(monster.sprite).then(palette => {
                    monster2Palette = palette;
                    displayPalettes();
                });
            }
            
            Object.entries(parts).forEach(async ([partName, partData]) => {
                const croppedData = await autoCropImage(partData);
                
                availableParts.push({ name: partName, data: croppedData, monster: monster.name });
                
                const partDiv = document.createElement('div');
                partDiv.className = 'part-item';
                partDiv.title = `${partName} - ${monster.name}`;
                partDiv.dataset.partName = partName;
                partDiv.dataset.partData = croppedData;
                partDiv.dataset.monsterName = monster.name;
                
                // Check if part can be added
                const canAdd = canAddPart(partName, monster.name);
                if (!canAdd) {
                    partDiv.classList.add('disabled');
                    partDiv.title += ' - Limit reached';
                } else {
                    partDiv.draggable = true;
                }
                
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 32;
                    canvas.height = 32;
                    const partCtx = canvas.getContext('2d');
                    partCtx.imageSmoothingEnabled = false;
                    partCtx.drawImage(img, 0, 0, 32, 32);
                    partDiv.appendChild(canvas);
                };
                img.src = croppedData;
                
                if (canAdd) {
                    partDiv.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({
                            name: partName,
                            data: croppedData,
                            monster: monster.name
                        }));
                    });
                    
                    // Handle click for adding parts
                    const addPartHandler = (e) => {
                        // Add part to center of canvas
                        const centerX = Math.floor((320 - 16) / 10) * 10;
                        const centerY = Math.floor((320 - 16) / 10) * 10;
                        addPartToWorkspace(croppedData, partName, centerX, centerY, monster.name);
                    };
                    
                    // Track touch for mobile scroll detection
                    let touchStartY = 0;
                    let touchMoved = false;
                    
                    partDiv.addEventListener('touchstart', (e) => {
                        touchStartY = e.touches[0].clientY;
                        touchMoved = false;
                    });
                    
                    partDiv.addEventListener('touchmove', (e) => {
                        const touchY = e.touches[0].clientY;
                        if (Math.abs(touchY - touchStartY) > 10) {
                            touchMoved = true;
                        }
                    });
                    
                    partDiv.addEventListener('touchend', (e) => {
                        if (!touchMoved) {
                            addPartHandler(e);
                        }
                    });
                    
                    partDiv.addEventListener('click', addPartHandler);
                }
                
                partsList.appendChild(partDiv);
            });
            
            container.appendChild(partsList);
        }
    });
}

// Setup workspace canvas
function setupWorkspace() {
    // Grid background
    drawGrid();
    
    // Drop functionality
    workspace.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        const rect = workspace.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 10) * 10;
        const y = Math.floor((e.clientY - rect.top) / 10) * 10;
        
        const partData = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // Check if part can be added
        if (canAddPart(partData.name, partData.monster)) {
            addPartToWorkspace(partData.data, partData.name, x, y, partData.monster);
        }
    });
    
    // Mouse events for moving parts
    workspace.addEventListener('mousedown', handleMouseDown);
    workspace.addEventListener('mousemove', handleMouseMove);
    workspace.addEventListener('mouseup', handleMouseUp);
    
    // Touch events for mobile
    workspace.addEventListener('touchstart', handleTouchStart, { passive: false });
    workspace.addEventListener('touchmove', handleTouchMove, { passive: false });
    workspace.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Keyboard events for arrow key movement
    document.addEventListener('keydown', handleKeyDown);
}

// Draw grid on workspace
function drawGrid() {
    redrawWorkspace();
}

// Add part to workspace
function addPartToWorkspace(partDataUrl, partName, x, y, monsterName) {
    const img = new Image();
    img.onload = () => {
        const part = {
            id: Date.now(),
            name: partName,
            monster: monsterName,
            dataUrl: partDataUrl,
            originalDataUrl: partDataUrl,
            x: x,
            y: y,
            width: img.width * 5,
            height: img.height * 5,
            originalWidth: img.width * 5,
            originalHeight: img.height * 5,
            scale: 1,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false
        };
        
        placedParts.push(part);
        selectedPart = part;
        selectedParts = [part];
        selectedLayerIndex = placedParts.length - 1;
        
        // Cache the image for performance
        imageCache.set(partDataUrl, img);
        
        redrawWorkspace();
        updateLayersList();
        updateAvailableParts();
        updateSelectedMonstersDisplay();
    };
    img.src = partDataUrl;
}

// Redraw only moving parts for performance
function redrawMovingParts(movingParts, previousPositions) {
    // Clear areas where parts were previously
    previousPositions.forEach(pos => {
        ctx.clearRect(pos.x - 5, pos.y - 5, pos.width + 10, pos.height + 10);
        // Redraw grid in cleared area
        drawGridSection(pos.x - 5, pos.y - 5, pos.width + 10, pos.height + 10);
    });
    
    // Redraw all static parts that might overlap with cleared areas
    placedParts.forEach(part => {
        if (!movingParts.includes(part)) {
            const img = imageCache.get(part.dataUrl || part.originalDataUrl);
            if (img && img.complete) {
                drawPart(part, img);
            }
        }
    });
    
    // Draw moving parts
    movingParts.forEach(part => {
        const img = imageCache.get(part.dataUrl || part.originalDataUrl);
        if (img && img.complete) {
            drawPart(part, img);
            // Draw selection outline
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(part.x, part.y, part.width, part.height);
        }
    });
}

// Draw grid section
function drawGridSection(x, y, width, height) {
    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    const startX = Math.floor(x / 10) * 10;
    const startY = Math.floor(y / 10) * 10;
    const endX = Math.ceil((x + width) / 10) * 10;
    const endY = Math.ceil((y + height) / 10) * 10;
    
    for (let i = startX; i <= endX; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, Math.max(0, startY));
        ctx.lineTo(i, Math.min(640, endY));
        ctx.stroke();
    }
    
    for (let i = startY; i <= endY; i += 10) {
        ctx.beginPath();
        ctx.moveTo(Math.max(0, startX), i);
        ctx.lineTo(Math.min(640, endX), i);
        ctx.stroke();
    }
    
    ctx.restore();
}

// Draw individual part
function drawPart(part, img) {
    ctx.save();
    
    const centerX = part.x + part.width / 2;
    const centerY = part.y + part.height / 2;
    
    ctx.translate(centerX, centerY);
    
    if (part.flipHorizontal || part.flipVertical) {
        ctx.scale(
            part.flipHorizontal ? -1 : 1,
            part.flipVertical ? -1 : 1
        );
    }
    
    if (part.rotation) {
        ctx.rotate(part.rotation * Math.PI / 180);
    }
    
    ctx.drawImage(img, -part.width / 2, -part.height / 2, part.width, part.height);
    ctx.restore();
}
async function redrawWorkspace() {
    console.log('redrawWorkspace called:', {
        currentPalette,
        placedPartsCount: placedParts.length,
        monster1PaletteLength: monster1Palette.length,
        monster2PaletteLength: monster2Palette.length,
        colorMappingsCount: Object.keys(colorMappings).length
    });
    // Clear and draw grid
    ctx.clearRect(0, 0, 640, 640);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 640; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 640);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(640, i);
        ctx.stroke();
    }
    
    // Draw all parts in order
    for (const part of placedParts) {
        let dataUrl = part.originalDataUrl || part.dataUrl;
        
        // Apply palette conversion if needed
        if (currentPalette !== 'original' && monster1Palette.length > 0 && monster2Palette.length > 0) {
            let sourcePalette, targetPalette;
            
            if (currentPalette === 'custom') {
                // For custom mode, use the part's original palette as source
                sourcePalette = part.monster === selectedMonsters[1]?.name ? monster1Palette : monster2Palette;
                targetPalette = sourcePalette; // Same palette, only manual mappings will change colors
            } else {
                sourcePalette = part.monster === selectedMonsters[1]?.name ? monster1Palette : monster2Palette;
                targetPalette = currentPalette === 'monster1' ? monster1Palette : monster2Palette;
            }
            
            console.log('Palette conversion for part:', {
                partName: part.name,
                partMonster: part.monster,
                selectedMonster1: selectedMonsters[1]?.name,
                currentPalette,
                sourcePaletteLength: sourcePalette?.length || 0,
                targetPaletteLength: targetPalette?.length || 0,
                willConvert: sourcePalette && targetPalette && (sourcePalette !== targetPalette || currentPalette === 'custom')
            });
            
            if (sourcePalette && targetPalette && (sourcePalette !== targetPalette || currentPalette === 'custom')) {
                dataUrl = await applyPaletteWithPartId(dataUrl, targetPalette, sourcePalette, part.id);
                console.log('Applied palette conversion to part:', part.name);
            }
        }
        
        const img = new Image();
        await new Promise(resolve => {
            img.onload = resolve;
            img.src = dataUrl;
        });
        
        ctx.save();
        
        const centerX = part.x + part.width / 2;
        const centerY = part.y + part.height / 2;
        
        ctx.translate(centerX, centerY);
        
        if (part.flipHorizontal || part.flipVertical) {
            ctx.scale(
                part.flipHorizontal ? -1 : 1,
                part.flipVertical ? -1 : 1
            );
        }
        
        if (part.rotation) {
            ctx.rotate(part.rotation * Math.PI / 180);
        }
        
        ctx.drawImage(img, -part.width / 2, -part.height / 2, part.width, part.height);
        ctx.restore();
        
        // Draw selection outline for selected parts
        if (selectedParts.includes(part)) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(part.x, part.y, part.width, part.height);
        }
    }
}

// Mouse event handlers
function handleMouseDown(e) {
    const rect = workspace.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    handlePointerDown(mouseX, mouseY);
}

// Touch event handlers
function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const rect = workspace.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        handlePointerDown(touchX, touchY);
    }
}

// Common pointer down handler
function handlePointerDown(x, y) {
    // Get the actual canvas size vs displayed size
    const rect = workspace.getBoundingClientRect();
    const scaleX = workspace.width / rect.width;
    const scaleY = workspace.height / rect.height;
    
    // Scale coordinates to match canvas coordinate system
    x *= scaleX;
    y *= scaleY;
    
    let partFound = false;
    let clickedPart = null;
    
    // Find clicked/touched part (check from top to bottom)
    for (let i = placedParts.length - 1; i >= 0; i--) {
        const part = placedParts[i];
        if (x >= part.x && x <= part.x + part.width &&
            y >= part.y && y <= part.y + part.height) {
            clickedPart = part;
            selectedLayerIndex = i;
            partFound = true;
            break;
        }
    }
    
    if (partFound) {
        // Check if shift is held for multi-select
        if (event.shiftKey) {
            if (selectedParts.includes(clickedPart)) {
                // Remove from selection
                selectedParts = selectedParts.filter(p => p !== clickedPart);
                selectedPart = selectedParts.length > 0 ? selectedParts[selectedParts.length - 1] : null;
            } else {
                // Add to selection
                selectedParts.push(clickedPart);
                selectedPart = clickedPart;
            }
        } else {
            // If clicking on an already selected part, keep multi-selection for dragging
            if (selectedParts.includes(clickedPart)) {
                selectedPart = clickedPart; // Set as primary for dragging
            } else {
                // Single select
                selectedParts = [clickedPart];
                selectedPart = clickedPart;
            }
        }
        isDragging = true;
    } else {
        // Clear selection
        selectedParts = [];
        selectedPart = null;
        selectedLayerIndex = -1;
    }
    
    redrawWorkspace();
    updateLayersList();
}

function handleMouseMove(e) {
    if (!isDragging || !selectedPart) return;
    
    const rect = workspace.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    handlePointerMove(mouseX, mouseY);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDragging || !selectedPart || e.touches.length !== 1) return;
    
    const rect = workspace.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    handlePointerMove(touchX, touchY);
}

// Common pointer move handler
function handlePointerMove(x, y) {
    if (!selectedParts.length) return;
    
    // Get the actual canvas size vs displayed size
    const rect = workspace.getBoundingClientRect();
    const scaleX = workspace.width / rect.width;
    const scaleY = workspace.height / rect.height;
    
    // Scale coordinates to match canvas coordinate system
    x *= scaleX;
    y *= scaleY;
    
    // Store previous positions for clearing
    const previousPositions = selectedParts.map(part => ({
        x: part.x,
        y: part.y,
        width: part.width,
        height: part.height
    }));
    
    // Calculate movement delta based on primary selected part
    const primaryPart = selectedPart;
    const newX = Math.floor((x - primaryPart.width / 2) / 5) * 5;
    const newY = Math.floor((y - primaryPart.height / 2) / 5) * 5;
    
    const deltaX = newX - primaryPart.x;
    const deltaY = newY - primaryPart.y;
    
    // Move all selected parts by the same delta
    if (deltaX !== 0 || deltaY !== 0) {
        selectedParts.forEach(part => {
            part.x += deltaX;
            part.y += deltaY;
        });
        
        // Throttle redraws with requestAnimationFrame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(() => {
            redrawMovingParts(selectedParts, previousPositions);
        });
    }
}

function handleMouseUp(e) {
    handlePointerUp();
}

function handleTouchEnd(e) {
    e.preventDefault();
    handlePointerUp();
}

// Common pointer up handler
function handlePointerUp() {
    isDragging = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Handle keyboard input for arrow key movement
function handleKeyDown(e) {
    if (!selectedParts.length) return;
    
    // Only handle arrow keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    
    // Prevent default scrolling behavior
    e.preventDefault();
    
    // Move by 5px for finer control
    selectedParts.forEach(part => {
        switch (e.key) {
            case 'ArrowUp':
                part.y = Math.max(0, part.y - 5);
                break;
            case 'ArrowDown':
                part.y = Math.min(640 - part.height, part.y + 5);
                break;
            case 'ArrowLeft':
                part.x = Math.max(0, part.x - 5);
                break;
            case 'ArrowRight':
                part.x = Math.min(640 - part.width, part.x + 5);
                break;
        }
    });
    
    redrawWorkspace();
}

// Clear workspace
function clearWorkspace() {
    placedParts = [];
    selectedPart = null;
    selectedLayerIndex = -1;
    currentPalette = 'original';
    monster1Palette = [];
    monster2Palette = [];
    colorMappings = {};
    selectedColor1 = null;
    document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-palette="original"]')?.classList.add('active');
    const display = document.getElementById('palette-display');
    if (display) display.innerHTML = '';
    drawGrid();
    updateLayersList();
    updateAvailableParts();
    updateSelectedMonstersDisplay();
}

// Save creation
async function saveCreation() {
    const name = document.getElementById('monster-name').value.trim();
    if (!name) {
        alert('Please enter a monster name');
        return;
    }
    
    const author = document.getElementById('monster-author').value.trim() || 'Anonymous';
    const rawSpriteData = workspace.toDataURL();
    const spriteData = await autoCropImage(rawSpriteData);
    const parentMonsters = Object.values(selectedMonsters)
        .filter(m => m)
        .map(m => m.name);
    
    const creationData = {
        placedParts: placedParts.map(part => ({
            id: part.id,
            name: part.name,
            monster: part.monster,
            dataUrl: part.dataUrl || part.originalDataUrl,
            x: part.x,
            y: part.y,
            width: part.width,
            height: part.height,
            originalWidth: part.originalWidth,
            originalHeight: part.originalHeight,
            scale: part.scale,
            rotation: part.rotation,
            flipHorizontal: part.flipHorizontal,
            flipVertical: part.flipVertical
        })),
        selectedMonsters: selectedMonsters,
        colorMappings: colorMappings,
        partSpecificMappings: partSpecificMappings,
        currentPalette: currentPalette
    };
    
    try {
        const response = await fetch('/api/creations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                sprite: spriteData,
                parentMonsters,
                author,
                creationData
            })
        });
        
        if (response.ok) {
            // Create new monster from combination
            const newMonster = {
                name: name,
                sprite: spriteData,
                parts: JSON.stringify({}), // Empty parts for now
                family: selectedMonsters[1]?.family || '?'
            };
            
            // Get current hatched monsters
            let hatched = JSON.parse(localStorage.getItem('hatched')) || [];
            
            // Remove the two monsters that were combined
            const monster1Name = selectedMonsters[1]?.name;
            const monster2Name = selectedMonsters[2]?.name;
            
            hatched = hatched.filter(monster => 
                monster.name !== monster1Name && monster.name !== monster2Name
            );
            
            // Add the new combined monster
            hatched.push(newMonster);
            
            // Update localStorage
            localStorage.setItem('hatched', JSON.stringify(hatched));
            
            alert('Monster saved successfully! The combined monsters have been removed and your new creation added.');
            document.getElementById('monster-name').value = '';
            document.getElementById('monster-author').value = '';
            closeSaveModal();
            clearWorkspace();
            loadGallery();
            
            // Reload monsters list
            await loadMonsters();
        }
    } catch (error) {
        console.error('Error saving creation:', error);
        alert('Error saving monster');
    }
}

let allCreations = [];
let selectedFamilies = ['ALL'];
let isAdminMode = false;

// Load gallery
async function loadGallery() {
    try {
        const response = await fetch('/api/creations');
        allCreations = await response.json();
        displayGallery(allCreations);
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Display gallery items
function displayGallery(creations) {
    const gallery = document.getElementById('gallery-grid');
    gallery.innerHTML = '';
    
    creations.forEach(creation => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const itemCtx = canvas.getContext('2d');
        itemCtx.imageSmoothingEnabled = false;
        
        const img = new Image();
        img.onload = () => {
            // Scale image to fit in 128x128 while maintaining aspect ratio
            let scale = Math.min(128 / img.width, 128 / img.height);
            
            // If image is very small (less than 64px in either dimension), scale it up more
            if (img.width < 64 || img.height < 64) {
                scale = Math.min(128 / img.width, 128 / img.height);
            }
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            // Center the scaled image
            const offsetX = (128 - scaledWidth) / 2;
            const offsetY = (128 - scaledHeight) / 2;
            
            itemCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
        };
        img.src = creation.sprite;
        
        const name = document.createElement('h4');
        name.textContent = creation.name;
        
        const parents = document.createElement('p');
        const parentList = JSON.parse(creation.parent_monsters);
        parents.textContent = `Made from: ${parentList.join(', ')}`;
        
        const author = document.createElement('p');
        author.textContent = `By: ${creation.author || 'Anonymous'}`;
        author.style.fontStyle = 'italic';
        author.style.fontSize = '0.9em';
        
        item.appendChild(canvas);
        item.appendChild(name);
        item.appendChild(parents);
        item.appendChild(author);
        
        // Add click handler for preview
        item.style.cursor = 'pointer';
        item.onclick = () => showCreationPreview(creation);
        
        if (isAdminMode) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.backgroundColor = '#dc3545';
            deleteBtn.style.color = 'white';
            deleteBtn.style.border = 'none';
            deleteBtn.style.padding = '5px 10px';
            deleteBtn.style.borderRadius = '4px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.marginTop = '10px';
            deleteBtn.onclick = () => deleteCreation(creation.id);
            item.appendChild(deleteBtn);
        }
        
        gallery.appendChild(item);
    });
}

// Delete creation (admin only)
async function deleteCreation(id) {
    if (!confirm('Are you sure you want to delete this creation?')) return;
    
    try {
        const response = await fetch(`/api/creations/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadGallery(); // Refresh gallery
        } else {
            alert('Error deleting creation');
        }
    } catch (error) {
        console.error('Error deleting creation:', error);
        alert('Error deleting creation');
    }
}

let currentPreviewCreation = null;

// Show creation preview
function showCreationPreview(creation) {
    currentPreviewCreation = creation;
    document.getElementById('preview-title').textContent = creation.name;
    document.getElementById('preview-parents').textContent = `Made from: ${JSON.parse(creation.parent_monsters).join(', ')}`;
    document.getElementById('preview-author').textContent = `By: ${creation.author || 'Anonymous'}`;
    
    const remixBtn = document.getElementById('remix-btn');
    if (creation.creation_data) {
        remixBtn.disabled = false;
        remixBtn.style.opacity = '1';
        remixBtn.style.cursor = 'pointer';
    } else {
        remixBtn.disabled = true;
        remixBtn.style.opacity = '0.5';
        remixBtn.style.cursor = 'not-allowed';
    }
    
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 256, 256);
    
    // If creation has data, render it; otherwise use PNG
    if (creation.creation_data) {
        renderCreationData(creation.creation_data, ctx, 256, 256);
    } else {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(256 / img.width, 256 / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const offsetX = (256 - scaledWidth) / 2;
            const offsetY = (256 - scaledHeight) / 2;
            
            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
        };
        img.src = creation.sprite;
    }
    
    document.getElementById('preview-modal').style.display = 'block';
}

// Remix creation - load it into the editor
function remixCreation() {
    if (!currentPreviewCreation || !currentPreviewCreation.creation_data) return;
    
    const data = JSON.parse(currentPreviewCreation.creation_data);
    
    // Clear current workspace
    clearWorkspace();
    
    // Load the creation data
    selectedMonsters = data.selectedMonsters || {};
    placedParts = data.placedParts || [];
    colorMappings = data.colorMappings || {};
    partSpecificMappings = data.partSpecificMappings || {};
    currentPalette = data.currentPalette || 'original';
    
    // Update UI
    updateAvailableParts();
    updateSelectedMonstersDisplay();
    redrawWorkspace();
    updateLayersList();
    
    // Set palette button
    document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-palette="${currentPalette}"]`)?.classList.add('active');
    
    // Close modal and switch to creator tab without opening monster modal
    document.getElementById('preview-modal').style.display = 'none';
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('creator').classList.add('active');
    document.querySelector('.tab-btn').classList.add('active');
}

// Render creation from stored data
async function renderCreationData(creationDataStr, ctx, canvasWidth, canvasHeight) {
    const data = JSON.parse(creationDataStr);
    
    // Extract palette data from creation
    const savedColorMappings = data.colorMappings || {};
    const savedPartSpecificMappings = data.partSpecificMappings || {};
    const savedCurrentPalette = data.currentPalette || 'original';
    const savedSelectedMonsters = data.selectedMonsters || {};
    
    // Extract palettes from selected monsters if available
    let savedMonster1Palette = [];
    let savedMonster2Palette = [];
    
    if (savedSelectedMonsters[1] && savedSelectedMonsters[1].sprite) {
        savedMonster1Palette = await extractPalette(savedSelectedMonsters[1].sprite);
    }
    if (savedSelectedMonsters[2] && savedSelectedMonsters[2].sprite) {
        savedMonster2Palette = await extractPalette(savedSelectedMonsters[2].sprite);
    }
    
    // Find bounds of all parts
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    data.placedParts.forEach(part => {
        minX = Math.min(minX, part.x);
        minY = Math.min(minY, part.y);
        maxX = Math.max(maxX, part.x + part.width);
        maxY = Math.max(maxY, part.y + part.height);
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const scale = Math.min(canvasWidth / contentWidth, canvasHeight / contentHeight);
    
    const offsetX = (canvasWidth - contentWidth * scale) / 2;
    const offsetY = (canvasHeight - contentHeight * scale) / 2;
    
    // Render each part with palette transformations
    for (const part of data.placedParts) {
        let dataUrl = part.dataUrl;
        
        // Apply palette conversion if needed
        if (savedCurrentPalette !== 'original' && savedMonster1Palette.length > 0 && savedMonster2Palette.length > 0) {
            let sourcePalette, targetPalette;
            
            if (savedCurrentPalette === 'custom') {
                // For custom mode, use the part's original palette as source
                sourcePalette = part.monster === savedSelectedMonsters[1]?.name ? savedMonster1Palette : savedMonster2Palette;
                targetPalette = sourcePalette; // Same palette, only manual mappings will change colors
            } else {
                sourcePalette = part.monster === savedSelectedMonsters[1]?.name ? savedMonster1Palette : savedMonster2Palette;
                targetPalette = savedCurrentPalette === 'monster1' ? savedMonster1Palette : savedMonster2Palette;
            }
            
            if (sourcePalette && targetPalette && (sourcePalette !== targetPalette || savedCurrentPalette === 'custom')) {
                dataUrl = await applyPaletteWithSavedMappings(dataUrl, targetPalette, sourcePalette, part.id, savedColorMappings, savedPartSpecificMappings);
            }
        }
        
        const img = new Image();
        await new Promise(resolve => {
            img.onload = resolve;
            img.src = dataUrl;
        });
        
        ctx.save();
        
        const scaledX = (part.x - minX) * scale + offsetX;
        const scaledY = (part.y - minY) * scale + offsetY;
        const scaledWidth = part.width * scale;
        const scaledHeight = part.height * scale;
        
        const centerX = scaledX + scaledWidth / 2;
        const centerY = scaledY + scaledHeight / 2;
        
        ctx.translate(centerX, centerY);
        
        if (part.flipHorizontal || part.flipVertical) {
            ctx.scale(
                part.flipHorizontal ? -1 : 1,
                part.flipVertical ? -1 : 1
            );
        }
        
        if (part.rotation) {
            ctx.rotate(part.rotation * Math.PI / 180);
        }
        
        ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
    }
}

// Toggle family filter
function toggleFamilyFilter(family) {
    const btn = document.querySelector(`[data-family="${family}"]`);
    
    if (family === 'ALL') {
        selectedFamilies = ['ALL'];
        document.querySelectorAll('.family-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    } else {
        if (selectedFamilies.includes('ALL')) {
            selectedFamilies = [family];
            document.querySelector('[data-family="ALL"]').classList.remove('active');
        } else if (selectedFamilies.includes(family)) {
            selectedFamilies = selectedFamilies.filter(f => f !== family);
            if (selectedFamilies.length === 0) {
                selectedFamilies = ['ALL'];
                document.querySelector('[data-family="ALL"]').classList.add('active');
            }
        } else {
            selectedFamilies.push(family);
        }
        btn.classList.toggle('active');
    }
    
    filterGallery();
}

// Filter gallery by monster name, author, and family
function filterGallery() {
    const selectedMonster = document.getElementById('gallery-filter').value;
    const selectedAuthor = document.getElementById('author-filter').value;
    
    const filtered = allCreations.filter(creation => {
        const parentList = JSON.parse(creation.parent_monsters);
        
        // Check name filter
        const nameMatch = !selectedMonster || parentList.includes(selectedMonster);
        
        // Check author filter
        const authorMatch = !selectedAuthor || (creation.author || 'Anonymous') === selectedAuthor;
        
        // Check family filter
        let familyMatch = selectedFamilies.includes('ALL');
        if (!familyMatch) {
            familyMatch = parentList.some(parent => {
                const monster = monsters.find(m => m.name === parent);
                return monster && selectedFamilies.includes(monster.family);
            });
        }
        
        return nameMatch && authorMatch && familyMatch;
    });
    
    displayGallery(filtered);
}

// Populate gallery filter dropdowns
function populateGalleryFilter() {
    const monsterSelect = document.getElementById('gallery-filter');
    monsterSelect.innerHTML = '<option value="">All monsters</option>';
    
    monsters.forEach(monster => {
        const option = document.createElement('option');
        option.value = monster.name;
        option.textContent = monster.name;
        monsterSelect.appendChild(option);
    });
    
    // Populate author filter
    const authorSelect = document.getElementById('author-filter');
    authorSelect.innerHTML = '<option value="">All authors</option>';
    
    const authors = [...new Set(allCreations.map(c => c.author || 'Anonymous'))].sort();
    authors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorSelect.appendChild(option);
    });
}

// Reset all gallery filters
function resetGalleryFilters() {
    // Reset dropdowns
    document.getElementById('gallery-filter').value = '';
    document.getElementById('author-filter').value = '';
    
    // Reset family filter to ALL
    selectedFamilies = ['ALL'];
    document.querySelectorAll('.family-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-family="ALL"]').classList.add('active');
    
    // Apply filters
    filterGallery();
}

// Wipe database
async function wipeDatabase() {
    if (!confirm('Are you sure you want to wipe the entire database? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/wipe', { method: 'DELETE' });
        if (response.ok) {
            alert('Database wiped successfully!');
            await loadMonsters(); // Refresh monster lists
        }
    } catch (error) {
        console.error('Error wiping database:', error);
        alert('Error wiping database');
    }
}

// Seed database
async function seedDatabase() {
    try {
        const response = await fetch('/api/seed', { method: 'POST' });
        if (response.ok) {
            await loadMonsters(); // Refresh monster lists
        }
    } catch (error) {
        console.error('Error seeding database:', error);
        alert('Error seeding database');
    }
}

// Update layers list
function updateLayersList() {
    const layersList = document.getElementById('layers-list');
    layersList.innerHTML = '';
    
    // Display in reverse order (top layer first)
    for (let i = placedParts.length - 1; i >= 0; i--) {
        const part = placedParts[i];
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        if (selectedParts.includes(part)) {
            layerItem.classList.add('selected');
        }
        layerItem.textContent = `${placedParts.length - i}. ${part.name} - ${part.monster}`;
        layerItem.onclick = (e) => selectLayer(i, e);
        layersList.appendChild(layerItem);
    }
}

// Select layer
function selectLayer(index, event) {
    const clickedPart = placedParts[index];
    
    if (event && event.shiftKey) {
        // Multi-select with shift
        if (selectedParts.includes(clickedPart)) {
            // Remove from selection
            selectedParts = selectedParts.filter(p => p !== clickedPart);
            selectedPart = selectedParts.length > 0 ? selectedParts[selectedParts.length - 1] : null;
        } else {
            // Add to selection
            selectedParts.push(clickedPart);
            selectedPart = clickedPart;
        }
    } else {
        // Single select
        selectedLayerIndex = index;
        selectedPart = clickedPart;
        selectedParts = [selectedPart];
    }
    
    redrawWorkspace();
    updateLayersList();
}

// Move layer up (toward front)
function moveLayerUp() {
    if (!selectedParts.length) return;
    
    // Sort selected parts by their current index (highest first)
    const sortedParts = selectedParts
        .map(part => ({ part, index: placedParts.indexOf(part) }))
        .sort((a, b) => b.index - a.index);
    
    // Move each part up if possible
    sortedParts.forEach(({ part, index }) => {
        if (index < placedParts.length - 1) {
            placedParts.splice(index, 1);
            placedParts.splice(index + 1, 0, part);
        }
    });
    
    redrawWorkspace();
    updateLayersList();
}

// Move layer down (toward back)
function moveLayerDown() {
    if (!selectedParts.length) return;
    
    // Sort selected parts by their current index (lowest first)
    const sortedParts = selectedParts
        .map(part => ({ part, index: placedParts.indexOf(part) }))
        .sort((a, b) => a.index - b.index);
    
    // Move each part down if possible
    sortedParts.forEach(({ part, index }) => {
        const currentIndex = placedParts.indexOf(part);
        if (currentIndex > 0) {
            placedParts.splice(currentIndex, 1);
            placedParts.splice(currentIndex - 1, 0, part);
        }
    });
    
    redrawWorkspace();
    updateLayersList();
}

// Resize selected part
function resizeSelectedPart(scale) {
    if (selectedPart && scale) {
        selectedPart.scale = scale;
        selectedPart.width = selectedPart.originalWidth * scale;
        selectedPart.height = selectedPart.originalHeight * scale;
        redrawWorkspace();
    }
}

// Adjust scale by increment
function adjustScale(increment) {
    if (selectedParts.length) {
        selectedParts.forEach(part => {
            const newScale = Math.max(0.25, Math.min(2, part.scale + increment));
            part.scale = newScale;
            part.width = part.originalWidth * newScale;
            part.height = part.originalHeight * newScale;
        });
        redrawWorkspace();
    }
}

// Reset scale to 1x
function resetScale() {
    if (selectedParts.length) {
        selectedParts.forEach(part => {
            part.scale = 1;
            part.width = part.originalWidth;
            part.height = part.originalHeight;
        });
        redrawWorkspace();
    }
}

// Rotate selected part
function rotateSelectedPart(degrees) {
    if (selectedParts.length) {
        selectedParts.forEach(part => {
            part.rotation = (part.rotation + degrees + 360) % 360;
        });
        redrawWorkspace();
    }
}

// Flip selected part
function flipSelectedPart(direction) {
    if (selectedParts.length) {
        selectedParts.forEach(part => {
            if (direction === 'horizontal') {
                part.flipHorizontal = !part.flipHorizontal;
            } else if (direction === 'vertical') {
                part.flipVertical = !part.flipVertical;
            }
        });
        redrawWorkspace();
    }
}

// Bring selected part to front
function bringToFront() {
    if (selectedLayerIndex >= 0) {
        const part = placedParts.splice(selectedLayerIndex, 1)[0];
        placedParts.push(part);
        selectedLayerIndex = placedParts.length - 1;
        redrawWorkspace();
        updateLayersList();
    }
}

// Send selected part to back
function sendToBack() {
    if (selectedLayerIndex >= 0) {
        const part = placedParts.splice(selectedLayerIndex, 1)[0];
        placedParts.unshift(part);
        selectedLayerIndex = 0;
        redrawWorkspace();
        updateLayersList();
    }
}

// Remove selected part
function removeSelectedPart() {
    if (selectedParts.length > 0) {
        // Remove all selected parts
        selectedParts.forEach(part => {
            const index = placedParts.indexOf(part);
            if (index >= 0) {
                placedParts.splice(index, 1);
            }
        });
        
        selectedParts = [];
        selectedPart = null;
        selectedLayerIndex = -1;
        redrawWorkspace();
        updateLayersList();
        updateAvailableParts(); // Refresh parts list to make removed parts available again
        updateSelectedMonstersDisplay(); // Update save button state
    }
}

// Save modal functions
function openSaveModal() {
    document.getElementById('save-modal').style.display = 'block';
}

function closeSaveModal() {
    document.getElementById('save-modal').style.display = 'none';
}

// Modal functions
function openMonsterModal() {
    // Check if there are parts on the canvas
    if (placedParts.length > 0) {
        const proceed = confirm('Changing monsters will clear all parts from the editor. Do you want to proceed?');
        if (!proceed) {
            return;
        }
        // Clear the editor
        clearWorkspace();
    }
    
    document.getElementById('monster-modal').style.display = 'block';
}

function validateModalSelection() {
    const monster1Index = window.selectedModalMonster1;
    const monster2Index = window.selectedModalMonster2;
    const confirmBtn = document.getElementById('confirm-btn');
    
    // Enable button only if both monsters are selected and they're different
    const isValid = monster1Index !== undefined && monster2Index !== undefined && monster1Index !== monster2Index;
    confirmBtn.disabled = !isValid;
    
    if (monster1Index !== undefined && monster2Index !== undefined && monster1Index === monster2Index) {
        confirmBtn.textContent = 'Please select different monsters';
    } else {
        confirmBtn.textContent = 'Start Creating';
    }
}

function confirmMonsterSelection() {
    const monster1Index = window.selectedModalMonster1;
    const monster2Index = window.selectedModalMonster2;
    
    // Reset palettes when changing monsters
    monster1Palette = [];
    monster2Palette = [];
    currentPalette = 'original';
    colorMappings = {};
    selectedColor1 = null;
    document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-palette="original"]')?.classList.add('active');
    const display = document.getElementById('palette-display');
    if (display) display.innerHTML = '';
    
    // Set selected monsters directly
    selectedMonsters[1] = monsters[monster1Index];
    selectedMonsters[2] = monsters[monster2Index];
    
    updateAvailableParts();
    updateSelectedMonstersDisplay();
    
    document.getElementById('monster-modal').style.display = 'none';
}

function updateSelectedMonstersDisplay() {
    [1, 2].forEach(slot => {
        const monster = selectedMonsters[slot];
        const display = document.getElementById(`selected-monster${slot}`);
        const nameDisplay = document.getElementById(`selected-name${slot}`);
        
        if (monster) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0, 64, 64);
                display.innerHTML = '';
                display.appendChild(canvas);
            };
            img.src = monster.sprite;
            nameDisplay.textContent = monster.name;
        } else {
            display.innerHTML = 'Not selected';
            nameDisplay.textContent = '';
        }
    });
    
    // Update button states based on monster selection
    const monstersSelected = Object.values(selectedMonsters).filter(m => m).length;
    const changeBtn = document.getElementById('change-monsters-btn');
    const saveBtn = document.getElementById('save-btn');
    
    if (monstersSelected === 0) {
        changeBtn.textContent = 'Select Hatched Monsters';
        saveBtn.disabled = true;
    } else {
        changeBtn.textContent = 'Change Monsters';
        saveBtn.disabled = placedParts.length === 0;
    }
}

// Close modal and go to gallery
function closeModalToGallery() {
    document.getElementById('monster-modal').style.display = 'none';
    showTab('gallery');
}

// Tab functionality
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'gallery') {
        loadGallery();
        populateGalleryFilter();
        // Reset filters when opening gallery
        selectedFamilies = ['ALL'];
        document.querySelectorAll('.family-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-family="ALL"]').classList.add('active');
        document.getElementById('gallery-filter').value = '';
        document.getElementById('author-filter').value = '';
    } else if (tabName === 'creator') {
        openMonsterModal();
    }
}

function exportCanvas() {
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.imageSmoothingEnabled = false;
    
    if (placedParts.length === 0) {
        alert('No parts to export!');
        return;
    }
    
    // Find bounds of all parts in original pixel coordinates
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    placedParts.forEach(part => {
        const pixelX = part.x / 10;
        const pixelY = part.y / 10;
        const pixelWidth = part.width / 10;
        const pixelHeight = part.height / 10;
        
        minX = Math.min(minX, pixelX);
        minY = Math.min(minY, pixelY);
        maxX = Math.max(maxX, pixelX + pixelWidth);
        maxY = Math.max(maxY, pixelY + pixelHeight);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    exportCanvas.width = width;
    exportCanvas.height = height;
    
    // Draw parts at original pixel size
    placedParts.forEach(part => {
        let img = imageCache.get(part.dataUrl);
        if (img && img.complete) {
            exportCtx.save();
            
            const pixelX = part.x / 10 - minX;
            const pixelY = part.y / 10 - minY;
            const pixelWidth = part.width / 10;
            const pixelHeight = part.height / 10;
            
            const centerX = pixelX + pixelWidth / 2;
            const centerY = pixelY + pixelHeight / 2;
            
            exportCtx.translate(centerX, centerY);
            
            if (part.flipHorizontal || part.flipVertical) {
                exportCtx.scale(
                    part.flipHorizontal ? -1 : 1,
                    part.flipVertical ? -1 : 1
                );
            }
            
            if (part.rotation) {
                exportCtx.rotate(part.rotation * Math.PI / 180);
            }
            
            exportCtx.drawImage(img, -pixelWidth / 2, -pixelHeight / 2, pixelWidth, pixelHeight);
            exportCtx.restore();
        }
    });
    
    const link = document.createElement('a');
    const name = document.getElementById('monster-name').value.trim() || 'monster';
    
    link.download = `${name}.png`;
    link.href = exportCanvas.toDataURL();
    link.click();
}

// Mobile-specific functions
// Toggle section visibility
function toggleSection(sectionName) {
    const content = document.getElementById(`${sectionName}-content`);
    const header = event.target.closest('.section-header');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        header.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
    } else {
        content.classList.add('collapsed');
        header.classList.add('collapsed');
        content.style.maxHeight = '0px';
    }
}

function toggleMobileControls() {
    const panel = document.getElementById('mobile-controls-panel');
    panel.classList.toggle('open');
}

// Initialize mobile features
function initializeMobileFeatures() {
    const isMobile = window.innerWidth <= 768;
    
    console.log('Mobile detection:', isMobile, 'Window width:', window.innerWidth);
    
    // Debug: Log all elements with control buttons
    const allButtons = document.querySelectorAll('button');
    console.log('All buttons found:', allButtons.length);
    allButtons.forEach((btn, index) => {
        if (btn.textContent.includes('Left') || btn.textContent.includes('Right') || btn.textContent.includes('Horizontal')) {
            console.log(`Button ${index}:`, btn.textContent, 'Parent:', btn.parentElement.className, 'Grandparent:', btn.parentElement.parentElement?.className);
        }
    });
    
    if (isMobile) {
        // Show mobile controls toggle
        const toggle = document.querySelector('.mobile-controls-toggle');
        if (toggle) {
            toggle.style.display = 'block';
        }
        
        // Hide desktop h3 headers on mobile
        const desktopHeaders = document.querySelectorAll('.parts-panel h3, .layers-panel h3');
        desktopHeaders.forEach(header => {
            header.style.display = 'none';
        });
        
        // Set initial collapsed state for mobile sections
        const sections = ['layers'];
        sections.forEach(section => {
            const content = document.getElementById(`${section}-content`);
            if (content) {
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
        
        // Add scroll handler for hiding header elements
        let lastScrollY = 0;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const header = document.querySelector('h1');
            const tabs = document.querySelector('.tabs');
            
            if (currentScrollY > 200) {
                header.style.transform = 'translateY(-100%)';
                tabs.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
                tabs.style.transform = 'translateY(0)';
            }
            
            lastScrollY = currentScrollY;
        });
    }
}



// Update window resize handler
window.addEventListener('resize', () => {
    setupMobileCanvas();
    initializeMobileFeatures();
});