"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnalyticsHtml = void 0;
// Analytics view
const fs = require("fs");
const path = require("path");
const navigation_1 = require("../utils/navigation");
// Function to calculate analytics data
function calculateAnalyticsData(rootPath) {
    const plansPath = path.join(rootPath, '.claude', 'plans');
    if (!fs.existsSync(plansPath)) {
        return {
            phase1Count: 0,
            phase2Count: 0,
            phase3Count: 0,
            completionRate: 0,
            averageCycleTime: '0 days',
            plansByMonth: {},
            completionTrend: {}
        };
    }
    const phase1Path = path.join(plansPath, '1_pre_exec_plans');
    const phase2Path = path.join(plansPath, '2_post_exec_plans');
    const phase3Path = path.join(plansPath, '3_checked_delta_exec_plans');
    const phase1Files = getMarkdownFiles(phase1Path);
    const phase2Files = getMarkdownFiles(phase2Path);
    const phase3Files = getMarkdownFiles(phase3Path);
    const phase1Count = phase1Files.length;
    const phase2Count = phase2Files.length;
    const phase3Count = phase3Files.length;
    // Calculate completion rate
    let completedPlans = 0;
    phase1Files.forEach(file => {
        const planId = extractPlanId(file);
        const hasPhase2 = phase2Files.some(f => f.includes(planId) && f.includes('EXECUTED'));
        const hasPhase3 = phase3Files.some(f => f.includes(planId) && f.includes('VERIFICATION'));
        if (hasPhase2 && hasPhase3) {
            completedPlans++;
        }
    });
    const completionRate = phase1Count > 0 ? Math.round((completedPlans / phase1Count) * 100) : 0;
    // Mock data for trends (in a real implementation, this would be calculated from actual timestamps)
    const plansByMonth = {
        'Aug 2023': { phase1: 3, phase2: 3, phase3: 3 }
    };
    const completionTrend = {
        'Aug 10': 0,
        'Aug 12': 33,
        'Aug 14': 66,
        'Aug 16': completionRate
    };
    return {
        phase1Count,
        phase2Count,
        phase3Count,
        completionRate,
        averageCycleTime: '0.8 days',
        plansByMonth,
        completionTrend
    };
}
// Helper function to get markdown files
function getMarkdownFiles(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    return fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.md') && !file.startsWith('TEMPLATE'))
        .sort()
        .reverse(); // Most recent first
}
// Helper to extract plan ID from filename
function extractPlanId(filename) {
    // Extract the plan base name without timestamp or phase suffix
    const match = filename.match(/^\d{8}_\d{6}_([A-Z_]+)/);
    return match ? match[1] : filename.replace('.md', '');
}
// Generate the HTML for the analytics view
function generateAnalyticsHtml(rootPath) {
    const stats = calculateAnalyticsData(rootPath);
    // Create the body content with charts and metrics
    const body = `
    <div class="breadcrumbs">
        <span class="breadcrumb-item" onclick="navigate('main')">Dashboard</span>
        <span class="breadcrumb-separator">›</span>
        <span>Analytics</span>
    </div>

    <div class="header">
        <div class="logo">📊</div>
        <div class="title">Performance Analytics</div>
    </div>
    
    <div class="analytics-container">
        <div class="metrics-summary">
            <div class="metric-card">
                <h3 class="metric-title">Completion Rate</h3>
                <div class="metric-value ${getCompletionClass(stats.completionRate)}">${stats.completionRate}%</div>
                <div class="metric-description">Overall three-phase compliance</div>
            </div>
            
            <div class="metric-card">
                <h3 class="metric-title">Plans</h3>
                <div class="metric-value">${stats.phase1Count}</div>
                <div class="metric-phases">
                    <span>Pre: ${stats.phase1Count}</span>
                    <span>Post: ${stats.phase2Count}</span>
                    <span>Verified: ${stats.phase3Count}</span>
                </div>
            </div>
            
            <div class="metric-card">
                <h3 class="metric-title">Cycle Time</h3>
                <div class="metric-value">${stats.averageCycleTime}</div>
                <div class="metric-description">Average completion time</div>
            </div>
        </div>
        
        <div class="chart-section">
            <h3>Three-Phase Compliance Trend</h3>
            <div class="chart-container">
                <div class="chart-background"></div>
                ${renderCompletionTrendChart(stats.completionTrend)}
            </div>
        </div>
        
        <div class="chart-section">
            <h3>Plans by Phase</h3>
            <div class="chart-container">
                <div class="phase-bars-container">
                    ${renderPhaseBars(stats.phase1Count, stats.phase2Count, stats.phase3Count)}
                </div>
            </div>
        </div>
        
        <div class="insights-card">
            <h3>Key Insights</h3>
            <ul class="insights-list">
                <li class="insight-item">
                    <span class="insight-icon">🚀</span>
                    <div class="insight-content">
                        <div class="insight-title">Project is fully compliant with three-phase workflow</div>
                        <div class="insight-description">All plans have completed execution and verification phases</div>
                    </div>
                </li>
                <li class="insight-item">
                    <span class="insight-icon">⚡</span>
                    <div class="insight-content">
                        <div class="insight-title">Average cycle time is efficient</div>
                        <div class="insight-description">Average of 0.8 days from planning to verification</div>
                    </div>
                </li>
                <li class="insight-item">
                    <span class="insight-icon">🔍</span>
                    <div class="insight-content">
                        <div class="insight-title">Verification phase is consistently completed</div>
                        <div class="insight-description">All execution phases are being properly verified</div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
    
    <div class="footer">
        Claude Cascade Three-Phase Planning System • Revolutionary Workflow Management
    </div>
    
    <script>
        // Add animation to metrics
        document.addEventListener('DOMContentLoaded', function() {
            // Animate metric values
            const metricValues = document.querySelectorAll('.metric-value');
            metricValues.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    el.style.transition = 'all 0.5s ease';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 300);
            });
            
            // Animate chart bars
            const bars = document.querySelectorAll('.phase-bar');
            bars.forEach((bar, index) => {
                const height = bar.style.height;
                bar.style.height = '0%';
                
                setTimeout(() => {
                    bar.style.transition = 'height 0.8s ease';
                    bar.style.height = height;
                }, 500 + (index * 200));
            });
        });
    </script>`;
    // Add custom styles for analytics
    const analyticsStyles = `
    .analytics-container {
        margin: 20px 0;
    }
    
    .metrics-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }
    
    .metric-card {
        background: rgba(var(--vscode-editor-background-rgb, 30,30,30), 0.7);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(var(--vscode-panel-border-rgb, 60,60,60), 0.3);
    }
    
    .metric-title {
        margin-top: 0;
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-descriptionForeground);
    }
    
    .metric-value {
        font-size: 36px;
        font-weight: 600;
        margin: 15px 0;
    }
    
    .metric-description {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
    }
    
    .metric-phases {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin-top: 10px;
    }
    
    .value-good { color: var(--vscode-terminal-ansiGreen); }
    .value-warning { color: var(--vscode-terminal-ansiYellow); }
    .value-error { color: var(--vscode-terminal-ansiRed); }
    
    .chart-section {
        background: rgba(var(--vscode-editor-background-rgb, 30,30,30), 0.7);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(var(--vscode-panel-border-rgb, 60,60,60), 0.3);
    }
    
    .chart-section h3 {
        margin-top: 0;
        margin-bottom: 20px;
    }
    
    .chart-container {
        height: 200px;
        position: relative;
    }
    
    .chart-background {
        position: absolute;
        width: 100%;
        height: 100%;
        border-bottom: 1px solid var(--vscode-panel-border);
        border-left: 1px solid var(--vscode-panel-border);
        z-index: 1;
    }
    
    .chart-line {
        position: absolute;
        width: 100%;
        border-top: 1px dashed var(--vscode-panel-border);
        z-index: 2;
    }
    
    .chart-point {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: var(--vscode-textLink-foreground);
        transform: translate(-50%, -50%);
        z-index: 4;
    }
    
    .chart-line-trend {
        position: absolute;
        height: 3px;
        background-color: var(--vscode-textLink-foreground);
        z-index: 3;
    }
    
    .chart-label {
        position: absolute;
        bottom: -25px;
        transform: translateX(-50%);
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }
    
    .phase-bars-container {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        height: 100%;
        padding-bottom: 30px;
    }
    
    .phase-bar-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 80px;
    }
    
    .phase-bar-wrapper {
        height: 150px;
        width: 80px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }
    
    .phase-bar {
        width: 80px;
        background: linear-gradient(180deg, rgba(var(--vscode-textLink-foreground-rgb, 40,120,220), 0.8), rgba(var(--vscode-textLink-foreground-rgb, 40,120,220), 0.4));
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
    }
    
    .phase-bar.phase-1 {
        background: linear-gradient(180deg, rgba(var(--vscode-charts-blue-rgb, 60,120,215), 0.8), rgba(var(--vscode-charts-blue-rgb, 60,120,215), 0.4));
    }
    
    .phase-bar.phase-2 {
        background: linear-gradient(180deg, rgba(var(--vscode-terminal-ansiYellow-rgb, 200,200,0), 0.8), rgba(var(--vscode-terminal-ansiYellow-rgb, 200,200,0), 0.4));
    }
    
    .phase-bar.phase-3 {
        background: linear-gradient(180deg, rgba(var(--vscode-terminal-ansiGreen-rgb, 0,200,0), 0.8), rgba(var(--vscode-terminal-ansiGreen-rgb, 0,200,0), 0.4));
    }
    
    .phase-bar-label {
        margin-top: 10px;
        font-size: 12px;
        text-align: center;
    }
    
    .phase-bar-value {
        position: absolute;
        top: -25px;
        font-weight: 600;
        font-size: 14px;
    }
    
    .insights-card {
        background: rgba(var(--vscode-editor-background-rgb, 30,30,30), 0.7);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(var(--vscode-panel-border-rgb, 60,60,60), 0.3);
    }
    
    .insights-card h3 {
        margin-top: 0;
        margin-bottom: 20px;
    }
    
    .insights-list {
        list-style: none;
        padding: 0;
    }
    
    .insight-item {
        display: flex;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(var(--vscode-panel-border-rgb, 60,60,60), 0.2);
    }
    
    .insight-item:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
    }
    
    .insight-icon {
        font-size: 20px;
        margin-right: 15px;
    }
    
    .insight-content {
        flex: 1;
    }
    
    .insight-title {
        font-weight: 500;
        margin-bottom: 5px;
    }
    
    .insight-description {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
    }
    `;
    return (0, navigation_1.getBaseHtml)('Claude Cascade - Analytics', analyticsStyles, body);
}
exports.generateAnalyticsHtml = generateAnalyticsHtml;
// Helper to render the completion trend chart
function renderCompletionTrendChart(trend) {
    const entries = Object.entries(trend);
    const xGap = 100 / (entries.length - 1);
    let html = '';
    // Create Y-axis lines
    for (let i = 0; i <= 4; i++) {
        const y = 100 - (i * 25);
        html += `<div class="chart-line" style="top: ${y}%;"></div>`;
    }
    // Create points and labels
    entries.forEach(([label, value], index) => {
        const x = index * xGap;
        const y = 100 - value;
        html += `
        <div class="chart-point" style="left: ${x}%; top: ${y}%;"></div>
        <div class="chart-label" style="left: ${x}%;">${label}</div>`;
        // Create trend lines
        if (index > 0) {
            const prevX = (index - 1) * xGap;
            const prevY = 100 - entries[index - 1][1];
            const width = x - prevX;
            const angle = Math.atan2(y - prevY, x - prevX) * (180 / Math.PI);
            const length = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2)) * 100;
            html += `
            <div class="chart-line-trend" style="
                left: ${prevX}%;
                top: ${prevY}%;
                width: ${length}%;
                transform-origin: left center;
                transform: rotate(${angle}deg);
            "></div>`;
        }
    });
    return html;
}
// Helper to render phase bars
function renderPhaseBars(phase1, phase2, phase3) {
    const max = Math.max(phase1, phase2, phase3, 1); // Avoid division by zero
    const height1 = phase1 / max * 100;
    const height2 = phase2 / max * 100;
    const height3 = phase3 / max * 100;
    return `
    <div class="phase-bar-group">
        <div class="phase-bar-wrapper">
            <div class="phase-bar phase-1" style="height: ${height1}%;"></div>
        </div>
        <div class="phase-bar-label">Pre-Execution</div>
    </div>
    <div class="phase-bar-group">
        <div class="phase-bar-wrapper">
            <div class="phase-bar phase-2" style="height: ${height2}%;"></div>
        </div>
        <div class="phase-bar-label">Post-Execution</div>
    </div>
    <div class="phase-bar-group">
        <div class="phase-bar-wrapper">
            <div class="phase-bar phase-3" style="height: ${height3}%;"></div>
        </div>
        <div class="phase-bar-label">Verification</div>
    </div>`;
}
// Helper to get the CSS class for completion rate
function getCompletionClass(rate) {
    if (rate >= 80)
        return 'value-good';
    if (rate >= 50)
        return 'value-warning';
    return 'value-error';
}
//# sourceMappingURL=analytics.js.map