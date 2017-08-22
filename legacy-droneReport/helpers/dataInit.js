const fs = require ('fs');
let apiData = require ('./data/apiData.js');
let getPhotos = require('./getPhotos.js');
let townData = {};

// normalize API data, e.g. strings to numbers
let normalize = (data) => {
  let normalized = Number(data);
  let dataString = "" + data;

  if (!isNaN(normalized)) {
    return normalized;
  } else if (isNaN(normalized) && dataString.includes("-")) {
    return  Number(data.split("-", 1));
  } else {
    return "Unknown";
  }
}

// normalize text for number updates
let normalizeUpdate = (data) => {
  return data === "Unknown" ? 0 : data;
}


// get unique towns plus coordinates and extras
let initApiData = () => {
  for (let i = 0; i < apiData.strike.length; i++) {
    let apiTown = apiData.strike[i].town;
    // handle condition if town name isn't given
    if (apiTown === "") {
      if (apiData.strike[i].location !== ""){
        apiTown = apiData.strike[i].location
      } else {
        apiTown = "Undisclosed"
      }
    }
    // if town name is new, initialize town with data, otherwise update data
    if (!townData.hasOwnProperty(apiTown)){
      townData[apiTown] = { count: 1 };
      townData[apiTown].country = apiData.strike[i].country;
      townData[apiTown].coords = [Number(apiData.strike[i].lon), Number(apiData.strike[i].lat)];
      townData[apiTown].deathsMin = Number(apiData.strike[i].deaths_min);
      townData[apiTown].injuries = normalize(apiData.strike[i].injuries);
      townData[apiTown].civilians = normalize(apiData.strike[i].civilians);
      townData[apiTown].children = normalize(apiData.strike[i].children);
      townData[apiTown].photos = [];
    } else {
      townData[apiTown].count++;
      townData[apiTown].deathsMin += Number(apiData.strike[i].deaths_min);
      //normalize data for aggregation
      townData[apiTown].injuries = normalizeUpdate(townData[apiTown].injuries);
      townData[apiTown].civilians = normalizeUpdate(townData[apiTown].civilians);
      townData[apiTown].children = normalizeUpdate(townData[apiTown].children);
      
      townData[apiTown].injuries += normalizeUpdate(normalize(apiData.strike[i].injuries));
      townData[apiTown].civilians += normalizeUpdate(normalize(apiData.strike[i].civilians));
      townData[apiTown].children += normalizeUpdate(normalize(apiData.strike[i].children));
    }
  }
}

//convert to GeoJSON
let convertToGeoJSON = (data) => {
  let geoJSON = {"type":"FeatureCollection","features":[]};
  for (let town in data) {
    geoJSON.features.push(
      {"type":"Feature",
      "geometry":{
        "type":"Point",
        "coordinates":data[town].coords
      },
      "properties":{
        "town": town, 
        "country": data[town].country,
        "strikes":data[town].count, 
        "deaths":data[town].deathsMin, 
        "injuries":data[town].injuries, 
        "injuriesMin":data[town].injuriesMin, 
        "civilians": data[town].civilians, 
        "civiliansMin": data[town].civiliansMin, 
        "childrenMin": data[town].childrenMin,
        "children": data[town].children,
        "photos": data[town].photos
      }
      }
    );
  }

  return geoJSON;
}

initApiData();
townData = convertToGeoJSON(townData);
getPhotos(townData.features);

setTimeout( () => {
  fs.writeFile('./data/normalized.js', 'module.exports = ' + JSON.stringify(townData), (err) => {
    if(err) { throw err; }
    console.log('saved!');
  });
}, 60000)


module.exports = townData;
