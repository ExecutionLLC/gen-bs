'use strict';

import Request from 'superagent';
import _ from 'lodash';

export default class RequestWrapper {
    static post(url, headers, bodyObject, callback) {
        RequestWrapper._prepareAndExecuteRequest(Request.post(url), headers, null, bodyObject, callback);
    }

    static get(url, headers, queryParams, bodyObject, callback) {
        RequestWrapper._prepareAndExecuteRequest(Request.get(url), headers, queryParams, bodyObject, callback);
    }

    static put(url, headers, bodyObject, callback) {
        RequestWrapper._prepareAndExecuteRequest(Request.put(url), headers, null, bodyObject, callback);
    }

    static del(url, headers, bodyObject, callback) {
        RequestWrapper._prepareAndExecuteRequest(Request.del(url), headers, null, bodyObject, callback);
    }

    static download(url, headers, queryParams, callback) {
        let request = RequestWrapper._prepareRequest(Request.get(url), headers, queryParams, null);
        request = request.responseType('blob');
        RequestWrapper._sendRequest(request, (error, response) => {
            if (error) {
                callback(error);
            } else {
                const {status} = response;
                const blob = response.response.xhr.response; // Hell yeah
                callback(null, {
                    status,
                    blob,
                    response
                });
            }
        });
    }

    static uploadMultipart(url, headers, queryParams, formObject, callback) {
        const request = RequestWrapper._prepareRequest(Request.post(url), headers, queryParams, null);
        _.each(formObject, (fieldValue, fieldName) => {
            if (fieldValue
                && (fieldValue instanceof Blob)) {
                request.attach(fieldName, fieldValue);
            } else {
                request.field(fieldName, fieldValue);
            }
        });
        RequestWrapper._sendRequest(request, callback);
    }

    static _prepareRequest(request, headers, queryParams, bodyObject) {
        request = request.withCredentials();
        if (headers) {
            request = request.set(headers);
        }

        if (queryParams) {
            request = request.query(queryParams);
        }

        if (bodyObject) {
            request = request.send(bodyObject);
        }

        return request;
    }

    static _sendRequest(request, callback) {
        request.end(RequestWrapper._createResponseConverter(callback));
    }

    static _prepareAndExecuteRequest(request, headers, queryParams, bodyObject, callback) {
        request = RequestWrapper._prepareRequest(request, headers, queryParams, bodyObject);
        RequestWrapper._sendRequest(request, callback);
    }

    static _createResponseConverter(callback) {
        return (error, response) => {
            if (error && !error.response) {
                // Network error, send it as it is.
                callback(error);
            } else {
                let body = response.body;
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
                    body,
                    response
                });
            }
        };
    }

    static upload(url, headers, queryParams, file, onProgress, onComplete) {
        const formData = new FormData();
        formData.append('sample', file);
        formData.append('fileName', file.name);
        const request = RequestWrapper._prepareRequest(Request.post(url), headers, queryParams, null);
        request.on('progress', (p) => onProgress(p.percent));
        request.send(formData);
        RequestWrapper._sendRequest(request, (err, res) => {
            if (err) {
                onComplete(err);
            } else {
                if (res && res.body && res.body.upload) {
                    onComplete(null, res.body.upload)
                } else {
                    onComplete(new Error('Invalid upload response'));
                }
            }
        });
    }
}
