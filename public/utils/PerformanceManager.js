// Performance optimization utilities
class PerformanceManager {
    // Texture cleanup - remove unused textures
    static cleanupTextures(scene, activeKeys) {
        const textures = scene.textures;
        const allKeys = textures.getTextureKeys();
        
        allKeys.forEach(key => {
            if (key !== '__DEFAULT' && key !== '__MISSING' && !activeKeys.includes(key)) {
                textures.remove(key);
            }
        });
    }
    
    // Get active texture keys from sprites
    static getActiveTextureKeys(sprites) {
        return sprites.map(sprite => sprite.texture.key);
    }
    
    // Optimize scene rendering
    static optimizeScene(scene) {
        // Enable batch rendering for better performance
        scene.renderer.pipelines.add('TextureTintPipeline', 
            new Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline({ game: scene.game }));
    }
    
    // Debounce function for expensive operations
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle function for frequent events
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}
