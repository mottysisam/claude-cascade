"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDashboardHtml = void 0;
// Main dashboard view
const fs = require("fs");
const path = require("path");
const navigation_1 = require("../utils/navigation");
// Function to calculate project statistics
function calculateProjectStats(rootPath) {
    const plansPath = path.join(rootPath, '.claude', 'plans');
    if (!fs.existsSync(plansPath)) {
        return {
            completionRate: 0,
            complianceClass: 'compliance-error',
            phase1Count: 0,
            phase2Count: 0,
            phase3Count: 0,
            recentPlans: [],
            totalPlans: 0,
            completedPlans: 0
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
    // Calculate completion rate based on full three-phase completion
    const totalPlans = phase1Count;
    let completedPlans = 0;
    // For each Phase 1 plan, check if it has corresponding Phase 2 and Phase 3
    phase1Files.forEach(file => {
        const planId = extractPlanId(file);
        const hasPhase2 = phase2Files.some(f => f.includes(planId) && f.includes('EXECUTED'));
        const hasPhase3 = phase3Files.some(f => f.includes(planId) && f.includes('VERIFICATION'));
        if (hasPhase2 && hasPhase3) {
            completedPlans++;
        }
    });
    const completionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 100;
    let complianceClass = 'compliance-error';
    if (completionRate >= 80) {
        complianceClass = 'compliance-good';
    }
    else if (completionRate >= 50) {
        complianceClass = 'compliance-warning';
    }
    // Get recent plans (last 5)
    const recentPlans = phase1Files.slice(0, 5).map(file => {
        const planId = extractPlanId(file);
        const hasPhase2 = phase2Files.some(f => f.includes(planId));
        const hasPhase3 = phase3Files.some(f => f.includes(planId));
        return {
            name: file.replace('.md', '').replace(/^\d{8}_\d{6}_/, ''),
            phase1: true,
            phase2: hasPhase2,
            phase3: hasPhase3
        };
    });
    // Analytics data
    const averageCompletion = Math.max(0, phase1Count > 0 ? phase3Count : 0);
    const timeMetrics = {
        phase1to2: '0.5 days',
        phase2to3: '0.3 days',
        totalCycle: '0.8 days'
    };
    return {
        completionRate,
        complianceClass,
        phase1Count,
        phase2Count,
        phase3Count,
        averageCompletion,
        timeMetrics,
        recentPlans,
        totalPlans,
        completedPlans
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
// Generate the main dashboard HTML
function generateDashboardHtml(rootPath) {
    const stats = calculateProjectStats(rootPath);
    // Create CSS from the Aurora dashboard styles with glassmorphism
    const stylesPath = path.join(__dirname, '..', 'styles', 'aurora-dashboard.css');
    const styles = fs.existsSync(stylesPath) ? fs.readFileSync(stylesPath, 'utf8') : '';
    // Add additional navigation styles
    const additionalStyles = `
    <style>
        /* Navigation Bar Styles */
        .aurora-navigation-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            background: var(--aurora-glass-bg);
            backdrop-filter: var(--aurora-glass-blur);
            border: 1px solid var(--aurora-glass-border);
            border-radius: 12px;
            margin-bottom: 24px;
        }
        
        .nav-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--aurora-primary-gradient-start), var(--aurora-primary-gradient-end));
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .nav-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        
        .nav-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
        }
        
        .breadcrumb {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .breadcrumb-item {
            cursor: pointer;
            transition: color 0.2s;
        }
        
        .breadcrumb-item:hover {
            color: var(--aurora-primary-light);
        }
        
        .breadcrumb-separator {
            opacity: 0.4;
        }
        
        /* Quick Stats Cards */
        .aurora-quick-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        
        .aurora-stat-card {
            background: var(--aurora-glass-bg);
            backdrop-filter: var(--aurora-glass-blur);
            border: 1px solid var(--aurora-glass-border);
            border-radius: 16px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        
        .aurora-stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(124, 58, 237, 0.15);
        }
        
        .stat-icon {
            width: 32px;
            height: 32px;
            margin-bottom: 12px;
            color: var(--aurora-primary-light);
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--aurora-primary-gradient-start), var(--aurora-primary-gradient-end));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
        }
        
        /* Recent Activity Feed */
        .aurora-recent-activity {
            background: var(--aurora-glass-bg);
            backdrop-filter: var(--aurora-glass-blur);
            border: 1px solid var(--aurora-glass-border);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 32px;
        }
        
        .activity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .activity-title {
            font-size: 18px;
            font-weight: 600;
        }
        
        .activity-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            transition: all 0.2s;
            cursor: pointer;
        }
        
        .activity-item:hover {
            background: rgba(124, 58, 237, 0.1);
            transform: translateX(4px);
        }
        
        .activity-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .activity-indicator.complete {
            background: var(--aurora-success-gradient-start);
        }
        
        .activity-indicator.partial {
            background: var(--aurora-warning-gradient-start);
        }
        
        .activity-indicator.pending {
            background: var(--aurora-danger-gradient-start);
        }
        
        .activity-text {
            flex: 1;
        }
        
        .activity-phases {
            display: flex;
            gap: 4px;
        }
        
        .phase-dot {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: white;
        }
        
        .phase-dot.complete {
            background: var(--aurora-success-gradient-start);
        }
        
        .phase-dot.missing {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
    `;
    // SVG icons as strings
    const cascadeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 20h.01"></path>
        <path d="M7 20v-4"></path>
        <path d="M12 20v-8"></path>
        <path d="M17 20v-10"></path>
        <path d="M22 4v16"></path>
    </svg>`;
    const backIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5"></path>
        <path d="M12 19l-7-7 7-7"></path>
    </svg>`;
    const forwardIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"></path>
        <path d="M12 5l7 7-7 7"></path>
    </svg>`;
    const homeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>`;
    const planIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>`;
    const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"></path>
    </svg>`;
    const trendIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>`;
    // Create the body content with improved layout
    const body = `
    <div class="aurora-dashboard">
        <!-- Navigation Bar -->
        <div class="aurora-navigation-bar">
            <button class="aurora-btn aurora-btn-primary nav-button" onclick="navigateBack()" title="Go Back" disabled>
                ${backIcon}
            </button>
            <button class="aurora-btn aurora-btn-primary nav-button" onclick="navigateForward()" title="Go Forward" disabled>
                ${forwardIcon}
            </button>
            <button class="aurora-btn aurora-btn-success nav-button" onclick="navigateHome()" title="Go Home">
                ${homeIcon}
            </button>
            <div class="breadcrumb">
                <span class="breadcrumb-item">Dashboard</span>
            </div>
        </div>
        
        <!-- Header -->
        <div class="aurora-dashboard-header">
            <div class="aurora-logo-section">
                <div class="aurora-logo">
                    ${cascadeIcon}
                </div>
                <div class="aurora-title-section">
                    <h1 class="aurora-main-title">Claude Cascade Dashboard</h1>
                    <p class="aurora-subtitle">Three-Phase Planning System</p>
                </div>
            </div>
        </div>

        <!-- Quick Stats Cards -->
        <div class="aurora-quick-stats">
            <div class="aurora-stat-card">
                <div class="stat-icon">${planIcon}</div>
                <div class="stat-value">${stats.totalPlans}</div>
                <div class="stat-label">Total Plans</div>
            </div>
            <div class="aurora-stat-card">
                <div class="stat-icon">${checkIcon}</div>
                <div class="stat-value">${stats.completedPlans}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="aurora-stat-card">
                <div class="stat-icon">${trendIcon}</div>
                <div class="stat-value">${stats.completionRate}%</div>
                <div class="stat-label">Compliance Rate</div>
            </div>
        </div>

        <!-- Main Compliance Section -->
        <div class="aurora-compliance-section">
            <div class="aurora-compliance-meter">
                <div class="aurora-compliance-ring">
                    <svg width="160" height="160">
                        <circle 
                            stroke="rgba(255, 255, 255, 0.1)"
                            stroke-width="8"
                            fill="transparent"
                            r="72"
                            cx="80"
                            cy="80"
                        />
                        <circle
                            stroke="${stats.completionRate >= 80 ? '#10b981' : stats.completionRate >= 50 ? '#f59e0b' : '#f43f5e'}"
                            stroke-width="8"
                            fill="transparent"
                            stroke-dasharray="${452 * stats.completionRate / 100} 452"
                            stroke-dashoffset="0"
                            r="72"
                            cx="80"
                            cy="80"
                            transform="rotate(-90 80 80)"
                            style="transition: stroke-dasharray 1.5s ease;"
                        />
                    </svg>
                    <div class="aurora-compliance-percentage">${stats.completionRate}%</div>
                </div>
                <div class="aurora-compliance-label">Three-Phase Compliance Rate</div>
                <div class="aurora-compliance-details">
                    <div class="aurora-compliance-stat">
                        <span class="stat-value">${stats.phase1Count}</span>
                        <span class="stat-label">Plans Created</span>
                    </div>
                    <div class="aurora-compliance-stat">
                        <span class="stat-value">${stats.phase2Count}</span>
                        <span class="stat-label">Plans Executed</span>
                    </div>
                    <div class="aurora-compliance-stat">
                        <span class="stat-value">${stats.phase3Count}</span>
                        <span class="stat-label">Plans Verified</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity Feed -->
        <div class="aurora-recent-activity">
            <div class="activity-header">
                <h3 class="activity-title">Recent Plans</h3>
                <button class="aurora-btn aurora-btn-primary" onclick="navigate('phaseTable', { phase: 'pre-execution' })">View All</button>
            </div>
            <div class="activity-list">
                ${stats.recentPlans.map(plan => `
                    <div class="activity-item" onclick="navigate('planViewer', { plan: '${plan.name}' })">
                        <div class="activity-indicator ${plan.phase3 ? 'complete' : plan.phase2 ? 'partial' : 'pending'}"></div>
                        <div class="activity-text">${plan.name.replace(/_/g, ' ')}</div>
                        <div class="activity-phases">
                            <div class="phase-dot ${plan.phase1 ? 'complete' : 'missing'}" title="Phase 1">1</div>
                            <div class="phase-dot ${plan.phase2 ? 'complete' : 'missing'}" title="Phase 2">2</div>
                            <div class="phase-dot ${plan.phase3 ? 'complete' : 'missing'}" title="Phase 3">3</div>
                        </div>
                    </div>
                `).join('')}
                ${stats.recentPlans.length === 0 ? '<div style="text-align: center; opacity: 0.6; padding: 20px;">No plans created yet</div>' : ''}
            </div>
        </div>

        <!-- Phase Cards Section -->
        <div class="aurora-section-header">
            <h2 class="aurora-section-title">PHASE MANAGEMENT</h2>
            <div class="aurora-section-line"></div>
        </div>
        <div class="aurora-phase-cards-container">
            <!-- Phase 1 Card -->
            <div class="aurora-phase-card aurora-phase-1">
                <div class="aurora-phase-header">
                    <div class="aurora-phase-icon">
                        ${planIcon}
                    </div>
                    <div class="aurora-phase-title">Pre-Execution Plans</div>
                </div>
                <div class="aurora-phase-count">${stats.phase1Count}</div>
                <div class="aurora-phase-progress">
                    <div class="aurora-progress-bar" style="width: ${stats.phase1Count > 0 ? '100' : '0'}%;"></div>
                </div>
                <button class="aurora-btn aurora-btn-primary" onclick="navigate('phaseTable', { phase: 'pre-execution' })">View Plans</button>
            </div>
        
            <!-- Phase 2 Card -->
            <div class="aurora-phase-card aurora-phase-2">
                <div class="aurora-phase-header">
                    <div class="aurora-phase-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                    </div>
                    <div class="aurora-phase-title">Post-Execution Reports</div>
                </div>
                <div class="aurora-phase-count">${stats.phase2Count}</div>
                <div class="aurora-phase-progress">
                    <div class="aurora-progress-bar" style="width: ${stats.phase1Count > 0 ? Math.round((stats.phase2Count / stats.phase1Count) * 100) : 0}%;"></div>
                </div>
                <button class="aurora-btn aurora-btn-success" onclick="navigate('phaseTable', { phase: 'post-execution' })">View Executions</button>
            </div>
        
            <!-- Phase 3 Card -->
            <div class="aurora-phase-card aurora-phase-3">
                <div class="aurora-phase-header">
                    <div class="aurora-phase-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="M9 12l2 2 4-4"></path>
                        </svg>
                    </div>
                    <div class="aurora-phase-title">Verification Reports</div>
                </div>
                <div class="aurora-phase-count">${stats.phase3Count}</div>
                <div class="aurora-phase-progress">
                    <div class="aurora-progress-bar" style="width: ${stats.phase1Count > 0 ? Math.round((stats.phase3Count / stats.phase1Count) * 100) : 0}%;"></div>
                </div>
                <button class="aurora-btn aurora-btn-info" onclick="navigate('phaseTable', { phase: 'verification' })">View Verifications</button>
            </div>
        </div>

        <!-- Footer -->
        <div class="aurora-footer">
            <div class="aurora-footer-content">
                <p>Claude Cascade Three-Phase Planning System • Revolutionary Workflow Management</p>
                <div class="aurora-footer-gradient"></div>
            </div>
        </div>
    </div>

    <script>
        // Navigation history management
        let navigationHistory = ['dashboard'];
        let currentIndex = 0;
        
        function navigateBack() {
            if (currentIndex > 0) {
                currentIndex--;
                const view = navigationHistory[currentIndex];
                window.vscode.postMessage({
                    command: 'navigate',
                    view: view
                });
            }
        }
        
        function navigateForward() {
            if (currentIndex < navigationHistory.length - 1) {
                currentIndex++;
                const view = navigationHistory[currentIndex];
                window.vscode.postMessage({
                    command: 'navigate',
                    view: view
                });
            }
        }
        
        function navigateHome() {
            navigationHistory.push('dashboard');
            currentIndex = navigationHistory.length - 1;
            window.vscode.postMessage({
                command: 'navigate',
                view: 'dashboard'
            });
        }
        
        function navigate(view, params) {
            navigationHistory = navigationHistory.slice(0, currentIndex + 1);
            navigationHistory.push(view);
            currentIndex++;
            
            window.vscode.postMessage({
                command: 'navigate',
                view: view,
                params: params
            });
        }
        
        // Update navigation buttons state
        function updateNavigationButtons() {
            const backBtn = document.querySelector('button[onclick="navigateBack()"]');
            const forwardBtn = document.querySelector('button[onclick="navigateForward()"]');
            
            if (backBtn) backBtn.disabled = currentIndex === 0;
            if (forwardBtn) forwardBtn.disabled = currentIndex >= navigationHistory.length - 1;
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            updateNavigationButtons();
            
            // Animate elements on load
            const cards = document.querySelectorAll('.aurora-phase-card, .aurora-stat-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        });
    </script>`;
    return (0, navigation_1.getBaseHtml)('Claude Cascade Dashboard', styles + additionalStyles, body);
}
exports.generateDashboardHtml = generateDashboardHtml;
//# sourceMappingURL=mainDashboard.js.map