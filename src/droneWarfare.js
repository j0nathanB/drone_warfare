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
};

const geojsonHandler = new GeoJSONHandler();

// Function to update the state object when a country is selected
function selectEntity(properties, map, dataTable) {
  const countrySelected = 'shapeGroup' in properties ? properties.shapeGroup : properties.shapeISO;
  if (appState.country === countrySelected) {
    appState.admLevel = appState.admLevel + 1;
    appState.country = countrySelected;
  } else {
    appState.admLevel = 1;
    appState.country = countrySelected;
  }

  if (appState.admLevel > 1) {
    appState.admName = properties.shapeName
  }

  let featuresToDisplay = appState.geojson[appState.country][appState.admLevel].features;

  if (this.appState.admLevel > 1) {
    console.log(this.appState.admName, featuresToDisplay)
    featuresToDisplay = featuresToDisplay.filter(feature => feature.properties.parentAdm === this.appState.admName);
    // console.log(features)
  }
  // Clear previously displayed features
  map.geojson.clearLayers();

  // Display the new features
  map.displayFeatures(featuresToDisplay);

  // Update the table based on the new state
  dataTable.loadTable(featuresToDisplay);

  // Update the breadcrumbs
  appState.breadcrumbs.updateBreadcrumbs(appState.admLevel , appState.admName.length == 0 ? appState.country : appState.admName, appState.country);
}

async function loadFunctionality() {
  appState.geojson = await geojsonHandler.getData();
  
  const breadcrumbs = new Breadcrumbs(appState, selectEntity);
  const droneWarfareMap = new DroneWarfareMap(appState, selectEntity, breadcrumbs);
  const dataTable = new DataTable(appState, selectEntity, breadcrumbs);
  
  appState.breadcrumbs = breadcrumbs;
  appState.map = droneWarfareMap;
  appState.dataTable = dataTable;

  const initDisplay = [appState.geojson.AFG[0], appState.geojson.PAK[0], appState.geojson.SOM[0], appState.geojson.YEM[0]];

  // breadcrumbs.updateBreadcrumbs(appState.admLevel, 'All', 'All');
  droneWarfareMap.displayFeatures(initDisplay);
  dataTable.loadTable(initDisplay)

}

loadFunctionality();