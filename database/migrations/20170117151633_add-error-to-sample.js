
const uploadStateEnumValues = [
    'unconfirmed',  // the sample was created after header parsing on WS
    'not_found',    // the sample was not found during parsing on AS
    'completed',    // the sample was successfully parsed on AS
    'error'         // an error has occurred while parsing the file with this sample.
];

exports.up = function(knex) {
    console.log('Adding upload_state and error for samples');
    return addColumns(knex)
        .then(() => updateNewColumns(knex));
};

function addColumns(knex) {
    return knex.schema
        .alterTable('sample', (table) => {
            table.enu('upload_state', uploadStateEnumValues);
            table.string('error');
        }).then(() => console.log(`=> Add columns 'upload_state' and 'error' to 'sample' table...OK`));
}

function updateNewColumns(knex) {
    return knex('sample')
        .update({'upload_state': 'completed'})
        .then((cnt) => console.log(`=> Update ${cnt} records in 'sample' table...OK`));
}

exports.down = function() {
    throw new Error('Not implemented');
};
