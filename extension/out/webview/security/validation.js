"use strict";
// Security & Validation System
// Inspired by Claude-Autopilot's security-first approach
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.validateCSRFToken = exports.generateCSRFToken = exports.safeJsonStringify = exports.safeJsonParse = exports.checkRateLimit = exports.generateCSP = exports.validateFilePath = exports.validatePhase = exports.validateUrl = exports.validateEmail = exports.validatePlanContent = exports.validatePlanTitle = exports.isAllowedAttribute = exports.sanitizeAttributeValue = exports.sanitizeClassName = exports.createSafeElement = exports.sanitizeUrl = exports.sanitizeHtml = exports.getAllowDangerousXssbypass = exports.setAllowDangerousXssbypass = void 0;
// XSS Prevention Configuration
let allowDangerousXssbypass = false;
function setAllowDangerousXssbypass(value) {
    allowDangerousXssbypass = value;
    console.warn(`XSS bypass is ${value ? 'ENABLED' : 'disabled'}`);
}
exports.setAllowDangerousXssbypass = setAllowDangerousXssbypass;
function getAllowDangerousXssbypass() {
    return allowDangerousXssbypass;
}
exports.getAllowDangerousXssbypass = getAllowDangerousXssbypass;
// HTML Sanitization
const ALLOWED_TAGS = [
    'p', 'div', 'span', 'a', 'b', 'i', 'u', 'strong', 'em',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'br', 'hr',
    'pre', 'code', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon'
];
const ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
    'svg': ['width', 'height', 'viewBox', 'fill', 'stroke', 'xmlns'],
    'path': ['d', 'fill', 'stroke', 'stroke-width'],
    'circle': ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'],
    'rect': ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke'],
    '*': ['class', 'id', 'style', 'data-*']
};
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];
function sanitizeHtml(html) {
    if (allowDangerousXssbypass) {
        return html; // Bypass sanitization if explicitly allowed
    }
    // Basic HTML entity encoding for critical characters
    const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    return String(html).replace(/[&<>"'`=\/]/g, (s) => entityMap[s] || s);
}
exports.sanitizeHtml = sanitizeHtml;
function sanitizeUrl(url) {
    if (!url)
        return '';
    const trimmedUrl = url.trim().toLowerCase();
    // Check for dangerous protocols
    for (const protocol of DANGEROUS_PROTOCOLS) {
        if (trimmedUrl.startsWith(protocol)) {
            console.warn(`Dangerous URL protocol blocked: ${protocol}`);
            return '#';
        }
    }
    // Allow relative URLs and safe protocols
    if (trimmedUrl.startsWith('http://') ||
        trimmedUrl.startsWith('https://') ||
        trimmedUrl.startsWith('/') ||
        trimmedUrl.startsWith('#') ||
        trimmedUrl.startsWith('mailto:')) {
        return url;
    }
    // Default to https for URLs without protocol
    if (!trimmedUrl.includes(':')) {
        return `https://${url}`;
    }
    return '#';
}
exports.sanitizeUrl = sanitizeUrl;
// Safe Element Creation
function createSafeElement(tagName, content = '', className = '', attributes = {}) {
    const element = document.createElement(tagName);
    // Set text content safely
    if (content) {
        element.textContent = content;
    }
    // Set class safely
    if (className) {
        element.className = sanitizeClassName(className);
    }
    // Set attributes safely
    for (const [key, value] of Object.entries(attributes)) {
        if (isAllowedAttribute(tagName, key)) {
            if (key === 'href' || key === 'src') {
                element.setAttribute(key, sanitizeUrl(value));
            }
            else {
                element.setAttribute(key, sanitizeAttributeValue(value));
            }
        }
    }
    return element;
}
exports.createSafeElement = createSafeElement;
function sanitizeClassName(className) {
    // Remove potentially dangerous characters from class names
    return className.replace(/[^a-zA-Z0-9-_\s]/g, '');
}
exports.sanitizeClassName = sanitizeClassName;
function sanitizeAttributeValue(value) {
    // Remove potentially dangerous characters from attribute values
    return value.replace(/["'<>]/g, '');
}
exports.sanitizeAttributeValue = sanitizeAttributeValue;
function isAllowedAttribute(tagName, attributeName) {
    const tagSpecific = ALLOWED_ATTRIBUTES[tagName.toLowerCase()];
    const universal = ALLOWED_ATTRIBUTES['*'];
    if (tagSpecific && tagSpecific.includes(attributeName)) {
        return true;
    }
    if (universal) {
        for (const pattern of universal) {
            if (pattern.endsWith('*')) {
                const prefix = pattern.slice(0, -1);
                if (attributeName.startsWith(prefix)) {
                    return true;
                }
            }
            else if (pattern === attributeName) {
                return true;
            }
        }
    }
    return false;
}
exports.isAllowedAttribute = isAllowedAttribute;
// Input Validation
function validatePlanTitle(title) {
    if (!title || title.trim().length === 0) {
        return { valid: false, error: 'Title is required' };
    }
    if (title.length < 3) {
        return { valid: false, error: 'Title must be at least 3 characters' };
    }
    if (title.length > 100) {
        return { valid: false, error: 'Title must be less than 100 characters' };
    }
    // Check for valid characters
    const validPattern = /^[A-Za-z0-9\s\-_.,!?()]+$/;
    if (!validPattern.test(title)) {
        return { valid: false, error: 'Title contains invalid characters' };
    }
    return { valid: true };
}
exports.validatePlanTitle = validatePlanTitle;
function validatePlanContent(content) {
    if (!content || content.trim().length === 0) {
        return { valid: false, error: 'Content is required' };
    }
    if (content.length > 1048576) { // 1MB limit
        return { valid: false, error: 'Content exceeds maximum size (1MB)' };
    }
    return { valid: true };
}
exports.validatePlanContent = validatePlanContent;
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.validateEmail = validateEmail;
function validateUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
exports.validateUrl = validateUrl;
function validatePhase(phase) {
    return ['pre-execution', 'post-execution', 'verification'].includes(phase);
}
exports.validatePhase = validatePhase;
// File Path Validation
function validateFilePath(path) {
    if (!path) {
        return { valid: false, error: 'Path is required' };
    }
    // Check for path traversal attempts
    if (path.includes('../') || path.includes('..\\')) {
        return { valid: false, error: 'Path traversal detected' };
    }
    // Check for absolute paths (security risk)
    if (path.startsWith('/') || path.match(/^[A-Za-z]:\\/)) {
        return { valid: false, error: 'Absolute paths not allowed' };
    }
    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs'];
    const extension = path.substring(path.lastIndexOf('.')).toLowerCase();
    if (dangerousExtensions.includes(extension)) {
        return { valid: false, error: `File type ${extension} not allowed` };
    }
    return { valid: true };
}
exports.validateFilePath = validateFilePath;
// Content Security Policy Helper
function generateCSP() {
    const policies = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' vscode-resource:",
        "style-src 'self' 'unsafe-inline' vscode-resource:",
        "img-src 'self' data: vscode-resource: https:",
        "font-src 'self' vscode-resource:",
        "connect-src 'self' ws: wss: https:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'"
    ];
    return policies.join('; ');
}
exports.generateCSP = generateCSP;
// Rate Limiting
const rateLimitMap = new Map();
function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const limit = rateLimitMap.get(key);
    if (!limit || now > limit.resetTime) {
        rateLimitMap.set(key, {
            count: 1,
            resetTime: now + windowMs
        });
        return true;
    }
    if (limit.count >= maxRequests) {
        return false;
    }
    limit.count++;
    return true;
}
exports.checkRateLimit = checkRateLimit;
// JSON Validation
function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch (error) {
        console.error('JSON parse error:', error);
        return fallback || null;
    }
}
exports.safeJsonParse = safeJsonParse;
function safeJsonStringify(obj, space) {
    try {
        return JSON.stringify(obj, null, space);
    }
    catch (error) {
        console.error('JSON stringify error:', error);
        return '{}';
    }
}
exports.safeJsonStringify = safeJsonStringify;
// CSRF Token Management
let csrfToken = null;
function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return csrfToken;
}
exports.generateCSRFToken = generateCSRFToken;
function validateCSRFToken(token) {
    return token === csrfToken;
}
exports.validateCSRFToken = validateCSRFToken;
// Permission Validation
function hasPermission(action, resource) {
    // Implement permission checking logic
    // This is a placeholder - integrate with your permission system
    const permissions = {
        'create': ['plan', 'file'],
        'read': ['plan', 'file', 'config'],
        'update': ['plan', 'file', 'config'],
        'delete': ['plan', 'file']
    };
    return permissions[action]?.includes(resource) || false;
}
exports.hasPermission = hasPermission;
// Export all validation functions
exports.default = {
    setAllowDangerousXssbypass,
    getAllowDangerousXssbypass,
    sanitizeHtml,
    sanitizeUrl,
    createSafeElement,
    sanitizeClassName,
    sanitizeAttributeValue,
    isAllowedAttribute,
    validatePlanTitle,
    validatePlanContent,
    validateEmail,
    validateUrl,
    validatePhase,
    validateFilePath,
    generateCSP,
    checkRateLimit,
    safeJsonParse,
    safeJsonStringify,
    generateCSRFToken,
    validateCSRFToken,
    hasPermission
};
//# sourceMappingURL=validation.js.map