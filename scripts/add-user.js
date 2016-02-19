'use strict';

const args = require('optimist').argv;

const ModelsFacade = require('../models/ModelsFacade');
const ServicesFacade = require('../services/ServicesFacade');

const Config = require('../utils/Config');
const Logger = require('../utils/Logger');

const logger = new Logger(Config.logger);
const models = new ModelsFacade(Config, logger);
const services = new ServicesFacade(Config, logger, models);

if (args.name && args.lastName && args.speciality
    && args.email && args.defaultLanguage && args.numberPaidSamples) {
    services.user.add(args.defaultLanguage, args.name, args.lastName,
        args.email, args.speciality, args.numberPaidSamples, (error, userId) => {
            console.log('User ' + args.name + ' is added with id: ' + userId);
        });
} else {
    console.error('Usage: --name "UserFirstName" --lastName "UserLastName" --speciality "JobName" '
        + '--defaultLanguage "en" --numberPaidSamples N');
    process.exit(1);
}
