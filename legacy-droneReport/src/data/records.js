var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('success!')
});

var Schema = mongoose.Schema;

var reportSchema = new Schema({
  _id: String,
  number: Number,
  country: String,
  date: String,
  narrative: String,
  town: String,
  location: String,
  deaths: String, 
  deaths_min: String, 
  deaths_max: String,
  civilians: String,
  injuries: String,
  children: String,
  tweet_id: String,
  bureau_id: String,
  bij_summary_short: String,
  bij_link: String,
  target: String,
  lat: String,
  lon: String,
  articles: [String],
  names: [String]
});

var Records = mongoose.model('Report', reportSchema);

module.exports = Records;