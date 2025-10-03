export class StrikeVisualization {
    constructor(appState, map) {
        this.appState = appState;
        this.map = map; // Leaflet map instance
        this.layers = {
            strikes: L.layerGroup(),
            civilian: L.layerGroup(),
            heatmap: L.layerGroup()
        };
        this.filteredStrikes = [];
        this.allStrikes = [];
        
        this.initialize();
    }

    initialize() {
        this.createLayerControls();
        this.bindEvents();
        
        // Add layer groups to map but don't add to map initially
        Object.values(this.layers).forEach(layer => {
            // Layers are created but not added to map until toggled
        });
    }

    createLayerControls() {
        // Check if layer controls already exist
        let layerControlsContainer = document.querySelector('[data-cy="strike-layer-controls"]');
        if (!layerControlsContainer) {
            // Find existing layer controls or create new container
            const existingControls = document.querySelector('.layer-controls') || document.querySelector('[data-cy="layer-controls"]');
            
            if (existingControls) {
                // Add to existing controls
                const strikeControls = document.createElement('div');
                strikeControls.setAttribute('data-cy', 'strike-layer-controls');
                strikeControls.innerHTML = `
                    <div class="control-group">
                        <h4>Strike Visualization</h4>
                        <label class="control-item">
                            <input type="checkbox" data-cy="layer-toggle-strikes" id="layer-strikes">
                            <span>Strike Points</span>
                        </label>
                        <label class="control-item">
                            <input type="checkbox" data-cy="layer-toggle-civilian" id="layer-civilian">
                            <span>Civilian Impact</span>
                        </label>
                        <label class="control-item">
                            <input type="checkbox" data-cy="layer-toggle-heatmap" id="layer-heatmap">
                            <span>Heatmap</span>
                        </label>
                    </div>
                `;
                existingControls.appendChild(strikeControls);
            } else {
                // Create new layer controls container
                layerControlsContainer = document.createElement('div');
                layerControlsContainer.setAttribute('data-cy', 'layer-controls');
                layerControlsContainer.className = 'layer-controls';
                layerControlsContainer.innerHTML = `
                    <div class="layer-controls-header">
                        <h3>Layer Controls</h3>
                        <button class="collapse-btn" data-cy="collapse-layer-controls">−</button>
                    </div>
                    <div class="layer-controls-content">
                        <div data-cy="strike-layer-controls">
                            <div class="control-group">
                                <h4>Strike Visualization</h4>
                                <label class="control-item">
                                    <input type="checkbox" data-cy="layer-toggle-strikes" id="layer-strikes">
                                    <span>Strike Points</span>
                                </label>
                                <label class="control-item">
                                    <input type="checkbox" data-cy="layer-toggle-civilian" id="layer-civilian">
                                    <span>Civilian Impact</span>
                                </label>
                                <label class="control-item">
                                    <input type="checkbox" data-cy="layer-toggle-heatmap" id="layer-heatmap">
                                    <span>Heatmap</span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add CSS styles
                this.addLayerControlStyles();
                
                document.body.appendChild(layerControlsContainer);
            }
        }
    }

    addLayerControlStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .layer-controls {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(15, 15, 15, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 16px;
                color: white;
                z-index: 1000;
                min-width: 200px;
            }
            
            .layer-controls-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .layer-controls-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .collapse-btn {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .collapse-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .control-group {
                margin-bottom: 16px;
            }
            
            .control-group h4 {
                margin: 0 0 8px 0;
                font-size: 14px;
                color: #fbbf24;
            }
            
            .control-item {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .control-item input[type="checkbox"] {
                margin: 0;
            }
            
            .control-item:hover {
                color: #fbbf24;
            }
            
            @media (max-width: 768px) {
                .layer-controls {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    width: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Strike points toggle
        const strikesToggle = document.querySelector('[data-cy="layer-toggle-strikes"]');
        strikesToggle?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.showStrikePoints();
                this.map.addLayer(this.layers.strikes);
            } else {
                this.hideStrikePoints();
                this.map.removeLayer(this.layers.strikes);
            }
        });

        // Civilian impact toggle
        const civilianToggle = document.querySelector('[data-cy="layer-toggle-civilian"]');
        civilianToggle?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.showCivilianImpact();
                this.map.addLayer(this.layers.civilian);
            } else {
                this.hideCivilianImpact();
                this.map.removeLayer(this.layers.civilian);
            }
        });

        // Heatmap toggle
        const heatmapToggle = document.querySelector('[data-cy="layer-toggle-heatmap"]');
        heatmapToggle?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.showHeatmap();
                this.map.addLayer(this.layers.heatmap);
            } else {
                this.hideHeatmap();
                this.map.removeLayer(this.layers.heatmap);
            }
        });

        // Collapse button
        const collapseBtn = document.querySelector('[data-cy="collapse-layer-controls"]');
        collapseBtn?.addEventListener('click', () => {
            const content = document.querySelector('.layer-controls-content');
            const isCollapsed = content.style.display === 'none';
            content.style.display = isCollapsed ? 'block' : 'none';
            collapseBtn.textContent = isCollapsed ? '−' : '+';
        });
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
                                location: props.locations?.[index] || null,
                                coordinates: this.getStrikeCoordinates(country)
                            });
                        });
                    }
                }
            }
        });

        // Sort strikes by date
        this.allStrikes.sort((a, b) => a.date - b.date);
        this.filteredStrikes = [...this.allStrikes];
    }

    getStrikeCoordinates(country) {
        // Get approximate coordinates for strike based on country
        const countryCoords = {
            AFG: [33.0 + (Math.random() - 0.5) * 4, 65.0 + (Math.random() - 0.5) * 8],
            PAK: [30.0 + (Math.random() - 0.5) * 6, 70.0 + (Math.random() - 0.5) * 8],
            SOM: [5.0 + (Math.random() - 0.5) * 10, 46.0 + (Math.random() - 0.5) * 8],
            YEM: [15.0 + (Math.random() - 0.5) * 6, 48.0 + (Math.random() - 0.5) * 8]
        };
        return countryCoords[country];
    }

    showStrikePoints() {
        this.layers.strikes.clearLayers();
        
        this.filteredStrikes.forEach(strike => {
            if (strike.coordinates) {
                const [lat, lng] = strike.coordinates;
                const marker = L.circleMarker([lat, lng], {
                    radius: 5,
                    fillColor: '#ef4444',
                    color: '#dc2626',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.6,
                    className: 'strike-marker'
                });
                
                marker.bindPopup(`
                    <div>
                        <strong>Strike Location</strong><br>
                        Date: ${strike.date.toLocaleDateString()}<br>
                        Deaths: ${strike.minTotal} to ${strike.maxTotal}<br>
                        Country: ${this.getCountryName(strike.country)}
                    </div>
                `);
                
                this.layers.strikes.addLayer(marker);
            }
        });
    }

    hideStrikePoints() {
        this.layers.strikes.clearLayers();
    }

    showCivilianImpact() {
        this.layers.civilian.clearLayers();
        
        this.filteredStrikes.forEach(strike => {
            if (strike.coordinates && (strike.minCivilians > 0 || strike.maxCivilians > 0)) {
                const [lat, lng] = strike.coordinates;
                const radius = Math.max(5000, Math.sqrt(strike.maxCivilians) * 10000);
                
                const circle = L.circle([lat, lng], {
                    radius: radius,
                    fillColor: '#fbbf24',
                    fillOpacity: 0.4,
                    color: '#f59e0b',
                    weight: 1,
                    opacity: 0.6,
                    className: 'civilian-impact-circle'
                });
                
                circle.bindPopup(`
                    <div>
                        <strong>Civilian Impact</strong><br>
                        Date: ${strike.date.toLocaleDateString()}<br>
                        Civilians: ${strike.minCivilians} to ${strike.maxCivilians}<br>
                        Children: ${strike.minChildren} to ${strike.maxChildren}
                    </div>
                `);
                
                this.layers.civilian.addLayer(circle);
            }
        });
    }

    hideCivilianImpact() {
        this.layers.civilian.clearLayers();
    }

    showHeatmap() {
        this.layers.heatmap.clearLayers();
        
        // Create heatmap data by country
        const countryCoords = {
            AFG: [33.0, 65.0],
            PAK: [30.0, 70.0],
            SOM: [5.0, 46.0],
            YEM: [15.0, 48.0]
        };
        
        Object.keys(countryCoords).forEach(country => {
            const countryStrikes = this.filteredStrikes.filter(s => s.country === country);
            if (countryStrikes.length > 0) {
                const [lat, lng] = countryCoords[country];
                const intensity = Math.min(countryStrikes.length / 50, 1);
                
                const circle = L.circle([lat, lng], {
                    radius: 50000 + (intensity * 150000),
                    fillColor: '#ef4444',
                    fillOpacity: intensity * 0.6,
                    stroke: false,
                    className: 'heatmap-layer'
                });
                
                this.layers.heatmap.addLayer(circle);
            }
        });
    }

    hideHeatmap() {
        this.layers.heatmap.clearLayers();
    }

    filterByYear(year) {
        if (year) {
            this.filteredStrikes = this.allStrikes.filter(s => s.year === year);
        } else {
            this.filteredStrikes = [...this.allStrikes];
        }
        
        // Update visible layers
        this.updateVisibleLayers();
    }

    updateVisibleLayers() {
        // Check which layers are currently enabled and update them
        const strikesEnabled = document.querySelector('[data-cy="layer-toggle-strikes"]')?.checked;
        const civilianEnabled = document.querySelector('[data-cy="layer-toggle-civilian"]')?.checked;
        const heatmapEnabled = document.querySelector('[data-cy="layer-toggle-heatmap"]')?.checked;
        
        if (strikesEnabled) {
            this.showStrikePoints();
        }
        
        if (civilianEnabled) {
            this.showCivilianImpact();
        }
        
        if (heatmapEnabled) {
            this.showHeatmap();
        }
    }

    updateData() {
        // Reprocess data when app state changes
        if (this.appState.geojson) {
            this.processStrikeData();
            this.updateVisibleLayers();
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

    // Method to get strike data for external use
    getStrikeData() {
        return {
            all: this.allStrikes,
            filtered: this.filteredStrikes
        };
    }
}