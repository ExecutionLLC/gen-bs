const _ = require('lodash');

const {LOGIN_TYPES} = require('../../utils/Enums');
const ModelsFacade = require('../../models/ModelsFacade');
const ServicesFacade = require('../../services/ServicesFacade');

const Config = require('../../utils/Config');
const Logger = require('../../utils/Logger');
const PasswordUtils = require('../../utils/PasswordUtils');

const logger = new Logger(Config.logger);
const models = new ModelsFacade(Config, logger);
const services = new ServicesFacade(Config, logger, models);

const args = require('optimist')
    .options('firstName', {
        default: 'Test firstName',
    })
    .options('lastName', {
        default: 'Test lastName',
    })
    .options('email', {
    })
    .options('password', {
    })
    .options('gender', {
        default: 'Test gender',
    })
    .options('speciality', {
        default: 'Test speciality',
    })
    .options('numberPaidSamples', {
        default: 11,
    })
    .options('defaultLanguage', {
        default: Config.defaultLanguId,
    })
    .options('phone', {
        default: 'Test Phone',
    })
    .options('loginType', {
    })
    .options('company', {
        default: 'Test',
    })
    .demand(['loginType', 'email'])
    .describe('firstName', 'User First Name')
    .describe('lastName', 'User Last Name')
    .describe('email', 'User e-mail')
    .describe('gender', 'User gender type')
    .describe('speciality', 'User speciality')
    .describe('numberPaidSamples', 'User number of paid samples')
    .describe('defaultLanguage', 'User default language')
    .describe('phone', 'User phone')
    .describe('company', 'User company')
    .describe('password', 'User password')
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
    process.exit(0);
}
if (loginType === LOGIN_TYPES.PASSWORD) {
    if ((typeof args.password !== 'string' && typeof args.password !== 'number') || !password) {
        console.error(`Password must be a string`);
        process.exit(0);
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
        password: PasswordUtils.hash(`${password}`),
        company
    },
    (error, user) => {
        if (error) {
            console.error(error);
            process.exit(0);
        } else {
            console.log(`User with email ${user.email} was added with id: ${user.id}`);
            process.exit(0);
        }
    }
);
