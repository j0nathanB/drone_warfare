// map.js
import { adjustCenter, getColor } from './utils.js';
import { Sidebar } from './sidebar.js';

export class DroneWarfareMap {
  constructor(appState, selectEntityCallback) {
    this.appState = appState;
    this.selectEntityCallback = selectEntityCallback;
    this.map = this.initializeMap();
    this.breadcrumbs = []
  }

  initializeMap = () => {
    const map = L.map('map', {'zoomControl': false}).setView([20, 50], 5);
    
    L.control.zoom({position: 'topright'}).addTo(map);
    
    L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
      attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: 0,
      maxZoom: 22,
      subdomains: 'abcd',
      accessToken: 'rBamW4Kz7pPEzv3GqzMbEeKlTfrBVmzSbePyFo7nelia3jGNw44jYWNwoOxog3Mw'
    }).addTo(map);
    
    this.createLegend(map)

    return map;
  }

  resetMapView = () => {
    this.map.setView([20, 47.5], 4.5);
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

  zoomToFeature(e, bounds) {
    const targetBounds = bounds || e.target.getBounds();
    // console.log(targetBounds)
    // targetBounds._northEast.lat += 0.5;
    // targetBounds._northEast.lng += 0.5;
    // targetBounds._southWest.lat -= 0.5;
    // targetBounds._southWest.lng -= 0.5;
    // console.log(targetBounds)
    const padding = [0, 0];
    this.map.fitBounds(targetBounds, {paddingTopLeft: [500,0], paddingBottomRight: padding});
  }

  style(feature) {
    const maxTotal = Array.isArray(feature.properties.max_total) ? feature.properties.max_total.reduce((a, b) => a + b, 0) : feature.properties.max_total
    return {
      fillColor: getColor(maxTotal),
      weight: 2,
      opacity: 1,
      color: 'red',
      // dashArray: '3',
      fillOpacity: 0.7
    }
  }

  highlightFeature = (e) => {
    const layer = e.target;
    layer.setStyle({
        weight: 3,
        color: 'blue',
        dashArray: '',
        fillOpacity: 0.7
    });
  
    layer.bringToFront();
  }
  
  resetHighlight = (e)=>  {
    const later = e.target;
    later.setStyle({
      weight: 2,
      opacity: 1,
      color: 'red',
      // dashArray: '3',
      fillOpacity: 0.7
    });
  }

  onEachFeature = (feature, layer) => {
    layer.on({
        mouseover: this.highlightFeature,
        mouseout: this.resetHighlight,
        click: (e) => {
          this.zoomToFeature(e);
          this.selectEntityCallback(e.target.feature.properties, this.appState); // Call this function when an administrative division is clicked
        },
    });
  }

  displayFeatures(features) {
    // Create a layer group to hold all GeoJSON layers
    this.appState.map.geojson = L.layerGroup().addTo(this.map);
    for (let i = 0; i < features.length; i++) {
      // Skip features that are not administrative divisions
      if('properties' in features[i] && features[i].properties.shapeName === 'unclear') continue;
      const geojsonLayer = L.geoJson(features[i], {
        style: this.style,
        onEachFeature: this.onEachFeature,
      });
  
      // Add the GeoJSON layer to the layer group
      this.appState.map.geojson.addLayer(geojsonLayer);
    }
  }
  
}
