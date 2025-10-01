import { DataTable } from './table.js';
import { DroneWarfareMap } from './map.js';
import { GeoJSONHandler } from './geojsonHandler.js';
import { Breadcrumbs } from './breadcrumbs.js';

// Initialize the state object
const appState = {
  admLevel: 0,
  admName: '',
  country: null,
  geojson: {},
  map: null,
  dataTable: null,
  previousTotals: {'strikeCount': 0, 'minTotal': 0, 'maxTotal': 0, 'minCivilians': 0, 'maxCivilians': 0, 'minChildren': 0, 'maxChildren': 0},
};

const geojsonHandler = new GeoJSONHandler();

// Check if it's allowed to go deeper in the administrative levels
const canGoDeeper = (admLevel, country) => {
  if (country === 'PAK' && admLevel <= 3) {
    return true;
  }
  return admLevel <= 2;
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
    appState.admLevel = 1;
    appState.country = countrySelected;
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
}

function loadDroneWarfare() {
  appState.admLevel = 0;
  appState.admName = '';
  appState.country = null;
  
  // Calculate global totals
  const initDisplay = [appState.geojson.AFG[0], appState.geojson.PAK[0], appState.geojson.SOM[0], appState.geojson.YEM[0]];
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
}

async function loadFunctionality() {
  // Initialize UI components immediately
  const breadcrumbs = new Breadcrumbs(appState, selectEntity);
  const droneWarfareMap = new DroneWarfareMap(appState, selectEntity, breadcrumbs);
  const dataTable = new DataTable(appState, selectEntity, breadcrumbs);
  
  appState.breadcrumbs = breadcrumbs;
  appState.map = droneWarfareMap;
  appState.dataTable = dataTable;

  // Update loading indicator to show data loading phase
  updateLoadingIndicator('Loading drone strike data...');

  try {
    // Load data asynchronously while map is already visible
    appState.geojson = await geojsonHandler.getData();
    loadDroneWarfare();
    hideLoadingScreen();
  } catch (error) {
    console.error('Failed to load data:', error);
    updateLoadingIndicator('Failed to load data. Please refresh the page.');
  }
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