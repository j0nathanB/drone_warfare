// Drone Warfare Visualization - Interactive Implementation
class DroneWarfareApp {
    constructor() {
        this.data = {
            AFG: {}, PAK: {}, SOM: {}, YEM: {}
        };
        this.currentCountry = null;
        this.currentLevel = 0;
        this.currentYear = null;
        this.allStrikes = [];
        this.filteredStrikes = [];
        this.map = null;
        this.layers = {
            boundaries: null,
            strikes: null,
            heatmap: null,
            civilian: null
        };
        this.timeline = {
            startYear: 2004,
            endYear: 2020,
            currentYear: null,
            playing: false
        };
    }

    async initialize() {
        this.showLoader(true);
        
        // Initialize map
        this.initializeMap();
        
        // Load data
        await this.loadAllData();
        
        // Process strike data
        this.processStrikeData();
        
        // Initialize UI controls
        this.initializeControls();
        
        // Reinitialize timeline with actual data
        this.initializeTimeline();
        
        // Display initial view
        this.displayGlobalView();
        
        // Hide all view modes initially (default to map view)
        this.hideAllViewModes();
        
        this.showLoader(false);
    }

    initializeMap() {
        // Initialize Leaflet map
        this.map = L.map('map', {
            center: [20, 65],
            zoom: 4,
            zoomControl: false,
            preferCanvas: true,
            maxBounds: [[-60, -180], [80, 180]]
        });

        // Add dark tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Add zoom control
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // Initialize layer groups
        this.layers.boundaries = L.layerGroup().addTo(this.map);
        this.layers.strikes = L.layerGroup();
        this.layers.heatmap = L.layerGroup().addTo(this.map);
        this.layers.civilian = L.layerGroup();
    }

    async loadAllData() {
        const baseURL = './data';
        const countries = ['AFG', 'PAK', 'SOM', 'YEM'];
        const levels = {
            AFG: [0, 1, 2, 'Loc'],
            PAK: [0, 1, 2, 3, 'Loc'],
            SOM: [0, 1, 2, 'Loc'],
            YEM: [0, 1, 2, 'Loc']
        };

        const promises = [];
        
        for (const country of countries) {
            for (const level of levels[country]) {
                const fileName = `${baseURL}/${country}_${level === 'Loc' ? 'Loc' : `Adm_${level}`}-optimized.geojson`;
                promises.push(
                    fetch(fileName)
                        .then(res => res.json())
                        .then(data => ({ country, level, data }))
                        .catch(err => {
                            console.warn(`Failed to load ${fileName}:`, err);
                            return { country, level, data: null };
                        })
                );
            }
        }

        const results = await Promise.all(promises);
        
        // Organize data by country and level
        results.forEach(({ country, level, data }) => {
            if (data) {
                const levelIndex = level === 'Loc' ? 'locations' : level;
                if (!this.data[country][levelIndex]) {
                    this.data[country][levelIndex] = data;
                }
            }
        });
    }

    processStrikeData() {
        // Extract all strikes from country level data
        this.allStrikes = [];
        
        Object.keys(this.data).forEach(country => {
            if (this.data[country][0] && this.data[country][0].features) {
                const countryFeature = this.data[country][0].features[0];
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
        this.filteredStrikes = [...this.allStrikes];
    }

    displayGlobalView() {
        // Clear existing layers
        this.layers.boundaries.clearLayers();
        this.layers.heatmap.clearLayers();

        // Display country boundaries
        const countryColors = {
            AFG: '#ef4444',
            PAK: '#3b82f6',
            SOM: '#10b981',
            YEM: '#f59e0b'
        };

        Object.keys(this.data).forEach(country => {
            if (this.data[country][0] && this.data[country][0].features) {
                const feature = this.data[country][0].features[0];
                if (feature) {
                    const layer = L.geoJSON(feature, {
                        style: {
                            fillColor: countryColors[country],
                            fillOpacity: 0.3,
                            color: countryColors[country],
                            weight: 2,
                            opacity: 0.8
                        },
                        onEachFeature: (feature, layer) => {
                            layer.on({
                                click: () => this.selectCountry(country),
                                mouseover: (e) => this.highlightFeature(e),
                                mouseout: (e) => this.resetHighlight(e)
                            });
                            
                            // Add tooltip
                            const props = feature.properties;
                            const minTotal = Array.isArray(props.min_total) ? props.min_total.reduce((a, b) => a + b, 0) : (props.min_total || 0);
                            const maxTotal = Array.isArray(props.max_total) ? props.max_total.reduce((a, b) => a + b, 0) : (props.max_total || 0);
                            const tooltipContent = `
                                <strong>${country}</strong><br>
                                Strikes: ${props.strike_count || 0}<br>
                                Total Deaths: ${minTotal} to ${maxTotal}
                            `;
                            layer.bindPopup(tooltipContent);
                        }
                    });
                    this.layers.boundaries.addLayer(layer);
                }
            }
        });

        // Reset current country and level
        this.currentCountry = null;
        this.currentLevel = 0;
        this.currentParentRegion = null;
        
        // Update statistics
        this.updateGlobalStats();
        
        // Update regional breakdown
        this.updateRegionalBreakdown();
        
        // Update breadcrumbs
        this.updateBreadcrumbs([{ level: 'world', name: 'Global' }]);
        
        // Reset map view
        this.map.setView([20, 65], 4);
    }

    selectCountry(country) {
        this.currentCountry = country;
        this.currentLevel = 1;
        this.currentParentRegion = null; // Reset parent region tracking
        
        // Clear layers
        this.layers.boundaries.clearLayers();
        
        // Display administrative level 1 for selected country
        if (this.data[country][1] && this.data[country][1].features) {
            const features = this.data[country][1].features;
            
            features.forEach(feature => {
                const layer = L.geoJSON(feature, {
                    style: {
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                        color: '#3b82f6',
                        weight: 1,
                        opacity: 0.6
                    },
                    onEachFeature: (feature, layer) => {
                        layer.on({
                            click: () => this.selectRegion(country, 1, feature.properties),
                            mouseover: (e) => this.highlightFeature(e),
                            mouseout: (e) => this.resetHighlight(e)
                        });
                        
                        // Add tooltip
                        const props = feature.properties;
                        const tooltipContent = `
                            <strong>${props.shapeName || 'Unknown'}</strong><br>
                            Strikes: ${props.dates?.length || 0}
                        `;
                        layer.bindPopup(tooltipContent);
                    }
                });
                this.layers.boundaries.addLayer(layer);
            });
            
            // Zoom to country bounds
            const countryBounds = L.geoJSON(this.data[country][0].features[0]).getBounds();
            this.map.fitBounds(countryBounds, { padding: [50, 50] });
        }
        
        // Update UI
        this.updateCountryStats(country);
        this.updateRegionalBreakdown();
        this.updateBreadcrumbs([
            { level: 'world', name: 'Global' },
            { level: 'country', name: this.getCountryName(country) }
        ]);
    }

    selectRegion(country, level, properties) {
        this.currentLevel = level + 1;
        this.currentParentRegion = properties.shapeName; // Track the current parent region
        
        // Check if we can go deeper
        const maxLevel = country === 'PAK' ? 3 : 2;
        if (this.currentLevel > maxLevel) {
            // Show detailed view for this region
            this.showRegionDetails(properties);
            return;
        }
        
        // Load next administrative level
        if (this.data[country][this.currentLevel]) {
            this.layers.boundaries.clearLayers();
            
            const features = this.data[country][this.currentLevel].features;
            const filteredFeatures = features.filter(f => 
                f.properties.parentAdm === properties.shapeName
            );
            
            filteredFeatures.forEach(feature => {
                const layer = L.geoJSON(feature, {
                    style: {
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                        color: '#3b82f6',
                        weight: 1,
                        opacity: 0.6
                    },
                    onEachFeature: (feature, layer) => {
                        layer.on({
                            click: () => this.selectRegion(country, this.currentLevel, feature.properties),
                            mouseover: (e) => this.highlightFeature(e),
                            mouseout: (e) => this.resetHighlight(e)
                        });
                    }
                });
                this.layers.boundaries.addLayer(layer);
            });
            
            // Zoom to region
            if (filteredFeatures.length > 0) {
                const regionBounds = L.geoJSON(filteredFeatures).getBounds();
                this.map.fitBounds(regionBounds, { padding: [50, 50] });
            }
        }
        
        // Update UI
        this.updateRegionalBreakdown();
        
        // Update statistics for the selected region
        this.updateRegionStats(properties);
        
        // Update breadcrumbs
        const breadcrumbs = [
            { level: 'world', name: 'Global' },
            { level: 'country', name: this.getCountryName(country) },
            { level: 'region', name: properties.shapeName }
        ];
        this.updateBreadcrumbs(breadcrumbs);
    }

    highlightFeature(e) {
        const layer = e.target;
        layer.setStyle({
            fillOpacity: 0.4,
            weight: 2
        });
    }

    resetHighlight(e) {
        const layer = e.target;
        layer.setStyle({
            fillOpacity: 0.2,
            weight: 1
        });
    }

    highlightRegionOnMap(regionName) {
        // Find and highlight the corresponding region on the map
        this.layers.boundaries.eachLayer(geoJsonLayer => {
            // Handle both direct geoJSON layers and nested layer groups
            if (geoJsonLayer.feature) {
                // Direct geoJSON layer
                this.checkAndHighlightLayer(geoJsonLayer, regionName);
            } else if (geoJsonLayer.eachLayer) {
                // Layer group containing geoJSON layers
                geoJsonLayer.eachLayer(subLayer => {
                    this.checkAndHighlightLayer(subLayer, regionName);
                });
            }
        });
    }

    checkAndHighlightLayer(geoJsonLayer, regionName) {
        const feature = geoJsonLayer.feature;
        if (feature && feature.properties) {
            const props = feature.properties;
            
            // Check if this feature matches the region name
            const featureName = props.shapeName || props.name || this.getCountryName(props.shapeISO);
            
            if (featureName === regionName) {
                
                // Store original style before highlighting
                if (!geoJsonLayer._originalStyle) {
                    geoJsonLayer._originalStyle = {
                        fillColor: geoJsonLayer.options.fillColor,
                        fillOpacity: geoJsonLayer.options.fillOpacity,
                        color: geoJsonLayer.options.color,
                        weight: geoJsonLayer.options.weight,
                        opacity: geoJsonLayer.options.opacity
                    };
                }
                
                // Highlight this feature
                geoJsonLayer.setStyle({
                    fillOpacity: 0.6,
                    weight: 3,
                    color: '#fbbf24',
                    fillColor: '#fbbf24'
                });
                
                // Store reference to highlighted layer for cleanup
                this.highlightedLayer = geoJsonLayer;
                return true;
            }
        }
        return false;
    }

    removeHighlightFromMap() {
        // Remove highlight from previously highlighted layer
        if (this.highlightedLayer) {
            // Restore original style if stored, otherwise use computed style
            if (this.highlightedLayer._originalStyle) {
                this.highlightedLayer.setStyle(this.highlightedLayer._originalStyle);
            } else {
                // Fallback to computed style
                const feature = this.highlightedLayer.feature;
                const originalStyle = this.getFeatureStyle(feature);
                this.highlightedLayer.setStyle(originalStyle);
            }
            
            this.highlightedLayer = null;
        }
    }

    getFeatureStyle(feature) {
        // Get the original styling for a feature
        const props = feature.properties;
        
        // Check if this is a country-level feature (has shapeISO)
        if (props.shapeISO) {
            const countryColors = {
                AFG: '#ef4444',
                PAK: '#3b82f6', 
                SOM: '#10b981',
                YEM: '#f59e0b'
            };
            
            return {
                fillColor: countryColors[props.shapeISO] || '#3b82f6',
                fillOpacity: 0.3,
                color: countryColors[props.shapeISO] || '#3b82f6',
                weight: 2,
                opacity: 0.8
            };
        } else {
            // Administrative subdivision (province, district, etc.)
            return {
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                color: '#3b82f6',
                weight: 1,
                opacity: 0.6
            };
        }
    }

    updateGlobalStats() {
        let totalStrikes = 0;
        let totalDeaths = { min: 0, max: 0 };
        let totalCivilians = { min: 0, max: 0 };
        let totalChildren = { min: 0, max: 0 };
        let totalInjured = { min: 0, max: 0 };
        
        Object.keys(this.data).forEach(country => {
            if (this.data[country][0] && this.data[country][0].features) {
                const props = this.data[country][0].features[0].properties;
                totalStrikes += props.strike_count || 0;
                
                // Handle arrays properly
                const minTotal = Array.isArray(props.min_total) ? props.min_total.reduce((a, b) => a + b, 0) : (props.min_total || 0);
                const maxTotal = Array.isArray(props.max_total) ? props.max_total.reduce((a, b) => a + b, 0) : (props.max_total || 0);
                const minCivilians = Array.isArray(props.min_civilians) ? props.min_civilians.reduce((a, b) => a + b, 0) : (props.min_civilians || 0);
                const maxCivilians = Array.isArray(props.max_civilians) ? props.max_civilians.reduce((a, b) => a + b, 0) : (props.max_civilians || 0);
                const minChildren = Array.isArray(props.min_children) ? props.min_children.reduce((a, b) => a + b, 0) : (props.min_children || 0);
                const maxChildren = Array.isArray(props.max_children) ? props.max_children.reduce((a, b) => a + b, 0) : (props.max_children || 0);
                const minInjured = Array.isArray(props.min_injured) ? props.min_injured.reduce((a, b) => a + b, 0) : (props.min_injured || 0);
                const maxInjured = Array.isArray(props.max_injured) ? props.max_injured.reduce((a, b) => a + b, 0) : (props.max_injured || 0);
                
                totalDeaths.min += minTotal;
                totalDeaths.max += maxTotal;
                totalCivilians.min += minCivilians;
                totalCivilians.max += maxCivilians;
                totalChildren.min += minChildren;
                totalChildren.max += maxChildren;
                totalInjured.min += minInjured;
                totalInjured.max += maxInjured;
            }
        });
        
        // Update UI
        this.updateStatsDisplay({
            strikes: totalStrikes,
            deaths: `${totalDeaths.min} to ${totalDeaths.max}`,
            civilians: `${totalCivilians.min} to ${totalCivilians.max}`,
            children: `${totalChildren.min} to ${totalChildren.max}`,
            injured: `${totalInjured.min} to ${totalInjured.max}`
        });
    }

    updateCountryStats(country) {
        if (this.data[country][0] && this.data[country][0].features) {
            const props = this.data[country][0].features[0].properties;
            
            // Sum arrays properly
            const minTotal = Array.isArray(props.min_total) ? props.min_total.reduce((a, b) => a + b, 0) : (props.min_total || 0);
            const maxTotal = Array.isArray(props.max_total) ? props.max_total.reduce((a, b) => a + b, 0) : (props.max_total || 0);
            const minCivilians = Array.isArray(props.min_civilians) ? props.min_civilians.reduce((a, b) => a + b, 0) : (props.min_civilians || 0);
            const maxCivilians = Array.isArray(props.max_civilians) ? props.max_civilians.reduce((a, b) => a + b, 0) : (props.max_civilians || 0);
            const minChildren = Array.isArray(props.min_children) ? props.min_children.reduce((a, b) => a + b, 0) : (props.min_children || 0);
            const maxChildren = Array.isArray(props.max_children) ? props.max_children.reduce((a, b) => a + b, 0) : (props.max_children || 0);
            const minInjured = Array.isArray(props.min_injured) ? props.min_injured.reduce((a, b) => a + b, 0) : (props.min_injured || 0);
            const maxInjured = Array.isArray(props.max_injured) ? props.max_injured.reduce((a, b) => a + b, 0) : (props.max_injured || 0);
            
            this.updateStatsDisplay({
                strikes: props.strike_count || 0,
                deaths: `${minTotal} to ${maxTotal}`,
                civilians: `${minCivilians} to ${maxCivilians}`,
                children: `${minChildren} to ${maxChildren}`,
                injured: `${minInjured} to ${maxInjured}`
            });
        }
    }

    updateRegionStats(properties) {
        // Sum arrays properly for region-specific data
        const minTotal = Array.isArray(properties.min_total) ? properties.min_total.reduce((a, b) => a + b, 0) : (properties.min_total || 0);
        const maxTotal = Array.isArray(properties.max_total) ? properties.max_total.reduce((a, b) => a + b, 0) : (properties.max_total || 0);
        const minCivilians = Array.isArray(properties.min_civilians) ? properties.min_civilians.reduce((a, b) => a + b, 0) : (properties.min_civilians || 0);
        const maxCivilians = Array.isArray(properties.max_civilians) ? properties.max_civilians.reduce((a, b) => a + b, 0) : (properties.max_civilians || 0);
        const minChildren = Array.isArray(properties.min_children) ? properties.min_children.reduce((a, b) => a + b, 0) : (properties.min_children || 0);
        const maxChildren = Array.isArray(properties.max_children) ? properties.max_children.reduce((a, b) => a + b, 0) : (properties.max_children || 0);
        const minInjured = Array.isArray(properties.min_injured) ? properties.min_injured.reduce((a, b) => a + b, 0) : (properties.min_injured || 0);
        const maxInjured = Array.isArray(properties.max_injured) ? properties.max_injured.reduce((a, b) => a + b, 0) : (properties.max_injured || 0);
        
        this.updateStatsDisplay({
            strikes: properties.strike_count || 0,
            deaths: `${minTotal} to ${maxTotal}`,
            civilians: `${minCivilians} to ${maxCivilians}`,
            children: `${minChildren} to ${maxChildren}`,
            injured: `${minInjured} to ${maxInjured}`
        });
    }

    updateStatsDisplay(stats) {
        // Update stat values in the stat rows
        const statRows = document.querySelectorAll('.stat-row');
        
        // Find and update each stat by label
        statRows.forEach(row => {
            const label = row.querySelector('.stat-label');
            const value = row.querySelector('.stat-value');
            
            if (label && value) {
                const labelText = label.textContent.toLowerCase();
                
                if (labelText.includes('strikes')) {
                    value.textContent = stats.strikes;
                } else if (labelText.includes('total deaths')) {
                    value.textContent = stats.deaths;
                } else if (labelText.includes('civilians')) {
                    value.textContent = stats.civilians;
                } else if (labelText.includes('children')) {
                    value.textContent = stats.children;
                } else if (labelText.includes('injured')) {
                    // Add injured stats if available
                    value.textContent = stats.injured || 'No data';
                }
            }
        });
    }

    updateRegionalBreakdown() {
        const regionList = document.getElementById('region-list');
        if (!regionList) return;
        
        regionList.innerHTML = '';
        
        // If no country is selected, show all countries
        if (!this.currentCountry || this.currentLevel === 0) {
            const countries = [
                { code: 'AFG', name: 'Afghanistan' },
                { code: 'PAK', name: 'Pakistan' },
                { code: 'SOM', name: 'Somalia' },
                { code: 'YEM', name: 'Yemen' }
            ];
            
            countries.forEach(country => {
                if (this.data[country.code][0] && this.data[country.code][0].features) {
                    const props = this.data[country.code][0].features[0].properties;
                    
                    // Calculate totals properly
                    const minTotal = Array.isArray(props.min_total) ? props.min_total.reduce((a, b) => a + b, 0) : (props.min_total || 0);
                    const maxTotal = Array.isArray(props.max_total) ? props.max_total.reduce((a, b) => a + b, 0) : (props.max_total || 0);
                    const minCivilians = Array.isArray(props.min_civilians) ? props.min_civilians.reduce((a, b) => a + b, 0) : (props.min_civilians || 0);
                    const maxCivilians = Array.isArray(props.max_civilians) ? props.max_civilians.reduce((a, b) => a + b, 0) : (props.max_civilians || 0);
                    
                    this.createRegionItem(country.name, props.strike_count || 0, minTotal, maxTotal, minCivilians, maxCivilians, 
                        () => this.selectCountry(country.code), regionList);
                }
            });
        } else {
            // Show administrative subdivisions for the selected country
            const adminLevel = this.currentLevel;
            if (this.data[this.currentCountry][adminLevel] && this.data[this.currentCountry][adminLevel].features) {
                const features = this.data[this.currentCountry][adminLevel].features;
                
                // Filter features to only show those belonging to the current parent region
                let filteredFeatures = features;
                if (this.currentLevel > 1 && this.currentParentRegion) {
                    filteredFeatures = features.filter(f => 
                        f.properties.parentAdm === this.currentParentRegion
                    );
                }
                
                filteredFeatures.forEach(feature => {
                    const props = feature.properties;
                    const name = props.shapeName || props.name || 'Unknown Region';
                    
                    // Calculate stats for this region
                    const strikes = props.dates ? props.dates.length : 0;
                    const minTotal = Array.isArray(props.min_total) ? props.min_total.reduce((a, b) => a + b, 0) : (props.min_total || 0);
                    const maxTotal = Array.isArray(props.max_total) ? props.max_total.reduce((a, b) => a + b, 0) : (props.max_total || 0);
                    const minCivilians = Array.isArray(props.min_civilians) ? props.min_civilians.reduce((a, b) => a + b, 0) : (props.min_civilians || 0);
                    const maxCivilians = Array.isArray(props.max_civilians) ? props.max_civilians.reduce((a, b) => a + b, 0) : (props.max_civilians || 0);
                    
                    this.createRegionItem(name, strikes, minTotal, maxTotal, minCivilians, maxCivilians, 
                        () => this.selectRegion(this.currentCountry, this.currentLevel, props), regionList);
                });
            }
        }
    }

    createRegionItem(name, strikes, minTotal, maxTotal, minCivilians, maxCivilians, clickHandler, container) {
        const regionItem = document.createElement('div');
        regionItem.style.cssText = `
            padding: 12px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.2s;
        `;
        
        regionItem.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500; color: #ffffff;">${name}</span>
                </div>
                <span style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">${strikes} strikes</span>
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); line-height: 1.4;">
                Deaths: ${minTotal} to ${maxTotal}<br>
                Civilians: ${minCivilians} to ${maxCivilians}
            </div>
        `;
        
        regionItem.addEventListener('mouseover', () => {
            regionItem.style.background = 'rgba(255, 255, 255, 0.1)';
            regionItem.style.transform = 'translateY(-1px)';
            // Highlight corresponding region on map
            this.highlightRegionOnMap(name);
        });
        
        regionItem.addEventListener('mouseout', () => {
            regionItem.style.background = 'rgba(255, 255, 255, 0.05)';
            regionItem.style.transform = 'translateY(0)';
            // Remove highlight from map
            this.removeHighlightFromMap();
        });
        
        regionItem.addEventListener('click', clickHandler);
        
        container.appendChild(regionItem);
    }

    updateBreadcrumbs(path) {
        const container = document.querySelector('.breadcrumb-path');
        container.innerHTML = '';
        
        path.forEach((item, index) => {
            const node = document.createElement('div');
            node.className = 'breadcrumb-node';
            node.dataset.level = item.level;
            if (index === path.length - 1) node.classList.add('active');
            
            node.innerHTML = `
                <span>${item.name}</span>
            `;
            
            node.addEventListener('click', () => {
                if (item.level === 'world') {
                    this.displayGlobalView();
                } else if (item.level === 'country') {
                    this.selectCountry(this.currentCountry);
                }
            });
            
            container.appendChild(node);
            
            if (index < path.length - 1) {
                const arrow = document.createElement('span');
                arrow.className = 'breadcrumb-arrow';
                arrow.textContent = '→';
                container.appendChild(arrow);
            }
        });
    }

    initializeControls() {
        // Sidebar toggle
        document.querySelector('.sidebar-toggle')?.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });

        // View mode switching
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.switchViewMode(e.target.dataset.mode);
            });
        });

        // Layer toggles
        document.getElementById('heatmap')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.map.addLayer(this.layers.heatmap);
            } else {
                this.map.removeLayer(this.layers.heatmap);
            }
        });

        document.getElementById('boundaries')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.map.addLayer(this.layers.boundaries);
            } else {
                this.map.removeLayer(this.layers.boundaries);
            }
        });

        document.getElementById('strikes')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.displayStrikePoints();
                this.map.addLayer(this.layers.strikes);
            } else {
                this.map.removeLayer(this.layers.strikes);
            }
        });

        document.getElementById('civilian')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.displayCivilianImpact();
                this.map.addLayer(this.layers.civilian);
            } else {
                this.map.removeLayer(this.layers.civilian);
            }
        });

        // Timeline controls
        this.initializeTimeline();

        // Depth slider
        this.initializeDepthSlider();

        // Initialize stat card hover effects
        this.initializeStatCardHovers();
    }

    initializeStatCardHovers() {
        // Add hover effects to the main stat card
        const statCard = document.querySelector('.stat-card');
        if (statCard) {
            statCard.addEventListener('mouseover', () => {
                // If we're in global view, highlight all countries
                if (!this.currentCountry || this.currentLevel === 0) {
                    this.highlightAllCountries();
                } else {
                    // If we're in country view, highlight the current country
                    this.highlightRegionOnMap(this.getCountryName(this.currentCountry));
                }
            });
            
            statCard.addEventListener('mouseout', () => {
                this.removeHighlightFromMap();
                this.removeAllCountryHighlights();
            });
        }
    }

    highlightAllCountries() {
        // Highlight all boundaries when hovering over global stats
        this.layers.boundaries.eachLayer(geoJsonLayer => {
            // Handle both direct geoJSON layers and nested layer groups
            if (geoJsonLayer.feature) {
                // Direct geoJSON layer
                this.highlightLayer(geoJsonLayer);
            } else if (geoJsonLayer.eachLayer) {
                // Layer group containing geoJSON layers
                geoJsonLayer.eachLayer(subLayer => {
                    this.highlightLayer(subLayer);
                });
            }
        });
    }

    highlightLayer(geoJsonLayer) {
        // Store original style before highlighting
        if (!geoJsonLayer._originalStyle) {
            geoJsonLayer._originalStyle = {
                fillColor: geoJsonLayer.options.fillColor,
                fillOpacity: geoJsonLayer.options.fillOpacity,
                color: geoJsonLayer.options.color,
                weight: geoJsonLayer.options.weight,
                opacity: geoJsonLayer.options.opacity
            };
        }
        
        geoJsonLayer.setStyle({
            fillOpacity: 0.5,
            weight: 3,
            color: '#fbbf24'
        });
    }

    removeAllCountryHighlights() {
        // Remove highlights from all features
        this.layers.boundaries.eachLayer(geoJsonLayer => {
            // Handle both direct geoJSON layers and nested layer groups
            if (geoJsonLayer.feature) {
                // Direct geoJSON layer
                this.restoreLayerStyle(geoJsonLayer);
            } else if (geoJsonLayer.eachLayer) {
                // Layer group containing geoJSON layers
                geoJsonLayer.eachLayer(subLayer => {
                    this.restoreLayerStyle(subLayer);
                });
            }
        });
    }

    restoreLayerStyle(geoJsonLayer) {
        if (geoJsonLayer._originalStyle) {
            geoJsonLayer.setStyle(geoJsonLayer._originalStyle);
        } else if (geoJsonLayer.feature) {
            const originalStyle = this.getFeatureStyle(geoJsonLayer.feature);
            geoJsonLayer.setStyle(originalStyle);
        }
    }

    initializeTimeline() {
        const timelineBars = document.querySelector('.timeline-bars');
        if (!timelineBars) {
            console.warn('Timeline bars container not found');
            return;
        }
        
        timelineBars.innerHTML = '';
        
        // Calculate strikes per year
        const strikesByYear = {};
        for (let year = 2004; year <= 2020; year++) {
            strikesByYear[year] = this.allStrikes ? this.allStrikes.filter(s => s.year === year).length : 0;
        }
        
        console.log('Strikes by year:', strikesByYear);
        console.log('Total strikes:', this.allStrikes ? this.allStrikes.length : 0);
        
        // Find max for scaling
        const maxStrikes = Math.max(...Object.values(strikesByYear));
        console.log('Max strikes in a year:', maxStrikes);
        
        // Create bars
        for (let year = 2004; year <= 2020; year++) {
            const bar = document.createElement('div');
            bar.className = 'timeline-bar';
            bar.dataset.year = year;
            
            // Calculate height with minimum of 10% and handle division by zero
            let height = 10; // minimum height for visibility
            if (maxStrikes > 0) {
                height = Math.max(10, (strikesByYear[year] / maxStrikes) * 90 + 10);
            }
            bar.style.height = `${height}%`;
            bar.style.minHeight = '8px'; // Ensure bars are always visible
            bar.title = `${year}: ${strikesByYear[year]} strikes`;
            
            bar.addEventListener('click', () => {
                this.selectYear(year);
                // Highlight selected bar
                document.querySelectorAll('.timeline-bar').forEach(b => b.style.opacity = '0.5');
                bar.style.opacity = '1';
            });
            
            timelineBars.appendChild(bar);
        }

        // Play controls
        const playBtn = document.querySelector('.play-btn');
        playBtn?.addEventListener('click', () => this.playTimeline());
    }

    selectYear(year) {
        this.currentYear = year;
        this.filteredStrikes = this.allStrikes.filter(s => s.year === year);
        
        // Update map display
        this.updateMapForYear(year);
        
        // Update stats for selected year
        this.updateYearStats(year);
    }

    updateMapForYear(year) {
        // Clear strike layers
        this.layers.strikes.clearLayers();
        this.layers.heatmap.clearLayers();
        
        // Add strikes for selected year
        const yearStrikes = this.allStrikes.filter(s => s.year === year);
        
        // Create heat map data
        const heatData = [];
        const countryCoords = {
            AFG: [33.0, 65.0],
            PAK: [30.0, 70.0],
            SOM: [5.0, 46.0],
            YEM: [15.0, 48.0]
        };
        
        Object.keys(countryCoords).forEach(country => {
            const countryStrikes = yearStrikes.filter(s => s.country === country);
            if (countryStrikes.length > 0) {
                const [lat, lng] = countryCoords[country];
                const intensity = Math.min(countryStrikes.length / 50, 1);
                
                const circle = L.circle([lat, lng], {
                    radius: 50000 + (intensity * 150000),
                    fillColor: `rgba(239, 68, 68, ${intensity * 0.6})`,
                    fillOpacity: 0.6,
                    stroke: false
                });
                this.layers.heatmap.addLayer(circle);
            }
        });
    }

    updateYearStats(year) {
        const yearStrikes = this.allStrikes.filter(s => s.year === year);
        
        let stats = {
            strikes: yearStrikes.length,
            deaths: { min: 0, max: 0 },
            civilians: { min: 0, max: 0 },
            children: { min: 0, max: 0 }
        };
        
        yearStrikes.forEach(strike => {
            stats.deaths.min += strike.minTotal;
            stats.deaths.max += strike.maxTotal;
            stats.civilians.min += strike.minCivilians;
            stats.civilians.max += strike.maxCivilians;
            stats.children.min += strike.minChildren;
            stats.children.max += strike.maxChildren;
        });
        
        this.updateStatsDisplay({
            strikes: stats.strikes,
            deaths: `${stats.deaths.min} to ${stats.deaths.max}`,
            civilians: `${stats.civilians.min} to ${stats.civilians.max}`,
            children: `${stats.children.min} to ${stats.children.max}`
        });
    }

    playTimeline() {
        if (this.timeline.playing) {
            this.timeline.playing = false;
            return;
        }
        
        this.timeline.playing = true;
        let currentYear = 2004;
        
        const interval = setInterval(() => {
            if (!this.timeline.playing || currentYear > 2020) {
                clearInterval(interval);
                this.timeline.playing = false;
                return;
            }
            
            this.selectYear(currentYear);
            
            // Highlight current bar
            document.querySelectorAll('.timeline-bar').forEach(b => {
                b.style.opacity = b.dataset.year == currentYear ? '1' : '0.5';
            });
            
            currentYear++;
        }, 1000);
    }

    initializeDepthSlider() {
        const depthSlider = document.querySelector('.depth-slider');
        const depthFill = document.querySelector('.depth-slider-fill');
        
        depthSlider?.addEventListener('click', (e) => {
            const rect = depthSlider.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            depthFill.style.width = percentage + '%';
            
            const depthLevel = Math.ceil((percentage / 100) * 4);
            this.setAdminLevel(depthLevel);
        });
    }

    setAdminLevel(level) {
        // Adjust the displayed administrative level
        if (!this.currentCountry) return;
        
        const maxLevel = this.currentCountry === 'PAK' ? 3 : 2;
        const targetLevel = Math.min(level, maxLevel);
        
        if (targetLevel === 0) {
            this.displayGlobalView();
        } else {
            // Load appropriate admin level
            this.currentLevel = targetLevel;
            // Refresh current view
            if (this.currentCountry) {
                this.selectCountry(this.currentCountry);
            }
        }
    }

    displayStrikePoints() {
        // Clear existing strike points
        this.layers.strikes.clearLayers();
        
        // Add individual strike markers
        const locationData = this.currentCountry ? 
            this.data[this.currentCountry].locations : null;
            
        if (locationData && locationData.features) {
            locationData.features.forEach(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    const [lng, lat] = feature.geometry.coordinates;
                    const marker = L.circleMarker([lat, lng], {
                        radius: 5,
                        fillColor: '#ef4444',
                        color: '#dc2626',
                        weight: 1,
                        opacity: 0.8,
                        fillOpacity: 0.6
                    });
                    
                    const props = feature.properties;
                    marker.bindPopup(`
                        <strong>Strike Location</strong><br>
                        Date: ${props.date || 'Unknown'}<br>
                        Deaths: ${props.min_total || 0} to ${props.max_total || 0}
                    `);
                    
                    this.layers.strikes.addLayer(marker);
                }
            });
        }
    }

    displayCivilianImpact() {
        // Clear existing civilian impact layer
        this.layers.civilian.clearLayers();
        
        // Add civilian casualty indicators
        this.filteredStrikes.forEach(strike => {
            if (strike.minCivilians > 0 || strike.maxCivilians > 0) {
                const coords = this.getStrikeCoordinates(strike);
                if (coords) {
                    const [lat, lng] = coords;
                    const radius = Math.sqrt(strike.maxCivilians) * 10000;
                    
                    const circle = L.circle([lat, lng], {
                        radius: radius,
                        fillColor: '#fbbf24',
                        fillOpacity: 0.4,
                        color: '#f59e0b',
                        weight: 1,
                        opacity: 0.6
                    });
                    
                    circle.bindPopup(`
                        <strong>Civilian Impact</strong><br>
                        Civilians: ${strike.minCivilians}-${strike.maxCivilians}<br>
                        Children: ${strike.minChildren}-${strike.maxChildren}
                    `);
                    
                    this.layers.civilian.addLayer(circle);
                }
            }
        });
    }

    getStrikeCoordinates(strike) {
        // Get approximate coordinates for strike based on country
        const countryCoords = {
            AFG: [33.0 + (Math.random() - 0.5) * 4, 65.0 + (Math.random() - 0.5) * 8],
            PAK: [30.0 + (Math.random() - 0.5) * 6, 70.0 + (Math.random() - 0.5) * 8],
            SOM: [5.0 + (Math.random() - 0.5) * 10, 46.0 + (Math.random() - 0.5) * 8],
            YEM: [15.0 + (Math.random() - 0.5) * 6, 48.0 + (Math.random() - 0.5) * 8]
        };
        return countryCoords[strike.country];
    }

    switchViewMode(mode) {
        this.showLoader(true);
        
        // Hide all UI elements first
        this.hideAllViewModes();
        
        setTimeout(() => {
            switch(mode) {
                case 'map':
                    // Default map view - timeline hidden
                    this.displayGlobalView();
                    break;
                case 'timeline':
                    // Show timeline
                    this.showTimeline();
                    break;
                case 'compare':
                    // Show comparison panel
                    document.querySelector('.comparison-panel')?.classList.add('active');
                    break;
                case 'stories':
                    // Would load individual strike stories
                    console.log('Stories view not yet implemented');
                    break;
            }
            this.showLoader(false);
        }, 200);
    }

    hideAllViewModes() {
        // Hide timeline
        const timeline = document.querySelector('.timeline-container');
        if (timeline) {
            timeline.classList.remove('visible');
        }
        
        // Hide comparison panel
        const comparison = document.querySelector('.comparison-panel');
        if (comparison) {
            comparison.classList.remove('active');
        }
    }

    showTimeline() {
        const timeline = document.querySelector('.timeline-container');
        if (timeline) {
            timeline.classList.add('visible');
            // Reinitialize timeline to ensure it's up to date
            this.initializeTimeline();
        }
    }

    showRegionDetails(properties) {
        // Show detailed information for a specific region
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(15, 15, 15, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 24px;
            z-index: 3000;
            max-width: 500px;
            color: white;
        `;
        
        modal.innerHTML = `
            <h3 style="margin-bottom: 16px;">${properties.shapeName || 'Region Details'}</h3>
            <p>Strikes: ${properties.dates?.length || 0}</p>
            <p>Total Deaths: ${properties.min_total || 0} to ${properties.max_total || 0}</p>
            <p>Civilians: ${properties.min_civilians || 0} to ${properties.max_civilians || 0}</p>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 16px;
                padding: 8px 16px;
                background: #3b82f6;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
            ">Close</button>
        `;
        
        document.body.appendChild(modal);
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

    getCountryFlag(code) {
        // Flag emojis removed - returning empty string
        return '';
    }

    showLoader(show) {
        const loader = document.querySelector('.loading-overlay');
        if (loader) {
            loader.classList.toggle('active', show);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new DroneWarfareApp();
    app.initialize().catch(err => {
        console.error('Failed to initialize app:', err);
        // Show error to user
        const loader = document.querySelector('.loading-overlay');
        if (loader) {
            loader.querySelector('p').textContent = 'Failed to load data. Please refresh.';
        }
    });
});