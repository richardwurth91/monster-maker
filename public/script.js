let monsters = [];
let selectedMonsters = { 1: null, 2: null };
let availableParts = [];
let workspace = null;
let ctx = null;
let placedParts = [];
let selectedPart = null;
let isDragging = false;
let selectedLayerIndex = -1;
let animationFrameId = null;
let imageCache = new Map();

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
    
    await seedDatabase(); // Auto-seed database on load
    await loadMonsters();
    setupWorkspace();
    loadGallery();
    openMonsterModal(); // Show modal on page load
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
        const response = await fetch('/api/monsters');
        monsters = await response.json();
        
        const selects = [
            document.getElementById('monster1'), 
            document.getElementById('monster2'),
            document.getElementById('modal-monster1'),
            document.getElementById('modal-monster2')
        ];
        
        selects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Choose a monster...</option>';
                monsters.forEach(monster => {
                    const option = document.createElement('option');
                    option.value = monster.id;
                    option.textContent = monster.name;
                    select.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error loading monsters:', error);
    }
}

// Load selected monster
function loadMonster(slot) {
    const selectId = `monster${slot}`;
    const previewId = `monster${slot}-preview`;
    const monsterId = document.getElementById(selectId).value;
    
    if (!monsterId) {
        selectedMonsters[slot] = null;
        document.getElementById(previewId).innerHTML = '';
        updateAvailableParts();
        return;
    }
    
    const monster = monsters.find(m => m.id == monsterId);
    if (monster) {
        selectedMonsters[slot] = monster;
        
        // Show preview
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
    const monsterCounts = {};
    
    placedParts.forEach(part => {
        const key = `${part.name}_${part.monster || ''}`;
        counts[part.name] = (counts[part.name] || 0) + 1;
        monsterCounts[key] = (monsterCounts[key] || 0) + 1;
    });
    
    // Torso: only 1 total (from either monster)
    if (partName === 'torso') {
        return (counts['torso'] || 0) < 1;
    }
    
    // Other parts: 1 per monster (so 2 total max)
    const monsterKey = `${partName}_${monsterName}`;
    return (monsterCounts[monsterKey] || 0) < 1;
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
            
            Object.entries(parts).forEach(async ([partName, partData]) => {
                const croppedData = await autoCropImage(partData);
                
                availableParts.push({ name: partName, data: croppedData, monster: monster.name });
                
                const partDiv = document.createElement('div');
                partDiv.className = 'part-item';
                partDiv.title = `${partName}`;
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
            x: x,
            y: y,
            width: img.width * 10,
            height: img.height * 10,
            originalWidth: img.width * 10,
            originalHeight: img.height * 10,
            scale: 1,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false
        };
        
        placedParts.push(part);
        
        // Auto-select the newly added part
        selectedPart = part;
        selectedLayerIndex = placedParts.length - 1;
        
        redrawWorkspace();
        updateLayersList();
        updateAvailableParts(); // Refresh parts list to update limits
    };
    img.src = partDataUrl;
}

// Redraw entire workspace
function redrawWorkspace() {
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
    
    // Draw all parts using cached images
    placedParts.forEach(part => {
        let img = imageCache.get(part.dataUrl);
        if (!img) {
            img = new Image();
            img.src = part.dataUrl;
            imageCache.set(part.dataUrl, img);
        }
        
        if (img.complete) {
            ctx.save();
            
            const centerX = part.x + part.width / 2;
            const centerY = part.y + part.height / 2;
            
            // Move to center for transformations
            ctx.translate(centerX, centerY);
            
            // Apply flips
            if (part.flipHorizontal || part.flipVertical) {
                ctx.scale(
                    part.flipHorizontal ? -1 : 1,
                    part.flipVertical ? -1 : 1
                );
            }
            
            // Apply rotation
            if (part.rotation) {
                ctx.rotate(part.rotation * Math.PI / 180);
            }
            
            // Draw image centered
            ctx.drawImage(img, -part.width / 2, -part.height / 2, part.width, part.height);
            
            ctx.restore();
            
            // Highlight selected part (after restore to avoid transformation)
            if (selectedPart && selectedPart.id === part.id) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.strokeRect(part.x, part.y, part.width, part.height);
            }
        }
    });
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
    // Adjust coordinates for mobile scaling
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        x *= 2; // Scale up coordinates to match canvas size
        y *= 2;
    }
    
    let partFound = false;
    
    // Find clicked/touched part (check from top to bottom)
    for (let i = placedParts.length - 1; i >= 0; i--) {
        const part = placedParts[i];
        if (x >= part.x && x <= part.x + part.width &&
            y >= part.y && y <= part.y + part.height) {
            selectedPart = part;
            selectedLayerIndex = i;
            isDragging = true;
            partFound = true;
            redrawWorkspace();
            updateLayersList();
            break;
        }
    }
    
    // If no part was clicked/touched, deselect
    if (!partFound) {
        selectedPart = null;
        selectedLayerIndex = -1;
        redrawWorkspace();
        updateLayersList();
    }
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
    // Adjust coordinates for mobile scaling
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        x *= 2; // Scale up coordinates to match canvas size
        y *= 2;
    }
    
    // Center piece on pointer and snap to grid
    const newX = Math.floor((x - selectedPart.width / 2) / 10) * 10;
    const newY = Math.floor((y - selectedPart.height / 2) / 10) * 10;
    
    // Only redraw if position actually changed
    if (newX !== selectedPart.x || newY !== selectedPart.y) {
        selectedPart.x = newX;
        selectedPart.y = newY;
        
        // Throttle redraws with requestAnimationFrame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(redrawWorkspace);
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
    if (!selectedPart) return;
    
    // Only handle arrow keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    
    // Prevent default scrolling behavior
    e.preventDefault();
    
    // Move by 10px (1 grid space)
    switch (e.key) {
        case 'ArrowUp':
            selectedPart.y = Math.max(0, selectedPart.y - 10);
            break;
        case 'ArrowDown':
            selectedPart.y = Math.min(640 - selectedPart.height, selectedPart.y + 10);
            break;
        case 'ArrowLeft':
            selectedPart.x = Math.max(0, selectedPart.x - 10);
            break;
        case 'ArrowRight':
            selectedPart.x = Math.min(640 - selectedPart.width, selectedPart.x + 10);
            break;
    }
    
    redrawWorkspace();
}

// Clear workspace
function clearWorkspace() {
    placedParts = [];
    selectedPart = null;
    selectedLayerIndex = -1;
    drawGrid();
    updateLayersList();
    updateAvailableParts(); // Refresh parts list to make all parts available again
}

// Save creation
async function saveCreation() {
    const name = document.getElementById('monster-name').value.trim();
    if (!name) {
        alert('Please enter a monster name');
        return;
    }
    
    const spriteData = workspace.toDataURL();
    const parentMonsters = Object.values(selectedMonsters)
        .filter(m => m)
        .map(m => m.name);
    
    try {
        const response = await fetch('/api/creations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                sprite: spriteData,
                parentMonsters
            })
        });
        
        if (response.ok) {
            alert('Monster saved successfully!');
            document.getElementById('monster-name').value = '';
            closeSaveModal();
            clearWorkspace();
            loadGallery();
        }
    } catch (error) {
        console.error('Error saving creation:', error);
        alert('Error saving monster');
    }
}

let allCreations = [];

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
            itemCtx.drawImage(img, 0, 0, 128, 128);
        };
        img.src = creation.sprite;
        
        const name = document.createElement('h4');
        name.textContent = creation.name;
        
        const parents = document.createElement('p');
        const parentList = JSON.parse(creation.parent_monsters);
        parents.textContent = `Made from: ${parentList.join(', ')}`;
        
        item.appendChild(canvas);
        item.appendChild(name);
        item.appendChild(parents);
        gallery.appendChild(item);
    });
}

// Filter gallery by monster name
function filterGallery() {
    const filterText = document.getElementById('gallery-filter').value.toLowerCase();
    
    const filtered = allCreations.filter(creation => {
        const parentList = JSON.parse(creation.parent_monsters);
        return parentList.some(parent => parent.toLowerCase().includes(filterText));
    });
    
    displayGallery(filtered);
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
        if (i === selectedLayerIndex) {
            layerItem.classList.add('selected');
        }
        layerItem.textContent = `${placedParts.length - i}. ${part.name}`;
        layerItem.onclick = () => selectLayer(i);
        layersList.appendChild(layerItem);
    }
}

// Select layer
function selectLayer(index) {
    selectedLayerIndex = index;
    selectedPart = placedParts[index];
    redrawWorkspace();
    updateLayersList();
}

// Move layer up (toward front)
function moveLayerUp() {
    if (selectedLayerIndex < placedParts.length - 1 && selectedLayerIndex >= 0) {
        const temp = placedParts[selectedLayerIndex];
        placedParts[selectedLayerIndex] = placedParts[selectedLayerIndex + 1];
        placedParts[selectedLayerIndex + 1] = temp;
        selectedLayerIndex++;
        redrawWorkspace();
        updateLayersList();
    }
}

// Move layer down (toward back)
function moveLayerDown() {
    if (selectedLayerIndex > 0) {
        const temp = placedParts[selectedLayerIndex];
        placedParts[selectedLayerIndex] = placedParts[selectedLayerIndex - 1];
        placedParts[selectedLayerIndex - 1] = temp;
        selectedLayerIndex--;
        redrawWorkspace();
        updateLayersList();
    }
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
    if (selectedPart) {
        const newScale = Math.max(0.25, Math.min(2, selectedPart.scale + increment));
        selectedPart.scale = newScale;
        selectedPart.width = selectedPart.originalWidth * newScale;
        selectedPart.height = selectedPart.originalHeight * newScale;
        redrawWorkspace();
    }
}

// Reset scale to 1x
function resetScale() {
    if (selectedPart) {
        selectedPart.scale = 1;
        selectedPart.width = selectedPart.originalWidth;
        selectedPart.height = selectedPart.originalHeight;
        redrawWorkspace();
    }
}

// Rotate selected part
function rotateSelectedPart(degrees) {
    if (selectedPart) {
        selectedPart.rotation = (selectedPart.rotation + degrees + 360) % 360;
        redrawWorkspace();
    }
}

// Flip selected part
function flipSelectedPart(direction) {
    if (selectedPart) {
        if (direction === 'horizontal') {
            selectedPart.flipHorizontal = !selectedPart.flipHorizontal;
        } else if (direction === 'vertical') {
            selectedPart.flipVertical = !selectedPart.flipVertical;
        }
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
    if (selectedLayerIndex >= 0) {
        placedParts.splice(selectedLayerIndex, 1);
        selectedPart = null;
        selectedLayerIndex = -1;
        redrawWorkspace();
        updateLayersList();
        updateAvailableParts(); // Refresh parts list to make removed part available again
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

function updateModalPreview(slot) {
    const selectId = `modal-monster${slot}`;
    const previewId = `modal-preview${slot}`;
    const monsterId = document.getElementById(selectId).value;
    
    const preview = document.getElementById(previewId);
    
    if (!monsterId) {
        preview.innerHTML = 'No monster selected';
        validateModalSelection();
        return;
    }
    
    const monster = monsters.find(m => m.id == monsterId);
    if (monster) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const previewCtx = canvas.getContext('2d');
            previewCtx.imageSmoothingEnabled = false;
            previewCtx.drawImage(img, 0, 0, 128, 128);
            preview.innerHTML = '';
            preview.appendChild(canvas);
        };
        img.src = monster.sprite;
    }
    
    validateModalSelection();
}

function validateModalSelection() {
    const monster1Id = document.getElementById('modal-monster1').value;
    const monster2Id = document.getElementById('modal-monster2').value;
    const confirmBtn = document.getElementById('confirm-btn');
    
    // Enable button only if both monsters are selected and they're different
    const isValid = monster1Id && monster2Id && monster1Id !== monster2Id;
    confirmBtn.disabled = !isValid;
    
    if (monster1Id && monster2Id && monster1Id === monster2Id) {
        confirmBtn.textContent = 'Please select different monsters';
    } else {
        confirmBtn.textContent = 'Start Creating';
    }
}

function confirmMonsterSelection() {
    const monster1Id = document.getElementById('modal-monster1').value;
    const monster2Id = document.getElementById('modal-monster2').value;
    
    // Set the hidden dropdowns
    document.getElementById('monster1').value = monster1Id;
    document.getElementById('monster2').value = monster2Id;
    
    // Load the monsters
    loadMonster(1);
    loadMonster(2);
    
    // Update selected monsters display
    updateSelectedMonstersDisplay();
    
    // Close modal
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
function toggleMobileSection(sectionName) {
    const content = document.getElementById(`${sectionName}-content`);
    const header = event.target;
    
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
    }
}



// Update window resize handler
window.addEventListener('resize', () => {
    setupMobileCanvas();
    initializeMobileFeatures();
});