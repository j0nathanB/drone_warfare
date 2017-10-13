import React from 'react';
import mapStyle from '../../dist/mapStyle.js';
import NavBar from './navbar.jsx';

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
let apiData = require ('../../../data/normalized.js');


class GoogleMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      infWindow: {},
      center: {lat: 19.5, lng: 57},
      countries: [
        {name: "Pakistan", coords: {lat: 32.292872, lng: 68.681636} }, 
        {name: "Somalia", coords: {lat: 1.550723, lng: 43.748139} }, 
        {name: "Yemen", coords: {lat: 15.181005, lng: 46.71005} }
      ],
      activeCountry: {},
      isOpen: true
    }
    this.handleClick = this.handleClick.bind(this);
    this.optionClick = this.optionClick.bind(this);
    this.loadMap = this.loadMap.bind(this);
    this.loadScript = this.loadScript.bind(this);
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
      if (this.state.activeCountry.name === "Pakistan") {
        this.map.setZoom(7);
      } else {
        this.map.setZoom(8);
      }
    });
  }

  loadMap() {
    this.map  = new google.maps.Map(this.refs.map, {
      zoom: 5,
      center: this.state.center,
      mapTypeId: 'terrain',
      styles: mapStyle
    });

    var layer = new google.maps.FusionTablesLayer({
      query: {
        select: '\'town\'',
        from: '1UHO3u9llRy0dkWjRwSwW94wb7RBNllVnJ0nzpjkx'
      },
      options: {
        styleId: 2,
        templateId: 2
      }
    });
    
    let generateRectangle = (n,s,e,w) => {
      return new google.maps.Polyline({
        path: [
          {lat: n, lng: w},
          {lat:n, lng:e},
          {lat:s, lng:e},
          {lat:s, lng:w},
          {lat:n, lng:w},
        ],
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
    }
    
    let pakBound = generateRectangle(35.5, 29.0, 72.1, 65.5);
    let somBound = generateRectangle(3.8, -0.7, 45.5, 42);
    let yemBound = generateRectangle(17.4, 12.9, 50.5, 43);

    pakBound.setMap(this.map)
    somBound.setMap(this.map)
    yemBound.setMap(this.map)
    layer.setMap(this.map);
    
    // USE THE INFOWINDOW COMPONENT HERE IF FUSION TABLES BREAKS
  }

  loadScript(url, callback) {
    let head = document.getElementsByTagName('head')[0];
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;
    script.defer = true;

    script.onreadystatechange = callback;
    script.onload = callback;

    head.appendChild(script);
  }

  componentDidMount() {
    this.loadScript(`https://maps.googleapis.com/maps/api/js?key=${API_KEY}`, this.loadMap)
  }

  render() {
    const mapStyle = {
      width: '100vw',
      height: '93.9vh'
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