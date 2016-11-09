exports.up = function (knex, Promise) {
    return knex.schema
        .createTable('user_event', (table) => {
            table.uuid('id')
                .primary();
            table.string('type', 50)
                .notNullable();
            table.timestamp('timestamp')
                .defaultTo(knex.fn.now());
            table.uuid('creator')
                .references('id')
                .inTable('user');
        })
};

exports.down = function (knex, Promise) {
    throw new Error('Not implemented');
};