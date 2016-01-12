'use strict';

const async = require('async');
const _ = require('lodash');
const Redis = require('redis');

class RedisService {
    fetch(redisHost, redisPort, databaseNumber, redisIndex, offset, limit, callback) {
        async.waterfall([
            (callback) => {
                this._createClient(redisHost, redisPort, databaseNumber, callback);
            },
            (client, callback) => {
                this._fetchData(client, redisIndex, offset, limit, callback);
            }
        ], callback);
    }

    _createClient(host, port, databaseNumber, callback) {
        const client = Redis.createClient({
            host,
            port
        });

        client.select(databaseNumber, (error) => callback(error, client));
    }

    _fetchData(client, index, offset, limit, callback) {
        async.waterfall([
            (callback) => this._fetchRowIndices(client, index, offset, limit, callback),
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
}

module.exports = RedisService;
