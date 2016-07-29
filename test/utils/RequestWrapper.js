'use strict';

const assert = require('assert');
const Request = require('request');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

class RequestWrapper {
    static post(url, headers, bodyObject, callback) {
        Request.post({
            jar: true,
            url,
            headers,
            json: bodyObject
        }, RequestWrapper._createResponseConverter(callback));
    }

    static get(url, headers, queryParams, bodyObject, callback) {
        Request.get({
            jar: true,
            url,
            headers,
            qs: queryParams,
            json: bodyObject
        }, RequestWrapper._createResponseConverter(callback))
    }

    static put(url, headers, bodyObject, callback) {
        Request.put({
            jar: true,
            url,
            headers,
            json: bodyObject
        }, RequestWrapper._createResponseConverter(callback));
    }

    static del(url, headers, bodyObject, callback) {
        Request.del({
            jar: true,
            url,
            headers,
            json: bodyObject
        }, RequestWrapper._createResponseConverter(callback));
    }

    static upload(url, fileParamName, fileName, fileStream, headers, bodyObject, callback) {
        const fileDescriptor = {};
        fileDescriptor[fileParamName] = {
            value: fileStream,
            options: {
                filename: fileName
            }
        };

        const formData = Object.assign({}, bodyObject, fileDescriptor);
        Request.post({jar: true, url, formData, headers}, RequestWrapper._createResponseConverter(callback));
    }

    static _createResponseConverter(callback) {
        return (error, response, body) => {
            if (error) {
                callback(error);
            } else {
                const status = response.statusCode;
                if (typeof body === 'string') {
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        assert.fail('Error parsing request body: ' + body);
                    }

                }
                callback(null, {
                    status,
                    body
                });
            }
        };
    }
}

module.exports = RequestWrapper;