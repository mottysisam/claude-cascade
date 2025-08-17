"use strict";
// Toggle Switch Component with Aurora Theme
// Smooth animated toggle switches with state management
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToggleGroup = exports.ToggleSwitch = void 0;
const validation_1 = require("../security/validation");
const state_1 = require("../core/state");
class ToggleSwitch {
    constructor(options = {}) {
        this.container = null;
        this.inputElement = null;
        this.isChecked = false;
        this.isDisabled = false;
        this.onChange = null;
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
    initialize(container, onChange) {
        this.container = container;
        this.onChange = onChange || null;
        this.render();
        this.setupEventListeners();
        (0, state_1.logActivity)('toggleInitialized', {
            id: this.id,
            checked: this.isChecked,
            options: this.options
        });
    }
    // Render toggle UI
    render() {
        if (!this.container)
            return;
        this.container.innerHTML = '';
        this.container.className = `aurora-toggle-container aurora-toggle-${this.options.size}`;
        // Create wrapper for layout
        const wrapper = (0, validation_1.createSafeElement)('div', '', 'aurora-toggle-wrapper');
        if (this.options.labelPosition === 'left') {
            wrapper.classList.add('label-left');
        }
        // Create label if provided
        if (this.options.label) {
            const label = (0, validation_1.createSafeElement)('label', this.options.label, 'aurora-toggle-label');
            label.setAttribute('for', this.id);
            if (this.isDisabled) {
                label.classList.add('disabled');
            }
            if (this.options.labelPosition === 'left') {
                wrapper.appendChild(label);
            }
        }
        // Create toggle container
        const toggleContainer = (0, validation_1.createSafeElement)('div', '', 'aurora-toggle');
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
        const track = (0, validation_1.createSafeElement)('div', '', 'aurora-toggle-track');
        if (this.isChecked) {
            track.classList.add('checked');
        }
        // Create toggle thumb with Aurora glow
        const thumb = (0, validation_1.createSafeElement)('div', '', 'aurora-toggle-thumb');
        // Add icons for on/off states
        const onIcon = (0, validation_1.createSafeElement)('span', '✓', 'aurora-toggle-icon-on');
        const offIcon = (0, validation_1.createSafeElement)('span', '✕', 'aurora-toggle-icon-off');
        thumb.appendChild(onIcon);
        thumb.appendChild(offIcon);
        // Add ripple effect container
        const ripple = (0, validation_1.createSafeElement)('div', '', 'aurora-ripple');
        thumb.appendChild(ripple);
        track.appendChild(thumb);
        // Add status text if enabled
        if (this.options.showStatus) {
            const status = (0, validation_1.createSafeElement)('span', '', 'aurora-toggle-status');
            status.textContent = this.isChecked ? 'ON' : 'OFF';
            status.classList.add(this.isChecked ? 'on' : 'off');
            track.appendChild(status);
        }
        toggleContainer.appendChild(this.inputElement);
        toggleContainer.appendChild(track);
        wrapper.appendChild(toggleContainer);
        // Add label on right if specified
        if (this.options.label && this.options.labelPosition === 'right') {
            const label = (0, validation_1.createSafeElement)('label', this.options.label, 'aurora-toggle-label');
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
    setupEventListeners() {
        if (!this.inputElement)
            return;
        // Change event
        this.inputElement.addEventListener('change', (e) => {
            const target = e.target;
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
                this.createRipple(e);
            }
        });
    }
    // Handle toggle change
    handleToggle(checked) {
        this.isChecked = checked;
        // Update visual state
        const track = this.container?.querySelector('.aurora-toggle-track');
        if (track) {
            if (checked) {
                track.classList.add('checked');
            }
            else {
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
        (0, state_1.logActivity)('toggleChanged', {
            id: this.id,
            checked: checked
        });
    }
    // Create ripple effect on click
    createRipple(e) {
        const track = e.currentTarget;
        const ripple = track.querySelector('.aurora-ripple');
        if (!ripple)
            return;
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
    addHapticFeedback() {
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
    setChecked(checked) {
        if (this.inputElement) {
            this.inputElement.checked = checked;
            this.handleToggle(checked);
        }
    }
    // Get checked state
    isOn() {
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
        (0, state_1.logActivity)('toggleEnabled', { id: this.id });
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
        (0, state_1.logActivity)('toggleDisabled', { id: this.id });
    }
    // Update label
    setLabel(label) {
        this.options.label = label;
        const labelElement = this.container?.querySelector('.aurora-toggle-label');
        if (labelElement) {
            labelElement.textContent = label;
        }
    }
    // Set animation duration
    setAnimationDuration(duration) {
        this.options.animationDuration = duration;
        const track = this.container?.querySelector('.aurora-toggle-track');
        const thumb = this.container?.querySelector('.aurora-toggle-thumb');
        if (track) {
            track.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        }
        if (thumb) {
            thumb.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        }
    }
    // Update color theme
    setColor(color) {
        const toggleContainer = this.container?.querySelector('.aurora-toggle');
        if (toggleContainer) {
            // Remove old color class
            toggleContainer.classList.remove('aurora-toggle-primary', 'aurora-toggle-success', 'aurora-toggle-danger', 'aurora-toggle-warning', 'aurora-toggle-info');
            // Add new color class
            toggleContainer.classList.add(`aurora-toggle-${color}`);
        }
        this.options.color = color;
    }
    // Destroy toggle
    destroy() {
        if (this.inputElement) {
            this.inputElement.removeEventListener('change', () => { });
            this.inputElement.removeEventListener('keydown', () => { });
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.container = null;
        this.inputElement = null;
        this.onChange = null;
        (0, state_1.logActivity)('toggleDestroyed', { id: this.id });
    }
}
exports.ToggleSwitch = ToggleSwitch;
// Factory function for creating toggle groups
function createToggleGroup(toggles, exclusive = false) {
    const group = new Map();
    toggles.forEach(config => {
        const toggle = new ToggleSwitch(config.options);
        group.set(config.id, toggle);
        if (exclusive) {
            // In exclusive mode, only one toggle can be on at a time
            const originalOnChange = config.options.onChange;
            config.options.onChange = (checked) => {
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
exports.createToggleGroup = createToggleGroup;
// Export singleton for easy use
const toggleSwitch = new ToggleSwitch();
exports.default = toggleSwitch;
//# sourceMappingURL=toggleSwitch.js.map