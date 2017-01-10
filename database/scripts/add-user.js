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
    .options({
        'firstName': {
            default: 'Test firstName',
            describe: 'User First Name'
        },
        'lastName': {
            default: 'Test lastName',
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
            default: 'Test gender',
            describe: 'User gender'
        },
        'speciality': {
            default: 'Test speciality',
            describe: 'User speciality'
        },
        'numberPaidSamples': {
            default: 11,
            describe: 'User number of paid samples'
        },
        'defaultLanguage': {
            default: Config.defaultLanguId,
            describe: 'User default language'
        },
        'phone': {
            default: 'Test Phone',
            describe: 'User phone'
        },
        'loginType': {
            demand: true,
            describe: 'User login type (password|google)'
        },
        'company': {
            default: 'Test',
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
