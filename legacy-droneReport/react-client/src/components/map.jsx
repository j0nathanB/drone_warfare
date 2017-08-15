import React from 'react';
import Card from './card.jsx';

let apiData = require ('../../../dataInit.js');

class GoogleMap extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    let gMap  = new google.maps.Map(this.refs.map, {
      zoom: 5,
      center: {lat: 27, lng: 63},
      mapTypeId: 'terrain'
    });

    for (let i = 0; i < apiData.features.length; i++) {
      let marker = new google.maps.Marker({
        position: {lat: apiData.features[i].geometry.coordinates[1], lng:apiData.features[i].geometry.coordinates[0]},
        map: gMap,
        title: 'location'
      });
      
      let infoWindow = new google.maps.InfoWindow({
        content: 
          `<h1> ${apiData.features[i].properties.town} </h1><p />` +         
          `<h3> Deaths: ${apiData.features[i].properties.deaths} </h3><br />` +
          `<h3> Injuries: ${apiData.features[i].properties.injuries} </h3><br />` +
          `<h3> Civilians: ${apiData.features[i].properties.civilians} </h3><br />` +
          `<h3> Children: ${apiData.features[i].properties.children} </h3><br />`
      });

      marker.addListener('click', function() {
        infoWindow.open(gMap, marker);
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