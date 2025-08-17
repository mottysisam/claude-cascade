"use strict";
// Central Message Handler for VS Code Communication
// Inspired by Claude-Autopilot's clean message routing pattern
Object.defineProperty(exports, "__esModule", { value: true });
exports.__testing = exports.cleanupMessageHandler = exports.setupMessageHandler = exports.unregisterMessageHandler = exports.registerMessageHandler = exports.exportData = exports.updateConfig = exports.navigateTo = exports.openPlan = exports.deletePlan = exports.createPlan = exports.requestPlans = exports.sendBatchMessages = exports.sendMessage = void 0;
const state_1 = require("../core/state");
const constants_1 = require("../core/constants");
const config_1 = require("../core/config");
const messageHandlers = new Map();
// Register default message handlers
function registerDefaultHandlers() {
    // Plan updates
    messageHandlers.set(constants_1.MESSAGE_TYPES.UPDATE_PLANS, handleUpdatePlans);
    messageHandlers.set(constants_1.MESSAGE_TYPES.UPDATE_COMPLIANCE, handleUpdateCompliance);
    messageHandlers.set(constants_1.MESSAGE_TYPES.PLAN_SELECTED, handlePlanSelected);
    // Navigation
    messageHandlers.set(constants_1.MESSAGE_TYPES.NAVIGATION, handleNavigation);
    // Configuration
    messageHandlers.set(constants_1.MESSAGE_TYPES.THEME_CHANGED, handleThemeChanged);
    messageHandlers.set(constants_1.MESSAGE_TYPES.CONFIG_UPDATED, handleConfigUpdated);
    // Notifications
    messageHandlers.set('showToast', handleShowToast);
    messageHandlers.set('showError', handleShowError);
    messageHandlers.set('showSuccess', handleShowSuccess);
    // Loading states
    messageHandlers.set('setLoading', handleSetLoading);
    // File operations
    messageHandlers.set('fileCreated', handleFileCreated);
    messageHandlers.set('fileDeleted', handleFileDeleted);
    messageHandlers.set('fileUpdated', handleFileUpdated);
    // Real-time updates
    messageHandlers.set('realtimeUpdate', handleRealtimeUpdate);
    messageHandlers.set('sessionStateChanged', handleSessionStateChanged);
}
// Handler implementations
async function handleUpdatePlans(data) {
    try {
        (0, state_1.setLoading)(true, 'Updating plans...');
        const { phase1Plans, phase2Plans, phase3Plans, complianceRate } = data;
        (0, state_1.updatePlanState)({
            phase1Plans: phase1Plans || [],
            phase2Plans: phase2Plans || [],
            phase3Plans: phase3Plans || [],
            complianceRate: complianceRate || 0
        });
        (0, state_1.logActivity)('plansUpdated', {
            phase1Count: phase1Plans?.length || 0,
            phase2Count: phase2Plans?.length || 0,
            phase3Count: phase3Plans?.length || 0
        });
        (0, state_1.setLoading)(false);
    }
    catch (error) {
        console.error('Error updating plans:', error);
        (0, state_1.showToast)('error', 'Failed to update plans');
        (0, state_1.setLoading)(false);
    }
}
async function handleUpdateCompliance(data) {
    const { complianceRate, details } = data;
    (0, state_1.updatePlanState)({ complianceRate });
    if (complianceRate < 50) {
        (0, state_1.showToast)('warning', `Compliance rate is low: ${complianceRate}%`);
    }
    (0, state_1.logActivity)('complianceUpdated', { complianceRate, details });
}
async function handlePlanSelected(data) {
    const { plan } = data;
    (0, state_1.updatePlanState)({ selectedPlan: plan });
    (0, state_1.navigate)('planViewer', { planId: plan.id });
    (0, state_1.logActivity)('planSelected', { planId: plan.id, phase: plan.phase });
}
async function handleNavigation(data) {
    const { view, params } = data;
    (0, state_1.navigate)(view, params);
}
async function handleThemeChanged(data) {
    const { theme } = data;
    config_1.default.updateTheme(theme);
    // Apply CSS variables
    const styleElement = document.getElementById('aurora-theme-vars');
    if (styleElement) {
        styleElement.textContent = config_1.default.generateCSSVariables();
    }
    (0, state_1.showToast)('success', `Theme changed to ${theme.name}`);
    (0, state_1.logActivity)('themeChanged', { themeName: theme.name });
}
async function handleConfigUpdated(data) {
    config_1.default.update(data);
    (0, state_1.showToast)('success', 'Configuration updated');
    (0, state_1.logActivity)('configUpdated', data);
}
async function handleShowToast(data) {
    const { type, message, duration } = data;
    (0, state_1.showToast)(type || 'info', message, duration);
}
async function handleShowError(data) {
    const { message, details } = data;
    (0, state_1.showToast)('error', message);
    console.error('Error from extension:', message, details);
}
async function handleShowSuccess(data) {
    const { message } = data;
    (0, state_1.showToast)('success', message);
}
async function handleSetLoading(data) {
    const { loading, message } = data;
    (0, state_1.setLoading)(loading, message);
}
async function handleFileCreated(data) {
    const { filename, phase } = data;
    (0, state_1.showToast)('success', `Created: ${filename}`);
    // Request updated plans
    sendMessage(constants_1.MESSAGE_TYPES.REQUEST_PLANS);
}
async function handleFileDeleted(data) {
    const { filename, phase } = data;
    (0, state_1.showToast)('info', `Deleted: ${filename}`);
    // Request updated plans
    sendMessage(constants_1.MESSAGE_TYPES.REQUEST_PLANS);
}
async function handleFileUpdated(data) {
    const { filename, phase } = data;
    // Silent update - no toast
    sendMessage(constants_1.MESSAGE_TYPES.REQUEST_PLANS);
}
async function handleRealtimeUpdate(data) {
    // Handle real-time updates from WebSocket or file watcher
    const { type, payload } = data;
    switch (type) {
        case 'planProgress':
            (0, state_1.updatePlanState)({ selectedPlan: payload });
            break;
        case 'complianceChange':
            (0, state_1.updatePlanState)({ complianceRate: payload.rate });
            break;
        default:
            console.log('Realtime update:', type, payload);
    }
}
async function handleSessionStateChanged(data) {
    const { isActive, message } = data;
    if (!isActive) {
        (0, state_1.showToast)('warning', message || 'Session ended');
    }
    (0, state_1.logActivity)('sessionStateChanged', { isActive });
}
// Message sending
function sendMessage(command, data) {
    const vscode = window.vscode;
    if (vscode) {
        const message = {
            command,
            data,
            timestamp: Date.now()
        };
        vscode.postMessage(message);
        // Log outgoing messages in development
        if (config_1.default.getPerformance().isDevelopmentMode) {
            console.log('Sending message:', message);
        }
    }
    else {
        console.error('VS Code API not available');
    }
}
exports.sendMessage = sendMessage;
// Batch message sending for performance
function sendBatchMessages(messages) {
    messages.forEach(msg => sendMessage(msg.command, msg.data));
}
exports.sendBatchMessages = sendBatchMessages;
// Request helpers
function requestPlans() {
    sendMessage(constants_1.MESSAGE_TYPES.REQUEST_PLANS);
}
exports.requestPlans = requestPlans;
function createPlan(phase, title, content) {
    sendMessage(constants_1.MESSAGE_TYPES.CREATE_PLAN, { phase, title, content });
}
exports.createPlan = createPlan;
function deletePlan(planId) {
    sendMessage(constants_1.MESSAGE_TYPES.DELETE_PLAN, { planId });
}
exports.deletePlan = deletePlan;
function openPlan(planId) {
    sendMessage(constants_1.MESSAGE_TYPES.OPEN_PLAN, { planId });
}
exports.openPlan = openPlan;
function navigateTo(view, params) {
    sendMessage(constants_1.MESSAGE_TYPES.NAVIGATE_TO, { view, params });
}
exports.navigateTo = navigateTo;
function updateConfig(config) {
    sendMessage(constants_1.MESSAGE_TYPES.UPDATE_CONFIG, config);
}
exports.updateConfig = updateConfig;
function exportData(format = 'json') {
    sendMessage(constants_1.MESSAGE_TYPES.EXPORT_DATA, { format });
}
exports.exportData = exportData;
// Custom handler registration
function registerMessageHandler(command, handler) {
    messageHandlers.set(command, handler);
}
exports.registerMessageHandler = registerMessageHandler;
function unregisterMessageHandler(command) {
    messageHandlers.delete(command);
}
exports.unregisterMessageHandler = unregisterMessageHandler;
// Initialize message handling
function setupMessageHandler() {
    // Register default handlers
    registerDefaultHandlers();
    // Listen for messages from extension
    window.addEventListener('message', async (event) => {
        const message = event.data;
        // Validate message
        if (!message || !message.command) {
            console.warn('Invalid message received:', message);
            return;
        }
        // Log incoming messages in development
        if (config_1.default.getPerformance().isDevelopmentMode) {
            console.log('Received message:', message);
        }
        // Handle error messages
        if (message.error) {
            console.error(`Error in command ${message.command}:`, message.error);
            (0, state_1.showToast)('error', message.error);
            return;
        }
        // Find and execute handler
        const handler = messageHandlers.get(message.command);
        if (handler) {
            try {
                await handler(message.data);
            }
            catch (error) {
                console.error(`Error handling message ${message.command}:`, error);
                (0, state_1.showToast)('error', `Failed to handle ${message.command}`);
            }
        }
        else {
            console.warn(`No handler registered for command: ${message.command}`);
        }
    });
    // Request initial data
    setTimeout(() => {
        requestPlans();
    }, 100);
}
exports.setupMessageHandler = setupMessageHandler;
// Cleanup function
function cleanupMessageHandler() {
    messageHandlers.clear();
}
exports.cleanupMessageHandler = cleanupMessageHandler;
// Export for testing
exports.__testing = {
    messageHandlers,
    handleUpdatePlans,
    handleUpdateCompliance,
    handlePlanSelected
};
//# sourceMappingURL=message-handler.js.map