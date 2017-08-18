let apiData = require ('./data/apiData.js');

let results = apiData.strike.filter( element => element.location === "North Waziristan" ).map( element => element.town )

console.log(results)