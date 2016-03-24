'use strict';

import Request from 'browser-request';

import ChangeCaseUtil from '../utils/ChangeCaseUtil';

export default class RequestWrapper {
    static post(url, headers, bodyObject, callback) {
        Request.post({
            url,
            headers,
            json: ChangeCaseUtil.convertKeysToSnakeCase(bodyObject)
        }, RequestWrapper._createResponseConverter(callback));
    }

    static get(url, headers, queryParams, bodyObject, callback) {
        Request.get({
            url,
            headers,
            qs: ChangeCaseUtil.convertKeysToSnakeCase(queryParams),
            json: ChangeCaseUtil.convertKeysToSnakeCase(bodyObject)
        }, RequestWrapper._createResponseConverter(callback))
    }

    static put(url, headers, bodyObject, callback) {
        Request.put({
            url,
            headers,
            json: ChangeCaseUtil.convertKeysToSnakeCase(bodyObject)
        }, RequestWrapper._createResponseConverter(callback));
    }

    static del(url, headers, bodyObject, callback) {
        Request({
            method: 'DELETE',
            url,
            headers,
            json: ChangeCaseUtil.convertKeysToSnakeCase(bodyObject)
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
        Request.post({url, formData, headers}, RequestWrapper._createResponseConverter(callback));
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
                        callback('Error parsing request body: ' + body);
                    }
                }
                callback(null, {
                    status,
                    body: ChangeCaseUtil.convertKeysToCamelCase(body)
                });
            }
        };
    }
}
