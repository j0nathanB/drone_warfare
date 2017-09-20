// USE THE BELOW CODE IF FUSION TABLES IS BROKEN
    // for (let i = 0; i < apiData.features.length; i++) {
    //   let marker = new google.maps.Marker({
    //     position: {lat: apiData.features[i].geometry.coordinates[1], lng:apiData.features[i].geometry.coordinates[0]},
    //     map: this.map,
    //     title: apiData.features[i].properties.town
    //   });

    //   let content = `<pre><h2>${apiData.features[i].properties.town}</h2></pre>
    //         <pre> Coordinates: ${apiData.features[i].geometry.coordinates[1].toFixed(4)}, ${apiData.features[i].geometry.coordinates[0].toFixed(4)}</pre> 
    //         <hr> 
    //         <pre> ${apiData.features[i].properties.strikes} drone strike(s) here to date</pre>   
    //         <pre> Deaths: ${apiData.features[i].properties.deaths}, Injuries: ${apiData.features[i].properties.injuries}</pre>
    //         <pre> Civilians: ${apiData.features[i].properties.civilians}, Children: ${apiData.features[i].properties.children} </pre>`

    //   let layoutInfoWindow = (cont) => {
    //     if (apiData.features[i].properties.photos.length > 0){
    //       return (
    //       `<div style='float:left'>
    //         <img border="0" align="left" width=200 height=200 src="https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photoreference=${apiData.features[i].properties.photos[0].photo_reference}&key=${API_KEY}"></div>
    //       <div style="float:right">
    //         ${cont}
    //       </div>` )
    //     } else {
    //       return cont;
    //     }
    //   }

    //   let infoWindow = new google.maps.InfoWindow({
    //     content: 
    //       `${layoutInfoWindow(content)}`
    //   });
  
    //   let clickHandler = this.handleClick;

    //   marker.addListener('click', function() {
    //     clickHandler(infoWindow, this.map, marker);
    //   });

    //   this.map.addListener('click', function() {
    //     infoWindow.close();
    //   });
    // }