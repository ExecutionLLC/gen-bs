
function hidePhenotypeField(knex, Promise) {
    console.log('=> Hide phenotype field');
    return knex('field_metadata')
        .where('name', 'PHENOTYPE')
        .update({
            is_invisible: true
        });
}

exports.up = function(knex, Promise) {
    return hidePhenotypeField(knex, Promise)
        .then(() => console.log('=> Complete.'));
};

exports.down = function(knex, Promise) {
    throw new Error('Not implemented');
};