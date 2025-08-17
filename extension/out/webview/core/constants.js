"use strict";
// Application Constants
// Centralized constants for the Aurora-themed extension
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTANTS = exports.REGEX = exports.DELAYS = exports.LIMITS = exports.CHART_COLORS = exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = exports.API_ENDPOINTS = exports.SHORTCUTS = exports.STORAGE_KEYS = exports.FILE_PATTERNS = exports.COMPLIANCE_THRESHOLDS = exports.PERFORMANCE = exports.ANIMATIONS = exports.TOAST_TYPES = exports.MESSAGE_TYPES = exports.VIEWS = exports.PLAN_STATUS = exports.PHASE_DIRECTORIES = exports.PHASE_LABELS = exports.PHASES = exports.APP_DESCRIPTION = exports.APP_VERSION = exports.APP_NAME = void 0;
// Application Info
exports.APP_NAME = 'Claude Cascade';
exports.APP_VERSION = '2.0.0';
exports.APP_DESCRIPTION = 'Three-Phase Planning System with Aurora Theme';
// Phase Names
exports.PHASES = {
    PHASE_1: 'pre-execution',
    PHASE_2: 'post-execution',
    PHASE_3: 'verification'
};
exports.PHASE_LABELS = {
    [exports.PHASES.PHASE_1]: 'Pre-Execution Plans',
    [exports.PHASES.PHASE_2]: 'Post-Execution Reports',
    [exports.PHASES.PHASE_3]: 'Verification Results'
};
exports.PHASE_DIRECTORIES = {
    [exports.PHASES.PHASE_1]: '1_pre_exec_plans',
    [exports.PHASES.PHASE_2]: '2_post_exec_plans',
    [exports.PHASES.PHASE_3]: '3_checked_delta_exec_plans'
};
// Plan Status
exports.PLAN_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    ERROR: 'error',
    WAITING: 'waiting'
};
// View Types
exports.VIEWS = {
    DASHBOARD: 'dashboard',
    PHASE_TABLE: 'phaseTable',
    PLAN_VIEWER: 'planViewer',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings',
    COMPLIANCE: 'compliance'
};
// Message Types
exports.MESSAGE_TYPES = {
    // From Extension to WebView
    UPDATE_PLANS: 'updatePlans',
    UPDATE_COMPLIANCE: 'updateCompliance',
    PLAN_SELECTED: 'planSelected',
    NAVIGATION: 'navigation',
    THEME_CHANGED: 'themeChanged',
    CONFIG_UPDATED: 'configUpdated',
    // From WebView to Extension
    REQUEST_PLANS: 'requestPlans',
    CREATE_PLAN: 'createPlan',
    DELETE_PLAN: 'deletePlan',
    OPEN_PLAN: 'openPlan',
    NAVIGATE_TO: 'navigateTo',
    UPDATE_CONFIG: 'updateConfig',
    EXPORT_DATA: 'exportData'
};
// Toast Types
exports.TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};
// Animation Durations (ms)
exports.ANIMATIONS = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000,
    TOAST_DURATION: 3000,
    PULSE_DURATION: 2000
};
// Performance Thresholds
exports.PERFORMANCE = {
    MIN_FPS: 30,
    TARGET_FPS: 60,
    MAX_RENDER_TIME: 16,
    THROTTLE_MIN: 100,
    THROTTLE_MAX: 1000,
    THROTTLE_STEP: 50
};
// Compliance Thresholds
exports.COMPLIANCE_THRESHOLDS = {
    GOOD: 80,
    WARNING: 50,
    ERROR: 0
};
// File Patterns
exports.FILE_PATTERNS = {
    MARKDOWN: /\.md$/i,
    PLAN_ID: /^\d{8}_\d{6}_([A-Z_]+)/,
    TIMESTAMP: /^\d{8}_\d{6}/,
    EXECUTED_SUFFIX: /_EXECUTED$/,
    VERIFICATION_SUFFIX: /_VERIFICATION$/
};
// Local Storage Keys
exports.STORAGE_KEYS = {
    CONFIG: 'claudeCascadeConfig',
    STATE: 'claudeCascadeState',
    HISTORY: 'claudeCascadeHistory',
    ANALYTICS: 'claudeCascadeAnalytics',
    PREFERENCES: 'claudeCascadePreferences'
};
// Keyboard Shortcuts (Platform-agnostic)
exports.SHORTCUTS = {
    // Navigation
    DASHBOARD: ['Cmd+Shift+D', 'Ctrl+Shift+D'],
    PHASE_1: ['Cmd+1', 'Ctrl+1'],
    PHASE_2: ['Cmd+2', 'Ctrl+2'],
    PHASE_3: ['Cmd+3', 'Ctrl+3'],
    ANALYTICS: ['Cmd+Shift+A', 'Ctrl+Shift+A'],
    SETTINGS: ['Cmd+,', 'Ctrl+,'],
    // Actions
    CREATE_PLAN: ['Cmd+N', 'Ctrl+N'],
    SEARCH: ['Cmd+F', 'Ctrl+F'],
    REFRESH: ['Cmd+R', 'Ctrl+R', 'F5'],
    UNDO: ['Cmd+Z', 'Ctrl+Z'],
    REDO: ['Cmd+Shift+Z', 'Ctrl+Shift+Z'],
    SAVE: ['Cmd+S', 'Ctrl+S'],
    EXPORT: ['Cmd+E', 'Ctrl+E'],
    // UI
    ESCAPE: ['Escape', 'Esc'],
    ENTER: ['Enter', 'Return'],
    TAB: ['Tab'],
    BACK: ['Backspace', 'Delete']
};
// API Endpoints (if using external API)
exports.API_ENDPOINTS = {
    BASE: process.env.API_BASE_URL || '',
    PLANS: '/api/plans',
    ANALYTICS: '/api/analytics',
    EXPORT: '/api/export',
    SYNC: '/api/sync'
};
// Error Messages
exports.ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    PERMISSION_DENIED: 'Permission denied. Please check your access rights.',
    PLAN_NOT_FOUND: 'Plan not found.',
    INVALID_PHASE: 'Invalid phase specified.',
    SAVE_FAILED: 'Failed to save changes.',
    LOAD_FAILED: 'Failed to load data.',
    VALIDATION_FAILED: 'Validation failed. Please check your input.'
};
// Success Messages
exports.SUCCESS_MESSAGES = {
    PLAN_CREATED: 'Plan created successfully!',
    PLAN_UPDATED: 'Plan updated successfully!',
    PLAN_DELETED: 'Plan deleted successfully!',
    CONFIG_SAVED: 'Configuration saved successfully!',
    EXPORT_COMPLETE: 'Export completed successfully!',
    SYNC_COMPLETE: 'Synchronization completed!'
};
// Chart Colors (for analytics)
exports.CHART_COLORS = {
    PHASE_1: '#7c3aed',
    PHASE_2: '#10b981',
    PHASE_3: '#f59e0b',
    SUCCESS: '#10b981',
    ERROR: '#f43f5e',
    WARNING: '#f59e0b',
    INFO: '#6366f1'
};
// Maximum Values
exports.LIMITS = {
    MAX_PLANS_PER_PHASE: 1000,
    MAX_PLAN_SIZE: 1024 * 1024,
    MAX_HISTORY_SIZE: 50,
    MAX_TOASTS: 5,
    MAX_ACTIVITY_LOGS: 500,
    MAX_SEARCH_RESULTS: 100
};
// Debounce/Throttle Delays
exports.DELAYS = {
    DEBOUNCE_INPUT: 300,
    DEBOUNCE_SEARCH: 500,
    THROTTLE_SCROLL: 100,
    THROTTLE_RESIZE: 200,
    AUTO_SAVE: 30000,
    POLL_INTERVAL: 5000 // 5 seconds
};
// Regular Expressions
exports.REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/,
    PLAN_TITLE: /^[A-Z][A-Z0-9_\s]{2,100}$/,
    VERSION: /^\d+\.\d+\.\d+$/
};
// Export all constants as a single object for convenience
exports.CONSTANTS = {
    APP_NAME: exports.APP_NAME,
    APP_VERSION: exports.APP_VERSION,
    APP_DESCRIPTION: exports.APP_DESCRIPTION,
    PHASES: exports.PHASES,
    PHASE_LABELS: exports.PHASE_LABELS,
    PHASE_DIRECTORIES: exports.PHASE_DIRECTORIES,
    PLAN_STATUS: exports.PLAN_STATUS,
    VIEWS: exports.VIEWS,
    MESSAGE_TYPES: exports.MESSAGE_TYPES,
    TOAST_TYPES: exports.TOAST_TYPES,
    ANIMATIONS: exports.ANIMATIONS,
    PERFORMANCE: exports.PERFORMANCE,
    COMPLIANCE_THRESHOLDS: exports.COMPLIANCE_THRESHOLDS,
    FILE_PATTERNS: exports.FILE_PATTERNS,
    STORAGE_KEYS: exports.STORAGE_KEYS,
    SHORTCUTS: exports.SHORTCUTS,
    API_ENDPOINTS: exports.API_ENDPOINTS,
    ERROR_MESSAGES: exports.ERROR_MESSAGES,
    SUCCESS_MESSAGES: exports.SUCCESS_MESSAGES,
    CHART_COLORS: exports.CHART_COLORS,
    LIMITS: exports.LIMITS,
    DELAYS: exports.DELAYS,
    REGEX: exports.REGEX
};
exports.default = exports.CONSTANTS;
//# sourceMappingURL=constants.js.map