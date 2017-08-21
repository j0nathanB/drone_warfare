let apiData = require ('./data/apiData.js');

// Get results from normalized API data
// let results = apiData.strike.map( element =>
//   isNaN(element.deaths_min) && element.deaths_min.includes("-") ? 
//     {strikeNo:element.number, deaths_min:Number(element.deaths_min.split("-", 1))} :
//     {strikeNo:element.number, deaths_min:Number(element.deaths_min)}
// )
//  .filter( a => !isNaN(a.deaths_min) ).reduce( (a,b) => a.deaths_min > b.deaths_min ? a : b )

// let normalize = (data) => {
//   let normalized = Number(data);
//   if (!isNaN(normalized)) {
//     return normalized;
//   } else {
//     return isNaN(normalized) && data.includes("-") ? Number(data.split("-", 1)) : 0;
//   }
// }

// Find most attacked cities
// let sorted = apiData.strike.map( element => { return {town: element.town, deaths: element.deaths_min, children: element.children, civs: element.civilians} });

// let results = (array) => {
//   let result = {};

//   for (let i = 0; i < array.length; i++) {
//     if(!result.hasOwnProperty(array[i].town)){
//       result[array[i].town] = {count: 1, deaths: normalize(array[i].deaths), children: normalize(array[i].children), civilians: normalize(array[i].civs)};
//     } else {
//       result[array[i].town].count++;
//       result[array[i].town].deaths+= normalize(array[i].deaths);
//       result[array[i].town].children+= normalize(array[i].children);
//       result[array[i].town].civilians+= normalize(array[i].civs);
//     }
//   }

//   return result;
// };

// let strikedCities = () => {
//   let cities = results(sorted);
//   let array = [];

//   for (let key in cities){
//     array.push([key, cities[key].count, cities[key].deaths, cities[key].children, cities[key].civilians])
//   }
  
//   return array.sort( (a,b) => b[1] - a[1] );
// }
//let results2 = apiData.strike.filter( element => element.number === 8 )

console.log(apiData.strike.filter(element => element.town === "Datta Khel"))