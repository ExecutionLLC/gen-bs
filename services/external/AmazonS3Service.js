'use strict';

const ServiceBase = require('../ServiceBase');
const AWS = require('aws-sdk');

class AmazonS3Service extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;
        this._configureAws();
    }

    upload(bucketName, keyName, fileStream, callback) {
        const s3 = new AWS.S3();
        s3.upload(
            {
                Bucket: bucketName,
                Body: fileStream,
                Key: keyName
            },
            {
                partSize: 6 * 1024 * 1024,
                queueSize: 1
            })
            .on('httpUploadProgress', function (evt) {
                this.logger.info('Progress:', evt.loaded, '/', evt.total);
            })
            .send((error) => callback(error));
    }

    _configureAws() {
        AWS.config.accessKeyId = this.config.amazonS3AccessKeyId;
        AWS.config.secretAccessKey = this.config.amazonS3AccessKeySecret;
        AWS.config.region = this.config.amazonS3RegionName;
        AWS.config.logger = this.services.logger.info.bind(this);
    }
}

module.exports = AmazonS3Service;
