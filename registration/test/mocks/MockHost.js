'use strict';

const Promise = require('bluebird');
const Uuid = require('node-uuid');
const _ = require('lodash');
const Config = require('../../Config');
const Logger = require('../../utils/Logger');

const KnexWrapper = require('../../utils/KnexWrapper');

const RegistrationCodesService = require('../../services/RegistrationCodesService');
const RegistrationCodesModel = require('../../models/RegistrationCodesModel');
const UserRequestService = require('../../services/UserRequestService');
const UserRequestModel = require('../../models/UserRequestModel');


class MockUsersClient {
    constructor(config) {
        this.config = config;
        this.users = {};
    }

    addAsync(user) {
        return new Promise.resolve().then(() => {
            const userId = Uuid.v4();
            const newUser = {
                id: userId,
                name: user.firstName,
                isDeleted: false,
                lastName: user.lastName,
                email: user.userEmail,
                language: 'en',
                numberPaidSamples: user.numberOfPaidSamples,
                speciality: user.speciality
            };
            this.users[userId] = newUser;
            return JSON.parse(JSON.stringify(newUser));
        });
    }
}


class MockHost {
    constructor() {
        const logger = new Logger(Config.logger);
        const dbModel = new KnexWrapper(Config, logger);
        const registrationCodesModel = new RegistrationCodesModel(dbModel, logger);
        const userRequestModel = new UserRequestModel(dbModel, logger);
        const usersClient = new MockUsersClient(Config);
        this.usersClient = usersClient;
        this.registrationCodes = new RegistrationCodesService(dbModel, registrationCodesModel, usersClient);
        this.userRequests = new UserRequestService(dbModel, userRequestModel, usersClient);
    }

    startAsync() {
        return Promise.resolve();
    }

    stopAsync() {
        return Promise.resolve();
    }
}

module.exports = MockHost;
