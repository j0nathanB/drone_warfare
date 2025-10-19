// map.js
import { adjustCenter, getColor } from './utils.js';
import { Sidebar } from './sidebar.js';

export class DroneWarfareMap {
  constructor(appState, selectEntityCallback) {
    this.appState = appState;
    this.selectEntityCallback = selectEntityCallback;
    this.map = this.initializeMap();
    this.breadcrumbs = []
    this.highlightedLayer = null;
    this.originalStyles = new Map();
    
    // Initialize layer groups
    this.layers = {
      geojson: null,
      civilian: L.layerGroup().addTo(this.map),
      strikes: L.layerGroup().addTo(this.map),
      heatmap: L.layerGroup().addTo(this.map),
      bubblemap: L.layerGroup().addTo(this.map)
    };

    // Initialize boundary layer tracking for granular control
    this.boundaryLayers = {
      country: { visible: true, layer: null },
      adm1: { visible: true, layer: null },
      adm2: { visible: false, layer: null },
      adm3: { visible: false, layer: null }
    };

    // Track per-country ADM1 visibility for context-aware toggling
    this.countryAdm1Visibility = {
      'AFG': true,  // Default to true (checkbox is checked by default)
      'PAK': true,
      'SOM': true,
      'YEM': true
    };

    // Track per-country ADM2 visibility for context-aware toggling
    this.countryAdm2Visibility = {
      'AFG': false,
      'PAK': false,
      'SOM': false,
      'YEM': false
    };
    
    // Listen for layer toggle events
    this.setupLayerToggleListeners();
    this.setupEnhancedInteractions();
  }

  initializeMap = () => {
    const map = L.map('map', {'zoomControl': false}).setView([20, 65], 4);
    
    L.control.zoom({position: 'topright'}).addTo(map);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
    
    this.createLegend(map)

    return map;
  }

  resetMapView = () => {
    this.map.setView([20, 65], 4);
  };

  createLegend = (map) => {
    const legend = L.control({position: 'bottomright'});

    legend.onAdd = () => {    
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 10, 20, 50, 100, 200, 500, 1000],
            labels = [];
    
        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
    
        return div;
    };
    
    legend.addTo(map);
  }

  addPopup (feature, layer) {
    console.log('addPopup', feature, layer)

    const countryNames = {
      'AFG': 'Afghanistan',
      'PAK': 'Pakistan',
      'SOM': 'Somalia',
      'YEM': 'Yemen',
    }
    const name = "shapeISO" in feature.properties ? countryNames[feature.properties.shapeISO] : feature.properties.shapeName;

    layer.bindPopup('<h1>'+name+'</h1><p>name: '+feature.properties.strike_count+'</p>');
    // layer.bindPopup(popupContent);

    layer.on('mouseover', function (e) {
      console.log('mouseover', e)
        this.openPopup();
    });
    layer.on('mouseout', function (e) {
        this.closePopup();
    });
}

  zoomToFeature(e, bounds) {
    const targetBounds = bounds || e.target.getBounds();
    const padding = [0, 0];
    this.map.fitBounds(targetBounds, {paddingTopLeft: [500,0], paddingBottomRight: padding});
  }

  style(feature) {
    const maxTotal = Array.isArray(feature.properties.max_total) ? feature.properties.max_total.reduce((a, b) => a + b, 0) : feature.properties.max_total
    return {
      fillColor: getColor(maxTotal),
      weight: 2,
      opacity: 1,
      color: 'white',
      // dashArray: '3',
      fillOpacity: 0
    }
  }

  highlightFeature = (e) => {
    const layer = e.target;
    layer.setStyle({
        weight: 3,
        color: 'white',
        dashArray: '',
        fillOpacity: 0
    });

    layer.bringToFront();
  }
  
  resetHighlight = (e)=>  {
    const later = e.target;
    later.setStyle({
      weight: 2,
      opacity: 1,
      color: 'white',
      // dashArray: '3',
      fillOpacity: 0
    });
  }

  onEachFeature = (feature, layer) => {
    layer.on({
        mouseover: (e) => {
          this.highlightFeature(e);
  
          const countryNames = {
            'AFG': 'Afghanistan',
            'PAK': 'Pakistan',
            'SOM': 'Somalia',
            'YEM': 'Yemen',
          }
          const name = "shapeName" in feature.properties ? feature.properties.shapeName : countryNames[feature.properties.shapeISO];
      
          const popup = L.popup({'className':'popup'})
            .setLatLng(e.latlng) // Set the popup's position to the mouse cursor's LatLng
            .setContent('<h3>'+name+'</h3><p>Total strikes: '+feature.properties.strike_count+'</p>')
            .openOn(this.map);
        },
        mouseout: (e) => {
          this.resetHighlight(e)
          this.map.closePopup(); // Close the popup when the mouse is not over the feature
        },
        click: (e) => {
          this.zoomToFeature(e);
          this.selectEntityCallback(e.target.feature.properties, this.appState); // Call this function when an administrative division is clicked
        },
    });
  }       
  
  setupLayerToggleListeners() {
    document.addEventListener('layerToggled', (e) => {
      const { layerId, isEnabled } = e.detail;
      this.toggleLayer(layerId, isEnabled);
    });
  }

  toggleLayer(layerId, isEnabled) {
    switch (layerId) {
      case 'civilian':
        if (isEnabled) {
          this.displayCivilianImpact();
        } else {
          this.layers.civilian.clearLayers();
        }
        break;
      case 'strikes':
        if (isEnabled) {
          this.displayStrikePoints();
        } else {
          this.layers.strikes.clearLayers();
        }
        break;
      case 'boundaries':
        if (this.layers.geojson) {
          if (isEnabled) {
            this.map.addLayer(this.layers.geojson);
          } else {
            this.map.removeLayer(this.layers.geojson);
          }
        }
        break;
      case 'heatmap':
        if (isEnabled) {
          this.displayHeatmap();
        } else {
          this.layers.heatmap.clearLayers();
        }
        break;
      case 'bubblemap':
        if (isEnabled) {
          this.displayBubblemap();
        } else {
          this.layers.bubblemap.clearLayers();
        }
        break;
      case 'boundary-country':
        this.boundaryLayers.country.visible = isEnabled;
        this.updateBoundaryVisibility();
        break;
      case 'boundary-adm1':
        // Context-aware ADM1 toggling based on current breadcrumb location
        if (this.appState.admLevel === 0) {
          // Global level: toggle ADM1 for ALL countries
          this.boundaryLayers.adm1.visible = isEnabled;
          Object.keys(this.countryAdm1Visibility).forEach(country => {
            this.countryAdm1Visibility[country] = isEnabled;
          });
        } else if (this.appState.country) {
          // Country/province level: toggle ADM1 only for current country
          this.countryAdm1Visibility[this.appState.country] = isEnabled;

          // Update global visibility if any country has ADM1 visible
          this.boundaryLayers.adm1.visible = Object.values(this.countryAdm1Visibility).some(v => v);
        }
        this.updateBoundaryVisibility();
        break;
      case 'boundary-adm2':
        // Context-aware ADM2 toggling based on current breadcrumb location
        if (this.appState.admLevel === 0) {
          // Global level: toggle ADM2 for ALL countries
          this.boundaryLayers.adm2.visible = isEnabled;
          Object.keys(this.countryAdm2Visibility).forEach(country => {
            this.countryAdm2Visibility[country] = isEnabled;
          });
        } else if (this.appState.country) {
          // Country/province level: toggle ADM2 only for current country
          this.countryAdm2Visibility[this.appState.country] = isEnabled;

          // Update global visibility if any country has ADM2 visible
          this.boundaryLayers.adm2.visible = Object.values(this.countryAdm2Visibility).some(v => v);
        }
        this.updateBoundaryVisibility();
        break;
      case 'boundary-adm3':
        this.boundaryLayers.adm3.visible = isEnabled;
        this.updateBoundaryVisibility();
        break;
    }
  }

  displayCivilianImpact() {
    // Clear existing civilian impact layer
    this.layers.civilian.clearLayers();
    
    // Get current features that are displayed
    const currentFeatures = this.getCurrentDisplayedFeatures();
    
    currentFeatures.forEach(feature => {
      if (feature.properties && (feature.properties.min_civilians > 0 || feature.properties.max_civilians > 0)) {
        // Get the centroid of the feature for civilian impact display
        const centroid = this.getFeatureCentroid(feature);
        if (centroid) {
          const minCivilians = Array.isArray(feature.properties.min_civilians) ? 
            feature.properties.min_civilians.reduce((a, b) => a + b, 0) : (feature.properties.min_civilians || 0);
          const maxCivilians = Array.isArray(feature.properties.max_civilians) ? 
            feature.properties.max_civilians.reduce((a, b) => a + b, 0) : (feature.properties.max_civilians || 0);
          
          if (maxCivilians > 0) {
            const radius = Math.sqrt(maxCivilians) * 5000; // Adjusted radius calculation
            
            const circle = L.circle(centroid, {
              radius: radius,
              fillColor: '#fbbf24',
              fillOpacity: 0.4,
              color: '#f59e0b',
              weight: 2,
              opacity: 0.7
            });
            
            circle.bindPopup(`
              <div style="font-family: Arial, sans-serif;">
                <strong>Civilian Impact</strong><br>
                <strong>Region:</strong> ${feature.properties.shapeName || 'Unknown'}<br>
                <strong>Civilians Killed:</strong> ${minCivilians} to ${maxCivilians}<br>
                <strong>Total Strikes:</strong> ${feature.properties.strike_count || 0}
              </div>
            `);
            
            this.layers.civilian.addLayer(circle);
          }
        }
      }
    });
  }

  getFeatureCentroid(feature) {
    if (feature.geometry.type === 'Polygon') {
      // Calculate centroid of polygon
      const coords = feature.geometry.coordinates[0];
      let lat = 0, lng = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        lng += coords[i][0];
        lat += coords[i][1];
      }
      return [lat / (coords.length - 1), lng / (coords.length - 1)];
    } else if (feature.geometry.type === 'MultiPolygon') {
      // Use the first polygon for simplicity
      const coords = feature.geometry.coordinates[0][0];
      let lat = 0, lng = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        lng += coords[i][0];
        lat += coords[i][1];
      }
      return [lat / (coords.length - 1), lng / (coords.length - 1)];
    }
    return null;
  }

  getCurrentDisplayedFeatures() {
    // Return currently displayed features based on app state
    if (this.appState.admLevel === 0) {
      // Return all country features - extract first feature from FeatureCollection
      return [
        this.appState.geojson.AFG?.[0]?.features?.[0] || this.appState.geojson.AFG?.[0],
        this.appState.geojson.PAK?.[0]?.features?.[0] || this.appState.geojson.PAK?.[0],
        this.appState.geojson.SOM?.[0]?.features?.[0] || this.appState.geojson.SOM?.[0],
        this.appState.geojson.YEM?.[0]?.features?.[0] || this.appState.geojson.YEM?.[0]
      ].filter(f => f && f.properties);
    } else {
      // Return features at current admin level
      const countryData = this.appState.geojson[this.appState.country];
      if (countryData && countryData[this.appState.admLevel]) {
        const geojsonData = countryData[this.appState.admLevel];
        let features = geojsonData.features || [geojsonData];
        if (this.appState.admLevel > 1 && this.appState.admName) {
          features = features.filter(f => f.properties && f.properties.parentAdm === this.appState.admName);
        }
        return features;
      }
    }
    return [];
  }

  displayStrikePoints() {
    // Placeholder for strike points display
    // This would require actual strike coordinate data
    this.layers.strikes.clearLayers();
  }

  displayFeatures(features) {
    // Create a layer group to hold all GeoJSON layers
    this.layers.geojson = L.layerGroup().addTo(this.map);
    this.appState.map.geojson = this.layers.geojson; // Keep backward compatibility

    for (let i = 0; i < features.length; i++) {
      // Skip features that are not administrative divisions
      if('properties' in features[i] && features[i].properties.shapeName === 'unclear') continue;

      // Tag feature with its actual admin level and country for context-aware boundary toggling
      const feature = features[i];
      if (feature.properties.shapeISO) {
        // Country level feature (ADM0)
        feature.properties._admLevel = 0;
        feature.properties._country = feature.properties.shapeISO || feature.properties.shapeGroup;
      } else {
        // Sub-national feature (ADM1, ADM2, ADM3)
        feature.properties._admLevel = this.appState.admLevel;
        feature.properties._country = this.appState.country;
      }

      const geojsonLayer = L.geoJson(feature, {
        style: this.style,
        onEachFeature: this.onEachFeature,
      });

      // Add CSS classes for styling based on level
      this.addFeatureClasses(geojsonLayer, feature);

      // Add the GeoJSON layer to the layer group
      this.layers.geojson.addLayer(geojsonLayer);
    }
    
    // Update civilian impact if layer is enabled
    const civilianToggle = document.getElementById('civilian');
    if (civilianToggle && civilianToggle.checked) {
      this.displayCivilianImpact();
    }
  }

  addFeatureClasses(layer, feature) {
    // Add CSS classes based on administrative level
    layer.eachLayer(subLayer => {
      const element = subLayer.getElement();
      if (element) {
        if (feature.properties.shapeISO) {
          element.classList.add('country-boundary');
        } else {
          element.classList.add('admin-boundary');
        }
      }
    });
  }

  setupEnhancedInteractions() {
    // Setup region highlighting from sidebar interactions
    this.setupSidebarHighlighting();
    this.setupStatsCardHighlighting();
    this.setupContextMenu();
  }

  setupSidebarHighlighting() {
    // Listen for region hover events from sidebar
    document.addEventListener('regionHover', (e) => {
      const { regionName, isHover } = e.detail;
      if (isHover) {
        this.highlightRegionOnMap(regionName);
      } else {
        this.removeHighlightFromMap();
      }
    });
  }

  setupStatsCardHighlighting() {
    // Setup stats card hover highlighting
    const statsCard = document.querySelector('[data-cy="stats-card"]') || document.querySelector('.stat-card');
    if (statsCard) {
      statsCard.addEventListener('mouseover', () => {
        if (this.appState.admLevel === 0) {
          this.highlightAllCountries();
        } else if (this.appState.country) {
          this.highlightRegionOnMap(this.getCountryName(this.appState.country));
        }
      });
      
      statsCard.addEventListener('mouseout', () => {
        this.removeHighlightFromMap();
        this.removeAllCountryHighlights();
      });
    }
  }

  setupContextMenu() {
    // Add right-click context menu
    let contextMenu = document.querySelector('[data-cy="map-context-menu"]');
    if (!contextMenu) {
      contextMenu = document.createElement('div');
      contextMenu.setAttribute('data-cy', 'map-context-menu');
      contextMenu.className = 'map-context-menu';
      contextMenu.innerHTML = `
        <div class="context-menu-item" data-cy="context-menu-zoom">Zoom to</div>
        <div class="context-menu-item" data-cy="context-menu-details">View Details</div>
      `;
      contextMenu.style.cssText = `
        position: absolute;
        background: rgba(15, 15, 15, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 8px 0;
        color: white;
        z-index: 2000;
        display: none;
        min-width: 120px;
      `;
      
      document.body.appendChild(contextMenu);
      
      // Add CSS for context menu items
      const style = document.createElement('style');
      style.textContent = `
        .context-menu-item {
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .context-menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `;
      document.head.appendChild(style);
    }

    // Hide context menu on click elsewhere
    document.addEventListener('click', () => {
      contextMenu.style.display = 'none';
    });
  }

  highlightRegionOnMap(regionName) {
    // Remove previous highlight
    this.removeHighlightFromMap();
    
    // Find and highlight the corresponding region
    if (this.layers.geojson) {
      this.layers.geojson.eachLayer(geoJsonLayer => {
        this.searchAndHighlightLayer(geoJsonLayer, regionName);
      });
    }
  }

  searchAndHighlightLayer(geoJsonLayer, regionName) {
    if (geoJsonLayer.feature) {
      // Direct geoJSON layer
      this.checkAndHighlightLayer(geoJsonLayer, regionName);
    } else if (geoJsonLayer.eachLayer) {
      // Layer group containing geoJSON layers
      geoJsonLayer.eachLayer(subLayer => {
        this.checkAndHighlightLayer(subLayer, regionName);
      });
    }
  }

  checkAndHighlightLayer(geoJsonLayer, regionName) {
    const feature = geoJsonLayer.feature;
    if (feature && feature.properties) {
      const props = feature.properties;
      
      // Check if this feature matches the region name
      const featureName = props.shapeName || props.name || this.getCountryName(props.shapeISO);
      
      if (featureName === regionName) {
        // Store original style before highlighting
        this.storeOriginalStyle(geoJsonLayer);
        
        // Highlight this feature
        geoJsonLayer.setStyle({
          fillOpacity: 0.6,
          weight: 3,
          color: '#fbbf24',
          fillColor: '#fbbf24'
        });
        
        // Add CSS class for highlighting
        const element = geoJsonLayer.getElement();
        if (element) {
          element.classList.add('highlighted-region');
        }
        
        // Store reference to highlighted layer for cleanup
        this.highlightedLayer = geoJsonLayer;
        return true;
      }
    }
    return false;
  }

  storeOriginalStyle(layer) {
    if (!this.originalStyles.has(layer)) {
      const feature = layer.feature;
      if (feature) {
        this.originalStyles.set(layer, this.getFeatureStyle(feature));
      }
    }
  }

  getFeatureStyle(feature) {
    const props = feature.properties;

    // Check if this is a country-level feature (has shapeISO)
    if (props.shapeISO) {
      return {
        fillColor: 'white',
        fillOpacity: 0,
        color: 'white',
        weight: 2,
        opacity: 0.8
      };
    } else {
      // Administrative subdivision (province, district, etc.)
      return {
        fillColor: 'white',
        fillOpacity: 0,
        color: 'white',
        weight: 1,
        opacity: 0.6
      };
    }
  }

  removeHighlightFromMap() {
    if (this.highlightedLayer) {
      // Restore original style
      const originalStyle = this.originalStyles.get(this.highlightedLayer);
      if (originalStyle) {
        this.highlightedLayer.setStyle(originalStyle);
      } else {
        // Fallback to computed style
        const feature = this.highlightedLayer.feature;
        if (feature) {
          const style = this.getFeatureStyle(feature);
          this.highlightedLayer.setStyle(style);
        }
      }
      
      // Remove CSS class
      const element = this.highlightedLayer.getElement();
      if (element) {
        element.classList.remove('highlighted-region');
      }
      
      this.highlightedLayer = null;
    }
  }

  highlightAllCountries() {
    // Highlight all boundaries when hovering over global stats
    if (this.layers.geojson) {
      this.layers.geojson.eachLayer(geoJsonLayer => {
        this.highlightLayerGroup(geoJsonLayer);
      });
    }
  }

  highlightLayerGroup(geoJsonLayer) {
    if (geoJsonLayer.feature) {
      // Direct geoJSON layer
      this.highlightLayer(geoJsonLayer);
    } else if (geoJsonLayer.eachLayer) {
      // Layer group containing geoJSON layers
      geoJsonLayer.eachLayer(subLayer => {
        this.highlightLayer(subLayer);
      });
    }
  }

  highlightLayer(geoJsonLayer) {
    // Store original style before highlighting
    this.storeOriginalStyle(geoJsonLayer);
    
    geoJsonLayer.setStyle({
      fillOpacity: 0.5,
      weight: 3,
      color: '#fbbf24'
    });
    
    // Add CSS class
    const element = geoJsonLayer.getElement();
    if (element) {
      element.classList.add('highlighted-country');
    }
  }

  removeAllCountryHighlights() {
    // Remove highlights from all features
    if (this.layers.geojson) {
      this.layers.geojson.eachLayer(geoJsonLayer => {
        this.restoreLayerGroupStyle(geoJsonLayer);
      });
    }
  }

  restoreLayerGroupStyle(geoJsonLayer) {
    if (geoJsonLayer.feature) {
      // Direct geoJSON layer
      this.restoreLayerStyle(geoJsonLayer);
    } else if (geoJsonLayer.eachLayer) {
      // Layer group containing geoJSON layers
      geoJsonLayer.eachLayer(subLayer => {
        this.restoreLayerStyle(subLayer);
      });
    }
  }

  restoreLayerStyle(geoJsonLayer) {
    const originalStyle = this.originalStyles.get(geoJsonLayer);
    if (originalStyle) {
      geoJsonLayer.setStyle(originalStyle);
    } else if (geoJsonLayer.feature) {
      const style = this.getFeatureStyle(geoJsonLayer.feature);
      geoJsonLayer.setStyle(style);
    }
    
    // Remove CSS class
    const element = geoJsonLayer.getElement();
    if (element) {
      element.classList.remove('highlighted-country');
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

  // Expose the Leaflet map instance for external access
  get leafletMap() {
    return this.map;
  }

  // Heat map visualization - shades boundary polygons based on strike intensity
  displayHeatmap() {
    this.layers.heatmap.clearLayers();

    const currentFeatures = this.getCurrentDisplayedFeatures();

    // Calculate max strikes for intensity normalization
    const maxStrikes = Math.max(...currentFeatures.map(f => f.properties.strike_count || 0));

    currentFeatures.forEach(feature => {
      if (feature.properties && feature.properties.strike_count > 0) {
        const strikeCount = feature.properties.strike_count || 0;

        // Calculate heat intensity based on strike count
        const intensity = strikeCount / maxStrikes;

        // Get heat color based on intensity
        const heatColor = this.getHeatColor(intensity);

        // Create polygon from feature geometry (not a circle!)
        // Use L.geoJSON to convert GeoJSON to Leaflet layers
        const geoJsonLayer = L.geoJSON(feature, {
          style: {
            fillColor: heatColor,
            fillOpacity: 0.4 + (intensity * 0.3), // Semi-transparent, more opaque for higher intensity
            color: heatColor, // Border color matches fill
            weight: 2, // Visible border for region separation
            opacity: 0.8
          }
        });

        // Bind popup with strike information to each layer
        geoJsonLayer.bindPopup(`
          <div style="font-family: Arial, sans-serif;">
            <strong>Strike Intensity Heatmap</strong><br>
            <strong>Region:</strong> ${feature.properties.shapeName || feature.properties.shapeISO || 'Unknown'}<br>
            <strong>Total Strikes:</strong> ${strikeCount}<br>
            <strong>Intensity:</strong> ${(intensity * 100).toFixed(1)}%
          </div>
        `);

        // Store reference to original feature for later access
        // L.geoJSON creates a FeatureGroup/LayerGroup, so we need to add each sub-layer
        geoJsonLayer.eachLayer(layer => {
          layer.feature = feature; // Store feature reference
          this.layers.heatmap.addLayer(layer); // Add individual polygon layer
        });
      }
    });
  }

  getHeatColor(intensity) {
    // Color scale from blue (low) to red (high)
    if (intensity < 0.2) return '#3b82f6'; // blue
    if (intensity < 0.4) return '#10b981'; // green
    if (intensity < 0.6) return '#f59e0b'; // yellow/orange
    if (intensity < 0.8) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  // Bubble map visualization
  displayBubblemap() {
    this.layers.bubblemap.clearLayers();

    const currentFeatures = this.getCurrentDisplayedFeatures();

    currentFeatures.forEach(feature => {
      if (feature.properties && feature.properties.strike_count > 0) {
        const centroid = this.getFeatureCentroid(feature);
        if (centroid) {
          const strikeCount = feature.properties.strike_count || 0;
          const maxTotal = Array.isArray(feature.properties.max_total) ?
            feature.properties.max_total.reduce((a, b) => a + b, 0) : (feature.properties.max_total || 0);

          // Bubble size based on total casualties
          const radius = Math.sqrt(maxTotal) * 3000;

          // Create bubble with proportional sizing
          const bubble = L.circle(centroid, {
            radius: radius,
            fillColor: '#8b5cf6',
            fillOpacity: 0.4,
            color: '#7c3aed',
            weight: 2,
            opacity: 0.8
          });

          bubble.bindPopup(`
            <div style="font-family: Arial, sans-serif;">
              <strong>Casualty Bubble</strong><br>
              <strong>Region:</strong> ${feature.properties.shapeName || feature.properties.shapeISO || 'Unknown'}<br>
              <strong>Total Strikes:</strong> ${strikeCount}<br>
              <strong>Total Casualties:</strong> ${maxTotal}
            </div>
          `);

          this.layers.bubblemap.addLayer(bubble);
        }
      }
    });
  }

  // Update boundary visibility based on admin level controls
  updateBoundaryVisibility() {
    if (!this.layers.geojson) return;

    this.layers.geojson.eachLayer(geoJsonLayer => {
      this.updateLayerVisibility(geoJsonLayer);
    });
  }

  updateLayerVisibility(geoJsonLayer) {
    if (geoJsonLayer.feature) {
      // Direct geoJSON layer
      this.setLayerVisibility(geoJsonLayer);
    } else if (geoJsonLayer.eachLayer) {
      // Layer group containing geoJSON layers
      geoJsonLayer.eachLayer(subLayer => {
        this.setLayerVisibility(subLayer);
      });
    }
  }

  setLayerVisibility(geoJsonLayer) {
    const feature = geoJsonLayer.feature;
    if (!feature || !feature.properties) return;

    let shouldBeVisible = true;

    // Use the feature's tagged admin level instead of current app state level
    const featureAdmLevel = feature.properties._admLevel;
    const featureCountry = feature.properties._country;

    if (featureAdmLevel === 0) {
      // Country level (adm0)
      shouldBeVisible = this.boundaryLayers.country.visible;
    } else if (featureAdmLevel === 1) {
      // ADM1 level - check per-country visibility
      shouldBeVisible = this.countryAdm1Visibility[featureCountry] || false;
    } else if (featureAdmLevel === 2) {
      // ADM2 level - check per-country visibility
      shouldBeVisible = this.countryAdm2Visibility[featureCountry] || false;
    } else if (featureAdmLevel === 3) {
      // ADM3 level
      shouldBeVisible = this.boundaryLayers.adm3.visible;
    }

    // Apply visibility by adjusting opacity
    if (shouldBeVisible) {
      geoJsonLayer.setStyle({ opacity: 1, fillOpacity: 0 });
    } else {
      geoJsonLayer.setStyle({ opacity: 0, fillOpacity: 0 });
    }
  }

}
