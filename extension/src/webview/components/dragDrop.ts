// Drag & Drop Queue Manager with Aurora Theme
// Inspired by Claude-Autopilot's drag & drop implementation

import appState, { showToast, logActivity } from '../core/state';
import { createSafeElement } from '../security/validation';

// Drag & Drop State
interface DragDropState {
    isDragging: boolean;
    draggedElement: HTMLElement | null;
    draggedIndex: number;
    dropTarget: HTMLElement | null;
    placeholder: HTMLElement | null;
    items: DraggableItem[];
}

export interface DraggableItem {
    id: string;
    content: string;
    priority?: 'high' | 'medium' | 'low';
    status?: 'pending' | 'processing' | 'completed' | 'error';
    order: number;
    data?: any;
}

class DragDropManager {
    private state: DragDropState = {
        isDragging: false,
        draggedElement: null,
        draggedIndex: -1,
        dropTarget: null,
        placeholder: null,
        items: []
    };
    
    private container: HTMLElement | null = null;
    private onReorder: ((items: DraggableItem[]) => void) | null = null;
    private animationDuration = 300; // Aurora standard animation
    
    constructor() {
        this.setupEventListeners();
    }
    
    // Initialize drag & drop for a container
    initialize(container: HTMLElement, items: DraggableItem[], onReorder?: (items: DraggableItem[]) => void) {
        this.container = container;
        this.state.items = items;
        this.onReorder = onReorder || null;
        
        this.render();
        logActivity('dragDropInitialized', { itemCount: items.length });
    }
    
    // Render draggable items with Aurora styling
    private render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        this.container.className = 'aurora-drag-container';
        
        this.state.items.forEach((item, index) => {
            const element = this.createDraggableElement(item, index);
            this.container!.appendChild(element);
        });
    }
    
    // Create a draggable element with Aurora glass effect
    private createDraggableElement(item: DraggableItem, index: number): HTMLElement {
        const element = createSafeElement('div', '', 'aurora-draggable-item');
        element.setAttribute('draggable', 'true');
        element.setAttribute('data-index', index.toString());
        element.setAttribute('data-id', item.id);
        
        // Add priority indicator
        if (item.priority) {
            element.classList.add(`priority-${item.priority}`);
        }
        
        // Add status indicator
        if (item.status) {
            element.classList.add(`status-${item.status}`);
        }
        
        // Create inner content
        const handle = createSafeElement('div', '⋮⋮', 'aurora-drag-handle');
        const content = createSafeElement('div', item.content, 'aurora-drag-content');
        const statusDot = createSafeElement('div', '', 'aurora-status-dot');
        
        element.appendChild(handle);
        element.appendChild(content);
        element.appendChild(statusDot);
        
        // Add drag event listeners
        element.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        element.addEventListener('dragenter', (e) => this.handleDragEnter(e, index));
        element.addEventListener('dragover', (e) => this.handleDragOver(e));
        element.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        element.addEventListener('drop', (e) => this.handleDrop(e, index));
        element.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        return element;
    }
    
    // Handle drag start
    private handleDragStart(e: DragEvent, index: number) {
        const target = e.currentTarget as HTMLElement;
        
        this.state.isDragging = true;
        this.state.draggedElement = target;
        this.state.draggedIndex = index;
        
        // Add dragging class with Aurora effect
        target.classList.add('aurora-dragging');
        
        // Create ghost image
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', target.innerHTML);
            
            // Create custom drag image
            const dragImage = target.cloneNode(true) as HTMLElement;
            dragImage.classList.add('aurora-drag-ghost');
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        }
        
        // Create placeholder
        this.createPlaceholder(target);
        
        logActivity('dragStart', { itemId: this.state.items[index].id });
    }
    
    // Handle drag enter
    private handleDragEnter(e: DragEvent, index: number) {
        e.preventDefault();
        
        if (!this.state.isDragging) return;
        
        const target = e.currentTarget as HTMLElement;
        
        // Don't process if entering the dragged element
        if (target === this.state.draggedElement) return;
        
        // Add hover effect
        target.classList.add('aurora-drag-over');
        
        // Move placeholder
        this.movePlaceholder(target, index);
    }
    
    // Handle drag over
    private handleDragOver(e: DragEvent) {
        e.preventDefault();
        
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }
    
    // Handle drag leave
    private handleDragLeave(e: DragEvent) {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('aurora-drag-over');
    }
    
    // Handle drop
    private handleDrop(e: DragEvent, dropIndex: number) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.state.isDragging || this.state.draggedIndex === -1) return;
        
        const draggedIndex = this.state.draggedIndex;
        
        // Reorder items
        if (draggedIndex !== dropIndex) {
            this.reorderItems(draggedIndex, dropIndex);
        }
        
        // Clean up
        this.cleanupDrag();
        
        logActivity('dragDrop', { 
            from: draggedIndex, 
            to: dropIndex,
            itemId: this.state.items[dropIndex].id 
        });
    }
    
    // Handle drag end
    private handleDragEnd(e: DragEvent) {
        this.cleanupDrag();
    }
    
    // Create placeholder element
    private createPlaceholder(referenceElement: HTMLElement) {
        if (this.state.placeholder) {
            this.state.placeholder.remove();
        }
        
        const placeholder = createSafeElement('div', '', 'aurora-drag-placeholder');
        placeholder.style.height = `${referenceElement.offsetHeight}px`;
        
        this.state.placeholder = placeholder;
        referenceElement.parentNode?.insertBefore(placeholder, referenceElement);
    }
    
    // Move placeholder to new position
    private movePlaceholder(target: HTMLElement, index: number) {
        if (!this.state.placeholder) return;
        
        const container = this.container;
        if (!container) return;
        
        // Animate placeholder movement
        this.state.placeholder.style.transition = `all ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        if (index < this.state.draggedIndex) {
            target.parentNode?.insertBefore(this.state.placeholder, target);
        } else {
            target.parentNode?.insertBefore(this.state.placeholder, target.nextSibling);
        }
    }
    
    // Reorder items in the array
    private reorderItems(fromIndex: number, toIndex: number) {
        const items = [...this.state.items];
        const [movedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, movedItem);
        
        // Update order property
        items.forEach((item, index) => {
            item.order = index;
        });
        
        this.state.items = items;
        
        // Animate the reorder
        this.animateReorder();
        
        // Callback
        if (this.onReorder) {
            this.onReorder(items);
        }
        
        // Show success toast
        showToast('success', 'Items reordered successfully', 2000);
    }
    
    // Animate the reorder with Aurora effects
    private animateReorder() {
        if (!this.container) return;
        
        const elements = this.container.querySelectorAll('.aurora-draggable-item');
        
        elements.forEach((element, index) => {
            const el = element as HTMLElement;
            el.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            el.style.transform = 'scale(1.02)';
            
            setTimeout(() => {
                el.style.transform = 'scale(1)';
            }, this.animationDuration);
        });
        
        // Re-render after animation
        setTimeout(() => {
            this.render();
        }, this.animationDuration);
    }
    
    // Clean up drag state
    private cleanupDrag() {
        // Remove classes
        if (this.state.draggedElement) {
            this.state.draggedElement.classList.remove('aurora-dragging');
        }
        
        // Remove placeholder
        if (this.state.placeholder) {
            this.state.placeholder.remove();
        }
        
        // Remove hover effects
        const elements = this.container?.querySelectorAll('.aurora-drag-over');
        elements?.forEach(el => el.classList.remove('aurora-drag-over'));
        
        // Reset state
        this.state.isDragging = false;
        this.state.draggedElement = null;
        this.state.draggedIndex = -1;
        this.state.placeholder = null;
    }
    
    // Setup global event listeners
    private setupEventListeners() {
        // Prevent default drag behavior on document
        document.addEventListener('dragover', (e) => {
            if (this.state.isDragging) {
                e.preventDefault();
            }
        });
        
        // Handle escape key to cancel drag
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isDragging) {
                this.cleanupDrag();
                this.render();
                showToast('info', 'Drag cancelled', 1500);
            }
        });
    }
    
    // Add new item
    addItem(item: DraggableItem) {
        item.order = this.state.items.length;
        this.state.items.push(item);
        this.render();
        
        showToast('success', 'Item added', 1500);
        logActivity('dragDropItemAdded', { itemId: item.id });
    }
    
    // Remove item
    removeItem(id: string) {
        const index = this.state.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.state.items.splice(index, 1);
            this.render();
            
            showToast('info', 'Item removed', 1500);
            logActivity('dragDropItemRemoved', { itemId: id });
        }
    }
    
    // Update item
    updateItem(id: string, updates: Partial<DraggableItem>) {
        const item = this.state.items.find(item => item.id === id);
        if (item) {
            Object.assign(item, updates);
            this.render();
            
            logActivity('dragDropItemUpdated', { itemId: id, updates });
        }
    }
    
    // Get current order
    getItems(): DraggableItem[] {
        return [...this.state.items];
    }
    
    // Clear all items
    clear() {
        this.state.items = [];
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        logActivity('dragDropCleared');
    }
    
    // Destroy the manager
    destroy() {
        this.clear();
        this.container = null;
        this.onReorder = null;
    }
}

// Export singleton instance
const dragDropManager = new DragDropManager();
export default dragDropManager;

// Export for testing
export { DragDropManager };