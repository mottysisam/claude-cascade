"use strict";
// Phase Progress Chart Component
// Aurora-themed chart visualization for phase tracking
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhaseChart = void 0;
const validation_1 = require("../security/validation");
const state_1 = require("../core/state");
class PhaseChart {
    constructor(options = {}) {
        this.container = null;
        this.svgElement = null;
        this.data = [];
        this.id = `aurora-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.options = {
            width: options.width || 400,
            height: options.height || 300,
            type: options.type || 'bar',
            showLabels: options.showLabels !== false,
            showValues: options.showValues !== false,
            showGrid: options.showGrid !== false,
            animated: options.animated !== false,
            animationDuration: options.animationDuration || 1000
        };
    }
    // Initialize chart
    initialize(container, data) {
        this.container = container;
        this.data = data;
        this.render();
        (0, state_1.logActivity)('phaseChartInitialized', {
            id: this.id,
            type: this.options.type,
            dataPoints: data.length
        });
    }
    // Render chart based on type
    render() {
        if (!this.container)
            return;
        this.container.innerHTML = '';
        this.container.className = 'aurora-chart-container';
        const wrapper = (0, validation_1.createSafeElement)('div', '', 'aurora-chart-wrapper');
        wrapper.style.width = `${this.options.width}px`;
        wrapper.style.height = `${this.options.height}px`;
        switch (this.options.type) {
            case 'bar':
                this.renderBarChart(wrapper);
                break;
            case 'line':
                this.renderLineChart(wrapper);
                break;
            case 'area':
                this.renderAreaChart(wrapper);
                break;
            case 'donut':
                this.renderDonutChart(wrapper);
                break;
            default:
                this.renderBarChart(wrapper);
        }
        this.container.appendChild(wrapper);
    }
    // Render bar chart
    renderBarChart(wrapper) {
        // Create SVG
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.setAttribute('width', this.options.width.toString());
        this.svgElement.setAttribute('height', this.options.height.toString());
        this.svgElement.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
        this.svgElement.classList.add('aurora-chart-svg');
        const padding = 40;
        const chartWidth = this.options.width - (padding * 2);
        const chartHeight = this.options.height - (padding * 2);
        const barWidth = chartWidth / this.data.length;
        // Create gradient definitions
        this.createGradients();
        // Draw grid if enabled
        if (this.options.showGrid) {
            this.drawGrid(padding, chartWidth, chartHeight);
        }
        // Draw bars
        this.data.forEach((phase, index) => {
            const percentage = phase.total > 0 ? (phase.completed / phase.total) * 100 : 0;
            const barHeight = (percentage / 100) * chartHeight;
            const x = padding + (index * barWidth) + (barWidth * 0.1);
            const y = padding + chartHeight - barHeight;
            const width = barWidth * 0.8;
            // Create bar group
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.classList.add('aurora-chart-bar-group');
            // Create bar rectangle
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('x', x.toString());
            bar.setAttribute('y', (padding + chartHeight).toString());
            bar.setAttribute('width', width.toString());
            bar.setAttribute('height', '0');
            bar.setAttribute('fill', `url(#aurora-gradient-${this.id}-${index})`);
            bar.setAttribute('rx', '4');
            bar.classList.add('aurora-chart-bar');
            // Animate bar
            if (this.options.animated) {
                const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animate.setAttribute('attributeName', 'height');
                animate.setAttribute('from', '0');
                animate.setAttribute('to', barHeight.toString());
                animate.setAttribute('dur', `${this.options.animationDuration}ms`);
                animate.setAttribute('fill', 'freeze');
                bar.appendChild(animate);
                const animateY = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animateY.setAttribute('attributeName', 'y');
                animateY.setAttribute('from', (padding + chartHeight).toString());
                animateY.setAttribute('to', y.toString());
                animateY.setAttribute('dur', `${this.options.animationDuration}ms`);
                animateY.setAttribute('fill', 'freeze');
                bar.appendChild(animateY);
            }
            else {
                bar.setAttribute('height', barHeight.toString());
                bar.setAttribute('y', y.toString());
            }
            // Add hover effect
            bar.addEventListener('mouseenter', () => {
                bar.style.filter = 'brightness(1.2)';
                this.showTooltip(phase, x + width / 2, y);
            });
            bar.addEventListener('mouseleave', () => {
                bar.style.filter = '';
                this.hideTooltip();
            });
            group.appendChild(bar);
            // Add value label if enabled
            if (this.options.showValues) {
                const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                valueText.setAttribute('x', (x + width / 2).toString());
                valueText.setAttribute('y', (y - 5).toString());
                valueText.setAttribute('text-anchor', 'middle');
                valueText.setAttribute('class', 'aurora-chart-value');
                valueText.textContent = `${Math.round(percentage)}%`;
                if (this.options.animated) {
                    valueText.style.opacity = '0';
                    setTimeout(() => {
                        valueText.style.transition = 'opacity 300ms';
                        valueText.style.opacity = '1';
                    }, this.options.animationDuration);
                }
                group.appendChild(valueText);
            }
            // Add label if enabled
            if (this.options.showLabels) {
                const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                labelText.setAttribute('x', (x + width / 2).toString());
                labelText.setAttribute('y', (padding + chartHeight + 20).toString());
                labelText.setAttribute('text-anchor', 'middle');
                labelText.setAttribute('class', 'aurora-chart-label');
                labelText.textContent = phase.name;
                group.appendChild(labelText);
            }
            this.svgElement.appendChild(group);
        });
        wrapper.appendChild(this.svgElement);
    }
    // Render line chart
    renderLineChart(wrapper) {
        // Create SVG
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.setAttribute('width', this.options.width.toString());
        this.svgElement.setAttribute('height', this.options.height.toString());
        this.svgElement.classList.add('aurora-chart-svg');
        const padding = 40;
        const chartWidth = this.options.width - (padding * 2);
        const chartHeight = this.options.height - (padding * 2);
        const pointSpacing = chartWidth / (this.data.length - 1 || 1);
        // Draw grid
        if (this.options.showGrid) {
            this.drawGrid(padding, chartWidth, chartHeight);
        }
        // Create line path
        let pathData = '';
        const points = [];
        this.data.forEach((phase, index) => {
            const percentage = phase.total > 0 ? (phase.completed / phase.total) * 100 : 0;
            const x = padding + (index * pointSpacing);
            const y = padding + chartHeight - ((percentage / 100) * chartHeight);
            if (index === 0) {
                pathData = `M ${x} ${y}`;
            }
            else {
                pathData += ` L ${x} ${y}`;
            }
            points.push({ x, y, data: phase });
        });
        // Create gradient for line
        this.createLineGradient();
        // Draw line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', pathData);
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', `url(#aurora-line-gradient-${this.id})`);
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('stroke-linejoin', 'round');
        line.classList.add('aurora-chart-line');
        // Animate line drawing
        if (this.options.animated) {
            const length = line.getTotalLength();
            line.style.strokeDasharray = `${length}`;
            line.style.strokeDashoffset = `${length}`;
            line.style.animation = `aurora-draw-line ${this.options.animationDuration}ms ease-out forwards`;
        }
        this.svgElement.appendChild(line);
        // Draw points
        points.forEach((point, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x.toString());
            circle.setAttribute('cy', point.y.toString());
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', 'var(--aurora-primary)');
            circle.setAttribute('stroke', 'var(--aurora-bg)');
            circle.setAttribute('stroke-width', '2');
            circle.classList.add('aurora-chart-point');
            // Animate points
            if (this.options.animated) {
                circle.style.opacity = '0';
                circle.style.transform = 'scale(0)';
                circle.style.transformOrigin = 'center';
                setTimeout(() => {
                    circle.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
                    circle.style.opacity = '1';
                    circle.style.transform = 'scale(1)';
                }, this.options.animationDuration + (index * 50));
            }
            // Add hover effect
            circle.addEventListener('mouseenter', () => {
                circle.setAttribute('r', '7');
                this.showTooltip(point.data, point.x, point.y);
            });
            circle.addEventListener('mouseleave', () => {
                circle.setAttribute('r', '5');
                this.hideTooltip();
            });
            this.svgElement.appendChild(circle);
            // Add labels
            if (this.options.showLabels) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', point.x.toString());
                label.setAttribute('y', (padding + chartHeight + 20).toString());
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('class', 'aurora-chart-label');
                label.textContent = point.data.name;
                this.svgElement.appendChild(label);
            }
        });
        wrapper.appendChild(this.svgElement);
    }
    // Render area chart
    renderAreaChart(wrapper) {
        // Similar to line chart but with filled area
        this.renderLineChart(wrapper);
        // Add area fill
        if (this.svgElement) {
            const padding = 40;
            const chartHeight = this.options.height - (padding * 2);
            const line = this.svgElement.querySelector('.aurora-chart-line');
            if (line) {
                const pathData = line.getAttribute('d') || '';
                const areaPath = pathData + ` L ${this.options.width - padding} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;
                const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                area.setAttribute('d', areaPath);
                area.setAttribute('fill', `url(#aurora-area-gradient-${this.id})`);
                area.setAttribute('opacity', '0.3');
                area.classList.add('aurora-chart-area');
                this.svgElement.insertBefore(area, line);
            }
        }
    }
    // Render donut chart
    renderDonutChart(wrapper) {
        const size = Math.min(this.options.width, this.options.height);
        const center = size / 2;
        const radius = size * 0.35;
        const innerRadius = radius * 0.6;
        // Create SVG
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.setAttribute('width', size.toString());
        this.svgElement.setAttribute('height', size.toString());
        this.svgElement.classList.add('aurora-chart-svg');
        // Calculate total
        const total = this.data.reduce((sum, phase) => sum + phase.completed, 0);
        let currentAngle = -90; // Start at top
        this.data.forEach((phase, index) => {
            const percentage = total > 0 ? (phase.completed / total) * 100 : 0;
            const angle = (percentage / 100) * 360;
            // Create path for segment
            const path = this.createDonutSegment(center, center, radius, innerRadius, currentAngle, currentAngle + angle);
            const segment = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            segment.setAttribute('d', path);
            segment.setAttribute('fill', `url(#aurora-gradient-${this.id}-${index})`);
            segment.classList.add('aurora-chart-segment');
            // Animate segment
            if (this.options.animated) {
                segment.style.transform = 'scale(0)';
                segment.style.transformOrigin = `${center}px ${center}px`;
                setTimeout(() => {
                    segment.style.transition = `transform ${this.options.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                    segment.style.transform = 'scale(1)';
                }, index * 100);
            }
            // Add hover effect
            segment.addEventListener('mouseenter', () => {
                segment.style.transform = 'scale(1.05)';
                segment.style.filter = 'brightness(1.2)';
                this.showTooltip(phase, center, center);
            });
            segment.addEventListener('mouseleave', () => {
                segment.style.transform = 'scale(1)';
                segment.style.filter = '';
                this.hideTooltip();
            });
            this.svgElement.appendChild(segment);
            currentAngle += angle;
        });
        // Add center text
        const totalCompleted = this.data.reduce((sum, phase) => sum + phase.completed, 0);
        const totalExpected = this.data.reduce((sum, phase) => sum + phase.total, 0);
        const overallPercentage = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
        const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        centerText.setAttribute('x', center.toString());
        centerText.setAttribute('y', center.toString());
        centerText.setAttribute('text-anchor', 'middle');
        centerText.setAttribute('dominant-baseline', 'middle');
        centerText.setAttribute('class', 'aurora-chart-center-text');
        centerText.innerHTML = `
            <tspan x="${center}" dy="-0.2em" class="aurora-chart-center-value">${overallPercentage}%</tspan>
            <tspan x="${center}" dy="1.4em" class="aurora-chart-center-label">Complete</tspan>
        `;
        this.svgElement.appendChild(centerText);
        wrapper.appendChild(this.svgElement);
        // Add legend
        if (this.options.showLabels) {
            const legend = this.createLegend();
            wrapper.appendChild(legend);
        }
    }
    // Create donut segment path
    createDonutSegment(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;
        const x1 = cx + outerRadius * Math.cos(startAngleRad);
        const y1 = cy + outerRadius * Math.sin(startAngleRad);
        const x2 = cx + outerRadius * Math.cos(endAngleRad);
        const y2 = cy + outerRadius * Math.sin(endAngleRad);
        const x3 = cx + innerRadius * Math.cos(endAngleRad);
        const y3 = cy + innerRadius * Math.sin(endAngleRad);
        const x4 = cx + innerRadius * Math.cos(startAngleRad);
        const y4 = cy + innerRadius * Math.sin(startAngleRad);
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
        return `
            M ${x1} ${y1}
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
            L ${x3} ${y3}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
            Z
        `;
    }
    // Create gradients
    createGradients() {
        if (!this.svgElement)
            return;
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.data.forEach((phase, index) => {
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', `aurora-gradient-${this.id}-${index}`);
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '0%');
            gradient.setAttribute('y2', '100%');
            const colors = this.getPhaseColors(phase.status);
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', colors.start);
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', colors.end);
            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            defs.appendChild(gradient);
        });
        this.svgElement.appendChild(defs);
    }
    // Create line gradient
    createLineGradient() {
        if (!this.svgElement)
            return;
        let defs = this.svgElement.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svgElement.appendChild(defs);
        }
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', `aurora-line-gradient-${this.id}`);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '0%');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#7c3aed');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#ec4899');
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        // Area gradient
        const areaGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        areaGradient.setAttribute('id', `aurora-area-gradient-${this.id}`);
        areaGradient.setAttribute('x1', '0%');
        areaGradient.setAttribute('y1', '0%');
        areaGradient.setAttribute('x2', '0%');
        areaGradient.setAttribute('y2', '100%');
        const areaStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        areaStop1.setAttribute('offset', '0%');
        areaStop1.setAttribute('stop-color', '#7c3aed');
        areaStop1.setAttribute('stop-opacity', '0.5');
        const areaStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        areaStop2.setAttribute('offset', '100%');
        areaStop2.setAttribute('stop-color', '#7c3aed');
        areaStop2.setAttribute('stop-opacity', '0');
        areaGradient.appendChild(areaStop1);
        areaGradient.appendChild(areaStop2);
        defs.appendChild(areaGradient);
    }
    // Get phase colors based on status
    getPhaseColors(status) {
        const colorMap = {
            'completed': { start: '#10b981', end: '#14b8a6' },
            'in-progress': { start: '#6366f1', end: '#818cf8' },
            'pending': { start: '#94a3b8', end: '#cbd5e1' },
            'error': { start: '#f43f5e', end: '#ec4899' }
        };
        return colorMap[status] || colorMap.pending;
    }
    // Draw grid
    drawGrid(padding, width, height) {
        if (!this.svgElement)
            return;
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.classList.add('aurora-chart-grid');
        // Horizontal lines
        for (let i = 0; i <= 4; i++) {
            const y = padding + (height / 4) * i;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding.toString());
            line.setAttribute('y1', y.toString());
            line.setAttribute('x2', (padding + width).toString());
            line.setAttribute('y2', y.toString());
            line.setAttribute('stroke', 'var(--aurora-glass-border)');
            line.setAttribute('stroke-width', '1');
            line.setAttribute('opacity', '0.3');
            gridGroup.appendChild(line);
            // Add percentage labels
            const percentage = 100 - (i * 25);
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', (padding - 10).toString());
            label.setAttribute('y', (y + 5).toString());
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('class', 'aurora-chart-grid-label');
            label.textContent = `${percentage}%`;
            gridGroup.appendChild(label);
        }
        this.svgElement.appendChild(gridGroup);
    }
    // Create legend
    createLegend() {
        const legend = (0, validation_1.createSafeElement)('div', '', 'aurora-chart-legend');
        this.data.forEach((phase, index) => {
            const item = (0, validation_1.createSafeElement)('div', '', 'aurora-chart-legend-item');
            const dot = (0, validation_1.createSafeElement)('span', '', 'aurora-chart-legend-dot');
            const colors = this.getPhaseColors(phase.status);
            dot.style.background = `linear-gradient(135deg, ${colors.start}, ${colors.end})`;
            const label = (0, validation_1.createSafeElement)('span', phase.name, 'aurora-chart-legend-label');
            const value = (0, validation_1.createSafeElement)('span', `${phase.completed}/${phase.total}`, 'aurora-chart-legend-value');
            item.appendChild(dot);
            item.appendChild(label);
            item.appendChild(value);
            legend.appendChild(item);
        });
        return legend;
    }
    // Show tooltip
    showTooltip(phase, x, y) {
        // Remove existing tooltip
        this.hideTooltip();
        const tooltip = (0, validation_1.createSafeElement)('div', '', 'aurora-chart-tooltip');
        const percentage = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0;
        tooltip.innerHTML = `
            <div class="aurora-chart-tooltip-title">${phase.name}</div>
            <div class="aurora-chart-tooltip-content">
                <span class="aurora-chart-tooltip-label">Progress:</span>
                <span class="aurora-chart-tooltip-value">${percentage}%</span>
            </div>
            <div class="aurora-chart-tooltip-content">
                <span class="aurora-chart-tooltip-label">Completed:</span>
                <span class="aurora-chart-tooltip-value">${phase.completed}/${phase.total}</span>
            </div>
            <div class="aurora-chart-tooltip-content">
                <span class="aurora-chart-tooltip-label">Status:</span>
                <span class="aurora-chart-tooltip-status status-${phase.status}">${phase.status}</span>
            </div>
        `;
        tooltip.style.position = 'absolute';
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y - 60}px`;
        this.container?.appendChild(tooltip);
        // Position adjustment if tooltip goes out of bounds
        setTimeout(() => {
            const rect = tooltip.getBoundingClientRect();
            const containerRect = this.container?.getBoundingClientRect();
            if (containerRect) {
                if (rect.right > containerRect.right) {
                    tooltip.style.left = `${x - rect.width}px`;
                }
                if (rect.top < containerRect.top) {
                    tooltip.style.top = `${y + 20}px`;
                }
            }
        }, 0);
    }
    // Hide tooltip
    hideTooltip() {
        const tooltip = this.container?.querySelector('.aurora-chart-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    // Public API methods
    // Update chart data
    updateData(data) {
        this.data = data;
        this.render();
        (0, state_1.logActivity)('phaseChartUpdated', {
            id: this.id,
            dataPoints: data.length
        });
    }
    // Change chart type
    setType(type) {
        this.options.type = type;
        this.render();
    }
    // Destroy chart
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.container = null;
        this.svgElement = null;
        (0, state_1.logActivity)('phaseChartDestroyed', { id: this.id });
    }
}
exports.PhaseChart = PhaseChart;
// Export singleton for easy use
const phaseChart = new PhaseChart();
exports.default = phaseChart;
//# sourceMappingURL=phaseChart.js.map