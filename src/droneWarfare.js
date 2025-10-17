import { DataTable } from './table.js';
import { DroneWarfareMap } from './map.js';
import { GeoJSONHandler } from './geojsonHandler.js';
import { Breadcrumbs } from './breadcrumbs.js';
import { LayerControls } from './layerControls.js';
import { HeaderControls } from './headerControls.js';
import { Timeline } from './timeline.js';
import { StrikeVisualization } from './strikeVisualization.js';
import { ViewModeSystem } from './viewModeSystem.js';
import { DropdownNavigation } from './dropdownNavigation.js';

// Initialize the state object
const appState = {
  admLevel: 0,
  admName: '',
  country: null,
  geojson: {},
  map: null,
  dataTable: null,
  previousTotals: {'strikeCount': 0, 'minTotal': 0, 'maxTotal': 0, 'minCivilians': 0, 'maxCivilians': 0, 'minChildren': 0, 'maxChildren': 0},
  showZeroStrikes: false, // Filter state: false = hide zero strikes (default), true = show all
};

const geojsonHandler = new GeoJSONHandler();

// Check if it's allowed to go deeper in the administrative levels
const canGoDeeper = (admLevel, country) => {
  if (country === 'PAK' && admLevel <= 3) {
    return true;
  }
  return admLevel <= 2;
};

// Filter features based on strike count
const filterFeaturesByStrikes = (features) => {
  if (appState.showZeroStrikes) {
    // Show all features regardless of strike count
    return features;
  }
  // Filter out features with zero strikes
  return features.filter(feature => {
    const strikeCount = feature.properties.strike_count || 0;
    return strikeCount > 0;
  });
};

// Function to update statistics display in the UI
function updateStatistics(totals) {
  const formatNumber = (num) => {
    if (num === 0 || num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatRange = (min, max) => {
    if (min === max) return formatNumber(min);
    return `${formatNumber(min)} to ${formatNumber(max)}`;
  };

  // Update each statistic element
  const totalStrikesEl = document.querySelector('[data-cy="total-strikes"]');
  if (totalStrikesEl) {
    totalStrikesEl.textContent = formatNumber(totals.strikeCount);
  }

  const totalKilledEl = document.querySelector('[data-cy="total-killed"]');
  if (totalKilledEl) {
    totalKilledEl.textContent = formatRange(totals.minTotal, totals.maxTotal);
  }

  const civiliansKilledEl = document.querySelector('[data-cy="civilians-killed"]');
  if (civiliansKilledEl) {
    civiliansKilledEl.textContent = formatRange(totals.minCivilians, totals.maxCivilians);
  }

  const childrenKilledEl = document.querySelector('[data-cy="children-killed"]');
  if (childrenKilledEl) {
    childrenKilledEl.textContent = formatRange(totals.minChildren, totals.maxChildren);
  }

  // Note: Injured data is not available in the current data structure
  // Keeping the existing display for now
};

// Function to update statistics for a specific year based on strike data
function updateYearStatistics(yearStrikes) {
  let stats = {
    strikeCount: yearStrikes.length,
    minTotal: 0,
    maxTotal: 0,
    minCivilians: 0,
    maxCivilians: 0,
    minChildren: 0,
    maxChildren: 0
  };
  
  yearStrikes.forEach(strike => {
    stats.minTotal += strike.minTotal || 0;
    stats.maxTotal += strike.maxTotal || 0;
    stats.minCivilians += strike.minCivilians || 0;
    stats.maxCivilians += strike.maxCivilians || 0;
    stats.minChildren += strike.minChildren || 0;
    stats.maxChildren += strike.maxChildren || 0;
  });
  
  updateStatistics(stats);
}

// Function to update the state object when a country is selected
function selectEntity(properties, aState) {
  if (properties === null) {
    // Clear previously displayed features
    appState.map.geojson.clearLayers();
    appState.map.resetMapView()
    loadDroneWarfare()
    return
  }
  // Update the state object
  appState.admLevel = aState.admLevel;
  appState.admName = aState.admName;
  appState.country = aState.country;
  appState.previousTotals = aState.previousTotals;

  const countrySelected = 'shapeGroup' in properties ? properties.shapeGroup : properties.shapeISO;
  if (appState.country === countrySelected) {
    appState.admLevel = appState.admLevel + 1;
    appState.country = countrySelected;
  } else {
    // Switching to a different country - clear breadcrumbs to prevent showing "Country1 - Country2"
    appState.admLevel = 1;
    appState.country = countrySelected;
    appState.breadcrumbs.breadcrumbs = [];
  }

  // Calculate statistics - all levels use the same data structure
  appState.previousTotals = {
    strikeCount: properties.strike_count || 0,
    minTotal: Array.isArray(properties.min_total) ? properties.min_total.reduce((a, b) => (a + b), 0) : (properties.min_total || 0),
    maxTotal: Array.isArray(properties.max_total) ? properties.max_total.reduce((a, b) => (a + b), 0) : (properties.max_total || 0),
    minCivilians: Array.isArray(properties.min_civilians) ? properties.min_civilians.reduce((a, b) => (a + b), 0) : (properties.min_civilians || 0),
    maxCivilians: Array.isArray(properties.max_civilians) ? properties.max_civilians.reduce((a, b) => (a + b), 0) : (properties.max_civilians || 0),
    minChildren: Array.isArray(properties.min_children) ? properties.min_children.reduce((a, b) => (a + b), 0) : (properties.min_children || 0),
    maxChildren: Array.isArray(properties.max_children) ? properties.max_children.reduce((a, b) => (a + b), 0) : (properties.max_children || 0)
  };

  if (appState.admLevel > 1) {
    appState.admName = properties.shapeName
  }

  // Update the statistics display
  updateStatistics(appState.previousTotals);

  let featuresToDisplay = [];
  if (canGoDeeper(appState.admLevel, appState.country)) {
    featuresToDisplay = appState.geojson[appState.country][appState.admLevel].features;

    if (appState.admLevel > 1) {
      featuresToDisplay = featuresToDisplay.filter(feature => feature.properties.parentAdm === appState.admName);
    }

    // Apply strike filter
    featuresToDisplay = filterFeaturesByStrikes(featuresToDisplay);

    // Clear previously displayed features
    appState.map.geojson.clearLayers();

    // Display the new features
    appState.map.displayFeatures(featuresToDisplay);
  } else {
    appState.admLevel = appState.admLevel - 1;
    featuresToDisplay = appState.geojson[appState.country][appState.admLevel].features;

    featuresToDisplay = featuresToDisplay.filter(feature => feature.properties.shapeName === appState.admName);

    const featureBounds = L.geoJSON(featuresToDisplay[0]).getBounds()
    appState.map.zoomToFeature(null, featureBounds);
  }

  // Update the table based on the new state
  appState.dataTable.loadTable(featuresToDisplay);

  // Update the breadcrumbs only if their length is shorter than the admLevel (to prevent adding the same breadcrumb twice at the max admLevel)
  if (appState.breadcrumbs.breadcrumbs.length <= appState.admLevel) {
    appState.breadcrumbs.addBreadcrumbs(appState.admLevel , appState.admName.length == 0 ? appState.country : appState.admName, appState.country);
  } else {
    appState.breadcrumbs.updateBreadcrumbsAtMax(appState.admLevel, appState.admName, appState.country)
  }

  // Sync checkbox state with current country's ADM1 visibility when navigating to country level
  if (appState.admLevel === 1 && appState.country) {
    const adm1Checkbox = document.getElementById('header-boundary-adm1');
    if (adm1Checkbox && appState.map) {
      const currentVisibility = appState.map.countryAdm1Visibility[appState.country];
      if (adm1Checkbox.checked !== currentVisibility) {
        adm1Checkbox.checked = currentVisibility;
      }
    }
  }
}

function loadDroneWarfare() {
  appState.admLevel = 0;
  appState.admName = '';
  appState.country = null;
  
  // Calculate global totals - extract first feature from each country FeatureCollection
  const initDisplay = [
    appState.geojson.AFG[0]?.features?.[0] || appState.geojson.AFG[0],
    appState.geojson.PAK[0]?.features?.[0] || appState.geojson.PAK[0],
    appState.geojson.SOM[0]?.features?.[0] || appState.geojson.SOM[0],
    appState.geojson.YEM[0]?.features?.[0] || appState.geojson.YEM[0]
  ].filter(Boolean);
  
  const globalTotals = {
    strikeCount: 0,
    minTotal: 0,
    maxTotal: 0,
    minCivilians: 0,
    maxCivilians: 0,
    minChildren: 0,
    maxChildren: 0
  };
  
  // Sum up totals from all countries
  initDisplay.forEach(country => {
    if (!country || !country.properties) {
      console.warn('Invalid country data:', country);
      return;
    }
    const props = country.properties;
    globalTotals.strikeCount += props.strike_count || 0;
    globalTotals.minTotal += Array.isArray(props.min_total) ? props.min_total.reduce((a, b) => (a + b), 0) : (props.min_total || 0);
    globalTotals.maxTotal += Array.isArray(props.max_total) ? props.max_total.reduce((a, b) => (a + b), 0) : (props.max_total || 0);
    globalTotals.minCivilians += Array.isArray(props.min_civilians) ? props.min_civilians.reduce((a, b) => (a + b), 0) : (props.min_civilians || 0);
    globalTotals.maxCivilians += Array.isArray(props.max_civilians) ? props.max_civilians.reduce((a, b) => (a + b), 0) : (props.max_civilians || 0);
    globalTotals.minChildren += Array.isArray(props.min_children) ? props.min_children.reduce((a, b) => (a + b), 0) : (props.min_children || 0);
    globalTotals.maxChildren += Array.isArray(props.max_children) ? props.max_children.reduce((a, b) => (a + b), 0) : (props.max_children || 0);
  });
  
  appState.previousTotals = globalTotals;

  // Update the statistics display
  updateStatistics(appState.previousTotals);

  appState.map.displayFeatures(initDisplay);
  appState.dataTable.loadTable(initDisplay);

  // Display heatmap by default (since checkbox is checked)
  const heatmapCheckbox = document.getElementById('header-heatmap');
  if (heatmapCheckbox && heatmapCheckbox.checked) {
    appState.map.displayHeatmap();
  }
}

async function loadFunctionality() {
  // Initialize UI components immediately
  const breadcrumbs = new Breadcrumbs(appState, selectEntity);
  const droneWarfareMap = new DroneWarfareMap(appState, selectEntity, breadcrumbs);
  const dataTable = new DataTable(appState, selectEntity, breadcrumbs);
  const layerControls = new LayerControls();

  // Initialize year filtering callback
  const onYearSelect = (year, yearStrikes) => {
    // Update strike visualization with filtered data
    if (appState.strikeVisualization) {
      appState.strikeVisualization.filterByYear(year);
    }

    // Update statistics for the selected year
    if (year && yearStrikes) {
      updateYearStatistics(yearStrikes);
    } else {
      // Reset to global statistics
      updateStatistics(appState.previousTotals);
    }
  };

  // Initialize new modules
  const headerControls = new HeaderControls();
  const timeline = new Timeline(appState, onYearSelect);
  const strikeVisualization = new StrikeVisualization(appState, droneWarfareMap.map);
  const viewModeSystem = new ViewModeSystem(appState, timeline, strikeVisualization);

  // Setup layer synchronization
  headerControls.setupLayerSync();

  appState.breadcrumbs = breadcrumbs;
  appState.map = droneWarfareMap;
  appState.dataTable = dataTable;
  appState.layerControls = layerControls;
  appState.headerControls = headerControls;
  appState.timeline = timeline;
  appState.strikeVisualization = strikeVisualization;
  appState.viewModeSystem = viewModeSystem;

  // Note: DropdownNavigation will be initialized after data loads
  appState.dropdownNavigation = null;

  // Expose appState and selectEntity globally for testing and external access
  window.appState = appState;
  window.selectEntity = selectEntity;

  // Update loading indicator to show data loading phase
  updateLoadingIndicator('Loading drone strike data...');

  try {
    // Load data asynchronously while map is already visible
    appState.geojson = await geojsonHandler.getData();

    // Initialize dropdown navigation AFTER data is loaded
    const dropdownNavigation = new DropdownNavigation(appState, selectEntity, breadcrumbs);
    appState.dropdownNavigation = dropdownNavigation;

    // Process strike data for new modules
    strikeVisualization.processStrikeData();
    timeline.processStrikeData();

    loadDroneWarfare();

    // Setup filter empty strikes checkbox
    setupFilterEmptyStrikesCheckbox();

    hideLoadingScreen();
  } catch (error) {
    console.error('Failed to load data:', error);
    updateLoadingIndicator('Failed to load data. Please refresh the page.');
  }
}

// Setup the filter empty strikes checkbox event listener
function setupFilterEmptyStrikesCheckbox() {
  const checkbox = document.getElementById('filter-empty-strikes');
  if (!checkbox) {
    console.warn('Filter empty strikes checkbox not found');
    return;
  }

  checkbox.addEventListener('change', (event) => {
    appState.showZeroStrikes = event.target.checked;

    // Re-apply current view with new filter
    if (appState.admLevel === 0) {
      // At global level
      loadDroneWarfare();
    } else {
      // At a specific administrative level - refresh current view
      let featuresToDisplay = appState.geojson[appState.country][appState.admLevel].features;

      // Apply parent filter if needed
      if (appState.admLevel > 1) {
        featuresToDisplay = featuresToDisplay.filter(feature =>
          feature.properties.parentAdm === appState.admName
        );
      }

      // Apply strike filter
      featuresToDisplay = filterFeaturesByStrikes(featuresToDisplay);

      // Update map and table
      appState.map.geojson.clearLayers();
      appState.map.displayFeatures(featuresToDisplay);
      appState.dataTable.loadTable(featuresToDisplay);
    }
  });
}

function updateLoadingIndicator(message) {
  const loadingDiv = document.getElementById('loading');
  if (loadingDiv) {
    loadingDiv.textContent = message;
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out', 'hidden');
    setTimeout(() => {
      if (loadingScreen.parentNode) {
        loadingScreen.parentNode.removeChild(loadingScreen);
      }
    }, 1500);
  }
}

// Initialize immediately
loadFunctionality();