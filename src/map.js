// map.js
import { adjustCenter, getColor } from './utils.js';
import { Sidebar } from './sidebar.js';

export class DroneWarfareMap {
  constructor(appState, selectEntityCallback) {
    this.appState = appState;
    this.sidebarWidth = new Sidebar().getWidth();
    this.selectEntityCallback = selectEntityCallback;
    this.map = this.initializeMap();
    this.info = this.initializeControl()
    this.breadcrumbs = []
  }

  initializeMap = () => {
    const map = L.map('map', {'zoomControl': false}).setView([20, 50], 5);
    
    L.control.zoom({position: 'bottomright'}).addTo(map);
    
    L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
      attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: 0,
      maxZoom: 22,
      subdomains: 'abcd',
      accessToken: 'rBamW4Kz7pPEzv3GqzMbEeKlTfrBVmzSbePyFo7nelia3jGNw44jYWNwoOxog3Mw'
    }).addTo(map);

    this.createLegend(map)

    // Add click event listeners to breadcrumb links
    const breadcrumbLinks = document.querySelectorAll('#breadcrumbs a');
    breadcrumbLinks.forEach(link => {
      link.addEventListener('click', this.handleBreadcrumbClick);
    });

    return map;
  }

  initializeControl = () => {
    const info = L.control();

    info.onAdd = (map) => {
      info._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
      info.update();
      return info._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
      info._div.innerHTML = '<h4>US Population Density</h4>' +  (props ?
          '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
          : 'Hover over a state');
    };

    info.addTo(this.map);
    return info;
  }

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

  

  adjustCenter = (sidebarWidth) => {
    const mapSize = this.map.getSize();
    const sidebarCenterOffset = sidebarWidth / 2;
  
    // Calculate the offset in terms of map coordinates
    const offset = this.map.containerPointToLatLng([sidebarCenterOffset, 0]);
  
    const currentCenter = this.map.getCenter();
    const newCenter = L.latLng(currentCenter.lat, currentCenter.lng + (offset.lng - currentCenter.lng) * 2);
  
    // Return the new center
    return newCenter;
  }
  

  zoomToFeature = (e, sidebarWidth) => {
    const targetBounds = e.target.getBounds();
    this.map.fitBounds(targetBounds);

    const adjustedCenter = this.adjustCenter(sidebarWidth);
    // this.map.panTo(adjustedCenter);
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
    // console.log(layer.feature.properties)
    this.info.update(layer.feature.properties);
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

    this.info.update();
  }

  onEachFeature = (feature, layer) => {
    layer.on({
        mouseover: this.highlightFeature,
        mouseout: this.resetHighlight,
        click: (e) => {
          this.zoomToFeature(e, this.sidebarWidth);
          this.selectEntityCallback(e.target.feature.properties, this.appState.map, this.appState.dataTable); // Call this function when an administrative division is clicked
        },
    });
  }

  displayFeatures(features) {
    // Create a layer group to hold all GeoJSON layers
    this.appState.map.geojson = L.layerGroup().addTo(this.map);
  
    for (let i = 0; i < features.length; i++) {
      const geojsonLayer = L.geoJson(features[i], {
        style: this.style,
        onEachFeature: this.onEachFeature,
      });
  
      // Add the GeoJSON layer to the layer group
      this.appState.map.geojson.addLayer(geojsonLayer);
    }
  }
  
}
