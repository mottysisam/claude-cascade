"use strict";
// Configuration Management System
// Centralized configuration for the Aurora-themed extension
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCSSVariables = exports.resetConfig = exports.updateConfig = exports.getFeatures = exports.getPerformance = exports.getTheme = exports.getConfig = void 0;
// Default Aurora Theme Configuration
const auroraTheme = {
    name: 'aurora',
    colors: {
        primary: '#7c3aed',
        primaryGradient: ['#7c3aed', '#a855f7'],
        success: '#10b981',
        successGradient: ['#10b981', '#14b8a6'],
        danger: '#f43f5e',
        dangerGradient: ['#f43f5e', '#ec4899'],
        warning: '#f59e0b',
        warningGradient: ['#f59e0b', '#fb923c'],
        info: '#6366f1',
        infoGradient: ['#6366f1', '#818cf8'],
        glass: {
            background: 'rgba(124, 58, 237, 0.1)',
            blur: 'blur(20px)',
            border: 'rgba(168, 85, 247, 0.3)'
        }
    },
    animations: {
        enabled: true,
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
};
// Default Configuration
const defaultConfig = {
    theme: auroraTheme,
    performance: {
        renderThrottleMs: 200,
        maxHistorySize: 50,
        virtualScrollThreshold: 100,
        lazyLoadDelay: 300,
        cacheEnabled: true,
        cacheDuration: 3600000,
        webWorkerEnabled: true,
        isDevelopmentMode: false
    },
    features: {
        dragAndDrop: true,
        autoSave: true,
        autoSaveInterval: 30000,
        notifications: true,
        soundEffects: false,
        tooltips: true,
        keyboardShortcuts: true,
        aiSuggestions: true,
        collaborationMode: false,
        offlineMode: true
    },
    api: {
        baseUrl: '',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        headers: {
            'Content-Type': 'application/json'
        }
    },
    shortcuts: {
        navigate: {
            dashboard: 'cmd+shift+d',
            phase1: 'cmd+1',
            phase2: 'cmd+2',
            phase3: 'cmd+3',
            analytics: 'cmd+shift+a',
            settings: 'cmd+,'
        },
        actions: {
            createPlan: 'cmd+n',
            search: 'cmd+f',
            refresh: 'cmd+r',
            undo: 'cmd+z',
            redo: 'cmd+shift+z',
            save: 'cmd+s',
            export: 'cmd+e'
        }
    }
};
// Configuration Manager Class
class ConfigurationManager {
    constructor() {
        this.listeners = new Set();
        this.config = this.loadConfig();
    }
    loadConfig() {
        try {
            const saved = localStorage.getItem('claudeCascadeConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                return this.mergeWithDefaults(parsed);
            }
        }
        catch (e) {
            console.warn('Failed to load saved config, using defaults', e);
        }
        return defaultConfig;
    }
    mergeWithDefaults(partial) {
        return {
            theme: { ...defaultConfig.theme, ...partial.theme },
            performance: { ...defaultConfig.performance, ...partial.performance },
            features: { ...defaultConfig.features, ...partial.features },
            api: { ...defaultConfig.api, ...partial.api },
            shortcuts: { ...defaultConfig.shortcuts, ...partial.shortcuts }
        };
    }
    get() {
        return this.config;
    }
    getTheme() {
        return this.config.theme;
    }
    getPerformance() {
        return this.config.performance;
    }
    getFeatures() {
        return this.config.features;
    }
    getApi() {
        return this.config.api;
    }
    getShortcuts() {
        return this.config.shortcuts;
    }
    update(updates) {
        this.config = this.mergeWithDefaults({ ...this.config, ...updates });
        this.save();
        this.notifyListeners();
    }
    updateTheme(theme) {
        this.config.theme = { ...this.config.theme, ...theme };
        this.save();
        this.notifyListeners();
    }
    updatePerformance(performance) {
        this.config.performance = { ...this.config.performance, ...performance };
        this.save();
        this.notifyListeners();
    }
    updateFeatures(features) {
        this.config.features = { ...this.config.features, ...features };
        this.save();
        this.notifyListeners();
    }
    reset() {
        this.config = defaultConfig;
        this.save();
        this.notifyListeners();
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.config));
    }
    save() {
        try {
            localStorage.setItem('claudeCascadeConfig', JSON.stringify(this.config));
        }
        catch (e) {
            console.error('Failed to save config', e);
        }
    }
    // CSS Variable Generation
    generateCSSVariables() {
        const theme = this.config.theme;
        return `
            :root {
                /* Primary Colors */
                --aurora-primary: ${theme.colors.primary};
                --aurora-primary-gradient-start: ${theme.colors.primaryGradient[0]};
                --aurora-primary-gradient-end: ${theme.colors.primaryGradient[1]};
                
                /* Success Colors */
                --aurora-success: ${theme.colors.success};
                --aurora-success-gradient-start: ${theme.colors.successGradient[0]};
                --aurora-success-gradient-end: ${theme.colors.successGradient[1]};
                
                /* Danger Colors */
                --aurora-danger: ${theme.colors.danger};
                --aurora-danger-gradient-start: ${theme.colors.dangerGradient[0]};
                --aurora-danger-gradient-end: ${theme.colors.dangerGradient[1]};
                
                /* Warning Colors */
                --aurora-warning: ${theme.colors.warning};
                --aurora-warning-gradient-start: ${theme.colors.warningGradient[0]};
                --aurora-warning-gradient-end: ${theme.colors.warningGradient[1]};
                
                /* Info Colors */
                --aurora-info: ${theme.colors.info};
                --aurora-info-gradient-start: ${theme.colors.infoGradient[0]};
                --aurora-info-gradient-end: ${theme.colors.infoGradient[1]};
                
                /* Glass Effects */
                --aurora-glass-bg: ${theme.colors.glass.background};
                --aurora-glass-blur: ${theme.colors.glass.blur};
                --aurora-glass-border: ${theme.colors.glass.border};
                
                /* Animations */
                --aurora-animation-duration: ${theme.animations.duration}ms;
                --aurora-animation-easing: ${theme.animations.easing};
            }
        `;
    }
}
// Create singleton instance
const configManager = new ConfigurationManager();
// Export manager and helper functions
exports.default = configManager;
// Helper functions for easy access
function getConfig() { return configManager.get(); }
exports.getConfig = getConfig;
function getTheme() { return configManager.getTheme(); }
exports.getTheme = getTheme;
function getPerformance() { return configManager.getPerformance(); }
exports.getPerformance = getPerformance;
function getFeatures() { return configManager.getFeatures(); }
exports.getFeatures = getFeatures;
function updateConfig(updates) { configManager.update(updates); }
exports.updateConfig = updateConfig;
function resetConfig() { configManager.reset(); }
exports.resetConfig = resetConfig;
function generateCSSVariables() { return configManager.generateCSSVariables(); }
exports.generateCSSVariables = generateCSSVariables;
//# sourceMappingURL=config.js.map