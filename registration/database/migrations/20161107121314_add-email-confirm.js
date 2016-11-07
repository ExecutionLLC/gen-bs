
exports.up = function(knex, Promise) {
    return knex.schema
        .table('user_request',(table) => {
            table.uuid('email_confirm_uuid');
            table.timestamp('email_confirm_send_timestamp');
            table.boolean('email_confirmed');
            table.timestamp('email_confirmed_timestamp');
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('user_request', (table) => {
            table.dropColumn('email_confirm_uuid');
            table.dropColumn('email_confirm_send_timestamp');
            table.dropColumn('email_confirmed');
            table.dropColumn('email_confirmed_timestamp');
        })
};
