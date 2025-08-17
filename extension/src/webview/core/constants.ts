// Application Constants
// Centralized constants for the Aurora-themed extension

// Application Info
export const APP_NAME = 'Claude Cascade';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = 'Three-Phase Planning System with Aurora Theme';

// Phase Names
export const PHASES = {
    PHASE_1: 'pre-execution',
    PHASE_2: 'post-execution', 
    PHASE_3: 'verification'
} as const;

export const PHASE_LABELS = {
    [PHASES.PHASE_1]: 'Pre-Execution Plans',
    [PHASES.PHASE_2]: 'Post-Execution Reports',
    [PHASES.PHASE_3]: 'Verification Results'
} as const;

export const PHASE_DIRECTORIES = {
    [PHASES.PHASE_1]: '1_pre_exec_plans',
    [PHASES.PHASE_2]: '2_post_exec_plans',
    [PHASES.PHASE_3]: '3_checked_delta_exec_plans'
} as const;

// Plan Status
export const PLAN_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    ERROR: 'error',
    WAITING: 'waiting'
} as const;

// View Types
export const VIEWS = {
    DASHBOARD: 'dashboard',
    PHASE_TABLE: 'phaseTable',
    PLAN_VIEWER: 'planViewer',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings',
    COMPLIANCE: 'compliance'
} as const;

// Message Types
export const MESSAGE_TYPES = {
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
} as const;

// Toast Types
export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
} as const;

// Animation Durations (ms)
export const ANIMATIONS = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000,
    TOAST_DURATION: 3000,
    PULSE_DURATION: 2000
} as const;

// Performance Thresholds
export const PERFORMANCE = {
    MIN_FPS: 30,
    TARGET_FPS: 60,
    MAX_RENDER_TIME: 16, // 60fps = 16.67ms per frame
    THROTTLE_MIN: 100,
    THROTTLE_MAX: 1000,
    THROTTLE_STEP: 50
} as const;

// Compliance Thresholds
export const COMPLIANCE_THRESHOLDS = {
    GOOD: 80,
    WARNING: 50,
    ERROR: 0
} as const;

// File Patterns
export const FILE_PATTERNS = {
    MARKDOWN: /\.md$/i,
    PLAN_ID: /^\d{8}_\d{6}_([A-Z_]+)/,
    TIMESTAMP: /^\d{8}_\d{6}/,
    EXECUTED_SUFFIX: /_EXECUTED$/,
    VERIFICATION_SUFFIX: /_VERIFICATION$/
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    CONFIG: 'claudeCascadeConfig',
    STATE: 'claudeCascadeState',
    HISTORY: 'claudeCascadeHistory',
    ANALYTICS: 'claudeCascadeAnalytics',
    PREFERENCES: 'claudeCascadePreferences'
} as const;

// Keyboard Shortcuts (Platform-agnostic)
export const SHORTCUTS = {
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
} as const;

// API Endpoints (if using external API)
export const API_ENDPOINTS = {
    BASE: process.env.API_BASE_URL || '',
    PLANS: '/api/plans',
    ANALYTICS: '/api/analytics',
    EXPORT: '/api/export',
    SYNC: '/api/sync'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    PERMISSION_DENIED: 'Permission denied. Please check your access rights.',
    PLAN_NOT_FOUND: 'Plan not found.',
    INVALID_PHASE: 'Invalid phase specified.',
    SAVE_FAILED: 'Failed to save changes.',
    LOAD_FAILED: 'Failed to load data.',
    VALIDATION_FAILED: 'Validation failed. Please check your input.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
    PLAN_CREATED: 'Plan created successfully!',
    PLAN_UPDATED: 'Plan updated successfully!',
    PLAN_DELETED: 'Plan deleted successfully!',
    CONFIG_SAVED: 'Configuration saved successfully!',
    EXPORT_COMPLETE: 'Export completed successfully!',
    SYNC_COMPLETE: 'Synchronization completed!'
} as const;

// Chart Colors (for analytics)
export const CHART_COLORS = {
    PHASE_1: '#7c3aed',
    PHASE_2: '#10b981',
    PHASE_3: '#f59e0b',
    SUCCESS: '#10b981',
    ERROR: '#f43f5e',
    WARNING: '#f59e0b',
    INFO: '#6366f1'
} as const;

// Maximum Values
export const LIMITS = {
    MAX_PLANS_PER_PHASE: 1000,
    MAX_PLAN_SIZE: 1024 * 1024, // 1MB
    MAX_HISTORY_SIZE: 50,
    MAX_TOASTS: 5,
    MAX_ACTIVITY_LOGS: 500,
    MAX_SEARCH_RESULTS: 100
} as const;

// Debounce/Throttle Delays
export const DELAYS = {
    DEBOUNCE_INPUT: 300,
    DEBOUNCE_SEARCH: 500,
    THROTTLE_SCROLL: 100,
    THROTTLE_RESIZE: 200,
    AUTO_SAVE: 30000, // 30 seconds
    POLL_INTERVAL: 5000 // 5 seconds
} as const;

// Regular Expressions
export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/,
    PLAN_TITLE: /^[A-Z][A-Z0-9_\s]{2,100}$/,
    VERSION: /^\d+\.\d+\.\d+$/
} as const;

// Export all constants as a single object for convenience
export const CONSTANTS = {
    APP_NAME,
    APP_VERSION,
    APP_DESCRIPTION,
    PHASES,
    PHASE_LABELS,
    PHASE_DIRECTORIES,
    PLAN_STATUS,
    VIEWS,
    MESSAGE_TYPES,
    TOAST_TYPES,
    ANIMATIONS,
    PERFORMANCE,
    COMPLIANCE_THRESHOLDS,
    FILE_PATTERNS,
    STORAGE_KEYS,
    SHORTCUTS,
    API_ENDPOINTS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    CHART_COLORS,
    LIMITS,
    DELAYS,
    REGEX
} as const;

export default CONSTANTS;