// Toggle Switch Component with Aurora Theme
// Smooth animated toggle switches with state management

import { createSafeElement } from '../security/validation';
import { logActivity } from '../core/state';

export interface ToggleOptions {
    label?: string;
    labelPosition?: 'left' | 'right';
    size?: 'small' | 'medium' | 'large';
    color?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
    disabled?: boolean;
    checked?: boolean;
    showStatus?: boolean;
    animationDuration?: number;
    onChange?: (checked: boolean) => void;
}

export class ToggleSwitch {
    private container: HTMLElement | null = null;
    private inputElement: HTMLInputElement | null = null;
    private isChecked: boolean = false;
    private isDisabled: boolean = false;
    private options: Required<Omit<ToggleOptions, 'onChange'>> & { onChange?: (checked: boolean) => void };
    private onChange: ((checked: boolean) => void) | null = null;
    private id: string;
    
    constructor(options: ToggleOptions = {}) {
        this.id = `aurora-toggle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.options = {
            label: options.label || '',
            labelPosition: options.labelPosition || 'right',
            size: options.size || 'medium',
            color: options.color || 'primary',
            disabled: options.disabled || false,
            checked: options.checked || false,
            showStatus: options.showStatus !== false,
            animationDuration: options.animationDuration || 300,
            onChange: options.onChange
        };
        
        this.isChecked = this.options.checked;
        this.isDisabled = this.options.disabled;
    }
    
    // Initialize toggle in container
    initialize(container: HTMLElement, onChange?: (checked: boolean) => void) {
        this.container = container;
        this.onChange = onChange || null;
        
        this.render();
        this.setupEventListeners();
        
        logActivity('toggleInitialized', { 
            id: this.id, 
            checked: this.isChecked,
            options: this.options 
        });
    }
    
    // Render toggle UI
    private render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        this.container.className = `aurora-toggle-container aurora-toggle-${this.options.size}`;
        
        // Create wrapper for layout
        const wrapper = createSafeElement('div', '', 'aurora-toggle-wrapper');
        if (this.options.labelPosition === 'left') {
            wrapper.classList.add('label-left');
        }
        
        // Create label if provided
        if (this.options.label) {
            const label = createSafeElement('label', this.options.label, 'aurora-toggle-label');
            label.setAttribute('for', this.id);
            if (this.isDisabled) {
                label.classList.add('disabled');
            }
            
            if (this.options.labelPosition === 'left') {
                wrapper.appendChild(label);
            }
        }
        
        // Create toggle container
        const toggleContainer = createSafeElement('div', '', 'aurora-toggle');
        toggleContainer.classList.add(`aurora-toggle-${this.options.color}`);
        if (this.isDisabled) {
            toggleContainer.classList.add('disabled');
        }
        
        // Create hidden checkbox input
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'checkbox';
        this.inputElement.id = this.id;
        this.inputElement.className = 'aurora-toggle-input';
        this.inputElement.checked = this.isChecked;
        this.inputElement.disabled = this.isDisabled;
        this.inputElement.setAttribute('aria-label', this.options.label || 'Toggle switch');
        
        // Create visual toggle track
        const track = createSafeElement('div', '', 'aurora-toggle-track');
        if (this.isChecked) {
            track.classList.add('checked');
        }
        
        // Create toggle thumb with Aurora glow
        const thumb = createSafeElement('div', '', 'aurora-toggle-thumb');
        
        // Add icons for on/off states
        const onIcon = createSafeElement('span', '✓', 'aurora-toggle-icon-on');
        const offIcon = createSafeElement('span', '✕', 'aurora-toggle-icon-off');
        
        thumb.appendChild(onIcon);
        thumb.appendChild(offIcon);
        
        // Add ripple effect container
        const ripple = createSafeElement('div', '', 'aurora-ripple');
        thumb.appendChild(ripple);
        
        track.appendChild(thumb);
        
        // Add status text if enabled
        if (this.options.showStatus) {
            const status = createSafeElement('span', '', 'aurora-toggle-status');
            status.textContent = this.isChecked ? 'ON' : 'OFF';
            status.classList.add(this.isChecked ? 'on' : 'off');
            track.appendChild(status);
        }
        
        toggleContainer.appendChild(this.inputElement);
        toggleContainer.appendChild(track);
        wrapper.appendChild(toggleContainer);
        
        // Add label on right if specified
        if (this.options.label && this.options.labelPosition === 'right') {
            const label = createSafeElement('label', this.options.label, 'aurora-toggle-label');
            label.setAttribute('for', this.id);
            if (this.isDisabled) {
                label.classList.add('disabled');
            }
            wrapper.appendChild(label);
        }
        
        this.container.appendChild(wrapper);
        
        // Apply animation duration
        this.setAnimationDuration(this.options.animationDuration);
    }
    
    // Setup event listeners
    private setupEventListeners() {
        if (!this.inputElement) return;
        
        // Change event
        this.inputElement.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.handleToggle(target.checked);
        });
        
        // Keyboard accessibility
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!this.isDisabled) {
                    this.toggle();
                }
            }
        });
        
        // Add click animation
        const track = this.container?.querySelector('.aurora-toggle-track');
        track?.addEventListener('click', (e) => {
            if (!this.isDisabled) {
                this.createRipple(e as MouseEvent);
            }
        });
    }
    
    // Handle toggle change
    private handleToggle(checked: boolean) {
        this.isChecked = checked;
        
        // Update visual state
        const track = this.container?.querySelector('.aurora-toggle-track');
        if (track) {
            if (checked) {
                track.classList.add('checked');
            } else {
                track.classList.remove('checked');
            }
        }
        
        // Update status text
        if (this.options.showStatus) {
            const status = this.container?.querySelector('.aurora-toggle-status');
            if (status) {
                status.textContent = checked ? 'ON' : 'OFF';
                status.classList.remove('on', 'off');
                status.classList.add(checked ? 'on' : 'off');
            }
        }
        
        // Trigger callback
        if (this.onChange) {
            this.onChange(checked);
        }
        
        // Add haptic feedback effect
        this.addHapticFeedback();
        
        logActivity('toggleChanged', { 
            id: this.id, 
            checked: checked 
        });
    }
    
    // Create ripple effect on click
    private createRipple(e: MouseEvent) {
        const track = e.currentTarget as HTMLElement;
        const ripple = track.querySelector('.aurora-ripple') as HTMLElement;
        
        if (!ripple) return;
        
        const rect = track.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        ripple.classList.add('active');
        
        setTimeout(() => {
            ripple.classList.remove('active');
        }, this.options.animationDuration);
    }
    
    // Add haptic feedback visual effect
    private addHapticFeedback() {
        const thumb = this.container?.querySelector('.aurora-toggle-thumb');
        if (thumb) {
            thumb.classList.add('haptic');
            setTimeout(() => {
                thumb.classList.remove('haptic');
            }, 200);
        }
    }
    
    // Public API methods
    
    // Toggle the switch
    toggle() {
        if (!this.isDisabled && this.inputElement) {
            this.inputElement.checked = !this.inputElement.checked;
            this.handleToggle(this.inputElement.checked);
        }
    }
    
    // Set checked state
    setChecked(checked: boolean) {
        if (this.inputElement) {
            this.inputElement.checked = checked;
            this.handleToggle(checked);
        }
    }
    
    // Get checked state
    isOn(): boolean {
        return this.isChecked;
    }
    
    // Enable the toggle
    enable() {
        this.isDisabled = false;
        if (this.inputElement) {
            this.inputElement.disabled = false;
        }
        
        const toggleContainer = this.container?.querySelector('.aurora-toggle');
        toggleContainer?.classList.remove('disabled');
        
        const label = this.container?.querySelector('.aurora-toggle-label');
        label?.classList.remove('disabled');
        
        logActivity('toggleEnabled', { id: this.id });
    }
    
    // Disable the toggle
    disable() {
        this.isDisabled = true;
        if (this.inputElement) {
            this.inputElement.disabled = true;
        }
        
        const toggleContainer = this.container?.querySelector('.aurora-toggle');
        toggleContainer?.classList.add('disabled');
        
        const label = this.container?.querySelector('.aurora-toggle-label');
        label?.classList.add('disabled');
        
        logActivity('toggleDisabled', { id: this.id });
    }
    
    // Update label
    setLabel(label: string) {
        this.options.label = label;
        const labelElement = this.container?.querySelector('.aurora-toggle-label');
        if (labelElement) {
            labelElement.textContent = label;
        }
    }
    
    // Set animation duration
    setAnimationDuration(duration: number) {
        this.options.animationDuration = duration;
        const track = this.container?.querySelector('.aurora-toggle-track') as HTMLElement;
        const thumb = this.container?.querySelector('.aurora-toggle-thumb') as HTMLElement;
        
        if (track) {
            track.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        }
        if (thumb) {
            thumb.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        }
    }
    
    // Update color theme
    setColor(color: 'primary' | 'success' | 'danger' | 'warning' | 'info') {
        const toggleContainer = this.container?.querySelector('.aurora-toggle');
        if (toggleContainer) {
            // Remove old color class
            toggleContainer.classList.remove(
                'aurora-toggle-primary',
                'aurora-toggle-success',
                'aurora-toggle-danger',
                'aurora-toggle-warning',
                'aurora-toggle-info'
            );
            // Add new color class
            toggleContainer.classList.add(`aurora-toggle-${color}`);
        }
        this.options.color = color;
    }
    
    // Destroy toggle
    destroy() {
        if (this.inputElement) {
            this.inputElement.removeEventListener('change', () => {});
            this.inputElement.removeEventListener('keydown', () => {});
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.container = null;
        this.inputElement = null;
        this.onChange = null;
        
        logActivity('toggleDestroyed', { id: this.id });
    }
}

// Factory function for creating toggle groups
export function createToggleGroup(toggles: Array<{id: string, options: ToggleOptions}>, exclusive: boolean = false): Map<string, ToggleSwitch> {
    const group = new Map<string, ToggleSwitch>();
    
    toggles.forEach(config => {
        const toggle = new ToggleSwitch(config.options);
        group.set(config.id, toggle);
        
        if (exclusive) {
            // In exclusive mode, only one toggle can be on at a time
            const originalOnChange = config.options.onChange;
            config.options.onChange = (checked: boolean) => {
                if (checked) {
                    // Turn off all other toggles
                    group.forEach((otherToggle, otherId) => {
                        if (otherId !== config.id && otherToggle.isOn()) {
                            otherToggle.setChecked(false);
                        }
                    });
                }
                if (originalOnChange) {
                    originalOnChange(checked);
                }
            };
        }
    });
    
    return group;
}

// Export singleton for easy use
const toggleSwitch = new ToggleSwitch();
export default toggleSwitch;