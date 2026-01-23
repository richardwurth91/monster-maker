// Part Monster Maker - Phaser Version
// Reuses utilities from main app

let game;
let scene;
let imageLoader;
let transformManager;
let layerManager;
let exportManager;

// State
let selectedPartsSlots = new Array(8).fill(null);
let unlockedSlots = parseInt(localStorage.getItem('unlockedSlots')) || 4;
let partInventory = [];
let usedPartIds = new Set();
let placedParts = [];
let selectedSprites = [];
let colorPaletteUnlocked = localStorage.getItem('colorPaletteUnlocked') === 'true';

// Phaser Configuration
const config = {
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    parent: 'phaser-workspace',
    backgroundColor: '#e6f3e6',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.EXPAND,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

function preload() {
    // Phaser preload
}

async function create() {
    scene = this;
    scene.selectedSprites = [];
    
    // Initialize utilities
    imageLoader = new ImageLoader(scene);
    transformManager = new TransformManager(scene);
    layerManager = new LayerManager(scene);
    exportManager = new ExportManager(scene);
    
    // Draw grid
    drawGrid();
    
    // Handle canvas resize
    scene.scale.on('resize', (gameSize) => {
        drawGrid();
    });
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Click empty space to deselect
    scene.input.on('pointerdown', (pointer, currentlyOver) => {
        console.log('Canvas click at:', pointer.x, pointer.y);
        console.log('Objects under pointer:', currentlyOver.length, currentlyOver);
        if (currentlyOver.length === 0) {
            deselectAll();
        }
    });
    
    // Setup selection events from PartSprite
    scene.events.on('part-select', (sprite) => {
        deselectAll();
        sprite.setSelected(true);
        selectedSprites = [sprite];
        scene.selectedSprites = selectedSprites;
        scene.events.emit('selectionChanged');
    });
    
    scene.events.on('part-shift-click', (sprite) => {
        if (selectedSprites.includes(sprite)) {
            sprite.setSelected(false);
            selectedSprites = selectedSprites.filter(s => s !== sprite);
        } else {
            sprite.setSelected(true);
            selectedSprites.push(sprite);
        }
        scene.selectedSprites = selectedSprites;
        scene.events.emit('selectionChanged');
    });
    
    // Selection change event
    scene.events.on('selectionChanged', () => {
        updateSelectedPartsHighlight();
    });
    
    // Load workspace state
    await loadWorkspaceState();
}

function update() {
    // Phaser update loop
}

function drawGrid() {
    console.log('Drawing grid...');
    if (scene.gridGraphics) {
        console.log('Destroying existing grid');
        scene.gridGraphics.destroy();
    }
    
    const canvasWidth = scene.scale.width;
    const canvasHeight = scene.scale.height;
    
    scene.gridGraphics = scene.add.graphics();
    scene.gridGraphics.lineStyle(1, 0xe0e0e0, 1);
    scene.gridGraphics.setDepth(-10000);
    scene.gridGraphics.setScrollFactor(0);
    console.log('Grid depth set to:', scene.gridGraphics.depth);
    
    for (let i = 0; i <= canvasWidth; i += 10) {
        scene.gridGraphics.lineBetween(i, 0, i, canvasHeight);
    }
    for (let i = 0; i <= canvasHeight; i += 10) {
        scene.gridGraphics.lineBetween(0, i, canvasWidth, i);
    }
    console.log('Grid drawn with', Math.ceil(canvasWidth/10 + canvasHeight/10 + 2), 'lines');
}

function deselectAll() {
    selectedSprites.forEach(sprite => sprite.setSelected(false));
    selectedSprites = [];
    scene.events.emit('selectionChanged');
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Check if any modal is open - if so, disable keyboard shortcuts
        const modals = document.querySelectorAll('.modal');
        const isModalOpen = Array.from(modals).some(modal => 
            modal.style.display === 'block' || modal.classList.contains('show')
        );
        
        if (isModalOpen) return;
        
        if (selectedSprites.length === 0) return;
        
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
        
        // Delete selected parts
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
        selectedSprites.forEach(sprite => {
            switch (e.key) {
                case 'ArrowUp':
                    sprite.y = Math.max(0, sprite.y - 5);
                    break;
                case 'ArrowDown':
                    sprite.y = Math.min(scene.scale.height - sprite.displayHeight, sprite.y + 5);
                    break;
                case 'ArrowLeft':
                    sprite.x = Math.max(0, sprite.x - 5);
                    break;
                case 'ArrowRight':
                    sprite.x = Math.min(scene.scale.width - sprite.displayWidth, sprite.x + 5);
                    break;
            }
            sprite.updateSelectionBorder();
        });
    });
}

// Load part inventory
async function loadPartInventory() {
    partInventory = JSON.parse(localStorage.getItem('partInventory')) || [];
    await updatePartInventoryDisplay();
}

// Update part inventory display
async function updatePartInventoryDisplay() {
    const inventoryDiv = document.getElementById('part-inventory');
    if (!inventoryDiv) return;
    
    if (partInventory.length === 0) {
        inventoryDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No parts available. Visit the Part Shop to buy some!</div>';
        return;
    }
    
    // Store current expanded state
    const expandedCategories = new Set();
    inventoryDiv.querySelectorAll('[id^="inv-category-"]').forEach(category => {
        if (category.style.display === 'block') {
            const type = category.id.replace('inv-category-', '');
            expandedCategories.add(type);
        }
    });
    
    // Group parts by type
    const partsByType = {};
    partInventory.forEach((part, index) => {
        const type = part.type || 'other';
        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
                   
        if (!partsByType[capitalizedType]) partsByType[capitalizedType] = [];
        partsByType[capitalizedType].push({...part, index});
    });
    
    let inventoryHtml = '';
    
    for (const [type, parts] of Object.entries(partsByType).sort()) {
        const isExpanded = expandedCategories.has(type);
        inventoryHtml += `
            <div style="margin-bottom: 10px;">
                <div onclick="toggleInventoryCategory('${type}')" style="cursor: pointer; padding: 8px; background: #4a5c4a; color: white; font-weight: bold; border: 1px solid #666;">
                    <span id="inv-arrow-${type}">${isExpanded ? '▼' : '▶'}</span> ${type} (${parts.length})
                </div>
                <div id="inv-category-${type}" style="display: ${isExpanded ? 'block' : 'none'};">
        `;
        
        for (const part of parts) {
            const rarityInfo = getRarity(part.rarity);
            const isUsed = usedPartIds.has(part.index);
            const greyedStyle = isUsed ? 'opacity: 0.5; cursor: not-allowed;' : '';
            const clickHandler = isUsed ? '' : `onclick="selectInventoryPart(${part.index})"`;
            const familyIcon = getFamilyIcon(part.family);
            
            inventoryHtml += `<div class="inventory-item ${rarityInfo.class}" ${clickHandler} style="display: flex; align-items: center; gap: 10px; padding: 10px; margin-bottom: 8px; cursor: pointer; ${greyedStyle}">
                <img src="${part.sprite}" style="width: 32px; height: 32px; image-rendering: pixelated;" onload="autoCropImage('${part.sprite}').then(cropped => this.src = cropped)">
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${part.name}</div>
                    <div style="font-size: 12px;">from ${part.monster}</div>
                    <div style="font-size: 12px; font-weight: 600;">${rarityInfo.name}</div>
                </div>
                <img src="${familyIcon}" style="width: 24px; height: 24px; image-rendering: pixelated;" onerror="this.style.display='none'">
            </div>`;
        }
        
        inventoryHtml += '</div></div>';
    }
    
    inventoryDiv.innerHTML = inventoryHtml;
}

function toggleInventoryCategory(type) {
    const category = document.getElementById(`inv-category-${type}`);
    const arrow = document.getElementById(`inv-arrow-${type}`);
    
    if (category.style.display === 'none') {
        category.style.display = 'block';
        arrow.textContent = '▼';
    } else {
        category.style.display = 'none';
        arrow.textContent = '▶';
    }
}

function selectInventoryPart(index) {
    if (usedPartIds.has(index)) return;
    
    const unlockedSlotsUsed = selectedPartsSlots.slice(0, unlockedSlots).filter(slot => slot !== null).length;
    if (unlockedSlotsUsed >= unlockedSlots) {
        showToast('No more slots available! Buy more slots or remove a part.');
        return;
    }
    
    const part = partInventory[index];
    
    // Shift all existing parts down by one slot
    for (let i = Math.min(unlockedSlots - 1, selectedPartsSlots.length - 1); i > 0; i--) {
        selectedPartsSlots[i] = selectedPartsSlots[i - 1];
    }
    // Put new part in first slot
    selectedPartsSlots[0] = part;
    
    // Add part to center of canvas
    addPartToWorkspace(part, index);
    
    usedPartIds.add(index);
    updateSelectedPartsDisplay();
    updatePartInventoryDisplay();
    updateMonsterValue();
    saveWorkspaceState();
}

async function addPartToWorkspace(part, inventoryIndex) {
    console.log('Adding part to workspace:', part.name);
    const textureKey = `part_${Date.now()}_${Math.random()}`;
    await imageLoader.loadBase64Texture(textureKey, part.sprite);
    
    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;
    
    const sprite = new PartSprite(scene, centerX, centerY, textureKey, {
        name: part.name,
        monster: part.monster,
        inventoryIndex: inventoryIndex
    });
    
    const depth = placedParts.length + 1;
    sprite.setDepth(depth);
    console.log('Part sprite depth set to:', depth);
    placedParts.unshift(sprite);
    
    // Redraw grid to fix rendering issues
    drawGrid();
    
    // Select the new sprite
    deselectAll();
    sprite.setSelected(true);
    selectedSprites = [sprite];
    scene.events.emit('selectionChanged');
    
    // Check canvas state after adding part
    console.log('Canvas state after adding part:');
    console.log('Grid graphics exists:', !!scene.gridGraphics);
    console.log('Grid graphics depth:', scene.gridGraphics?.depth);
    console.log('Grid graphics visible:', scene.gridGraphics?.visible);
    console.log('Total display objects:', scene.children.list.length);
    console.log('Display objects by depth:', scene.children.list.map(obj => ({type: obj.constructor.name, depth: obj.depth})).sort((a,b) => a.depth - b.depth));
    
    updateSaveButton();
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
    
    const slotElements = [];
    
    for (let index = 0; index < selectedPartsSlots.length; index++) {
        const part = selectedPartsSlots[index];
        const isLocked = index >= unlockedSlots;
        
        if (part) {
            const rarityInfo = getRarity(part.rarity);
            slotElements.push(`
                <div class="inventory-item ${rarityInfo.class}" onclick="selectPartSlot(${index}, event)" style="display: flex; align-items: center; justify-content: center; padding: 5px; margin-bottom: 8px; cursor: pointer; height: 20px;">
                    <img src="${part.sprite}" style="width: 32px; height: 32px; image-rendering: pixelated;">
                </div>
            `);
        } else if (isLocked) {
            const slotCosts = [0, 0, 0, 0, 100, 1000, 10000, 100000];
            const cost = slotCosts[index];
            const gold = parseInt(localStorage.getItem('gold')) || 0;
            const canAfford = gold >= cost;
            const isNextSlot = index === unlockedSlots;
            
            if (isNextSlot) {
                slotElements.push(`
                    <div class="inventory-item" style="display: flex; align-items: center; justify-content: space-between; padding: 5px; border: 2px solid #444; margin-bottom: 8px; background: #222; height: 20px;">
                        <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">🔒</div>
                        <button onclick="buySlot()" style="font-size: 10px; padding: 2px 6px; background: ${canAfford ? '#28a745' : '#666'}; color: white; border: none; border-radius: 3px; cursor: ${canAfford ? 'pointer' : 'not-allowed'};">BUY ${cost}G</button>
                    </div>
                `);
            } else {
                slotElements.push(`
                    <div class="inventory-item" style="display: flex; align-items: center; justify-content: center; padding: 5px; border: 2px solid #444; margin-bottom: 8px; background: #222; height: 20px; opacity: 0.5;">
                        <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">🔒</div>
                    </div>
                `);
            }
        } else {
            slotElements.push(`
                <div class="inventory-item" style="display: flex; align-items: center; justify-content: center; padding: 5px; border: 2px solid #666; margin-bottom: 8px; cursor: pointer; background: #333; height: 20px;">
                    <div style="width: 32px; height: 32px; border: 1px dashed #666; display: flex; align-items: center; justify-content: center; font-size: 20px;">+</div>
                </div>
            `);
        }
    }
    
    slotsDiv.innerHTML = slotElements.join('');
}

function selectPartSlot(slotIndex, event) {
    const slotPart = selectedPartsSlots[slotIndex];
    if (!slotPart) return;
    
    const sprite = placedParts.find(s => 
        s.partData.name === slotPart.name && s.partData.monster === slotPart.monster
    );
    if (!sprite) return;
    
    if (event && event.shiftKey) {
        if (selectedSprites.includes(sprite)) {
            sprite.setSelected(false);
            selectedSprites = selectedSprites.filter(s => s !== sprite);
        } else {
            sprite.setSelected(true);
            selectedSprites.push(sprite);
        }
    } else {
        deselectAll();
        sprite.setSelected(true);
        selectedSprites = [sprite];
    }
    
    scene.events.emit('selectionChanged');
}

function updateSelectedPartsHighlight() {
    const selectedPartsDiv = document.getElementById('selected-parts');
    if (!selectedPartsDiv) return;
    
    const inventoryItems = selectedPartsDiv.querySelectorAll('.inventory-item');
    inventoryItems.forEach((item, index) => {
        const slotPart = selectedPartsSlots[index];
        if (!slotPart) return;
        
        const isSelected = selectedSprites.some(sprite => 
            sprite.partData.name === slotPart.name && sprite.partData.monster === slotPart.monster
        );
        
        if (isSelected) {
            item.style.setProperty('background', '#ffffcc', 'important');
        } else {
            item.style.setProperty('background', '', 'important');
        }
    });
}

// Transform functions
function adjustScale(increment) {
    if (selectedSprites.length) {
        transformManager.adjustScale(selectedSprites, increment);
    }
}

function resetScale() {
    if (selectedSprites.length) {
        transformManager.resetScale(selectedSprites);
    }
}

function rotateSelectedPart(degrees) {
    if (selectedSprites.length) {
        transformManager.rotate(selectedSprites, degrees);
    }
}

function flipSelectedPart(direction) {
    if (selectedSprites.length) {
        transformManager.flip(selectedSprites, direction);
    }
}

// Layer functions
function moveLayerUp() {
    if (selectedSprites.length === 0) return;
    
    selectedSprites.forEach(sprite => {
        const currentIndex = placedParts.indexOf(sprite);
        if (currentIndex > 0) {
            // Swap in placedParts array
            [placedParts[currentIndex], placedParts[currentIndex - 1]] = 
            [placedParts[currentIndex - 1], placedParts[currentIndex]];
            
            // Swap in slots array
            const slotIndex = selectedPartsSlots.findIndex(slot => 
                slot && slot.name === sprite.partData.name && slot.monster === sprite.partData.monster
            );
            if (slotIndex > 0) {
                [selectedPartsSlots[slotIndex], selectedPartsSlots[slotIndex - 1]] = 
                [selectedPartsSlots[slotIndex - 1], selectedPartsSlots[slotIndex]];
            }
        }
    });
    
    // Reassign depths based on array order (first in list = highest depth = on top)
    placedParts.forEach((sprite, index) => {
        sprite.setDepth(placedParts.length - index);
        // Update selection border depth if selected
        if (sprite.selected) {
            sprite.selectionBorder.setDepth(sprite.depth - 0.5);
        }
    });
    
    updateSelectedPartsDisplay().then(() => {
        updateSelectedPartsHighlight();
    });
}

function moveLayerDown() {
    if (selectedSprites.length === 0) return;
    
    selectedSprites.forEach(sprite => {
        const currentIndex = placedParts.indexOf(sprite);
        if (currentIndex < placedParts.length - 1) {
            // Swap in placedParts array
            [placedParts[currentIndex], placedParts[currentIndex + 1]] = 
            [placedParts[currentIndex + 1], placedParts[currentIndex]];
            
            // Swap in slots array
            const slotIndex = selectedPartsSlots.findIndex(slot => 
                slot && slot.name === sprite.partData.name && slot.monster === sprite.partData.monster
            );
            if (slotIndex < selectedPartsSlots.length - 1 && selectedPartsSlots[slotIndex + 1]) {
                [selectedPartsSlots[slotIndex], selectedPartsSlots[slotIndex + 1]] = 
                [selectedPartsSlots[slotIndex + 1], selectedPartsSlots[slotIndex]];
            }
        }
    });
    
    // Reassign depths based on array order (first in list = highest depth = on top)
    placedParts.forEach((sprite, index) => {
        sprite.setDepth(placedParts.length - index);
        // Update selection border depth if selected
        if (sprite.selected) {
            sprite.selectionBorder.setDepth(sprite.depth - 0.5);
        }
    });
    
    updateSelectedPartsDisplay().then(() => {
        updateSelectedPartsHighlight();
    });
}

function removeSelectedPart() {
    if (selectedSprites.length === 0) return;
    
    selectedSprites.forEach(sprite => {
        const index = placedParts.indexOf(sprite);
        if (index >= 0) {
            if (sprite.partData.inventoryIndex !== null && sprite.partData.inventoryIndex !== undefined) {
                usedPartIds.delete(sprite.partData.inventoryIndex);
            }
            placedParts.splice(index, 1);
            
            const slotIndex = selectedPartsSlots.findIndex(slotPart => 
                slotPart && slotPart.name === sprite.partData.name && slotPart.monster === sprite.partData.monster
            );
            if (slotIndex !== -1) {
                selectedPartsSlots[slotIndex] = null;
            }
            
            // Destroy selection border first
            if (sprite.selectionBorder) {
                sprite.selectionBorder.destroy();
            }
            sprite.destroy();
        }
    });
    
    selectedSprites = [];
    updateSelectedPartsDisplay();
    updatePartInventoryDisplay();
    updateMonsterValue();
    updateSaveButton();
    saveWorkspaceState();
}

function clearWorkspace() {
    placedParts.forEach(sprite => {
        // Destroy selection border before destroying sprite
        if (sprite.selectionBorder) {
            sprite.selectionBorder.destroy();
        }
        sprite.destroy();
    });
    placedParts = [];
    selectedPartsSlots = new Array(8).fill(null);
    selectedSprites = [];
    usedPartIds.clear();
    drawGrid();
    updateSelectedPartsDisplay();
    updatePartInventoryDisplay();
    updateMonsterValue();
    updateSaveButton();
    saveWorkspaceState();
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
    
    if (name.length > 21) {
        alert('Monster name must be 21 characters or less');
        return;
    }
    
    if (placedParts.length === 0) {
        alert('No parts to save!');
        return;
    }
    
    const sprite = await ExportManager.captureWorkspace(scene, placedParts);
    const parentMonsters = [...new Set(selectedPartsSlots.filter(p => p).map(p => p.monster))];
    
    const creation = {
        name,
        author,
        sprite,
        parentMonsters: parentMonsters,
        creationData: {
            placedParts: placedParts.map(s => {
                const exportData = s.getExportData();
                const inventoryPart = partInventory[s.partData.inventoryIndex];
                if (inventoryPart) {
                    exportData.family = inventoryPart.family;
                    exportData.type = inventoryPart.type;
                }
                return exportData;
            }),
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
            const usedIndices = Array.from(usedPartIds).sort((a, b) => b - a);
            usedIndices.forEach(index => {
                partInventory.splice(index, 1);
            });
            localStorage.setItem('partInventory', JSON.stringify(partInventory));
            
            alert('Monster saved successfully!');
            closeSaveModal();
            document.getElementById('monster-name').value = '';
            clearWorkspace();
        }
    } catch (error) {
        console.error('Error saving creation:', error);
        alert('Error saving monster');
    }
}

function exportCanvas() {
    if (placedParts.length === 0) {
        alert('No parts to export!');
        return;
    }
    ExportManager.exportToPNG(scene, placedParts, 'monster');
}

// Utility functions
function getRarity(rarity) {
    if (rarity === 'mythic') return { name: 'Mythic', class: 'rarity-mythic' };
    if (rarity === 'legendary') return { name: 'Legendary', class: 'rarity-legendary' };
    if (rarity === 'epic') return { name: 'Epic', class: 'rarity-epic' };
    if (rarity === 'rare') return { name: 'Rare', class: 'rarity-rare' };
    if (rarity === 'uncommon') return { name: 'Uncommon', class: 'rarity-uncommon' };
    return { name: 'Common', class: 'rarity-common' };
}

function getFamilyIcon(family) {
    if (!family) return '/assets/icons/family-icons-v2/unknown_icon_1.png';
    const familyName = family.toLowerCase();
    return `/assets/icons/family-icons-v2/${familyName}_icon_1.png`;
}

function updateMonsterValue() {
    const parts = selectedPartsSlots.filter(part => part !== null);
    let baseValue = 0;
    
    parts.forEach(part => {
        const rarityValues = { 'common': 1, 'uncommon': 1.5, 'rare': 2, 'epic': 2.5, 'legendary': 3, 'mythic': 4 };
        const rarityValue = rarityValues[part.rarity] || 1;
        baseValue += Math.floor(rarityValue * 10);
    });
    
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
    
    if (valueElement) valueElement.textContent = finalValue;
    if (bonusElement) bonusElement.textContent = bonuses.length > 0 ? bonuses.join(', ') : '';
}

function updateSaveButton() {
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.disabled = placedParts.length === 0;
    }
}

function buySlot() {
    const slotCosts = [0, 0, 0, 0, 100, 1000, 10000, 100000];
    const cost = slotCosts[unlockedSlots];
    let gold = parseInt(localStorage.getItem('gold')) || 0;
    
    if (gold >= cost && unlockedSlots < 8) {
        gold -= cost;
        localStorage.setItem('gold', gold);
        unlockedSlots++;
        localStorage.setItem('unlockedSlots', unlockedSlots);
        
        const goldElement = document.getElementById('gold-display');
        if (goldElement) goldElement.textContent = gold;
        
        updateSelectedPartsDisplay();
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function saveWorkspaceState() {
    const workspaceState = {
        selectedPartsSlots,
        usedPartIds: Array.from(usedPartIds),
        placedParts: placedParts.map(sprite => ({
            partData: sprite.partData,
            x: sprite.x,
            y: sprite.y,
            scaleX: sprite.scaleX,
            scaleY: sprite.scaleY,
            angle: sprite.angle,
            flipX: sprite.flipX,
            flipY: sprite.flipY,
            depth: sprite.depth,
            textureKey: sprite.texture.key
        }))
    };
    localStorage.setItem('workspaceState', JSON.stringify(workspaceState));
}

async function loadWorkspaceState() {
    const saved = localStorage.getItem('workspaceState');
    if (!saved) return;
    
    try {
        const state = JSON.parse(saved);
        selectedPartsSlots = state.selectedPartsSlots || new Array(8).fill(null);
        usedPartIds = new Set(state.usedPartIds || []);
        
        // Restore placed parts
        if (state.placedParts && state.placedParts.length > 0) {
            // First, reload all textures needed for the parts
            const texturePromises = [];
            for (const partState of state.placedParts) {
                if (partState.partData && partState.partData.inventoryIndex !== undefined) {
                    const part = partInventory[partState.partData.inventoryIndex];
                    if (part && part.sprite) {
                        const textureKey = `part_${Date.now()}_${Math.random()}`;
                        texturePromises.push(
                            imageLoader.loadBase64Texture(textureKey, part.sprite).then(() => ({
                                partState,
                                textureKey
                            }))
                        );
                    }
                }
            }
            
            // Wait for all textures to load, then create sprites
            const loadedTextures = await Promise.all(texturePromises);
            for (const { partState, textureKey } of loadedTextures) {
                const sprite = new PartSprite(scene, partState.x, partState.y, textureKey, partState.partData);
                
                // Restore transforms
                sprite.setScale(partState.scaleX, partState.scaleY);
                sprite.setAngle(partState.angle);
                sprite.setFlip(partState.flipX, partState.flipY);
                sprite.setDepth(partState.depth);
                
                placedParts.push(sprite);
            }
            
            // Update selected parts display after restoring parts
            await updateSelectedPartsDisplay();
            await updatePartInventoryDisplay();
            updateMonsterValue();
            updateSaveButton();
        }
    } catch (error) {
        console.error('Error loading workspace state:', error);
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
    
    const goldElement = document.getElementById('gold-display');
    if (goldElement) goldElement.textContent = gold - 1000;
    
    showToast('Color Palette unlocked!');
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load gold
    const gold = localStorage.getItem('gold') || '0';
    const goldElement = document.getElementById('gold-display');
    if (goldElement) goldElement.textContent = gold;
    
    // Start Phaser
    game = new Phaser.Game(config);
    
    // Load inventory
    await loadPartInventory();
    await updateSelectedPartsDisplay();
    updateMonsterValue();
});

// Save workspace state when page unloads
window.addEventListener('beforeunload', () => {
    saveWorkspaceState();
});

// Part selection functions
function selectNextPart() {
    if (placedParts.length === 0) return;
    
    let currentIndex = selectedSprites.length > 0 ? placedParts.indexOf(selectedSprites[0]) : -1;
    const nextIndex = (currentIndex + 1) % placedParts.length;
    
    deselectAll();
    const nextSprite = placedParts[nextIndex];
    nextSprite.setSelected(true);
    selectedSprites = [nextSprite];
    scene.events.emit('selectionChanged');
}

function selectPreviousPart() {
    if (placedParts.length === 0) return;
    
    let currentIndex = selectedSprites.length > 0 ? placedParts.indexOf(selectedSprites[0]) : 0;
    const prevIndex = currentIndex === 0 ? placedParts.length - 1 : currentIndex - 1;
    
    deselectAll();
    const prevSprite = placedParts[prevIndex];
    prevSprite.setSelected(true);
    selectedSprites = [prevSprite];
    scene.events.emit('selectionChanged');
}
