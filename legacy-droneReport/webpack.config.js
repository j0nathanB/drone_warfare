var webpack = require('webpack');
var path = require('path');
var SRC_DIR = path.join(__dirname, 'react-client/src');
var DIST_DIR = path.join(__dirname, 'react-client/dist');

module.exports = {  
  entry: `${SRC_DIR}/index.jsx`,
  output: {
    filename: 'bundle.js',
    path: DIST_DIR
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/, 
        query: {
          presets: ['react', 'es2015']
        }
      }
    ]
  }
};