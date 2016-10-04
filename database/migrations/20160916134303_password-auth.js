
exports.up = function(knex, Promise) {
    return knex.schema.createTable('user_password', (table) => {
        table.uuid('user_id')
            .references('id')
            .inTable('user');
        table.string('login', 256);
        table.string('password_hash', 256);
    });
};

exports.down = function(knex, Promise) {
    throw new Error('Downgrade is not supported.');
};
