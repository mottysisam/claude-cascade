"use strict";
// Toast Notification Component with Auto-Dismiss
// Aurora-themed toast notifications with multiple positions and types
Object.defineProperty(exports, "__esModule", { value: true });
exports.toast = void 0;
const validation_1 = require("../security/validation");
const state_1 = require("../core/state");
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.positions = new Map();
        this.defaultOptions = {
            type: 'default',
            position: 'top-right',
            duration: 3000,
            closeable: true,
            icon: true,
            progress: true,
            pauseOnHover: true,
            onClick: () => { },
            onClose: () => { }
        };
        this.initialize();
    }
    // Initialize toast containers
    initialize() {
        // Create main container if it doesn't exist
        if (!document.getElementById('aurora-toast-container')) {
            this.container = (0, validation_1.createSafeElement)('div', '', 'aurora-toast-container');
            this.container.id = 'aurora-toast-container';
            document.body.appendChild(this.container);
            // Create position containers
            const positions = [
                'top-left', 'top-center', 'top-right',
                'bottom-left', 'bottom-center', 'bottom-right'
            ];
            positions.forEach(position => {
                const posContainer = (0, validation_1.createSafeElement)('div', '', `aurora-toast-position aurora-toast-${position}`);
                posContainer.setAttribute('data-position', position);
                this.container.appendChild(posContainer);
                this.positions.set(position, posContainer);
            });
        }
        else {
            this.container = document.getElementById('aurora-toast-container');
            // Restore position containers
            this.positions.clear();
            const positionElements = this.container?.querySelectorAll('.aurora-toast-position');
            positionElements?.forEach(element => {
                const position = element.getAttribute('data-position');
                if (position) {
                    this.positions.set(position, element);
                }
            });
        }
        (0, state_1.logActivity)('toastManagerInitialized');
    }
    // Show a toast notification
    show(message, options = {}) {
        // Merge options with defaults
        const toastOptions = {
            ...this.defaultOptions,
            ...options
        };
        // Create toast object
        const id = `aurora-toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const toast = {
            id,
            message,
            options: toastOptions,
            element: null,
            progressBar: null,
            timer: null,
            startTime: Date.now(),
            remainingTime: toastOptions.duration,
            isPaused: false
        };
        // Create and render toast element
        toast.element = this.createToastElement(toast);
        // Add to appropriate position container
        const positionContainer = this.positions.get(toastOptions.position);
        if (positionContainer) {
            // Add with animation
            toast.element.style.opacity = '0';
            toast.element.style.transform = 'translateX(100%)';
            positionContainer.appendChild(toast.element);
            // Trigger animation
            requestAnimationFrame(() => {
                if (toast.element) {
                    toast.element.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
                    toast.element.style.opacity = '1';
                    toast.element.style.transform = 'translateX(0)';
                }
            });
        }
        // Store toast
        this.toasts.set(id, toast);
        // Setup auto-dismiss
        if (toastOptions.duration > 0) {
            this.startTimer(toast);
        }
        // Setup event handlers
        this.setupEventHandlers(toast);
        (0, state_1.logActivity)('toastShown', {
            id,
            type: toastOptions.type,
            position: toastOptions.position,
            message: message.substring(0, 50)
        });
        return id;
    }
    // Create toast element
    createToastElement(toast) {
        const element = (0, validation_1.createSafeElement)('div', '', 'aurora-toast');
        element.classList.add(`aurora-toast-${toast.options.type}`);
        element.setAttribute('role', 'alert');
        element.setAttribute('aria-live', 'polite');
        element.id = toast.id;
        // Add glass morphism effect
        element.classList.add('aurora-glass');
        // Create inner container
        const inner = (0, validation_1.createSafeElement)('div', '', 'aurora-toast-inner');
        // Add icon
        if (toast.options.icon) {
            const iconEl = (0, validation_1.createSafeElement)('div', '', 'aurora-toast-icon');
            iconEl.textContent = this.getIcon(toast.options.type, toast.options.icon);
            inner.appendChild(iconEl);
        }
        // Add content
        const content = (0, validation_1.createSafeElement)('div', '', 'aurora-toast-content');
        const messageEl = (0, validation_1.createSafeElement)('div', toast.message, 'aurora-toast-message');
        content.appendChild(messageEl);
        inner.appendChild(content);
        // Add close button if closeable
        if (toast.options.closeable) {
            const closeBtn = (0, validation_1.createSafeElement)('button', '×', 'aurora-toast-close');
            closeBtn.setAttribute('aria-label', 'Close notification');
            inner.appendChild(closeBtn);
        }
        element.appendChild(inner);
        // Add progress bar if enabled
        if (toast.options.progress && toast.options.duration > 0) {
            const progressContainer = (0, validation_1.createSafeElement)('div', '', 'aurora-toast-progress-container');
            const progressBar = (0, validation_1.createSafeElement)('div', '', 'aurora-toast-progress');
            progressBar.style.animationDuration = `${toast.options.duration}ms`;
            progressContainer.appendChild(progressBar);
            element.appendChild(progressContainer);
            toast.progressBar = progressBar;
        }
        return element;
    }
    // Get icon for toast type
    getIcon(type, icon) {
        if (typeof icon === 'string') {
            return icon;
        }
        if (!icon) {
            return '';
        }
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            default: '●'
        };
        return icons[type] || icons.default;
    }
    // Setup event handlers for a toast
    setupEventHandlers(toast) {
        if (!toast.element)
            return;
        // Click handler
        if (toast.options.onClick) {
            toast.element.addEventListener('click', (e) => {
                // Don't trigger if clicking close button
                if (!e.target.classList.contains('aurora-toast-close')) {
                    toast.options.onClick();
                }
            });
            toast.element.style.cursor = 'pointer';
        }
        // Close button handler
        const closeBtn = toast.element.querySelector('.aurora-toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close(toast.id);
            });
        }
        // Pause on hover
        if (toast.options.pauseOnHover && toast.options.duration > 0) {
            toast.element.addEventListener('mouseenter', () => {
                this.pauseTimer(toast);
            });
            toast.element.addEventListener('mouseleave', () => {
                this.resumeTimer(toast);
            });
        }
    }
    // Start auto-dismiss timer
    startTimer(toast) {
        if (toast.timer) {
            clearTimeout(toast.timer);
        }
        toast.startTime = Date.now();
        toast.timer = window.setTimeout(() => {
            this.close(toast.id);
        }, toast.remainingTime);
        // Start progress animation
        if (toast.progressBar) {
            toast.progressBar.style.animation = 'none';
            requestAnimationFrame(() => {
                if (toast.progressBar) {
                    toast.progressBar.style.animation = `aurora-toast-progress ${toast.remainingTime}ms linear`;
                }
            });
        }
    }
    // Pause timer
    pauseTimer(toast) {
        if (!toast.timer || toast.isPaused)
            return;
        clearTimeout(toast.timer);
        toast.timer = null;
        toast.isPaused = true;
        // Calculate remaining time
        const elapsed = Date.now() - toast.startTime;
        toast.remainingTime = Math.max(0, toast.remainingTime - elapsed);
        // Pause progress animation
        if (toast.progressBar) {
            const computedStyle = window.getComputedStyle(toast.progressBar);
            const width = computedStyle.width;
            toast.progressBar.style.animation = 'none';
            toast.progressBar.style.width = width;
        }
    }
    // Resume timer
    resumeTimer(toast) {
        if (!toast.isPaused)
            return;
        toast.isPaused = false;
        this.startTimer(toast);
    }
    // Close a toast
    close(id) {
        const toast = this.toasts.get(id);
        if (!toast || !toast.element)
            return;
        // Clear timer
        if (toast.timer) {
            clearTimeout(toast.timer);
        }
        // Animate out
        toast.element.style.opacity = '0';
        toast.element.style.transform = 'translateX(100%)';
        // Remove after animation
        setTimeout(() => {
            if (toast.element && toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
            this.toasts.delete(id);
            // Call onClose callback
            if (toast.options.onClose) {
                toast.options.onClose();
            }
            (0, state_1.logActivity)('toastClosed', { id });
        }, 300);
    }
    // Close all toasts
    closeAll() {
        this.toasts.forEach((_, id) => {
            this.close(id);
        });
    }
    // Close toasts by type
    closeByType(type) {
        this.toasts.forEach((toast, id) => {
            if (toast.options.type === type) {
                this.close(id);
            }
        });
    }
    // Close toasts by position
    closeByPosition(position) {
        this.toasts.forEach((toast, id) => {
            if (toast.options.position === position) {
                this.close(id);
            }
        });
    }
    // Update default options
    setDefaults(options) {
        Object.assign(this.defaultOptions, options);
    }
    // Get active toast count
    getCount() {
        return this.toasts.size;
    }
    // Check if a toast exists
    exists(id) {
        return this.toasts.has(id);
    }
}
// Create singleton instance
const toastManager = new ToastManager();
// Helper functions for common toast types
exports.toast = {
    show: (message, options) => toastManager.show(message, options),
    success: (message, options) => toastManager.show(message, { ...options, type: 'success' }),
    error: (message, options) => toastManager.show(message, { ...options, type: 'error', duration: options?.duration || 5000 }),
    warning: (message, options) => toastManager.show(message, { ...options, type: 'warning' }),
    info: (message, options) => toastManager.show(message, { ...options, type: 'info' }),
    loading: (message = 'Loading...', options) => toastManager.show(message, { ...options, type: 'default', duration: 0, closeable: false, progress: false }),
    promise: (promise, messages, options) => {
        const id = exports.toast.loading(messages.loading || 'Processing...', options);
        return promise
            .then(data => {
            toastManager.close(id);
            const successMsg = typeof messages.success === 'function'
                ? messages.success(data)
                : messages.success || 'Success!';
            exports.toast.success(successMsg, options);
            return data;
        })
            .catch(error => {
            toastManager.close(id);
            const errorMsg = typeof messages.error === 'function'
                ? messages.error(error)
                : messages.error || 'An error occurred';
            exports.toast.error(errorMsg, options);
            throw error;
        });
    },
    close: (id) => toastManager.close(id),
    closeAll: () => toastManager.closeAll(),
    closeByType: (type) => toastManager.closeByType(type),
    closeByPosition: (position) => toastManager.closeByPosition(position),
    setDefaults: (options) => toastManager.setDefaults(options),
    getCount: () => toastManager.getCount(),
    exists: (id) => toastManager.exists(id)
};
// Export default toast manager
exports.default = exports.toast;
//# sourceMappingURL=toastNotification.js.map