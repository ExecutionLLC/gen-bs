'use strict';

const async = require('async');
const _ = require('lodash');
const Redis = require('redis');

const ServiceBase = require('../ServiceBase');

/**
 * @typedef {Object}RedisParams
 * @property {string}host
 * @property {number}port
 * @property {number}databaseNumber
 * @property {string}dataIndex
 * @property {number}offset
 * @property {number}limit
 * @property {string}sampleId
 * @property {string}userId
 * @property {string}operationId
 * @property {string}sessionId
 * */
    
/**
 * @typedef {Object}RedisData - Field id to value hash.
 * */

class RedisService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    getSearchKeyFieldName() {
        return 'search_key';
    }

    /**
     * Fetches data from Redis using the specified params.
     * 
     * @param {RedisParams}redisParams
     * @param {function(Error, RedisData)}callback
     * */
    fetch(redisParams, callback) {
        async.waterfall([
            (callback) => {
                // This is done to allow local port forwarding in dev env.
                const redisHost = this.services.config.forceOverrideRedisToLocalhost ? 'localhost' : redisParams.host;
                this._createClient(redisHost, redisParams.port, redisParams.databaseNumber, callback);
            },
            (client, callback) => {
                this._fetchData(client, redisParams.dataIndex, redisParams.offset, redisParams.limit, callback);
            },
            (rawData, callback) => {
                this.services.users.find(redisParams.userId, (error, user) => {
                    callback(error, {
                        user,
                        rawData
                    });
                });
            },
            (dataWithUser, callback) => {
                this._convertFields(dataWithUser.rawData, dataWithUser.user, redisParams.sampleId, callback);
            }
        ], (error, redisData) => {
            callback(error, redisData);
        });
    }

    _createClient(host, port, databaseNumber, callback) {
        const client = Redis.createClient({
            host,
            port
        });

        // Select Redis database by number
        client.select(databaseNumber, (error) => callback(error, client));
    }

    /**
     * Extracts rows from Redis. Rows are extracted by indices.
     * These indices are stored in the list specified by 'index'.
     * Each resulting row is object[fieldName] = fieldValue.
     * */
    _fetchData(client, index, offset, limit, callback) {
        async.waterfall([
            (callback) => this._fetchRowIndices(client, index, offset, limit, callback),
            // Correct row indices as now the values don't start from 'row:', but the indices do.
            (rowIndices, callback) => callback(null, _.map(rowIndices, (rowIndex) => 'row:' + rowIndex)),
            (rowIndices, callback) => this._fetchRows(client, rowIndices, callback)
        ], callback);
    }

    /**
     * Extracts row indices from the Redis client.
     * */
    _fetchRowIndices(client, index, offset, limit, callback) {
        async.waterfall([
            (callback) => client.llen(index, callback),
            (length, callback) => {
                const startIndex = Math.min(offset, length);
                const endIndex = Math.min(offset + limit - 1, length);
                client.lrange(index, startIndex, endIndex, callback);
            }
        ], callback);
    }

    _fetchRows(client, rowIndices, callback) {
        async.mapSeries(
            rowIndices,
            (rowIndex, callback) => this._fetchRow(client, rowIndex, callback),
            (error, results) => {
                callback(error, results);
            }
        );
    }

    _fetchRow(client, rowIndex, callback) {
        async.waterfall([
            (callback) => client.hkeys(rowIndex, callback),
            (keys, callback) => {
                async.mapSeries(
                    keys,
                    (key, callback) => client.hget(rowIndex, key, (error, value) => {
                        const result = {};
                        result[key] = value;
                        callback(error, result);
                    }),
                    (error, results) => {
                        callback(error, results);
                    }
                );
            }
        ], (error, results) => {
            // Create one object for each row.
            callback(error, _.reduce(
                results,
                (memo, item) => {
                    const keys = _.keys(item);
                    _.each(keys, (key) => {
                            memo[key] = item[key];
                        });
                    return memo;
                },
                {}
            ));
        });
    }

    /**
     * Converts fields names into field ids.
     * */
    _convertFields(rawRedisRows, user, sampleId, callback) {
        async.waterfall([
            (callback) => {
                this.services.fieldsMetadata.findByUserAndSampleId(user, sampleId, (error, fields) => {
                    callback(error, fields);
                });
            },
            (fields, callback) => {
                this.services.fieldsMetadata.findSourcesMetadata((error, sourcesFields) => {
                    callback(error, fields.concat(sourcesFields));
                });
            },
            (fields, callback) => {
                // will be matching fields by name, so create fieldName->field hash
                const fieldNameToFieldHash = _.reduce(fields, (memo, field) => {
                    // Source fields will be prepended by the source name, sample fields - will not.
                    const fieldName = field.sourceName === 'sample' ? field.name : field.sourceName + '_' + field.name;
                    memo[fieldName] = field;
                    return memo;
                }, {});
                callback(null, fieldNameToFieldHash);
            },
            (fieldNameToFieldHash, callback) => {
                const fieldIdToValueArray = _.map(rawRedisRows, (rowObject) => {
                    const fieldIdToValueObject = {};
                    const fieldNames = _.keys(rowObject);
                    _.each(fieldNames, fieldName => {
                        const field = fieldNameToFieldHash[fieldName];
                        const fieldValue = this._mapFieldValue(rowObject[fieldName]);

                        // Keep the search key and transfer it to the client as is.
                        if (fieldName === this.getSearchKeyFieldName()) {
                            fieldIdToValueObject[fieldName] = fieldValue;
                        } else if (field) {
                            fieldIdToValueObject[field.id] = fieldValue;
                        } else {
                            console.error('Field is not found! The value will be ignored: ' + fieldName);
                        }
                    });
                    return fieldIdToValueObject;
                });
                callback(null, fieldIdToValueArray);
            }
        ], callback);
    }

    _mapFieldValue(actualFieldValue) {
        // This is VCF way to mark empty field values.
        return (actualFieldValue !== 'nan') ? actualFieldValue : '.';
    }
}

module.exports = RedisService;
