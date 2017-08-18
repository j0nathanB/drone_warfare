import React from 'react';
import mapStyle from '../../dist/mapStyle.js';
import NavBar from './navbar.jsx' 

let apiData = require ('../../../dataInit.js');

class GoogleMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      infWindow: {},
      center: {lat: 23.4241, lng: 53.8478},
      countries: [
        {name: "Pakistan", coords: {lat: 33.3338, lng: 69.9372} }, 
        {name: "Somalia", coords: {lat: 2.107681, lng: 43.694073} }, 
        {name: "Yemen", coords: {lat: 14.7546, lng: 46.5163} }
      ],
      activeCountry: {}
    }
    this.handleClick = this.handleClick.bind(this);
    this.optionClick = this.optionClick.bind(this)
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

  optionClick(selection) {
    this.setState({
      activeCountry: this.state.countries.filter( country => country.name === selection)[0]
    }, () => { 
      this.map.panTo(this.state.activeCountry.coords); 
      if (this.state.activeCountry.name === "Somalia") {
        this.map.setZoom(8);
      } else if (this.state.activeCountry.name === "Yemen") {
        this.map.setZoom(8)
      }
      else {
        this.map.setZoom(9);
      }
    });
  }

  componentDidMount() {
    this.map  = new google.maps.Map(this.refs.map, {
      zoom: 4,
      center: this.state.center,
      mapTypeId: 'terrain',
      styles: mapStyle
    });

    for (let i = 0; i < apiData.features.length; i++) {
      let marker = new google.maps.Marker({
        position: {lat: apiData.features[i].geometry.coordinates[1], lng:apiData.features[i].geometry.coordinates[0]},
        map: this.map,
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
        clickHandler(infoWindow, this.map, marker);
      });
      
      this.map.addListener('click', function() {
        infoWindow.close();
      });
    }
  }


  render() {
    const mapStyle = {
      width: '100vw',
      height: '100vh'
    };
    
    return (
      <div>
        <NavBar clickHandler={this.optionClick} countries={this.state.countries}/>
        <div ref="map" style={mapStyle}>Loading map...</div>
      </div>
    )
  }
}

export default GoogleMap;