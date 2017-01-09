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
            .on('httpUploadProgress', (evt) => {
                this.logger.debug(`Progress upload file with id ${keyName}: ${evt.loaded} / ${evt.total}`);
            })
            .send((error) => callback(error));
    }

    deleteObject(bucketName, keyName, callback) {
        this.s3.deleteObject(
            {
                Bucket: bucketName,
                Key: keyName
            }, callback
        );
    }

    /**
     * @param {string}bucketName
     * @param {string}keyName Key in the bucket.
     * @param {function(Error, Readable)} callback (error, readStream)
     * */
    createObjectStream(bucketName, keyName, callback) {
        const objectDescriptor = {
            Bucket: bucketName,
            Key: keyName
        };
        async.waterfall([
            // Check object exists.
            (callback) => this.s3.headObject(objectDescriptor, (error) => callback(error)),
            (callback) => {
                const request = this.s3.getObject(objectDescriptor);
                callback(null, request.createReadStream());
            }
        ], callback);
    }

    _configureAws() {
        const {accessKeyId, accessKeySecret:secretAccessKey, regionName: region} = this.config.objectStorage.s3;
        Object.assign(AWS.config, {accessKeyId, secretAccessKey, region});
    }
}

module.exports = AmazonS3Service;
