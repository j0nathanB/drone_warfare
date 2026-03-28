const data = require('../data/normalized.js');
let features = data.features;
const fs = require('fs');
let csvData = 
`Latitude,Longitude,town,country,strikes,deaths,injuries,civilians,children,photo_height,photo_reference,photo_width,photo_attribution\n`;
let entry = '';
var wstream = fs.createWriteStream('normalized_data.csv');

wstream.write(csvData);

for (let i = 0; i < features.length; i++) {
  let geo = `${features[i].geometry.coordinates[1]},${features[i].geometry.coordinates[0]},`
  let props = '';
  let googPics = features[i].properties.photos[0];
  let metaData = '';

  if (googPics) {
    let attribString = `"${googPics.html_attributions[0].replace(/"/g, '""')}"`
    let attributions = `${attribString}`;
    
    for(let key in googPics) {
      if (key !== 'html_attributions') {
        metaData += `${googPics[key]},`
      } 
    }

    metaData += attributions;        
  } else {
    metaData = `""`;
  }

  for (let key in features[i].properties){
    if (key != 'photos'){
      props += `${features[i].properties[key]},`;
    } 
  }

  entry += geo + props + metaData + '\n';
  wstream.write(entry);
  entry = ''
}
wstream.end();
//fs.writeFile('normalized_data.csv', csvData + entries, 'utf8', err => console.log(`Error! ${err}`));

//console.log(csvData)
