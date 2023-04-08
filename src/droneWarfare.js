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

  if(appState.admLevel == 0) {
    appState.previousTotals = {
      strikeCount: properties.strike_count,
      minTotal: properties.min_total,
      maxTotal: properties.max_total,
      minCivilians: properties.min_civilians,
      maxCivilians: properties.max_civilians,
      minChildren: properties.min_children,
      maxChildren: properties.max_children
    };
  } else {
    appState.previousTotals = {
      strikeCount: properties.dates.length,
      minTotal: properties.min_total.reduce((a, b) => (a + b), 0),
      maxTotal: properties.max_total.reduce((a, b) => (a + b), 0),
      minCivilians: properties.min_civilians.reduce((a, b) => (a + b), 0),
      maxCivilians: properties.max_civilians.reduce((a, b) => (a + b), 0),
      minChildren: properties.min_children.reduce((a, b) => (a + b), 0),
      maxChildren: properties.max_children.reduce((a, b) => (a + b), 0)
    };
  }

  if (appState.admLevel > 1) {
    appState.admName = properties.shapeName
  }

  let featuresToDisplay = [];
  if (canGoDeeper(appState.admLevel, appState.country)) {
    featuresToDisplay = appState.geojson[appState.country][appState.admLevel].features;

    if (appState.admLevel > 1) {
      featuresToDisplay = featuresToDisplay.filter(feature => feature.properties.parentAdm === this.appState.admName);
    }
  
    // Clear previously displayed features
    appState.map.geojson.clearLayers();
  
    // Display the new features
    appState.map.displayFeatures(featuresToDisplay);
  } else {
    appState.admLevel = appState.admLevel - 1;
    featuresToDisplay = appState.geojson[appState.country][appState.admLevel].features;

    featuresToDisplay = featuresToDisplay.filter(feature => feature.properties.shapeName === this.appState.admName);

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
  appState.previousTotals = {'strikeCount': 0, 'minTotal': 0, 'maxTotal': 0, 'minCivilians': 0, 'maxCivilians': 0, 'minChildren': 0, 'maxChildren': 0};
  const initDisplay = [appState.geojson.AFG[0], appState.geojson.PAK[0], appState.geojson.SOM[0], appState.geojson.YEM[0]];

  appState.map.displayFeatures(initDisplay);
  appState.dataTable.loadTable(initDisplay)
}

async function loadFunctionality() {
  appState.geojson = await geojsonHandler.getData();
  const breadcrumbs = new Breadcrumbs(appState, selectEntity);
  const droneWarfareMap = new DroneWarfareMap(appState, selectEntity, breadcrumbs);
  const dataTable = new DataTable(appState, selectEntity, breadcrumbs);
  
  appState.breadcrumbs = breadcrumbs;
  appState.map = droneWarfareMap;
  appState.dataTable = dataTable;
  loadDroneWarfare()
}

loadFunctionality();