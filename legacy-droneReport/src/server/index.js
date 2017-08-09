var express = require('express')
var app = express();
var bodyParser = require('body-parser');
var axios = require('axios')

app.use( bodyParser.urlencoded({
  extended: false
}))

app.use( bodyParser.json() );

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.get('/test', function (req, res) {
  res.end('ended');
});

app.get('/users/:user', function (req, res) {
  res.end('this is data for user: ' + req.params.user);
});

app.post('/test', function (req, res) {
  console.log('req.body', req.body.one );
  res.end('posted');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

//scrape the DroneStream API
app.get('/scrape', (req, res) => {
  let apiEntryKeys = {};

  axios.get('http://api.dronestre.am/data')
  .then( (response) => {
    response.data.strike.map( (strike) => {
      let entry = Object.keys(strike)

      entry.forEach( key => apiEntryKeys[key] = key );
    //apiEntryKeys.forEach(  )
    })
    for (let key in apiEntryKeys) {
      console.log(key)
    }
    res.end(JSON.stringify(apiEntryKeys));
  
  })
  .catch( error => console.log('Error: ' + error)) ;
})