const fs = require('fs');
const path = require('path');
const NodeOptimize = require('node-optimize');
const args = require('optimist').argv;

const PACKAGE_ROOT = '../..';

const outFilePath = args.out;
if (!outFilePath) {
    throw new Error('Output file path is not set, use --out.');
}

const optimizer = new NodeOptimize({
    ignore: [
        PACKAGE_ROOT + '/utils/Config.js'
    ]
});

var mergedJs = optimizer.merge(PACKAGE_ROOT + '/index.js');
fs.writeFile(path.resolve(outFilePath), mergedJs);
