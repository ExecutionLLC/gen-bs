'use strict';

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
    .filter((x) => ['.bin'].indexOf(x) === -1)
    .forEach((mod) => {
        nodeModules[mod] = 'commonjs ' + mod;
    });

console.log('Externals: ' + JSON.stringify(nodeModules, null, 2));

module.exports = {
    devtool: '#eval',
    entry: [
        './index.js'
    ],
    target: 'node',
    output: {
        path: path.join(__dirname, 'public'),
        filename: 'webserver.js'
    },
    loaders: {
        test: /\.js?$/,
        exclude: /(node_modules|bower_components|vendor)/,
        loaders: ['babel-loader'],
        plugins: ['transform-runtime']
    },
    externals: nodeModules
};
