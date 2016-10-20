'use strict';

const args = require('optimist').argv;

const ModelsFacade = require('../../models/ModelsFacade');
const ServicesFacade = require('../../services/ServicesFacade');

const Config = require('../../utils/Config');
const Logger = require('../../utils/Logger');
const PasswordUtils = require('../../utils/PasswordUtils');

const logger = new Logger(Config.logger);
const models = new ModelsFacade(Config, logger);
const services = new ServicesFacade(Config, logger, models);

if (
    args.firstName &&
    args.lastName &&
    args.speciality &&
    args.email &&
    args.defaultLanguage &&
    args.numberPaidSamples &&
    args.gender &&
    args.phone &&
    args.loginType &&
    args.company) {
    services.users.add(
        args.defaultLanguage,
        {
            firstName: args.firstName,
            lastName: args.lastName,
            email: args.email,
            speciality: args.speciality,
            numberPaidSamples: args.numberPaidSamples,
            gender: args.gender,
            phone: args.phone,
            loginType: args.loginType,
            password: PasswordUtils.hash('' + args.password),
            company: args.company
        },
        (error, user) => {
            if (error) {
                console.error(error);
                process.exit(1);
            } else {
                console.log('User ' + args.name + ' is added with id: ' + user.id);
                process.exit(0);
            }
        });
} else {
    console.error('Usage: -- --firstName "UserFirstName" --lastName "UserLastName" --speciality "JobName" '
        + '--defaultLanguage "en" --numberPaidSamples N --email "email@gmail.com" --gender "Male|Female" '
        + '--phone "phoneNumber" --company "companyName" --loginType "password|google" --password "password"');
    console.error('Note the "--" before all params, it is required.');
    process.exit(1);
}
