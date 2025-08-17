// VS Code API Wrapper
// Clean abstraction for VS Code WebView API communication

import { MESSAGE_TYPES } from '../core/constants';
import appState from '../core/state';

// Declare the VS Code API function
declare function acquireVsCodeApi(): any;

// Get VS Code API instance
function getVSCodeAPI() {
    if (typeof acquireVsCodeApi !== 'undefined') {
        return (window as any).vscode || acquireVsCodeApi();
    }
    return null;
}

const vscode = getVSCodeAPI();

// API availability check
export function isVSCodeAvailable(): boolean {
    return vscode !== null;
}

// State management
export function saveState(state: any): void {
    if (vscode) {
        vscode.setState(state);
    }
}

export function getState(): any {
    if (vscode) {
        return vscode.getState();
    }
    return null;
}

// Message sending utilities
export function postMessage(message: any): void {
    if (vscode) {
        vscode.postMessage(message);
    } else {
        console.warn('VS Code API not available, message not sent:', message);
    }
}

// Common message patterns
export function sendCommand(command: string, data?: any): void {
    postMessage({
        command,
        data,
        timestamp: Date.now()
    });
}

export function sendRequest(command: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const requestId = `${command}-${Date.now()}-${Math.random()}`;
        
        // Set up one-time listener for response
        const handler = (event: MessageEvent) => {
            const message = event.data;
            if (message.requestId === requestId) {
                window.removeEventListener('message', handler);
                
                if (message.error) {
                    reject(new Error(message.error));
                } else {
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

// Plan Management Commands
export function requestPlans(): void {
    sendCommand(MESSAGE_TYPES.REQUEST_PLANS);
}

export function requestPlanContent(planId: string): Promise<string> {
    return sendRequest('getPlanContent', { planId });
}

export function createPlan(phase: string, title: string, content: string): Promise<any> {
    return sendRequest(MESSAGE_TYPES.CREATE_PLAN, { phase, title, content });
}

export function updatePlan(planId: string, content: string): Promise<any> {
    return sendRequest('updatePlan', { planId, content });
}

export function deletePlan(planId: string): Promise<any> {
    return sendRequest(MESSAGE_TYPES.DELETE_PLAN, { planId });
}

export function openPlanInEditor(planId: string): void {
    sendCommand(MESSAGE_TYPES.OPEN_PLAN, { planId });
}

// Navigation Commands
export function navigateToView(view: string, params?: any): void {
    sendCommand(MESSAGE_TYPES.NAVIGATE_TO, { view, params });
}

export function openExternal(url: string): void {
    sendCommand('openExternal', { url });
}

export function revealInExplorer(path: string): void {
    sendCommand('revealInExplorer', { path });
}

// Configuration Commands
export function updateConfiguration(config: any): void {
    sendCommand(MESSAGE_TYPES.UPDATE_CONFIG, config);
}

export function requestConfiguration(): Promise<any> {
    return sendRequest('getConfiguration');
}

// Export Commands
export function exportPlans(format: 'json' | 'csv' | 'pdf'): Promise<any> {
    return sendRequest(MESSAGE_TYPES.EXPORT_DATA, { format, type: 'plans' });
}

export function exportAnalytics(format: 'json' | 'csv' | 'pdf'): Promise<any> {
    return sendRequest(MESSAGE_TYPES.EXPORT_DATA, { format, type: 'analytics' });
}

export function exportCompliance(format: 'json' | 'csv' | 'pdf'): Promise<any> {
    return sendRequest(MESSAGE_TYPES.EXPORT_DATA, { format, type: 'compliance' });
}

// File System Commands
export function readFile(path: string): Promise<string> {
    return sendRequest('readFile', { path });
}

export function writeFile(path: string, content: string): Promise<void> {
    return sendRequest('writeFile', { path, content });
}

export function fileExists(path: string): Promise<boolean> {
    return sendRequest('fileExists', { path });
}

export function listFiles(directory: string, pattern?: string): Promise<string[]> {
    return sendRequest('listFiles', { directory, pattern });
}

// Clipboard Commands
export function copyToClipboard(text: string): void {
    sendCommand('copyToClipboard', { text });
}

export function readFromClipboard(): Promise<string> {
    return sendRequest('readFromClipboard');
}

// Dialog Commands
export function showInformationMessage(message: string, ...buttons: string[]): Promise<string | undefined> {
    return sendRequest('showInformationMessage', { message, buttons });
}

export function showWarningMessage(message: string, ...buttons: string[]): Promise<string | undefined> {
    return sendRequest('showWarningMessage', { message, buttons });
}

export function showErrorMessage(message: string, ...buttons: string[]): Promise<string | undefined> {
    return sendRequest('showErrorMessage', { message, buttons });
}

export function showInputBox(options: {
    prompt?: string;
    placeHolder?: string;
    value?: string;
    validateInput?: (value: string) => string | null;
}): Promise<string | undefined> {
    return sendRequest('showInputBox', options);
}

export function showQuickPick(items: string[], options?: {
    placeHolder?: string;
    canPickMany?: boolean;
}): Promise<string | string[] | undefined> {
    return sendRequest('showQuickPick', { items, options });
}

// Progress Commands
export function showProgress(options: {
    location?: 'notification' | 'window' | 'scm';
    title: string;
    cancellable?: boolean;
}): Promise<{ reportProgress: (value: number) => void; done: () => void }> {
    return sendRequest('showProgress', options);
}

// Terminal Commands
export function runTerminalCommand(command: string): void {
    sendCommand('runTerminalCommand', { command });
}

export function createTerminal(name: string): void {
    sendCommand('createTerminal', { name });
}

// WebSocket Commands (for real-time features)
export function connectWebSocket(url: string): void {
    sendCommand('connectWebSocket', { url });
}

export function disconnectWebSocket(): void {
    sendCommand('disconnectWebSocket');
}

export function sendWebSocketMessage(data: any): void {
    sendCommand('webSocketMessage', { data });
}

// Analytics Commands
export function trackEvent(eventName: string, properties?: any): void {
    sendCommand('trackEvent', { eventName, properties });
}

export function trackPageView(pageName: string, properties?: any): void {
    sendCommand('trackPageView', { pageName, properties });
}

// Debug Commands
export function log(level: 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    sendCommand('log', { level, message, args });
}

export function openDevTools(): void {
    sendCommand('openDevTools');
}

// Utility function to handle common response patterns
export function handleResponse<T>(
    promise: Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
): Promise<T | null> {
    return promise
        .then(data => {
            if (onSuccess) onSuccess(data);
            return data;
        })
        .catch(error => {
            console.error('API call failed:', error);
            if (onError) onError(error);
            return null;
        });
}

// Export all for convenience
export default {
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