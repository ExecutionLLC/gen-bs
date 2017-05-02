const RUSSION_ID = 'ru';

exports.up = function(knex) {
    return knex('language')
        .where('id', RUSSION_ID)
        .del();
};

exports.down = function() {
    throw new Error('Not implemented');
};
