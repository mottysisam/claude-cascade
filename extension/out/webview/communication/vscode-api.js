"use strict";
// VS Code API Wrapper
// Clean abstraction for VS Code WebView API communication
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleResponse = exports.openDevTools = exports.log = exports.trackPageView = exports.trackEvent = exports.sendWebSocketMessage = exports.disconnectWebSocket = exports.connectWebSocket = exports.createTerminal = exports.runTerminalCommand = exports.showProgress = exports.showQuickPick = exports.showInputBox = exports.showErrorMessage = exports.showWarningMessage = exports.showInformationMessage = exports.readFromClipboard = exports.copyToClipboard = exports.listFiles = exports.fileExists = exports.writeFile = exports.readFile = exports.exportCompliance = exports.exportAnalytics = exports.exportPlans = exports.requestConfiguration = exports.updateConfiguration = exports.revealInExplorer = exports.openExternal = exports.navigateToView = exports.openPlanInEditor = exports.deletePlan = exports.updatePlan = exports.createPlan = exports.requestPlanContent = exports.requestPlans = exports.sendRequest = exports.sendCommand = exports.postMessage = exports.getState = exports.saveState = exports.isVSCodeAvailable = void 0;
const constants_1 = require("../core/constants");
// Get VS Code API instance
function getVSCodeAPI() {
    if (typeof acquireVsCodeApi !== 'undefined') {
        return window.vscode || acquireVsCodeApi();
    }
    return null;
}
const vscode = getVSCodeAPI();
// API availability check
function isVSCodeAvailable() {
    return vscode !== null;
}
exports.isVSCodeAvailable = isVSCodeAvailable;
// State management
function saveState(state) {
    if (vscode) {
        vscode.setState(state);
    }
}
exports.saveState = saveState;
function getState() {
    if (vscode) {
        return vscode.getState();
    }
    return null;
}
exports.getState = getState;
// Message sending utilities
function postMessage(message) {
    if (vscode) {
        vscode.postMessage(message);
    }
    else {
        console.warn('VS Code API not available, message not sent:', message);
    }
}
exports.postMessage = postMessage;
// Common message patterns
function sendCommand(command, data) {
    postMessage({
        command,
        data,
        timestamp: Date.now()
    });
}
exports.sendCommand = sendCommand;
function sendRequest(command, data) {
    return new Promise((resolve, reject) => {
        const requestId = `${command}-${Date.now()}-${Math.random()}`;
        // Set up one-time listener for response
        const handler = (event) => {
            const message = event.data;
            if (message.requestId === requestId) {
                window.removeEventListener('message', handler);
                if (message.error) {
                    reject(new Error(message.error));
                }
                else {
                    resolve(message.data);
                }
            }
        };
        window.addEventListener('message', handler);
        // Send request
        postMessage({
            command,
            data,
            requestId,
            timestamp: Date.now()
        });
        // Timeout after 30 seconds
        setTimeout(() => {
            window.removeEventListener('message', handler);
            reject(new Error(`Request timeout: ${command}`));
        }, 30000);
    });
}
exports.sendRequest = sendRequest;
// Plan Management Commands
function requestPlans() {
    sendCommand(constants_1.MESSAGE_TYPES.REQUEST_PLANS);
}
exports.requestPlans = requestPlans;
function requestPlanContent(planId) {
    return sendRequest('getPlanContent', { planId });
}
exports.requestPlanContent = requestPlanContent;
function createPlan(phase, title, content) {
    return sendRequest(constants_1.MESSAGE_TYPES.CREATE_PLAN, { phase, title, content });
}
exports.createPlan = createPlan;
function updatePlan(planId, content) {
    return sendRequest('updatePlan', { planId, content });
}
exports.updatePlan = updatePlan;
function deletePlan(planId) {
    return sendRequest(constants_1.MESSAGE_TYPES.DELETE_PLAN, { planId });
}
exports.deletePlan = deletePlan;
function openPlanInEditor(planId) {
    sendCommand(constants_1.MESSAGE_TYPES.OPEN_PLAN, { planId });
}
exports.openPlanInEditor = openPlanInEditor;
// Navigation Commands
function navigateToView(view, params) {
    sendCommand(constants_1.MESSAGE_TYPES.NAVIGATE_TO, { view, params });
}
exports.navigateToView = navigateToView;
function openExternal(url) {
    sendCommand('openExternal', { url });
}
exports.openExternal = openExternal;
function revealInExplorer(path) {
    sendCommand('revealInExplorer', { path });
}
exports.revealInExplorer = revealInExplorer;
// Configuration Commands
function updateConfiguration(config) {
    sendCommand(constants_1.MESSAGE_TYPES.UPDATE_CONFIG, config);
}
exports.updateConfiguration = updateConfiguration;
function requestConfiguration() {
    return sendRequest('getConfiguration');
}
exports.requestConfiguration = requestConfiguration;
// Export Commands
function exportPlans(format) {
    return sendRequest(constants_1.MESSAGE_TYPES.EXPORT_DATA, { format, type: 'plans' });
}
exports.exportPlans = exportPlans;
function exportAnalytics(format) {
    return sendRequest(constants_1.MESSAGE_TYPES.EXPORT_DATA, { format, type: 'analytics' });
}
exports.exportAnalytics = exportAnalytics;
function exportCompliance(format) {
    return sendRequest(constants_1.MESSAGE_TYPES.EXPORT_DATA, { format, type: 'compliance' });
}
exports.exportCompliance = exportCompliance;
// File System Commands
function readFile(path) {
    return sendRequest('readFile', { path });
}
exports.readFile = readFile;
function writeFile(path, content) {
    return sendRequest('writeFile', { path, content });
}
exports.writeFile = writeFile;
function fileExists(path) {
    return sendRequest('fileExists', { path });
}
exports.fileExists = fileExists;
function listFiles(directory, pattern) {
    return sendRequest('listFiles', { directory, pattern });
}
exports.listFiles = listFiles;
// Clipboard Commands
function copyToClipboard(text) {
    sendCommand('copyToClipboard', { text });
}
exports.copyToClipboard = copyToClipboard;
function readFromClipboard() {
    return sendRequest('readFromClipboard');
}
exports.readFromClipboard = readFromClipboard;
// Dialog Commands
function showInformationMessage(message, ...buttons) {
    return sendRequest('showInformationMessage', { message, buttons });
}
exports.showInformationMessage = showInformationMessage;
function showWarningMessage(message, ...buttons) {
    return sendRequest('showWarningMessage', { message, buttons });
}
exports.showWarningMessage = showWarningMessage;
function showErrorMessage(message, ...buttons) {
    return sendRequest('showErrorMessage', { message, buttons });
}
exports.showErrorMessage = showErrorMessage;
function showInputBox(options) {
    return sendRequest('showInputBox', options);
}
exports.showInputBox = showInputBox;
function showQuickPick(items, options) {
    return sendRequest('showQuickPick', { items, options });
}
exports.showQuickPick = showQuickPick;
// Progress Commands
function showProgress(options) {
    return sendRequest('showProgress', options);
}
exports.showProgress = showProgress;
// Terminal Commands
function runTerminalCommand(command) {
    sendCommand('runTerminalCommand', { command });
}
exports.runTerminalCommand = runTerminalCommand;
function createTerminal(name) {
    sendCommand('createTerminal', { name });
}
exports.createTerminal = createTerminal;
// WebSocket Commands (for real-time features)
function connectWebSocket(url) {
    sendCommand('connectWebSocket', { url });
}
exports.connectWebSocket = connectWebSocket;
function disconnectWebSocket() {
    sendCommand('disconnectWebSocket');
}
exports.disconnectWebSocket = disconnectWebSocket;
function sendWebSocketMessage(data) {
    sendCommand('webSocketMessage', { data });
}
exports.sendWebSocketMessage = sendWebSocketMessage;
// Analytics Commands
function trackEvent(eventName, properties) {
    sendCommand('trackEvent', { eventName, properties });
}
exports.trackEvent = trackEvent;
function trackPageView(pageName, properties) {
    sendCommand('trackPageView', { pageName, properties });
}
exports.trackPageView = trackPageView;
// Debug Commands
function log(level, message, ...args) {
    sendCommand('log', { level, message, args });
}
exports.log = log;
function openDevTools() {
    sendCommand('openDevTools');
}
exports.openDevTools = openDevTools;
// Utility function to handle common response patterns
function handleResponse(promise, onSuccess, onError) {
    return promise
        .then(data => {
        if (onSuccess)
            onSuccess(data);
        return data;
    })
        .catch(error => {
        console.error('API call failed:', error);
        if (onError)
            onError(error);
        return null;
    });
}
exports.handleResponse = handleResponse;
// Export all for convenience
exports.default = {
    isVSCodeAvailable,
    saveState,
    getState,
    postMessage,
    sendCommand,
    sendRequest,
    requestPlans,
    requestPlanContent,
    createPlan,
    updatePlan,
    deletePlan,
    openPlanInEditor,
    navigateToView,
    openExternal,
    revealInExplorer,
    updateConfiguration,
    requestConfiguration,
    exportPlans,
    exportAnalytics,
    exportCompliance,
    readFile,
    writeFile,
    fileExists,
    listFiles,
    copyToClipboard,
    readFromClipboard,
    showInformationMessage,
    showWarningMessage,
    showErrorMessage,
    showInputBox,
    showQuickPick,
    showProgress,
    runTerminalCommand,
    createTerminal,
    connectWebSocket,
    disconnectWebSocket,
    sendWebSocketMessage,
    trackEvent,
    trackPageView,
    log,
    openDevTools,
    handleResponse
};
//# sourceMappingURL=vscode-api.js.map