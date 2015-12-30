import 'babel-polyfill'
import 'jszip'


const $ = require('jquery');
const JSZip = require('jszip');
window.JSZip = JSZip;
window.jQuery = $;
window.$ = $;

import './assets/vendor/jQuery-QueryBuilder/dist/css/query-builder.default.min.css';
import './assets/css/bootstrap/js/bootstrap.js';
import './assets/vendor/select2-4.0.1-rc.1/dist/js/select2.full.min.js';

import './assets/vendor/matchMedia/matchMedia.js';
import './assets/vendor/matchMedia/matchMedia.addListener.js';

import './assets/vendor/jquery-localize/dist/jquery.localize.js';


import './assets/css/index.less';

import './components/VariantsTable/VariantsTable';

import './components/Old/old';
import './components/localize/jquerylocalize.js';



