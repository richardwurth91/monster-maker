function getRarity(rarity) {
    if (rarity === 'mythic') return { name: 'Mythic', class: 'rarity-mythic' };
    if (rarity === 'legendary') return { name: 'Legendary', class: 'rarity-legendary' };
    if (rarity === 'epic') return { name: 'Epic', class: 'rarity-epic' };
    if (rarity === 'rare') return { name: 'Rare', class: 'rarity-rare' };
    if (rarity === 'uncommon') return { name: 'Uncommon', class: 'rarity-uncommon' };
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
let unlockedSlots = parseInt(localStorage.getItem('unlockedSlots')) || 4; // Load from localStorage
let partInventory = [];
let placedParts = [];
let usedPartIds = new Set(); // Track which inventory parts are used
let selectedPart = null;
let selectedParts = [];
let isDragging = false;
let selectedLayerIndex = -1;
let currentSelectedSlot = null; // Track currently selected slot in selected parts
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
let colorPaletteUnlocked = localStorage.getItem('colorPaletteUnlocked') === 'true';

// Save workspace state to localStorage
function saveWorkspaceState() {
    const workspaceState = {
        selectedPartsSlots,
        placedParts,
        usedPartIds: Array.from(usedPartIds),
        currentPalette,
        colorMappings,
        partSpecificMappings,
        partPalettes: Array.from(partPalettes.entries())
    };
    localStorage.setItem('workspaceState', JSON.stringify(workspaceState));
}

// Load workspace state from localStorage
function loadWorkspaceState() {
    const saved = localStorage.getItem('workspaceState');
    if (!saved) return;
    
    try {
        const state = JSON.parse(saved);
        selectedPartsSlots = state.selectedPartsSlots || new Array(8).fill(null);
        placedParts = state.placedParts || [];
        usedPartIds = new Set(state.usedPartIds || []);
        currentPalette = state.currentPalette || 'original';
        colorMappings = state.colorMappings || {};
        partSpecificMappings = state.partSpecificMappings || {};
        if (state.partPalettes) {
            partPalettes = new Map(state.partPalettes);
        }
    } catch (error) {
        console.error('Error loading workspace state:', error);
    }
}

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

function buySlot() {
    const slotCosts = [0, 0, 0, 0, 100, 1000, 10000, 100000]; // Costs for each slot
    const cost = slotCosts[unlockedSlots];
    let gold = parseInt(localStorage.getItem('gold')) || 0;
    
    if (gold >= cost && unlockedSlots < 8) {
        gold -= cost;
        localStorage.setItem('gold', gold);
        unlockedSlots++;
        localStorage.setItem('unlockedSlots', unlockedSlots);
        
        // Update gold display
        const goldElement = document.getElementById('gold-display');
        if (goldElement) {
            goldElement.textContent = gold;
        }
        
        updateSelectedPartsDisplay();
    }
}

function calculateMonsterValue() {
    let baseValue = 0;
    const parts = selectedPartsSlots.filter(part => part !== null);
    
    // Calculate base value
    parts.forEach(part => {
        const rarityValues = { 'common': 1, 'uncommon': 1.5, 'rare': 2, 'epic': 2.5, 'legendary': 3, 'mythic': 4 };
        const rarityValue = rarityValues[part.rarity] || 1;
        baseValue += Math.floor(rarityValue * 10);
    });
    
    // Calculate same-monster bonuses
    const monsterCounts = {};
    parts.forEach(part => {
        const key = `${part.name}-${part.monster}`;
        if (!monsterCounts[part.monster]) monsterCounts[part.monster] = new Set();
        monsterCounts[part.monster].add(key);
    });
    
    let bonusMultiplier = 0;
    Object.values(monsterCounts).forEach(uniqueParts => {
        const count = uniqueParts.size;
        if (count >= 2) {
            bonusMultiplier += 0.1 + (count - 2) * 0.2;
        }
    });
    
    return Math.floor(baseValue * (1 + bonusMultiplier));
}

function updateMonsterValue() {
    const parts = selectedPartsSlots.filter(part => part !== null);
    let baseValue = 0;
    
    // Calculate base value
    parts.forEach(part => {
        const rarityValues = { 'common': 1, 'uncommon': 1.5, 'rare': 2, 'epic': 2.5, 'legendary': 3, 'mythic': 4 };
        const rarityValue = rarityValues[part.rarity] || 1;
        baseValue += Math.floor(rarityValue * 10);
    });
    
    // Calculate same-monster bonuses
    const monsterCounts = {};
    parts.forEach(part => {
        const key = `${part.name}-${part.monster}`;
        if (!monsterCounts[part.monster]) monsterCounts[part.monster] = new Set();
        monsterCounts[part.monster].add(key);
    });
    
    let bonusMultiplier = 0;
    const bonuses = [];
    Object.entries(monsterCounts).forEach(([monster, uniqueParts]) => {
        const count = uniqueParts.size;
        if (count >= 2) {
            const bonus = 0.1 + (count - 2) * 0.2;
            bonusMultiplier += bonus;
            bonuses.push(`${monster}: +${Math.round(bonus * 100)}%`);
        }
    });
    
    const finalValue = Math.floor(baseValue * (1 + bonusMultiplier));
    
    const valueElement = document.getElementById('monster-value');
    const bonusElement = document.getElementById('bonus-text');
    
    if (valueElement) {
        valueElement.textContent = finalValue;
    }
    
    if (bonusElement) {
        bonusElement.textContent = bonuses.length > 0 ? bonuses.join(', ') : '';
    }
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
    
    // Save current expanded state
    const expandedStates = {};
    document.querySelectorAll('[id^="inv-category-"]').forEach(category => {
        const type = category.id.replace('inv-category-', '');
        expandedStates[type] = category.style.display !== 'none';
    });
    
    // Group parts by type
    const partsByType = {};
    partInventory.forEach((part, index) => {
        const type = part.name.toLowerCase().includes('head') ? 'Head' :
                   part.name.toLowerCase().includes('body') || part.name.toLowerCase().includes('torso') ? 'Body' :
                   part.name.toLowerCase().includes('arm') ? 'Arms' :
                   part.name.toLowerCase().includes('leg') ? 'Legs' :
                   part.name.toLowerCase().includes('wing') ? 'Wings' :
                   part.name.toLowerCase().includes('eye') ? 'Eyes' :
                   part.name.toLowerCase().includes('ear') ? 'Ears' :
                   part.name.toLowerCase().includes('tail') ? 'Tails' :
                   'Other';
                   
        if (!partsByType[type]) partsByType[type] = [];
        partsByType[type].push({...part, index});
    });
    
    let inventoryHtml = '';
    
    for (const [type, parts] of Object.entries(partsByType).sort()) {
        const isExpanded = expandedStates[type] || false;
        const arrowIcon = isExpanded ? '▼' : '▶';
        const displayStyle = isExpanded ? 'block' : 'none';
        
        inventoryHtml += `
            <div style="margin-bottom: 10px;">
                <div onclick="toggleInventoryCategory('${type}')" style="cursor: url('../RPGUI/img/cursor/point.png'), pointer; padding: 8px; background: #4a5c4a; color: white; font-weight: bold; border: 1px solid #666;">
                    <span id="inv-arrow-${type}">${arrowIcon}</span> ${type} (${parts.length})
                </div>
                <div id="inv-category-${type}" style="display: ${displayStyle};">
        `;
        
        const categoryItems = await Promise.all(
            parts.map(async (part) => {
                const trimmedSprite = await autoCropImage(part.sprite);
                const rarityInfo = getRarity(part.rarity);
                const rarityColors = {
                    'rarity-common': '#6c757d',
                    'rarity-uncommon': '#28a745',
                    'rarity-rare': '#17a2b8',
                    'rarity-epic': '#6f42c1',
                    'rarity-legendary': '#ffc107',
                    'rarity-mythic': '#dc3545'
                };
                const borderColor = rarityColors[rarityInfo.class] || '#306230';
                const isUsed = usedPartIds.has(part.index);
                const greyedStyle = isUsed ? 'opacity: 0.5; cursor: not-allowed;' : '';
                const clickHandler = isUsed ? '' : `onclick="selectInventoryPart(${part.index})"`;
                return `<div class="inventory-item ${rarityInfo.class}" ${clickHandler} style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 2px solid #306230; border-left: 4px solid ${borderColor}; margin-bottom: 8px; cursor: url('../RPGUI/img/cursor/point.png'), pointer; font-family: 'Courier New', monospace; font-weight: bold; color: #0f380f; ${greyedStyle}" onmouseover="${isUsed ? '' : "this.style.boxShadow='inset 0 0 15px rgba(255, 255, 255, 0.4)'"}"; onmouseout="${isUsed ? '' : "this.style.boxShadow=''"}";>
                    <img src="${trimmedSprite}" alt="${part.name}" style="width: 32px; height: 32px; image-rendering: pixelated; object-fit: contain;">
                    <div>
                        <div style="font-weight: 600;">${part.name}</div>
                        <div style="font-size: 12px;">from ${part.monster}</div>
                        <div style="font-size: 12px; font-weight: 600;">${rarityInfo.name}</div>
                    </div>
                </div>`;
            })
        );
        
        inventoryHtml += categoryItems.join('') + '</div></div>';
    }
    
    inventoryDiv.innerHTML = inventoryHtml;
}

function toggleInventoryCategory(type) {
    const category = document.getElementById(`inv-category-${type}`);
    const arrow = document.getElementById(`inv-arrow-${type}`);
    
    if (category.style.display === 'none' || category.style.display === '') {
        category.style.display = 'block';
        arrow.textContent = '▼';
    } else {
        category.style.display = 'none';
        arrow.textContent = '▶';
    }
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
    if (!colorPaletteUnlocked) return;
    currentPalette = mode;
    document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-palette="${mode}"]`)?.classList.add('active');
    redrawWorkspace();
}

// Display color palettes for placed parts
function displayPalettes() {
    if (!colorPaletteUnlocked) return;
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
        colorDiv.style.cursor = "url('../RPGUI/img/cursor/point.png'), pointer";
        colorDiv.dataset.color = colorStr;
        colorDiv.onclick = () => selectColor(color, i);
        colorGrid.appendChild(colorDiv);
    });
}

function selectColor(color, index) {
    if (!colorPaletteUnlocked) return;
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
function selectPartSlot(slotIndex, event) {
    const slotPart = selectedPartsSlots[slotIndex];
    if (!slotPart) return;
    
    const canvasPart = placedParts.find(p => 
        p.name === slotPart.name && p.monster === slotPart.monster
    );
    if (!canvasPart) return;
    
    // Handle multi-select with shift
    if (event && event.shiftKey) {
        if (selectedParts.includes(canvasPart)) {
            // Remove from selection
            selectedParts = selectedParts.filter(p => p !== canvasPart);
            selectedPart = selectedParts.length > 0 ? selectedParts[selectedParts.length - 1] : null;
        } else {
            // Add to selection
            selectedParts.push(canvasPart);
            selectedPart = canvasPart;
        }
    } else {
        // Single select
        selectedParts = [canvasPart];
        selectedPart = canvasPart;
        currentSelectedSlot = slotIndex;
    }
    
    // Update highlighting for all selected parts
    const selectedSlotIndices = [];
    selectedParts.forEach(selectedPart => {
        const slotIndex = selectedPartsSlots.findIndex(slotPart => 
            slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
        );
        if (slotIndex !== -1) {
            selectedSlotIndices.push(slotIndex);
        }
    });
    
    const selectedPartsDiv = document.getElementById('selected-parts');
    if (selectedPartsDiv) {
        const inventoryItems = selectedPartsDiv.querySelectorAll('.inventory-item');
        inventoryItems.forEach((item, index) => {
            if (selectedSlotIndices.includes(index)) {
                item.style.setProperty('background', '#ffffcc', 'important');
            } else {
                item.style.setProperty('background', '', 'important');
            }
        });
    }
    
    selectedLayerIndex = placedParts.indexOf(canvasPart);
    redrawWorkspace();
    updateLayersList();
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
    
    // Check if all unlocked slots are full
    const unlockedSlotsUsed = selectedPartsSlots.slice(0, unlockedSlots).filter(slot => slot !== null).length;
    if (unlockedSlotsUsed >= unlockedSlots) {
        showToast('No more slots available! Buy more slots or remove a part.');
        return; // Cannot add more parts
    }
    
    saveState();
    const part = partInventory[index];
    
    // Add to first empty unlocked slot
    const emptySlot = selectedPartsSlots.slice(0, unlockedSlots).findIndex(slot => slot === null);
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
    updateMonsterValue();
    saveWorkspaceState();
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
    
    const filledCount = selectedPartsSlots.slice(0, unlockedSlots).filter(part => part !== null).length;
    const headerElement = document.querySelector('.rpgui-container h3');
    if (headerElement && headerElement.textContent.includes('Selected Parts')) {
        headerElement.textContent = `Selected Parts (${filledCount}/${unlockedSlots})`;
    }
    
    const slotElements = await Promise.all(
        selectedPartsSlots.map(async (part, index) => {
            const isLocked = index >= unlockedSlots;
            
            if (part) {
                const rarityInfo = getRarity(part.rarity);
                const rarityColors = {
                    'rarity-common': '#6c757d',
                    'rarity-uncommon': '#28a745',
                    'rarity-rare': '#17a2b8',
                    'rarity-epic': '#6f42c1',
                    'rarity-legendary': '#ffc107',
                    'rarity-mythic': '#dc3545'
                };
                const borderColor = rarityColors[rarityInfo.class] || '#306230';
                const trimmedSprite = await autoCropImage(part.sprite);
                return `
                    <div class="inventory-item ${rarityInfo.class}" onclick="selectPartSlot(${index}, event)" style="display: flex; align-items: center; justify-content: center; padding: 5px; border: 2px solid #306230; border-left: 4px solid ${borderColor}; margin-bottom: 8px; cursor: url('../RPGUI/img/cursor/point.png'), pointer; font-family: 'Courier New', monospace; font-weight: bold; color: #0f380f; height: 20px; position: relative;" onmouseover="this.querySelector('img').style.transform='translateX(-30px)'; this.querySelector('.hover-buttons').style.opacity='1';" onmouseout="this.querySelector('img').style.transform='translateX(0)'; this.querySelector('.hover-buttons').style.opacity='0';">
                        <img src="${trimmedSprite}" style="width: 32px; height: 32px; image-rendering: pixelated; object-fit: contain; transition: transform 0.2s ease;">
                        <div class="hover-buttons" style="opacity: 0; position: absolute; right: 5px; gap: 8px; display: flex; transition: opacity 0.2s ease;">
                            <button onclick="moveSlotUp(${index}); event.stopPropagation();" style="font-size: 14px; padding: 6px 8px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: url('../RPGUI/img/cursor/point.png'), pointer;" onmouseover="this.style.boxShadow='0 0 0 2px #fff'" onmouseout="this.style.boxShadow=''">↑</button>
                            <button onclick="moveSlotDown(${index}); event.stopPropagation();" style="font-size: 14px; padding: 6px 8px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: url('../RPGUI/img/cursor/point.png'), pointer;" onmouseover="this.style.boxShadow='0 0 0 2px #fff'" onmouseout="this.style.boxShadow=''">↓</button>
                            <button onclick="removePartFromCanvas(${index}); event.stopPropagation();" style="font-size: 14px; padding: 6px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: url('../RPGUI/img/cursor/point.png'), pointer;" onmouseover="this.style.boxShadow='0 0 0 2px #fff'" onmouseout="this.style.boxShadow=''">🗑</button>
                        </div>
                    </div>
                `;
            } else if (isLocked) {
                const slotCosts = [0, 0, 0, 0, 100, 1000, 10000, 100000];
                const cost = slotCosts[index];
                const gold = parseInt(localStorage.getItem('gold')) || 0;
                const canAfford = gold >= cost;
                const isNextSlot = index === unlockedSlots;
                
                if (isNextSlot) {
                    return `
                        <div class="inventory-item" style="display: flex; align-items: center; justify-content: space-between; padding: 5px; border: 2px solid #444; margin-bottom: 8px; font-family: 'Courier New', monospace; font-weight: bold; color: #666; background: #222; height: 20px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🔒</div>
                            </div>
                            <button onclick="buySlot()" style="font-size: 10px; padding: 2px 6px; background: ${canAfford ? '#28a745' : '#666'}; color: white; border: none; border-radius: 3px; cursor: ${canAfford ? "url('../RPGUI/img/cursor/point.png'), pointer" : 'not-allowed'};">BUY ${cost}G</button>
                        </div>
                    `;
                } else {
                    return `
                        <div class="inventory-item" style="display: flex; align-items: center; justify-content: center; padding: 5px; border: 2px solid #444; margin-bottom: 8px; font-family: 'Courier New', monospace; font-weight: bold; color: #666; background: #222; height: 20px; opacity: 0.5;">
                            <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🔒</div>
                        </div>
                    `;
                }
            } else {
                return `
                    <div class="inventory-item" onclick="selectPartSlot(${index})" style="display: flex; align-items: center; justify-content: center; padding: 5px; border: 2px solid #666; margin-bottom: 8px; cursor: url('../RPGUI/img/cursor/point.png'), pointer; font-family: 'Courier New', monospace; font-weight: bold; color: #999; background: #333; height: 20px;" onmouseover="this.style.boxShadow='inset 0 0 15px rgba(255, 255, 255, 0.2)'" onmouseout="this.style.boxShadow=''">
                        <div style="width: 32px; height: 32px; border: 1px dashed #666; display: flex; align-items: center; justify-content: center; font-size: 20px;">+</div>
                    </div>
                `;
            }
        })
    );
    
    slotsDiv.innerHTML = slotElements.join('');
}

// Tab functions
function showTab(tabName) {
    document.querySelectorAll('#creator, #gallery').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('#creator-tab, #gallery-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).style.display = 'block';
    document.getElementById(tabName + '-tab').classList.add('active');
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
    updateMonsterValue();
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
    
    // Draw all parts in reverse order (first in list = on top)
    for (let i = placedParts.length - 1; i >= 0; i--) {
        const part = placedParts[i];
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
    for (let i = 0; i < placedParts.length; i++) {
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
        currentSelectedSlot = null;
        
        // Clear highlighting in selected parts window
        const selectedPartsDiv = document.getElementById('selected-parts');
        if (selectedPartsDiv) {
            const inventoryItems = selectedPartsDiv.querySelectorAll('.inventory-item');
            inventoryItems.forEach((item) => {
                item.style.setProperty('background', '', 'important');
            });
        }
    }
    
    redrawWorkspace();
    updateLayersList();
    
    // Highlight corresponding slot in selected parts window
    if (selectedParts.length > 0) {
        console.log('Selected parts:', selectedParts.map(p => `${p.name} ${p.monster}`));
        console.log('selectedPartsSlots:', selectedPartsSlots.map((p, i) => `${i}: ${p ? p.name : 'null'}`));
        
        const selectedSlotIndices = [];
        selectedParts.forEach(selectedPart => {
            const slotIndex = selectedPartsSlots.findIndex(slotPart => 
                slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
            );
            if (slotIndex !== -1) {
                selectedSlotIndices.push(slotIndex);
            }
        });
        
        console.log('Found slotIndices:', selectedSlotIndices);
        
        if (selectedSlotIndices.length > 0) {
            const selectedPartsDiv = document.getElementById('selected-parts');
            if (selectedPartsDiv) {
                const inventoryItems = selectedPartsDiv.querySelectorAll('.inventory-item');
                console.log('DOM inventory items count:', inventoryItems.length);
                
                inventoryItems.forEach((item, index) => {
                    const isSelected = selectedSlotIndices.includes(index);
                    console.log(`Item ${index}: highlighting=${isSelected}`);
                    if (isSelected) {
                        item.style.setProperty('background', '#ffffcc', 'important');
                    } else {
                        item.style.setProperty('background', '', 'important');
                    }
                });
            }
        }
    }
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
        saveWorkspaceState();
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
    // Don't handle shortcuts if save modal is open
    const saveModal = document.getElementById('save-modal');
    if (saveModal && saveModal.style.display === 'block') {
        return;
    }
    
    if (!selectedParts.length) return;
    
    // Layer movement shortcuts (Page Up/Page Down or Shift + Arrow Up/Down)
    if (e.key === 'PageUp' || (e.shiftKey && e.key === 'ArrowUp')) {
        e.preventDefault();
        if (selectedParts.length > 0) {
            const selectedPart = selectedParts[0];
            const slotIndex = selectedPartsSlots.findIndex(slotPart => 
                slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
            );
            if (slotIndex !== -1) {
                moveSlotUp(slotIndex);
            }
        }
        return;
    }
    if (e.key === 'PageDown' || (e.shiftKey && e.key === 'ArrowDown')) {
        e.preventDefault();
        if (selectedParts.length > 0) {
            const selectedPart = selectedParts[0];
            const slotIndex = selectedPartsSlots.findIndex(slotPart => 
                slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
            );
            if (slotIndex !== -1) {
                moveSlotDown(slotIndex);
            }
        }
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
        rotateSelectedPart(45);
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
    if (e.shiftKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        adjustScale(-0.1);
        return;
    }
    if (e.shiftKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        adjustScale(0.1);
        return;
    }
    if (e.key === 'Backspace') {
        e.preventDefault();
        removeSelectedPart();
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
    saveWorkspaceState();
}

// Drag and drop functions
function startDrag(event, partIndex) {
    event.dataTransfer.setData('text/plain', partIndex);
}

// Update layers list - now empty since we removed the layers panel
function updateLayersList() {
    // No longer needed - layers are managed through selected parts
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
    
    // Update highlighting in selected parts window
    const slotIndex = selectedPartsSlots.findIndex(slotPart => 
        slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
    );
    if (slotIndex !== -1) {
        const selectedPartsDiv = document.getElementById('selected-parts');
        if (selectedPartsDiv) {
            const inventoryItems = selectedPartsDiv.querySelectorAll('.inventory-item');
            inventoryItems.forEach((item, index) => {
                if (index === slotIndex) {
                    item.style.setProperty('background', '#ffffcc', 'important');
                } else {
                    item.style.setProperty('background', '', 'important');
                }
            });
        }
    }
    
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
    
    // Update highlighting in selected parts window
    const slotIndex = selectedPartsSlots.findIndex(slotPart => 
        slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
    );
    if (slotIndex !== -1) {
        const selectedPartsDiv = document.getElementById('selected-parts');
        if (selectedPartsDiv) {
            const inventoryItems = selectedPartsDiv.querySelectorAll('.inventory-item');
            inventoryItems.forEach((item, index) => {
                if (index === slotIndex) {
                    item.style.setProperty('background', '#ffffcc', 'important');
                } else {
                    item.style.setProperty('background', '', 'important');
                }
            });
        }
    }
    
    redrawWorkspace();
    updateLayersList();
}

function moveSlotUp(slotIndex) {
    if (slotIndex > 0) {
        [selectedPartsSlots[slotIndex], selectedPartsSlots[slotIndex - 1]] = 
        [selectedPartsSlots[slotIndex - 1], selectedPartsSlots[slotIndex]];
        
        const part1 = placedParts.find(p => selectedPartsSlots[slotIndex] && p.name === selectedPartsSlots[slotIndex].name && p.monster === selectedPartsSlots[slotIndex].monster);
        const part2 = placedParts.find(p => selectedPartsSlots[slotIndex - 1] && p.name === selectedPartsSlots[slotIndex - 1].name && p.monster === selectedPartsSlots[slotIndex - 1].monster);
        
        if (part1 && part2) {
            const index1 = placedParts.indexOf(part1);
            const index2 = placedParts.indexOf(part2);
            [placedParts[index1], placedParts[index2]] = [placedParts[index2], placedParts[index1]];
        }
        
        updateSelectedPartsDisplay();
        redrawWorkspace();
        
        // Update highlighting after display refresh
        if (selectedParts.length > 0) {
            console.log('moveSlotUp: Updating highlighting for selectedParts:', selectedParts.map(p => `${p.name} ${p.monster}`));
            const selectedSlotIndices = [];
            selectedParts.forEach(selectedPart => {
                const slotIndex = selectedPartsSlots.findIndex(slotPart => 
                    slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
                );
                console.log(`Found slotIndex ${slotIndex} for part ${selectedPart.name}`);
                if (slotIndex !== -1) {
                    selectedSlotIndices.push(slotIndex);
                }
            });
            
            console.log('selectedSlotIndices:', selectedSlotIndices);
            
            setTimeout(() => {
                const selectedPartsDiv = document.getElementById('selected-parts');
                if (selectedPartsDiv) {
                    const inventoryItems = selectedPartsDiv.querySelectorAll('.inventory-item');
                    console.log('DOM inventory items count (delayed):', inventoryItems.length);
                    inventoryItems.forEach((item, index) => {
                        const shouldHighlight = selectedSlotIndices.includes(index);
                        console.log(`Item ${index}: highlighting=${shouldHighlight} (delayed)`);
                        if (shouldHighlight) {
                            item.style.setProperty('background', '#ffffcc', 'important');
                        } else {
                            item.style.setProperty('background', '', 'important');
                        }
                    });
                }
            }, 10);
        }
    }
}

function moveSlotDown(slotIndex) {
    if (slotIndex < selectedPartsSlots.length - 1 && selectedPartsSlots[slotIndex + 1] !== null) {
        [selectedPartsSlots[slotIndex], selectedPartsSlots[slotIndex + 1]] = 
        [selectedPartsSlots[slotIndex + 1], selectedPartsSlots[slotIndex]];
        
        const part1 = placedParts.find(p => selectedPartsSlots[slotIndex] && p.name === selectedPartsSlots[slotIndex].name && p.monster === selectedPartsSlots[slotIndex].monster);
        const part2 = placedParts.find(p => selectedPartsSlots[slotIndex + 1] && p.name === selectedPartsSlots[slotIndex + 1].name && p.monster === selectedPartsSlots[slotIndex + 1].monster);
        
        if (part1 && part2) {
            const index1 = placedParts.indexOf(part1);
            const index2 = placedParts.indexOf(part2);
            [placedParts[index1], placedParts[index2]] = [placedParts[index2], placedParts[index1]];
        }
        
        updateSelectedPartsDisplay();
        redrawWorkspace();
        
        // Update highlighting after display refresh
        if (selectedParts.length > 0) {
            const selectedSlotIndices = [];
            selectedParts.forEach(selectedPart => {
                const slotIndex = selectedPartsSlots.findIndex(slotPart => 
                    slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
                );
                if (slotIndex !== -1) {
                    selectedSlotIndices.push(slotIndex);
                }
            });
            
            setTimeout(() => {
                const selectedPartsDiv = document.getElementById('selected-parts');
                if (selectedPartsDiv) {
                    const inventoryItems = selectedPartsDiv.querySelectorAll('.inventory-item');
                    inventoryItems.forEach((item, index) => {
                        if (selectedSlotIndices.includes(index)) {
                            item.style.setProperty('background', '#ffffcc', 'important');
                        } else {
                            item.style.setProperty('background', '', 'important');
                        }
                    });
                }
            }, 10);
        }
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
                
                // Remove from selected parts slots
                const slotIndex = selectedPartsSlots.findIndex(slotPart => 
                    slotPart && slotPart.name === part.name && slotPart.monster === part.monster
                );
                if (slotIndex !== -1) {
                    selectedPartsSlots[slotIndex] = null;
                }
            }
        });
        
        selectedParts = [];
        selectedPart = null;
        selectedLayerIndex = -1;
        redrawWorkspace();
        updateLayersList();
        updateAvailableParts();
        updatePartInventoryDisplay();
        updateSelectedPartsDisplay();
    }
}

function moveLayerUp() {
    if (selectedParts.length > 0) {
        const selectedPart = selectedParts[0];
        const slotIndex = selectedPartsSlots.findIndex(slotPart => 
            slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
        );
        if (slotIndex !== -1) {
            moveSlotUp(slotIndex);
        }
    }
}

function moveLayerDown() {
    if (selectedParts.length > 0) {
        const selectedPart = selectedParts[0];
        const slotIndex = selectedPartsSlots.findIndex(slotPart => 
            slotPart && slotPart.name === selectedPart.name && slotPart.monster === selectedPart.monster
        );
        if (slotIndex !== -1) {
            moveSlotDown(slotIndex);
        }
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
    updateMonsterValue();
    saveWorkspaceState();
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
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
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
    const valueElement = document.getElementById('monster-value');
    const value = valueElement ? valueElement.textContent : '0';
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
    
    // Load and display gold
    const gold = localStorage.getItem('gold') || localStorage.getItem('playerGold') || '0';
    const goldElement = document.getElementById('gold-display');
    if (goldElement) {
        goldElement.textContent = gold;
    }
    
    await loadPartInventory();
    loadWorkspaceState();
    setupWorkspace();
    await updateSelectedPartsDisplay();
    redrawWorkspace();
    loadGallery();
    updateUndoRedoButtons();
    updateColorPaletteDisplay();
});

// Toggle menu function
function toggleMenu() {
    const menu = document.getElementById('menu-dropdown');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Toast notification function
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Color palette unlock functions
function updateColorPaletteDisplay() {
    const unlockedDiv = document.getElementById('colorPaletteUnlocked');
    const lockedDiv = document.getElementById('colorPaletteLocked');
    const unlockBtn = document.getElementById('unlockColorBtn');
    
    if (colorPaletteUnlocked) {
        unlockedDiv.style.display = 'block';
        lockedDiv.style.display = 'none';
        displayPalettes();
    } else {
        unlockedDiv.style.display = 'none';
        lockedDiv.style.display = 'block';
        
        const gold = parseInt(localStorage.getItem('gold')) || 0;
        unlockBtn.disabled = gold < 1000;
        if (gold < 1000) {
            unlockBtn.innerHTML = '<p>UNLOCK (1000G) - Need More Gold</p>';
        } else {
            unlockBtn.innerHTML = '<p>UNLOCK (1000G)</p>';
        }
    }
}

function unlockColorPalette() {
    const gold = parseInt(localStorage.getItem('gold')) || 0;
    if (gold < 1000) {
        showToast('Need 1000G to unlock this feature!');
        return;
    }
    
    localStorage.setItem('gold', gold - 1000);
    localStorage.setItem('colorPaletteUnlocked', 'true');
    colorPaletteUnlocked = true;
    
    // Update gold display
    const goldElement = document.getElementById('gold-display');
    if (goldElement) {
        goldElement.textContent = gold - 1000;
    }
    
    showToast('Color Palette unlocked!');
    updateColorPaletteDisplay();
}