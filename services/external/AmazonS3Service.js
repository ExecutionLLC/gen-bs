'use strict';

const async = require('async');

const ServiceBase = require('../ServiceBase');
const AWS = require('aws-sdk');

class AmazonS3Service extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;

        this._configureAws();

        this.s3 = new AWS.S3();
    }

    uploadObject(bucketName, keyName, fileStream, callback) {
        this.s3.upload(
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

    /**
     * @param bucketName Name of the Amazon S3 bucket to use.
     * @param keyName Key in the bucket.
     * @param callback (error, readStream)
     * */
    createObjectStream(bucketName, keyName, callback) {
        const objectDescriptor = {
            Bucket: bucketName,
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
        AWS.config.accessKeyId = this.config.savedFilesUpload.amazonS3AccessKeyId;
        AWS.config.secretAccessKey = this.config.savedFilesUpload.amazonS3AccessKeySecret;
        AWS.config.region = this.config.savedFilesUpload.amazonS3RegionName;
        AWS.config.logger = this.services.logger.info.bind(this);
    }
}

module.exports = AmazonS3Service;