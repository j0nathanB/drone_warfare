var express = require('express')
var app = express();
var bodyParser = require('body-parser');
var axios = require('axios');
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/../react-client/dist'));

app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.listen(PORT, function () {
  console.log(`Example app listening on port ${PORT}!`)
});

//scrape the DroneStream API
app.get('/scrape', (req, res) => {
  let apiEntryKeys = {};

  axios.get('http://api.dronestre.am/data')
  .then( (response) => {
    response.data.strike.map( (strike) => {
      let entry = Object.keys(strike)

      entry.forEach( key => apiEntryKeys[key] = key );
    })
    for (let key in apiEntryKeys) {
      console.log(key)
    }
    res.end(JSON.stringify(apiEntryKeys));
  
  })
  .catch( error => console.log('Error: ' + error)) ;
})