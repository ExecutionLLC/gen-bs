'use strict';

const lodash = require('lodash');
const USER_METADATA = require('../test_data/user_metadata.json');

class UserService {
  constructor() {
    this.users = [
        USER_METADATA
    ];
  }

  findByToken(userToken, callback) {
    if (userToken === '123') {
      // TODO: Simulate error.
      callback(new Error('Something happened in DB.'));
    } else {
      const user = this.users[0];
      callback(null, user);
    }
  }
}

module.exports = UserService;
