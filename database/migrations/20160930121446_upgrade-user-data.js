
exports.up = function(knex, Promise) {
    return knex.schema
        .dropTable('user_password')
        .table('user',(table) => {
            table.unique('email');
            table.string('gender');
            table.string('phone');
            table.string('login_type');
            table.string('password');
        })
        .table('user_text', (table) => {
            table.renameColumn('name', 'first_name');
            table.string('company');
        });
};

exports.down = function(knex, Promise) {
    throw new Error('Cannot unremove user_password table');
};
