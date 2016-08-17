// See the issue for more information: https://github.com/ExecutionLLC/gen-bs/issues/459
exports.up = function (knex, Promise) {
    return knex.schema.createTable('registration_code', (table) => {
        table.uuid('id')
            .primary();
        table.text('description');
        table.string('speciality');
        table.string('language');
        table.integer('number_of_paid_samples');
        table.string('email', 256)
            .defaultTo(null);
        table.boolean('is_activated');
        table.timestamp('activated_timestamp')
            .defaultTo(knex.fn.now());
    })
    // Extend the email field to the maximum email address length
    // http://www.rfc-editor.org/errata_search.php?rfc=3696&eid=1690
        .raw('ALTER TABLE "user" ALTER COLUMN email TYPE varchar(256)');
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('registration_code');
};
