exports.up = function(knex, Promise) {
    console.log('Making all emails lower case');
    return knex.raw('update "user" set email = trim(both from lower(email))');
};

exports.down = function(knex, Promise) {
    throw new Error('Not implemented.')
};
