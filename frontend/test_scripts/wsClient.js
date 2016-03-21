const WebSocketClient = require('../../test-client/WebSocketClient');
const Request = require('request')

const HOST = 'localhost'
const PORT = 8888
const SESSION_HEADER = 'X-Session-Id';

const wsClient = new WebSocketClient(HOST, PORT);
console.log('test ws')

var operationId = null;

const searchParams = {
    sampleId: "ce81aa10-13e3-47c8-bd10-205e97a92d69",
    viewId: 'b7ead923-9973-443a-9f44-5563d31b5073',
    filterIds: null,
    limit: 100,
    offset: 0
}

function login(userName, password, cb) {
    var sessionId = null;
    Request({
            method: 'POST',
            url: 'http://localhost:8888/api/session',
            json: {user_name: userName, password: password}
        },
        function (err, res, body) {
            sessionId = body.session_id;
            console.log('session: ', sessionId);
            wsClient.send({session_id: sessionId});
            cb(sessionId, searchNextChank);
        });
}

function search(sessionId) {
    Request(
        {
            headers: {
                "X-Session-Id": sessionId
            },
            method: 'POST',
            url: 'http://localhost:8888/api/search',
            json: searchParams
        },
        function (err, res, body) {
            const operationId = res.body.operation_id
            console.log('search operation_id: ', res.body);
            //cb(sessionId, operationId)
        });
}

function searchNextChank(sessionId, operationId) {
    const URL = `http://localhost:8888/api/search/${operationId}?limit=100&offset=101`
    console.log('chank get: ', sessionId, operationId, URL)
    Request(
        {
            headers: {
                "X-Session-Id": sessionId
            },
            method: 'GET',
            url: URL
        },
        function (err, res, body) {
            console.log('search', err);
        });
}

login('valarie', 'password', search)


//process.exit()
