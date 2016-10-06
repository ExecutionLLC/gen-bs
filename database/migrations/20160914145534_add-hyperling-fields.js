
function createHyperlinkColumns(knex, Promise) {
    console.log('=> Adding hyperlink fields');
    return knex.schema
        .table('field_metadata',(table) => {
            table.boolean('is_hyperlink')
                .defaultTo(false);
            table.text('hyperlink_template');
        })
}

exports.up = function(knex, Promise) {
    console.log('Adding hyperlinks support');
    return createHyperlinkColumns(knex, Promise)
        .then(() => console.log('=> Complete.'));
};

exports.down = function(knex, Promise) {
    throw new Error('Not implemented');
};
