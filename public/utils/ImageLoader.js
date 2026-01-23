// Image Loader - Convert base64 to Phaser textures
class ImageLoader {
    constructor(scene) {
        this.scene = scene;
        this.textureCache = new Map();
    }

    loadBase64Texture(key, base64Data) {
        if (this.textureCache.has(key)) {
            return Promise.resolve(key);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                if (!this.scene.textures.exists(key)) {
                    this.scene.textures.addImage(key, img);
                }
                this.textureCache.set(key, true);
                resolve(key);
            };
            img.onerror = reject;
            img.src = base64Data;
        });
    }

    async loadMultipleTextures(textures) {
        const promises = textures.map(({ key, data }) => 
            this.loadBase64Texture(key, data)
        );
        return Promise.all(promises);
    }

    hasTexture(key) {
        return this.scene.textures.exists(key);
    }

    clearCache() {
        this.textureCache.clear();
    }
}
