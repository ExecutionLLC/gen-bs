'use strict';

const async = require('async');

const Redis = require('redis');

class RedisService {
    fetch(redisHost, redisPort, databaseNumber, redisIndex, offset, total, callback) {
        async.waterfall([
            (callback) => {
                this._createClient(redisHost, redisPort, databaseNumber, callback);
            },
            (client, callback) => {
                this._fetchData(client, redisIndex, callback, offset, total);
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

    _fetchData(client, index, offset, total, callback) {
        async.waterfall([
            (callback) => client.llen(index, callback),
            (length, callback) => {
                const startIndex = Math.min(offset, length);
                const endIndex = Math.min(offset + total, length);
                client.lrange(startIndex, endIndex, callback);
            },
            (data, callback) => {
                console.log(JSON.stringify(data, null, 2));
                callback(null, data);
            }
        ], callback);
    }
}

module.exports = RedisService;
