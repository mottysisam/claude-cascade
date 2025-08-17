"use strict";
// Core State Management System - Inspired by Claude-Autopilot
// Centralized store for all application state with Aurora theme
Object.defineProperty(exports, "__esModule", { value: true });
exports.vscode = exports.redo = exports.undo = exports.subscribe = exports.logActivity = exports.getPerformanceState = exports.setLoading = exports.showToast = exports.getUIState = exports.goBack = exports.navigate = exports.getSessionState = exports.updatePlanState = exports.getPlanState = void 0;
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : null;
exports.vscode = vscode;
// Global Application State
class ApplicationState {
    constructor() {
        this.planState = {
            phase1Plans: [],
            phase2Plans: [],
            phase3Plans: [],
            selectedPlan: null,
            complianceRate: 0,
            lastUpdated: new Date()
        };
        this.sessionState = {
            isActive: true,
            currentView: 'dashboard',
            viewParams: {},
            navigationHistory: ['dashboard'],
            canGoBack: false,
            canGoForward: false
        };
        this.uiState = {
            theme: 'aurora',
            sidebarCollapsed: false,
            notificationsEnabled: true,
            activeModal: null,
            toasts: [],
            loading: false,
            loadingMessage: ''
        };
        this.performanceState = {
            renderThrottleMs: 200,
            lastRenderTime: 0,
            fps: 60,
            memoryUsage: 0,
            isDevelopmentMode: false
        };
        this.analyticsState = {
            completionTrends: [],
            phaseMetrics: {
                averagePhase1to2Days: 0,
                averagePhase2to3Days: 0,
                totalCycleTime: 0,
                successRate: 0
            },
            userActivity: []
        };
        this.listeners = new Set();
        this.stateHistory = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
    }
    // Plan State Methods
    getPlanState() {
        return { ...this.planState };
    }
    updatePlanState(updates) {
        this.saveStateSnapshot();
        Object.assign(this.planState, updates);
        this.planState.lastUpdated = new Date();
        this.notifyListeners();
        this.persistState();
    }
    // Session State Methods
    getSessionState() {
        return { ...this.sessionState };
    }
    navigate(view, params) {
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
    goBack() {
        if (this.sessionState.navigationHistory.length > 1) {
            this.sessionState.navigationHistory.pop();
            const previousView = this.sessionState.navigationHistory[this.sessionState.navigationHistory.length - 1];
            this.navigate(previousView);
        }
    }
    // UI State Methods
    getUIState() {
        return { ...this.uiState };
    }
    showToast(type, message, duration = 3000) {
        const toast = {
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
    removeToast(id) {
        this.uiState.toasts = this.uiState.toasts.filter(t => t.id !== id);
        this.notifyListeners();
    }
    setLoading(loading, message = '') {
        this.uiState.loading = loading;
        this.uiState.loadingMessage = message;
        this.notifyListeners();
    }
    // Performance State Methods
    getPerformanceState() {
        return { ...this.performanceState };
    }
    updatePerformanceMetrics(metrics) {
        Object.assign(this.performanceState, metrics);
        // Dynamic throttling based on performance
        if (this.performanceState.fps < 30) {
            this.performanceState.renderThrottleMs = Math.min(1000, this.performanceState.renderThrottleMs * 1.5);
        }
        else if (this.performanceState.fps > 55) {
            this.performanceState.renderThrottleMs = Math.max(100, this.performanceState.renderThrottleMs * 0.9);
        }
    }
    // Analytics State Methods
    getAnalyticsState() {
        return { ...this.analyticsState };
    }
    logActivity(action, details = {}) {
        const log = {
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
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notifyListeners() {
        this.listeners.forEach(listener => listener());
    }
    saveStateSnapshot() {
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
        }
        else {
            this.historyIndex++;
        }
    }
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const snapshot = this.stateHistory[this.historyIndex];
            this.restoreSnapshot(snapshot);
            return true;
        }
        return false;
    }
    redo() {
        if (this.historyIndex < this.stateHistory.length - 1) {
            this.historyIndex++;
            const snapshot = this.stateHistory[this.historyIndex];
            this.restoreSnapshot(snapshot);
            return true;
        }
        return false;
    }
    restoreSnapshot(snapshot) {
        this.planState = { ...snapshot.planState };
        this.sessionState = { ...snapshot.sessionState };
        this.uiState = { ...snapshot.uiState };
        this.notifyListeners();
    }
    persistState() {
        if (vscode) {
            vscode.setState({
                planState: this.planState,
                sessionState: this.sessionState,
                uiState: this.uiState,
                analyticsState: this.analyticsState
            });
        }
    }
    loadPersistedState() {
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
    reset() {
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
exports.default = appState;
// Helper functions for easy access
function getPlanState() { return appState.getPlanState(); }
exports.getPlanState = getPlanState;
function updatePlanState(updates) { appState.updatePlanState(updates); }
exports.updatePlanState = updatePlanState;
function getSessionState() { return appState.getSessionState(); }
exports.getSessionState = getSessionState;
function navigate(view, params) { appState.navigate(view, params); }
exports.navigate = navigate;
function goBack() { appState.goBack(); }
exports.goBack = goBack;
function getUIState() { return appState.getUIState(); }
exports.getUIState = getUIState;
function showToast(type, message, duration) { appState.showToast(type, message, duration); }
exports.showToast = showToast;
function setLoading(loading, message) { appState.setLoading(loading, message); }
exports.setLoading = setLoading;
function getPerformanceState() { return appState.getPerformanceState(); }
exports.getPerformanceState = getPerformanceState;
function logActivity(action, details) { appState.logActivity(action, details); }
exports.logActivity = logActivity;
function subscribe(listener) { return appState.subscribe(listener); }
exports.subscribe = subscribe;
function undo() { return appState.undo(); }
exports.undo = undo;
function redo() { return appState.redo(); }
exports.redo = redo;
//# sourceMappingURL=state.js.map