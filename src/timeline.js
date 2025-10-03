export class Timeline {
    constructor(appState, onYearSelect) {
        this.appState = appState;
        this.onYearSelect = onYearSelect;
        this.allStrikes = [];
        this.currentYear = null;
        this.isPlaying = false;
        this.playInterval = null;
        this.startYear = 2004;
        this.endYear = 2020;
        
        this.initialize();
    }

    initialize() {
        this.createTimelineHTML();
        this.bindEvents();
    }

    createTimelineHTML() {
        // Use existing timeline container from HTML
        this.timelineContainer = document.querySelector('.timeline-container');
        if (!this.timelineContainer) {
            console.error('Timeline container not found in HTML');
            return;
        }
        
        // Find the timeline bars container
        this.timelineBars = this.timelineContainer.querySelector('.timeline-bars');
        
        // Create tooltip if it doesn't exist
        let tooltip = this.timelineContainer.querySelector('.timeline-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'timeline-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                z-index: 1001;
                display: none;
                white-space: nowrap;
            `;
            this.timelineContainer.appendChild(tooltip);
        }
        this.tooltip = tooltip;
        
        // Update the play controls to include our buttons
        const playControls = this.timelineContainer.querySelector('.play-controls');
        if (playControls) {
            playControls.innerHTML = `
                <button class="play-btn" data-cy="play-btn">Play</button>
                <button class="play-btn" data-cy="reset-timeline-btn">Reset</button>
                <span class="timeline-selected-year" data-cy="timeline-selected-year" style="margin-left: 12px; font-weight: 500; color: #fbbf24;">All Years</span>
            `;
        }
    }

    bindEvents() {
        // Play button
        const playBtn = document.querySelector('[data-cy="play-btn"]');
        playBtn?.addEventListener('click', () => this.togglePlay());
        
        // Reset button
        const resetBtn = document.querySelector('[data-cy="reset-timeline-btn"]');
        resetBtn?.addEventListener('click', () => this.reset());
    }

    processStrikeData() {
        // Extract all strikes from country level data
        this.allStrikes = [];
        
        Object.keys(this.appState.geojson).forEach(country => {
            if (this.appState.geojson[country][0] && this.appState.geojson[country][0].features) {
                const countryFeature = this.appState.geojson[country][0].features[0];
                if (countryFeature && countryFeature.properties) {
                    const props = countryFeature.properties;
                    
                    // Process dates and create strike records
                    if (props.dates && Array.isArray(props.dates)) {
                        props.dates.forEach((date, index) => {
                            const [day, month, year] = date.split('/');
                            const strikeDate = new Date(`${year}-${month}-${day}`);
                            
                            this.allStrikes.push({
                                country: country,
                                date: strikeDate,
                                year: parseInt(year),
                                minTotal: props.min_total?.[index] || 0,
                                maxTotal: props.max_total?.[index] || 0,
                                minCivilians: props.min_civilians?.[index] || 0,
                                maxCivilians: props.max_civilians?.[index] || 0,
                                minChildren: props.min_children?.[index] || 0,
                                maxChildren: props.max_children?.[index] || 0,
                                location: props.locations?.[index] || null
                            });
                        });
                    }
                }
            }
        });

        // Sort strikes by date
        this.allStrikes.sort((a, b) => a.date - b.date);
        this.renderTimeline();
    }

    renderTimeline() {
        if (!this.timelineBars) {
            console.error('Timeline bars container not found');
            return;
        }
        
        this.timelineBars.innerHTML = '';
        
        // Calculate strikes per year
        const strikesByYear = {};
        for (let year = this.startYear; year <= this.endYear; year++) {
            strikesByYear[year] = this.allStrikes.filter(s => s.year === year).length;
        }
        
        // Find max for scaling
        const maxStrikes = Math.max(...Object.values(strikesByYear), 1);
        
        // Create bars
        for (let year = this.startYear; year <= this.endYear; year++) {
            const bar = document.createElement('div');
            bar.className = 'timeline-bar';
            bar.setAttribute('data-cy', 'timeline-bar');
            bar.setAttribute('data-year', year);
            
            // Calculate height with minimum of 10%
            const height = Math.max(10, (strikesByYear[year] / maxStrikes) * 90 + 10);
            bar.style.height = `${height}%`;
            bar.title = `${year}: ${strikesByYear[year]} strikes`;
            
            // Add event listeners
            bar.addEventListener('click', () => this.selectYear(year));
            bar.addEventListener('mouseover', (e) => this.showTooltip(e, year, strikesByYear[year]));
            bar.addEventListener('mouseout', () => this.hideTooltip());
            
            this.timelineBars.appendChild(bar);
        }
    }

    selectYear(year) {
        this.currentYear = year;
        
        // Update selected year display
        const selectedYearEl = document.querySelector('[data-cy="timeline-selected-year"]');
        if (selectedYearEl) {
            selectedYearEl.textContent = year.toString();
        }
        
        // Update bar selection
        document.querySelectorAll('[data-cy="timeline-bar"]').forEach(bar => {
            bar.classList.remove('selected');
            if (parseInt(bar.dataset.year) === year) {
                bar.classList.add('selected');
            }
        });
        
        // Filter strikes and notify callback
        const yearStrikes = this.allStrikes.filter(s => s.year === year);
        this.onYearSelect(year, yearStrikes);
    }

    reset() {
        this.currentYear = null;
        
        // Update selected year display
        const selectedYearEl = document.querySelector('[data-cy="timeline-selected-year"]');
        if (selectedYearEl) {
            selectedYearEl.textContent = 'All Years';
        }
        
        // Remove bar selection
        document.querySelectorAll('[data-cy="timeline-bar"]').forEach(bar => {
            bar.classList.remove('selected');
        });
        
        // Stop playing if active
        if (this.isPlaying) {
            this.togglePlay();
        }
        
        // Reset to all data
        this.onYearSelect(null, this.allStrikes);
    }

    togglePlay() {
        const playBtn = document.querySelector('[data-cy="play-btn"]');
        
        if (this.isPlaying) {
            // Stop playing
            this.isPlaying = false;
            if (this.playInterval) {
                clearInterval(this.playInterval);
                this.playInterval = null;
            }
            if (playBtn) playBtn.textContent = 'Play';
        } else {
            // Start playing
            this.isPlaying = true;
            if (playBtn) playBtn.textContent = 'Pause';
            
            let currentYear = this.startYear;
            this.playInterval = setInterval(() => {
                if (currentYear > this.endYear) {
                    this.togglePlay(); // Stop at end
                    return;
                }
                
                this.selectYear(currentYear);
                currentYear++;
            }, 1000);
        }
    }

    showTooltip(event, year, strikes) {
        const tooltip = this.tooltip;
        tooltip.textContent = `${year}: ${strikes} strikes`;
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 30}px`;
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    show() {
        this.timelineContainer.classList.add('visible');
        // Process data if not already done
        if (this.allStrikes.length === 0 && this.appState.geojson) {
            this.processStrikeData();
        }
    }

    hide() {
        this.timelineContainer.classList.remove('visible');
    }

    updateData() {
        // Reprocess data when app state changes
        if (this.appState.geojson) {
            this.processStrikeData();
        }
    }
}