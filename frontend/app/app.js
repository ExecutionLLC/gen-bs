import 'babel-polyfill'
import 'jszip'


require('file?name=index.html!./index.html');
const JSZip = require('jszip');
window.JSZip = JSZip;

import './assets/css/bootstrap/js/bootstrap.js';
import './assets/vendor/select2-4.0.1-rc.1/dist/js/select2.full.min.js';

import './assets/vendor/matchMedia/matchMedia.js';
import './assets/vendor/matchMedia/matchMedia.addListener.js';

import './assets/vendor/jquery-localize/dist/jquery.localize.js';

require('file?name=[path][name].[ext]&context=./app'
    + '!./assets/vendor/jQuery-QueryBuilder/dist/js/genomics-query-builder.standalone.js');
require('file?name=[path][name].[ext]&context=./app'
    + '!./assets/vendor/font-awesome/css/font-awesome.min.css');

import React from 'react'
import { render } from 'react-dom'
import Root from './containers/Root'

import gzip from './utils/gzip'
window.gzip = gzip;
import './assets/css/index.less';

render(
    <Root />,
    document.getElementById('root')
);
