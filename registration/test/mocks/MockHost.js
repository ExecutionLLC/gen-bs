'use strict';

const Config = require('../../Config');
const Logger = require('../../utils/Logger');

const KnexWrapper = require('../../utils/KnexWrapper');

const RegistrationCodesService = require('../../services/RegistrationCodesService');
const RegistrationCodesModel = require('../../models/RegistrationCodesModel');


class MockHost {
    constructor() {
        const logger = new Logger(Config.logger);
        const dbModel = new KnexWrapper(Config, logger);
        const registrationCodesModel = new RegistrationCodesModel(dbModel, logger);
        this.registrationCodes = new RegistrationCodesService(dbModel, registrationCodesModel);
    }

    _setControllersMocks(controllers, services) {
        controllers.sessionsController = new MockSessionsController(controllers.sessionsController);
    }

    _setServicesMocks(services, models) {
        services.sessions = new MockSessionsService(services, models);
        // Initialization inside facade is already complete at this moment, so we need to call it by hand.
        services.sessions.init();
    }

    start(callback) {
        callback();
    }

    stop(callback) {
        callback()
    }
}

module.exports = MockHost;
