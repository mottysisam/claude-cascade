"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const treeDataProvider_1 = require("./providers/treeDataProvider");
const statusBarProvider_1 = require("./providers/statusBarProvider");
const createPlan_1 = require("./commands/createPlan");
const completeExecution_1 = require("./commands/completeExecution");
const verify_1 = require("./commands/verify");
const dashboard_1 = require("./webview/dashboard");
function activate(context) {
    console.log('Claude Cascade extension is now active!');
    // Check if this workspace has Claude Cascade
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const plansPath = path.join(rootPath, '.claude', 'plans');
    // Only activate if .claude/plans directory exists
    if (!fs.existsSync(plansPath)) {
        return;
    }
    // Set context to show the view
    vscode.commands.executeCommand('setContext', 'claudeCascade.enabled', true);
    // Initialize providers
    const treeDataProvider = new treeDataProvider_1.PhaseTreeDataProvider(rootPath);
    const statusBarProvider = new statusBarProvider_1.StatusBarProvider(rootPath);
    // Register tree view
    const treeView = vscode.window.createTreeView('claudeCascadePlans', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });
    // Register commands
    const disposables = [
        // Tree view
        treeView,
        // Commands
        vscode.commands.registerCommand('claudeCascade.createPlan', () => (0, createPlan_1.createPlan)(rootPath, treeDataProvider)),
        vscode.commands.registerCommand('claudeCascade.completeExecution', () => (0, completeExecution_1.completeExecution)(rootPath, treeDataProvider)),
        vscode.commands.registerCommand('claudeCascade.verify', () => (0, verify_1.verify)(rootPath, treeDataProvider)),
        vscode.commands.registerCommand('claudeCascade.showDashboard', () => (0, dashboard_1.showDashboard)(context, rootPath)),
        vscode.commands.registerCommand('claudeCascade.refreshPlans', () => treeDataProvider.refresh()),
        vscode.commands.registerCommand('claudeCascade.openPlan', (item) => {
            if (item.resourceUri) {
                vscode.window.showTextDocument(item.resourceUri);
            }
        }),
        // File system watcher
        vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(plansPath, '**/*.md'), false, // ignoreCreateEvents
        false, // ignoreChangeEvents
        false // ignoreDeleteEvents
        ).onDidChange(() => {
            treeDataProvider.refresh();
            statusBarProvider.updateStatus();
        }),
        // Status bar provider
        statusBarProvider
    ];
    // Add all disposables to context
    context.subscriptions.push(...disposables);
    // Initial status update
    statusBarProvider.updateStatus();
    // Show welcome message
    vscode.window.showInformationMessage('Claude Cascade is active! Three-phase planning ready.', 'Show Dashboard')
        .then(selection => {
        if (selection === 'Show Dashboard') {
            vscode.commands.executeCommand('claudeCascade.showDashboard');
        }
    });
}
exports.activate = activate;
function deactivate() {
    console.log('Claude Cascade extension is now inactive.');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map