// ColorPalette - Extract and apply color palettes
class ColorPalette {
    static async extractFromImage(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = data.data;
                const colors = new Set();
                
                for (let i = 0; i < pixels.length; i += 4) {
                    const alpha = pixels[i + 3];
                    if (alpha > 0) {
                        const r = pixels[i];
                        const g = pixels[i + 1];
                        const b = pixels[i + 2];
                        colors.add(`${r},${g},${b}`);
                    }
                }
                
                resolve(Array.from(colors).map(c => c.split(',').map(Number)));
            };
            img.src = imageData;
        });
    }
    
    static findClosest(color, palette) {
        let minDistance = Infinity;
        let closestColor = color;
        
        for (const paletteColor of palette) {
            const distance = Math.sqrt(
                Math.pow(color[0] - paletteColor[0], 2) +
                Math.pow(color[1] - paletteColor[1], 2) +
                Math.pow(color[2] - paletteColor[2], 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = paletteColor;
            }
        }
        
        return closestColor;
    }
    
    static async applyPalette(imageData, targetPalette, sourcePalette, mappings = {}) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = data.data;
                
                for (let i = 0; i < pixels.length; i += 4) {
                    const alpha = pixels[i + 3];
                    if (alpha > 0) {
                        const originalColor = [pixels[i], pixels[i + 1], pixels[i + 2]];
                        const closestSource = ColorPalette.findClosest(originalColor, sourcePalette);
                        const colorKey = closestSource.join(',');
                        
                        let targetColor;
                        if (mappings[colorKey]) {
                            targetColor = mappings[colorKey];
                        } else {
                            targetColor = ColorPalette.findClosest(closestSource, targetPalette);
                        }
                        
                        pixels[i] = targetColor[0];
                        pixels[i + 1] = targetColor[1];
                        pixels[i + 2] = targetColor[2];
                    }
                }
                
                ctx.putImageData(data, 0, 0);
                resolve(canvas.toDataURL());
            };
            img.src = imageData;
        });
    }
}
