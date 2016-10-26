
exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('registration_code', (table) => {
            table.uuid('id')
                .primary();
            table.string('regcode', 8);
            table.text('description');
            table.string('language', 2);
            table.string('first_name', 256);
            table.string('last_name', 256);
            table.string('gender', 256);
            table.string('speciality', 256);
            table.string('company', 256);
            table.string('email', 256)
                .defaultTo(null);
            table.string('telephone', 256);
            table.integer('number_of_paid_samples');

            table.timestamp('first_date');
            table.timestamp('last_date');

            table.boolean('is_activated');
            table.timestamp('activated_timestamp');
            table.timestamp('created_timestamp')
                .defaultTo(knex.fn.now());
        })
        .createTable('user_request', (table) => {
            table.uuid('id')
                .primary();
            table.string('first_name', 256);
            table.string('last_name', 256);
            table.string('gender', 256);
            table.string('speciality', 256);
            table.string('company', 256);
            table.string('email', 256)
                .defaultTo(null);
            table.string('telephone', 256);

            table.string('login_type', 256);
            table.string('password', 256);

            table.boolean('is_activated');
            table.timestamp('activated_timestamp');
            table.timestamp('created_timestamp')
                .defaultTo(knex.fn.now());
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('registration_code')
        .dropTable('user_request');
};
