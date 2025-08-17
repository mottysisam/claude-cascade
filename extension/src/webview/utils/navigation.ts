// Navigation utility for Claude Cascade dashboard
import * as vscode from 'vscode';
import * as fs from 'fs';

// Define page types for navigation
export enum ViewType {
    Main = 'main',
    PhaseTable = 'phaseTable',
    PlanView = 'planView',
    Analytics = 'analytics'
}

export interface NavigationParams {
    phase?: string;
    planPath?: string;
    title?: string;
    [key: string]: any;
}

export function navigateTo(
    panel: vscode.WebviewPanel, 
    viewType: ViewType, 
    params?: NavigationParams
) {
    switch (viewType) {
        case ViewType.Main:
            // Import dynamically to avoid circular dependency
            const { generateDashboardHtml } = require('../views/mainDashboard');
            panel.webview.html = generateDashboardHtml(params?.rootPath);
            break;
        case ViewType.PhaseTable:
            const { generatePhaseTableHtml } = require('../views/phaseTable');
            panel.webview.html = generatePhaseTableHtml(params?.phase, params?.rootPath);
            break;
        case ViewType.PlanView:
            const { generatePlanViewHtml } = require('../views/planViewer');
            panel.webview.html = generatePlanViewHtml(params?.planPath, params?.rootPath);
            break;
        case ViewType.Analytics:
            const { generateAnalyticsHtml } = require('../views/analytics');
            panel.webview.html = generateAnalyticsHtml(params?.rootPath);
            break;
    }
}

// Register message handler for navigation
export function setupNavigationHandlers(
    panel: vscode.WebviewPanel,
    rootPath: string,
    context: vscode.ExtensionContext
) {
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'navigate':
                    navigateTo(panel, message.view, {
                        ...message.params,
                        rootPath
                    });
                    return;
                case 'openFile':
                    // Open a file in the editor
                    if (message.filePath) {
                        const uri = vscode.Uri.file(message.filePath);
                        vscode.window.showTextDocument(uri);
                    }
                    return;
                case 'createPlan':
                    vscode.commands.executeCommand('claudeCascade.createPlan');
                    return;
                case 'completeExecution':
                    vscode.commands.executeCommand('claudeCascade.completeExecution');
                    return;
                case 'verify':
                    vscode.commands.executeCommand('claudeCascade.verify');
                    return;
                case 'refresh':
                    navigateTo(panel, message.currentView || ViewType.Main, {
                        ...message.params,
                        rootPath
                    });
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
}

// Helper to generate base HTML with styles and scripts
export function getBaseHtml(title: string, styles: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 15px;
        }
        .logo {
            font-size: 24px;
            margin-right: 15px;
        }
        .title {
            font-size: 28px;
            font-weight: 600;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        .card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            transition: all 0.2s ease;
        }
        .card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transform: translateY(-2px);
        }
        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            padding: 6px 14px;
            cursor: pointer;
            font-size: 13px;
            margin: 5px;
            display: inline-block;
            text-decoration: none;
            transition: background 0.2s ease;
        }
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .breadcrumbs {
            display: flex;
            margin-bottom: 20px;
            font-size: 13px;
        }
        .breadcrumb-item {
            color: var(--vscode-textLink-foreground);
            cursor: pointer;
            margin-right: 8px;
        }
        .breadcrumb-item:hover {
            text-decoration: underline;
        }
        .breadcrumb-separator {
            margin: 0 8px;
            color: var(--vscode-descriptionForeground);
        }
        .glass-card {
            background: rgba(var(--vscode-editor-background-rgb, 30,30,30), 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(var(--vscode-panel-border-rgb, 60,60,60), 0.3);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        .glass-card:hover {
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            transform: translateY(-3px);
        }
        .fade-in {
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        /* Add custom styles */
        ${styles}
    </style>
    <script>
        // Message passing to VS Code extension
        const vscode = acquireVsCodeApi();
        
        function navigate(view, params) {
            vscode.postMessage({
                command: 'navigate',
                view: view,
                params: params || {}
            });
        }
        
        function openFile(filePath) {
            vscode.postMessage({
                command: 'openFile',
                filePath: filePath
            });
        }
        
        function executeCommand(command) {
            vscode.postMessage({
                command: command
            });
        }
        
        function refresh(currentView, params) {
            vscode.postMessage({
                command: 'refresh',
                currentView: currentView,
                params: params || {}
            });
        }
        
        // Initialize animations when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Add fade-in class to body after a slight delay
            setTimeout(() => {
                document.body.classList.add('fade-in');
            }, 100);
            
            // Add click animations to buttons
            document.querySelectorAll('.btn, .clickable').forEach(el => {
                el.addEventListener('click', function(e) {
                    const ripple = document.createElement('span');
                    ripple.classList.add('ripple');
                    this.appendChild(ripple);
                    
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    
                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = e.clientX - rect.left - size/2 + 'px';
                    ripple.style.top = e.clientY - rect.top - size/2 + 'px';
                    
                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                });
            });
        });
    </script>
</head>
<body>
    ${body}
</body>
</html>`;
}