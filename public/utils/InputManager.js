// InputManager - Unified touch and mouse input handling
class InputManager {
    static setupMobileOptimizations(scene) {
        // Enable touch input
        scene.input.addPointer(2); // Support multi-touch
    }
    
    static isMobile() {
        return window.innerWidth <= 768 || 
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0);
    }
    
    static setupResponsiveCanvas(game) {
        const isMobile = InputManager.isMobile();
        
        if (isMobile) {
            // Scale for mobile
            game.scale.setGameSize(640, 640);
            game.scale.setZoom(0.8);
        }
    }
}
