// ExportManager - Handle workspace rendering and export
class ExportManager {
    static async captureWorkspace(scene, sprites) {
        if (sprites.length === 0) return null;
        
        // Find bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        sprites.forEach(sprite => {
            const bounds = sprite.getBounds();
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        });
        
        const width = Math.ceil(maxX - minX);
        const height = Math.ceil(maxY - minY);
        
        // Create render texture
        const rt = scene.add.renderTexture(0, 0, width, height);
        
        // Draw all sprites in reverse order (back to front)
        [...sprites].reverse().forEach(sprite => {
            rt.draw(sprite, sprite.x - minX, sprite.y - minY);
        });
        
        // Get image data using snapshot
        return new Promise((resolve) => {
            rt.snapshot((image) => {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                const imageData = canvas.toDataURL('image/png');
                rt.destroy();
                resolve(imageData);
            });
        });
    }
    
    static async exportToPNG(scene, sprites, filename) {
        const imageData = await ExportManager.captureWorkspace(scene, sprites);
        if (!imageData) {
            alert('No parts to export!');
            return;
        }
        
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = imageData;
        link.click();
    }
}
