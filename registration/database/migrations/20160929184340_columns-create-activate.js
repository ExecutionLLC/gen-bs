
exports.up = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) => {
            table.dropColumn('activated_timestamp');
        })
        .table('registration_code', (table) => {
            table.timestamp('created_timestamp')
                .defaultTo(knex.fn.now());
            table.timestamp('activated_timestamp')
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) => {
            table.dropColumn('created_timestamp');
            table.dropColumn('activated_timestamp');
        })
        .table('registration_code', (table) => {
            table.timestamp('activated_timestamp')
                .defaultTo(knex.fn.now());
        });
};
