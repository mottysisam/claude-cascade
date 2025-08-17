/**
 * Claude Cascade Design System - Professional SVG Icon Library
 * 
 * This file contains a library of professional SVG icons used in the extension.
 * These replace the amateur emoji icons with consistent, professional design.
 */

// Icon mapping
const iconMapping: Record<string, string> = {
  // Phase icons
  planning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>`,
  
  execution: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>`,
  
  verification: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="M9 12l2 2 4-4"></path>
  </svg>`,
  
  // Status icons
  checkmark: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 6L9 17l-5-5"></path>
  </svg>`,
  
  x: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>`,
  
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>`,
  
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>`,
  
  // Navigation icons
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>`,
  
  refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M23 4v6h-6"></path>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>`,
  
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>`,
  
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>`,
  
  // Action icons
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>`,
  
  plus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>`,
  
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>`,
  
  eye: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>`,
  
  // Analytics icons
  trendUp: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>`,
  
  trendDown: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>`,
  
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>`,
  
  // Specialized icons for the extension
  cascade: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 20h.01"></path>
    <path d="M7 20v-4"></path>
    <path d="M12 20v-8"></path>
    <path d="M17 20v-10"></path>
    <path d="M22 4v16"></path>
  </svg>`
};

/**
 * Get SVG HTML with specific class
 * @param iconName Name of the icon
 * @param className CSS class to add to the SVG
 * @returns SVG HTML with class
 */
export function getSvgWithClass(iconName: string, className: string): string {
  const svg = iconMapping[iconName];
  if (!svg) return '';
  
  return svg.replace('<svg', `<svg class="${className}"`);
}

/**
 * Generate SVG icon HTML
 * @param iconName Name of the icon
 * @returns SVG HTML
 */
export function generateHtml(iconName: string): string {
  return iconMapping[iconName] || '';
}

/**
 * Helper function to create a status badge with appropriate icon
 * @param status Status type ('success', 'warning', 'error', 'neutral')
 * @param text Badge text content
 * @returns HTML string for the status badge
 */
export function createStatusBadge(status: 'success' | 'warning' | 'error' | 'neutral', text: string): string {
  const iconMap: Record<string, string> = {
    'success': 'checkmark',
    'warning': 'warning',
    'error': 'x',
    'neutral': 'info'
  };
  
  const icon = getSvgWithClass(iconMap[status], 'status-badge-icon');
  
  return `
    <span class="status-badge status-badge-${status}">
      ${icon}
      <span>${text}</span>
    </span>
  `;
}

/**
 * Generate a progress ring SVG with the given percentage
 * @param percentage Completion percentage (0-100)
 * @param size Ring size in pixels
 * @param strokeWidth Ring stroke width
 * @param colorClass CSS color class to apply
 * @returns HTML string for the progress ring
 */
export function createProgressRing(percentage: number, size: number = 64, strokeWidth: number = 4, colorClass: string = 'primary'): string {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const colorMap: Record<string, string> = {
    'primary': 'var(--primary-500)',
    'success': 'var(--success-500)',
    'warning': 'var(--warning-500)',
    'error': 'var(--error-500)',
  };
  
  const color = colorMap[colorClass] || colorMap.primary;
  
  return `
    <div class="progress-ring" style="width: ${size}px; height: ${size}px;">
      <svg width="${size}" height="${size}">
        <circle 
          stroke="var(--surface-tertiary)"
          stroke-width="${strokeWidth}"
          fill="transparent"
          r="${radius}"
          cx="${size/2}"
          cy="${size/2}"
        />
        <circle
          class="progress-ring-circle"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          fill="transparent"
          stroke-dasharray="${circumference} ${circumference}"
          stroke-dashoffset="${offset}"
          r="${radius}"
          cx="${size/2}"
          cy="${size/2}"
        />
      </svg>
      <div class="progress-ring-text">
        ${percentage}%
      </div>
    </div>
  `;
}

/**
 * Create a phase indicator with the appropriate styling
 * @param phase Phase number (1-3)
 * @param status Status of the phase ('complete', 'missing', undefined for neutral)
 * @param label Optional text label to display
 * @returns HTML string for the phase indicator
 */
export function createPhaseIndicator(phase: 1 | 2 | 3, status?: 'complete' | 'missing', label?: string): string {
  const iconMap: Record<number, string> = {
    1: 'planning',
    2: 'execution',
    3: 'verification'
  };
  
  const icon = getSvgWithClass(iconMap[phase], 'phase-icon');
  const statusClass = status ? `phase-indicator-${status}` : '';
  
  return `
    <div class="phase-indicator phase-indicator-${phase} ${statusClass}">
      ${icon}
      ${label ? `<span class="phase-label">${label}</span>` : ''}
    </div>
  `;
}

// Export everything
export const Icons = {
  ...iconMapping,
  getSvgWithClass,
  generateHtml,
  createStatusBadge,
  createProgressRing,
  createPhaseIndicator
};