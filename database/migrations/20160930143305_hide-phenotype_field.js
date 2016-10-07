const _ = require('lodash');
const editableFields = require('../defaults/templates/metadata/editable-metadata.json');

function hidePhenotypeField(knex, Promise) {
    console.log('=> Hide phenotype field');
    const phenotypeField = _.find(editableFields, {name:'PHENOTYPE'});
    return knex('field_metadata')
        .where('id', phenotypeField.id)
        .update({
            is_invisible: true
        });
}

exports.up = function(knex, Promise) {
    console.log('Hiding phenotype field');
    return hidePhenotypeField(knex, Promise)
        .then(() => console.log('=> Complete.'));
};

exports.down = function(knex, Promise) {
    throw new Error('Not implemented');
};