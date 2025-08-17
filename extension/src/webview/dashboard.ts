import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { generateDashboardHtml } from './views/mainDashboard';
import { setupNavigationHandlers } from './utils/navigation';

// Singleton pattern: track the current panel
let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function showDashboard(context: vscode.ExtensionContext, rootPath: string) {
    // If we already have a panel, reuse it
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.One);
        currentPanel.webview.html = generateDashboardHtml(rootPath);
        return;
    }

    // Otherwise, create a new panel
    currentPanel = vscode.window.createWebviewPanel(
        'claudeCascadeDashboard',
        'Claude Cascade Dashboard',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'media'))
            ]
        }
    );

    // Set the initial HTML content
    currentPanel.webview.html = generateDashboardHtml(rootPath);
    
    // Setup navigation message handlers
    setupNavigationHandlers(currentPanel, rootPath, context);
    
    // Update dashboard when plans change
    const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(rootPath, '.claude/plans/**/*.md')
    );
    
    const updateDashboard = () => {
        if (currentPanel) {
            // Reload the current view
            currentPanel.webview.postMessage({
                command: 'refresh'
            });
        }
    };
    
    watcher.onDidChange(updateDashboard);
    watcher.onDidCreate(updateDashboard);
    watcher.onDidDelete(updateDashboard);
    
    // Clean up resources when panel is closed
    currentPanel.onDidDispose(() => {
        watcher.dispose();
        currentPanel = undefined;
    });
}

// Helper function to extract plan ID from filename
export function extractPlanId(filename: string): string {
    // Extract the plan base name without timestamp or phase suffix
    const match = filename.match(/^\d{8}_\d{6}_([A-Z_]+)/);
    return match ? match[1] : filename.replace('.md', '');
}

// Helper function to extract readable plan name from filename
export function extractPlanName(filename: string): string {
    const nameMatch = filename.match(/^\d{8}_\d{6}_(.+)\.md$/);
    if (nameMatch) {
        return nameMatch[1]
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    }
    return filename.replace('.md', '');
}