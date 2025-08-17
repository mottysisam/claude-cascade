"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPlanPhaseStatus = exports.extractPlanName = exports.generateTableOfContents = exports.loadPlanFile = exports.parseMarkdownForInteractivity = exports.getMarkdownPreview = exports.extractMarkdownMetadata = exports.extractMarkdownHeaders = void 0;
// Markdown parsing and rendering utilities
const fs = require("fs");
const path = require("path");
// Simple function to extract headers from markdown
function extractMarkdownHeaders(markdown) {
    const headers = [];
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    while ((match = headerRegex.exec(markdown)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^\w]+/g, '-');
        headers.push({ level, text, id });
    }
    return headers;
}
exports.extractMarkdownHeaders = extractMarkdownHeaders;
// Extract metadata from markdown like title, created date, etc.
function extractMarkdownMetadata(markdown) {
    const metadata = {};
    // Extract title from first H1 heading
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        metadata.title = titleMatch[1].trim();
    }
    // Extract created date if available
    const createdMatch = markdown.match(/\*\*Created:\*\*\s+(.+)$/m);
    if (createdMatch) {
        metadata.created = createdMatch[1].trim();
    }
    // Extract plan ID if available
    const planIdMatch = markdown.match(/\*\*Plan ID:\*\*\s+(.+)$/m);
    if (planIdMatch) {
        metadata.planId = planIdMatch[1].trim();
    }
    return metadata;
}
exports.extractMarkdownMetadata = extractMarkdownMetadata;
// Get brief content preview (first few paragraphs)
function getMarkdownPreview(markdown, maxLength = 150) {
    // Remove headings and metadata
    const contentWithoutHeaders = markdown
        .replace(/^#.*$/mg, '')
        .replace(/\*\*[\w\s]+:\*\*.*$/mg, '')
        .trim();
    // Get first few paragraphs
    const paragraphs = contentWithoutHeaders.split(/\n\s*\n/);
    let preview = '';
    for (const p of paragraphs) {
        if (p.trim() && !p.startsWith('#')) {
            preview += p.trim() + '\n\n';
            if (preview.length > maxLength) {
                preview = preview.substring(0, maxLength) + '...';
                break;
            }
        }
    }
    return preview.trim();
}
exports.getMarkdownPreview = getMarkdownPreview;
// Parse markdown content and convert to HTML with interactive elements
function parseMarkdownForInteractivity(markdown) {
    let html = markdown;
    // Convert headers
    html = html.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    // Convert bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    // Convert inline code and code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code)}</code></pre>`;
    });
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Convert lists
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // Wrap consecutive list items in ul/ol tags
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
        return '<ul>\n' + match + '</ul>\n';
    });
    // Convert blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    // Convert horizontal rules
    html = html.replace(/^---+$/gm, '<hr>');
    // Convert checkboxes
    html = html.replace(/\[ \]/g, '<input type="checkbox">');
    html = html.replace(/\[x\]/g, '<input type="checkbox" checked>');
    // Convert paragraphs
    const lines = html.split('\n');
    const processedLines = [];
    let inParagraph = false;
    let paragraphContent = '';
    for (const line of lines) {
        const trimmedLine = line.trim();
        // Check if line is already HTML or empty
        if (trimmedLine.startsWith('<') || trimmedLine === '') {
            if (inParagraph && paragraphContent) {
                processedLines.push(`<p>${paragraphContent}</p>`);
                paragraphContent = '';
                inParagraph = false;
            }
            if (trimmedLine) {
                processedLines.push(line);
            }
        }
        else {
            // Regular text line
            if (inParagraph) {
                paragraphContent += ' ' + trimmedLine;
            }
            else {
                paragraphContent = trimmedLine;
                inParagraph = true;
            }
        }
    }
    // Add any remaining paragraph content
    if (inParagraph && paragraphContent) {
        processedLines.push(`<p>${paragraphContent}</p>`);
    }
    html = processedLines.join('\n');
    // Add section wrappers for collapsible sections
    const headings = html.match(/<h[1-6]>.*?<\/h[1-6]>/g) || [];
    headings.forEach((heading, index) => {
        const level = heading.match(/<h(\d)>/)?.[1] || '1';
        const text = heading.replace(/<\/?h\d>/g, '');
        const id = text.toLowerCase().replace(/[^\w]+/g, '-');
        const wrappedHeading = `<div class="heading-wrapper" id="${id}" data-level="${level}">${heading}</div>`;
        html = html.replace(heading, wrappedHeading);
    });
    return html;
}
exports.parseMarkdownForInteractivity = parseMarkdownForInteractivity;
// Helper function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
// Load a plan file and prepare it for display
function loadPlanFile(planPath) {
    try {
        if (!fs.existsSync(planPath)) {
            return {
                content: '# Plan Not Found\n\nThe requested plan file could not be found.',
                metadata: { title: 'Plan Not Found' }
            };
        }
        const content = fs.readFileSync(planPath, 'utf8');
        const metadata = extractMarkdownMetadata(content);
        return { content, metadata };
    }
    catch (error) {
        return {
            content: `# Error Loading Plan\n\n${error}`,
            metadata: { title: 'Error Loading Plan' }
        };
    }
}
exports.loadPlanFile = loadPlanFile;
// Generate table of contents HTML from headers
function generateTableOfContents(headers) {
    const toc = ['<ul class="toc-list">'];
    const stack = [];
    headers.forEach(header => {
        while (stack.length > 0 && stack[stack.length - 1] >= header.level) {
            stack.pop();
            toc.push('</ul>');
        }
        if (stack.length === 0 || stack[stack.length - 1] < header.level) {
            if (stack.length > 0) {
                toc.push('<ul>');
            }
            stack.push(header.level);
        }
        toc.push(`<li class="toc-list-item"><a href="#${header.id}">${header.text}</a></li>`);
    });
    while (stack.length > 0) {
        stack.pop();
        toc.push('</ul>');
    }
    return toc.join('\n');
}
exports.generateTableOfContents = generateTableOfContents;
/**
 * Extract plan name without timestamp and phase suffixes
 * @param fileName File name to extract plan name from
 * @returns Normalized plan name for matching
 */
function extractPlanName(fileName) {
    // Remove file extension and any phase suffixes
    const baseName = fileName
        .replace(/\.md$/, '')
        .replace(/_EXECUTED$/, '')
        .replace(/_VERIFICATION$/, '');
    // Extract parts after timestamp (YYYYMMDD_HHMMSS_)
    const parts = baseName.split('_');
    if (parts.length >= 3) {
        // Skip the first two parts (date and time) and join the rest
        return parts.slice(2).join('_');
    }
    return baseName;
}
exports.extractPlanName = extractPlanName;
// Check if a plan has corresponding Phase 2 and Phase 3 documents
function checkPlanPhaseStatus(planPath) {
    const basePath = path.dirname(path.dirname(planPath));
    const planFileName = path.basename(planPath);
    const planName = extractPlanName(planFileName);
    const phase2Path = path.join(basePath, '2_post_exec_plans');
    const phase3Path = path.join(basePath, '3_checked_delta_exec_plans');
    let phase2 = false;
    let phase2FilePath;
    if (fs.existsSync(phase2Path)) {
        // Find matching Phase 2 file by plan name (not timestamp)
        const phase2Files = fs.readdirSync(phase2Path)
            .filter(file => {
            const fileName = extractPlanName(file);
            return file.endsWith('.md') && fileName === planName && file.includes('EXECUTED');
        });
        if (phase2Files.length > 0) {
            phase2 = true;
            phase2FilePath = path.join(phase2Path, phase2Files[0]);
        }
    }
    let phase3 = false;
    let phase3FilePath;
    if (fs.existsSync(phase3Path)) {
        // Find matching Phase 3 file by plan name (not timestamp)
        const phase3Files = fs.readdirSync(phase3Path)
            .filter(file => {
            const fileName = extractPlanName(file);
            return file.endsWith('.md') && fileName === planName && file.includes('VERIFICATION');
        });
        if (phase3Files.length > 0) {
            phase3 = true;
            phase3FilePath = path.join(phase3Path, phase3Files[0]);
        }
    }
    return {
        phase2,
        phase3,
        phase2Path: phase2FilePath,
        phase3Path: phase3FilePath
    };
}
exports.checkPlanPhaseStatus = checkPlanPhaseStatus;
//# sourceMappingURL=markdownParser.js.map