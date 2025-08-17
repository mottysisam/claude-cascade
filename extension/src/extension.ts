import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PhaseTreeDataProvider, PlanItem } from './providers/treeDataProvider';
import { StatusBarProvider } from './providers/statusBarProvider';
import { createPlan } from './commands/createPlan';
import { completeExecution } from './commands/completeExecution';
import { verify } from './commands/verify';
import { showDashboard } from './webview/dashboard';

export function activate(context: vscode.ExtensionContext) {
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
    const treeDataProvider = new PhaseTreeDataProvider(rootPath);
    const statusBarProvider = new StatusBarProvider(rootPath);

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
        vscode.commands.registerCommand('claudeCascade.createPlan', () => createPlan(rootPath, treeDataProvider)),
        vscode.commands.registerCommand('claudeCascade.completeExecution', () => completeExecution(rootPath, treeDataProvider)),
        vscode.commands.registerCommand('claudeCascade.verify', () => verify(rootPath, treeDataProvider)),
        vscode.commands.registerCommand('claudeCascade.showDashboard', () => showDashboard(context, rootPath)),
        vscode.commands.registerCommand('claudeCascade.refreshPlans', () => treeDataProvider.refresh()),
        vscode.commands.registerCommand('claudeCascade.openPlan', (item: PlanItem) => {
            if (item.resourceUri) {
                vscode.window.showTextDocument(item.resourceUri);
            }
        }),

        // File system watcher
        vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(plansPath, '**/*.md'),
            false, // ignoreCreateEvents
            false, // ignoreChangeEvents
            false  // ignoreDeleteEvents
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

export function deactivate() {
    console.log('Claude Cascade extension is now inactive.');
}