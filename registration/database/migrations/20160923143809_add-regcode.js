
exports.up = function(knex, Promise) {
    return knex.schema.table('registration_code', (table) =>
        table.string('regcode', 8)
    );

};

exports.down = function(knex, Promise) {
    return knex.schema.table('registration_code', (table) =>
        table.dropColumn('regcode')
    );
};
