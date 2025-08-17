"use strict";
// File Autocomplete Component with Fuzzy Search
// Aurora-themed autocomplete with keyboard navigation
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAutocomplete = void 0;
const validation_1 = require("../security/validation");
const state_1 = require("../core/state");
const constants_1 = require("../core/constants");
// File type icons mapping
const FILE_ICONS = {
    // Code files
    '.ts': '📘', '.tsx': '📘', '.js': '📙', '.jsx': '📙',
    '.py': '🐍', '.java': '☕', '.cpp': '🔧', '.c': '🔧',
    '.cs': '🟦', '.go': '🐹', '.rs': '🦀', '.swift': '🦉',
    '.php': '🐘', '.rb': '💎', '.lua': '🌙', '.dart': '🎯',
    // Web files
    '.html': '📄', '.css': '🎨', '.scss': '🎨', '.sass': '🎨',
    '.less': '🎨', '.vue': '💚', '.svelte': '🧡',
    // Data files
    '.json': '📊', '.xml': '📋', '.yaml': '📋', '.yml': '📋',
    '.toml': '⚙️', '.ini': '⚙️', '.env': '🔐',
    // Documentation
    '.md': '📝', '.mdx': '📝', '.txt': '📄', '.doc': '📄',
    '.pdf': '📕', '.rst': '📄',
    // Media
    '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️', '.gif': '🖼️',
    '.svg': '🎨', '.mp4': '🎬', '.mp3': '🎵',
    // Other
    '.zip': '📦', '.tar': '📦', '.gz': '📦',
    '.exe': '⚡', '.sh': '🖥️', '.bat': '🖥️',
    // Folders
    'folder': '📁',
    'default': '📄'
};
class FileAutocomplete {
    constructor(options = {}) {
        this.container = null;
        this.inputElement = null;
        this.dropdownElement = null;
        this.files = [];
        this.filteredFiles = [];
        this.recentFiles = [];
        this.selectedIndex = -1;
        this.isOpen = false;
        this.debounceTimer = null;
        this.onSelect = null;
        this.options = {
            maxResults: options.maxResults || 10,
            minChars: options.minChars || 1,
            debounceMs: options.debounceMs || constants_1.DELAYS.DEBOUNCE_INPUT,
            caseSensitive: options.caseSensitive || false,
            showPath: options.showPath !== false,
            showRecent: options.showRecent !== false,
            placeholder: options.placeholder || 'Start typing to search files...'
        };
    }
    // Initialize autocomplete
    initialize(container, files, onSelect) {
        this.container = container;
        this.files = files;
        this.onSelect = onSelect || null;
        this.render();
        this.setupEventListeners();
        this.loadRecentFiles();
        (0, state_1.logActivity)('fileAutocompleteInitialized', { fileCount: files.length });
    }
    // Render autocomplete UI
    render() {
        if (!this.container)
            return;
        this.container.innerHTML = '';
        this.container.className = 'aurora-autocomplete-container';
        // Create input wrapper
        const inputWrapper = (0, validation_1.createSafeElement)('div', '', 'aurora-autocomplete-input-wrapper');
        // Create search icon
        const searchIcon = (0, validation_1.createSafeElement)('span', '🔍', 'aurora-autocomplete-icon');
        // Create input
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'aurora-autocomplete-input';
        this.inputElement.placeholder = this.options.placeholder;
        this.inputElement.setAttribute('autocomplete', 'off');
        this.inputElement.setAttribute('spellcheck', 'false');
        // Create clear button
        const clearBtn = (0, validation_1.createSafeElement)('button', '✕', 'aurora-autocomplete-clear');
        clearBtn.style.display = 'none';
        clearBtn.onclick = () => this.clear();
        inputWrapper.appendChild(searchIcon);
        inputWrapper.appendChild(this.inputElement);
        inputWrapper.appendChild(clearBtn);
        // Create dropdown
        this.dropdownElement = (0, validation_1.createSafeElement)('div', '', 'aurora-autocomplete-dropdown');
        this.dropdownElement.style.display = 'none';
        this.container.appendChild(inputWrapper);
        this.container.appendChild(this.dropdownElement);
    }
    // Fuzzy search algorithm
    fuzzySearch(query, text) {
        if (!query || !text)
            return 0;
        const compareQuery = this.options.caseSensitive ? query : query.toLowerCase();
        const compareText = this.options.caseSensitive ? text : text.toLowerCase();
        // Exact match
        if (compareText === compareQuery)
            return 1000;
        // Starts with query
        if (compareText.startsWith(compareQuery))
            return 900;
        // Contains query
        if (compareText.includes(compareQuery))
            return 800;
        // Fuzzy match
        let score = 0;
        let queryIndex = 0;
        let prevMatchIndex = -1;
        for (let i = 0; i < compareText.length && queryIndex < compareQuery.length; i++) {
            if (compareText[i] === compareQuery[queryIndex]) {
                // Bonus for consecutive matches
                if (prevMatchIndex === i - 1) {
                    score += 15;
                }
                else {
                    score += 10;
                }
                // Bonus for matching at word boundaries
                if (i === 0 || compareText[i - 1] === ' ' || compareText[i - 1] === '/' || compareText[i - 1] === '.') {
                    score += 20;
                }
                prevMatchIndex = i;
                queryIndex++;
            }
        }
        // All characters matched
        if (queryIndex === compareQuery.length) {
            // Bonus for shorter strings (more relevant)
            score += Math.max(0, 100 - compareText.length);
            return score;
        }
        return 0;
    }
    // Filter files based on query
    filterFiles(query) {
        if (!query || query.length < this.options.minChars) {
            // Show recent files if no query
            if (this.options.showRecent && this.recentFiles.length > 0) {
                this.filteredFiles = this.files
                    .filter(f => this.recentFiles.includes(f.path))
                    .slice(0, this.options.maxResults);
            }
            else {
                this.filteredFiles = [];
            }
            return;
        }
        // Score all files
        const scored = this.files.map(file => {
            const nameScore = this.fuzzySearch(query, file.name) * 2; // Name matches are more important
            const pathScore = this.fuzzySearch(query, file.path);
            const totalScore = Math.max(nameScore, pathScore);
            return {
                ...file,
                score: totalScore
            };
        });
        // Filter and sort by score
        this.filteredFiles = scored
            .filter(f => f.score > 0)
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, this.options.maxResults);
    }
    // Render dropdown items
    renderDropdown() {
        if (!this.dropdownElement)
            return;
        this.dropdownElement.innerHTML = '';
        if (this.filteredFiles.length === 0) {
            if (this.inputElement?.value && this.inputElement.value.length >= this.options.minChars) {
                const noResults = (0, validation_1.createSafeElement)('div', 'No files found', 'aurora-autocomplete-no-results');
                this.dropdownElement.appendChild(noResults);
            }
            else if (this.options.showRecent && this.recentFiles.length === 0) {
                const noRecent = (0, validation_1.createSafeElement)('div', 'No recent files', 'aurora-autocomplete-no-results');
                this.dropdownElement.appendChild(noRecent);
            }
            return;
        }
        // Add header if showing recent files
        if (!this.inputElement?.value && this.options.showRecent) {
            const header = (0, validation_1.createSafeElement)('div', '🕐 Recent Files', 'aurora-autocomplete-header');
            this.dropdownElement.appendChild(header);
        }
        // Render each file
        this.filteredFiles.forEach((file, index) => {
            const item = this.createFileItem(file, index);
            this.dropdownElement.appendChild(item);
        });
    }
    // Create file item element
    createFileItem(file, index) {
        const item = (0, validation_1.createSafeElement)('div', '', 'aurora-autocomplete-item');
        item.setAttribute('data-index', index.toString());
        if (index === this.selectedIndex) {
            item.classList.add('selected');
        }
        // Icon
        const icon = this.getFileIcon(file);
        const iconEl = (0, validation_1.createSafeElement)('span', icon, 'aurora-autocomplete-item-icon');
        // Content
        const content = (0, validation_1.createSafeElement)('div', '', 'aurora-autocomplete-item-content');
        // Name with highlighting
        const nameEl = (0, validation_1.createSafeElement)('div', '', 'aurora-autocomplete-item-name');
        nameEl.innerHTML = this.highlightMatch(file.name, this.inputElement?.value || '');
        // Path if enabled
        if (this.options.showPath) {
            const pathEl = (0, validation_1.createSafeElement)('div', file.path, 'aurora-autocomplete-item-path');
            content.appendChild(nameEl);
            content.appendChild(pathEl);
        }
        else {
            content.appendChild(nameEl);
        }
        // Score indicator (for debugging)
        if (file.score && process.env.NODE_ENV === 'development') {
            const scoreEl = (0, validation_1.createSafeElement)('span', `${file.score}`, 'aurora-autocomplete-item-score');
            item.appendChild(scoreEl);
        }
        item.appendChild(iconEl);
        item.appendChild(content);
        // Click handler
        item.onclick = () => this.selectFile(index);
        // Hover handler
        item.onmouseenter = () => {
            this.selectedIndex = index;
            this.updateSelection();
        };
        return item;
    }
    // Get file icon
    getFileIcon(file) {
        if (file.type === 'folder') {
            return FILE_ICONS.folder;
        }
        const ext = file.extension || file.name.substring(file.name.lastIndexOf('.'));
        return FILE_ICONS[ext] || FILE_ICONS.default;
    }
    // Highlight matching characters
    highlightMatch(text, query) {
        if (!query)
            return this.escapeHtml(text);
        const compareQuery = this.options.caseSensitive ? query : query.toLowerCase();
        const compareText = this.options.caseSensitive ? text : text.toLowerCase();
        let result = '';
        let queryIndex = 0;
        for (let i = 0; i < text.length; i++) {
            if (queryIndex < compareQuery.length && compareText[i] === compareQuery[queryIndex]) {
                result += `<mark>${this.escapeHtml(text[i])}</mark>`;
                queryIndex++;
            }
            else {
                result += this.escapeHtml(text[i]);
            }
        }
        return result;
    }
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    // Open dropdown
    open() {
        if (!this.dropdownElement || this.isOpen)
            return;
        this.dropdownElement.style.display = 'block';
        this.dropdownElement.classList.add('aurora-fade-in');
        this.isOpen = true;
        this.renderDropdown();
    }
    // Close dropdown
    close() {
        if (!this.dropdownElement || !this.isOpen)
            return;
        this.dropdownElement.style.display = 'none';
        this.isOpen = false;
        this.selectedIndex = -1;
    }
    // Select file
    selectFile(index) {
        const file = this.filteredFiles[index];
        if (!file)
            return;
        // Update input
        if (this.inputElement) {
            this.inputElement.value = file.name;
        }
        // Add to recent files
        this.addToRecent(file.path);
        // Close dropdown
        this.close();
        // Callback
        if (this.onSelect) {
            this.onSelect(file);
        }
        (0, state_1.logActivity)('fileSelected', { file: file.path });
    }
    // Update selection highlighting
    updateSelection() {
        const items = this.dropdownElement?.querySelectorAll('.aurora-autocomplete-item');
        items?.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            }
            else {
                item.classList.remove('selected');
            }
        });
    }
    // Setup event listeners
    setupEventListeners() {
        if (!this.inputElement)
            return;
        // Input events
        this.inputElement.addEventListener('input', (e) => {
            const value = e.target.value;
            // Show/hide clear button
            const clearBtn = this.container?.querySelector('.aurora-autocomplete-clear');
            if (clearBtn) {
                clearBtn.style.display = value ? 'block' : 'none';
            }
            // Debounce search
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = window.setTimeout(() => {
                this.filterFiles(value);
                this.open();
                this.renderDropdown();
            }, this.options.debounceMs);
        });
        // Focus events
        this.inputElement.addEventListener('focus', () => {
            if (this.filteredFiles.length > 0 || (!this.inputElement?.value && this.options.showRecent)) {
                this.open();
            }
        });
        // Keyboard navigation
        this.inputElement.addEventListener('keydown', (e) => {
            if (!this.isOpen) {
                if (e.key === 'ArrowDown' || e.key === 'Enter') {
                    this.filterFiles(this.inputElement?.value || '');
                    this.open();
                    this.renderDropdown();
                }
                return;
            }
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredFiles.length - 1);
                    this.updateSelection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                    this.updateSelection();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedIndex >= 0) {
                        this.selectFile(this.selectedIndex);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    break;
                case 'Tab':
                    if (this.selectedIndex >= 0) {
                        e.preventDefault();
                        this.selectFile(this.selectedIndex);
                    }
                    break;
            }
        });
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.container?.contains(e.target)) {
                this.close();
            }
        });
    }
    // Add file to recent
    addToRecent(path) {
        // Remove if already exists
        const index = this.recentFiles.indexOf(path);
        if (index > -1) {
            this.recentFiles.splice(index, 1);
        }
        // Add to beginning
        this.recentFiles.unshift(path);
        // Limit to 10 recent files
        this.recentFiles = this.recentFiles.slice(0, 10);
        // Save to localStorage
        this.saveRecentFiles();
    }
    // Load recent files from localStorage
    loadRecentFiles() {
        try {
            const stored = localStorage.getItem('aurora-recent-files');
            if (stored) {
                this.recentFiles = JSON.parse(stored);
            }
        }
        catch (e) {
            console.error('Failed to load recent files:', e);
        }
    }
    // Save recent files to localStorage
    saveRecentFiles() {
        try {
            localStorage.setItem('aurora-recent-files', JSON.stringify(this.recentFiles));
        }
        catch (e) {
            console.error('Failed to save recent files:', e);
        }
    }
    // Clear input and close
    clear() {
        if (this.inputElement) {
            this.inputElement.value = '';
            this.inputElement.focus();
        }
        const clearBtn = this.container?.querySelector('.aurora-autocomplete-clear');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        this.filteredFiles = [];
        this.close();
    }
    // Update files list
    updateFiles(files) {
        this.files = files;
        if (this.isOpen) {
            this.filterFiles(this.inputElement?.value || '');
            this.renderDropdown();
        }
    }
    // Get current value
    getValue() {
        return this.inputElement?.value || '';
    }
    // Set value
    setValue(value) {
        if (this.inputElement) {
            this.inputElement.value = value;
        }
    }
    // Destroy autocomplete
    destroy() {
        this.close();
        this.container = null;
        this.inputElement = null;
        this.dropdownElement = null;
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }
}
exports.FileAutocomplete = FileAutocomplete;
// Export singleton for easy use
const fileAutocomplete = new FileAutocomplete();
exports.default = fileAutocomplete;
//# sourceMappingURL=fileAutocomplete.js.map