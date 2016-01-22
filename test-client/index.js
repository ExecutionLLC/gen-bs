'use strict';

const Request = require('request');
const Read = require('read');
const Async = require('async');
const _ = require('lodash');

const env = process.env;

const SESSION_HEADER = 'X-Session-Id';
const HOST = 'localhost';
const PORT = env.GEN_PORT || 5000;
const DEFAULT_USER_NAME = 'valarie';
const DEFAULT_PASSWORD = 'password';

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const DefaultViews = require('../defaults/views/default-views.json');
const DefaultFilters = require('../defaults/filters/default-filters.json');
const Sample = require('../defaults/samples/ONH_400_1946141_IonXpress_022.vcf.gz.json').sample;
const SampleFieldIds = require('../defaults/samples/ONH_400_1946141_IonXpress_022.vcf.gz.json').field_ids;
const AllFields = require('../defaults/fields/fields-metadata.json');
const SampleFields = _.filter(AllFields, field => _.some(SampleFieldIds, fieldId => fieldId === field.id));

const Operations = require('./Operations');
const Urls = require('./Urls');
const WebSocketClient = require('./WebSocketClient');

const urls = new Urls(HOST, PORT);
const wsClient = new WebSocketClient(HOST, PORT);
const operations = new Operations();
let lastSessionId = undefined;
let lastOperationId = undefined;

function stringify(obj) {
  return JSON.stringify(obj, null, 2);
}

function createHeaders(sessionId) {
  const headers = {};
  headers[SESSION_HEADER] = sessionId;
  return headers;
}

function waterfall(tasks, callback) {
  Async.waterfall(tasks, (error, result) => {
    if (error) {
      console.error(error);
    } else {
      console.log('Result: ' + stringify(result));
    }
    callback();
  });
}

function read(prompt, defaultValue, callback) {
  Read({
    prompt: prompt,
    default: defaultValue
  }, (error, result) => {
    callback(error, result);
  });
}

function askSession(callback) {
  read('Session Id: ', lastSessionId, callback);
}

function askOperation(callback) {
  read('Operation Id: ', lastOperationId, callback);
}

operations.add('Redraw list', callback => {
  callback();
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
      }, (error, response, body) => {
        const bodyObject = ChangeCaseUtil.convertKeysToCamelCase(body);
        const sessionId = bodyObject.sessionId;
        console.log('Associate session with the opened socket');
        wsClient.send({
          sessionId
        });
        lastSessionId = sessionId;
        callback(error, body);
      });
    }
  ], callback);
});

operations.add('Start search', (callback) => {
  waterfall([
    (callback) => {
      callback(null, {
        viewId: DefaultViews[0].id,
        filterId: DefaultFilters[0].id,
        sampleId: Sample.id,
        limit: 100,
        offset: 0
      });
    },
    (searchData, callback) => {
      askSession((error, result) => {
        searchData.sessionId = result;
        callback(error, searchData);
      });
    },
    (searchData, callback) => {
      const headers = createHeaders(searchData.sessionId);
      Request.post({
        url: urls.startSearch(),
        headers,
        json: searchData
      }, (error, response, body) => {
        if (error) {
          console.error(error);
        } else {
          const bodyObject = ChangeCaseUtil.convertKeysToCamelCase(body);
          lastOperationId = bodyObject.operationId;
          console.log('Response: ' + stringify(response));
          console.log('Body: ' + stringify(body));
        }
        callback();
      });
    }
  ], callback);
});

operations.add('Search in results', (callback) => {
  waterfall([
    (callback) => {
      askSession(callback);
    },
    (sessionId, callback) => {
      askOperation((error, operationId) => {
        callback(error, {
          sessionId,
          operationId
        });
      });
    },
    (sessionWithOperation, callback) => {
      const headers = createHeaders(sessionWithOperation.sessionId);
      const field = _.find(SampleFields, field => field.name === 'FILTER');
      Request.post({
        url: urls.startSearchInResults(sessionWithOperation.operationId),
        json: {
          topSearch: '123',
          search: [
            {
              fieldId: field.id,
              value: 'PASS'
            }
          ],
          limit: 100,
          offset: 0
        },
        headers
      }, (error, response, body) => {
        console.log('Response: ' + stringify(response));
        console.log('Body: ' + stringify(body));
        callback(error);
      });
    }
  ], callback);
});

operations.add('Fetch page', callback => {
  waterfall([
    (callback) => {
      askSession(callback);
    },
    (sessionId, callback) => {
      askOperation((error, operationId) => {
        callback(error, {
          sessionId,
          operationId
        });
      });
    },
    (context, callback) => {
      read('limit', 100, (error, limit) => {
        context.limit = limit;
        callback(error, context);
      })
    },
    (context, callback) => {
      read('offset', 0, (error, offset) => {
        context.offset = offset;
        callback(error, context);
      });
    },
    (context, callback) => {
      lastSessionId = context.sessionId;
      lastOperationId = context.operationId;

      const headers = createHeaders(context.sessionId);
      Request.get({
        url: urls.loadNextPage(context.operationId),
        headers,
        qs: {
          offset: context.offset,
          limit: context.limit
        }
      }, (error, response, body) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Response: ' + stringify(response));
          console.log('Body: ' + stringify(body));
        }
      });
      callback();
    }
  ], callback);
});

operations.add('Get data', (callback) => {
  waterfall([
    (callback) => {
      askSession(callback);
    },
    (sessionId, callback) => {
      const headers = createHeaders(sessionId);
      Request.get({
        url: urls.data(),
        headers
      }, (error, response, body) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Response: ' + stringify(response));
          console.log('Body: ' + stringify(JSON.parse(body)));
        }
        callback(null);
      });
    }
  ], callback);
});

operations.add('Check session', (callback) => {
  waterfall([
    (callback) => {
      askSession((error, result) => {
        callback(error, result);
      });
    },
    (sessionId, callback) => {
      const headers = createHeaders(sessionId);

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
      askSession((error, result) => {
        callback(error, result);
      });
    },
    (sessionId, callback) => {
      const headers = createHeaders(sessionId);

      Request.del({
        url: urls.session(),
        headers
      }, callback);
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
      setTimeout(execute, 0);
    });
  });
}

execute();
