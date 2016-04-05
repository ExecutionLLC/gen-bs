'use strict';

import Request from 'browser-request';

export default class RequestWrapper {
    static post(url, headers, bodyObject, callback) {
        Request.post({
            url,
            headers,
            json: bodyObject
        }, RequestWrapper._createResponseConverter(callback));
    }

    static get(url, headers, queryParams, bodyObject, callback) {
        Request.get({
            url,
            headers,
            qs: queryParams,
            json: bodyObject
        }, RequestWrapper._createResponseConverter(callback))
    }

    static put(url, headers, bodyObject, callback) {
        Request.put({
            url,
            headers,
            json: bodyObject
        }, RequestWrapper._createResponseConverter(callback));
    }

    static del(url, headers, bodyObject, callback) {
        Request({
            method: 'DELETE',
            url,
            headers,
            json: bodyObject
        }, RequestWrapper._createResponseConverter(callback));
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
                    body
                });
            }
        };
    }
}
