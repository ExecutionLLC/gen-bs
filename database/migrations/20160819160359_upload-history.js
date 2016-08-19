exports.up = function (knex, Promise) {
    return knex.schema.createTable('sample_upload_history', (table) => {
        table.uuid('id')
            .primary();
        table.uuid('user_id')
            .notNullable()
            .references('id')
            .inTable('user');
        table.uuid('sample_id')
            .notNullable();
        table.string('file_name', 256)
            .notNullable();
        table.boolean('is_active')
            .defaultTo(true);
        table.json('last_status_message');
        table.timestamp('created')
            .defaultTo(knex.fn.now());
    });
};

exports.down = function (knex, Promise) {
    return Promise.reject(new Error('Not implemented'));
};
