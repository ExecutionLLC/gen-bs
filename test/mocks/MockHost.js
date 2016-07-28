'use strict';

const async = require('async');

const WebServerHost = require('../../WebServerHost');

const Config = require('../../utils/Config');
const Logger = require('../../utils/Logger');

const ModelsFacade = require('../../models/ModelsFacade');
const ServicesFacade = require('../../services/ServicesFacade');
const ControllersFacade = require('../../controllers/ControllersFacade');

const MockUserModel = require('./MockUserModel');
const MockRedisService = require('./MockRedisService');
const MockSessionsService = require('./MockSessionsService');
const MockSessionsController = require('./MockSessionsController');
const MockWSController = require('./MockWSController');

const MockWebServerHost = require('./MockWebServerHost');
const MockApplicationServer = require('./applicationServer/MockApplicationServer');

class MockHost {
    constructor() {
        const logger = new Logger(Config.logger);
        this._setConfigMocks(Config);

        const models = new ModelsFacade(Config, logger);
        this._setModelsMocks(models);

        const services = new ServicesFacade(Config, logger, models);
        this._setServicesMocks(services);

        this._createAppServer(services);

        const controllers = new ControllersFacade(logger, services);
        this._setControllersMocks(controllers, services);

        this.server = new MockWebServerHost(controllers, services, models);
    }

    _setConfigMocks(config) {
        config.rabbitMq.requestExchangeName = 'test_exchange';
    }
    
    _setModelsMocks(models) {
        models.users = new MockUserModel();
    }

    _setControllersMocks(controllers, services) {
        controllers.sessionsController = new MockSessionsController(controllers.sessionsController);
        controllers.wsController = new MockWSController(services);
    }

    _setServicesMocks(services, models) {
        services.redis = new MockRedisService(services, models);
        services.sessions = new MockSessionsService(services, models);
        // Initialization inside facade is already complete at this moment, so we need to call it by hand.
        services.redis.init();
        services.sessions.init();
    }

    _createAppServer(services) {
        this.applicationServer = new MockApplicationServer(services);
    }

    start(callback) {
        async.waterfall([
            (callback) => this.server.start((error) => callback(error)),
            (callback) => this.applicationServer.start((error) => callback(error))
        ], callback);
    }

    stop(callback) {
        this.applicationServer.stop();
        this.server.stop(callback);
    }
}

module.exports = MockHost;
