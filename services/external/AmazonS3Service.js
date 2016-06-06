'use strict';

const async = require('async');

const ServiceBase = require('../ServiceBase');
const AWS = require('aws-sdk');

class AmazonS3Service extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;
        this.logger = this.services.logger;

        this._configureAws();

        this.s3 = new AWS.S3();
        this.bucketName = this.config.savedFilesUpload.amazon.amazonS3BucketName;
    }

    uploadObject(keyName, fileStream, callback) {
        this.s3.upload(
            {
                Bucket: this.bucketName,
                Body: fileStream,
                Key: keyName
            },
            {
                partSize: 6 * 1024 * 1024,
                queueSize: 1
            })
            .on('httpUploadProgress', function (evt) {
                this.logger.debug('Progress:', evt.loaded, '/', evt.total);
            })
            .send((error) => callback(error));
    }

    /**
     * @param keyName Key in the bucket.
     * @param callback (error, readStream)
     * */
    createObjectStream(keyName, callback) {
        const objectDescriptor = {
            Bucket: this.bucketName,
            Key: keyName
        };
        async.waterfall([
            // CHeck object exists.
            (callback) => this.s3.headObject(objectDescriptor, (error) => callback(error)),
            (callback) => {
                const request = this.s3.getObject(objectDescriptor);
                callback(null, request.createReadStream());
            }
        ], callback);
    }

    _configureAws() {
        AWS.config.accessKeyId = this.config.savedFilesUpload.amazon.amazonS3AccessKeyId;
        AWS.config.secretAccessKey = this.config.savedFilesUpload.amazon.amazonS3AccessKeySecret;
        AWS.config.region = this.config.savedFilesUpload.amazon.amazonS3RegionName;
        AWS.config.logger = this.logger.info.bind(this);
    }
}

module.exports = AmazonS3Service;
