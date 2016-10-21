exports.up = function(knex, Promise) {
    return knex.schema.dropTable('registration_code');
};

exports.down = function(knex, Promise) {
    throw new Error('Cannot unremove registration_code table');
};
