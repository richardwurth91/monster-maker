// LayerManager - Handle depth/z-index operations
class LayerManager {
    static moveUp(sprites, allSprites) {
        // Sort by current depth (highest first)
        const sorted = sprites
            .map(sprite => ({ sprite, depth: allSprites.indexOf(sprite) }))
            .sort((a, b) => b.depth - a.depth);
        
        sorted.forEach(({ sprite, depth }) => {
            const currentIndex = allSprites.indexOf(sprite);
            if (currentIndex < allSprites.length - 1) {
                allSprites.splice(currentIndex, 1);
                allSprites.splice(currentIndex + 1, 0, sprite);
            }
        });
        
        LayerManager.updateDepths(allSprites);
    }
    
    static moveDown(sprites, allSprites) {
        // Sort by current depth (lowest first)
        const sorted = sprites
            .map(sprite => ({ sprite, depth: allSprites.indexOf(sprite) }))
            .sort((a, b) => a.depth - b.depth);
        
        sorted.forEach(({ sprite, depth }) => {
            const currentIndex = allSprites.indexOf(sprite);
            if (currentIndex > 0) {
                allSprites.splice(currentIndex, 1);
                allSprites.splice(currentIndex - 1, 0, sprite);
            }
        });
        
        LayerManager.updateDepths(allSprites);
    }
    
    static updateDepths(sprites) {
        sprites.forEach((sprite, index) => {
            sprite.setDepth(index);
        });
    }
}
