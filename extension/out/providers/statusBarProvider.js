"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class StatusBarProvider {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.lastNotificationTime = 0;
        this.NOTIFICATION_COOLDOWN = 1000 * 60 * 10; // 10 minutes
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'claudeCascade.showDashboard';
        // Set up file system watcher for plan files
        this.setupComplianceWatcher();
    }
    /**
     * Set up file system watcher for plan files to update status on changes
     */
    setupComplianceWatcher() {
        // Watch for changes in .claude/plans directory
        const plansPattern = new vscode.RelativePattern(this.rootPath, '.claude/plans/**/*.md');
        this.complianceWatcher = vscode.workspace.createFileSystemWatcher(plansPattern);
        // Update status when files change
        this.complianceWatcher.onDidChange(() => this.updateStatus());
        this.complianceWatcher.onDidCreate(() => this.updateStatus());
        this.complianceWatcher.onDidDelete(() => this.updateStatus());
        // Also check periodically
        this.updateInterval = setInterval(() => this.updateStatus(), 30000); // Every 30 seconds
    }
    updateStatus() {
        const config = vscode.workspace.getConfiguration('claudeCascade');
        if (!config.get('showStatusBar', true)) {
            this.statusBarItem.hide();
            return;
        }
        const stats = this.calculateComplianceStats();
        // Update status bar with professional styling
        // Use more professional icons from VS Code's codicon set
        // Update color and icon based on compliance
        let icon, colorTheme;
        if (stats.completionRate >= 100) {
            // Perfect compliance
            icon = '$(shield)'; // Professional shield icon
            colorTheme = undefined; // Default (good)
        }
        else if (stats.completionRate >= 80) {
            // Good compliance
            icon = '$(shield-check)'; // Shield with check mark
            colorTheme = undefined; // Default (good)
        }
        else if (stats.completionRate >= 50) {
            // Moderate compliance
            icon = '$(shield)';
            colorTheme = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        else {
            // Poor compliance
            icon = '$(shield-alert)';
            colorTheme = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
        // Set professional status bar with clean, minimal design
        this.statusBarItem.text = `${icon} Cascade ${stats.completionRate}%`;
        this.statusBarItem.tooltip = this.createTooltip(stats);
        this.statusBarItem.backgroundColor = colorTheme;
        // Show notification if compliance is low and we haven't shown one recently
        if (stats.completionRate < 100) {
            const now = Date.now();
            if (now - this.lastNotificationTime > this.NOTIFICATION_COOLDOWN) {
                this.showComplianceNotification(stats);
                this.lastNotificationTime = now;
            }
        }
        this.statusBarItem.show();
    }
    calculateComplianceStats() {
        const plansPath = path.join(this.rootPath, '.claude', 'plans');
        if (!fs.existsSync(plansPath)) {
            return {
                completionRate: 0,
                phase1Count: 0,
                phase2Count: 0,
                phase3Count: 0,
                totalPlans: 0,
                activePlan: null
            };
        }
        const phase1Path = path.join(plansPath, '1_pre_exec_plans');
        const phase2Path = path.join(plansPath, '2_post_exec_plans');
        const phase3Path = path.join(plansPath, '3_checked_delta_exec_plans');
        const phase1Files = this.getMarkdownFiles(phase1Path);
        const phase2Files = this.getMarkdownFiles(phase2Path);
        const phase3Files = this.getMarkdownFiles(phase3Path);
        const phase1Count = phase1Files.length;
        const phase2Count = phase2Files.length;
        const phase3Count = phase3Files.length;
        // Calculate completion rate based on full three-phase completion
        const totalPlans = phase1Count;
        let completedPlans = 0;
        // For each Phase 1 plan, check if it has corresponding Phase 2 and Phase 3
        phase1Files.forEach(file => {
            const planId = this.extractPlanId(file);
            const hasPhase2 = phase2Files.some(f => {
                const candidateId = this.extractPlanId(f);
                return candidateId === planId && f.includes('EXECUTED');
            });
            const hasPhase3 = phase3Files.some(f => {
                const candidateId = this.extractPlanId(f);
                return candidateId === planId && f.includes('VERIFICATION');
            });
            if (hasPhase2 && hasPhase3) {
                completedPlans++;
            }
        });
        const completionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 100;
        // Find most recent active plan (has Phase 1 but missing Phase 2 or 3)
        const activePlan = this.findActivePlan(phase1Files, phase2Files, phase3Files);
        return {
            completionRate,
            phase1Count,
            phase2Count,
            phase3Count,
            totalPlans,
            completedPlans,
            activePlan
        };
    }
    getMarkdownFiles(dirPath) {
        if (!fs.existsSync(dirPath)) {
            return [];
        }
        return fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.md') && !file.startsWith('TEMPLATE'))
            .sort();
    }
    extractPlanId(filename) {
        // Extract the plan name without timestamp for more robust matching
        // Skip the date and time parts (first two segments) and get just the plan name
        return filename.split('_').slice(2).join('_').replace(/\.md$|_EXECUTED$|_VERIFICATION$/g, '');
    }
    findActivePlan(phase1Files, phase2Files, phase3Files) {
        // Find the most recent plan that's incomplete
        const sortedPhase1 = phase1Files.sort().reverse(); // Newest first
        for (const file of sortedPhase1) {
            const planId = this.extractPlanId(file);
            const hasPhase2 = phase2Files.some(f => {
                const candidateId = this.extractPlanId(f);
                return candidateId === planId && f.includes('EXECUTED');
            });
            const hasPhase3 = phase3Files.some(f => {
                const candidateId = this.extractPlanId(f);
                return candidateId === planId && f.includes('VERIFICATION');
            });
            if (!hasPhase2 || !hasPhase3) {
                // This is an active (incomplete) plan
                return this.extractPlanName(file);
            }
        }
        return null;
    }
    extractPlanName(filename) {
        const nameMatch = filename.match(/^\d{8}_\d{6}_(.+)\.md$/);
        if (nameMatch) {
            return nameMatch[1]
                .split('_')
                .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                .join(' ');
        }
        return filename.replace('.md', '');
    }
    createTooltip(stats) {
        const lines = [
            `Claude Cascade - Three-Phase Compliance: ${stats.completionRate}%`,
            '',
            `$(file-text) Phase 1 Plans: ${stats.phase1Count}`,
            `$(zap) Phase 2 Executions: ${stats.phase2Count}`,
            `$(verify) Phase 3 Verifications: ${stats.phase3Count}`,
            '',
            `$(check) Completed Cycles: ${stats.completedPlans}/${stats.totalPlans}`
        ];
        if (stats.activePlan) {
            lines.push('', `$(sync) Current Active Plan: ${stats.activePlan}`);
        }
        lines.push('', '$(graph) Click to open compliance dashboard');
        return lines.join('\n');
    }
    /**
     * Show notification about compliance issues
     */
    showComplianceNotification(stats) {
        const incompleteCount = stats.totalPlans - stats.completedPlans;
        if (incompleteCount <= 0)
            return;
        const message = `${incompleteCount} plan(s) have incomplete phases. Current compliance: ${stats.completionRate}%`;
        vscode.window.showWarningMessage(message, 'View Dashboard', 'Ignore').then(selection => {
            if (selection === 'View Dashboard') {
                vscode.commands.executeCommand('claudeCascade.showDashboard');
            }
        });
    }
    /**
     * Clean up resources on disposal
     */
    dispose() {
        this.statusBarItem.dispose();
        if (this.complianceWatcher) {
            this.complianceWatcher.dispose();
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}
exports.StatusBarProvider = StatusBarProvider;
//# sourceMappingURL=statusBarProvider.js.map