'use strict';

const WebServerHost = require('../../WebServerHost');

const Config = require('../../utils/Config');
const Logger = require('../../utils/Logger');

const ModelsFacade = require('../../models/ModelsFacade');
const ServicesFacade = require('../../services/ServicesFacade');
const ControllersFacade = require('../../controllers/ControllersFacade');

const MockUserModel = require('./MockUserModel');
const MockRedisService = require('./MockRedisService');
const MockSessionsController = require('./MockSessionsController');

class MockWebServerHost {
    constructor() {
        const logger = new Logger(Config.logger);

        const models = new ModelsFacade(Config, logger);
        this._setModelsMocks(models);

        const services = new ServicesFacade(Config, logger, models);
        this._setServicesMocks(services);

        const controllers = new ControllersFacade(logger, services);
        this._setControllersMocks(controllers);

        this.server = new WebServerHost(controllers, services, models);
    }

    _setModelsMocks(models) {
        models.users = new MockUserModel();
    }

    _setControllersMocks(controllers) {
        controllers.sessionsController = new MockSessionsController(controllers.sessionsController);
    }

    _setServicesMocks(services, models) {
        services.redis = new MockRedisService(services, models);
    }

    start(callback) {
        this.server.start(callback);
    }

    stop(callback) {
        this.server.stop(callback);
    }
}

module.exports = MockWebServerHost;
