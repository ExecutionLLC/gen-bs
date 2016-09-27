
exports.up = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) => {
            table.string('telephone', 255);
            table.string('company', 255);
            table.dateTime('first_date');
            table.dateTime('last_date');
        })
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('registration_code', (table) => {
            table.dropColumn('telephone');
            table.dropColumn('company');
            table.dropColumn('first_date');
            table.dropColumn('last_date');
        })
};
