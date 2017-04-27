const {SAMPLE_UPLOAD_STATUS} = require('./utils/Enums');

exports.up = function (knex, Promise) {
    return knex.schema.createTable('sample_upload_history', (table) => {
        table.uuid('id')
            .primary();
        table.uuid('user_id')
            .notNullable()
            .references('id')
            .inTable('user');
        // Sample id should not be constrained by the 'vcf_file_sample' table,
        // as the corresponding sample entry is not yet created.
        table.uuid('sample_id')
            .notNullable();
        table.string('file_name', 256)
            .notNullable();
        table.enu('status', [
            SAMPLE_UPLOAD_STATUS.IN_PROGRESS,
            SAMPLE_UPLOAD_STATUS.READY,
            SAMPLE_UPLOAD_STATUS.ERROR
        ])
            .notNullable();
        table.integer('progress')
            .notNullable();
        table.json('error')
            .defaultTo(null);
        table.boolean('is_deleted')
            .defaultTo(false);
        table.timestamp('created')
            .defaultTo(knex.fn.now());
    });
};

exports.down = function (knex, Promise) {
    return Promise.reject(new Error('Not implemented'));
};
