'use strict';

const Request = require('request');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

class RequestClient {
    static post(url, headers, bodyObject, callback) {
        Request.post({
            url,
            headers,
            json: ChangeCaseUtil.convertKeysToSnakeCase(bodyObject)
        }, RequestClient._createResponseConverter(callback));
    }

    static get(url, headers, queryParams, bodyObject, callback) {
        Request.get({
            url,
            headers,
            qs: ChangeCaseUtil.convertKeysToSnakeCase(queryParams),
            json: ChangeCaseUtil.convertKeysToSnakeCase(bodyObject)
        }, RequestClient._createResponseConverter(callback))
    }

    static put(url, headers, bodyObject, callback) {
        Request.put({
            url,
            headers,
            json: ChangeCaseUtil.convertKeysToSnakeCase(bodyObject)
        }, RequestClient._createResponseConverter(callback));
    }

    static del(url, headers, bodyObject, callback) {
        Request.del({
            url,
            headers,
            json: ChangeCaseUtil.convertKeysToSnakeCase(bodyObject)
        }, RequestClient._createResponseConverter(callback));
    }

    static _createResponseConverter(callback) {
        return (error, response, body) => {
            callback(error, {
                status: response.statusCode,
                body: ChangeCaseUtil.convertKeysToCamelCase(body)
            })
        };
    }
}

module.exports = RequestClient;