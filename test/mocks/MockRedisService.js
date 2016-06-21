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
        const databaseId = this._createDatabaseId(host, port, password, databaseNumber);
        const client = FakeRedis.createClient(databaseId);
        client.select(databaseNumber, (error, client) => callback(error, client));
    }

    /**
     * @param {RedisTestData}redisTestData
     * @param {function(Error)}callback
     * */
    insertData(redisTestData, callback) {
        const {host, port, password, databaseNumber, rows, indexKey} = redisTestData;
        async.waterfall([
            (callback) => this._createClient(host, port, password, databaseNumber, callback),
            (client, callback) => this._insertRows(client, rows, (error) => callback(error, client)),
            (client, callback) => this._createIndex(client, indexKey, rows, callback)
        ], (error) => callback(error));
    }

    _createDatabaseId(host, port, password, databaseNumber) {
        return `redis:${password}@${host}:${port}`;
    }

    _insertRows(client, rows, callback) {
        const rowsWithIndex = rows.map((row, index) => ({row, index}));
        async.eachSeries(rowsWithIndex, ({row, index}, callback) => {
            const hashKey = `row:${index}`;
            client.hset(hashKey, row, callback);
        }, (error) => callback(error));
    }

    _createIndex(client, indexKey, rows, callback) {
        let indexValue = _.range(rows.length);
        client.lset(indexKey, indexValue, callback);
    }
}

module.exports = MockRedisService;
