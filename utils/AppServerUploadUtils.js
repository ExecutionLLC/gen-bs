'use strict';

const fs = require('fs');
const path = require('path');
const HttpStatus = require('http-status');
const Request = require('request');

class AppServerUploadUtils {
    static createUploadUrl(asHost, asPort, sampleId, operationId) {
        return 'http://' + asHost + ':' + asPort + '/upload/' + operationId + '/' + sampleId;
    }

    static uploadFile(url, localFilePath, callback) {
        const formData = {
            samples: {
                value: fs.createReadStream(localFilePath),
                options: {
                    filename: path.basename(localFilePath)
                }
            }
        };

        Request.post({
            url,
            formData
        }, (error, response, body) => {
            if (error) {
                callback(error);
            } else if (response.statusCode !== HttpStatus.OK) {
                callback(new Error('Unexpected AS POST HTTP status: ' + response.statusCode));
            } else {
                callback(null, body);
            }
        });
    }
}

module.exports = AppServerUploadUtils;
