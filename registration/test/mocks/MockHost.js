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

    start(callback) {
        callback();
    }

    stop(callback) {
        callback()
    }
}

module.exports = MockHost;
