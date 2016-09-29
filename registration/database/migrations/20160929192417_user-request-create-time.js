
exports.up = function(knex, Promise) {
    return knex.schema
        .table('user_request', (table) => {
            table.dropColumn('activated_timestamp');
        })
        .table('user_request', (table) => {
            table.timestamp('activated_timestamp');
            table.timestamp('created_timestamp')
                .defaultTo(knex.fn.now());
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('user_request', (table) => {
            table.dropColumn('created_timestamp');
            table.dropColumn('activated_timestamp');
        })
        .table('user_request', (table) => {
            table.timestamp('activated_timestamp')
                .defaultTo(knex.fn.now());
        });
};
