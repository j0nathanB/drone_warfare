import React from 'react';

class Map extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
    }

    this.loadJS = this.loadJS.bind(this);
  }

  componentDidMount() {
    // Connect the initMap() function within this class to the global window context,
    // so Google Maps can invoke it
    window.initMap = this.initMap;
    // Asynchronously load the Google Maps script, passing in the callback reference
    loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyAWh923QwLcLQGjH1w4OYOG0_CX8jGHbmE&callback=initMap')
  }

  initMap() {
    map = new google.maps.Map(this.refs.map.getDOMNode());
  }

  loadJS(src) {
    console.log("loaded")
    let ref = window.document.getElementsByTagName("script")[0];
    let script = window.document.createElement("script");
    script.src = src;
    script.async = true;
    ref.parentNode.insertBefore(script, ref);
  }

  render() {
    const mapStyle = {
      width: 500,
      height: 300,
      border: '1px solid black'
    };

    return ( 
      <div ref="map" style={mapStyle}>I am a map</div>
    )
  }
}

export default Map;