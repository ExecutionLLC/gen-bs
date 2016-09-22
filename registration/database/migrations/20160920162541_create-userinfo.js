
exports.up = function(knex, Promise) {
    return knex.schema.createTable('user_info', (table) => {
        table.uuid('id')
            .primary();
        table.uuid('regcode');
        table.string('email', 256)
            .defaultTo(null);
        table.string('first_name');
        table.string('last_name');
        table.string('speciality');
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('user_info');
};
