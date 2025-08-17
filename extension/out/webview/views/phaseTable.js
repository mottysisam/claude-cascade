"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePhaseTableHtml = void 0;
// Phase Table View
const fs = require("fs");
const path = require("path");
const navigation_1 = require("../utils/navigation");
const markdownParser_1 = require("../utils/markdownParser");
// Get plans for a specific phase
function getPhasePlans(rootPath, phase) {
    const plansPath = path.join(rootPath, '.claude', 'plans');
    if (!fs.existsSync(plansPath)) {
        return [];
    }
    let phasePath = '';
    let phaseFileFilter = '';
    let phaseTitle = '';
    switch (phase) {
        case 'pre-execution':
            phasePath = path.join(plansPath, '1_pre_exec_plans');
            phaseTitle = 'Pre-Execution Plans';
            break;
        case 'post-execution':
            phasePath = path.join(plansPath, '2_post_exec_plans');
            phaseFileFilter = 'EXECUTED';
            phaseTitle = 'Post-Execution Reports';
            break;
        case 'verification':
            phasePath = path.join(plansPath, '3_checked_delta_exec_plans');
            phaseFileFilter = 'VERIFICATION';
            phaseTitle = 'Verification Reports';
            break;
        default:
            return [];
    }
    if (!fs.existsSync(phasePath)) {
        return { plans: [], phaseTitle };
    }
    const files = fs.readdirSync(phasePath)
        .filter(file => file.endsWith('.md') && !file.startsWith('TEMPLATE') &&
        (phaseFileFilter ? file.includes(phaseFileFilter) : true))
        .sort()
        .reverse(); // Most recent first
    const plans = files.map(file => {
        const filePath = path.join(phasePath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const planName = extractPlanName(file);
        const timestamp = extractTimestamp(file);
        const planId = extractPlanId(file);
        const preview = (0, markdownParser_1.getMarkdownPreview)(content, 150);
        // Get status of related phases
        let phaseStatus = {
            phase1: true,
            phase2: false,
            phase3: false
        };
        if (phase === 'pre-execution') {
            const status = (0, markdownParser_1.checkPlanPhaseStatus)(filePath);
            phaseStatus.phase2 = status.phase2;
            phaseStatus.phase3 = status.phase3;
        }
        else if (phase === 'post-execution') {
            phaseStatus.phase1 = true; // If we have phase 2, we should have phase 1
            // Extract plan name without timestamp for more robust matching
            const planName = extractPlanId(file);
            const phase3Path = path.join(plansPath, '3_checked_delta_exec_plans');
            if (fs.existsSync(phase3Path)) {
                const phase3Files = fs.readdirSync(phase3Path)
                    .filter(f => {
                    const candidateName = extractPlanId(f);
                    return candidateName === planName && f.includes('VERIFICATION');
                });
                phaseStatus.phase3 = phase3Files.length > 0;
            }
        }
        else if (phase === 'verification') {
            // If we have phase 3, we should have phase 1 and 2
            phaseStatus.phase1 = true;
            phaseStatus.phase2 = true;
        }
        return {
            name: planName,
            timestamp,
            planId,
            filePath,
            preview,
            status: phaseStatus
        };
    });
    return { plans, phaseTitle };
}
function extractPlanName(filename) {
    // Extract readable name from filename like "20250816_123456_USER_AUTHENTICATION.md"
    const nameMatch = filename.match(/^\d{8}_\d{6}_(.+?)(\.md|_EXECUTED\.md|_VERIFICATION\.md)$/);
    if (nameMatch) {
        return nameMatch[1]
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ')
            .replace('Executed', '')
            .replace('Verification', '')
            .trim();
    }
    return filename.replace('.md', '');
}
function extractTimestamp(filename) {
    // Extract timestamp from filename like "20250816_123456_USER_AUTHENTICATION.md"
    const dateMatch = filename.match(/^(\d{8})_(\d{6})_/);
    if (dateMatch) {
        const year = dateMatch[1].substring(0, 4);
        const month = dateMatch[1].substring(4, 6);
        const day = dateMatch[1].substring(6, 8);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[parseInt(month) - 1]} ${year}`;
    }
    return '';
}
function extractPlanId(filename) {
    // Use the improved extraction function from markdownParser
    // This ensures consistent plan ID extraction across the app
    return filename.split('_').slice(2).join('_').replace(/\.md$|_EXECUTED$|_VERIFICATION$/g, '');
}
// Generate the HTML for the phase table view
function generatePhaseTableHtml(phase, rootPath) {
    // Get CSS from the tables styles
    const tablesStylesPath = path.join(__dirname, '..', 'styles', 'tables.css');
    const tablesStyles = fs.existsSync(tablesStylesPath) ? fs.readFileSync(tablesStylesPath, 'utf8') : '';
    const plansData = getPhasePlans(rootPath, phase);
    const plans = Array.isArray(plansData) ? plansData : plansData.plans;
    const phaseTitle = Array.isArray(plansData) ? '' : plansData.phaseTitle;
    let phaseIcon = '📋';
    switch (phase) {
        case 'post-execution':
            phaseIcon = '⚡';
            break;
        case 'verification':
            phaseIcon = '🔍';
            break;
    }
    const body = `
    <div class="breadcrumbs">
        <span class="breadcrumb-item" onclick="navigate('main')">Dashboard</span>
        <span class="breadcrumb-separator">›</span>
        <span>${phaseTitle}</span>
    </div>

    <div class="header">
        <div class="logo">${phaseIcon}</div>
        <div class="title">${phaseTitle}</div>
    </div>
    
    <div class="table-container">
        <div class="table-controls">
            <div class="search-bar">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" placeholder="Search plans..." id="search-input">
            </div>
            <select class="filter-select" id="filter-select">
                <option value="all">All</option>
                <option value="complete">Complete</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
            </select>
        </div>
        
        ${plans.length > 0 ? `
        <table class="plans-table">
            <thead>
                <tr>
                    <th class="sort-asc" data-sort="name">Plan Name <span class="sort-indicator">▴</span></th>
                    <th data-sort="date">Created <span class="sort-indicator">▴</span></th>
                    <th>Status Indicators</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${plans.map((plan) => `
                <tr>
                    <td class="plan-name-cell" onclick="navigate('planView', { planPath: '${plan.filePath.replace(/\\/g, '\\\\')}'})">
                        <span class="plan-name">${plan.name}</span>
                        <div class="plan-preview">
                            <h4>${plan.name}</h4>
                            <div class="plan-preview-content">${plan.preview}</div>
                        </div>
                    </td>
                    <td>${plan.timestamp}</td>
                    <td>
                        <div class="status-indicators">
                            ${renderStatusIndicator(plan.status.phase1, 'Phase 1', phase === 'pre-execution')}
                            ${renderStatusIndicator(plan.status.phase2, 'Phase 2', phase === 'post-execution')}
                            ${renderStatusIndicator(plan.status.phase3, 'Phase 3', phase === 'verification')}
                        </div>
                    </td>
                    <td class="actions-cell">
                        <div class="action-btn" onclick="navigate('planView', { planPath: '${plan.filePath.replace(/\\/g, '\\\\')}'})" title="View Plan">
                            👁️
                        </div>
                        ${phase === 'pre-execution' && !plan.status.phase2 ?
        `<div class="action-btn" onclick="executeCommand('completeExecution')" title="Complete Execution">⚡</div>` : ''}
                        ${phase === 'post-execution' && !plan.status.phase3 ?
        `<div class="action-btn" onclick="executeCommand('verify')" title="Verify">🔍</div>` : ''}
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : `
        <div class="empty-state">
            <div class="empty-state-icon">${phaseIcon}</div>
            <p>No ${phaseTitle.toLowerCase()} found.</p>
            ${phase === 'pre-execution' ? `
            <button class="btn" onclick="executeCommand('createPlan')">Create New Plan</button>
            ` : ''}
        </div>
        `}
    </div>
    
    <div class="footer">
        Claude Cascade Three-Phase Planning System • Revolutionary Workflow Management
    </div>
    
    <script>
        // Search and filter functionality
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('search-input');
            const filterSelect = document.getElementById('filter-select');
            const tableRows = document.querySelectorAll('.plans-table tbody tr');
            
            // Search functionality
            if (searchInput) {
                searchInput.addEventListener('input', filterTable);
            }
            
            // Filter dropdown
            if (filterSelect) {
                filterSelect.addEventListener('change', filterTable);
            }
            
            // Sort functionality
            const sortHeaders = document.querySelectorAll('.plans-table th[data-sort]');
            sortHeaders.forEach(header => {
                header.addEventListener('click', function() {
                    const sortField = this.getAttribute('data-sort');
                    const isAsc = this.classList.contains('sort-asc');
                    
                    // Remove sort classes from all headers
                    sortHeaders.forEach(h => {
                        h.classList.remove('sort-asc', 'sort-desc');
                    });
                    
                    // Add sort class to current header
                    this.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
                    
                    // Sort the table
                    sortTable(sortField, !isAsc);
                });
            });
            
            function filterTable() {
                const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
                const filterValue = filterSelect ? filterSelect.value : 'all';
                
                tableRows.forEach(row => {
                    const planName = row.querySelector('.plan-name-cell').textContent.toLowerCase();
                    const statusCells = row.querySelectorAll('.status-indicator');
                    
                    // Check if it matches the search
                    const matchesSearch = planName.includes(searchValue);
                    
                    // Check if it matches the filter
                    let matchesFilter = filterValue === 'all';
                    
                    if (filterValue === 'complete') {
                        matchesFilter = Array.from(statusCells).every(cell => cell.classList.contains('status-complete'));
                    } else if (filterValue === 'partial') {
                        const hasComplete = Array.from(statusCells).some(cell => cell.classList.contains('status-complete'));
                        const hasMissing = Array.from(statusCells).some(cell => cell.classList.contains('status-missing'));
                        matchesFilter = hasComplete && hasMissing;
                    } else if (filterValue === 'pending') {
                        matchesFilter = Array.from(statusCells).some(cell => cell.classList.contains('status-missing'));
                    }
                    
                    row.style.display = matchesSearch && matchesFilter ? '' : 'none';
                });
            }
            
            function sortTable(field, ascending) {
                const tbody = document.querySelector('.plans-table tbody');
                const rows = Array.from(tableRows);
                
                rows.sort((a, b) => {
                    let valA, valB;
                    
                    if (field === 'name') {
                        valA = a.querySelector('.plan-name-cell').textContent.trim();
                        valB = b.querySelector('.plan-name-cell').textContent.trim();
                    } else if (field === 'date') {
                        valA = a.cells[1].textContent.trim();
                        valB = b.cells[1].textContent.trim();
                    }
                    
                    if (ascending) {
                        return valA.localeCompare(valB);
                    } else {
                        return valB.localeCompare(valA);
                    }
                });
                
                // Re-append rows in sorted order
                rows.forEach(row => tbody.appendChild(row));
            }
        });
    </script>`;
    return (0, navigation_1.getBaseHtml)(`Claude Cascade - ${phaseTitle}`, tablesStyles, body);
}
exports.generatePhaseTableHtml = generatePhaseTableHtml;
// Helper to render status indicator
function renderStatusIndicator(status, label, isCurrentPhase) {
    if (isCurrentPhase) {
        return `<span class="status-indicator status-complete">
            <span class="indicator-icon">✓</span> ${label}
        </span>`;
    }
    else if (status) {
        return `<span class="status-indicator status-complete">
            <span class="indicator-icon">✓</span> ${label}
        </span>`;
    }
    else {
        return `<span class="status-indicator status-missing">
            <span class="indicator-icon">✗</span> ${label}
        </span>`;
    }
}
//# sourceMappingURL=phaseTable.js.map