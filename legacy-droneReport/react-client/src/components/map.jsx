import React from 'react';

class GoogleMap extends React.Component {
  constructor(props) {
    super(props);
    //this.getCircle = this.getCircle.bind(this);
    //this.eqfeed_callback = this.eqfeed_callback.bind(this);
  }

  componentDidMount() {
    let gMap  = new google.maps.Map(this.refs.map, {
      zoom: 5,
      center: {lat: 27, lng: 63},
      mapTypeId: 'terrain'
    });

    gMap.data.setStyle( feature => {
      var magnitude = feature.f.deaths;
      return {
        icon: getCircle(magnitude)
      };
    });  
  
    let getCircle = (magnitude) => {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: 'red',
        fillOpacity: .2,
        scale: magnitude * 2,
        strokeColor: 'white',
        strokeWeight: .5
      };
    }

    let eqfeed_callback = (results) => {
      gMap.data.addGeoJson(results);
    }

    let obj = {"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[45.322755,15.47467]},"properties":{"deaths":6}},{"type":"Feature","geometry":{"type":"Point","coordinates":[69.57624435,32.30512565]},"properties":{"deaths":8}},{"type":"Feature","geometry":{"type":"Point","coordinates":[70.26082993,32.98677989]},"properties":{"deaths":2}},{"type":"Feature","geometry":{"type":"Point","coordinates":[70.34082413,32.99988191]},"properties":{"deaths":8}},{"type":"Feature","geometry":{"type":"Point","coordinates":[70.04196167,33.00866349]},"properties":{"deaths":5}}]}

    eqfeed_callback(obj);

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