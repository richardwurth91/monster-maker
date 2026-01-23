// TransformManager - Handle scale, rotate, flip operations
class TransformManager {
    constructor(scene) {
        this.scene = scene;
    }
    
    adjustScale(sprites, increment) {
        sprites.forEach(sprite => {
            const currentScale = sprite.scaleX / 5;
            const newScale = Math.max(0.25, Math.min(2, currentScale + increment));
            sprite.setScale(newScale * 5);
            sprite.updatePartData();
            sprite.updateSelectionBorder();
        });
    }
    
    resetScale(sprites) {
        sprites.forEach(sprite => {
            sprite.setScale(5);
            sprite.updatePartData();
            sprite.updateSelectionBorder();
        });
    }
    
    rotate(sprites, degrees) {
        sprites.forEach(sprite => {
            sprite.angle = (sprite.angle + degrees) % 360;
            sprite.updatePartData();
            sprite.updateSelectionBorder();
        });
    }
    
    flip(sprites, direction) {
        sprites.forEach(sprite => {
            if (direction === 'horizontal') {
                sprite.flipX = !sprite.flipX;
            } else if (direction === 'vertical') {
                sprite.flipY = !sprite.flipY;
            }
            
            console.log('Flipped sprite - no interactive changes');
            
            sprite.updatePartData();
            sprite.updateSelectionBorder();
        });
    }
    
    // Keep static methods for backward compatibility
    static applyScale(sprites, increment) {
        sprites.forEach(sprite => {
            const currentScale = sprite.scaleX / 5;
            const newScale = Math.max(0.25, Math.min(2, currentScale + increment));
            sprite.setScale(newScale * 5);
            sprite.updatePartData();
        });
    }
    
    static resetScale(sprites) {
        sprites.forEach(sprite => {
            sprite.setScale(5);
            sprite.updatePartData();
        });
    }
    
    static rotate(sprites, degrees) {
        sprites.forEach(sprite => {
            sprite.angle = (sprite.angle + degrees) % 360;
            sprite.updatePartData();
        });
    }
    
    static flip(sprites, direction) {
        sprites.forEach(sprite => {
            if (direction === 'horizontal') {
                sprite.flipX = !sprite.flipX;
            } else if (direction === 'vertical') {
                sprite.flipY = !sprite.flipY;
            }
            sprite.updatePartData();
        });
    }
}
