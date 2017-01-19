exports.up = function (knex) {
    return editFilterLanguageNotNullConstrains(knex)
        .then(() => editModelLanguageNotNullConstrains(knex));
};

exports.down = function () {
    throw new Error('Not implemented');
};

function editFilterLanguageNotNullConstrains(knex) {
    console.log('=> Update filter language constrains...');
    return knex.schema
        .table('filter_text', table => {
            table.dropPrimary('filter_text_pkey')
        })
        .then(() => knex.raw('ALTER TABLE filter_text ALTER COLUMN language_id DROP NOT NULL'))
        .then(() => knex.schema
            .table('filter_text', table => {
                table.unique(['filter_id', 'language_id']);
            })
        );
}

function editModelLanguageNotNullConstrains(knex) {
    console.log('=> Update model language constrains...');
    return knex.schema
        .table('model_text', table => {
            table.dropPrimary('model_text_pkey')
        })
        .then(() => knex.raw('ALTER TABLE model_text ALTER COLUMN language_id DROP NOT NULL'))
        .then(() => knex.schema
            .table('model_text', table => {
                table.unique(['model_id', 'language_id']);
            })
        );
}