// Toast Notification Component with Auto-Dismiss
// Aurora-themed toast notifications with multiple positions and types

import { createSafeElement } from '../security/validation';
import { logActivity } from '../core/state';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastOptions {
    type?: ToastType;
    position?: ToastPosition;
    duration?: number;
    closeable?: boolean;
    icon?: string | boolean;
    progress?: boolean;
    pauseOnHover?: boolean;
    onClick?: () => void;
    onClose?: () => void;
}

export interface Toast {
    id: string;
    message: string;
    options: Required<ToastOptions>;
    element: HTMLElement | null;
    progressBar: HTMLElement | null;
    timer: number | null;
    startTime: number;
    remainingTime: number;
    isPaused: boolean;
}

class ToastManager {
    private container: HTMLElement | null = null;
    private toasts: Map<string, Toast> = new Map();
    private positions: Map<ToastPosition, HTMLElement> = new Map();
    private defaultOptions: Required<ToastOptions> = {
        type: 'default',
        position: 'top-right',
        duration: 3000,
        closeable: true,
        icon: true,
        progress: true,
        pauseOnHover: true,
        onClick: () => {},
        onClose: () => {}
    };
    
    constructor() {
        this.initialize();
    }
    
    // Initialize toast containers
    private initialize() {
        // Create main container if it doesn't exist
        if (!document.getElementById('aurora-toast-container')) {
            this.container = createSafeElement('div', '', 'aurora-toast-container');
            this.container.id = 'aurora-toast-container';
            document.body.appendChild(this.container);
            
            // Create position containers
            const positions: ToastPosition[] = [
                'top-left', 'top-center', 'top-right',
                'bottom-left', 'bottom-center', 'bottom-right'
            ];
            
            positions.forEach(position => {
                const posContainer = createSafeElement('div', '', `aurora-toast-position aurora-toast-${position}`);
                posContainer.setAttribute('data-position', position);
                this.container!.appendChild(posContainer);
                this.positions.set(position, posContainer);
            });
        } else {
            this.container = document.getElementById('aurora-toast-container');
            
            // Restore position containers
            this.positions.clear();
            const positionElements = this.container?.querySelectorAll('.aurora-toast-position');
            positionElements?.forEach(element => {
                const position = element.getAttribute('data-position') as ToastPosition;
                if (position) {
                    this.positions.set(position, element as HTMLElement);
                }
            });
        }
        
        logActivity('toastManagerInitialized');
    }
    
    // Show a toast notification
    show(message: string, options: ToastOptions = {}): string {
        // Merge options with defaults
        const toastOptions: Required<ToastOptions> = {
            ...this.defaultOptions,
            ...options
        };
        
        // Create toast object
        const id = `aurora-toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const toast: Toast = {
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
        
        logActivity('toastShown', { 
            id, 
            type: toastOptions.type,
            position: toastOptions.position,
            message: message.substring(0, 50) 
        });
        
        return id;
    }
    
    // Create toast element
    private createToastElement(toast: Toast): HTMLElement {
        const element = createSafeElement('div', '', 'aurora-toast');
        element.classList.add(`aurora-toast-${toast.options.type}`);
        element.setAttribute('role', 'alert');
        element.setAttribute('aria-live', 'polite');
        element.id = toast.id;
        
        // Add glass morphism effect
        element.classList.add('aurora-glass');
        
        // Create inner container
        const inner = createSafeElement('div', '', 'aurora-toast-inner');
        
        // Add icon
        if (toast.options.icon) {
            const iconEl = createSafeElement('div', '', 'aurora-toast-icon');
            iconEl.textContent = this.getIcon(toast.options.type, toast.options.icon);
            inner.appendChild(iconEl);
        }
        
        // Add content
        const content = createSafeElement('div', '', 'aurora-toast-content');
        const messageEl = createSafeElement('div', toast.message, 'aurora-toast-message');
        content.appendChild(messageEl);
        inner.appendChild(content);
        
        // Add close button if closeable
        if (toast.options.closeable) {
            const closeBtn = createSafeElement('button', '×', 'aurora-toast-close');
            closeBtn.setAttribute('aria-label', 'Close notification');
            inner.appendChild(closeBtn);
        }
        
        element.appendChild(inner);
        
        // Add progress bar if enabled
        if (toast.options.progress && toast.options.duration > 0) {
            const progressContainer = createSafeElement('div', '', 'aurora-toast-progress-container');
            const progressBar = createSafeElement('div', '', 'aurora-toast-progress');
            progressBar.style.animationDuration = `${toast.options.duration}ms`;
            progressContainer.appendChild(progressBar);
            element.appendChild(progressContainer);
            toast.progressBar = progressBar;
        }
        
        return element;
    }
    
    // Get icon for toast type
    private getIcon(type: ToastType, icon: string | boolean): string {
        if (typeof icon === 'string') {
            return icon;
        }
        
        if (!icon) {
            return '';
        }
        
        const icons: Record<ToastType, string> = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            default: '●'
        };
        
        return icons[type] || icons.default;
    }
    
    // Setup event handlers for a toast
    private setupEventHandlers(toast: Toast) {
        if (!toast.element) return;
        
        // Click handler
        if (toast.options.onClick) {
            toast.element.addEventListener('click', (e) => {
                // Don't trigger if clicking close button
                if (!(e.target as HTMLElement).classList.contains('aurora-toast-close')) {
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
    private startTimer(toast: Toast) {
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
    private pauseTimer(toast: Toast) {
        if (!toast.timer || toast.isPaused) return;
        
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
    private resumeTimer(toast: Toast) {
        if (!toast.isPaused) return;
        
        toast.isPaused = false;
        this.startTimer(toast);
    }
    
    // Close a toast
    close(id: string) {
        const toast = this.toasts.get(id);
        if (!toast || !toast.element) return;
        
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
            
            logActivity('toastClosed', { id });
        }, 300);
    }
    
    // Close all toasts
    closeAll() {
        this.toasts.forEach((_, id) => {
            this.close(id);
        });
    }
    
    // Close toasts by type
    closeByType(type: ToastType) {
        this.toasts.forEach((toast, id) => {
            if (toast.options.type === type) {
                this.close(id);
            }
        });
    }
    
    // Close toasts by position
    closeByPosition(position: ToastPosition) {
        this.toasts.forEach((toast, id) => {
            if (toast.options.position === position) {
                this.close(id);
            }
        });
    }
    
    // Update default options
    setDefaults(options: Partial<ToastOptions>) {
        Object.assign(this.defaultOptions, options);
    }
    
    // Get active toast count
    getCount(): number {
        return this.toasts.size;
    }
    
    // Check if a toast exists
    exists(id: string): boolean {
        return this.toasts.has(id);
    }
}

// Create singleton instance
const toastManager = new ToastManager();

// Helper functions for common toast types
export const toast = {
    show: (message: string, options?: ToastOptions) => toastManager.show(message, options),
    
    success: (message: string, options?: Omit<ToastOptions, 'type'>) => 
        toastManager.show(message, { ...options, type: 'success' }),
    
    error: (message: string, options?: Omit<ToastOptions, 'type'>) => 
        toastManager.show(message, { ...options, type: 'error', duration: options?.duration || 5000 }),
    
    warning: (message: string, options?: Omit<ToastOptions, 'type'>) => 
        toastManager.show(message, { ...options, type: 'warning' }),
    
    info: (message: string, options?: Omit<ToastOptions, 'type'>) => 
        toastManager.show(message, { ...options, type: 'info' }),
    
    loading: (message: string = 'Loading...', options?: Omit<ToastOptions, 'type' | 'duration'>) => 
        toastManager.show(message, { ...options, type: 'default', duration: 0, closeable: false, progress: false }),
    
    promise: <T>(
        promise: Promise<T>,
        messages: {
            loading?: string;
            success?: string | ((data: T) => string);
            error?: string | ((error: any) => string);
        },
        options?: Omit<ToastOptions, 'type'>
    ): Promise<T> => {
        const id = toast.loading(messages.loading || 'Processing...', options);
        
        return promise
            .then(data => {
                toastManager.close(id);
                const successMsg = typeof messages.success === 'function' 
                    ? messages.success(data) 
                    : messages.success || 'Success!';
                toast.success(successMsg, options);
                return data;
            })
            .catch(error => {
                toastManager.close(id);
                const errorMsg = typeof messages.error === 'function'
                    ? messages.error(error)
                    : messages.error || 'An error occurred';
                toast.error(errorMsg, options);
                throw error;
            });
    },
    
    close: (id: string) => toastManager.close(id),
    closeAll: () => toastManager.closeAll(),
    closeByType: (type: ToastType) => toastManager.closeByType(type),
    closeByPosition: (position: ToastPosition) => toastManager.closeByPosition(position),
    setDefaults: (options: Partial<ToastOptions>) => toastManager.setDefaults(options),
    getCount: () => toastManager.getCount(),
    exists: (id: string) => toastManager.exists(id)
};

// Export default toast manager
export default toast;