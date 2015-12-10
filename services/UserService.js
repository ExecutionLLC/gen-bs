'use strict';

class UserService {
  constructor() {
    this.users = {
      1: {
        firstName: 'Vasya',
        lastName: 'Pupkin'
      },
      2: {
        firstName: 'Vanya',
        lastName: 'Pupkin'
      }
    };
  }

  findById(userId, callback) {
    if (userId === 3) {
      // TODO: Simulate error.
      callback(new Error('Something happened in DB.'));
    } else {
      const user = this.users[userId];
      callback(null, user);
    }
  }

  getTestUserData(userId, callback) {

    callback(null, );
  }
}

module.exports = UserService;
