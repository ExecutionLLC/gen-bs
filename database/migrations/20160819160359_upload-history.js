exports.up = function (knex, Promise) {
    return knex.schema.createTable('sample_upload_history', (table) => {
        table.uuid('id')
            .primary();
        table.uuid('user_id')
            .notNullable()
            .references('id')
            .inTable('user');
        // Sample name should not be constrained by the 'vcf_file_sample' table,
        // as the sample is not yet created.
        table.uuid('sample_id')
            .notNullable();
        table.string('file_name', 256)
            .notNullable();
        table.boolean('is_active')
            .defaultTo(true);
        table.boolean('is_deleted')
            .defaultTo(false);
        table.json('last_status_message');
        table.timestamp('created')
            .defaultTo(knex.fn.now());
    });
};

exports.down = function (knex, Promise) {
    return Promise.reject(new Error('Not implemented'));
};
