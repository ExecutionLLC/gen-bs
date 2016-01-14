'use strict';

const _ = require('lodash');

class Operations {
  constructor() {
    this.operations = [];
  }

  add(description, callback) {
    const charCode = 'a'.charCodeAt(0) + this.operations.length;
    const char = String.fromCharCode(charCode);
    const operation = {
      char,
      description,
      callback
    };
    this.operations.push(operation);
  }

  printPrompt() {
    console.log('Available operations:');
    _.each(this.operations, operation => {
      console.log('%s. %s', operation.char, operation.description);
    });
  }

  execAt(char, callback) {
    const operation = _.find(this.operations, operation => operation.char === char);
    if (!operation) {
      throw new Error('Operation is not found');
    } else {
      operation.callback(callback);
    }
  }
}

module.exports = Operations;
