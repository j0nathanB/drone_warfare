export class ViewModeSystem {
    constructor(appState, timeline, strikeVisualization) {
        this.appState = appState;
        this.timeline = timeline;
        this.strikeVisualization = strikeVisualization;
        this.currentMode = 'map';
        
        this.initialize();
    }

    initialize() {
        this.createViewComponents();
        this.bindEvents();
        this.bindHeaderToggleEvents();
        this.showViewMode('map'); // Default to map view
    }

    createViewModeButtons() {
        // Check if view mode buttons already exist
        let viewModeContainer = document.querySelector('[data-cy="view-mode-controls"]');
        if (!viewModeContainer) {
            viewModeContainer = document.createElement('div');
            viewModeContainer.setAttribute('data-cy', 'view-mode-controls');
            viewModeContainer.className = 'view-mode-controls';
            viewModeContainer.innerHTML = `
                <div class="view-mode-buttons">
                    <button class="view-mode-btn active" data-cy="map-view-btn" data-mode="map">Map</button>
                    <button class="view-mode-btn" data-cy="timeline-view-btn" data-mode="timeline">Timeline</button>
                    <button class="view-mode-btn" data-cy="compare-view-btn" data-mode="compare">Compare</button>
                    <button class="view-mode-btn" data-cy="stories-view-btn" data-mode="stories">Stories</button>
                </div>
                <div class="view-mode-loader" data-cy="view-mode-loader" style="display: none;">
                    <div class="loader-spinner"></div>
                    <span>Switching view...</span>
                </div>
            `;
            
            this.addViewModeStyles();
            
            // Insert at the top of the page
            document.body.insertBefore(viewModeContainer, document.body.firstChild);
        }
    }

    addViewModeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .view-mode-controls {
                position: absolute;
                top: 20px;
                left: 20px;
                z-index: 1000;
                background: rgba(15, 15, 15, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 12px;
            }
            
            .view-mode-buttons {
                display: flex;
                gap: 8px;
            }
            
            .view-mode-btn {
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: white;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }
            
            .view-mode-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }
            
            .view-mode-btn.active {
                background: #3b82f6;
                border-color: #3b82f6;
            }
            
            .view-mode-loader {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 8px;
                color: #fbbf24;
                font-size: 12px;
            }
            
            .loader-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(251, 191, 36, 0.3);
                border-top: 2px solid #fbbf24;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @media (max-width: 768px) {
                .view-mode-controls {
                    left: 10px;
                    top: 10px;
                    right: 10px;
                    width: auto;
                }
                
                .view-mode-buttons {
                    flex-wrap: wrap;
                }
                
                .view-mode-btn {
                    flex: 1;
                    min-width: 70px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createViewComponents() {
        this.createComparisonPanel();
        this.createStoriesPanel();
    }

    createComparisonPanel() {
        let comparisonPanel = document.querySelector('[data-cy="comparison-panel"]');
        if (!comparisonPanel) {
            comparisonPanel = document.createElement('div');
            comparisonPanel.setAttribute('data-cy', 'comparison-panel');
            comparisonPanel.className = 'comparison-panel';
            comparisonPanel.innerHTML = `
                <div class="comparison-header">
                    <h3>Country Comparison</h3>
                </div>
                <div class="comparison-controls">
                    <div class="country-selector">
                        <label>Country 1:</label>
                        <select data-cy="compare-country-1">
                            <option value="">Select Country</option>
                            <option value="AFG">Afghanistan</option>
                            <option value="PAK">Pakistan</option>
                            <option value="SOM">Somalia</option>
                            <option value="YEM">Yemen</option>
                        </select>
                    </div>
                    <div class="country-selector">
                        <label>Country 2:</label>
                        <select data-cy="compare-country-2">
                            <option value="">Select Country</option>
                            <option value="AFG">Afghanistan</option>
                            <option value="PAK">Pakistan</option>
                            <option value="SOM">Somalia</option>
                            <option value="YEM">Yemen</option>
                        </select>
                    </div>
                </div>
                <div class="comparison-stats" data-cy="comparison-stats">
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th id="country-1-name">Country 1</th>
                                <th id="country-2-name">Country 2</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Total Strikes</td>
                                <td data-cy="country-1-strikes">-</td>
                                <td data-cy="country-2-strikes">-</td>
                            </tr>
                            <tr>
                                <td>Total Deaths</td>
                                <td data-cy="country-1-deaths">-</td>
                                <td data-cy="country-2-deaths">-</td>
                            </tr>
                            <tr>
                                <td>Civilian Deaths</td>
                                <td data-cy="country-1-civilians">-</td>
                                <td data-cy="country-2-civilians">-</td>
                            </tr>
                            <tr>
                                <td>Children Deaths</td>
                                <td data-cy="country-1-children">-</td>
                                <td data-cy="country-2-children">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
            
            this.addComparisonStyles();
            document.body.appendChild(comparisonPanel);
        }
    }

    addComparisonStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .comparison-panel {
                position: absolute;
                top: 100px;
                right: 20px;
                width: 400px;
                background: rgba(15, 15, 15, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 20px;
                color: white;
                z-index: 1000;
                display: none;
            }
            
            .comparison-panel.active {
                display: block;
            }
            
            .comparison-header h3 {
                margin: 0 0 16px 0;
                font-size: 18px;
                color: #fbbf24;
            }
            
            .comparison-controls {
                display: flex;
                gap: 16px;
                margin-bottom: 20px;
            }
            
            .country-selector {
                flex: 1;
            }
            
            .country-selector label {
                display: block;
                margin-bottom: 4px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .country-selector select {
                width: 100%;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                color: white;
                font-size: 14px;
            }
            
            .comparison-stats table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .comparison-stats th,
            .comparison-stats td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .comparison-stats th {
                background: rgba(255, 255, 255, 0.05);
                font-weight: 500;
                color: #fbbf24;
            }
            
            .comparison-stats td {
                font-size: 14px;
            }
            
            @media (max-width: 768px) {
                .comparison-panel {
                    top: 80px;
                    left: 10px;
                    right: 10px;
                    width: auto;
                }
                
                .comparison-controls {
                    flex-direction: column;
                    gap: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createStoriesPanel() {
        let storiesPanel = document.querySelector('[data-cy="stories-panel"]');
        if (!storiesPanel) {
            storiesPanel = document.createElement('div');
            storiesPanel.setAttribute('data-cy', 'stories-panel');
            storiesPanel.className = 'stories-panel';
            storiesPanel.innerHTML = `
                <div class="stories-header">
                    <h3>Strike Stories</h3>
                </div>
                <div class="story-navigation" data-cy="story-navigation">
                    <div class="story-list">
                        <!-- Stories will be populated here -->
                    </div>
                </div>
                <div class="story-content" data-cy="story-content">
                    <div class="story-details" data-cy="story-details">
                        <p>Select a strike from the list to view details.</p>
                    </div>
                </div>
            `;
            
            this.addStoriesStyles();
            document.body.appendChild(storiesPanel);
        }
    }

    addStoriesStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .stories-panel {
                position: absolute;
                top: 100px;
                left: 20px;
                right: 20px;
                bottom: 20px;
                background: rgba(15, 15, 15, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 20px;
                color: white;
                z-index: 1000;
                display: none;
                overflow: hidden;
            }
            
            .stories-panel.active {
                display: flex;
                flex-direction: column;
            }
            
            .stories-header h3 {
                margin: 0 0 16px 0;
                font-size: 18px;
                color: #fbbf24;
            }
            
            .story-navigation {
                flex: 1;
                display: flex;
                gap: 20px;
                overflow: hidden;
            }
            
            .story-list {
                flex: 1;
                overflow-y: auto;
                max-height: 100%;
            }
            
            .story-item {
                padding: 12px;
                margin-bottom: 8px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .story-item:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-1px);
            }
            
            .story-item.selected {
                background: rgba(59, 130, 246, 0.2);
                border-color: #3b82f6;
            }
            
            .story-date {
                font-size: 12px;
                color: #fbbf24;
                margin-bottom: 4px;
            }
            
            .story-location {
                font-weight: 500;
                margin-bottom: 4px;
            }
            
            .story-casualties {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .story-content {
                flex: 1;
                padding-left: 20px;
                border-left: 1px solid rgba(255, 255, 255, 0.1);
                overflow-y: auto;
            }
            
            .story-details {
                padding: 16px;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 6px;
                line-height: 1.6;
            }
            
            @media (max-width: 768px) {
                .stories-panel {
                    top: 80px;
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                }
                
                .story-navigation {
                    flex-direction: column;
                }
                
                .story-content {
                    padding-left: 0;
                    padding-top: 20px;
                    border-left: none;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // View mode button clicks (for any remaining old-style buttons)
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                if (mode === 'timeline' || mode === 'compare') {
                    // Handle as toggle for new header buttons
                    return;
                }
                this.showViewMode(mode);
            });
        });

        // Comparison panel events
        this.bindComparisonEvents();
        this.bindStoriesEvents();
    }

    bindHeaderToggleEvents() {
        // Listen for timeline toggle events from header
        document.addEventListener('timelineToggled', (event) => {
            const { isActive } = event.detail;
            this.handleTimelineToggle(isActive);
        });

        // Listen for compare toggle events from header
        document.addEventListener('compareToggled', (event) => {
            const { isActive } = event.detail;
            this.handleCompareToggle(isActive);
        });
    }

    handleTimelineToggle(isActive) {
        if (isActive) {
            this.timeline.show();
        } else {
            this.timeline.hide();
        }
    }

    handleCompareToggle(isActive) {
        const comparisonPanel = document.querySelector('.comparison-panel');
        if (comparisonPanel) {
            if (isActive) {
                comparisonPanel.style.display = 'block';
                // Initialize comparison if needed
                this.activateCompareMode();
            } else {
                comparisonPanel.style.display = 'none';
                this.deactivateCompareMode();
            }
        }
    }

    bindComparisonEvents() {
        const country1Select = document.querySelector('[data-cy="compare-country-1"]');
        const country2Select = document.querySelector('[data-cy="compare-country-2"]');
        
        country1Select?.addEventListener('change', () => this.updateComparison());
        country2Select?.addEventListener('change', () => this.updateComparison());
    }

    bindStoriesEvents() {
        // Story events will be bound when stories are populated
    }

    showViewMode(mode) {
        this.showLoader();
        
        // Update button states
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        // Hide all view components first
        this.hideAllViews();
        
        setTimeout(() => {
            switch(mode) {
                case 'map':
                    this.showMapView();
                    break;
                case 'timeline':
                    this.showTimelineView();
                    break;
                case 'compare':
                    this.showCompareView();
                    break;
                case 'stories':
                    this.showStoriesView();
                    break;
            }
            
            this.currentMode = mode;
            this.hideLoader();
        }, 200);
    }

    hideAllViews() {
        // Hide timeline
        if (this.timeline) {
            this.timeline.hide();
        }
        
        // Hide comparison panel
        const comparisonPanel = document.querySelector('[data-cy="comparison-panel"]');
        if (comparisonPanel) {
            comparisonPanel.classList.remove('active');
        }
        
        // Hide stories panel
        const storiesPanel = document.querySelector('[data-cy="stories-panel"]');
        if (storiesPanel) {
            storiesPanel.classList.remove('active');
        }
    }

    showMapView() {
        // Map is always visible, just ensure other views are hidden
        // Map view is the default state
    }

    showTimelineView() {
        if (this.timeline) {
            this.timeline.show();
        }
    }

    showCompareView() {
        const comparisonPanel = document.querySelector('[data-cy="comparison-panel"]');
        if (comparisonPanel) {
            comparisonPanel.classList.add('active');
            this.updateComparison();
        }
    }

    showStoriesView() {
        const storiesPanel = document.querySelector('[data-cy="stories-panel"]');
        if (storiesPanel) {
            storiesPanel.classList.add('active');
            this.populateStories();
        }
    }

    updateComparison() {
        const country1Code = document.querySelector('[data-cy="compare-country-1"]')?.value;
        const country2Code = document.querySelector('[data-cy="compare-country-2"]')?.value;
        
        if (country1Code) {
            const country1Data = this.getCountryData(country1Code);
            this.updateComparisonColumn(1, country1Code, country1Data);
        }
        
        if (country2Code) {
            const country2Data = this.getCountryData(country2Code);
            this.updateComparisonColumn(2, country2Code, country2Data);
        }
    }

    getCountryData(countryCode) {
        if (!this.appState.geojson[countryCode] || !this.appState.geojson[countryCode][0]) {
            return null;
        }
        
        const countryFeature = this.appState.geojson[countryCode][0].features[0];
        if (!countryFeature || !countryFeature.properties) {
            return null;
        }
        
        const props = countryFeature.properties;
        return {
            strikes: props.strike_count || 0,
            minTotal: Array.isArray(props.min_total) ? props.min_total.reduce((a, b) => (a + b), 0) : (props.min_total || 0),
            maxTotal: Array.isArray(props.max_total) ? props.max_total.reduce((a, b) => (a + b), 0) : (props.max_total || 0),
            minCivilians: Array.isArray(props.min_civilians) ? props.min_civilians.reduce((a, b) => (a + b), 0) : (props.min_civilians || 0),
            maxCivilians: Array.isArray(props.max_civilians) ? props.max_civilians.reduce((a, b) => (a + b), 0) : (props.max_civilians || 0),
            minChildren: Array.isArray(props.min_children) ? props.min_children.reduce((a, b) => (a + b), 0) : (props.min_children || 0),
            maxChildren: Array.isArray(props.max_children) ? props.max_children.reduce((a, b) => (a + b), 0) : (props.max_children || 0)
        };
    }

    updateComparisonColumn(columnNum, countryCode, data) {
        const countryNames = {
            AFG: 'Afghanistan',
            PAK: 'Pakistan',
            SOM: 'Somalia',
            YEM: 'Yemen'
        };
        
        // Update column header
        const header = document.getElementById(`country-${columnNum}-name`);
        if (header) {
            header.textContent = countryNames[countryCode] || countryCode;
        }
        
        if (data) {
            // Update statistics
            const strikesEl = document.querySelector(`[data-cy="country-${columnNum}-strikes"]`);
            if (strikesEl) strikesEl.textContent = data.strikes.toLocaleString();
            
            const deathsEl = document.querySelector(`[data-cy="country-${columnNum}-deaths"]`);
            if (deathsEl) deathsEl.textContent = `${data.minTotal.toLocaleString()} to ${data.maxTotal.toLocaleString()}`;
            
            const civiliansEl = document.querySelector(`[data-cy="country-${columnNum}-civilians"]`);
            if (civiliansEl) civiliansEl.textContent = `${data.minCivilians.toLocaleString()} to ${data.maxCivilians.toLocaleString()}`;
            
            const childrenEl = document.querySelector(`[data-cy="country-${columnNum}-children"]`);
            if (childrenEl) childrenEl.textContent = `${data.minChildren.toLocaleString()} to ${data.maxChildren.toLocaleString()}`;
        }
    }

    populateStories() {
        const storyList = document.querySelector('.story-list');
        if (!storyList) return;
        
        // Get strike data from strike visualization
        let strikes = [];
        if (this.strikeVisualization) {
            const strikeData = this.strikeVisualization.getStrikeData();
            strikes = strikeData.all.slice(0, 50); // Limit to first 50 for performance
        }
        
        storyList.innerHTML = '';
        
        strikes.forEach((strike, index) => {
            const storyItem = document.createElement('div');
            storyItem.className = 'story-item';
            storyItem.setAttribute('data-cy', 'story-item');
            storyItem.innerHTML = `
                <div class="story-date" data-cy="story-date">${strike.date.toLocaleDateString()}</div>
                <div class="story-location" data-cy="story-location">${this.getCountryName(strike.country)}</div>
                <div class="story-casualties" data-cy="story-casualties">${strike.minTotal} to ${strike.maxTotal} deaths</div>
            `;
            
            storyItem.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.story-item').forEach(item => item.classList.remove('selected'));
                storyItem.classList.add('selected');
                
                // Show story details
                this.showStoryDetails(strike);
            });
            
            storyList.appendChild(storyItem);
        });
    }

    showStoryDetails(strike) {
        const storyDetails = document.querySelector('[data-cy="story-details"]');
        if (storyDetails) {
            storyDetails.innerHTML = `
                <h4>Strike Details</h4>
                <p><strong>Date:</strong> ${strike.date.toLocaleDateString()}</p>
                <p><strong>Location:</strong> ${this.getCountryName(strike.country)}</p>
                <p><strong>Total Deaths:</strong> ${strike.minTotal} to ${strike.maxTotal}</p>
                <p><strong>Civilian Deaths:</strong> ${strike.minCivilians} to ${strike.maxCivilians}</p>
                <p><strong>Children Deaths:</strong> ${strike.minChildren} to ${strike.maxChildren}</p>
                <p><strong>Year:</strong> ${strike.year}</p>
                ${strike.location ? `<p><strong>Specific Location:</strong> ${strike.location}</p>` : ''}
            `;
        }
    }

    getCountryName(code) {
        const names = {
            AFG: 'Afghanistan',
            PAK: 'Pakistan',
            SOM: 'Somalia',
            YEM: 'Yemen'
        };
        return names[code] || code;
    }

    showLoader() {
        const loader = document.querySelector('[data-cy="view-mode-loader"]');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    hideLoader() {
        const loader = document.querySelector('[data-cy="view-mode-loader"]');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    getCurrentMode() {
        return this.currentMode;
    }

    // Compare mode activation/deactivation
    activateCompareMode() {
        this.updateComparison();
    }

    deactivateCompareMode() {
        // Clean up any compare-specific state if needed
    }

    // Method to update data when app state changes
    updateData() {
        if (this.currentMode === 'compare') {
            this.updateComparison();
        } else if (this.currentMode === 'stories') {
            this.populateStories();
        }
    }
}