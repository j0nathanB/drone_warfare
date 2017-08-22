//let locationData = require('./data/normalized.js').features;
//let locationData = require('./data/dummy.js')
let googleMapsClient = require('@google/maps').createClient({
  key: 'YOUR_API_KEY'
}); 

let downloadPhotos = (locationData) => {
  locationData.forEach( location => {
    let placesQuery = location.properties.town + "," + location.properties.country;
    //let placesQuery = location.town + "," + location.country;

    // Request Places photo_reference
    googleMapsClient.places(
      {query: placesQuery}, 
      (err, response) => {if (!err) {
        if (response.json.results.length > 0) {
          if (response.json.results[0].hasOwnProperty("photos")) {
            location.properties.photos = response.json.results[0].photos;
          }
        }
      }}
    )
  }); 
}

module.exports = downloadPhotos;
 
/*
    https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=CmRaAAAApeM5PFSQdU4yKw8onQMKCisLAlmttCSXWcsUGSctQfAwkaNB5qGI3tuy5UrfNG0KvbiyT_tZWNcCEQ_p22YPV3ZY3x8VFmj_ZrAq9xtOul6Zu3wnzzXYYvECqQ36q4F9EhB_Ez5fupyqDs2Zn3cpC91_GhRDgL5nsNT7pMcFQVomBIEChtrbGw&key=YOUR_API_KEY */