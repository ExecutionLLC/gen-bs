import 'babel-polyfill'
import 'jszip'


//const $ = require('jquery');
const JSZip = require('jszip');
window.JSZip = JSZip;
//window.jQuery = $;
//window.$ = $;

import './assets/css/bootstrap/js/bootstrap.js';
import './assets/vendor/select2-4.0.1-rc.1/dist/js/select2.full.min.js';

import './assets/vendor/matchMedia/matchMedia.js';
import './assets/vendor/matchMedia/matchMedia.addListener.js';

import './assets/vendor/jquery-localize/dist/jquery.localize.js';


import './components/localize/jquerylocalize.js';


import React from 'react'
import { render } from 'react-dom'
import Root from './containers/Root'

import gzip from './utils/gzip'
window.gzip = gzip
import './assets/css/index.less';

render(
    <Root />,
    document.getElementById('root')
)
