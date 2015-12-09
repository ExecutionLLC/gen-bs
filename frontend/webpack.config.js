'use strict';

var webpack = require("webpack");
var path = require("path");

//var bower_dir = __dirname + '/bower_components';
var node_dir = __dirname + '/node_modules';
var vendor_dir = __dirname + '/vendor';
var bundle_dir = __dirname + '/build';
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HandlebarsPlugin = require("handlebars-webpack-plugin");



module.exports = {

  devtool: "#eval",

  entry: [
    'webpack/hot/dev-server',
    "./app/app.js"],



  output: {
    path: path.resolve(__dirname, '../public'),
    filename: 'genomics.js',
    //publicPath: 'http://localhost:8080/assets'

  },
  module: {
    loaders: [
      { test: /\.hbs/, loader: "handlebars-template-loader" },
      {test: /\.html$/, loader: "file?name=[name].[ext]"},
      {test: /\.json$/, loader: "file?name=[name].[ext]"},
        
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
      //{ test: /\.js?$/, exclude: /node_modules|bower_components/, loaders: ['react-hot', 'jsx', 'babel?stage=0'] },
      {
        test: /\.js?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
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
      },

      //{ test: /\.js$/, loader: 'expose?$' },
      //{ test: /\.js$/, loader: 'expose?jQuery' }
    ]
  },

  resolve: {
    extensions: ['', '.js', '.jsx','.css', 'less']
  },
  
  //resolve: {
  //  alias: {
  //    'bootstrap-table': node_dir + '/bootstrap-table/dist/bootstrap-table.js',
  //  }
  //},

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ExtractTextPlugin("genomics.css", {
      allChunks: true
    }),

    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        "window.jQuery": "jquery"
    }),

    new webpack.DefinePlugin({
      API_URL: JSON.stringify("http://localhost:8000"),
      DP_API_URL: JSON.stringify("http://localhost:3001")
    }),

    new HandlebarsPlugin({
      // path to main hbs template
      entry: path.join(process.cwd(), "app", "index.hbs"),
      // filepath to result
      output: path.join(process.cwd(), "index.html"),

      // data passed to main hbs template: `main-template(data)`
      //data: require("./app/data/project.json"),

      // globbed path to partials, where folder/filename is unique
      partials: [
          path.join(process.cwd(), "app", "templates", "*", "*.hbs")
      ],

      // register custom helpers
      //helpers: {
      //    nameOfHbsHelper: Function.prototype,
      //    path.join(process.cwd(), "app", "helpers", "*.helper.js")
      //},

      // hooks
      onBeforeSetup: function (Handlebars) {},
      onBeforeAddPartials: function (Handlebars, partialsMap) {},
      onBeforeCompile: function (Handlebars, templateContent) {},
      onBeforeRender: function (Handlebars, data) {},
      onBeforeSave: function (Handlebars, resultHtml) {},
      onDone: function (Handlebars) {}
    })

  ]


};
