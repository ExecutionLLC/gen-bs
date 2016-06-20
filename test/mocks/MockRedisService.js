'use strict';

const RedisService = require('../../services/external/RedisService');
const FakeRedis = require('fakeredis');

class MockRedisService extends RedisService {
    constructor(services, models) {
        super(services, models);
    }

    _createClient(host, port, password, databaseNumber, callback) {
        const databaseId = `redis:${password}@${host}:${port}`;
        const client = FakeRedis.createClient(databaseId);
        client.select(databaseNumber, (error, client) => callback(error, client));
    }
}

module.exports = MockRedisService;
