const ChangeCaseUtil  = require('./utils/ChangeCaseUtil');
const {LOGIN_TYPES} = require('./utils/Enums');

exports.up = function(knex) {
    return updateGoogleUsers(knex);
};

exports.down = function(knex, Promise) {
  
};

function updateGoogleUsers(knex) {
    return knex('user')
        .whereNull('login_type')
        .update(ChangeCaseUtil.convertKeysToSnakeCase({
            loginType: LOGIN_TYPES.GOOGLE
        }));
}
