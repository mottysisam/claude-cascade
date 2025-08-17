// Central Message Handler for VS Code Communication
// Inspired by Claude-Autopilot's clean message routing pattern

import appState, { 
    updatePlanState, 
    navigate, 
    showToast, 
    setLoading,
    logActivity 
} from '../core/state';
import { MESSAGE_TYPES, TOAST_TYPES } from '../core/constants';
import configManager from '../core/config';

// Message interface
export interface VSCodeMessage {
    command: string;
    data?: any;
    error?: string;
    timestamp?: number;
}

// Message handler registry
type MessageHandler = (data: any) => void | Promise<void>;
const messageHandlers = new Map<string, MessageHandler>();

// Register default message handlers
function registerDefaultHandlers() {
    // Plan updates
    messageHandlers.set(MESSAGE_TYPES.UPDATE_PLANS, handleUpdatePlans);
    messageHandlers.set(MESSAGE_TYPES.UPDATE_COMPLIANCE, handleUpdateCompliance);
    messageHandlers.set(MESSAGE_TYPES.PLAN_SELECTED, handlePlanSelected);
    
    // Navigation
    messageHandlers.set(MESSAGE_TYPES.NAVIGATION, handleNavigation);
    
    // Configuration
    messageHandlers.set(MESSAGE_TYPES.THEME_CHANGED, handleThemeChanged);
    messageHandlers.set(MESSAGE_TYPES.CONFIG_UPDATED, handleConfigUpdated);
    
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
async function handleUpdatePlans(data: any) {
    try {
        setLoading(true, 'Updating plans...');
        
        const { phase1Plans, phase2Plans, phase3Plans, complianceRate } = data;
        
        updatePlanState({
            phase1Plans: phase1Plans || [],
            phase2Plans: phase2Plans || [],
            phase3Plans: phase3Plans || [],
            complianceRate: complianceRate || 0
        });
        
        logActivity('plansUpdated', { 
            phase1Count: phase1Plans?.length || 0,
            phase2Count: phase2Plans?.length || 0,
            phase3Count: phase3Plans?.length || 0
        });
        
        setLoading(false);
    } catch (error) {
        console.error('Error updating plans:', error);
        showToast('error', 'Failed to update plans');
        setLoading(false);
    }
}

async function handleUpdateCompliance(data: any) {
    const { complianceRate, details } = data;
    
    updatePlanState({ complianceRate });
    
    if (complianceRate < 50) {
        showToast('warning', `Compliance rate is low: ${complianceRate}%`);
    }
    
    logActivity('complianceUpdated', { complianceRate, details });
}

async function handlePlanSelected(data: any) {
    const { plan } = data;
    
    updatePlanState({ selectedPlan: plan });
    navigate('planViewer', { planId: plan.id });
    
    logActivity('planSelected', { planId: plan.id, phase: plan.phase });
}

async function handleNavigation(data: any) {
    const { view, params } = data;
    navigate(view, params);
}

async function handleThemeChanged(data: any) {
    const { theme } = data;
    configManager.updateTheme(theme);
    
    // Apply CSS variables
    const styleElement = document.getElementById('aurora-theme-vars');
    if (styleElement) {
        styleElement.textContent = configManager.generateCSSVariables();
    }
    
    showToast('success', `Theme changed to ${theme.name}`);
    logActivity('themeChanged', { themeName: theme.name });
}

async function handleConfigUpdated(data: any) {
    configManager.update(data);
    showToast('success', 'Configuration updated');
    logActivity('configUpdated', data);
}

async function handleShowToast(data: any) {
    const { type, message, duration } = data;
    showToast(type || 'info', message, duration);
}

async function handleShowError(data: any) {
    const { message, details } = data;
    showToast('error', message);
    console.error('Error from extension:', message, details);
}

async function handleShowSuccess(data: any) {
    const { message } = data;
    showToast('success', message);
}

async function handleSetLoading(data: any) {
    const { loading, message } = data;
    setLoading(loading, message);
}

async function handleFileCreated(data: any) {
    const { filename, phase } = data;
    showToast('success', `Created: ${filename}`);
    
    // Request updated plans
    sendMessage(MESSAGE_TYPES.REQUEST_PLANS);
}

async function handleFileDeleted(data: any) {
    const { filename, phase } = data;
    showToast('info', `Deleted: ${filename}`);
    
    // Request updated plans
    sendMessage(MESSAGE_TYPES.REQUEST_PLANS);
}

async function handleFileUpdated(data: any) {
    const { filename, phase } = data;
    
    // Silent update - no toast
    sendMessage(MESSAGE_TYPES.REQUEST_PLANS);
}

async function handleRealtimeUpdate(data: any) {
    // Handle real-time updates from WebSocket or file watcher
    const { type, payload } = data;
    
    switch (type) {
        case 'planProgress':
            updatePlanState({ selectedPlan: payload });
            break;
        case 'complianceChange':
            updatePlanState({ complianceRate: payload.rate });
            break;
        default:
            console.log('Realtime update:', type, payload);
    }
}

async function handleSessionStateChanged(data: any) {
    const { isActive, message } = data;
    
    if (!isActive) {
        showToast('warning', message || 'Session ended');
    }
    
    logActivity('sessionStateChanged', { isActive });
}

// Message sending
export function sendMessage(command: string, data?: any) {
    const vscode = (window as any).vscode;
    if (vscode) {
        const message: VSCodeMessage = {
            command,
            data,
            timestamp: Date.now()
        };
        
        vscode.postMessage(message);
        
        // Log outgoing messages in development
        if (configManager.getPerformance().isDevelopmentMode) {
            console.log('Sending message:', message);
        }
    } else {
        console.error('VS Code API not available');
    }
}

// Batch message sending for performance
export function sendBatchMessages(messages: Array<{ command: string; data?: any }>) {
    messages.forEach(msg => sendMessage(msg.command, msg.data));
}

// Request helpers
export function requestPlans() {
    sendMessage(MESSAGE_TYPES.REQUEST_PLANS);
}

export function createPlan(phase: string, title: string, content: string) {
    sendMessage(MESSAGE_TYPES.CREATE_PLAN, { phase, title, content });
}

export function deletePlan(planId: string) {
    sendMessage(MESSAGE_TYPES.DELETE_PLAN, { planId });
}

export function openPlan(planId: string) {
    sendMessage(MESSAGE_TYPES.OPEN_PLAN, { planId });
}

export function navigateTo(view: string, params?: any) {
    sendMessage(MESSAGE_TYPES.NAVIGATE_TO, { view, params });
}

export function updateConfig(config: any) {
    sendMessage(MESSAGE_TYPES.UPDATE_CONFIG, config);
}

export function exportData(format: 'json' | 'csv' | 'pdf' = 'json') {
    sendMessage(MESSAGE_TYPES.EXPORT_DATA, { format });
}

// Custom handler registration
export function registerMessageHandler(command: string, handler: MessageHandler) {
    messageHandlers.set(command, handler);
}

export function unregisterMessageHandler(command: string) {
    messageHandlers.delete(command);
}

// Initialize message handling
export function setupMessageHandler() {
    // Register default handlers
    registerDefaultHandlers();
    
    // Listen for messages from extension
    window.addEventListener('message', async (event) => {
        const message = event.data as VSCodeMessage;
        
        // Validate message
        if (!message || !message.command) {
            console.warn('Invalid message received:', message);
            return;
        }
        
        // Log incoming messages in development
        if (configManager.getPerformance().isDevelopmentMode) {
            console.log('Received message:', message);
        }
        
        // Handle error messages
        if (message.error) {
            console.error(`Error in command ${message.command}:`, message.error);
            showToast('error', message.error);
            return;
        }
        
        // Find and execute handler
        const handler = messageHandlers.get(message.command);
        if (handler) {
            try {
                await handler(message.data);
            } catch (error) {
                console.error(`Error handling message ${message.command}:`, error);
                showToast('error', `Failed to handle ${message.command}`);
            }
        } else {
            console.warn(`No handler registered for command: ${message.command}`);
        }
    });
    
    // Request initial data
    setTimeout(() => {
        requestPlans();
    }, 100);
}

// Cleanup function
export function cleanupMessageHandler() {
    messageHandlers.clear();
}

// Export for testing
export const __testing = {
    messageHandlers,
    handleUpdatePlans,
    handleUpdateCompliance,
    handlePlanSelected
};