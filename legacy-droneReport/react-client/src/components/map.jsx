import React from 'react';
import Card from './card.jsx';

let apiData = require ('../../../dataInit.js');

class GoogleMap extends React.Component {
  constructor(props) {
    super(props);
    //add infoWindow state to close window when other marker clicked
  }

  componentDidMount() {
    let gMap  = new google.maps.Map(this.refs.map, {
      zoom: 4,
      center: {lat: 23.4241, lng: 53.8478},
      mapTypeId: 'terrain',
      styles: [
            {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{color: '#263c3f'}]
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [{color: '#6b9a76'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{color: '#38414e'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{color: '#212a37'}]
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{color: '#9ca5b3'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{color: '#746855'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{color: '#1f2835'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'labels.text.fill',
              stylers: [{color: '#f3d19c'}]
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{color: '#2f3948'}]
            },
            {
              featureType: 'transit.station',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{color: '#17263c'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{color: '#515c6d'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.stroke',
              stylers: [{color: '#17263c'}]
            }
          ]
    });

    for (let i = 0; i < apiData.features.length; i++) {
      let marker = new google.maps.Marker({
        position: {lat: apiData.features[i].geometry.coordinates[1], lng:apiData.features[i].geometry.coordinates[0]},
        map: gMap,
        title: 'location'
      });
      
      let infoWindow = new google.maps.InfoWindow({
        content: 
          `<h1> ${apiData.features[i].properties.town} </h1>` +
          `<h2> ${marker.position} </h2>` +
          `<h3> Times targeted: ${apiData.features[i].properties.strikes} </h3>` +  
          `<h3> Deaths: ${apiData.features[i].properties.deaths} </h3>` +
          `<h3> Injuries: ${apiData.features[i].properties.injuries} </h3>` +
          `<h3> Civilians: ${apiData.features[i].properties.civilians} </h3>` +
          `<h3> Children: ${apiData.features[i].properties.children} </h3>`
      });

      marker.addListener('click', function() {
        infoWindow.open(gMap, marker);
      });
      
      gMap.addListener('click', function() {
        infoWindow.close();
      });
    }
        // gMap.data.setStyle( feature => {
    //   var magnitude = feature.f.deaths;
    //   return {
    //     icon: getCircle(magnitude)
    //   };
    // });  
  
  //   let getCircle = (magnitude) => {
  //     return {
  //       path: google.maps.SymbolPath.CIRCLE,
  //       fillColor: 'red',
  //       fillOpacity: .2,
  //       scale: magnitude,
  //       strokeColor: 'white',
  //       strokeWeight: .5
  //     };
  //   }
  //   console.log(JSON.stringify(apiData))
  //   gMap.data.addGeoJson(apiData);
  }




  render() {
    const mapStyle = {
      width: '100vw',
      height: '100vh'
    };

    return ( 
      <div ref="map" style={mapStyle}>Loading map...
      </div>
    )
  }
}

export default GoogleMap;