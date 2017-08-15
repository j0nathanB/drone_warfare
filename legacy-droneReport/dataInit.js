let apiData = require ('./data/apiData.js');
let townData = {};

// get unique towns plus coordinates and extras
let makeTownData = () => {
  for (let i = 0; i < apiData.strike.length; i++) {
    let apiTown = apiData.strike[i].town;

    if (!townData.hasOwnProperty(apiTown)){
      townData[apiTown] = { count: 1 };
      townData[apiTown].coords = [Number(apiData.strike[i].lon), Number(apiData.strike[i].lat)];
      townData[apiTown].deathsMin = Number(apiData.strike[i].deaths_min);
      townData[apiTown].injuries = Number(apiData.strike[i].injuries)
      townData[apiTown].civilians = Number(apiData.strike[i].civilians)
      townData[apiTown].children = Number(apiData.strike[i].children)
      //townData[apiTown].injuries
      //aggregate data
    } else {
      townData[apiTown].count++;

      if(townData[apiTown].deathsMin < Number(apiData.strike[i].deaths_min)) {
        townData[apiTown].deathsMin = Number(apiData.strike[i].deaths_min);
      }
      if(townData[apiTown].injuries < Number(apiData.strike[i].injuries)) {
        townData[apiTown].injuries = Number(apiData.strike[i].injuries);
      }
      if(townData[apiTown].civilians < Number(apiData.strike[i].civilians)) {
        townData[apiTown].civilians = Number(apiData.strike[i].civilians);
      }
      if(townData[apiTown].children < Number(apiData.strike[i].children)) {
        townData[apiTown].children = Number(apiData.strike[i].children);
      }

    }
  }
}

//convert to GeoJSON
let convertToGeoJSON = (data) => {
  let geoJSON = {"type":"FeatureCollection","features":[]};

  for (let town in data) {
    geoJSON.features.push({"type":"Feature","geometry":{"type":"Point","coordinates":data[town].coords},"properties":{"town": town, "deaths":data[town].deathsMin, "injuries":data[town].injuries, "civilians": data[town].civilians, "children": data[town].children}});
  }

  return geoJSON;
}

let formattedData = () => {
  makeTownData();
  return convertToGeoJSON(townData);
}

//console.log(JSON.stringify(formattedData()))

module.exports = formattedData();
