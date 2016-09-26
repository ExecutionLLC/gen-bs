
exports.up = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) => {
            table.string('first_name', 255);
            table.string('last_name', 255);
        })
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) => {
            table.dropColumn('first_name');
            table.dropColumn('last_name');
        })
};
