
exports.up = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) => {
            table.string('gender', 255);
        })
        .table('user_request', (table) => {
            table.string('gender', 255);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) => {
            table.dropColumn('gender');
        })
        .table('user_request', (table) => {
            table.dropColumn('gender');
        });
};
