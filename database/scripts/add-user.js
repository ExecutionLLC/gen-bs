const _ = require('lodash');

const indexJs = require('../../index.js');

const {LOGIN_TYPES} = indexJs.Enums;
const ModelsFacade = indexJs.ModelsFacade;
const ServicesFacade = indexJs.ServicesFacade;

const Config = indexJs.Config;
const Logger = indexJs.Logger;
const PasswordUtils = indexJs.PasswordUtils;

const logger = new Logger(Config.logger);
const models = new ModelsFacade(Config, logger);
const services = new ServicesFacade(Config, logger, models);

const args = require('optimist')
    .options({
        'firstName': {
            demand: true,
            describe: 'User First Name'
        },
        'lastName': {
            demand: true,
            describe: 'User Last Name'
        },
        'email': {
            demand: true,
            describe: 'User e-mail'
        },
        'password': {
            describe: 'User password'
        },
        'gender': {
            demand: true,
            describe: 'User gender'
        },
        'speciality': {
            demand: true,
            describe: 'User speciality'
        },
        'numberPaidSamples': {
            demand: true,
            describe: 'User number of paid samples'
        },
        'defaultLanguage': {
            demand: true,
            describe: 'User default language'
        },
        'phone': {
            describe: 'User phone'
        },
        'loginType': {
            demand: true,
            describe: 'User login type (password|google)'
        },
        'company': {
            demand: true,
            describe: 'User company'
        }
    })
    .argv;

const {
    firstName,
    lastName,
    speciality,
    email,
    defaultLanguage,
    numberPaidSamples,
    gender,
    phone,
    loginType,
    company,
    password
} = args;

if (!_.includes(LOGIN_TYPES.allValues, loginType)) {
    console.error(`Login type must be one of ( ${LOGIN_TYPES.allValues} )`);
    process.exit(1);
}
if (loginType === LOGIN_TYPES.PASSWORD) {
    if ((typeof args.password !== 'string' && typeof args.password !== 'number') || !args.password) {
        console.error(`Password must be a string`);
        process.exit(1);
    }
}
services.users.add(
    defaultLanguage,
    {
        firstName,
        lastName,
        email,
        speciality,
        numberPaidSamples,
        gender,
        phone,
        loginType,
        password: loginType === LOGIN_TYPES.PASSWORD ? PasswordUtils.hash(`${password}`) : null,
        company
    },
    (error, user) => {
        if (error) {
            console.error(error);
            process.exit(1);
        } else {
            console.log(`User with email ${user.email} was added with id: ${user.id}`);
            process.exit(0);
        }
    }
);
