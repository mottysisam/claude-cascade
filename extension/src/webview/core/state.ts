// Core State Management System - Inspired by Claude-Autopilot
// Centralized store for all application state with Aurora theme

// VS Code API reference
declare function acquireVsCodeApi(): any;
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : null;

// Plan Management State
interface PlanState {
    phase1Plans: PlanItem[];
    phase2Plans: PlanItem[];
    phase3Plans: PlanItem[];
    selectedPlan: PlanItem | null;
    complianceRate: number;
    lastUpdated: Date;
}

interface PlanItem {
    id: string;
    filename: string;
    title: string;
    phase: 'pre-execution' | 'post-execution' | 'verification';
    content?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
    createdAt: Date;
    updatedAt: Date;
    hasPhase2?: boolean;
    hasPhase3?: boolean;
}

// Session State
interface SessionState {
    isActive: boolean;
    currentView: 'dashboard' | 'phaseTable' | 'planViewer' | 'analytics' | 'settings';
    viewParams: Record<string, any>;
    navigationHistory: string[];
    canGoBack: boolean;
    canGoForward: boolean;
}

// UI State
interface UIState {
    theme: 'aurora' | 'dark' | 'light';
    sidebarCollapsed: boolean;
    notificationsEnabled: boolean;
    activeModal: string | null;
    toasts: Toast[];
    loading: boolean;
    loadingMessage: string;
}

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    timestamp: Date;
}

// Performance State
interface PerformanceState {
    renderThrottleMs: number;
    lastRenderTime: number;
    fps: number;
    memoryUsage: number;
    isDevelopmentMode: boolean;
}

// Analytics State
interface AnalyticsState {
    completionTrends: CompletionTrend[];
    phaseMetrics: PhaseMetrics;
    userActivity: ActivityLog[];
}

interface CompletionTrend {
    date: Date;
    phase1: number;
    phase2: number;
    phase3: number;
}

interface PhaseMetrics {
    averagePhase1to2Days: number;
    averagePhase2to3Days: number;
    totalCycleTime: number;
    successRate: number;
}

interface ActivityLog {
    timestamp: Date;
    action: string;
    details: Record<string, any>;
}

// Global Application State
class ApplicationState {
    private planState: PlanState = {
        phase1Plans: [],
        phase2Plans: [],
        phase3Plans: [],
        selectedPlan: null,
        complianceRate: 0,
        lastUpdated: new Date()
    };

    private sessionState: SessionState = {
        isActive: true,
        currentView: 'dashboard',
        viewParams: {},
        navigationHistory: ['dashboard'],
        canGoBack: false,
        canGoForward: false
    };

    private uiState: UIState = {
        theme: 'aurora',
        sidebarCollapsed: false,
        notificationsEnabled: true,
        activeModal: null,
        toasts: [],
        loading: false,
        loadingMessage: ''
    };

    private performanceState: PerformanceState = {
        renderThrottleMs: 200,
        lastRenderTime: 0,
        fps: 60,
        memoryUsage: 0,
        isDevelopmentMode: false
    };

    private analyticsState: AnalyticsState = {
        completionTrends: [],
        phaseMetrics: {
            averagePhase1to2Days: 0,
            averagePhase2to3Days: 0,
            totalCycleTime: 0,
            successRate: 0
        },
        userActivity: []
    };

    private listeners: Set<() => void> = new Set();
    private stateHistory: any[] = [];
    private historyIndex: number = -1;
    private maxHistorySize: number = 50;

    // Plan State Methods
    getPlanState(): PlanState {
        return { ...this.planState };
    }

    updatePlanState(updates: Partial<PlanState>): void {
        this.saveStateSnapshot();
        Object.assign(this.planState, updates);
        this.planState.lastUpdated = new Date();
        this.notifyListeners();
        this.persistState();
    }

    // Session State Methods
    getSessionState(): SessionState {
        return { ...this.sessionState };
    }

    navigate(view: SessionState['currentView'], params?: Record<string, any>): void {
        this.saveStateSnapshot();
        
        // Add to navigation history
        this.sessionState.navigationHistory.push(view);
        if (this.sessionState.navigationHistory.length > 20) {
            this.sessionState.navigationHistory.shift();
        }
        
        this.sessionState.currentView = view;
        this.sessionState.viewParams = params || {};
        this.sessionState.canGoBack = this.sessionState.navigationHistory.length > 1;
        
        this.notifyListeners();
        this.logActivity('navigation', { view, params });
    }

    goBack(): void {
        if (this.sessionState.navigationHistory.length > 1) {
            this.sessionState.navigationHistory.pop();
            const previousView = this.sessionState.navigationHistory[this.sessionState.navigationHistory.length - 1];
            this.navigate(previousView as SessionState['currentView']);
        }
    }

    // UI State Methods
    getUIState(): UIState {
        return { ...this.uiState };
    }

    showToast(type: Toast['type'], message: string, duration: number = 3000): void {
        const toast: Toast = {
            id: `toast-${Date.now()}-${Math.random()}`,
            type,
            message,
            duration,
            timestamp: new Date()
        };
        
        this.uiState.toasts.push(toast);
        this.notifyListeners();
        
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast.id), duration);
        }
    }

    removeToast(id: string): void {
        this.uiState.toasts = this.uiState.toasts.filter(t => t.id !== id);
        this.notifyListeners();
    }

    setLoading(loading: boolean, message: string = ''): void {
        this.uiState.loading = loading;
        this.uiState.loadingMessage = message;
        this.notifyListeners();
    }

    // Performance State Methods
    getPerformanceState(): PerformanceState {
        return { ...this.performanceState };
    }

    updatePerformanceMetrics(metrics: Partial<PerformanceState>): void {
        Object.assign(this.performanceState, metrics);
        
        // Dynamic throttling based on performance
        if (this.performanceState.fps < 30) {
            this.performanceState.renderThrottleMs = Math.min(1000, this.performanceState.renderThrottleMs * 1.5);
        } else if (this.performanceState.fps > 55) {
            this.performanceState.renderThrottleMs = Math.max(100, this.performanceState.renderThrottleMs * 0.9);
        }
    }

    // Analytics State Methods
    getAnalyticsState(): AnalyticsState {
        return { ...this.analyticsState };
    }

    logActivity(action: string, details: Record<string, any> = {}): void {
        const log: ActivityLog = {
            timestamp: new Date(),
            action,
            details
        };
        
        this.analyticsState.userActivity.push(log);
        
        // Keep only last 500 activities
        if (this.analyticsState.userActivity.length > 500) {
            this.analyticsState.userActivity = this.analyticsState.userActivity.slice(-500);
        }
    }

    // State Management Methods
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    private saveStateSnapshot(): void {
        const snapshot = {
            planState: { ...this.planState },
            sessionState: { ...this.sessionState },
            uiState: { ...this.uiState },
            timestamp: Date.now()
        };
        
        // Add to history
        this.stateHistory = this.stateHistory.slice(0, this.historyIndex + 1);
        this.stateHistory.push(snapshot);
        
        // Limit history size
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo(): boolean {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const snapshot = this.stateHistory[this.historyIndex];
            this.restoreSnapshot(snapshot);
            return true;
        }
        return false;
    }

    redo(): boolean {
        if (this.historyIndex < this.stateHistory.length - 1) {
            this.historyIndex++;
            const snapshot = this.stateHistory[this.historyIndex];
            this.restoreSnapshot(snapshot);
            return true;
        }
        return false;
    }

    private restoreSnapshot(snapshot: any): void {
        this.planState = { ...snapshot.planState };
        this.sessionState = { ...snapshot.sessionState };
        this.uiState = { ...snapshot.uiState };
        this.notifyListeners();
    }

    private persistState(): void {
        if (vscode) {
            vscode.setState({
                planState: this.planState,
                sessionState: this.sessionState,
                uiState: this.uiState,
                analyticsState: this.analyticsState
            });
        }
    }

    loadPersistedState(): void {
        if (vscode) {
            const state = vscode.getState();
            if (state) {
                this.planState = state.planState || this.planState;
                this.sessionState = state.sessionState || this.sessionState;
                this.uiState = state.uiState || this.uiState;
                this.analyticsState = state.analyticsState || this.analyticsState;
                this.notifyListeners();
            }
        }
    }

    reset(): void {
        this.saveStateSnapshot();
        this.planState = {
            phase1Plans: [],
            phase2Plans: [],
            phase3Plans: [],
            selectedPlan: null,
            complianceRate: 0,
            lastUpdated: new Date()
        };
        this.sessionState.currentView = 'dashboard';
        this.sessionState.viewParams = {};
        this.notifyListeners();
        this.persistState();
    }
}

// Create singleton instance
const appState = new ApplicationState();

// Export state instance and helper functions
export default appState;

// Helper functions for easy access
export function getPlanState() { return appState.getPlanState(); }
export function updatePlanState(updates: Partial<PlanState>) { appState.updatePlanState(updates); }
export function getSessionState() { return appState.getSessionState(); }
export function navigate(view: SessionState['currentView'], params?: Record<string, any>) { appState.navigate(view, params); }
export function goBack() { appState.goBack(); }
export function getUIState() { return appState.getUIState(); }
export function showToast(type: Toast['type'], message: string, duration?: number) { appState.showToast(type, message, duration); }
export function setLoading(loading: boolean, message?: string) { appState.setLoading(loading, message); }
export function getPerformanceState() { return appState.getPerformanceState(); }
export function logActivity(action: string, details?: Record<string, any>) { appState.logActivity(action, details); }
export function subscribe(listener: () => void) { return appState.subscribe(listener); }
export function undo() { return appState.undo(); }
export function redo() { return appState.redo(); }

// Export VS Code API
export { vscode };