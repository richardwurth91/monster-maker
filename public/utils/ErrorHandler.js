// Error handling and user feedback utilities
class ErrorHandler {
    // Handle image loading errors
    static handleImageLoadError(imageName, error) {
        console.error(`Failed to load image: ${imageName}`, error);
        alert(`Error loading image: ${imageName}. Please try again.`);
    }
    
    // Handle save errors
    static handleSaveError(error) {
        console.error('Save error:', error);
        alert('Failed to save creation. Please check your connection and try again.');
    }
    
    // Handle export errors
    static handleExportError(error) {
        console.error('Export error:', error);
        alert('Failed to export image. Please try again.');
    }
    
    // Handle texture errors
    static handleTextureError(textureKey, error) {
        console.error(`Texture error for ${textureKey}:`, error);
        return false;
    }
    
    // Validate part data before adding
    static validatePartData(partData) {
        if (!partData || !partData.name || !partData.monster) {
            console.error('Invalid part data:', partData);
            return false;
        }
        return true;
    }
    
    // Safe JSON parse
    static safeJSONParse(jsonString, fallback = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('JSON parse error:', error);
            return fallback;
        }
    }
}
