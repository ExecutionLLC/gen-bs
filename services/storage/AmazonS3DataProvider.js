const AWS = require('aws-sdk');
const QueryString = require('querystring');
const async = require('async');

const BaseDataProvider = require('./BaseDataProvider');

const partSize = 6 * 1024 * 1024;
const queueSize = 1;
const amazonS3Url = 'http://s3.amazonaws.com';

class AmazonS3DataProvider extends BaseDataProvider {

    constructor(config, logger) {
        super(config, logger);
        const {
            accessKeyId,
            accessKeySecret: secretAccessKey,
            regionName: region,
            savedFilesBucket,
            newSamplesBucket
        } = this.config.objectStorage.s3;
        this._savedFilesBucket = savedFilesBucket;
        this._newSamplesBucket = newSamplesBucket;
        const awsConfig = new AWS.Config({
            accessKeyId,
            secretAccessKey,
            region
        });
        this._s3 = new AWS.S3(awsConfig);
    }

    addSavedFile(fileName, fileStream, callback) {
        this._uploadObject(this._savedFilesBucket, fileName, fileStream, callback);
    }

    removeSampleFile(fileName, callback) {
        this._deleteObject(this._newSamplesBucket, fileName, callback);
    }

    getSavedFile(fileName, callback) {
        this._createObjectStream(this._savedFilesBucket, fileName, callback);
    }

    addSampleFile(fileName, fileStream, callback) {
        this._uploadObject(this._newSamplesBucket, fileName, fileStream, callback);
    }

    getSamplePath(fileName) {
        return `${amazonS3Url}/${this._newSamplesBucket}/${QueryString.escape(fileName)}`;
    }

    _uploadObject(bucketName, keyName, fileStream, callback) {
        this._s3.upload(
            {
                Bucket: bucketName,
                Body: fileStream,
                Key: keyName
            },
            {
                partSize: partSize,
                queueSize: queueSize
            }
        )
        .on('httpUploadProgress', (evt) => {
            this.logger.debug(
                `Progress upload file with id ${keyName}: ${evt.loaded} / ${evt.total}`
            );
        })
        .send((error) => callback(error));
    }

    _deleteObject(bucketName, keyName, callback) {
        this._s3.deleteObject(
            {
                Bucket: bucketName,
                Key: keyName
            },
            callback
        );
    }

    _createObjectStream(bucketName, keyName, callback) {
        const objectDescriptor = {
            Bucket: bucketName,
            Key: keyName
        };
        async.waterfall([
            // Check object exists.
            (callback) => this._s3.headObject(objectDescriptor, (error) => callback(error)),
            (callback) => {
                const request = this._s3.getObject(objectDescriptor);
                callback(null, request.createReadStream());
            }
        ], callback);
    }
}

module.exports = AmazonS3DataProvider;