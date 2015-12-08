'use strict';

var webpack = require("webpack");

//var bower_dir = __dirname + '/bower_components';
var node_dir = __dirname + '/node_modules';
var vendor_dir = __dirname + '/vendor';
var bundle_dir = __dirname + '/build';
var ExtractTextPlugin = require("extract-text-webpack-plugin");


module.exports = {

  devtool: "#eval",

  entry: [
    'webpack/hot/dev-server',
    "./app/app.js"],



  output: {
    //path: bundle_dir,
    filename: 'bundle.js',
    //publicPath: '/assets/css/'

  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
      //{ test: /\.js?$/, exclude: /node_modules|bower_components/, loaders: ['react-hot', 'jsx', 'babel?stage=0'] },
      { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },

      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&mimetype=application/font-woff" },
      { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&mimetype=application/font-woff" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=application/octet-stream" },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=image/svg+xml" },

      { test: /\.png$/, loader: "url-loader?limit=100000" },
      { test: /\.jpg$/, loader: "file-loader" },
      { test: /\.gif$/, loader: "url-loader?mimetype=image/png" },

      // Extract css files
      {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader")
      },
      {
          test: /\.less$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
      }
    ]
  },
resolve: {
        extensions: ['', '.js', '.jsx','.css']
    },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ExtractTextPlugin("app.css", {
      allChunks: true
    }),

    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        "window.jQuery": "jquery",
    }),

    new webpack.DefinePlugin({
      API_URL: JSON.stringify("http://localhost:8000"),
      DP_API_URL: JSON.stringify("http://localhost:3001")
    }),

  ]


};
