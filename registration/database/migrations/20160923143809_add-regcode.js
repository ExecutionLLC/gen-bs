
exports.up = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) =>
            table.string('regcode', 8)
        )
        .table('user_info', (table) =>
            table.dropColumn('regcode')
        )
        .table('user_info', (table) =>
           table.string('regcode', 8)
        );
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) =>
            table.dropColumn('regcode')
        )
        .table('user_info', (table) =>
            table.dropColumn('regcode')
        )
        .table('user_info', (table) =>
            table.uuid('regcode')
        );
};
