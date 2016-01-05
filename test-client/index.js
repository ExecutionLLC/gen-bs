'use strict';

const Request = require('request');
const Read = require('read');
const Async = require('async');

const SESSION_HEADER = 'X-Session-Id';
const HOST = 'localhost';
const PORT = 5000;
const DEFAULT_USER_NAME = 'valarie';
const DEFAULT_PASSWORD = 'password';

const Operations = require('./Operations');
const Urls = require('./Urls');
const WebSocketClient = require('./WebSocketClient');

const urls = new Urls(HOST, PORT);
const wsClient = new WebSocketClient(HOST, PORT);
const operations = new Operations();

function waterfall(tasks, callback) {
  Async.waterfall(tasks, (error, result) => {
    if (error) {
      console.error(error);
    } else {
      console.log('Result: ' + JSON.stringify(result, null, 2));
    }
    callback();
  });
}

function read(prompt, defaultValue, callback) {
  Read({
    prompt: prompt,
    default: defaultValue
  }, callback);
}

operations.add('Get data', (callback) => {
  Request.get({
    url: urls.data()
  }, (error, response, body) => {
    if (error) {
      console.error(error);
    } else {
      console.log('Response: ' + JSON.stringify(response, null, 2));
      console.log('Body: ' + JSON.parse(body));
    }
    callback();
  });
});

operations.add('Open session', (callback) => {
  waterfall([
    (callback) => {
      Async.series({
        userName: (callback) => {
          read('user name', DEFAULT_USER_NAME, (error, result) => {
            callback(error, result);
          });
        },
        password: (callback) => {
          read('password', DEFAULT_PASSWORD, (error, result) => {
            callback(error, result);
          });
        },
        done: (callback) => {
          callback(null);
        }
      }, (error, result) => {
        callback(error, result);
      });
    },
    (userDescriptor, callback) => {
      Request.post({
        url: urls.session(),
        json: {
          user_name: userDescriptor.userName,
          password: userDescriptor.password
        }
      }, callback);
    }
  ], callback);
});

operations.add('Check session', (callback) => {
  waterfall([
    (callback) => {
      read('Session Id: ', 'asdasddsas', (error, result) => {
        callback(error, result);
      });
    },
    (sessionId, callback) => {
      const headers = {};
      headers[SESSION_HEADER] = sessionId;

      Request.put({
        url: urls.session(),
        headers
      }, callback);
    }
  ], callback);
});

operations.add('Close session', (callback) => {
  waterfall([
    (callback) => {
      read('Session Id: ', 'asdasdqq', (error, result) => {
        callback(error, result);
      })
    },
    (sessionId, callback) => {
      const headers = {};
      headers[SESSION_HEADER] = sessionId;

      Request.del({
        url: urls.session(),
        headers
      }, callback)
    }
  ], callback);
});

operations.add('Exit', (callback) => {
  process.exit(0);
});

function execute() {
  operations.printPrompt();
  Read({prompt: 'Choose operation: '}, (error, operationChar) => {
    operations.execAt(operationChar, () => {
      setTimeout(execute, 1000);
    });
  });
}

execute();
