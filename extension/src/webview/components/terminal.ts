// Terminal Output Component with ANSI Color Support
// Aurora-themed terminal for live output display

import { createSafeElement } from '../security/validation';
import { logActivity } from '../core/state';

// ANSI Color Codes Mapping
const ANSI_COLORS: Record<number, string> = {
    // Standard colors
    30: '#000000', // Black
    31: '#ff4757', // Red (Aurora danger)
    32: '#10b981', // Green (Aurora success)
    33: '#f59e0b', // Yellow (Aurora warning)
    34: '#6366f1', // Blue (Aurora info)
    35: '#a855f7', // Magenta (Aurora primary)
    36: '#14b8a6', // Cyan (Aurora success variant)
    37: '#e5e5e5', // White
    
    // Bright colors
    90: '#7f7f7f', // Bright Black
    91: '#ec4899', // Bright Red (Aurora danger variant)
    92: '#14b8a6', // Bright Green
    93: '#fb923c', // Bright Yellow (Aurora warning variant)
    94: '#818cf8', // Bright Blue (Aurora info variant)
    95: '#ec4899', // Bright Magenta (Aurora pink)
    96: '#2dd4bf', // Bright Cyan
    97: '#ffffff', // Bright White
    
    // Background colors (add 10 to foreground code)
    40: '#000000', 41: '#ff4757', 42: '#10b981', 43: '#f59e0b',
    44: '#6366f1', 45: '#a855f7', 46: '#14b8a6', 47: '#e5e5e5',
    100: '#7f7f7f', 101: '#ec4899', 102: '#14b8a6', 103: '#fb923c',
    104: '#818cf8', 105: '#ec4899', 106: '#2dd4bf', 107: '#ffffff'
};

export interface TerminalOptions {
    maxLines?: number;
    autoScroll?: boolean;
    showTimestamps?: boolean;
    showLineNumbers?: boolean;
    theme?: 'dark' | 'light' | 'aurora';
    fontSize?: number;
}

export class TerminalOutput {
    private container: HTMLElement | null = null;
    private outputElement: HTMLElement | null = null;
    private lines: string[] = [];
    private options: Required<TerminalOptions>;
    private isPaused: boolean = false;
    private lineNumber: number = 1;
    
    constructor(options: TerminalOptions = {}) {
        this.options = {
            maxLines: options.maxLines || 1000,
            autoScroll: options.autoScroll !== false,
            showTimestamps: options.showTimestamps || false,
            showLineNumbers: options.showLineNumbers || false,
            theme: options.theme || 'aurora',
            fontSize: options.fontSize || 13
        };
    }
    
    // Initialize terminal in container
    initialize(container: HTMLElement) {
        this.container = container;
        this.render();
        this.setupEventListeners();
        
        logActivity('terminalInitialized', { options: this.options });
    }
    
    // Render terminal UI
    private render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        this.container.className = `aurora-terminal aurora-terminal-${this.options.theme}`;
        
        // Create header
        const header = this.createHeader();
        this.container.appendChild(header);
        
        // Create output area
        this.outputElement = createSafeElement('div', '', 'aurora-terminal-output');
        this.outputElement.style.fontSize = `${this.options.fontSize}px`;
        this.outputElement.setAttribute('tabindex', '0');
        this.container.appendChild(this.outputElement);
        
        // Create footer with controls
        const footer = this.createFooter();
        this.container.appendChild(footer);
        
        // Restore existing lines
        this.lines.forEach(line => this.renderLine(line, false));
    }
    
    // Create terminal header
    private createHeader(): HTMLElement {
        const header = createSafeElement('div', '', 'aurora-terminal-header');
        
        // Terminal title
        const title = createSafeElement('div', '🖥️ Terminal Output', 'aurora-terminal-title');
        
        // Control buttons
        const controls = createSafeElement('div', '', 'aurora-terminal-controls');
        
        // Clear button
        const clearBtn = createSafeElement('button', '🗑️', 'aurora-btn-icon');
        clearBtn.title = 'Clear Output';
        clearBtn.onclick = () => this.clear();
        
        // Pause/Resume button
        const pauseBtn = createSafeElement('button', this.isPaused ? '▶️' : '⏸️', 'aurora-btn-icon');
        pauseBtn.id = 'terminal-pause-btn';
        pauseBtn.title = this.isPaused ? 'Resume' : 'Pause';
        pauseBtn.onclick = () => this.togglePause();
        
        // Copy button
        const copyBtn = createSafeElement('button', '📋', 'aurora-btn-icon');
        copyBtn.title = 'Copy All';
        copyBtn.onclick = () => this.copyToClipboard();
        
        controls.appendChild(clearBtn);
        controls.appendChild(pauseBtn);
        controls.appendChild(copyBtn);
        
        header.appendChild(title);
        header.appendChild(controls);
        
        return header;
    }
    
    // Create terminal footer
    private createFooter(): HTMLElement {
        const footer = createSafeElement('div', '', 'aurora-terminal-footer');
        
        // Line count
        const lineCount = createSafeElement('div', `Lines: ${this.lines.length}`, 'aurora-terminal-line-count');
        lineCount.id = 'terminal-line-count';
        
        // Status indicator
        const status = createSafeElement('div', '', 'aurora-terminal-status');
        const statusDot = createSafeElement('span', '', 'aurora-status-dot');
        statusDot.classList.add(this.isPaused ? 'paused' : 'active');
        const statusText = createSafeElement('span', this.isPaused ? 'Paused' : 'Active', 'aurora-status-text');
        statusText.id = 'terminal-status-text';
        
        status.appendChild(statusDot);
        status.appendChild(statusText);
        
        footer.appendChild(lineCount);
        footer.appendChild(status);
        
        return footer;
    }
    
    // Parse ANSI escape codes
    private parseANSI(text: string): string {
        // Regular expression to match ANSI escape sequences
        const ansiRegex = /\x1b\[([0-9;]+)m/g;
        let result = '';
        let lastIndex = 0;
        let currentStyles: Set<number> = new Set();
        
        let match;
        while ((match = ansiRegex.exec(text)) !== null) {
            // Add text before the escape sequence
            if (match.index > lastIndex) {
                result += this.wrapWithStyle(
                    text.substring(lastIndex, match.index),
                    currentStyles
                );
            }
            
            // Parse the escape codes
            const codes = match[1].split(';').map(Number);
            for (const code of codes) {
                if (code === 0) {
                    // Reset all styles
                    currentStyles.clear();
                } else if (code >= 30 && code <= 37) {
                    // Foreground color
                    currentStyles.add(code);
                } else if (code >= 40 && code <= 47) {
                    // Background color
                    currentStyles.add(code);
                } else if (code >= 90 && code <= 97) {
                    // Bright foreground color
                    currentStyles.add(code);
                } else if (code >= 100 && code <= 107) {
                    // Bright background color
                    currentStyles.add(code);
                } else if (code === 1) {
                    // Bold
                    currentStyles.add(1);
                } else if (code === 3) {
                    // Italic
                    currentStyles.add(3);
                } else if (code === 4) {
                    // Underline
                    currentStyles.add(4);
                }
            }
            
            lastIndex = ansiRegex.lastIndex;
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            result += this.wrapWithStyle(
                text.substring(lastIndex),
                currentStyles
            );
        }
        
        return result || text;
    }
    
    // Wrap text with style based on ANSI codes
    private wrapWithStyle(text: string, styles: Set<number>): string {
        if (styles.size === 0) return this.escapeHtml(text);
        
        let styleStr = '';
        let classes: string[] = [];
        
        styles.forEach(code => {
            if (ANSI_COLORS[code]) {
                if (code >= 40 && code <= 47 || code >= 100 && code <= 107) {
                    // Background color
                    styleStr += `background-color: ${ANSI_COLORS[code]};`;
                } else {
                    // Foreground color
                    styleStr += `color: ${ANSI_COLORS[code]};`;
                }
            } else if (code === 1) {
                classes.push('terminal-bold');
            } else if (code === 3) {
                classes.push('terminal-italic');
            } else if (code === 4) {
                classes.push('terminal-underline');
            }
        });
        
        const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
        const styleAttr = styleStr ? ` style="${styleStr}"` : '';
        
        return `<span${classAttr}${styleAttr}>${this.escapeHtml(text)}</span>`;
    }
    
    // Escape HTML entities
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Render a line to the terminal
    private renderLine(text: string, scroll: boolean = true) {
        if (!this.outputElement) return;
        
        const lineElement = createSafeElement('div', '', 'aurora-terminal-line');
        
        // Add line number if enabled
        if (this.options.showLineNumbers) {
            const lineNum = createSafeElement('span', `${this.lineNumber.toString().padStart(4, ' ')}`, 'aurora-terminal-line-number');
            lineElement.appendChild(lineNum);
            this.lineNumber++;
        }
        
        // Add timestamp if enabled
        if (this.options.showTimestamps) {
            const timestamp = new Date().toLocaleTimeString();
            const timestampEl = createSafeElement('span', `[${timestamp}]`, 'aurora-terminal-timestamp');
            lineElement.appendChild(timestampEl);
        }
        
        // Parse and add content
        const content = createSafeElement('span', '', 'aurora-terminal-content');
        content.innerHTML = this.parseANSI(text);
        lineElement.appendChild(content);
        
        this.outputElement.appendChild(lineElement);
        
        // Auto-scroll if enabled and not paused
        if (scroll && this.options.autoScroll && !this.isPaused) {
            this.scrollToBottom();
        }
        
        // Update line count
        this.updateLineCount();
    }
    
    // Append text to terminal
    append(text: string) {
        if (this.isPaused) return;
        
        // Split by newlines
        const newLines = text.split('\n');
        
        newLines.forEach(line => {
            this.lines.push(line);
            
            // Enforce max lines
            if (this.lines.length > this.options.maxLines) {
                this.lines.shift();
                if (this.outputElement && this.outputElement.firstChild) {
                    this.outputElement.removeChild(this.outputElement.firstChild);
                }
            }
            
            this.renderLine(line);
        });
        
        logActivity('terminalAppend', { lineCount: newLines.length });
    }
    
    // Append line to terminal
    appendLine(line: string) {
        this.append(line + '\n');
    }
    
    // Append error to terminal
    appendError(error: string) {
        this.append(`\x1b[31m✗ ERROR: ${error}\x1b[0m\n`);
    }
    
    // Append success message
    appendSuccess(message: string) {
        this.append(`\x1b[32m✓ SUCCESS: ${message}\x1b[0m\n`);
    }
    
    // Append warning message
    appendWarning(warning: string) {
        this.append(`\x1b[33m⚠ WARNING: ${warning}\x1b[0m\n`);
    }
    
    // Append info message
    appendInfo(info: string) {
        this.append(`\x1b[34mℹ INFO: ${info}\x1b[0m\n`);
    }
    
    // Clear terminal
    clear() {
        this.lines = [];
        this.lineNumber = 1;
        
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
        }
        
        this.updateLineCount();
        logActivity('terminalCleared');
    }
    
    // Toggle pause state
    togglePause() {
        this.isPaused = !this.isPaused;
        
        const pauseBtn = document.getElementById('terminal-pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = this.isPaused ? '▶️' : '⏸️';
            pauseBtn.title = this.isPaused ? 'Resume' : 'Pause';
        }
        
        const statusText = document.getElementById('terminal-status-text');
        if (statusText) {
            statusText.textContent = this.isPaused ? 'Paused' : 'Active';
        }
        
        logActivity('terminalPauseToggled', { isPaused: this.isPaused });
    }
    
    // Copy terminal content to clipboard
    async copyToClipboard() {
        const text = this.lines.join('\n');
        
        try {
            await navigator.clipboard.writeText(text);
            
            // Show feedback
            const copyBtn = event?.target as HTMLElement;
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✓';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 1500);
            }
            
            logActivity('terminalCopied', { lineCount: this.lines.length });
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }
    
    // Scroll to bottom
    private scrollToBottom() {
        if (this.outputElement) {
            this.outputElement.scrollTop = this.outputElement.scrollHeight;
        }
    }
    
    // Update line count display
    private updateLineCount() {
        const lineCountEl = document.getElementById('terminal-line-count');
        if (lineCountEl) {
            lineCountEl.textContent = `Lines: ${this.lines.length}`;
        }
    }
    
    // Setup event listeners
    private setupEventListeners() {
        if (!this.outputElement) return;
        
        // Pause auto-scroll on manual scroll
        this.outputElement.addEventListener('scroll', () => {
            if (!this.isPaused && this.options.autoScroll) {
                const { scrollTop, scrollHeight, clientHeight } = this.outputElement!;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
                
                if (!isAtBottom) {
                    // User scrolled up, temporarily pause auto-scroll
                    setTimeout(() => {
                        if (!this.isPaused) {
                            this.scrollToBottom();
                        }
                    }, 5000);
                }
            }
        });
        
        // Select all on Ctrl+A
        this.outputElement.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(this.outputElement!);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        });
    }
    
    // Get all lines
    getLines(): string[] {
        return [...this.lines];
    }
    
    // Set options
    setOptions(options: Partial<TerminalOptions>) {
        Object.assign(this.options, options);
        this.render();
    }
    
    // Destroy terminal
    destroy() {
        this.clear();
        this.container = null;
        this.outputElement = null;
    }
}

// Export singleton for easy use
const terminalOutput = new TerminalOutput();
export default terminalOutput;