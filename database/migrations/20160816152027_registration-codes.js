// See the issue for more information: https://github.com/ExecutionLLC/gen-bs/issues/459
exports.up = function(knex, Promise) {
    return knex.createTable('registration_code', (table) => {
        table.uuid('id')
            .primary();
        table.text('description');
        table.boolean('is_activated');
        table.timestamp('activated_timestamp')
            .defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('registration_code');
};
