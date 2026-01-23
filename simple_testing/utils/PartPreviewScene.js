// PartPreviewScene - Shared Phaser scene for part rendering in testing tools
class PartPreviewScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PartPreviewScene' });
        this.loadedTextures = new Map();
    }
    
    preload() {
        // Preload will be handled dynamically
    }
    
    create() {
        // Scene created, ready for rendering
    }
    
    async loadBase64Texture(key, base64Data) {
        if (this.loadedTextures.has(key)) {
            return key;
        }
        
        return new Promise((resolve) => {
            this.load.image(key, base64Data);
            this.load.once('complete', () => {
                this.loadedTextures.set(key, true);
                resolve(key);
            });
            this.load.start();
        });
    }
    
    async renderPartToCanvas(base64Data, targetCanvas, width = 90, height = 90) {
        const textureKey = `part_${Date.now()}_${Math.random()}`;
        
        try {
            await this.loadBase64Texture(textureKey, base64Data);
            
            // Create render texture
            const rt = this.add.renderTexture(0, 0, width, height);
            
            // Create sprite and center it
            const sprite = this.add.image(width/2, height/2, textureKey);
            
            // Scale to fit while maintaining aspect ratio
            const scaleX = width / sprite.width;
            const scaleY = height / sprite.height;
            const scale = Math.min(scaleX, scaleY);
            sprite.setScale(scale);
            
            // Draw to render texture
            rt.draw(sprite);
            
            // Get canvas context and draw
            const ctx = targetCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            // Use snapshot to get image data
            rt.snapshot((image) => {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(image, 0, 0);
                
                // Cleanup
                sprite.destroy();
                rt.destroy();
                this.textures.remove(textureKey);
                this.loadedTextures.delete(textureKey);
            });
            
        } catch (error) {
            console.error('Error rendering part:', error);
            // Fallback to canvas rendering
            this.fallbackCanvasRender(base64Data, targetCanvas, width, height);
        }
    }
    
    fallbackCanvasRender(base64Data, targetCanvas, width, height) {
        const ctx = targetCanvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, width, height);
            
            // Scale to fit while maintaining aspect ratio
            const scaleX = width / img.width;
            const scaleY = height / img.height;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (width - scaledWidth) / 2;
            const y = (height - scaledHeight) / 2;
            
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        };
        img.src = base64Data;
    }
}