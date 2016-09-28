
exports.up = function(knex, Promise) {
    return knex.schema.createTable('user_request', (table) => {
        table.uuid('id')
            .primary();
        table.string('email', 256)
            .defaultTo(null);
        table.string('first_name', 255);
        table.string('last_name', 255);
        table.string('speciality');
        table.string('telephone', 255);
        table.string('company', 255);
        table.string('login_type', 255);
        table.string('password', 255);
        table.boolean('is_activated');
        table.timestamp('activated_timestamp');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('user_request');
};
