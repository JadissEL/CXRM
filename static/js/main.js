/**
 * Main Entry Point - Quadriga Interview Flow v2.1
 */

console.log('🚀 Quadriga Interview Flow v2.1 Loaded');

// Global State
window.AppState = {
    theme: localStorage.getItem('theme') || 'light',
    autoSaveInterval: null,
    currentAnalysis: null,
    formData: {}
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Initializing application...');

    // Initialize all modules
    if (typeof UIComponents !== 'undefined') UIComponents.init();
    if (typeof CVAnalyzer !== 'undefined') CVAnalyzer.init();
    if (typeof FormManager !== 'undefined') FormManager.init();
    if (typeof ScoringManager !== 'undefined') ScoringManager.init();

    // Initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    console.log('✅ Application ready!');

    if (typeof UIComponents !== 'undefined') {
        UIComponents.showToast('Welcome to Quadriga Interview Flow 2.1', 'info');
    }
});

// Cleanup on Unload
window.addEventListener('beforeunload', () => {
    if (window.AppState.autoSaveInterval) {
        clearInterval(window.AppState.autoSaveInterval);
    }
    if (typeof FormManager !== 'undefined') {
        FormManager.save();
    }
});
