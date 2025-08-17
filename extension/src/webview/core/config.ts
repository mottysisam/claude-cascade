// Configuration Management System
// Centralized configuration for the Aurora-themed extension

export interface ExtensionConfig {
    theme: ThemeConfig;
    performance: PerformanceConfig;
    features: FeatureConfig;
    api: ApiConfig;
    shortcuts: ShortcutConfig;
}

export interface ThemeConfig {
    name: 'aurora' | 'dark' | 'light' | 'custom';
    colors: {
        primary: string;
        primaryGradient: [string, string];
        success: string;
        successGradient: [string, string];
        danger: string;
        dangerGradient: [string, string];
        warning: string;
        warningGradient: [string, string];
        info: string;
        infoGradient: [string, string];
        glass: {
            background: string;
            blur: string;
            border: string;
        };
    };
    animations: {
        enabled: boolean;
        duration: number;
        easing: string;
    };
}

export interface PerformanceConfig {
    renderThrottleMs: number;
    maxHistorySize: number;
    virtualScrollThreshold: number;
    lazyLoadDelay: number;
    cacheEnabled: boolean;
    cacheDuration: number;
    webWorkerEnabled: boolean;
    isDevelopmentMode: boolean;
}

export interface FeatureConfig {
    dragAndDrop: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
    notifications: boolean;
    soundEffects: boolean;
    tooltips: boolean;
    keyboardShortcuts: boolean;
    aiSuggestions: boolean;
    collaborationMode: boolean;
    offlineMode: boolean;
}

export interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    headers: Record<string, string>;
}

export interface ShortcutConfig {
    navigate: {
        dashboard: string;
        phase1: string;
        phase2: string;
        phase3: string;
        analytics: string;
        settings: string;
    };
    actions: {
        createPlan: string;
        search: string;
        refresh: string;
        undo: string;
        redo: string;
        save: string;
        export: string;
    };
}

// Default Aurora Theme Configuration
const auroraTheme: ThemeConfig = {
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
const defaultConfig: ExtensionConfig = {
    theme: auroraTheme,
    performance: {
        renderThrottleMs: 200,
        maxHistorySize: 50,
        virtualScrollThreshold: 100,
        lazyLoadDelay: 300,
        cacheEnabled: true,
        cacheDuration: 3600000, // 1 hour
        webWorkerEnabled: true,
        isDevelopmentMode: false
    },
    features: {
        dragAndDrop: true,
        autoSave: true,
        autoSaveInterval: 30000, // 30 seconds
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
    private config: ExtensionConfig;
    private listeners: Set<(config: ExtensionConfig) => void> = new Set();

    constructor() {
        this.config = this.loadConfig();
    }

    private loadConfig(): ExtensionConfig {
        try {
            const saved = localStorage.getItem('claudeCascadeConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                return this.mergeWithDefaults(parsed);
            }
        } catch (e) {
            console.warn('Failed to load saved config, using defaults', e);
        }
        return defaultConfig;
    }

    private mergeWithDefaults(partial: Partial<ExtensionConfig>): ExtensionConfig {
        return {
            theme: { ...defaultConfig.theme, ...partial.theme },
            performance: { ...defaultConfig.performance, ...partial.performance },
            features: { ...defaultConfig.features, ...partial.features },
            api: { ...defaultConfig.api, ...partial.api },
            shortcuts: { ...defaultConfig.shortcuts, ...partial.shortcuts }
        };
    }

    get(): ExtensionConfig {
        return this.config;
    }

    getTheme(): ThemeConfig {
        return this.config.theme;
    }

    getPerformance(): PerformanceConfig {
        return this.config.performance;
    }

    getFeatures(): FeatureConfig {
        return this.config.features;
    }

    getApi(): ApiConfig {
        return this.config.api;
    }

    getShortcuts(): ShortcutConfig {
        return this.config.shortcuts;
    }

    update(updates: Partial<ExtensionConfig>): void {
        this.config = this.mergeWithDefaults({ ...this.config, ...updates });
        this.save();
        this.notifyListeners();
    }

    updateTheme(theme: Partial<ThemeConfig>): void {
        this.config.theme = { ...this.config.theme, ...theme };
        this.save();
        this.notifyListeners();
    }

    updatePerformance(performance: Partial<PerformanceConfig>): void {
        this.config.performance = { ...this.config.performance, ...performance };
        this.save();
        this.notifyListeners();
    }

    updateFeatures(features: Partial<FeatureConfig>): void {
        this.config.features = { ...this.config.features, ...features };
        this.save();
        this.notifyListeners();
    }

    reset(): void {
        this.config = defaultConfig;
        this.save();
        this.notifyListeners();
    }

    subscribe(listener: (config: ExtensionConfig) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.config));
    }

    private save(): void {
        try {
            localStorage.setItem('claudeCascadeConfig', JSON.stringify(this.config));
        } catch (e) {
            console.error('Failed to save config', e);
        }
    }

    // CSS Variable Generation
    generateCSSVariables(): string {
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
export default configManager;

// Helper functions for easy access
export function getConfig() { return configManager.get(); }
export function getTheme() { return configManager.getTheme(); }
export function getPerformance() { return configManager.getPerformance(); }
export function getFeatures() { return configManager.getFeatures(); }
export function updateConfig(updates: Partial<ExtensionConfig>) { configManager.update(updates); }
export function resetConfig() { configManager.reset(); }
export function generateCSSVariables() { return configManager.generateCSSVariables(); }