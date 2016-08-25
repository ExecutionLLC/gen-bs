'use strict';

const args = require('optimist').argv;

const ModelsFacade = require('../models/ModelsFacade');
const ServicesFacade = require('../services/ServicesFacade');

const Config = require('../utils/Config');
const Logger = require('../utils/Logger');

const logger = new Logger(Config.logger);
const models = new ModelsFacade(Config, logger);
const services = new ServicesFacade(Config, logger, models);

console.log(JSON.stringify(args));

const {
    count,
    speciality,
    description,
    defaultLanguage,
    numberPaidSamples
} = args;

if (count && speciality && description && defaultLanguage && numberPaidSamples) {
    services.registrationCodes.createMany(count, defaultLanguage,
        speciality, description, numberPaidSamples, (error, ids) => {
            if (error) {
                console.error(error);
                process.exit(1);
            } else {
                console.log(`${count} registration codes are added with ids: ${JSON.stringify(ids)}`);
                ids.map(id => {
                    console.log(`${Config.baseUrl}/api/session/auth/google/login/${id}`);
                });
                process.exit(0);
            }
        });
} else {
    console.error('Usage: -- --count N --speciality "JobName" --description "Some string to mark codes in database"'
        + ' --defaultLanguage "en" --numberPaidSamples N');
    console.error('The provided params are used as defaults for the added users.');
    console.error('Note the "--" before all params, it is required.');
    process.exit(1);
}