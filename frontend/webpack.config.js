'use strict';

const webpack = require('webpack');
const path = require('path');
const colors = require('colors/safe');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const ENV = process.env;

function makeDefault(value, defaultValue) {
    if (value === undefined) {
        return defaultValue;
    }

    if (typeof defaultValue === 'boolean') {
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error(`Unexpected environment variable value: ${value}`);
            return value;
        }
    }
    return value;
}

// Default values are set in the package.json.
// These values are fallback values in case
// webpack is running directly, without npm run scripts.
const API_HOST = makeDefault(ENV.GEN_FRONTEND_API_HOST, 'localhost');
const API_PORT = makeDefault(ENV.GEN_FRONTEND_API_PORT, 5000);
const USE_SECURE_CONNECTION = makeDefault(ENV.GEN_FRONTEND_USE_SECURE_CONNECTION, false);
const LOGIN_CALLBACK_PORT = makeDefault(ENV.GEN_FRONTEND_LOGIN_CALLBACK_PORT, 8080);
const ALLOW_GOOGLE_LOGIN = makeDefault(ENV.GEN_FRONTEND_ALLOW_GOOGLE_LOGIN, true);
// All timeouts measured in seconds
const SESSION_KEEP_ALIVE_TIMEOUT = makeDefault(ENV.GEN_FRONTEND_SESSION_KEEP_ALIVE_TIMEOUT, 30);
const SESSION_LOGOUT_TIMEOUT = makeDefault(ENV.GEN_FRONTEND_SESSION_LOGOUT_TIMEOUT, 30*60);
const SESSION_LOGOUT_WARNING_TIMEOUT = makeDefault(ENV.GEN_FRONTEND_SESSION_LOGOUT_WARNING_TIMEOUT, 15);
const HEADER_SESSION = makeDefault(ENV.GEN_FRONTEND_HEADER_SESSION, 'X-Session-Id');
const HEADER_LANGUAGE = makeDefault(ENV.GEN_FRONTEND_HEADER_LANGUAGE, 'X-Language-Id');

const isProductionBuild = ENV.NODE_ENV === 'production';

console.log(colors.bold('-> API host:         ', API_HOST));
console.log(colors.bold('-> API port:         ', API_PORT));
console.log(colors.bold('-> Secure?           ', USE_SECURE_CONNECTION));
console.log(colors.bold('-> Production build? ', isProductionBuild));
console.log('');

const devtool = isProductionBuild ? '#cheap-module-source-map' : '#eval';

let entry = [
    'babel-polyfill',
    './app/app.js'
];
if (!isProductionBuild) {
    entry = ['webpack-hot-middleware/client', ...entry];
}

module.exports = {

    devtool,

    entry,

    output: {
        path: path.resolve(__dirname, '../public'),
        filename: 'genomics.js'
    },
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                loaders: ['eslint'],
                include: [
                    path.resolve(__dirname, 'app'),
                    path.resolve(__dirname, 'config')
                ],
                exclude: [
                    path.resolve(__dirname, 'app/assets')
                ]
            }
        ],
        loaders: [
            {test: /\.json$/, loader: 'file?name=[name].[ext]'},
            {
                test: /\.js?$/,
                exclude: /(node_modules|bower_components|vendor)/,
                loaders: isProductionBuild ? ['babel-loader'] : ['react-hot', 'babel-loader'],
                plugins: isProductionBuild ? [] : ['transform-runtime']
            },
            {test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery'},

            {test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?name=[name].[ext]&limit=10000&mimetype=application/font-woff'},
            {test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?name=[name].[ext]&limit=10000&mimetype=application/font-woff'},
            {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?name=[name].[ext]&limit=10000&mimetype=application/octet-stream'},
            {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file?name=[name].[ext]'},
            {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'file?name=[name].[ext]'},

            {test: /\.png$/, loader: 'url-loader?limit=100000'},
            {test: /\.jpg$/, loader: 'file-loader'},
            {test: /\.gif$/, loader: 'url-loader?mimetype=image/png'},

            // Extract css files
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader')
            }
        ]
    },

    resolve: {
        extensions: ['', '.js', '.jsx', '.css', 'less']
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        // Cleanup target folder.
        new CleanWebpackPlugin(['public'], {
            root: __dirname + '/../',
            verbose: true,
            dry: false
        }),
        new ExtractTextPlugin('genomics.css', {
            allChunks: true
        }),

        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            _: 'lodash'
        }),

        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(ENV.NODE_ENV || null)
            },
            API_PORT: JSON.stringify(API_PORT),
            API_HOST: JSON.stringify(API_HOST),
            USE_SECURE_CONNECTION: JSON.stringify(USE_SECURE_CONNECTION),
            LOGIN_CALLBACK_PORT: JSON.stringify(LOGIN_CALLBACK_PORT),
            ALLOW_GOOGLE_LOGIN: JSON.stringify(ALLOW_GOOGLE_LOGIN),
            HEADER_SESSION: JSON.stringify(HEADER_SESSION),
            HEADER_LANGUAGE: JSON.stringify(HEADER_LANGUAGE),
            SESSION_KEEP_ALIVE_TIMEOUT: JSON.stringify(SESSION_KEEP_ALIVE_TIMEOUT),
            SESSION_LOGOUT_TIMEOUT: JSON.stringify(SESSION_LOGOUT_TIMEOUT),
            SESSION_LOGOUT_WARNING_TIMEOUT: JSON.stringify(SESSION_LOGOUT_WARNING_TIMEOUT)
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: false,
            minimize: true,
            output: {
                comments: false
            },
            compress: true,
            mangle: {
                except: []
            }
        }),
        new webpack.optimize.DedupePlugin()
    ]
};
