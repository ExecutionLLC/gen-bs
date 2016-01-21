'use strict';

var webpack = require("webpack");
var path = require("path");

var node_dir = __dirname + '/node_modules';
var vendor_dir = __dirname + '/vendor';
var bundle_dir = __dirname + '/build';
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HandlebarsPlugin = require("handlebars-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');



module.exports = {

  devtool: "#eval",

  entry: [
    'webpack/hot/dev-server',
    "./app/app.js"],



  output: {
    path: path.resolve(__dirname, '../public'),
    filename: 'genomics.js'

  },
  module: {
    loaders: [
      {test: /\.json$/, loader: "file?name=[name].[ext]"},
      {
        test: /\.js?$/,
        exclude: /(node_modules|bower_components|vendor)/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      },
      { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },

      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&mimetype=application/font-woff" },
      { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&mimetype=application/font-woff" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=application/octet-stream" },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "file?name=[name].[ext]" },

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
    extensions: ['', '.js', '.jsx','.css', 'less']
  },
  
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ExtractTextPlugin("genomics.css", {
      allChunks: true
    }),

    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        "window.jQuery": "jquery",
        _: "lodash"
    }),

    new webpack.DefinePlugin({
      API_PORT: JSON.stringify(8080),
      API_HOST: JSON.stringify('ec2-52-91-59-42.compute-1.amazonaws.com'),
      //API_PORT: JSON.stringify(8888),
      //API_HOST: JSON.stringify('localhost'),
    })

  ]


};
