// Load hatched monsters from localStorage instead of database
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

// Override the selectMonsterFromGrid to work with array indices
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

// Override populateMonsterSelectorGrid for hatched monsters
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

// Override validateModalSelection for array indices
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

// Override confirmMonsterSelection for array indices
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

// Override updateSelectedMonstersDisplay for hatched monsters
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

// Override openMonsterSelector for hatched monsters
function openMonsterSelector(slot) {
    currentSelectorSlot = slot;
    document.getElementById('selector-title').textContent = `Select Hatched Monster ${slot}`;
    document.getElementById('monster-selector-modal').style.display = 'block';
    populateMonsterSelectorGrid();
}

// Remove seedDatabase call from initialization
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