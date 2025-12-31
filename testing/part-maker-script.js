function getRarity(rarity) {
    if (rarity >= 4) return { name: 'Mythic', class: 'rarity-mythic' };
    if (rarity >= 3) return { name: 'Legendary', class: 'rarity-legendary' };
    if (rarity >= 2.5) return { name: 'Epic', class: 'rarity-epic' };
    if (rarity >= 2) return { name: 'Rare', class: 'rarity-rare' };
    if (rarity >= 1.5) return { name: 'Uncommon', class: 'rarity-uncommon' };
    return { name: 'Common', class: 'rarity-common' };
}

function getFamilyInfo(monsterName) {
    const families = {
        'Beast': { icon: '/assets/icons/family-icons/Family - Beast.png', monsters: ['Beast', 'Wild', 'Feral', 'Savage', 'Primal', 'Animal', 'Creature'] },
        'Bird': { icon: '/assets/icons/family-icons/Family - Bird.png', monsters: ['Bird', 'Avian', 'Wing', 'Feather', 'Flight', 'Sky'] },
        'Bug': { icon: '/assets/icons/family-icons/Family - Bug.png', monsters: ['Bug', 'Insect', 'Beetle', 'Ant', 'Spider', 'Wasp', 'Fly'] },
        'Dragon': { icon: '/assets/icons/family-icons/Family - Dragon.png', monsters: ['Dragon', 'Draco', 'Wyrm', 'Wyvern', 'Drake', 'Serpent'] },
        'Material': { icon: '/assets/icons/family-icons/Family - Material.png', monsters: ['Mech', 'Robot', 'Cyber', 'Tech', 'Metal', 'Steel', 'Iron', 'Material'] },
        'Plant': { icon: '/assets/icons/family-icons/Family - Plant.png', monsters: ['Forest', 'Wood', 'Tree', 'Leaf', 'Nature', 'Grove', 'Woodland', 'Plant'] },
        'Slime': { icon: '/assets/icons/family-icons/Family - Slime.png', monsters: ['Slime', 'Gel', 'Ooze', 'Blob', 'Goo'] },
        'Water': { icon: '/assets/icons/family-icons/Family - Water.png', monsters: ['Aqua', 'Coral', 'Tide', 'Wave', 'Ocean', 'Sea', 'Marine', 'Nautical', 'Water'] },
        'Zombie': { icon: '/assets/icons/family-icons/Family - Zombie.png', monsters: ['Undead', 'Skeleton', 'Ghost', 'Zombie', 'Spirit', 'Phantom', 'Wraith'] },
        'Demon': { icon: '/assets/icons/family-icons/Family- Demon.png', monsters: ['Demon', 'Devil', 'Fiend', 'Dark', 'Shadow', 'Evil'] }
    };
    
    for (const [family, info] of Object.entries(families)) {
        if (info.monsters.some(keyword => monsterName.toLowerCase().includes(keyword.toLowerCase()))) {
            return { name: family, icon: info.icon };
        }
    }
    
    return { name: 'Unknown', icon: '/assets/icons/family-icons/Family - ?.png' };
}

// Part-based Monster Maker Script - Based on original script.js
let workspace, ctx;
let selectedPartsSlots = new Array(8).fill(null);
let partInventory = [];
let placedParts = [];
let usedPartIds = new Set(); // Track which inventory parts are used
let selectedPart = null;
let selectedParts = [];
let isDragging = false;
let selectedLayerIndex = -1;
let animationFrameId = null;
let imageCache = new Map();
let currentPalette = 'original';
let partPalettes = new Map(); // Store palettes for each part
let colorMappings = {};
let selectedColor1 = null;
let selectedColorPart = null;
let partSpecificMappings = {};
let undoStack = [];
let redoStack = [];
const maxUndoSteps = 20;

// Calculate creation value based on part rarities
function calculateCreationValue() {
    const usedParts = selectedPartsSlots.filter(part => part !== null);
    return usedParts.reduce((total, part) => {
        const rarity = part.rarity || 1;
        if (rarity >= 4) return total + 50;
        if (rarity >= 3.5) return total + 35;
        if (rarity >= 3) return total + 30;
        if (rarity >= 2.5) return total + 25;
        if (rarity >= 2) return total + 20;
        if (rarity >= 1.5) return total + 15;
        return total + 10;
    }, 0);
}

// Load part inventory from localStorage
async function loadPartInventory() {
    partInventory = JSON.parse(localStorage.getItem('partInventory')) || [];
    await updatePartInventoryDisplay();
}

// Update the part inventory display
async function updatePartInventoryDisplay() {
    const inventoryDiv = document.getElementById('part-inventory');
    if (!inventoryDiv) return;
    
    if (partInventory.length === 0) {
        inventoryDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No parts available. Visit the Part Shop to buy some!</div>';
        return;
    }
    
    const trimmedParts = await Promise.all(
        partInventory.map(async (part, index) => {
            const trimmedSprite = await autoCropImage(part.sprite);
            return { ...part, trimmedSprite, index };
        })
    );
    
    inventoryDiv.innerHTML = trimmedParts.map((part) => {
        const rarityInfo = getRarity(part.rarity);
        const familyInfo = getFamilyInfo(part.monster);
        return `
        <div class="inventory-part ${rarityInfo.class} ${usedPartIds.has(part.index) ? 'used' : ''}" onclick="selectInventoryPart(${part.index})" style="position: relative;">
            <img src="${part.trimmedSprite}" alt="${part.name}">
            <div class="part-name">${part.name}</div>
            <div class="part-monster">${part.monster} - ${familyInfo.name}</div>
            <div style="font-size: 12px; font-weight: 600; color: #333;">${rarityInfo.name}</div>
            <img src="${familyInfo.icon}" style="position: absolute; top: 5px; right: 5px; width: 16px; height: 16px; image-rendering: pixelated;" alt="${familyInfo.name}">
        </div>`;
    }).join('');
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

function findClosestColorWithMapping(color, palette, partId = null) {
    const colorKey = color.join(',');
    
    // Check part-specific mappings first
    if (partId && partSpecificMappings[partId] && partSpecificMappings[partId][colorKey]) {
        return partSpecificMappings[partId][colorKey];
    }
    
    // Check global mappings
    if (colorMappings[colorKey]) {
        return colorMappings[colorKey];
    }
    
    return findClosestColor(color, palette);
}

// Set color palette mode
function setPalette(mode) {
    currentPalette = mode;
    document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-palette="${mode}"]`)?.classList.add('active');
    redrawWorkspace();
}

// Display color palettes for placed parts
function displayPalettes() {
    const display = document.getElementById('palette-display');
    if (!display || placedParts.length === 0) return;
    
    display.innerHTML = '<div class="palette-section"><h4>Part Colors</h4><div class="color-grid" id="part-colors"></div></div>';
    
    const colorGrid = document.getElementById('part-colors');
    const allColors = new Set();
    
    // Collect all colors from all parts
    placedParts.forEach(part => {
        const palette = partPalettes.get(part.id);
        if (palette) {
            palette.forEach(color => allColors.add(color.join(',')));
        }
    });
    
    Array.from(allColors).forEach((colorStr, i) => {
        const color = colorStr.split(',').map(Number);
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-swatch';
        colorDiv.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        colorDiv.dataset.color = colorStr;
        colorDiv.onclick = () => selectColor(color, i);
        colorGrid.appendChild(colorDiv);
    });
}

function selectColor(color, index) {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    
    if (selectedColor1 === null) {
        selectedColor1 = color;
        document.querySelector(`[data-color="${color.join(',')}"]`).classList.add('selected');
    } else {
        // Create mapping from color to selectedColor1 (reverse the mapping)
        saveState();
        if (selectedParts.length > 0) {
            selectedParts.forEach(part => {
                if (!partSpecificMappings[part.id]) {
                    partSpecificMappings[part.id] = {};
                }
                partSpecificMappings[part.id][color.join(',')] = selectedColor1;
            });
        } else {
            colorMappings[color.join(',')] = selectedColor1;
        }
        
        selectedColor1 = null;
        setPalette('custom');
    }
}
function selectPartSlot(slotIndex) {
    currentSelectedSlot = slotIndex;
    // Highlight the selected slot
    document.querySelectorAll('.selected-part').forEach((slot, index) => {
        slot.style.background = index === slotIndex ? '#ffffcc' : (selectedPartsSlots[index] ? '#e7f3ff' : '#f9f9f9');
    });
}

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
function selectInventoryPart(index) {
    if (usedPartIds.has(index)) return; // Prevent using already placed parts
    
    saveState();
    const part = partInventory[index];
    
    // Add to first empty slot
    const emptySlot = selectedPartsSlots.findIndex(slot => slot === null);
    if (emptySlot !== -1) {
        selectedPartsSlots[emptySlot] = part;
    }
    
    // Add part to center of canvas (320 is half of 640)
    const centerX = 320;
    const centerY = 320;
    addPartToWorkspace(part.sprite, part.name, centerX, centerY, part.monster, index);
    
    usedPartIds.add(index);
    updateSelectedPartsDisplay();
    updateAvailableParts();
    updatePartInventoryDisplay();
}

// Add part to workspace - copied from original
function addPartToWorkspace(partDataUrl, partName, x, y, monsterName, inventoryIndex = null) {
    const img = new Image();
    img.onload = async () => {
        // Trim transparent pixels from the part
        const trimmedDataUrl = await autoCropImage(partDataUrl);
        
        // Create new image with trimmed data
        const trimmedImg = new Image();
        trimmedImg.onload = async () => {
            // Calculate part dimensions
            const partWidth = trimmedImg.width * 5;
            const partHeight = trimmedImg.height * 5;
            
            console.log('Image loaded:', {width: trimmedImg.width, height: trimmedImg.height});
            console.log('Part dimensions:', {partWidth, partHeight});
            console.log('Image src length:', trimmedImg.src.length);
            console.log('Image naturalWidth/Height:', {naturalWidth: trimmedImg.naturalWidth, naturalHeight: trimmedImg.naturalHeight});
            
            // Center the part at the given coordinates
            const centeredX = x - (partWidth / 2);
            const centeredY = y - (partHeight / 2);
        
            const part = {
                id: Date.now(),
                name: partName,
                monster: monsterName,
                dataUrl: trimmedDataUrl,
                originalDataUrl: trimmedDataUrl,
                x: centeredX,
                y: centeredY,
                width: partWidth,
                height: partHeight,
                originalWidth: partWidth,
                originalHeight: partHeight,
                scale: 1,
                rotation: 0,
                flipHorizontal: false,
                flipVertical: false,
                inventoryIndex
            };
            
            // Extract palette for this part
            const palette = await extractPalette(trimmedDataUrl);
            partPalettes.set(part.id, palette);
            
            placedParts.push(part);
            selectedPart = part;
            selectedParts = [part];
            selectedLayerIndex = placedParts.length - 1;
            
            // Cache the trimmed image for performance
            imageCache.set(trimmedDataUrl, trimmedImg);
            
            redrawWorkspace();
            updateLayersList();
            updateAvailableParts();
            displayPalettes();
        };
        trimmedImg.src = trimmedDataUrl;
    };
    img.src = partDataUrl;
}

// Update selected parts display
async function updateSelectedPartsDisplay() {
    const slotsDiv = document.getElementById('selected-parts');
    if (!slotsDiv) return;
    
    const filledCount = selectedPartsSlots.filter(part => part !== null).length;
    const headerElement = document.querySelector('.tool-section .section-header h3');
    if (headerElement && headerElement.textContent.includes('Selected Parts')) {
        headerElement.textContent = `Selected Parts (${filledCount}/8)`;
    }
    
    const slotElements = await Promise.all(
        selectedPartsSlots.map(async (part, index) => {
            if (part) {
                const rarityInfo = getRarity(part.rarity);
                const trimmedSprite = await autoCropImage(part.sprite);
                return `
                    <div class="selected-part filled ${rarityInfo.class}" onclick="selectPartSlot(${index})">
                        <div>Slot ${index + 1}</div>
                        <img src="${trimmedSprite}" style="width: 24px; height: 24px; image-rendering: pixelated;">
                        <div style="font-size: 10px;">${part.name}</div>
                        <button onclick="removePartFromCanvas(${index}); event.stopPropagation();" style="font-size: 10px; margin-top: 5px;">Remove</button>
                    </div>
                `;
            } else {
                return `
                    <div class="selected-part" onclick="selectPartSlot(${index})">
                        <div>Slot ${index + 1}</div>
                        <div>Empty</div>
                    </div>
                `;
            }
        })
    );
    
    slotsDiv.innerHTML = slotElements.join('');
}

// Remove part from canvas and slot
function removePartFromCanvas(slotIndex) {
    const part = selectedPartsSlots[slotIndex];
    if (!part) return;
    
    saveState();
    
    // Remove from canvas (find matching part)
    const canvasIndex = placedParts.findIndex(p => 
        p.name === part.name && p.monster === part.monster
    );
    if (canvasIndex !== -1) {
        const canvasPart = placedParts[canvasIndex];
        // Free up inventory part if it has an inventory index
        if (canvasPart.inventoryIndex !== null && canvasPart.inventoryIndex !== undefined) {
            usedPartIds.delete(canvasPart.inventoryIndex);
        }
        placedParts.splice(canvasIndex, 1);
    }
    
    // Clear slot
    selectedPartsSlots[slotIndex] = null;
    updateSelectedPartsDisplay();
    updateAvailableParts();
    redrawWorkspace();
    updateLayersList();
    updatePartInventoryDisplay();
}

// Update available parts for workspace
function updateAvailableParts() {
    const partsPanel = document.getElementById('available-parts');
    if (partsPanel) {
        const availableParts = selectedPartsSlots.filter(part => part !== null);
        
        if (availableParts.length === 0) {
            partsPanel.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Select parts to add them here</div>';
        } else {
            partsPanel.innerHTML = availableParts.map((part, index) => `
                <div class="available-part" draggable="true" ondragstart="startDrag(event, ${selectedPartsSlots.indexOf(part)})">
                    <img src="${part.sprite}" alt="${part.name}" style="width: 32px; height: 32px; image-rendering: pixelated;">
                    <div style="font-size: 10px;">${part.name}</div>
                </div>
            `).join('');
        }
    }
    
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        const hasSelectedParts = selectedPartsSlots.some(part => part !== null);
        saveBtn.disabled = !hasSelectedParts;
    }
}

// Setup workspace - copied from original
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
        
        const partIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const part = selectedPartsSlots[partIndex];
        
        if (part) {
            addPartToWorkspace(part.sprite, part.name, x, y, part.monster);
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

// Redraw workspace - copied from original
async function redrawWorkspace() {
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
        if (currentPalette === 'custom' && (Object.keys(colorMappings).length > 0 || Object.keys(partSpecificMappings).length > 0)) {
            const sourcePalette = partPalettes.get(part.id);
            if (sourcePalette) {
                dataUrl = await applyPaletteWithPartId(dataUrl, sourcePalette, sourcePalette, part.id);
            }
        }
        
        let img = imageCache.get(dataUrl);
        if (!img) {
            img = new Image();
            img.src = dataUrl;
            imageCache.set(dataUrl, img);
            await new Promise(resolve => {
                img.onload = resolve;
                if (img.complete) resolve();
            });
        }
        
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

// Mouse event handlers - copied from original
function handleMouseDown(e) {
    const rect = workspace.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    handlePointerDown(mouseX, mouseY);
}

// Common pointer down handler - copied from original
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

// Common pointer move handler - copied from original
function handlePointerMove(x, y) {
    if (!selectedParts.length) return;
    
    // Get the actual canvas size vs displayed size
    const rect = workspace.getBoundingClientRect();
    const scaleX = workspace.width / rect.width;
    const scaleY = workspace.height / rect.height;
    
    // Scale coordinates to match canvas coordinate system
    x *= scaleX;
    y *= scaleY;
    
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
        
        redrawWorkspace();
    }
}

function handleMouseUp(e) {
    handlePointerUp();
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

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDragging || !selectedPart || e.touches.length !== 1) return;
    
    const rect = workspace.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    handlePointerMove(touchX, touchY);
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

// Handle keyboard input for arrow key movement and layer controls
function handleKeyDown(e) {
    if (!selectedParts.length) return;
    
    // Layer movement shortcuts (Page Up/Page Down or Shift + Arrow Up/Down)
    if (e.key === 'PageUp' || (e.shiftKey && e.key === 'ArrowUp')) {
        e.preventDefault();
        moveLayerUp();
        return;
    }
    if (e.key === 'PageDown' || (e.shiftKey && e.key === 'ArrowDown')) {
        e.preventDefault();
        moveLayerDown();
        return;
    }
    
    // Part selection shortcuts (Shift + Left/Right arrows)
    if (e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        selectPreviousPart();
        return;
    }
    if (e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        selectNextPart();
        return;
    }
    
    // Transform shortcuts
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rotateSelectedPart(90);
        return;
    }
    if (e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        flipSelectedPart('vertical');
        return;
    }
    if (e.key === 'F' && e.shiftKey) {
        e.preventDefault();
        flipSelectedPart('horizontal');
        return;
    }
    if (e.shiftKey && e.key === '-') {
        e.preventDefault();
        adjustScale(-0.1);
        return;
    }
    if (e.shiftKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        adjustScale(0.1);
        return;
    }
    
    // Only handle arrow keys for movement (without Shift)
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || e.shiftKey) return;
    
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

// Drag and drop functions
function startDrag(event, partIndex) {
    event.dataTransfer.setData('text/plain', partIndex);
}

// Update layers list - copied from original
function updateLayersList() {
    const layersList = document.getElementById('layers-list');
    if (!layersList) return;
    
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

// Select layer - copied from original
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

// Transform functions - copied from original
function adjustScale(increment) {
    if (selectedParts.length) {
        saveState();
        selectedParts.forEach(part => {
            const newScale = Math.max(0.25, Math.min(2, part.scale + increment));
            part.scale = newScale;
            part.width = part.originalWidth * newScale;
            part.height = part.originalHeight * newScale;
        });
        redrawWorkspace();
    }
}

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

function rotateSelectedPart(degrees) {
    if (selectedParts.length) {
        saveState();
        selectedParts.forEach(part => {
            part.rotation = (part.rotation + degrees + 360) % 360;
        });
        redrawWorkspace();
    }
}

function flipSelectedPart(direction) {
    if (selectedParts.length) {
        saveState();
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

// Part selection functions
function selectNextPart() {
    if (placedParts.length === 0) return;
    
    let currentIndex = selectedPart ? placedParts.indexOf(selectedPart) : -1;
    const nextIndex = (currentIndex + 1) % placedParts.length;
    
    selectedPart = placedParts[nextIndex];
    selectedParts = [selectedPart];
    selectedLayerIndex = nextIndex;
    
    redrawWorkspace();
    updateLayersList();
}

function selectPreviousPart() {
    if (placedParts.length === 0) return;
    
    let currentIndex = selectedPart ? placedParts.indexOf(selectedPart) : 0;
    const prevIndex = currentIndex === 0 ? placedParts.length - 1 : currentIndex - 1;
    
    selectedPart = placedParts[prevIndex];
    selectedParts = [selectedPart];
    selectedLayerIndex = prevIndex;
    
    redrawWorkspace();
    updateLayersList();
}

// Layer functions
function moveLayerUp() {
    if (selectedLayerIndex !== null && selectedLayerIndex < placedParts.length - 1) {
        [placedParts[selectedLayerIndex], placedParts[selectedLayerIndex + 1]] = 
        [placedParts[selectedLayerIndex + 1], placedParts[selectedLayerIndex]];
        selectedLayerIndex++;
        redrawWorkspace();
        updateLayersList();
    }
}

function moveLayerDown() {
    if (selectedLayerIndex !== null && selectedLayerIndex > 0) {
        [placedParts[selectedLayerIndex], placedParts[selectedLayerIndex - 1]] = 
        [placedParts[selectedLayerIndex - 1], placedParts[selectedLayerIndex]];
        selectedLayerIndex--;
        redrawWorkspace();
        updateLayersList();
    }
}

function removeSelectedPart() {
    if (selectedParts.length > 0) {
        saveState();
        selectedParts.forEach(part => {
            const index = placedParts.indexOf(part);
            if (index >= 0) {
                // Free up inventory part if it has an inventory index
                if (part.inventoryIndex !== null && part.inventoryIndex !== undefined) {
                    usedPartIds.delete(part.inventoryIndex);
                }
                placedParts.splice(index, 1);
            }
        });
        
        selectedParts = [];
        selectedPart = null;
        selectedLayerIndex = -1;
        redrawWorkspace();
        updateLayersList();
        updateAvailableParts();
        updatePartInventoryDisplay();
    }
}

function clearWorkspace() {
    saveState();
    placedParts = [];
    selectedPartsSlots = new Array(8).fill(null); // Clear all slots
    selectedPart = null;
    selectedParts = [];
    selectedLayerIndex = -1;
    usedPartIds.clear(); // Clear all used parts
    redrawWorkspace();
    updateAvailableParts();
    updateLayersList();
    updatePartInventoryDisplay();
    updateSelectedPartsDisplay();
}

// Undo/Redo functions
function saveState() {
    const state = {
        placedParts: JSON.parse(JSON.stringify(placedParts)),
        selectedPartsSlots: [...selectedPartsSlots],
        colorMappings: {...colorMappings},
        partSpecificMappings: JSON.parse(JSON.stringify(partSpecificMappings)),
        currentPalette
    };
    undoStack.push(state);
    if (undoStack.length > maxUndoSteps) undoStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
}

function undo() {
    if (undoStack.length === 0) return;
    
    const currentState = {
        placedParts: JSON.parse(JSON.stringify(placedParts)),
        selectedPartsSlots: [...selectedPartsSlots],
        colorMappings: {...colorMappings},
        partSpecificMappings: JSON.parse(JSON.stringify(partSpecificMappings)),
        currentPalette
    };
    redoStack.push(currentState);
    
    const state = undoStack.pop();
    restoreState(state);
    updateUndoRedoButtons();
}

function redo() {
    if (redoStack.length === 0) return;
    
    const currentState = {
        placedParts: JSON.parse(JSON.stringify(placedParts)),
        selectedPartsSlots: [...selectedPartsSlots],
        colorMappings: {...colorMappings},
        partSpecificMappings: JSON.parse(JSON.stringify(partSpecificMappings)),
        currentPalette
    };
    undoStack.push(currentState);
    
    const state = redoStack.pop();
    restoreState(state);
    updateUndoRedoButtons();
}

function restoreState(state) {
    placedParts = state.placedParts;
    selectedPartsSlots = state.selectedPartsSlots;
    colorMappings = state.colorMappings;
    partSpecificMappings = state.partSpecificMappings;
    currentPalette = state.currentPalette;
    selectedPart = null;
    selectedParts = [];
    selectedLayerIndex = -1;
    
    // Rebuild used parts tracking
    usedPartIds.clear();
    placedParts.forEach(part => {
        if (part.inventoryIndex !== null && part.inventoryIndex !== undefined) {
            usedPartIds.add(part.inventoryIndex);
        }
    });
    
    redrawWorkspace();
    updateSelectedPartsDisplay();
    updateAvailableParts();
    updateLayersList();
    displayPalettes();
    setPalette(currentPalette);
    updatePartInventoryDisplay();
}

function updateUndoRedoButtons() {
    document.getElementById('undo-btn').disabled = undoStack.length === 0;
    document.getElementById('redo-btn').disabled = redoStack.length === 0;
}

// Section toggle functions
function toggleSection(sectionName) {
    const content = document.getElementById(sectionName + '-content');
    const icon = event.target.querySelector('.toggle-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}

// Tab functions
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Save functions
function openSaveModal() {
    const value = calculateCreationValue();
    document.getElementById('creation-value').textContent = value;
    document.getElementById('save-modal').style.display = 'block';
}

function closeSaveModal() {
    document.getElementById('save-modal').style.display = 'none';
}

async function saveCreation() {
    const name = document.getElementById('monster-name').value.trim();
    const author = localStorage.getItem('userName') || 'Anonymous';
    
    if (!name) {
        alert('Please enter a monster name');
        return;
    }
    
    // Create sprite from canvas without grid
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    
    if (placedParts.length === 0) {
        alert('No parts to save!');
        return;
    }
    
    // Find bounds of all parts
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    placedParts.forEach(part => {
        minX = Math.min(minX, part.x);
        minY = Math.min(minY, part.y);
        maxX = Math.max(maxX, part.x + part.width);
        maxY = Math.max(maxY, part.y + part.height);
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    tempCanvas.width = contentWidth;
    tempCanvas.height = contentHeight;
    
    // Draw only the parts without grid
    for (const part of placedParts) {
        let dataUrl = part.originalDataUrl || part.dataUrl;
        
        // Apply palette conversion if needed
        if (currentPalette === 'custom' && (Object.keys(colorMappings).length > 0 || Object.keys(partSpecificMappings).length > 0)) {
            const sourcePalette = partPalettes.get(part.id);
            if (sourcePalette) {
                dataUrl = await applyPaletteWithPartId(dataUrl, sourcePalette, sourcePalette, part.id);
            }
        }
        
        const img = new Image();
        await new Promise(resolve => {
            img.onload = resolve;
            img.src = dataUrl;
        });
        
        tempCtx.save();
        
        const partX = part.x - minX;
        const partY = part.y - minY;
        const centerX = partX + part.width / 2;
        const centerY = partY + part.height / 2;
        
        tempCtx.translate(centerX, centerY);
        
        if (part.flipHorizontal || part.flipVertical) {
            tempCtx.scale(
                part.flipHorizontal ? -1 : 1,
                part.flipVertical ? -1 : 1
            );
        }
        
        if (part.rotation) {
            tempCtx.rotate(part.rotation * Math.PI / 180);
        }
        
        tempCtx.drawImage(img, -part.width / 2, -part.height / 2, part.width, part.height);
        tempCtx.restore();
    }
    
    const rawSpriteData = tempCanvas.toDataURL();
    const sprite = await autoCropImage(rawSpriteData);
    
    // Get parent monsters from selected parts
    const parentMonsters = [...new Set(selectedPartsSlots.filter(p => p).map(p => p.monster))];
    
    const creation = {
        name,
        author,
        sprite,
        parentMonsters: parentMonsters,
        creationData: {
            placedParts: placedParts,
            selectedParts: selectedPartsSlots.filter(p => p)
        },
        source: 'part-maker'
    };
    
    try {
        const response = await fetch('/api/creations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creation)
        });
        
        if (response.ok) {
            // Remove used parts from inventory
            const usedIndices = Array.from(usedPartIds).sort((a, b) => b - a); // Sort descending to avoid index issues
            usedIndices.forEach(index => {
                partInventory.splice(index, 1);
            });
            localStorage.setItem('partInventory', JSON.stringify(partInventory));
            
            alert('Monster saved successfully!');
            closeSaveModal();
            document.getElementById('monster-name').value = '';
            clearWorkspace();
            loadGallery();
        }
    } catch (error) {
        console.error('Error saving creation:', error);
        alert('Error saving monster');
    }
}

function exportCanvas() {
    const link = document.createElement('a');
    link.download = 'monster.png';
    link.href = workspace.toDataURL();
    link.click();
}

// Gallery functions (simplified)
async function loadGallery() {
    try {
        const response = await fetch('/api/creations');
        const allCreations = await response.json();
        
        // Filter for part-maker creations only
        const creations = allCreations.filter(creation => 
            creation.source === 'part-maker' || 
            (creation.creation_data && creation.creation_data.includes('selectedParts'))
        );
        
        const galleryGrid = document.getElementById('gallery-grid');
        if (creations.length === 0) {
            galleryGrid.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">No part-maker creations yet. Create your first monster!</div>';
        } else {
            const galleryElements = await Promise.all(
                creations.map(async creation => {
                    let creationDisplay;
                    if (creation.creation_data) {
                        // Render from creation data
                        const canvas = document.createElement('canvas');
                        canvas.width = 150;
                        canvas.height = 150;
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = false;
                        await renderCreationData(creation.creation_data, ctx, 150, 150);
                        const dataURL = canvas.toDataURL();
                        creationDisplay = `<img src="${dataURL}" style="width: 150px; height: 150px; image-rendering: pixelated;">`;
                    } else {
                        // Fallback to image
                        const trimmedSprite = await autoCropImage(creation.sprite);
                        creationDisplay = `<img src="${trimmedSprite}" alt="${creation.name}" style="width: 150px; height: 150px; image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">`;
                    }
                    return `
                        <div style="border: 1px solid #ddd; padding: 15px; text-align: center; background: white; border-radius: 8px;">
                            ${creationDisplay}
                            <h4 style="margin: 10px 0 5px 0; color: black;">${creation.name}</h4>
                            <p style="margin: 0; color: #666; font-size: 14px;">by ${creation.author}</p>
                        </div>
                    `;
                })
            );
            galleryGrid.innerHTML = galleryElements.join('');
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Render creation from stored data
async function renderCreationData(creationDataStr, ctx, canvasWidth, canvasHeight) {
    const data = JSON.parse(creationDataStr);
    
    if (!data.placedParts || data.placedParts.length === 0) {
        return;
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
    
    // Render each part
    for (const part of data.placedParts) {
        const img = new Image();
        await new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
            img.src = part.dataUrl;
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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    workspace = document.getElementById('workspace');
    ctx = workspace.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    await loadPartInventory();
    setupWorkspace();
    await updateSelectedPartsDisplay();
    loadGallery();
    updateUndoRedoButtons();
});

// Toggle menu function
function toggleMenu() {
    const menu = document.getElementById('menu-dropdown');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}