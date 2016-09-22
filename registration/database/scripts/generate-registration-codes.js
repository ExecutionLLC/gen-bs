'use strict';

const args = require('optimist').argv;

const RegistrationCodesService = require('../../services/RegistrationCodesService');
const UsersClient = require('../../api/UsersClient');
const RegistrationCodesModel = require('../../models/RegistrationCodesModel');

const Config = require('../../Config');
const Logger = require('../../utils/Logger');

const logger = new Logger(Config.logger);
const KnexWrapper = require('../../utils/KnexWrapper');

const dbModel = new KnexWrapper(Config, logger);
const registrationCodesModel = new RegistrationCodesModel(dbModel, logger);
const usersClient = new UsersClient(Config);
const registrationCodes = new RegistrationCodesService(dbModel, registrationCodesModel, usersClient);

console.log(JSON.stringify(args));

const {
    count,
    speciality,
    description,
    defaultLanguage,
    numberPaidSamples
} = args;

if (count && speciality && description && defaultLanguage && numberPaidSamples) {
    registrationCodes.createManyAsync(count, defaultLanguage, speciality, description, numberPaidSamples)
        .then((ids) => {
            console.log(`${count} registration codes are added with ids: ${JSON.stringify(ids)}`);
            ids.map(id => {
                console.log(`${Config.usersClient.httpScheme}://${Config.usersClient.host}:${Config.usersClient.port}/api/session/auth/google/login/${id}`);
            });
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
} else {
    console.error('Usage: -- --count N --speciality "JobName" --description "Some string to mark codes in database"'
        + ' --defaultLanguage "en" --numberPaidSamples N');
    console.error('The provided params are used as defaults for the added users.');
    console.error('Note the "--" before all params, it is required.');
    process.exit(1);
}
