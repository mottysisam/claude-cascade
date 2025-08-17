"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPlanName = exports.extractPlanId = exports.showDashboard = void 0;
const vscode = require("vscode");
const path = require("path");
const mainDashboard_1 = require("./views/mainDashboard");
const navigation_1 = require("./utils/navigation");
// Singleton pattern: track the current panel
let currentPanel = undefined;
function showDashboard(context, rootPath) {
    // If we already have a panel, reuse it
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.One);
        currentPanel.webview.html = (0, mainDashboard_1.generateDashboardHtml)(rootPath);
        return;
    }
    // Otherwise, create a new panel
    currentPanel = vscode.window.createWebviewPanel('claudeCascadeDashboard', 'Claude Cascade Dashboard', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, 'media'))
        ]
    });
    // Set the initial HTML content
    currentPanel.webview.html = (0, mainDashboard_1.generateDashboardHtml)(rootPath);
    // Setup navigation message handlers
    (0, navigation_1.setupNavigationHandlers)(currentPanel, rootPath, context);
    // Update dashboard when plans change
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(rootPath, '.claude/plans/**/*.md'));
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
exports.showDashboard = showDashboard;
// Helper function to extract plan ID from filename
function extractPlanId(filename) {
    // Extract the plan base name without timestamp or phase suffix
    const match = filename.match(/^\d{8}_\d{6}_([A-Z_]+)/);
    return match ? match[1] : filename.replace('.md', '');
}
exports.extractPlanId = extractPlanId;
// Helper function to extract readable plan name from filename
function extractPlanName(filename) {
    const nameMatch = filename.match(/^\d{8}_\d{6}_(.+)\.md$/);
    if (nameMatch) {
        return nameMatch[1]
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    }
    return filename.replace('.md', '');
}
exports.extractPlanName = extractPlanName;
//# sourceMappingURL=dashboard.js.map