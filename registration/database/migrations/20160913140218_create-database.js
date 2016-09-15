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
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('registration_code');
};
