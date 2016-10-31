const addNewSamplesToDatabase = require('./20161005115436_default-samples-update').addNewSamplesToDatabase;
const path = require('path');
const sampleDir = '20161019140444_add-default-samples';
const defaultsDir = path.join(__dirname, sampleDir);

exports.up = function (knex) {
    console.log('Default Samples Add Proband, Mother, Father:');
    // Mark old default samples as deleted.
    return addNewSamplesToDatabase(knex,defaultsDir);
};

exports.down = function () {
    throw new Error('Not implemented');
};
