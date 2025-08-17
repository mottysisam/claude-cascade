import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class PhaseTreeDataProvider implements vscode.TreeDataProvider<PlanItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PlanItem | undefined | null | void> = new vscode.EventEmitter<PlanItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PlanItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private rootPath: string) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PlanItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PlanItem): Thenable<PlanItem[]> {
        if (!this.rootPath) {
            vscode.window.showInformationMessage('No workspace folder found');
            return Promise.resolve([]);
        }

        const plansPath = path.join(this.rootPath, '.claude', 'plans');
        
        if (!fs.existsSync(plansPath)) {
            return Promise.resolve([]);
        }

        if (element) {
            // Return files in the phase directory
            return Promise.resolve(this.getPlansInPhase(element.phasePath!));
        } else {
            // Return the three main phases
            return Promise.resolve(this.getPhases(plansPath));
        }
    }

    private getPhases(plansPath: string): PlanItem[] {
        const phases = [
            {
                name: '📋 Phase 1: Plans',
                path: path.join(plansPath, '1_pre_exec_plans'),
                icon: 'notebook-edit'
            },
            {
                name: '⚡ Phase 2: Executions',
                path: path.join(plansPath, '2_post_exec_plans'),
                icon: 'play'
            },
            {
                name: '🔍 Phase 3: Verifications',
                path: path.join(plansPath, '3_checked_delta_exec_plans'),
                icon: 'verified'
            }
        ];

        return phases.map(phase => {
            const count = this.getFileCount(phase.path);
            const item = new PlanItem(
                `${phase.name} (${count})`,
                vscode.TreeItemCollapsibleState.Expanded
            );
            item.phasePath = phase.path;
            item.iconPath = new vscode.ThemeIcon(phase.icon);
            item.tooltip = `${count} plans in this phase`;
            return item;
        });
    }

    private getPlansInPhase(phasePath: string): PlanItem[] {
        if (!fs.existsSync(phasePath)) {
            return [];
        }

        const files = fs.readdirSync(phasePath)
            .filter(file => file.endsWith('.md') && !file.startsWith('TEMPLATE'))
            .sort((a, b) => {
                // Sort by timestamp (newest first)
                const statA = fs.statSync(path.join(phasePath, a));
                const statB = fs.statSync(path.join(phasePath, b));
                return statB.mtime.getTime() - statA.mtime.getTime();
            });

        return files.map(file => {
            const filePath = path.join(phasePath, file);
            const planName = this.extractPlanName(file);
            const item = new PlanItem(planName, vscode.TreeItemCollapsibleState.None);
            
            item.resourceUri = vscode.Uri.file(filePath);
            item.command = {
                command: 'vscode.open',
                title: 'Open Plan',
                arguments: [item.resourceUri]
            };
            item.contextValue = 'plan';
            item.tooltip = `Created: ${fs.statSync(filePath).mtime.toLocaleString()}`;
            
            // Determine status icon based on plan completeness
            const status = this.getPlanStatus(file, phasePath);
            item.iconPath = new vscode.ThemeIcon(status.icon, status.color);
            
            return item;
        });
    }

    private extractPlanName(filename: string): string {
        // Extract readable name from filename like "20250816_123456_USER_AUTHENTICATION.md"
        const nameMatch = filename.match(/^\d{8}_\d{6}_(.+)\.md$/);
        if (nameMatch) {
            return nameMatch[1]
                .split('_')
                .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                .join(' ');
        }
        return filename.replace('.md', '');
    }

    private getPlanStatus(filename: string, currentPhasePath: string): { icon: string, color?: vscode.ThemeColor } {
        const planId = filename.replace('.md', '');
        const plansDir = path.dirname(currentPhasePath);
        
        // Check if this plan has corresponding files in other phases
        const hasPhase1 = fs.existsSync(path.join(plansDir, '1_pre_exec_plans', filename)) || 
                         currentPhasePath.includes('1_pre_exec_plans');
        
        const hasPhase2 = fs.existsSync(path.join(plansDir, '2_post_exec_plans')) &&
                         fs.readdirSync(path.join(plansDir, '2_post_exec_plans'))
                           .some(f => f.includes(planId.split('_').slice(0, 3).join('_')) && f.includes('EXECUTED'));
        
        const hasPhase3 = fs.existsSync(path.join(plansDir, '3_checked_delta_exec_plans')) &&
                         fs.readdirSync(path.join(plansDir, '3_checked_delta_exec_plans'))
                           .some(f => f.includes(planId.split('_').slice(0, 3).join('_')) && f.includes('VERIFICATION'));

        // Determine status based on phase completion
        if (hasPhase1 && hasPhase2 && hasPhase3) {
            return { icon: 'pass', color: new vscode.ThemeColor('charts.green') };
        } else if (hasPhase1 && hasPhase2) {
            return { icon: 'clock', color: new vscode.ThemeColor('charts.yellow') };
        } else if (hasPhase1) {
            return { icon: 'circle-outline', color: new vscode.ThemeColor('charts.blue') };
        } else {
            return { icon: 'error', color: new vscode.ThemeColor('charts.red') };
        }
    }

    private getFileCount(dirPath: string): number {
        if (!fs.existsSync(dirPath)) {
            return 0;
        }
        return fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.md') && !file.startsWith('TEMPLATE'))
            .length;
    }
}

export class PlanItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }

    phasePath?: string;
    iconPath?: vscode.ThemeIcon;
    tooltip?: string;
}