// Progress Ring Component with SVG Animations
// Aurora-themed circular progress indicators

import { createSafeElement } from '../security/validation';
import { logActivity } from '../core/state';

export interface ProgressRingOptions {
    size?: number;
    strokeWidth?: number;
    progress?: number;
    color?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
    showPercentage?: boolean;
    showLabel?: boolean;
    label?: string;
    animated?: boolean;
    animationDuration?: number;
    clockwise?: boolean;
    startAngle?: number;
}

export class ProgressRing {
    private container: HTMLElement | null = null;
    private svgElement: SVGElement | null = null;
    private progressCircle: SVGCircleElement | null = null;
    private backgroundCircle: SVGCircleElement | null = null;
    private percentageText: HTMLElement | null = null;
    private labelText: HTMLElement | null = null;
    private progress: number = 0;
    private targetProgress: number = 0;
    private animationFrame: number | null = null;
    private options: Required<ProgressRingOptions>;
    private id: string;
    
    constructor(options: ProgressRingOptions = {}) {
        this.id = `aurora-progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.options = {
            size: options.size || 120,
            strokeWidth: options.strokeWidth || 8,
            progress: options.progress || 0,
            color: options.color || 'primary',
            showPercentage: options.showPercentage !== false,
            showLabel: options.showLabel !== false,
            label: options.label || '',
            animated: options.animated !== false,
            animationDuration: options.animationDuration || 1000,
            clockwise: options.clockwise !== false,
            startAngle: options.startAngle || -90
        };
        
        this.progress = this.options.progress;
        this.targetProgress = this.options.progress;
    }
    
    // Initialize progress ring in container
    initialize(container: HTMLElement) {
        this.container = container;
        
        this.render();
        this.setupAnimations();
        
        logActivity('progressRingInitialized', { 
            id: this.id, 
            progress: this.progress,
            options: this.options 
        });
    }
    
    // Render progress ring UI
    private render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        this.container.className = 'aurora-progress-ring-container';
        
        // Create wrapper
        const wrapper = createSafeElement('div', '', 'aurora-progress-ring-wrapper');
        wrapper.style.width = `${this.options.size}px`;
        wrapper.style.height = `${this.options.size}px`;
        
        // Create SVG element
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.setAttribute('width', this.options.size.toString());
        this.svgElement.setAttribute('height', this.options.size.toString());
        this.svgElement.setAttribute('viewBox', `0 0 ${this.options.size} ${this.options.size}`);
        this.svgElement.classList.add('aurora-progress-ring-svg');
        
        // Calculate circle properties
        const center = this.options.size / 2;
        const radius = (this.options.size - this.options.strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        
        // Create gradient definitions
        this.createGradients();
        
        // Create background circle
        this.backgroundCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.backgroundCircle.setAttribute('cx', center.toString());
        this.backgroundCircle.setAttribute('cy', center.toString());
        this.backgroundCircle.setAttribute('r', radius.toString());
        this.backgroundCircle.setAttribute('fill', 'none');
        this.backgroundCircle.setAttribute('stroke', 'var(--aurora-glass-border)');
        this.backgroundCircle.setAttribute('stroke-width', this.options.strokeWidth.toString());
        this.backgroundCircle.classList.add('aurora-progress-ring-background');
        
        // Create progress circle
        this.progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.progressCircle.setAttribute('cx', center.toString());
        this.progressCircle.setAttribute('cy', center.toString());
        this.progressCircle.setAttribute('r', radius.toString());
        this.progressCircle.setAttribute('fill', 'none');
        this.progressCircle.setAttribute('stroke', `url(#aurora-gradient-${this.id})`);
        this.progressCircle.setAttribute('stroke-width', this.options.strokeWidth.toString());
        this.progressCircle.setAttribute('stroke-linecap', 'round');
        this.progressCircle.setAttribute('stroke-dasharray', circumference.toString());
        this.progressCircle.setAttribute('stroke-dashoffset', circumference.toString());
        this.progressCircle.classList.add('aurora-progress-ring-progress');
        
        // Set rotation for start angle
        const rotation = this.options.clockwise ? this.options.startAngle : -this.options.startAngle;
        this.progressCircle.style.transform = `rotate(${rotation}deg)`;
        this.progressCircle.style.transformOrigin = 'center';
        
        // Add glow effect
        this.progressCircle.style.filter = 'drop-shadow(0 0 6px currentColor)';
        
        // Append circles to SVG
        this.svgElement.appendChild(this.backgroundCircle);
        this.svgElement.appendChild(this.progressCircle);
        
        // Create inner content container
        const innerContent = createSafeElement('div', '', 'aurora-progress-ring-content');
        
        // Add percentage text if enabled
        if (this.options.showPercentage) {
            this.percentageText = createSafeElement('div', '0%', 'aurora-progress-ring-percentage');
            innerContent.appendChild(this.percentageText);
        }
        
        // Add label if provided
        if (this.options.showLabel && this.options.label) {
            this.labelText = createSafeElement('div', this.options.label, 'aurora-progress-ring-label');
            innerContent.appendChild(this.labelText);
        }
        
        // Append elements
        wrapper.appendChild(this.svgElement);
        wrapper.appendChild(innerContent);
        this.container.appendChild(wrapper);
        
        // Set initial progress
        this.updateProgress(this.progress, false);
    }
    
    // Create SVG gradients for Aurora effect
    private createGradients() {
        if (!this.svgElement) return;
        
        // Create defs element
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Create linear gradient
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', `aurora-gradient-${this.id}`);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');
        
        // Get color values based on theme
        const colors = this.getColorValues(this.options.color);
        
        // Create gradient stops
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', colors.start);
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', colors.end);
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        
        // Create animated gradient for pulsing effect
        const animatedGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        animatedGradient.setAttribute('id', `aurora-gradient-animated-${this.id}`);
        animatedGradient.innerHTML = gradient.innerHTML;
        
        const animate1 = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate1.setAttribute('attributeName', 'x1');
        animate1.setAttribute('values', '0%;100%;0%');
        animate1.setAttribute('dur', '3s');
        animate1.setAttribute('repeatCount', 'indefinite');
        
        const animate2 = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate2.setAttribute('attributeName', 'y1');
        animate2.setAttribute('values', '0%;100%;0%');
        animate2.setAttribute('dur', '3s');
        animate2.setAttribute('repeatCount', 'indefinite');
        
        animatedGradient.appendChild(animate1);
        animatedGradient.appendChild(animate2);
        
        defs.appendChild(gradient);
        defs.appendChild(animatedGradient);
        this.svgElement.appendChild(defs);
    }
    
    // Get color values for gradient
    private getColorValues(color: string): { start: string; end: string } {
        const colorMap: Record<string, { start: string; end: string }> = {
            primary: { start: '#7c3aed', end: '#a855f7' },
            success: { start: '#10b981', end: '#14b8a6' },
            danger: { start: '#f43f5e', end: '#ec4899' },
            warning: { start: '#f59e0b', end: '#fb923c' },
            info: { start: '#6366f1', end: '#818cf8' }
        };
        
        return colorMap[color] || colorMap.primary;
    }
    
    // Update progress value
    private updateProgress(value: number, animate: boolean = true) {
        if (!this.progressCircle) return;
        
        // Clamp value between 0 and 100
        value = Math.max(0, Math.min(100, value));
        
        // Calculate circle properties
        const radius = (this.options.size - this.options.strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;
        
        if (animate && this.options.animated) {
            // Animate to new value
            this.targetProgress = value;
            this.animateProgress();
        } else {
            // Set immediately
            this.progress = value;
            this.progressCircle.style.strokeDashoffset = `${offset}`;
            
            // Update percentage text
            if (this.percentageText) {
                this.percentageText.textContent = `${Math.round(value)}%`;
            }
        }
        
        // Add pulse effect at milestones
        if (value === 100) {
            this.addCompletionEffect();
        } else if (value % 25 === 0 && value > 0) {
            this.addMilestoneEffect();
        }
    }
    
    // Animate progress change
    private animateProgress() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const startProgress = this.progress;
        const endProgress = this.targetProgress;
        const duration = this.options.animationDuration;
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out-cubic)
            const eased = 1 - Math.pow(1 - progress, 3);
            
            // Calculate current value
            const currentValue = startProgress + (endProgress - startProgress) * eased;
            this.progress = currentValue;
            
            // Update circle
            if (this.progressCircle) {
                const radius = (this.options.size - this.options.strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (currentValue / 100) * circumference;
                this.progressCircle.style.strokeDashoffset = `${offset}`;
            }
            
            // Update percentage text
            if (this.percentageText) {
                this.percentageText.textContent = `${Math.round(currentValue)}%`;
            }
            
            // Continue animation
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.animationFrame = null;
                logActivity('progressRingAnimationComplete', { 
                    id: this.id, 
                    progress: this.targetProgress 
                });
            }
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    // Setup additional animations
    private setupAnimations() {
        if (!this.progressCircle || !this.options.animated) return;
        
        // Add subtle rotation animation
        this.progressCircle.style.animation = 'aurora-rotate-subtle 20s linear infinite';
    }
    
    // Add completion effect
    private addCompletionEffect() {
        if (!this.container) return;
        
        const ring = this.container.querySelector('.aurora-progress-ring-wrapper');
        if (ring) {
            ring.classList.add('aurora-progress-complete');
            
            // Create celebration particles
            this.createParticles();
            
            setTimeout(() => {
                ring.classList.remove('aurora-progress-complete');
            }, 2000);
        }
        
        logActivity('progressRingComplete', { id: this.id });
    }
    
    // Add milestone effect
    private addMilestoneEffect() {
        if (!this.progressCircle) return;
        
        this.progressCircle.classList.add('aurora-progress-milestone');
        
        setTimeout(() => {
            this.progressCircle?.classList.remove('aurora-progress-milestone');
        }, 500);
    }
    
    // Create particle effects for completion
    private createParticles() {
        if (!this.container) return;
        
        const particleContainer = createSafeElement('div', '', 'aurora-particles');
        
        for (let i = 0; i < 12; i++) {
            const particle = createSafeElement('div', '', 'aurora-particle');
            particle.style.setProperty('--particle-angle', `${i * 30}deg`);
            particle.style.animationDelay = `${i * 50}ms`;
            particleContainer.appendChild(particle);
        }
        
        this.container.appendChild(particleContainer);
        
        setTimeout(() => {
            particleContainer.remove();
        }, 2000);
    }
    
    // Public API methods
    
    // Set progress value
    setProgress(value: number, animate: boolean = true) {
        this.updateProgress(value, animate);
        
        logActivity('progressRingUpdated', { 
            id: this.id, 
            progress: value,
            animated: animate 
        });
    }
    
    // Get current progress
    getProgress(): number {
        return this.progress;
    }
    
    // Reset progress to 0
    reset(animate: boolean = true) {
        this.setProgress(0, animate);
    }
    
    // Set to complete (100%)
    complete(animate: boolean = true) {
        this.setProgress(100, animate);
    }
    
    // Update label
    setLabel(label: string) {
        this.options.label = label;
        if (this.labelText) {
            this.labelText.textContent = label;
        }
    }
    
    // Change color theme
    setColor(color: 'primary' | 'success' | 'danger' | 'warning' | 'info') {
        this.options.color = color;
        
        // Update gradient
        if (this.svgElement) {
            const gradient = this.svgElement.querySelector(`#aurora-gradient-${this.id}`);
            if (gradient) {
                const colors = this.getColorValues(color);
                const stops = gradient.querySelectorAll('stop');
                if (stops[0]) stops[0].setAttribute('stop-color', colors.start);
                if (stops[1]) stops[1].setAttribute('stop-color', colors.end);
            }
        }
    }
    
    // Start indeterminate animation
    startIndeterminate() {
        if (!this.progressCircle) return;
        
        this.progressCircle.classList.add('aurora-progress-indeterminate');
        this.progressCircle.setAttribute('stroke', `url(#aurora-gradient-animated-${this.id})`);
        
        logActivity('progressRingIndeterminate', { id: this.id });
    }
    
    // Stop indeterminate animation
    stopIndeterminate() {
        if (!this.progressCircle) return;
        
        this.progressCircle.classList.remove('aurora-progress-indeterminate');
        this.progressCircle.setAttribute('stroke', `url(#aurora-gradient-${this.id})`);
    }
    
    // Destroy progress ring
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.container = null;
        this.svgElement = null;
        this.progressCircle = null;
        this.backgroundCircle = null;
        this.percentageText = null;
        this.labelText = null;
        
        logActivity('progressRingDestroyed', { id: this.id });
    }
}

// Factory function for creating progress ring groups
export function createProgressRingGroup(rings: Array<{id: string, options: ProgressRingOptions}>): Map<string, ProgressRing> {
    const group = new Map<string, ProgressRing>();
    
    rings.forEach(config => {
        const ring = new ProgressRing(config.options);
        group.set(config.id, ring);
    });
    
    return group;
}

// Export singleton for easy use
const progressRing = new ProgressRing();
export default progressRing;