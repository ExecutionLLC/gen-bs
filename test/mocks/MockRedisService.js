'use strict';

const async = require('async');
const _ = require('lodash');

const RedisService = require('../../services/external/RedisService');
const FakeRedis = require('fakeredis');

/**
 * @typedef {Object}RedisTestData
 * @property {Number}databaseNumber
 * @property {String}host
 * @property {Number}port
 * @property {String}password
 * @property {String}indexKey
 * @property {Array<Object>}rows Array containing hashes for each row.
 * */

class MockRedisService extends RedisService {
    constructor(services, models) {
        super(services, models);
    }

    _createClient(host, port, password, databaseNumber, callback) {
        //const databaseId = this._createDatabaseId(host, port, password);
        const client = FakeRedis.createClient(host, port, {verbose: false, fast: true});
        client.select(databaseNumber, (error) => callback(error, client));
    }

    /**
     * @param {RedisTestData}redisTestData
     * @param {function(Error)}callback
     * */
    insertData(redisTestData, callback) {
        const {host, port, password, number, rows, result_index: indexKey} = redisTestData;
        async.waterfall([
            (callback) => this._createClient(host, port, password, number, callback),
            (client, callback) => this._insertRows(client, rows, (error) => callback(error, client)),
            (client, callback) => this._createIndex(client, indexKey, rows, callback)
        ], (error) => callback(error));
    }

    _insertRows(client, rows, callback) {
        const rowsWithIndex = rows.map((row, index) => ({row, index}));
        async.eachSeries(rowsWithIndex, ({row, index}, callback) => {
            const hashKey = `row:${index}`;
            async.eachSeries(Object.keys(row), (columnName) => {
                const columnValue = row[columnName];
                client.hset(hashKey, columnName, columnValue, callback);
            });
        }, (error) => callback(error));
    }

    _createIndex(client, indexKey, rows, callback) {
        const rowIndices = _.range(rows.length);
        async.eachSeries(rowIndices, (index, callback) => {
            client.lpush(indexKey, index, callback);
        }, callback);
    }
}

module.exports = MockRedisService;
