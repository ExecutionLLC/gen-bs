'use strict';

const async = require('async');

const WebServerHost = require('../../WebServerHost');

const Config = require('../../utils/Config');
const Logger = require('../../utils/Logger');

const ModelsFacade = require('../../models/ModelsFacade');
const ServicesFacade = require('../../services/ServicesFacade');
const ControllersFacade = require('../../controllers/ControllersFacade');

const MockUserModel = require('./MockUserModel');
const MockUsersController = require('./MockUsersController');
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
        this._savedModels = this._setModelsMocks(models);

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
        const savedModels = this._saveModelsMocks(models);
        models.users = new MockUserModel();
        return savedModels;
    }

    _saveModelsMocks(models) {
        const savedModels = {};
        for (let k in models) {
            if (models.hasOwnProperty(k)) {
                savedModels[k] = models[k];
            }
        }
        return savedModels;
    }

    setModelsMocks() {
        this._savedModels = this._setModelsMocks(this.server.models);
    }

    restoreModelsMocks() {
        for (let k in this._savedModels) {
            if (this._savedModels.hasOwnProperty(k)) {
                this.server.models[k] = this._savedModels[k];
            }
        }
    }

    _setControllersMocks(controllers, services) {
        controllers.sessionsController = new MockSessionsController(controllers.sessionsController);
        controllers.usersController = new MockUsersController(controllers.usersController);
        controllers.wsController = new MockWSController(services);
    }

    _setServicesMocks(services, models) {
        services.sessions = new MockSessionsService(services, models);
        // Initialization inside facade is already complete at this moment, so we need to call it by hand.
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
        async.waterfall([
            (callback) => this.applicationServer.stop((error) => callback(error)),
            (callback) => this.server.stop((error) => callback(error))
        ], callback);
    }
}

module.exports = MockHost;
