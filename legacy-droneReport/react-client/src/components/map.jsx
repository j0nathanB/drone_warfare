import React from 'react';
import mapStyle from '../../dist/mapStyle.js'

let apiData = require ('../../../dataInit.js');

class GoogleMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      infWindow: {},
      center: {lat: 23.4241, lng: 53.8478}
    }
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(infWin, map, marker) {
    if (this.state.infWindow.hasOwnProperty("content")) {
      this.state.infWindow.close();
    }
    
    infWin.open(map, marker);
    
    this.setState({
      infWindow: infWin
    });
  }

  componentDidMount() {
    let propsCenter = this.props.center;
    
    let gMap  = new google.maps.Map(this.refs.map, {
      zoom: 4,
      center: this.state.center,
      mapTypeId: 'terrain',
      styles: mapStyle
    });

    for (let i = 0; i < apiData.features.length; i++) {
      let marker = new google.maps.Marker({
        position: {lat: apiData.features[i].geometry.coordinates[1], lng:apiData.features[i].geometry.coordinates[0]},
        map: gMap,
        title: apiData.features[i].properties.town
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

      let clickHandler = this.handleClick;

      marker.addListener('click', function() {
        clickHandler(infoWindow, gMap, marker);
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