const CHINESE_ID = 'zh';

exports.up = function(knex, Promise) {
    return knex('language')
        .where('id', CHINESE_ID)
        .del();
};

exports.down = function() {
    throw new Error('Not implemented');
};
