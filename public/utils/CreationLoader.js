// CreationLoader - Load saved creations into workspace
class CreationLoader {
    static async loadIntoWorkspace(creationData, selectedMonsters, imageLoader, scene) {
        const data = JSON.parse(creationData);
        const loadedParts = [];
        const loadedSprites = [];
        
        // Load textures for all parts
        for (const partData of data.placedParts) {
            const textureKey = `loaded_${partData.monster}_${partData.name}_${Date.now()}_${Math.random()}`;
            await imageLoader.loadBase64Texture(textureKey, partData.dataUrl);
            
            // Create part object
            const part = {
                id: partData.id,
                name: partData.name,
                monster: partData.monster,
                dataUrl: partData.dataUrl,
                originalDataUrl: partData.dataUrl,
                x: partData.x,
                y: partData.y,
                width: partData.width,
                height: partData.height,
                originalWidth: partData.originalWidth,
                originalHeight: partData.originalHeight,
                scale: partData.scale,
                rotation: partData.rotation,
                flipHorizontal: partData.flipHorizontal,
                flipVertical: partData.flipVertical
            };
            
            // Create sprite
            const centerX = partData.x + partData.width / 2;
            const centerY = partData.y + partData.height / 2;
            const sprite = new PartSprite(scene, centerX, centerY, textureKey, part);
            sprite.setScale(partData.scale * 5);
            sprite.angle = partData.rotation;
            sprite.flipX = partData.flipHorizontal;
            sprite.flipY = partData.flipVertical;
            sprite.setDepth(loadedSprites.length);
            
            part.sprite = sprite;
            loadedParts.push(part);
            loadedSprites.push(sprite);
        }
        
        return {
            parts: loadedParts,
            sprites: loadedSprites,
            colorMappings: data.colorMappings || {},
            partSpecificMappings: data.partSpecificMappings || {},
            currentPalette: data.currentPalette || 'original'
        };
    }
}
