'use strict';

const lodash = require('lodash');

class UserService {
  constructor() {
    this.users = [
      {
        id: 'd2030646-7472-4521-8271-325ecc049422',
        firstName: 'Demo User Name',
        lastName: 'Demo User Surname',
        isDemo: true
      },
      {
        id: 'e9253876-2669-43ff-b6ba-ede6470d572c',
        firstName: 'Vasya',
        lastName: 'Pupkin'
      },
      {
        id: '5b3f7697-336f-4aed-9bb4-bf5e77256a70',
        firstName: 'Vanya',
        lastName: 'Pupkin'
      }
    ];
  }

  findDemoUser(callback) {
    this._findUser((user) => user.isDemo, callback);
  }

  findById(userId, callback) {
    if (userId === '123') {
      // TODO: Simulate error.
      callback(new Error('Something happened in DB.'));
    } else {
      const user = this.users[userId];
      callback(null, user);
    }
  }

  _findUser(predicate, callback) {
    const userIndex = lodash.findIndex(this.users, (user) => predicate(user));

    if (userIndex === -1) {
      callback(new Error('Failed to find user.'));
    } else {
      const user = this.users[userIndex];
      callback(null, user);
    }
  }
}

module.exports = UserService;
