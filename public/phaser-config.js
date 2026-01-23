// Phaser Game Configuration
let imageLoader;
let phaserScene;
let phaserSprites = [];
let selectedSprites = [];

const phaserConfig = {
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
};

let game;
let graphics;

function preload() {
    // Assets will be loaded dynamically
}

function create() {
    phaserScene = this;
    
    // Initialize image loader
    imageLoader = new ImageLoader(this);
    
    // Setup mobile optimizations
    InputManager.setupMobileOptimizations(this);
    
    // Draw grid
    graphics = this.add.graphics();
    drawGrid(this);
    
    // Click on empty space to deselect
    this.input.on('pointerdown', (pointer, currentlyOver) => {
        if (currentlyOver.length === 0) {
            selectedSprites = [];
            selectedParts = [];
            selectedPart = null;
            updateSpriteSelection();
        }
    });
    
    // Setup selection events
    this.events.on('part-select', (sprite) => {
        selectedSprites = [sprite];
        updateSpriteSelection();
    });
    
    this.events.on('part-shift-click', (sprite) => {
        if (selectedSprites.includes(sprite)) {
            selectedSprites = selectedSprites.filter(s => s !== sprite);
        } else {
            selectedSprites.push(sprite);
        }
        updateSpriteSelection();
    });
    
    // Enable drag input with throttling for performance
    const throttledDrag = PerformanceManager.throttle((pointer, gameObject, dragX, dragY) => {
        if (selectedSprites.length > 1 && selectedSprites.includes(gameObject)) {
            if (!gameObject.dragStartX) {
                gameObject.dragStartX = gameObject.x;
                gameObject.dragStartY = gameObject.y;
            }
            
            const deltaX = Math.round(dragX / 5) * 5 - gameObject.dragStartX;
            const deltaY = Math.round(dragY / 5) * 5 - gameObject.dragStartY;
            
            selectedSprites.forEach(sprite => {
                if (sprite !== gameObject) {
                    sprite.x = Math.round((sprite.x + deltaX) / 5) * 5;
                    sprite.y = Math.round((sprite.y + deltaY) / 5) * 5;
                }
            });
            
            gameObject.dragStartX = Math.round(dragX / 5) * 5;
            gameObject.dragStartY = Math.round(dragY / 5) * 5;
        }
    }, 16);
    
    this.input.on('drag', throttledDrag);
    
    this.input.on('dragend', (pointer, gameObject) => {
        gameObject.dragStartX = null;
        gameObject.dragStartY = null;
        syncPhaserToPlacedParts();
    });
}

function update() {
    // Game loop
}

function drawGrid(scene) {
    graphics.clear();
    graphics.lineStyle(1, 0xe0e0e0, 1);
    
    for (let i = 0; i <= 640; i += 10) {
        graphics.lineBetween(i, 0, i, 640);
        graphics.lineBetween(0, i, 640, i);
    }
}

function initPhaser() {
    game = new Phaser.Game(phaserConfig);
    
    // Setup responsive canvas after game creation
    game.events.once('ready', () => {
        InputManager.setupResponsiveCanvas(game);
    });
}

// Add part sprite to Phaser workspace
function addPhaserPart(textureKey, x, y, partData) {
    if (!phaserScene || !imageLoader.hasTexture(textureKey)) return;
    
    const sprite = new PartSprite(phaserScene, x, y, textureKey, partData);
    sprite.setDepth(phaserSprites.length);
    phaserSprites.push(sprite);
    
    return sprite;
}

function updateSpriteSelection() {
    phaserSprites.forEach(sprite => {
        sprite.setSelected(selectedSprites.includes(sprite));
    });
    
    // Update placedParts selection
    selectedParts = selectedSprites.map(s => s.partData);
    selectedPart = selectedParts[0] || null;
    updateLayersList();
}

function syncPhaserToPlacedParts() {
    phaserSprites.forEach(sprite => {
        sprite.updatePartData();
    });
    
    // Sync placedParts order with phaserSprites order
    placedParts.sort((a, b) => {
        const aIndex = phaserSprites.indexOf(a.sprite);
        const bIndex = phaserSprites.indexOf(b.sprite);
        return aIndex - bIndex;
    });
    
    updateLayersList();
}
