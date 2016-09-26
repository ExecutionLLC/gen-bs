
exports.up = function(knex, Promise) {
    return knex.schema.dropTable('user_info');
};

exports.down = function(knex, Promise) {
    throw new Error('Can not restore user_info table');
};
