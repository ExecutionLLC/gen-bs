const _ = require('lodash');

const indexJs = require('../../index.js');

const {LOGIN_TYPES} = indexJs.Enums;
const ModelsFacade = indexJs.ModelsFacade;
const ServicesFacade = indexJs.ServicesFacade;

const Config = indexJs.Config;
const Logger = indexJs.Logger;
const PasswordUtils = indexJs.PasswordUtils;

const logger = new Logger({app_name: 'genomix_add_user'});
const models = new ModelsFacade(Config, logger);
const services = new ServicesFacade(Config, logger, models);

const args = require('optimist')
    .options({
        'email': {
            demand: true,
            describe: 'User e-mail'
        }
    })
    .argv;

const {email} = args;

services.users.findIdByEmail(
    email,
    (error) => process.exit(error ? 1 : 0)
);
