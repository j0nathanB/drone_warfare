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
        
        // Display initial view
        this.displayGlobalView();
        
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
        this.updateBreadcrumbs([
            { level: 'world', name: 'Global' },
            { level: 'country', name: this.getCountryName(country) }
        ]);
    }

    selectRegion(country, level, properties) {
        this.currentLevel = level + 1;
        
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

    updateGlobalStats() {
        let totalStrikes = 0;
        let totalDeaths = { min: 0, max: 0 };
        let totalCivilians = { min: 0, max: 0 };
        let totalChildren = { min: 0, max: 0 };
        
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
                
                totalDeaths.min += minTotal;
                totalDeaths.max += maxTotal;
                totalCivilians.min += minCivilians;
                totalCivilians.max += maxCivilians;
                totalChildren.min += minChildren;
                totalChildren.max += maxChildren;
            }
        });
        
        // Update UI
        this.updateStatsDisplay({
            strikes: totalStrikes,
            deaths: `${totalDeaths.min} to ${totalDeaths.max}`,
            civilians: `${totalCivilians.min} to ${totalCivilians.max}`,
            children: `${totalChildren.min} to ${totalChildren.max}`
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
            
            this.updateStatsDisplay({
                strikes: props.strike_count || 0,
                deaths: `${minTotal} to ${maxTotal}`,
                civilians: `${minCivilians} to ${maxCivilians}`,
                children: `${minChildren} to ${maxChildren}`
            });
        }
    }

    updateStatsDisplay(stats) {
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards[0]) statCards[0].querySelector('.stat-value').textContent = stats.strikes;
        if (statCards[1]) statCards[1].querySelector('.stat-value').textContent = stats.deaths;
        if (statCards[2]) statCards[2].querySelector('.stat-value').textContent = stats.civilians;
        if (statCards[3]) statCards[3].querySelector('.stat-value').textContent = stats.children;
    }

    updateRegionalBreakdown() {
        const regionList = document.getElementById('region-list');
        if (!regionList) return;
        
        regionList.innerHTML = '';
        
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
                            <span style="font-weight: 500; color: #ffffff;">${country.name}</span>
                        </div>
                        <span style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">${props.strike_count || 0} strikes</span>
                    </div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); line-height: 1.4;">
                        Deaths: ${minTotal} to ${maxTotal}<br>
                        Civilians: ${minCivilians} to ${maxCivilians}
                    </div>
                `;
                
                regionItem.addEventListener('mouseover', () => {
                    regionItem.style.background = 'rgba(255, 255, 255, 0.1)';
                    regionItem.style.transform = 'translateY(-1px)';
                });
                
                regionItem.addEventListener('mouseout', () => {
                    regionItem.style.background = 'rgba(255, 255, 255, 0.05)';
                    regionItem.style.transform = 'translateY(0)';
                });
                
                regionItem.addEventListener('click', () => {
                    this.selectCountry(country.code);
                });
                
                regionList.appendChild(regionItem);
            }
        });
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
    }

    initializeTimeline() {
        const timelineBars = document.querySelector('.timeline-bars');
        timelineBars.innerHTML = '';
        
        // Calculate strikes per year
        const strikesByYear = {};
        for (let year = 2004; year <= 2020; year++) {
            strikesByYear[year] = this.allStrikes.filter(s => s.year === year).length;
        }
        
        // Find max for scaling
        const maxStrikes = Math.max(...Object.values(strikesByYear));
        
        // Create bars
        for (let year = 2004; year <= 2020; year++) {
            const bar = document.createElement('div');
            bar.className = 'timeline-bar';
            bar.dataset.year = year;
            const height = (strikesByYear[year] / maxStrikes) * 100;
            bar.style.height = `${height}%`;
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
        
        setTimeout(() => {
            switch(mode) {
                case 'map':
                    // Default map view
                    this.displayGlobalView();
                    break;
                case 'timeline':
                    // Focus on timeline
                    document.querySelector('.timeline-container').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'compare':
                    // Show comparison panel
                    document.querySelector('.comparison-panel').classList.add('active');
                    break;
                case 'stories':
                    // Would load individual strike stories
                    console.log('Stories view not yet implemented');
                    break;
            }
            this.showLoader(false);
        }, 500);
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