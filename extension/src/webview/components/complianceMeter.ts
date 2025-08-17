// Compliance Meter Component with Animated Rings
// Aurora-themed compliance visualization using SVG

import { createSafeElement } from '../security/validation';
import { logActivity } from '../core/state';
import { ProgressRing } from './progressRing';

export interface ComplianceData {
    phase1Compliance: number;
    phase2Compliance: number;
    phase3Compliance: number;
    overallCompliance: number;
    violations: number;
    successfulChecks: number;
    totalChecks: number;
}

export interface ComplianceMeterOptions {
    size?: number;
    showDetails?: boolean;
    showLegend?: boolean;
    animated?: boolean;
    showViolations?: boolean;
    updateInterval?: number;
}

export class ComplianceMeter {
    private container: HTMLElement | null = null;
    private svgElement: SVGElement | null = null;
    private rings: Map<string, ProgressRing> = new Map();
    private data: ComplianceData;
    private options: Required<ComplianceMeterOptions>;
    private updateTimer: number | null = null;
    private id: string;
    
    constructor(options: ComplianceMeterOptions = {}) {
        this.id = `aurora-compliance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.options = {
            size: options.size || 300,
            showDetails: options.showDetails !== false,
            showLegend: options.showLegend !== false,
            animated: options.animated !== false,
            showViolations: options.showViolations !== false,
            updateInterval: options.updateInterval || 0
        };
        
        this.data = {
            phase1Compliance: 0,
            phase2Compliance: 0,
            phase3Compliance: 0,
            overallCompliance: 0,
            violations: 0,
            successfulChecks: 0,
            totalChecks: 0
        };
    }
    
    // Initialize compliance meter
    initialize(container: HTMLElement, data?: ComplianceData) {
        this.container = container;
        if (data) {
            this.data = data;
        }
        
        this.render();
        this.setupUpdateTimer();
        
        logActivity('complianceMeterInitialized', { 
            id: this.id, 
            data: this.data 
        });
    }
    
    // Render compliance meter UI
    private render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        this.container.className = 'aurora-compliance-meter-container';
        
        // Create main wrapper
        const wrapper = createSafeElement('div', '', 'aurora-compliance-meter-wrapper');
        wrapper.style.width = `${this.options.size}px`;
        
        // Create rings container
        const ringsContainer = createSafeElement('div', '', 'aurora-compliance-rings');
        ringsContainer.style.position = 'relative';
        ringsContainer.style.height = `${this.options.size}px`;
        
        // Create concentric rings for each phase
        this.createPhaseRings(ringsContainer);
        
        // Create center display
        const centerDisplay = this.createCenterDisplay();
        ringsContainer.appendChild(centerDisplay);
        
        wrapper.appendChild(ringsContainer);
        
        // Add details section if enabled
        if (this.options.showDetails) {
            const details = this.createDetailsSection();
            wrapper.appendChild(details);
        }
        
        // Add legend if enabled
        if (this.options.showLegend) {
            const legend = this.createLegend();
            wrapper.appendChild(legend);
        }
        
        // Add violations indicator if enabled
        if (this.options.showViolations && this.data.violations > 0) {
            const violations = this.createViolationsIndicator();
            wrapper.appendChild(violations);
        }
        
        this.container.appendChild(wrapper);
        
        // Animate values
        if (this.options.animated) {
            this.animateValues();
        }
    }
    
    // Create concentric phase rings
    private createPhaseRings(container: HTMLElement) {
        const phases = [
            { id: 'phase1', label: 'Phase 1', value: this.data.phase1Compliance, color: 'primary' },
            { id: 'phase2', label: 'Phase 2', value: this.data.phase2Compliance, color: 'info' },
            { id: 'phase3', label: 'Phase 3', value: this.data.phase3Compliance, color: 'success' }
        ];
        
        phases.forEach((phase, index) => {
            const ringSize = this.options.size - (index * 40);
            const ringContainer = createSafeElement('div', '', 'aurora-compliance-ring-container');
            ringContainer.style.position = 'absolute';
            ringContainer.style.top = '50%';
            ringContainer.style.left = '50%';
            ringContainer.style.transform = 'translate(-50%, -50%)';
            ringContainer.style.width = `${ringSize}px`;
            ringContainer.style.height = `${ringSize}px`;
            
            const ring = new ProgressRing({
                size: ringSize,
                strokeWidth: 12 - (index * 2),
                progress: phase.value,
                color: phase.color as any,
                showPercentage: false,
                showLabel: false,
                animated: this.options.animated
            });
            
            ring.initialize(ringContainer);
            this.rings.set(phase.id, ring);
            
            container.appendChild(ringContainer);
        });
    }
    
    // Create center display
    private createCenterDisplay(): HTMLElement {
        const center = createSafeElement('div', '', 'aurora-compliance-center');
        center.style.position = 'absolute';
        center.style.top = '50%';
        center.style.left = '50%';
        center.style.transform = 'translate(-50%, -50%)';
        
        // Overall compliance percentage
        const percentage = createSafeElement('div', '', 'aurora-compliance-percentage');
        percentage.innerHTML = `
            <span class="aurora-compliance-value">${Math.round(this.data.overallCompliance)}</span>
            <span class="aurora-compliance-symbol">%</span>
        `;
        
        // Compliance label
        const label = createSafeElement('div', 'Overall Compliance', 'aurora-compliance-label');
        
        // Status indicator
        const status = this.getComplianceStatus();
        const statusEl = createSafeElement('div', status.text, 'aurora-compliance-status');
        statusEl.classList.add(`status-${status.level}`);
        
        center.appendChild(percentage);
        center.appendChild(label);
        center.appendChild(statusEl);
        
        return center;
    }
    
    // Create details section
    private createDetailsSection(): HTMLElement {
        const details = createSafeElement('div', '', 'aurora-compliance-details');
        
        // Phase breakdown
        const phases = [
            { label: 'Pre-Execution', value: this.data.phase1Compliance, color: 'var(--aurora-primary)' },
            { label: 'Post-Execution', value: this.data.phase2Compliance, color: 'var(--aurora-info)' },
            { label: 'Verification', value: this.data.phase3Compliance, color: 'var(--aurora-success)' }
        ];
        
        phases.forEach(phase => {
            const item = createSafeElement('div', '', 'aurora-compliance-detail-item');
            
            const labelEl = createSafeElement('span', phase.label, 'aurora-compliance-detail-label');
            const valueEl = createSafeElement('span', `${Math.round(phase.value)}%`, 'aurora-compliance-detail-value');
            valueEl.style.color = phase.color;
            
            const barContainer = createSafeElement('div', '', 'aurora-compliance-detail-bar-container');
            const bar = createSafeElement('div', '', 'aurora-compliance-detail-bar');
            bar.style.width = `${phase.value}%`;
            bar.style.background = phase.color;
            barContainer.appendChild(bar);
            
            item.appendChild(labelEl);
            item.appendChild(valueEl);
            item.appendChild(barContainer);
            
            details.appendChild(item);
        });
        
        // Success rate
        if (this.data.totalChecks > 0) {
            const successRate = (this.data.successfulChecks / this.data.totalChecks) * 100;
            const successItem = createSafeElement('div', '', 'aurora-compliance-detail-item');
            
            const successLabel = createSafeElement('span', 'Success Rate', 'aurora-compliance-detail-label');
            const successValue = createSafeElement('span', `${Math.round(successRate)}%`, 'aurora-compliance-detail-value');
            const successText = createSafeElement('span', `(${this.data.successfulChecks}/${this.data.totalChecks} checks)`, 'aurora-compliance-detail-text');
            
            successItem.appendChild(successLabel);
            successItem.appendChild(successValue);
            successItem.appendChild(successText);
            
            details.appendChild(successItem);
        }
        
        return details;
    }
    
    // Create legend
    private createLegend(): HTMLElement {
        const legend = createSafeElement('div', '', 'aurora-compliance-legend');
        
        const items = [
            { label: 'Phase 1: Pre-Execution', color: 'var(--aurora-primary)' },
            { label: 'Phase 2: Post-Execution', color: 'var(--aurora-info)' },
            { label: 'Phase 3: Verification', color: 'var(--aurora-success)' }
        ];
        
        items.forEach(item => {
            const legendItem = createSafeElement('div', '', 'aurora-compliance-legend-item');
            
            const dot = createSafeElement('span', '', 'aurora-compliance-legend-dot');
            dot.style.background = item.color;
            
            const label = createSafeElement('span', item.label, 'aurora-compliance-legend-label');
            
            legendItem.appendChild(dot);
            legendItem.appendChild(label);
            legend.appendChild(legendItem);
        });
        
        return legend;
    }
    
    // Create violations indicator
    private createViolationsIndicator(): HTMLElement {
        const violations = createSafeElement('div', '', 'aurora-compliance-violations');
        
        if (this.data.violations > 0) {
            violations.classList.add('has-violations');
            
            const icon = createSafeElement('span', '⚠', 'aurora-compliance-violations-icon');
            const count = createSafeElement('span', this.data.violations.toString(), 'aurora-compliance-violations-count');
            const label = createSafeElement('span', this.data.violations === 1 ? 'Violation' : 'Violations', 'aurora-compliance-violations-label');
            
            violations.appendChild(icon);
            violations.appendChild(count);
            violations.appendChild(label);
            
            // Add pulse animation for attention
            violations.classList.add('aurora-pulse');
        }
        
        return violations;
    }
    
    // Get compliance status based on percentage
    private getComplianceStatus(): { text: string; level: string } {
        const compliance = this.data.overallCompliance;
        
        if (compliance >= 95) {
            return { text: 'Excellent', level: 'excellent' };
        } else if (compliance >= 80) {
            return { text: 'Good', level: 'good' };
        } else if (compliance >= 60) {
            return { text: 'Fair', level: 'fair' };
        } else if (compliance >= 40) {
            return { text: 'Poor', level: 'poor' };
        } else {
            return { text: 'Critical', level: 'critical' };
        }
    }
    
    // Animate values
    private animateValues() {
        // Animate rings
        this.rings.forEach((ring, id) => {
            const value = id === 'phase1' ? this.data.phase1Compliance :
                         id === 'phase2' ? this.data.phase2Compliance :
                         this.data.phase3Compliance;
            ring.setProgress(value, true);
        });
        
        // Animate center value
        const centerValue = this.container?.querySelector('.aurora-compliance-value');
        if (centerValue) {
            this.animateNumber(centerValue as HTMLElement, 0, this.data.overallCompliance, 1500);
        }
    }
    
    // Animate number
    private animateNumber(element: HTMLElement, start: number, end: number, duration: number) {
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            
            const current = start + (end - start) * eased;
            element.textContent = Math.round(current).toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // Setup update timer
    private setupUpdateTimer() {
        if (this.options.updateInterval > 0) {
            this.updateTimer = window.setInterval(() => {
                this.refresh();
            }, this.options.updateInterval);
        }
    }
    
    // Public API methods
    
    // Update compliance data
    updateData(data: Partial<ComplianceData>) {
        Object.assign(this.data, data);
        
        // Recalculate overall compliance if phases updated
        if ('phase1Compliance' in data || 'phase2Compliance' in data || 'phase3Compliance' in data) {
            this.data.overallCompliance = (
                this.data.phase1Compliance + 
                this.data.phase2Compliance + 
                this.data.phase3Compliance
            ) / 3;
        }
        
        this.render();
        
        logActivity('complianceMeterUpdated', { 
            id: this.id, 
            data: this.data 
        });
    }
    
    // Refresh display
    refresh() {
        if (this.options.animated) {
            this.animateValues();
        } else {
            this.render();
        }
    }
    
    // Add violation
    addViolation() {
        this.data.violations++;
        this.data.totalChecks++;
        this.updateData(this.data);
    }
    
    // Add successful check
    addSuccessfulCheck() {
        this.data.successfulChecks++;
        this.data.totalChecks++;
        this.updateData(this.data);
    }
    
    // Reset violations
    resetViolations() {
        this.data.violations = 0;
        this.updateData(this.data);
    }
    
    // Get current data
    getData(): ComplianceData {
        return { ...this.data };
    }
    
    // Destroy meter
    destroy() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.rings.forEach(ring => ring.destroy());
        this.rings.clear();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.container = null;
        this.svgElement = null;
        
        logActivity('complianceMeterDestroyed', { id: this.id });
    }
}

// Export singleton for easy use
const complianceMeter = new ComplianceMeter();
export default complianceMeter;