// PartSprite - Custom sprite class for monster parts
class PartSprite extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, partData) {
        super(scene, x, y, texture);
        
        this.partData = partData;
        this.selected = false;
        
        // Set initial properties
        this.setScale(5);
        this.setOrigin(0.5, 0.5);
        
        // Enable input with pixel-perfect hitbox
        this.setInteractive({ 
            draggable: true,
            pixelPerfect: true,
            alphaTolerance: 1
        });
        
        // Create selection border graphics
        this.selectionBorder = scene.add.graphics();
        this.selectionBorder.setDepth(-1);
        this.selectionBorder.setVisible(false);
        
        // Add to scene
        scene.add.existing(this);
        
        // Setup drag events
        this.setupDragEvents();
    }
    
    setupDragEvents() {
        let dragStartPositions = [];
        let myStartX = 0;
        let myStartY = 0;
        
        this.on('dragstart', (pointer) => {
            myStartX = this.x;
            myStartY = this.y;
            dragStartPositions = [];
            
            // Only move multiple sprites if this sprite is currently selected
            if (this.selected && this.scene.selectedSprites && this.scene.selectedSprites.includes(this) && this.scene.selectedSprites.length > 1) {
                dragStartPositions = this.scene.selectedSprites.map(sprite => ({
                    sprite: sprite,
                    startX: sprite.x,
                    startY: sprite.y
                }));
            }
        });
        
        this.on('drag', (pointer, dragX, dragY) => {
            // Snap to 5px grid
            const snappedX = Math.round(dragX / 5) * 5;
            const snappedY = Math.round(dragY / 5) * 5;
            
            // If multiple sprites selected, move them all together
            if (dragStartPositions.length > 1) {
                const deltaX = snappedX - myStartX;
                const deltaY = snappedY - myStartY;
                
                dragStartPositions.forEach(({sprite, startX, startY}) => {
                    sprite.x = Math.round((startX + deltaX) / 5) * 5;
                    sprite.y = Math.round((startY + deltaY) / 5) * 5;
                    sprite.updateSelectionBorder();
                });
            } else {
                this.x = snappedX;
                this.y = snappedY;
                this.updateSelectionBorder();
            }
        });
        
        this.on('pointerdown', (pointer) => {
            // Don't change selection on drag start if already selected
            if (this.selected && !pointer.event.shiftKey) {
                return;
            }
            
            if (pointer.event.shiftKey) {
                // Multi-select
                this.scene.events.emit('part-shift-click', this);
            } else {
                this.scene.events.emit('part-select', this);
            }
        });
    }
    
    setSelected(selected) {
        this.selected = selected;
        
        // Show/hide border instead of tint
        if (selected) {
            this.updateSelectionBorder();
            this.selectionBorder.setVisible(true);
            // Set border depth just below this sprite
            this.selectionBorder.setDepth(this.depth - 0.5);
        } else {
            this.selectionBorder.setVisible(false);
        }
    }
    
    updateSelectionBorder() {
        if (!this.selected) return;
        
        this.selectionBorder.clear();
        this.selectionBorder.fillStyle(0xff0000, 1);
        
        // Apply same transforms as the sprite
        this.selectionBorder.setPosition(this.x, this.y);
        this.selectionBorder.setRotation(Phaser.Math.DegToRad(this.angle));
        this.selectionBorder.setScale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
        
        const texture = this.texture;
        const frame = this.frame;
        const canvas = texture.getSourceImage();
        
        if (canvas && canvas.width && canvas.height) {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = frame.width;
            tempCanvas.height = frame.height;
            
            tempCtx.drawImage(canvas, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);
            const imageData = tempCtx.getImageData(0, 0, frame.width, frame.height);
            const data = imageData.data;
            
            const scale = this.scaleX;
            const offsetX = -(frame.width * scale / 2);
            const offsetY = -(frame.height * scale / 2);
            const expandBy = 5;
            
            // Fill all visible pixels plus 5px expansion
            for (let y = 0; y < frame.height; y++) {
                for (let x = 0; x < frame.width; x++) {
                    const i = (y * frame.width + x) * 4;
                    const alpha = data[i + 3];
                    
                    if (alpha > 0) {
                        this.selectionBorder.fillRect(
                            offsetX + x * scale - expandBy,
                            offsetY + y * scale - expandBy,
                            scale + expandBy * 2,
                            scale + expandBy * 2
                        );
                    }
                }
            }
        }
    }
    
    updatePartData() {
        this.partData.x = this.x - (this.displayWidth / 2);
        this.partData.y = this.y - (this.displayHeight / 2);
        this.partData.width = this.displayWidth;
        this.partData.height = this.displayHeight;
        this.partData.scale = this.scaleX / 5;
        this.partData.rotation = this.angle;
        this.partData.flipHorizontal = this.flipX;
        this.partData.flipVertical = this.flipY;
    }
    
    getExportData() {
        this.updatePartData();
        return {
            name: this.partData.name,
            monster: this.partData.monster,
            x: this.partData.x,
            y: this.partData.y,
            width: this.partData.width,
            height: this.partData.height,
            scale: this.partData.scale,
            rotation: this.partData.rotation,
            flipHorizontal: this.partData.flipHorizontal,
            flipVertical: this.partData.flipVertical,
            dataUrl: this.texture.getSourceImage().src
        };
    }
}
