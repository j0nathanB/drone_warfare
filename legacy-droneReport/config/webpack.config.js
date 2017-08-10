var path = require('path');
var SRC_DIR = path.join(__dirname, '/react-client/src');
var DIST_DIR = path.join(__dirname, '/react-client/dist');

module.exports = {  
  entry: `${SRC_DIR}/index.jsx`,
  output: {
    filename: 'bundle.js',
    path: DIST_DIR
  },

  module: {
    loaders: [
      {
        test: /src\/.+.js$/,
        include: SRC_DIR,
        exclude: /node_modules/,
        loader: 'babel-loader', 
        query: {
          presets: ['react', 'es2015']
        }
      }
    ]
  }
};