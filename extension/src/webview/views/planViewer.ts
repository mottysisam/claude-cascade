// Plan Viewer for individual plan documents
import * as fs from 'fs';
import * as path from 'path';
import { getBaseHtml } from '../utils/navigation';
import { ViewType } from '../utils/navigation';
import {
    loadPlanFile,
    extractMarkdownHeaders,
    checkPlanPhaseStatus,
    generateTableOfContents,
    parseMarkdownForInteractivity
} from '../utils/markdownParser';

// Generate the HTML for the plan view
export function generatePlanViewHtml(planPath: string, rootPath: string): string {
    // Load markdown styles
    const markdownStylesPath = path.join(__dirname, '..', 'styles', 'markdown.css');
    const markdownStyles = fs.existsSync(markdownStylesPath) ? fs.readFileSync(markdownStylesPath, 'utf8') : '';
    
    // Load the plan file
    const { content, metadata } = loadPlanFile(planPath);
    
    // Determine which phase this plan is from
    let phase = 'pre-execution';
    let phaseTitle = 'Pre-Execution Plan';
    let phaseIcon = '📋';
    
    if (planPath.includes('2_post_exec_plans')) {
        phase = 'post-execution';
        phaseTitle = 'Post-Execution Report';
        phaseIcon = '⚡';
    } else if (planPath.includes('3_checked_delta_exec_plans')) {
        phase = 'verification';
        phaseTitle = 'Verification Report';
        phaseIcon = '🔍';
    }
    
    // Extract headers for table of contents
    const headers = extractMarkdownHeaders(content);
    const tocHtml = generateTableOfContents(headers);
    
    // Check status of other phases
    const phaseStatus = checkPlanPhaseStatus(planPath);
    
    // Extract plan name for display, using the improved extraction function
    const filename = path.basename(planPath);
    const planNameRaw = extractMarkdownHeaders(content)[0]?.text || 'Unknown Plan';
    let cleanFilename = planNameRaw.replace(/^Pre-Execution Plan: |Post-Execution Report: |Verification Report: /g, '');
    // Fallback to filename if header not found
    if (cleanFilename === 'Unknown Plan') {
        cleanFilename = filename.replace(/^\d{8}_\d{6}_/, '').replace(/_/g, ' ').replace('.md', '');
    }
    
    // Import SVG icons from our professional design system
    const Icons = require('../design-system/icons');
    const { createStatusBadge, createPhaseIndicator } = require('../design-system/icons');

    // Generate related phases section HTML with professional SVG icons
    let relatedPhasesHtml = `
    <div class="related-phases">
        <h3>
            ${Icons.getSvgWithClass('cascade', 'section-icon')} 
            Related Phases
        </h3>
        <div class="phases-grid">
    `;
    
    if (phase === 'pre-execution') {
        // Pre-execution plan with links to related phases if they exist
        relatedPhasesHtml += `
            <div class="related-phase current-phase">
                ${createPhaseIndicator(1, 'complete')}
                <div class="phase-name">Pre-Execution</div>
                ${createStatusBadge('success', 'Current')}
            </div>
            <div class="related-phase ${phaseStatus.phase2 ? '' : 'phase-missing'}">
                ${createPhaseIndicator(2, phaseStatus.phase2 ? 'complete' : 'missing')}
                <div class="phase-name">Post-Execution</div>
                ${phaseStatus.phase2 ? 
                    `<div class="btn btn-sm btn-primary" onclick="navigate('planView', { planPath: '${phaseStatus.phase2Path?.replace(/\\/g, '\\\\')}' })">
                        ${Icons.getSvgWithClass('eye', 'btn-icon')} View
                    </div>` : 
                    createStatusBadge('error', 'Missing')
                }
            </div>
            <div class="related-phase ${phaseStatus.phase3 ? '' : 'phase-missing'}">
                ${createPhaseIndicator(3, phaseStatus.phase3 ? 'complete' : 'missing')}
                <div class="phase-name">Verification</div>
                ${phaseStatus.phase3 ? 
                    `<div class="btn btn-sm btn-primary" onclick="navigate('planView', { planPath: '${phaseStatus.phase3Path?.replace(/\\/g, '\\\\')}' })">
                        ${Icons.getSvgWithClass('eye', 'btn-icon')} View
                    </div>` : 
                    createStatusBadge('error', 'Missing')
                }
            </div>
        `;
    } else if (phase === 'post-execution') {
        // Post-execution report with links to pre-exec and verification
        // We know pre-execution exists since we derived from it
        const plansPath = path.join(rootPath, '.claude', 'plans');
        const phase1Path = path.join(plansPath, '1_pre_exec_plans');
        
        // Try to find the corresponding Phase 1 file
        const planId = filename.replace('_EXECUTED.md', '').split('_').slice(0, 3).join('_');
        let phase1File = '';
        
        if (fs.existsSync(phase1Path)) {
            const phase1Files = fs.readdirSync(phase1Path)
                .filter(file => file.includes(planId) && file.endsWith('.md'));
            
            if (phase1Files.length > 0) {
                phase1File = path.join(phase1Path, phase1Files[0]);
            }
        }
        
        relatedPhasesHtml += `
            <div class="related-phase">
                <div class="phase-icon">📋</div>
                <div class="phase-name">Pre-Execution</div>
                ${phase1File ? 
                    `<div class="status-indicator status-complete" onclick="navigate('planView', { planPath: '${phase1File.replace(/\\/g, '\\\\')}' })">
                        <span class="indicator-icon">✓</span> View
                    </div>` : 
                    `<div class="status-indicator status-missing">
                        <span class="indicator-icon">✗</span> Missing
                    </div>`
                }
            </div>
            <div class="related-phase current-phase">
                <div class="phase-icon">⚡</div>
                <div class="phase-name">Post-Execution</div>
                <div class="status-indicator status-complete">
                    <span class="indicator-icon">✓</span> Current
                </div>
            </div>
            <div class="related-phase ${phaseStatus.phase3 ? '' : 'phase-missing'}">
                <div class="phase-icon">🔍</div>
                <div class="phase-name">Verification</div>
                ${phaseStatus.phase3 ? 
                    `<div class="status-indicator status-complete" onclick="navigate('planView', { planPath: '${phaseStatus.phase3Path?.replace(/\\/g, '\\\\')}' })">
                        <span class="indicator-icon">✓</span> View
                    </div>` : 
                    `<div class="status-indicator status-missing">
                        <span class="indicator-icon">✗</span> Missing
                    </div>`
                }
            </div>
        `;
    } else if (phase === 'verification') {
        // Verification report with links to pre-exec and post-exec
        const plansPath = path.join(rootPath, '.claude', 'plans');
        const phase1Path = path.join(plansPath, '1_pre_exec_plans');
        const phase2Path = path.join(plansPath, '2_post_exec_plans');
        
        // Find the corresponding Phase 1 and 2 files
        const planId = filename.replace('_VERIFICATION.md', '').split('_').slice(0, 3).join('_');
        let phase1File = '';
        let phase2File = '';
        
        if (fs.existsSync(phase1Path)) {
            const phase1Files = fs.readdirSync(phase1Path)
                .filter(file => file.includes(planId) && file.endsWith('.md'));
            
            if (phase1Files.length > 0) {
                phase1File = path.join(phase1Path, phase1Files[0]);
            }
        }
        
        if (fs.existsSync(phase2Path)) {
            const phase2Files = fs.readdirSync(phase2Path)
                .filter(file => file.includes(planId) && file.includes('EXECUTED'));
            
            if (phase2Files.length > 0) {
                phase2File = path.join(phase2Path, phase2Files[0]);
            }
        }
        
        relatedPhasesHtml += `
            <div class="related-phase">
                <div class="phase-icon">📋</div>
                <div class="phase-name">Pre-Execution</div>
                ${phase1File ? 
                    `<div class="status-indicator status-complete" onclick="navigate('planView', { planPath: '${phase1File.replace(/\\/g, '\\\\')}' })">
                        <span class="indicator-icon">✓</span> View
                    </div>` : 
                    `<div class="status-indicator status-missing">
                        <span class="indicator-icon">✗</span> Missing
                    </div>`
                }
            </div>
            <div class="related-phase">
                <div class="phase-icon">⚡</div>
                <div class="phase-name">Post-Execution</div>
                ${phase2File ? 
                    `<div class="status-indicator status-complete" onclick="navigate('planView', { planPath: '${phase2File.replace(/\\/g, '\\\\')}' })">
                        <span class="indicator-icon">✓</span> View
                    </div>` : 
                    `<div class="status-indicator status-missing">
                        <span class="indicator-icon">✗</span> Missing
                    </div>`
                }
            </div>
            <div class="related-phase current-phase">
                <div class="phase-icon">🔍</div>
                <div class="phase-name">Verification</div>
                <div class="status-indicator status-complete">
                    <span class="indicator-icon">✓</span> Current
                </div>
            </div>
        `;
    }
    
    relatedPhasesHtml += `
        </div>
    </div>`;
    
    // Process markdown for interactive elements
    const processedContent = parseMarkdownForInteractivity(content);
    
    // Generate the page body
    const body = `
    <div class="breadcrumbs">
        <span class="breadcrumb-item" onclick="navigate('main')">Dashboard</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item" onclick="navigate('phaseTable', { phase: '${phase}' })">${phaseTitle}s</span>
        <span class="breadcrumb-separator">›</span>
        <span>${cleanFilename}</span>
    </div>

    <div class="header">
        <div class="logo">${phaseIcon}</div>
        <div class="title">${metadata.title || cleanFilename}</div>
    </div>
    
    <div class="plan-viewer-container">
        <div class="main-content">
            ${relatedPhasesHtml}
            
            <div class="markdown-body">
                ${processedContent}
            </div>
            
            <div class="plan-actions">
                ${phase === 'pre-execution' && !phaseStatus.phase2 ? 
                    `<button class="btn" onclick="executeCommand('completeExecution')">Complete Execution ⚡</button>` : ''
                }
                ${phase === 'post-execution' && !phaseStatus.phase3 ? 
                    `<button class="btn" onclick="executeCommand('verify')">Verify Implementation 🔍</button>` : ''
                }
                <button class="btn secondary" onclick="navigate('phaseTable', { phase: '${phase}' })">Back to List</button>
            </div>
        </div>
        
        <div class="markdown-toc">
            <h3 class="toc-title">Table of Contents</h3>
            ${tocHtml}
        </div>
    </div>
    
    <div class="toc-toggle-btn" onclick="toggleTOC()">≡</div>
    
    <div class="footer">
        Claude Cascade Three-Phase Planning System • Revolutionary Workflow Management
    </div>
    
    <script>
        // Make headings collapsible
        document.addEventListener('DOMContentLoaded', function() {
            // Add collapsible behavior to headings
            const headingWrappers = document.querySelectorAll('.heading-wrapper');
            headingWrappers.forEach(wrapper => {
                wrapper.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    this.classList.toggle('collapsed');
                    content.classList.toggle('collapsed');
                });
            });
            
            // Table of Contents toggle
            const tocToggleBtn = document.querySelector('.toc-toggle-btn');
            const toc = document.querySelector('.markdown-toc');
            
            if (toc) {
                toc.classList.add('visible'); // Start with TOC visible
            }
        });
        
        function toggleTOC() {
            const toc = document.querySelector('.markdown-toc');
            if (toc) {
                toc.classList.toggle('visible');
            }
        }
    </script>`;
    
    // Add styles specific to plan viewer
    const customStyles = `
    .plan-viewer-container {
        display: flex;
        margin: 20px 0;
    }
    
    .main-content {
        flex: 1;
        padding-right: 20px;
    }
    
    .plan-actions {
        margin-top: 30px;
        display: flex;
        gap: 10px;
    }
    
    /* Related phases section */
    .related-phases {
        margin-bottom: 30px;
        padding: 15px;
        border-radius: 8px;
        background: rgba(var(--vscode-editor-background-rgb, 30,30,30), 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(var(--vscode-panel-border-rgb, 60,60,60), 0.3);
    }
    
    .phases-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }
    
    .related-phase {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px;
        border-radius: 6px;
        background: rgba(var(--vscode-editor-background-rgb, 30,30,30), 0.4);
        border: 1px solid rgba(var(--vscode-panel-border-rgb, 60,60,60), 0.2);
        transition: all 0.2s ease;
    }
    
    .related-phase:hover:not(.phase-missing) {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .current-phase {
        background: rgba(var(--vscode-textLink-foreground-rgb, 40,120,220), 0.1);
        border: 1px solid rgba(var(--vscode-textLink-foreground-rgb, 40,120,220), 0.3);
    }
    
    .phase-missing {
        opacity: 0.6;
    }
    
    .phase-icon {
        font-size: 24px;
        margin-bottom: 10px;
    }
    
    .phase-name {
        font-weight: 500;
        margin-bottom: 10px;
    }
    
    /* Button styles */
    .btn.secondary {
        background-color: rgba(var(--vscode-button-secondaryBackground-rgb, 60,60,60), 0.8);
        color: var(--vscode-button-secondaryForeground);
    }
    
    .btn.secondary:hover {
        background-color: var(--vscode-button-secondaryHoverBackground);
    }
    `;
    
    // Combine all styles
    const allStyles = markdownStyles + customStyles;
    
    return getBaseHtml(`Claude Cascade - ${metadata.title || cleanFilename}`, allStyles, body);
}