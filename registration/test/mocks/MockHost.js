'use strict';

const Promise = require('bluebird');
const Config = require('../../Config');
const Logger = require('../../utils/Logger');

const KnexWrapper = require('../../utils/KnexWrapper');

const RegistrationCodesService = require('../../services/RegistrationCodesService');
const RegistrationCodesModel = require('../../models/RegistrationCodesModel');
const UsersClient = require('../../api/UsersClient');


class MockHost {
    constructor() {
        const logger = new Logger(Config.logger);
        const dbModel = new KnexWrapper(Config, logger);
        const registrationCodesModel = new RegistrationCodesModel(dbModel, logger);
        const usersClient = new UsersClient(Config);
        this.registrationCodes = new RegistrationCodesService(dbModel, registrationCodesModel, usersClient);
    }

    start() {
        return Promise.resolve();
    }

    stop() {
        return Promise.resolve();
    }
}

module.exports = MockHost;
