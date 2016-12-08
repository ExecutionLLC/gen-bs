import 'babel-polyfill';
import 'jszip';

require('file?name=index.html!./index.html');
const JSZip = require('jszip');
window.JSZip = JSZip;

require('file?name=[path][name].[ext]&context=./app'
    + '!./assets/vendor/jQuery-QueryBuilder/js/genomics-query-builder.standalone.js');

import React from 'react';
import { render } from 'react-dom';
import Root from './containers/Root';

import gzip from './utils/gzip';
window.gzip = gzip;
import './assets/css/index.less';

render(
    <Root />,
    document.getElementById('root')
);
